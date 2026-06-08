from app.database import get_supabase_admin
from datetime import datetime


def registrar_pergunta_no_analytics(pergunta: str):
    """Analisa a pergunta do morador, classifica e salva/incrementa na tabela faq_analytics."""
    db = get_supabase_admin()
    pergunta_clean = pergunta.strip().lower()
    
    # Classificação básica por palavras-chave
    categoria = "outro"
    pergunta_l = pergunta_clean.lower()
    if any(w in pergunta_l for w in ["plástico", "papel", "metal", "reciclar", "reciclagem", "isopor", "garrafa", "limpar"]):
        categoria = "reciclagem"
    elif any(w in pergunta_l for w in ["coleta", "dia", "hora", "horário", "calendário", "semana"]):
        categoria = "calendario_coleta"
    elif any(w in pergunta_l for w in ["eletrônico", "computador", "celular", "televisão", "tv", "carregador", "cabo"]):
        categoria = "eletronicos"
    elif any(w in pergunta_l for w in ["pilha", "bateria", "lâmpada", "óleo", "medicamento", "remédio", "perigoso"]):
        categoria = "residuos_perigosos"
    elif any(w in pergunta_l for w in ["móvel", "sofá", "colchão", "armário", "cama", "mesa", "volumoso", "agendar"]):
        categoria = "volumosos"
    elif any(w in pergunta_l for w in ["multa", "regra", "regimento", "advertência", "artigo", "penalidade"]):
        categoria = "regras_e_multas"

    # Verificar se uma pergunta similar já foi feita
    # Para simplificar na demo, agrupamos por categoria e pegamos as palavras mais comuns, 
    # ou tentamos correspondência exata de frase curta.
    try:
        # Procurar correspondência exata para a categoria/pergunta
        existing = db.table("faq_analytics") \
            .select("*") \
            .eq("pergunta", pergunta[:100]) \
            .execute()
            
        if existing.data:
            row = existing.data[0]
            db.table("faq_analytics").update({
                "contagem": row["contagem"] + 1,
                "ultima_vez": datetime.utcnow().isoformat()
            }).eq("id", row["id"]).execute()
        else:
            db.table("faq_analytics").insert({
                "pergunta": pergunta[:100],
                "categoria": categoria,
                "contagem": 1,
                "primeira_vez": datetime.utcnow().isoformat(),
                "ultima_vez": datetime.utcnow().isoformat()
            }).execute()
    except Exception as e:
        # Silencioso para não travar a conversa se der erro no log
        print(f"Erro ao registrar no faq_analytics: {e}")


def obter_insights_sindico() -> dict:
    """Busca o histórico e gera insights inteligentes com IA baseados nas dúvidas dos moradores."""
    from app.chatbot.rag_engine import _get_client
    db = get_supabase_admin()

    try:
        faq = db.table("faq_analytics") \
            .select("*") \
            .order("contagem", desc=True) \
            .limit(5) \
            .execute()

        total_msgs = db.table("chat_mensagens").select("id").execute()
        total = len(total_msgs.data) if total_msgs.data else 0

        categoria_counts = {}
        todos = db.table("faq_analytics").select("categoria, contagem").execute()
        for item in (todos.data or []):
            cat = item.get("categoria", "outro")
            categoria_counts[cat] = categoria_counts.get(cat, 0) + item.get("contagem", 1)

        total_perguntas = sum(categoria_counts.values()) or 1
        perguntas = faq.data or []
        sugestoes = _gerar_sugestoes_politicas_ia(perguntas, categoria_counts, total_perguntas, _get_client())

        return {
            "total_interacoes": total,
            "distribuicao_categorias": categoria_counts,
            "perguntas_mais_comuns": perguntas,
            "sugestoes_politicas": sugestoes
        }
    except Exception as e:
        print(f"Erro ao gerar insights: {e}")
        return {
            "total_interacoes": 0,
            "distribuicao_categorias": {},
            "perguntas_mais_comuns": [],
            "sugestoes_politicas": ["Continue incentivando os moradores a usarem o assistente virtual!"]
        }


def _gerar_sugestoes_politicas_ia(perguntas: list, categoria_counts: dict, total_perguntas: int, client) -> list[str]:
    if categoria_counts and client:
        dist_texto = "\n".join(
            f"- {cat}: {cnt} ocorrências ({round(cnt/total_perguntas*100)}%)"
            for cat, cnt in sorted(categoria_counts.items(), key=lambda x: x[1], reverse=True)
        )
        top_perguntas = "\n".join(
            f"- \"{p['pergunta']}\" ({p['contagem']}x)"
            for p in perguntas[:5]
        ) if perguntas else "Nenhuma pergunta registrada ainda."

        prompt = f"""Você é GreenBin Analytics, especialista em gestão condominial de resíduos.

Analise os dados de dúvidas dos moradores no chatbot do condomínio:

Distribuição por categoria:
{dist_texto}

Perguntas mais feitas:
{top_perguntas}

Com base nesses dados reais, gere 3 recomendações de política condomínial para o síndico.
Cada recomendação deve:
- Ser direta ao ponto e acionável
- Citar os dados que a justificam
- Sugerir uma ação concreta (ex: comunicado, placa, evento, campanha)

Escreva em português do Brasil. Sem markdown ou asteriscos. Uma recomendação por linha."""

        try:
            response = client.models.generate_content(model="gemini-2.5-flash-lite", contents=prompt)
            linhas = [l.strip() for l in response.text.strip().splitlines() if l.strip()]
            return linhas if linhas else _sugestoes_fallback(categoria_counts, total_perguntas)
        except Exception as e:
            print(f"Erro ao gerar sugestões com IA: {e}")

    return _sugestoes_fallback(categoria_counts, total_perguntas)


def _sugestoes_fallback(categoria_counts: dict, total_perguntas: int) -> list[str]:
    if not categoria_counts:
        return ["As interações com o assistente estão iniciando. Em breve você receberá sugestões automáticas baseadas em inteligência artificial!"]

    predominante = max(categoria_counts, key=categoria_counts.get)
    pct = round(categoria_counts[predominante] / total_perguntas * 100)
    templates = {
        "reciclagem": f"{pct}% das dúvidas são sobre reciclagem — instale uma placa ilustrativa na área de coleta seletiva.",
        "calendario_coleta": f"{pct}% das dúvidas são sobre dias de coleta — fixe o calendário impresso no elevador e quadro de avisos.",
        "residuos_perigosos": f"{pct}% das dúvidas são sobre resíduos perigosos — melhore a sinalização do Ecoponto no térreo.",
        "volumosos": f"{pct}% das dúvidas são sobre volumosos — divulgue o serviço de agendamento de coleta no app.",
        "regras_e_multas": f"{pct}% das dúvidas são sobre regras — envie um guia simplificado de normas por e-mail a todos os moradores.",
    }
    return [templates.get(predominante, "O chatbot está reduzindo atendimentos na portaria! Continue incentivando o uso nas assembleias.")]
