from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from app.database import get_supabase_admin
from app.auth.dependencies import create_access_token, get_current_user
from app.config import get_settings
import httpx

router = APIRouter(prefix="/auth", tags=["Autenticação"])
settings = get_settings()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str  # 'morador' | 'zelador' | 'sindico'


class RegisterRequest(BaseModel):
    nome: str
    email: EmailStr
    password: str
    role: str
    apartamento: str | None = None
    bloco: str | None = None
    telefone: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Autentica usuário via Supabase Auth e retorna JWT."""
    from app.database import get_supabase
    db_public = get_supabase()
    db_admin = get_supabase_admin()

    # Autenticar via cliente público (anon key) — não polui a sessão do admin
    try:
        auth_response = db_public.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )

    if not auth_response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )

    supabase_user_id = auth_response.user.id

    # Buscar perfil completo via admin (contorna RLS)
    profile = db_admin.table("profiles").select("*").eq("id", supabase_user_id).single().execute()
    if not profile.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil não encontrado. Contate o administrador."
        )

    user_data = profile.data
    token = create_access_token({"sub": user_data["id"], "role": user_data["role"]})

    return TokenResponse(access_token=token, user={
        "id": user_data["id"],
        "nome": user_data["nome"],
        "email": user_data["email"],
        "role": user_data["role"],
        "apartamento": user_data.get("apartamento"),
        "bloco": user_data.get("bloco"),
        "foto_url": user_data.get("foto_url"),
    })


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    """Cadastra novo usuário no sistema."""
    db = get_supabase_admin()

    if body.role not in ("morador", "zelador", "sindico"):
        raise HTTPException(status_code=400, detail="Role inválido")

    try:
        # Criar usuário no Supabase Auth
        auth_response = db.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao criar usuário: {str(e)}")

    user_id = auth_response.user.id

    # Criar perfil na tabela profiles
    try:
        db.table("profiles").insert({
            "id": user_id,
            "nome": body.nome,
            "email": body.email,
            "role": body.role,
            "apartamento": body.apartamento,
            "bloco": body.bloco,
            "telefone": body.telefone,
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao criar perfil: {str(e)}")

    return {"message": "Usuário criado com sucesso", "id": user_id}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retorna o perfil do usuário autenticado."""
    return current_user


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout (o token JWT é invalidado pelo cliente)."""
    return {"message": "Logout realizado com sucesso"}
