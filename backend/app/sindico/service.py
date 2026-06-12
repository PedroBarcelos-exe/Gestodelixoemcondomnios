from datetime import date
from app.database import get_supabase_admin
import io


def gerar_relatorio_diario() -> dict:
    from app.chatbot.rag_engine import _get_client
    from datetime import datetime, date, timedelta

    db = get_supabase_admin()
    hoje = date.today()
    hoje_str = hoje.isoformat()
    amanha_str = (hoje + timedelta(days=1)).isoformat()
    dias_semana = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"]
    dia_semana = dias_semana[hoje.weekday()]
    nome_dia = hoje.strftime("%d/%m/%Y")

    agendamentos_novos = db.table("agendamentos_volumosos") \
        .select("tipo_item, descricao, status") \
        .gte("created_at", f"{hoje_str}T00:00:00") \
        .lt("created_at", f"{amanha_str}T00:00:00") \
        .execute()

    agendamentos_atualizados = db.table("agendamentos_volumosos") \
        .select("tipo_item, status") \
        .gte("updated_at", f"{hoje_str}T00:00:00") \
        .lt("updated_at", f"{amanha_str}T00:00:00") \
        .neq("status", "pendente") \
        .execute()

    tarefas = db.table("tarefas_zelador") \
        .select("descricao, categoria, concluida, prioridade") \
        .eq("data", hoje_str) \
        .execute()

    perguntas_hoje = db.table("chat_mensagens") \
        .select("conteudo") \
        .gte("created_at", f"{hoje_str}T00:00:00") \
        .lt("created_at", f"{amanha_str}T00:00:00") \
        .eq("role", "user") \
        .execute()

    novos = agendamentos_novos.data or []
    atualizados = agendamentos_atualizados.data or []
    lista_tarefas = tarefas.data or []
    perguntas = perguntas_hoje.data or []
    tarefas_concluidas = [t for t in lista_tarefas if t.get("concluida")]

    secoes = _gerar_secoes_relatorio_diario(
        nome_dia, dia_semana, novos, atualizados, lista_tarefas, tarefas_concluidas, perguntas,
        _get_client()
    )

    return {
        "data": hoje_str,
        "nome_dia": nome_dia,
        "dia_semana": dia_semana,
        "secoes": secoes,
        "totais": {
            "agendamentos_novos": len(novos),
            "agendamentos_atualizados": len(atualizados),
            "tarefas_total": len(lista_tarefas),
            "tarefas_concluidas": len(tarefas_concluidas),
            "interacoes_chatbot": len(perguntas),
        },
        "gerado_em": datetime.now().isoformat(),
    }


def _gerar_secoes_relatorio_diario(
    nome_dia, dia_semana, novos, atualizados, tarefas, tarefas_concluidas, perguntas, client
) -> list[dict]:
    MARCADORES = ["---AGENDAMENTOS---", "---TAREFAS---", "---CHATBOT---"]
    TITULOS = ["Agendamentos de Coleta", "Tarefas do Zelador", "Dúvidas no Chatbot"]

    if client:
        def fmt_agendamentos():
            linhas = [f"- {a['tipo_item']} ({a['status']})" for a in novos[:6]]
            atualizados_txt = [f"- {a['tipo_item']} → {a['status']}" for a in atualizados[:4]]
            return "\n".join(linhas) if linhas else "Nenhum novo agendamento hoje." + (
                "\nAtualizados: " + "; ".join([a['tipo_item'] for a in atualizados[:3]]) if atualizados else ""
            )

        def fmt_tarefas():
            if not tarefas:
                return "Nenhuma tarefa registrada para hoje."
            concluidas = [t.get("descricao", "?") for t in tarefas_concluidas]
            pendentes = [t.get("descricao", "?") for t in tarefas if not t.get("concluida")]
            return f"Concluídas ({len(tarefas_concluidas)}): {', '.join(concluidas[:4]) or 'nenhuma'}. Pendentes ({len(pendentes)}): {', '.join(pendentes[:4]) or 'nenhuma'}."

        def fmt_perguntas():
            if not perguntas:
                return "Nenhuma interação no chatbot hoje."
            textos = [p["conteudo"][:60] for p in perguntas[:6]]
            return "\n".join(f"- {t}" for t in textos)

        prompt = f"""Você é GreenBin Analytics. Gere o relatório diário para o síndico referente a {dia_semana}, {nome_dia}.

Organize em EXATAMENTE 3 seções, usando os marcadores abaixo na sequência:

{MARCADORES[0]}
[análise dos agendamentos]
{MARCADORES[1]}
[análise das tarefas]
{MARCADORES[2]}
[análise das dúvidas do chatbot]

Dados do dia:
AGENDAMENTOS NOVOS ({len(novos)}):
{fmt_agendamentos()}
ATUALIZAÇÕES DE STATUS ({len(atualizados)}):
{chr(10).join(f"- {a['tipo_item']} → {a['status']}" for a in atualizados[:4]) or 'Nenhuma.'}
TAREFAS:
{fmt_tarefas()}
PERGUNTAS NO CHATBOT ({len(perguntas)}):
{fmt_perguntas()}

Regras: texto direto, máximo 4 frases por seção, tom profissional em português do Brasil. Sem markdown, sem asteriscos. Se não houver dados de uma seção, informe que não houve atividade."""

        try:
            response = client.models.generate_content(model="gemini-2.5-flash-lite", contents=prompt)
            texto = response.text.strip()
            partes = {}
            atual = None
            buffer = []
            for linha in texto.splitlines():
                if linha.strip() in MARCADORES:
                    if atual is not None:
                        partes[atual] = "\n".join(buffer).strip()
                    atual = linha.strip()
                    buffer = []
                else:
                    buffer.append(linha)
            if atual is not None:
                partes[atual] = "\n".join(buffer).strip()

            secoes = []
            for marcador, titulo in zip(MARCADORES, TITULOS):
                secoes.append({"titulo": titulo, "conteudo": partes.get(marcador, _fallback_secao(titulo, novos, tarefas, tarefas_concluidas, perguntas))})
            return secoes
        except Exception as e:
            print(f"Erro ao gerar relatório diário com IA: {e}")

    return [
        {"titulo": TITULOS[0], "conteudo": _fallback_secao(TITULOS[0], novos, tarefas, tarefas_concluidas, perguntas)},
        {"titulo": TITULOS[1], "conteudo": _fallback_secao(TITULOS[1], novos, tarefas, tarefas_concluidas, perguntas)},
        {"titulo": TITULOS[2], "conteudo": _fallback_secao(TITULOS[2], novos, tarefas, tarefas_concluidas, perguntas)},
    ]


def _fallback_secao(titulo, novos, tarefas, tarefas_concluidas, perguntas) -> str:
    if "Agendamento" in titulo:
        return f"{len(novos)} novo(s) agendamento(s) registrado(s) hoje." if novos else "Nenhum agendamento registrado hoje."
    if "Tarefa" in titulo:
        return f"{len(tarefas_concluidas)} de {len(tarefas)} tarefa(s) concluída(s) hoje." if tarefas else "Nenhuma tarefa registrada para hoje."
    return f"{len(perguntas)} interação(ões) no chatbot hoje." if perguntas else "Nenhuma interação no chatbot hoje."


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

    descartes_corretos = sum(1 for r in dados if r.get("correto"))

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
        "descartes_corretos": descartes_corretos,
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
    from app.chatbot.rag_engine import _get_client

    db = get_supabase_admin()
    faq = db.table("faq_analytics") \
        .select("*") \
        .order("contagem", desc=True) \
        .limit(10) \
        .execute()

    total_msgs = db.table("chat_mensagens").select("id").execute()
    total = len(total_msgs.data) if total_msgs.data else 0
    perguntas = faq.data or []

    sugestoes = _gerar_sugestoes_chatbot_ia(perguntas, total, _get_client())

    return {
        "total_mensagens": total,
        "perguntas_frequentes": perguntas,
        "sugestoes_melhoria": sugestoes,
    }


def _gerar_sugestoes_chatbot_ia(perguntas: list, total: int, client) -> list[str]:
    if perguntas and client:
        linhas = "\n".join(
            f"- \"{p['pergunta']}\" ({p['contagem']}x, categoria: {p['categoria']})"
            for p in perguntas[:8]
        )
        prompt = f"""Você é GreenBin Analytics, especialista em gestão de resíduos condominiais.

Com base nas dúvidas mais frequentes dos moradores no chatbot ({total} mensagens no total):
{linhas}

Gere exatamente 3 sugestões práticas e específicas para o síndico reduzir essas dúvidas e melhorar a gestão de resíduos.
Cada sugestão deve ser direta e acionável (ex: instalar placa, criar campanha, enviar comunicado).
Escreva em português do Brasil. Sem markdown, sem asteriscos. Formato: uma sugestão por linha, iniciando com "Sugestão X: "."""

        try:
            response = client.models.generate_content(model="gemini-2.5-flash-lite", contents=prompt)
            linhas_resp = [l.strip() for l in response.text.strip().splitlines() if l.strip()]
            return [l for l in linhas_resp if l]
        except Exception:
            pass

    # Fallback por template
    if not perguntas:
        return ["Continue incentivando os moradores a usarem o assistente — em breve haverá dados suficientes para sugestões personalizadas."]
    top = perguntas[0]
    pct = round(top["contagem"] / max(total, 1) * 100, 1)
    return [f"Sugestão 1: {pct}% das dúvidas são sobre '{top.get('categoria', 'reciclagem')}' — considere adicionar uma placa informativa na área de coleta seletiva."]


MESES_PT = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]


def get_top_moradores(mes: int, ano: int) -> list:
    from collections import Counter
    db = get_supabase_admin()
    primeiro_dia = f"{ano}-{mes:02d}-01"
    ultimo_dia = f"{ano+1}-01-01" if mes == 12 else f"{ano}-{mes+1:02d}-01"

    registros = db.table("registros_descarte") \
        .select("morador_id, correto") \
        .gte("data", primeiro_dia) \
        .lt("data", ultimo_dia) \
        .execute()

    dados = registros.data or []
    if not dados:
        return []

    total_por_morador: Counter = Counter(r["morador_id"] for r in dados)
    corretos_por_morador: Counter = Counter(r["morador_id"] for r in dados if r.get("correto"))
    top_ids = [m for m, _ in total_por_morador.most_common(5)]

    profiles_res = db.table("profiles") \
        .select("id, nome, apartamento") \
        .in_("id", top_ids) \
        .execute()
    profiles_map = {p["id"]: p for p in (profiles_res.data or [])}

    result = []
    for morador_id in top_ids:
        profile = profiles_map.get(morador_id, {})
        total = total_por_morador[morador_id]
        corretos = corretos_por_morador.get(morador_id, 0)
        score = round(corretos / total * 100) if total > 0 else 0
        result.append({
            "nome": profile.get("nome", "Morador"),
            "apartamento": profile.get("apartamento", "?"),
            "descartes": total,
            "score": score,
        })

    return result


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


def exportar_pdf(mes: int, ano: int, tipo: str = "completo") -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from datetime import datetime

    dados = get_relatorio_mensal(mes, ano)
    nome_mes = MESES_PT[mes]
    agora = datetime.now().strftime('%d/%m/%Y às %H:%M')

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm,
                             topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()

    CORES = {
        "financeiro":   ("#166534", "#dcfce7", "#bbf7d0", "#f0fdf4"),
        "ambiental":    ("#065f46", "#d1fae5", "#6ee7b7", "#ecfdf5"),
        "participacao": ("#1e40af", "#dbeafe", "#93c5fd", "#eff6ff"),
        "completo":     ("#166534", "#dcfce7", "#bbf7d0", "#f0fdf4"),
    }
    cor_titulo, cor_badge_bg, cor_grid, cor_row = CORES.get(tipo, CORES["completo"])

    titulo_style = ParagraphStyle("titulo", parent=styles["Heading1"],
                                  textColor=colors.HexColor(cor_titulo), fontSize=20)
    secao_style = ParagraphStyle("secao", parent=styles["Heading2"],
                                 textColor=colors.HexColor(cor_titulo), fontSize=13, spaceAfter=6)
    sub_style = ParagraphStyle("sub", parent=styles["Normal"], textColor=colors.gray, fontSize=10)
    body_style = ParagraphStyle("body", parent=styles["Normal"], fontSize=11,
                                leading=16, textColor=colors.HexColor("#1c1c1c"))
    ia_badge_style = ParagraphStyle("ia_badge", parent=styles["Normal"],
                                    textColor=colors.HexColor(cor_titulo), fontSize=9,
                                    backColor=colors.HexColor(cor_badge_bg), borderPadding=4)

    def tabela_estilizada(dados_tabela, col_widths=None):
        n_cols = len(dados_tabela[0])
        if col_widths is None:
            largura_total = 16*cm
            col_widths = [largura_total / n_cols] * n_cols
        t = Table(dados_tabela, colWidths=col_widths)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(cor_titulo)),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 12),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor(cor_row), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(cor_grid)),
            ("FONTSIZE", (0, 1), (-1, -1), 11),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        return t

    def rodape(story):
        story.append(Spacer(1, 0.5*cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d5db")))
        story.append(Spacer(1, 0.2*cm))
        story.append(Paragraph("Relatório gerado automaticamente pelo sistema GreenBin.", sub_style))

    story = []

    # ── Financeiro ──────────────────────────────────────────────────────────────
    if tipo == "financeiro":
        INVESTIMENTO = 950
        economia = dados["economia_reais"]
        custo_anterior = economia + INVESTIMENTO
        pct_reducao = round(economia / custo_anterior * 100, 1) if custo_anterior > 0 else 0
        eco_reciclavel = round(dados["total_reciclavel_kg"] * 0.8, 2)
        eco_organico = round(dados["total_organico_kg"] * 0.3, 2)

        story += [
            Paragraph("GreenBin – Análise Financeira", titulo_style),
            Spacer(1, 0.2*cm),
            Paragraph(f"{nome_mes} de {ano}", sub_style),
            Paragraph(f"Gerado em {agora}", sub_style),
            Spacer(1, 0.8*cm),
            Paragraph("Resumo Financeiro do Período", secao_style),
            tabela_estilizada([
                ["Métrica", "Valor"],
                ["Custo estimado sem GreenBin", f"R$ {custo_anterior:,.2f}".replace(",", ".")],
                ["Investimento GreenBin (mensalidade)", "R$ 950,00"],
                ["Economia líquida gerada", f"R$ {economia:,.2f}".replace(",", ".")],
                ["Redução percentual vs. referência", f"{pct_reducao}%"],
            ], [10*cm, 6*cm]),
            Spacer(1, 0.8*cm),
            Paragraph("Detalhamento das Economias", secao_style),
            tabela_estilizada([
                ["Origem da Economia", "Kg Gerenciado", "Valor Estimado"],
                ["Aumento de reciclagem", f"{dados['total_reciclavel_kg']:.1f} kg", f"R$ {eco_reciclavel:,.2f}".replace(",", ".")],
                ["Redução de rejeitos (orgânicos)", f"{dados['total_organico_kg']:.1f} kg", f"R$ {eco_organico:,.2f}".replace(",", ".")],
            ], [7*cm, 4.5*cm, 4.5*cm]),
            Spacer(1, 0.8*cm),
            Paragraph("Outros Indicadores", secao_style),
            tabela_estilizada([
                ["Indicador", "Valor"],
                ["Coletas volumosas no mês", str(dados["total_volumosos"])],
                ["Moradores ativos", str(dados["moradores_ativos"])],
                ["Taxa de participação", f"{dados['taxa_participacao']:.1f}%"],
            ], [10*cm, 6*cm]),
        ]
        rodape(story)

    # ── Ambiental ───────────────────────────────────────────────────────────────
    elif tipo == "ambiental":
        total_kg = dados["total_organico_kg"] + dados["total_reciclavel_kg"] + dados["total_rejeito_kg"]
        pct_rec = round(dados["total_reciclavel_kg"] / total_kg * 100, 1) if total_kg > 0 else 0
        pct_org = round(dados["total_organico_kg"] / total_kg * 100, 1) if total_kg > 0 else 0
        pct_rej = round(100 - pct_rec - pct_org, 1)
        co2_tons = dados["co2_evitado_kg"] / 1000

        story += [
            Paragraph("GreenBin – Impacto Ambiental", titulo_style),
            Spacer(1, 0.2*cm),
            Paragraph(f"{nome_mes} de {ano}", sub_style),
            Paragraph(f"Gerado em {agora}", sub_style),
            Spacer(1, 0.8*cm),
            Paragraph("Indicadores Ambientais", secao_style),
            tabela_estilizada([
                ["Métrica", "Valor"],
                ["CO₂ evitado no período", f"{co2_tons:.3f} toneladas ({dados['co2_evitado_kg']:.1f} kg)"],
                ["Taxa de reciclagem", f"{pct_rec}%"],
                ["Rejeito do total coletado", f"{pct_rej}%"],
                ["Participação ativa dos moradores", f"{dados['taxa_participacao']:.1f}%"],
            ], [10*cm, 6*cm]),
            Spacer(1, 0.8*cm),
            Paragraph("Distribuição dos Resíduos", secao_style),
            tabela_estilizada([
                ["Tipo de Resíduo", "Quantidade (kg)", "% do Total"],
                ["Orgânico", f"{dados['total_organico_kg']:.1f} kg", f"{pct_org}%"],
                ["Reciclável", f"{dados['total_reciclavel_kg']:.1f} kg", f"{pct_rec}%"],
                ["Rejeito", f"{dados['total_rejeito_kg']:.1f} kg", f"{pct_rej}%"],
                ["TOTAL", f"{total_kg:.1f} kg", "100%"],
            ], [7*cm, 5*cm, 4*cm]),
            Spacer(1, 0.8*cm),
            Paragraph("Análise de Sustentabilidade — IA GreenBin Analytics", secao_style),
            Paragraph("Análise gerada por Gemini AI", ia_badge_style),
            Spacer(1, 0.4*cm),
        ]

        resumo_ia = gerar_resumo_ia(mes, ano)
        for paragrafo in resumo_ia["resumo"].split("\n\n"):
            texto = paragrafo.strip()
            if texto:
                story.append(Paragraph(texto, body_style))
                story.append(Spacer(1, 0.3*cm))

        rodape(story)

    # ── Participação ────────────────────────────────────────────────────────────
    elif tipo == "participacao":
        top = get_top_moradores(mes, ano)

        story += [
            Paragraph("GreenBin – Participação dos Moradores", titulo_style),
            Spacer(1, 0.2*cm),
            Paragraph(f"{nome_mes} de {ano}", sub_style),
            Paragraph(f"Gerado em {agora}", sub_style),
            Spacer(1, 0.8*cm),
            Paragraph("Indicadores de Engajamento", secao_style),
            tabela_estilizada([
                ["Métrica", "Valor"],
                ["Taxa de participação", f"{dados['taxa_participacao']:.1f}%"],
                ["Moradores ativos no período", str(dados["moradores_ativos"])],
                ["Total de descartes corretos", str(dados.get("descartes_corretos", "–"))],
            ]),
            Spacer(1, 0.8*cm),
            Paragraph("Top 5 Moradores do Mês", secao_style),
        ]

        if top:
            linhas_top = [["#", "Morador", "Apartamento", "Descartes", "Score"]]
            for i, m in enumerate(top, 1):
                linhas_top.append([
                    str(i),
                    m["nome"],
                    f"Apto {m['apartamento']}",
                    str(m["descartes"]),
                    f"{m['score']}%",
                ])
            t_top = Table(linhas_top, colWidths=[1*cm, 6*cm, 3*cm, 2.5*cm, 2.5*cm])
            t_top.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(cor_titulo)),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor(cor_row), colors.white]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(cor_grid)),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]))
            story.append(t_top)
        else:
            story.append(Paragraph("Sem registros de descarte no período selecionado.", body_style))

        rodape(story)

    # ── Completo (legado) ────────────────────────────────────────────────────────
    else:
        resumo_ia = gerar_resumo_ia(mes, ano)

        story += [
            Paragraph("GreenBin – Relatório Mensal Completo", titulo_style),
            Spacer(1, 0.2*cm),
            Paragraph(f"{nome_mes} de {ano}", sub_style),
            Paragraph(f"Gerado em {agora}", sub_style),
            Spacer(1, 0.8*cm),
            Paragraph("Dados do Período", secao_style),
            tabela_estilizada([
                ["Métrica", "Valor"],
                ["Orgânicos coletados", f"{dados['total_organico_kg']:.1f} kg"],
                ["Recicláveis coletados", f"{dados['total_reciclavel_kg']:.1f} kg"],
                ["Rejeitos", f"{dados['total_rejeito_kg']:.1f} kg"],
                ["Coletas volumosas", str(dados["total_volumosos"])],
                ["Taxa de participação", f"{dados['taxa_participacao']:.1f}%"],
                ["Moradores ativos", str(dados["moradores_ativos"])],
                ["CO₂ evitado", f"{dados['co2_evitado_kg']:.1f} kg"],
                ["Economia estimada", f"R$ {dados['economia_reais']:.2f}"],
            ], [10*cm, 6*cm]),
            Spacer(1, 1*cm),
            HRFlowable(width="100%", thickness=1, color=colors.HexColor("#bbf7d0")),
            Spacer(1, 0.5*cm),
            Paragraph("Resumo Executivo — Gerado por Inteligência Artificial", secao_style),
            Paragraph("Análise GreenBin Analytics (Gemini AI)", ia_badge_style),
            Spacer(1, 0.4*cm),
        ]

        for paragrafo in resumo_ia["resumo"].split("\n\n"):
            texto = paragrafo.strip()
            if texto:
                story.append(Paragraph(texto, body_style))
                story.append(Spacer(1, 0.3*cm))

        rodape(story)

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
