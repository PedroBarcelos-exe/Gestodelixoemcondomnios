import numpy as np
import google.generativeai as genai
from app.config import get_settings
from app.database import get_supabase_admin
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

# Tenta inicializar o Gemini
gemini_available = False
if settings.google_api_key and settings.google_api_key != "sua_google_api_key_aqui":
    try:
        genai.configure(api_key=settings.google_api_key)
        gemini_available = True
        logger.info("Gemini AI configurado com sucesso.")
    except Exception as e:
        logger.error(f"Erro ao configurar Gemini: {e}")

# Inicializa SentenceTransformer local para fallback ou uso principal
local_model = None
try:
    # Usando modelo leve e multilingue excelente para português
    local_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    logger.info("Modelo SentenceTransformer local carregado com sucesso.")
except Exception as e:
    logger.error(f"Erro ao carregar SentenceTransformer local: {e}")


def get_embedding(text: str) -> list[float]:
    """Gera embedding de 768 dimensões para RAG. Tenta Gemini, cai para SentenceTransformer."""
    # 1. Tentar Gemini (se disponível)
    if gemini_available:
        try:
            # text-embedding-004 gera 768 dimensões por padrão
            response = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_query"
            )
            embedding = response.get("embedding", [])
            if len(embedding) == 768:
                return embedding
        except Exception as e:
            logger.warning(f"Erro ao usar Gemini para embedding, usando local fallback: {e}")

    # 2. Tentar SentenceTransformer Local
    if local_model is not None:
        try:
            emb = local_model.encode(text).tolist()
            # Se a dimensão do local for 384, vamos duplicar ou ajustar para 768
            # paraphrase-multilingual-MiniLM-L12-v2 tem dimensão 384.
            # Vamos estender para 768 preenchendo com zeros ou repetindo para bater com a coluna vector(768)
            if len(emb) == 384:
                return emb + emb  # 384 + 384 = 768 dimensões
            elif len(emb) < 768:
                return emb + [0.0] * (768 - len(emb))
            return emb[:768]
        except Exception as e:
            logger.error(f"Erro ao gerar embedding local: {e}")

    # 3. Fallback absoluto (se tudo falhar, gera vetor aleatório para não travar o app)
    logger.warning("Usando embedding fictício (fallback absoluto).")
    np.random.seed(hash(text) % (2**32))
    return np.random.uniform(-0.1, 0.1, 768).tolist()


def sync_document_embeddings():
    """Varre knowledge_documents e gera embeddings para knowledge_embeddings se não existirem."""
    db = get_supabase_admin()
    
    # 1. Garantir dados iniciais (seed)
    from app.chatbot.knowledge_base import seed_knowledge_base
    seed_knowledge_base(db)
    
    # 2. Buscar todos os documentos
    docs = db.table("knowledge_documents").select("*").eq("ativo", True).execute()
    if not docs.data:
        return
        
    for doc in docs.data:
        doc_id = doc["id"]
        conteudo = doc["conteudo"]
        
        # Verificar se já possui embeddings gerados
        existing = db.table("knowledge_embeddings").select("id").eq("document_id", doc_id).limit(1).execute()
        if existing.data:
            continue
            
        # Simples chunking (neste caso, cada documento cabe em um chunk pois são pequenos)
        # Em casos reais, faríamos split por tamanho ou parágrafos
        chunks = [conteudo]
        
        for idx, chunk in enumerate(chunks):
            embedding = get_embedding(chunk)
            db.table("knowledge_embeddings").insert({
                "document_id": doc_id,
                "chunk_text": chunk,
                "chunk_index": idx,
                "embedding": embedding
            }).execute()
            
    logger.info("Embeddings da base de conhecimento sincronizados com sucesso.")


def buscar_contexto(query: str, match_count: int = 3) -> str:
    """Busca trechos relevantes na base de conhecimento usando pgvector."""
    db = get_supabase_admin()
    
    # Sincronizar antes de buscar para garantir que há dados
    try:
        sync_document_embeddings()
    except Exception as e:
        logger.error(f"Erro ao sincronizar embeddings durante busca: {e}")

    query_emb = get_embedding(query)
    
    try:
        # Chama a função SQL criada na migração
        result = db.rpc("match_knowledge", {
            "query_embedding": query_emb,
            "match_threshold": 0.3, # Limiar baixo para garantir resultados em demo
            "match_count": match_count
        }).execute()
        
        if result.data:
            context_parts = []
            for row in result.data:
                context_parts.append(f"--- Documento relevante: ---\n{row['chunk_text']}")
            return "\n\n".join(context_parts)
    except Exception as e:
        logger.error(f"Erro ao realizar busca vetorial no Supabase: {e}")
        
    # Fallback de busca textual (se pgvector falhar ou não estiver ativo)
    try:
        docs = db.table("knowledge_documents").select("conteudo").eq("ativo", True).execute()
        if docs.data:
            # Simples busca por palavra-chave como fallback
            palavras = query.lower().split()
            relevantes = []
            for d in docs.data:
                score = sum(1 for p in palavras if p in d["conteudo"].lower())
                if score > 0:
                    relevantes.append((score, d["conteudo"]))
            relevantes.sort(reverse=True)
            return "\n\n".join([f"--- Relevante: ---\n{c}" for _, c in relevantes[:match_count]])
    except Exception as ex:
        logger.error(f"Erro no fallback de busca textual: {ex}")
        
    return "Nenhuma regra específica encontrada no regimento do condomínio."


def gerar_resposta_ia(pergunta: str, contexto: str, nome_morador: str = "Morador") -> str:
    """Usa Gemini Pro (ou resposta inteligente local) para responder com base no contexto."""
    prompt = f"""
Você é o GreenBin Helper, o assistente virtual inteligente especialista em descarte de resíduos e regras do Condomínio Ecológico GreenBin.
Responda à dúvida do morador chamado {nome_morador}.

Baseie-se ESTRITAMENTE nos documentos e regras do condomínio abaixo para responder. Se a resposta não estiver no contexto, use o conhecimento geral sobre sustentabilidade e descarte consciente, mas deixe claro o que é regra interna do condomínio e o que é boa prática geral.

Responda sempre com tom simpático, prestativo e focado em educação ambiental. Se aplicável, sugira ou pergunte se o morador quer marcar um lembrete (ex: agendar uma coleta de volumoso ou lembrete de coleta de vidro).

Contexto de Regras do Condomínio:
{contexto}

Pergunta do morador: "{pergunta}"
Resposta do GreenBin Helper (em português do Brasil):
"""

    if gemini_available:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Erro ao gerar resposta com Gemini: {e}")

    # Fallback Inteligente baseado em regras
    # Se o Gemini não estiver configurado, criamos respostas customizadas de alto nível usando o contexto
    pergunta_l = pergunta.lower()
    if "isopor" in pergunta_l:
        return f"Olá {nome_morador}! Sim, o isopor é 100% reciclável! De acordo com as nossas regras, você deve descartá-lo limpo e sem resíduos de gordura no contêiner azul de Recicláveis no subsolo. Se estiver sujo de comida (como caixa de pizza engordurada), descarte-o no lixo de rejeitos comuns para não contaminar os outros materiais. Quer que eu te lembre das regras de outros materiais?"
    elif "vidro" in pergunta_l:
        return f"Olá {nome_morador}! O descarte de vidro deve ser feito no Ecoponto de Vidro do térreo, perto da garagem B. A coleta de vidro é quinzenal, nas sextas às 09:00. Lembre-se de embalar vidros quebrados em jornal ou garrafa PET para a segurança dos nossos zeladores. Deseja que eu crie um lembrete para a próxima sexta de coleta?"
    elif "eletrônico" in pergunta_l or "pilha" in pergunta_l or "bateria" in pergunta_l:
        return f"Oi {nome_morador}! Pilhas, baterias e pequenos eletrônicos (cabos, celulares velhos) devem ser deixados no Coletor Ecológico do hall principal, ao lado da portaria. Para eletrônicos grandes como TVs e computadores, você deve solicitar um 'Agendamento de Coleta Volumosa' na aba Agendar do aplicativo. Quer que eu te ajude a ir para a aba de agendamento?"
    elif "lâmpada" in pergunta_l:
        return f"Olá {nome_morador}! O descarte de lâmpadas deve ser feito no ecoponto do térreo, ao lado da zeladoria, nunca no lixo comum por conta do mercúrio. Gostaria de receber um alerta sobre o descarte correto de outros materiais perigosos?"
    
    # Fallback genérico baseado no contexto encontrado
    resumo_contexto = contexto.replace("--- Documento relevante: ---", "").strip()[:500]
    return f"Olá {nome_morador}! Com base nas regras do condomínio: {resumo_contexto}... Espero ter ajudado! Se precisar de mais informações sobre coleta seletiva ou descarte, estou aqui!"
