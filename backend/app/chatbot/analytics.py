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
    """Busca o histórico e gera insights inteligentes baseados nas dúvidas dos moradores."""
    db = get_supabase_admin()
    
    try:
        faq = db.table("faq_analytics") \
            .select("*") \
            .order("contagem", desc=True) \
            .limit(5) \
            .execute()
            
        total_msgs = db.table("chat_mensagens").select("id").execute()
        total = len(total_msgs.data) if total_msgs.data else 0
        
        # Calcular porcentagens por categoria
        categoria_counts = {}
        todos = db.table("faq_analytics").select("categoria, contagem").execute()
        for item in (todos.data or []):
            cat = item.get("categoria", "outro")
            categoria_counts[cat] = categoria_counts.get(cat, 0) + item.get("contagem", 1)
            
        total_perguntas = sum(categoria_counts.values()) or 1
        
        sugestoes = []
        # Gerar sugestões baseadas na categoria predominante
        if categoria_counts:
            predominante = max(categoria_counts, key=categoria_counts.get)
            pct = round(categoria_counts[predominante] / total_perguntas * 100)
            
            if predominante == "reciclagem":
                sugestoes.append(
                    f"💡 **Campanha de Reciclagem**: {pct}% das dúvidas dos moradores são sobre como reciclar embalagens. "
                    "Sugerimos instalar uma placa ilustrativa explicativa na área de coleta seletiva."
                )
            elif predominante == "calendario_coleta":
                sugestoes.append(
                    f"💡 **Painel Informativo**: {pct}% das dúvidas são sobre dias e horários de coletas. "
                    "Sugerimos fixar o calendário impresso no elevador social ou quadro de avisos."
                )
            elif predominante == "residuos_perigosos":
                sugestoes.append(
                    f"💡 **Coletor de Lâmpadas/Pilhas**: {pct}% dos moradores perguntam sobre descarte de pilhas ou lâmpadas. "
                    "Sugerimos criar uma campanha de recolhimento especial ou melhorar a sinalização do Ecoponto no térreo."
                )
            elif predominante == "volumosos":
                sugestoes.append(
                    f"💡 **Descarte de Móveis**: {pct}% das dúvidas envolvem descarte de sofás e colchões. "
                    "Que tal criar um dia mensal de mutirão de descarte ou divulgar o serviço de coleta de volumosos?"
                )
            elif predominante == "regras_e_multas":
                sugestoes.append(
                    f"💡 **Guia Prático do Regimento**: Os moradores têm dúvidas frequentes sobre penalidades. "
                    "Recomendamos enviar uma via digital simplificada das normas de descarte para todos os emails."
                )
            else:
                sugestoes.append(
                    "💡 **Dica Sustentável**: O chatbot reduziu o atendimento na portaria! Continue estimulando a reciclagem nas assembleias."
                )
        else:
            sugestoes.append("💡 **Dica Sustentável**: As interações com o assistente estão iniciando. Em breve você receberá sugestões automáticas baseadas em inteligência artificial!")
            
        return {
            "total_interacoes": total,
            "distribuicao_categorias": categoria_counts,
            "perguntas_mais_comuns": faq.data or [],
            "sugestoes_politicas": sugestoes
        }
    except Exception as e:
        return {
            "total_interacoes": 0,
            "distribuicao_categorias": {},
            "perguntas_mais_comuns": [],
            "sugestoes_politicas": ["💡 Continue incentivando os moradores a usarem o assistente virtual!"]
        }
