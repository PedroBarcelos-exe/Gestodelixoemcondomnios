from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.database import get_supabase_admin
from app.chatbot import rag_engine, analytics

router = APIRouter(prefix="/chatbot", tags=["Chatbot IA com RAG"])


class MessageRequest(BaseModel):
    message: str
    sessao_id: str = "default_session"


class MessageResponse(BaseModel):
    response: str
    suggested_reminder: bool = False
    reminder_details: dict | None = None


@router.post("/message", response_model=MessageResponse)
async def enviar_mensagem(
    body: MessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Envia pergunta ao assistente virtual RAG e recebe resposta inteligente em linguagem natural."""
    pergunta = body.message
    user_id = current_user["id"]
    nome_morador = current_user["nome"]

    # 1. Buscar contexto relevante no RAG (pgvector ou busca textual)
    contexto = rag_engine.buscar_contexto(pergunta)

    # 2. Gerar a resposta utilizando LLM (Gemini Pro / Fallback)
    resposta = rag_engine.gerar_resposta_ia(pergunta, contexto, nome_morador)

    # 3. Registrar a pergunta no analytics para aprendizado de máquina e sugestões ao síndico
    analytics.registrar_pergunta_no_analytics(pergunta)

    # 4. Salvar histórico de mensagens no banco de dados
    db = get_supabase_admin()
    try:
        # Mensagem do usuário
        db.table("chat_mensagens").insert({
            "morador_id": user_id,
            "sessao_id": body.sessao_id,
            "role": "user",
            "conteudo": pergunta
        }).execute()

        # Resposta do assistente
        db.table("chat_mensagens").insert({
            "morador_id": user_id,
            "sessao_id": body.sessao_id,
            "role": "assistant",
            "conteudo": resposta
        }).execute()
    except Exception as e:
        print(f"Erro ao salvar mensagens no banco: {e}")

    # 5. Detectar intenção de lembrete (proatividade inteligente)
    suggest_reminder = False
    reminder_details = None
    pergunta_l = pergunta.lower()
    
    if any(w in pergunta_l for w in ["agendar", "quero agendar", "solicitar coleta", "agendar coleta", "marcar coleta"]):
        suggest_reminder = True
        reminder_details = {
            "tipo": "volumoso",
            "mensagem": "Vou abrir o formulário de agendamento para você!",
            "action": "create_agendamento"
        }
    elif any(w in pergunta_l for w in ["volumoso", "sofá", "colchão", "cama", "geladeira", "mesa", "armário", "fogão", "lavadora"]):
        suggest_reminder = True
        reminder_details = {
            "tipo": "volumoso",
            "mensagem": "Identifiquei que você quer descartar um item volumoso. Posso abrir o formulário de agendamento agora!",
            "action": "create_agendamento"
        }
    elif "vidro" in pergunta_l:
        suggest_reminder = True
        reminder_details = {
            "tipo": "vidro",
            "mensagem": "Gostaria de criar um lembrete para a coleta quinzenal de vidros nas sextas-feiras?",
            "action": "add_calendar_reminder"
        }
    elif "óleo" in pergunta_l:
        suggest_reminder = True
        reminder_details = {
            "tipo": "oleo",
            "mensagem": "Lembre-se de colocar o óleo de cozinha em garrafa PET bem fechada e levar ao ecoponto. Gostaria de ver onde fica?",
            "action": "show_ecoponto_location"
        }

    return MessageResponse(
        response=resposta,
        suggested_reminder=suggest_reminder,
        reminder_details=reminder_details
    )


@router.get("/historico")
async def listar_historico(
    sessao_id: str = "default_session",
    current_user: dict = Depends(get_current_user)
):
    """Retorna o histórico de conversas do morador autenticado naquela sessão."""
    db = get_supabase_admin()
    result = db.table("chat_mensagens") \
        .select("*") \
        .eq("morador_id", current_user["id"]) \
        .eq("sessao_id", sessao_id) \
        .order("created_at") \
        .execute()
    return result.data or []


@router.get("/insights")
async def obter_insights(current_user: dict = Depends(get_current_user)):
    """Retorna a análise de dúvidas frequentes e insights para a gestão condominial (Síndico)."""
    if current_user["role"] != "sindico":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o síndico tem acesso aos relatórios analíticos de IA."
        )
    return analytics.obter_insights_sindico()
