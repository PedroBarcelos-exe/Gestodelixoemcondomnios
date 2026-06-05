from datetime import date
from app.database import get_supabase_admin
import io


def get_relatorio_mensal(mes: int, ano: int) -> dict:
    db = get_supabase_admin()
    result = db.table("relatorios_mensais") \
        .select("*") \
        .eq("mes", mes) \
        .eq("ano", ano) \
        .single() \
        .execute()
    if result.data:
        return result.data
    # Se não existe, gerar on-the-fly a partir dos registros
    return _gerar_relatorio(mes, ano)


def _gerar_relatorio(mes: int, ano: int) -> dict:
    db = get_supabase_admin()
    primeiro_dia = f"{ano}-{mes:02d}-01"
    if mes == 12:
        ultimo_dia = f"{ano+1}-01-01"
    else:
        ultimo_dia = f"{ano}-{mes+1:02d}-01"

    registros = db.table("registros_descarte") \
        .select("tipo, peso_kg, morador_id, correto") \
        .gte("data", primeiro_dia) \
        .lt("data", ultimo_dia) \
        .execute()

    dados = registros.data or []
    organico = sum((r.get("peso_kg") or 0) for r in dados if r.get("tipo") == "organico")
    reciclavel = sum((r.get("peso_kg") or 0) for r in dados if r.get("tipo") == "reciclavel")
    rejeito = sum((r.get("peso_kg") or 0) for r in dados if r.get("tipo") == "rejeito")

    moradores_ativos = len(set(r["morador_id"] for r in dados)) if dados else 0
    total_moradores_result = db.table("profiles").select("id").eq("role", "morador").execute()
    total_moradores = len(total_moradores_result.data) if total_moradores_result.data else 1
    taxa = round(moradores_ativos / total_moradores * 100, 1)

    volumosos = db.table("agendamentos_volumosos") \
        .select("id") \
        .gte("created_at", primeiro_dia) \
        .lt("created_at", ultimo_dia) \
        .execute()

    total_kg_reciclado = reciclavel
    co2 = round(total_kg_reciclado * 0.5, 2)
    economia = round(reciclavel * 0.8 + organico * 0.3, 2)

    relatorio = {
        "mes": mes,
        "ano": ano,
        "total_organico_kg": round(organico, 2),
        "total_reciclavel_kg": round(reciclavel, 2),
        "total_rejeito_kg": round(rejeito, 2),
        "total_volumosos": len(volumosos.data) if volumosos.data else 0,
        "taxa_participacao": taxa,
        "moradores_ativos": moradores_ativos,
        "co2_evitado_kg": co2,
        "economia_reais": economia,
    }

    # Salvar no banco para cache
    try:
        db.table("relatorios_mensais").upsert(relatorio, on_conflict="mes,ano").execute()
    except Exception:
        pass

    return relatorio


def get_analytics_completo() -> dict:
    db = get_supabase_admin()
    hoje = date.today()

    # Últimos 5 meses
    meses = []
    for i in range(4, -1, -1):
        m = (hoje.month - i - 1) % 12 + 1
        a = hoje.year if (hoje.month - i) > 0 else hoje.year - 1
        meses.append({"mes": m, "ano": a, "dados": _gerar_relatorio(m, a)})

    # Moradores
    total_moradores = db.table("profiles").select("id").eq("role", "morador").execute()
    qtd_moradores = len(total_moradores.data) if total_moradores.data else 0

    return {
        "evolucao_mensal": meses,
        "total_moradores": qtd_moradores,
        "participacao_atual": meses[-1]["dados"]["taxa_participacao"] if meses else 0,
        "co2_total_kg": sum(m["dados"]["co2_evitado_kg"] for m in meses),
        "economia_total_reais": sum(m["dados"]["economia_reais"] for m in meses),
    }


def get_analytics_chatbot() -> dict:
    db = get_supabase_admin()
    faq = db.table("faq_analytics") \
        .select("*") \
        .order("contagem", desc=True) \
        .limit(10) \
        .execute()

    total_msgs = db.table("chat_mensagens").select("id").execute()
    total = len(total_msgs.data) if total_msgs.data else 0

    perguntas = faq.data or []
    sugestoes = []
    if perguntas:
        top = perguntas[0]
        pct = round(top["contagem"] / max(total, 1) * 100, 1)
        sugestoes.append(
            f"{pct}% das dúvidas são sobre '{top.get('categoria', 'reciclagem')}' – "
            f"considere adicionar uma placa informativa ou FAQ visual na área de coleta."
        )

    return {
        "total_mensagens": total,
        "perguntas_frequentes": perguntas,
        "sugestoes_melhoria": sugestoes,
    }


MESES_PT = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]


def gerar_resumo_ia(mes: int, ano: int) -> dict:
    from app.chatbot.rag_engine import _get_client
    from datetime import datetime

    dados = get_relatorio_mensal(mes, ano)
    nome_mes = MESES_PT[mes]

    prompt = f"""Você é o GreenBin Analytics, sistema de IA especializado em gestão de resíduos condominiais.

Crie um resumo executivo para o síndico referente a {nome_mes} de {ano}, com base nos dados abaixo:

- Resíduos orgânicos coletados: {dados['total_organico_kg']:.1f} kg
- Resíduos recicláveis coletados: {dados['total_reciclavel_kg']:.1f} kg
- Rejeitos gerados: {dados['total_rejeito_kg']:.1f} kg
- Volumosos agendados: {dados['total_volumosos']}
- Taxa de participação dos moradores: {dados['taxa_participacao']:.1f}%
- Moradores ativos no período: {dados['moradores_ativos']}
- CO₂ evitado estimado: {dados['co2_evitado_kg']:.1f} kg
- Economia gerada: R$ {dados['economia_reais']:.2f}

O resumo deve:
1. Iniciar com uma avaliação geral do mês (positiva ou com ressalvas)
2. Destacar os principais pontos positivos com números concretos
3. Identificar áreas que merecem atenção ou melhorias
4. Sugerir 2 ou 3 ações práticas para o próximo mês
5. Ter linguagem formal mas acessível, em português do Brasil
6. Ter no máximo 4 parágrafos curtos
7. Não usar markdown, asteriscos ou símbolos especiais — apenas texto limpo"""

    client = _get_client()
    if client:
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
            )
            resumo_texto = response.text.strip()
        except Exception as e:
            resumo_texto = _resumo_fallback(dados, nome_mes, ano)
    else:
        resumo_texto = _resumo_fallback(dados, nome_mes, ano)

    return {
        "mes": mes,
        "ano": ano,
        "nome_mes": nome_mes,
        "resumo": resumo_texto,
        "dados": dados,
        "gerado_em": datetime.now().isoformat(),
    }


def _resumo_fallback(dados: dict, nome_mes: str, ano: int) -> str:
    taxa = dados['taxa_participacao']
    nivel = "excelente" if taxa >= 85 else "satisfatória" if taxa >= 70 else "abaixo do esperado"
    return (
        f"O mês de {nome_mes} de {ano} apresentou desempenho {nivel} na gestão de resíduos do condomínio, "
        f"com taxa de participação de {taxa:.1f}% dos moradores.\n\n"
        f"Foram coletados {dados['total_organico_kg']:.1f} kg de resíduos orgânicos e "
        f"{dados['total_reciclavel_kg']:.1f} kg de recicláveis, resultando em uma economia estimada de "
        f"R$ {dados['economia_reais']:.2f} e {dados['co2_evitado_kg']:.1f} kg de CO2 evitado.\n\n"
        f"Recomenda-se continuar incentivando a separação correta de resíduos e promover campanhas de "
        f"conscientização para os moradores menos ativos."
    )


def exportar_pdf(mes: int, ano: int) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm

    dados = get_relatorio_mensal(mes, ano)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm,
                             topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    titulo_style = ParagraphStyle("titulo", parent=styles["Heading1"],
                                  textColor=colors.HexColor("#166534"), fontSize=20)
    sub_style = ParagraphStyle("sub", parent=styles["Normal"], textColor=colors.gray, fontSize=10)

    MESES_PT = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

    story = [
        Paragraph("🌿 GreenBin – Relatório Mensal", titulo_style),
        Spacer(1, 0.3*cm),
        Paragraph(f"{MESES_PT[mes]} de {ano}", sub_style),
        Spacer(1, 0.8*cm),
    ]

    tabela_dados = [
        ["Métrica", "Valor"],
        ["Orgânicos coletados", f"{dados['total_organico_kg']:.1f} kg"],
        ["Recicláveis coletados", f"{dados['total_reciclavel_kg']:.1f} kg"],
        ["Rejeitos", f"{dados['total_rejeito_kg']:.1f} kg"],
        ["Coletas volumosas", str(dados["total_volumosos"])],
        ["Taxa de participação", f"{dados['taxa_participacao']:.1f}%"],
        ["Moradores ativos", str(dados["moradores_ativos"])],
        ["CO₂ evitado", f"{dados['co2_evitado_kg']:.1f} kg"],
        ["Economia estimada", f"R$ {dados['economia_reais']:.2f}"],
    ]

    tabela = Table(tabela_dados, colWidths=[10*cm, 6*cm])
    tabela.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#166534")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 12),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f0fdf4"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#bbf7d0")),
        ("FONTSIZE", (0, 1), (-1, -1), 11),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))

    story.append(tabela)
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("Relatório gerado automaticamente pelo sistema GreenBin.", sub_style))
    doc.build(story)
    buffer.seek(0)
    return buffer.read()
