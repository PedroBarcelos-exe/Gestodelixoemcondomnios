from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.auth.router import router as auth_router
from app.moradores.router import router as moradores_router
from app.zelador.router import router as zelador_router
from app.sindico.router import router as sindico_router
from app.coletas.router import router as coletas_router
from app.chatbot.router import router as chatbot_router
from app.chatbot.rag_engine import sync_document_embeddings
import logging

# Configuração de Logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("greenbin")

settings = get_settings()

app = FastAPI(
    title="GreenBin API - Gestão de Resíduos Inteligente",
    description="Backend FastAPI integrado com Supabase e RAG IA (Gemini) para condomínios sustentáveis.",
    version="1.0.0"
)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de Rotas
app.include_router(auth_router)
app.include_router(moradores_router)
app.include_router(zelador_router)
app.include_router(sindico_router)
app.include_router(coletas_router)
app.include_router(chatbot_router)


@app.on_event("startup")
async def startup_event():
    """Executado ao iniciar a API. Sincroniza a base de conhecimento de IA."""
    logger.info("Iniciando GreenBin API e sincronizando embeddings RAG...")
    try:
        sync_document_embeddings()
        logger.info("Embeddings RAG sincronizados com sucesso!")
    except Exception as e:
        logger.error(f"Erro ao sincronizar embeddings no startup: {e}")
        logger.info("O backend continuará rodando com modo RAG textual/degradação suave.")


@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "GreenBin API",
        "versao": "1.0.0",
        "documentacao": "/docs"
    }
