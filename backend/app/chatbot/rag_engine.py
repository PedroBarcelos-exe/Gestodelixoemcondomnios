import numpy as np
from google import genai
from google.genai import types
from app.config import get_settings
from app.database import get_supabase_admin
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

_client: genai.Client | None = None

def _get_client() -> genai.Client | None:
    global _client
    if _client is not None:
        return _client
    if settings.google_api_key and settings.google_api_key != "sua_google_api_key_aqui":
        try:
            _client = genai.Client(api_key=settings.google_api_key)
            logger.info("Gemini AI configurado com sucesso.")
            return _client
        except Exception as e:
            logger.error(f"Erro ao configurar Gemini: {e}")
    return None


def get_embedding(text: str) -> list[float]:
    """Gera embedding de 768 dimensões para RAG via Gemini text-embedding-004."""
    client = _get_client()
    if client:
        try:
            response = client.models.embed_content(
                model="gemini-embedding-001",
                contents=text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY", output_dimensionality=768),
            )
            embedding = response.embeddings[0].values
            if len(embedding) == 768:
                return list(embedding)
        except Exception as e:
            logger.warning(f"Erro ao usar Gemini para embedding, usando fallback: {e}")

    # Fallback: embedding aleatório determinístico baseado no texto
    logger.warning("Usando embedding fictício (fallback absoluto).")
    np.random.seed(hash(text) % (2**32))
    return np.random.uniform(-0.1, 0.1, 768).tolist()


def sync_document_embeddings():
    """Varre knowledge_documents e gera embeddings para knowledge_embeddings se não existirem."""
    db = get_supabase_admin()

    from app.chatbot.knowledge_base import seed_knowledge_base
    seed_knowledge_base(db)

    docs = db.table("knowledge_documents").select("*").eq("ativo", True).execute()
    if not docs.data:
        return

    for doc in docs.data:
        doc_id = doc["id"]
        conteudo = doc["conteudo"]

        existing = db.table("knowledge_embeddings").select("id").eq("document_id", doc_id).limit(1).execute()
        if existing.data:
            continue

        embedding = get_embedding(conteudo)
        db.table("knowledge_embeddings").insert({
            "document_id": doc_id,
            "chunk_text": conteudo,
            "chunk_index": 0,
            "embedding": embedding,
        }).execute()

    logger.info("Embeddings da base de conhecimento sincronizados com sucesso.")


def buscar_contexto(query: str, match_count: int = 3) -> str:
    """Busca trechos relevantes na base de conhecimento usando pgvector."""
    db = get_supabase_admin()

    try:
        sync_document_embeddings()
    except Exception as e:
        logger.error(f"Erro ao sincronizar embeddings durante busca: {e}")

    query_emb = get_embedding(query)

    try:
        result = db.rpc("match_knowledge", {
            "query_embedding": query_emb,
            "match_threshold": 0.3,
            "match_count": match_count,
        }).execute()

        if result.data:
            parts = [f"--- Documento relevante: ---\n{row['chunk_text']}" for row in result.data]
            return "\n\n".join(parts)
    except Exception as e:
        logger.error(f"Erro ao realizar busca vetorial no Supabase: {e}")

    # Fallback: busca textual por palavras-chave
    try:
        docs = db.table("knowledge_documents").select("conteudo").eq("ativo", True).execute()
        if docs.data:
            palavras = query.lower().split()
            relevantes = sorted(
                [(sum(1 for p in palavras if p in d["conteudo"].lower()), d["conteudo"]) for d in docs.data],
                reverse=True,
            )
            relevantes = [(s, c) for s, c in relevantes if s > 0]
            if relevantes:
                return "\n\n".join([f"--- Relevante: ---\n{c}" for _, c in relevantes[:match_count]])
    except Exception as ex:
        logger.error(f"Erro no fallback de busca textual: {ex}")

    return "Nenhuma regra específica encontrada no regimento do condomínio."


def gerar_resposta_ia(pergunta: str, contexto: str, nome_morador: str = "Morador") -> str:
    """Usa Gemini (ou fallback por regras) para responder com base no contexto RAG."""
    prompt = f"""
Você é o GreenBin Helper, o assistente virtual inteligente especialista em descarte de resíduos e regras do Condomínio Ecológico GreenBin.
Responda à dúvida do morador chamado {nome_morador}.

Baseie-se ESTRITAMENTE nos documentos e regras do condomínio abaixo. Se a resposta não estiver no contexto, use o conhecimento geral sobre sustentabilidade, mas deixe claro o que é regra interna e o que é boa prática geral.

Responda com tom simpático, prestativo e focado em educação ambiental. Se aplicável, sugira agendar uma coleta ou criar um lembrete.

Contexto de Regras do Condomínio:
{contexto}

Pergunta do morador: "{pergunta}"
Resposta do GreenBin Helper (em português do Brasil):
"""

    client = _get_client()
    if client:
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Erro ao gerar resposta com Gemini: {e}")

    # Fallback por palavras-chave
    pergunta_l = pergunta.lower()
    if "isopor" in pergunta_l:
        return f"Olá {nome_morador}! O isopor é reciclável — descarte limpo no contêiner azul no subsolo. Se estiver sujo de gordura, vai no lixo comum para não contaminar os outros materiais."
    if "vidro" in pergunta_l:
        return f"Olá {nome_morador}! Descarte vidro no Ecoponto do térreo, perto da garagem B. Coleta quinzenal às sextas, 09h. Embale vidros quebrados em jornal para segurança dos zeladores."
    if any(w in pergunta_l for w in ["eletrônico", "pilha", "bateria"]):
        return f"Oi {nome_morador}! Pilhas, baterias e pequenos eletrônicos vão no Coletor Ecológico do hall principal. Para itens grandes (TV, computador), use o Agendamento de Coleta Volumosa no app."
    if "lâmpada" in pergunta_l:
        return f"Olá {nome_morador}! Lâmpadas vão no ecoponto do térreo, nunca no lixo comum por causa do mercúrio."

    resumo = contexto.replace("--- Documento relevante: ---", "").replace("--- Relevante: ---", "").strip()[:500]
    return f"Olá {nome_morador}! Com base nas regras do condomínio: {resumo}... Se precisar de mais informações sobre coleta ou descarte, estou aqui!"
