"""Seed completo de dados realistas para o GreenBin - 6 meses de histórico."""
import sys, os, random, uuid as uuid_mod
from datetime import date, timedelta
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
load_dotenv()
from supabase import create_client

random.seed(42)
db = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
HOJE = date(2026, 6, 12)

# =============================================================
# LER USUARIOS DO BANCO (fonte da verdade)
# =============================================================
print("=" * 60)
print("LENDO USUARIOS DO BANCO")
print("=" * 60)

profiles = db.table('profiles').select('id, email, role, nome, apartamento, bloco').execute().data or []
moradores   = [p for p in profiles if p['role'] == 'morador']
sindico_row = next((p for p in profiles if p['role'] == 'sindico'), None)
zelador_row = next((p for p in profiles if p['role'] == 'zelador'), None)

sindico_id = sindico_row['id'] if sindico_row else None
zelador_id = zelador_row['id'] if zelador_row else None

print(f"  Sindico:   {sindico_row['email'] if sindico_row else 'NENHUM'}")
print(f"  Zelador:   {zelador_row['email'] if zelador_row else 'NENHUM'}")
print(f"  Moradores: {len(moradores)}")
for m in moradores:
    print(f"    {m['email']} - {m['nome']}")

if not moradores:
    print("ERRO: Nenhum morador encontrado. Execute create_auth_users.py primeiro.")
    sys.exit(1)

# =============================================================
# LIMPAR DADOS ANTERIORES
# =============================================================
print("\n" + "=" * 60)
print("LIMPANDO DADOS ANTERIORES")
print("=" * 60)

for tabela, filtro in [
    ("faq_analytics",         ("contagem", "gte", 0)),
    ("chat_mensagens",        ("role",     "in",  ["user", "assistant"])),
    ("tarefas_zelador",       ("data",     "gte", "2020-01-01")),
    ("registros_descarte",    ("data",     "gte", "2020-01-01")),
    ("agendamentos_volumosos",("data_preferencial", "gte", "2020-01-01")),
    ("relatorios_mensais",    ("mes",      "gte", 1)),
    ("coletas",               ("ativo",    "eq",  True)),
]:
    try:
        col, op, val = filtro
        q = db.table(tabela).delete()
        if   op == "gte": q = q.gte(col, val)
        elif op == "eq":  q = q.eq(col, val)
        elif op == "in":  q = q.in_(col, val)
        q.execute()
        print(f"  Limpo: {tabela}")
    except Exception as e:
        print(f"  Aviso {tabela}: {e}")

# =============================================================
# COLETAS (proximas 5 semanas)
# =============================================================
print("\n" + "=" * 60)
print("INSERINDO COLETAS FUTURAS")
print("=" * 60)

SCHEDULE = {
    0: ("organico",   "07:00", "Coleta de residuos organicos",     "semanal",   1),
    1: ("reciclavel", "08:00", "Coleta seletiva - reciclaveis",    "semanal",   2),
    2: ("rejeito",    "07:00", "Coleta de rejeitos",               "semanal",   3),
    3: ("organico",   "07:00", "Coleta de residuos organicos",     "semanal",   4),
    4: ("vidro",      "09:00", "Coleta de vidro - ecoponto",       "quinzenal", 5),
}
coletas = []
vidro_count = 0
for offset in range(37):
    d = HOJE + timedelta(days=offset)
    dow = d.weekday()
    if dow not in SCHEDULE:
        continue
    tipo, horario, descricao, recorrencia, dia_semana = SCHEDULE[dow]
    if tipo == "vidro":
        vidro_count += 1
        if vidro_count % 2 == 0:
            continue
    coletas.append({"tipo": tipo, "data": d.isoformat(), "horario": horario,
                    "descricao": descricao, "recorrencia": recorrencia,
                    "dia_semana": dia_semana, "ativo": True})

db.table("coletas").insert(coletas).execute()
print(f"  {len(coletas)} coletas inseridas (proximas 5 semanas)")

# =============================================================
# REGISTROS DE DESCARTE (Jan-Jun 2026)
# =============================================================
print("\n" + "=" * 60)
print("INSERINDO REGISTROS DE DESCARTE")
print("=" * 60)

MESES = [
    {"ano": 2026, "mes": 1, "n_ativos": 11, "dmin": 12, "dmax": 18},
    {"ano": 2026, "mes": 2, "n_ativos": 12, "dmin": 13, "dmax": 19},
    {"ano": 2026, "mes": 3, "n_ativos": 13, "dmin": 14, "dmax": 20},
    {"ano": 2026, "mes": 4, "n_ativos": 13, "dmin": 14, "dmax": 20},
    {"ano": 2026, "mes": 5, "n_ativos": 14, "dmin": 15, "dmax": 21},
    {"ano": 2026, "mes": 6, "n_ativos": 13, "dmin":  6, "dmax": 10},
]
DIAS_MES = [0,31,28,31,30,31,30,31,31,30,31,30,31]
PESOS = {
    "organico":   (5.0, 12.0),
    "reciclavel": (3.5,  8.5),
    "rejeito":    (1.5,  4.5),
    "vidro":      (2.0,  5.0),
    "eletronico": (0.5,  2.5),
}

registros = []
for mi in MESES:
    ano, mes = mi["ano"], mi["mes"]
    ultimo = min(DIAS_MES[mes], 12 if (ano == 2026 and mes == 6) else 31)
    ativos = random.sample(moradores, min(mi["n_ativos"], len(moradores)))
    for m in ativos:
        for _ in range(random.randint(mi["dmin"], mi["dmax"])):
            tipo = random.choices(
                ["organico","reciclavel","rejeito","vidro","eletronico"],
                weights=[40,35,17,5,3])[0]
            pmin, pmax = PESOS[tipo]
            registros.append({
                "morador_id": m["id"],
                "tipo": tipo,
                "correto": random.random() < 0.87,
                "peso_kg": round(random.uniform(pmin, pmax), 2),
                "data": f"{ano}-{mes:02d}-{random.randint(1, ultimo):02d}",
            })

for i in range(0, len(registros), 80):
    db.table("registros_descarte").insert(registros[i:i+80]).execute()
print(f"  {len(registros)} registros de descarte inseridos")

print("\n  Resumo por mes:")
for mi in MESES:
    ano, mes = mi["ano"], mi["mes"]
    rm = [r for r in registros if r["data"].startswith(f"{ano}-{mes:02d}")]
    org = sum(r["peso_kg"] for r in rm if r["tipo"] == "organico")
    rec = sum(r["peso_kg"] for r in rm if r["tipo"] == "reciclavel")
    rej = sum(r["peso_kg"] for r in rm if r["tipo"] == "rejeito")
    at  = len(set(r["morador_id"] for r in rm))
    pct = round(at / len(moradores) * 100)
    print(f"    {mes:02d}/{ano}: org={org:.0f}kg rec={rec:.0f}kg rej={rej:.0f}kg "
          f"moradores={at} ({pct}%) | CO2={rec*0.5:.0f}kg econ=R${rec*0.8+org*0.3:.0f}")

# =============================================================
# AGENDAMENTOS VOLUMOSOS (com created_at historico)
# =============================================================
print("\n" + "=" * 60)
print("INSERINDO AGENDAMENTOS VOLUMOSOS")
print("=" * 60)

ITENS = [
    "Sofa de 3 lugares","Guarda-roupa","Colchao de casal","Mesa de jantar",
    "Geladeira","Maquina de lavar","Cama box","Armario de escritorio",
    "Televisao antiga","Fogao","Estante de livros","Bicicleta velha",
    "Cadeira escritorio","Microondas","Tanquinho","Rack de TV",
    "Sofa 2 lugares","Escrivaninha","Beliche infantil","Aparelho de som",
]
ESTADOS = ["bom estado","danificado","funcional","quebrado","usado"]
OBS_APR = ["Agendado conforme solicitado.","Confirmado para a data indicada.","Coleta programada."]

agendamentos = []
for mi in MESES:
    ano, mes = mi["ano"], mi["mes"]
    ultimo = DIAS_MES[mes] if not (ano==2026 and mes==6) else 12
    for _ in range(random.randint(4, 7)):
        m = random.choice(moradores)
        dia_p  = random.randint(1, ultimo)
        dia_c  = random.randint(1, max(1, dia_p-1))
        c_ts   = f"{ano}-{mes:02d}-{dia_c:02d}T{random.randint(8,18):02d}:00:00+00:00"
        status = (
            random.choices(["concluido","aprovado","cancelado"], weights=[65,25,10])[0]
            if mes < 6 else
            random.choices(["pendente","aprovado","concluido"], weights=[60,30,10])[0]
        )
        ag = {
            "morador_id":       m["id"],
            "tipo_item":        random.choice(ITENS),
            "descricao":        f"Item para descarte - {random.choice(ESTADOS)}",
            "data_preferencial":f"{ano}-{mes:02d}-{dia_p:02d}",
            "status":           status,
            "created_at":       c_ts,
            "updated_at":       c_ts,
        }
        if status in ("aprovado","concluido"):
            dia_ag = min(dia_p + random.randint(2,5), ultimo)
            ag["data_agendada"] = f"{ano}-{mes:02d}-{dia_ag:02d}"
            ag["observacao_zelador"] = random.choice(OBS_APR)
            ag["updated_at"] = f"{ano}-{mes:02d}-{dia_ag:02d}T{random.randint(8,17):02d}:00:00+00:00"
            if zelador_id:
                ag["zelador_id"] = zelador_id
        agendamentos.append(ag)

# 3 pendentes para HOJE (visivel no dashboard do zelador)
for m in random.sample(moradores, min(3, len(moradores))):
    agendamentos.append({
        "morador_id":        m["id"],
        "tipo_item":         random.choice(ITENS),
        "descricao":         f"Item urgente - {random.choice(ESTADOS)}",
        "data_preferencial": HOJE.isoformat(),
        "status":            "pendente",
        "created_at":        f"{HOJE.isoformat()}T09:00:00+00:00",
        "updated_at":        f"{HOJE.isoformat()}T09:00:00+00:00",
    })

for i in range(0, len(agendamentos), 30):
    db.table("agendamentos_volumosos").insert(agendamentos[i:i+30]).execute()
print(f"  {len(agendamentos)} agendamentos inseridos")

# =============================================================
# TAREFAS DO ZELADOR (ultimos 30 dias + hoje)
# =============================================================
print("\n" + "=" * 60)
print("INSERINDO TAREFAS DO ZELADOR")
print("=" * 60)

TAREFAS = {
    "limpeza":   ["Limpar area de coleta seletiva bloco A","Lavar containers de lixo",
                  "Organizar lixeiras por tipo de residuo","Higienizar area de volumosos",
                  "Remover residuos no estacionamento","Limpar ecoponto do terreo"],
    "coleta":    ["Acompanhar coleta de organicos","Separar reciclaveis para coleta municipal",
                  "Organizar bags de coleta seletiva","Preparar volumosos para retirada",
                  "Verificar calendario de coletas","Conferir agendamentos pendentes"],
    "manutencao":["Verificar estado das lixeiras","Reportar lixeira danificada bloco B",
                  "Solicitar reposicao de bags","Inspecionar area de compostagem",
                  "Verificar sinalizacao das lixeiras","Checar travas das lixeiras externas"],
    "outro":     ["Orientar novo morador sobre descarte","Registrar descarte irregular apto 303",
                  "Comunicar sindico sobre excesso de rejeitos","Atualizar lista agendamentos",
                  "Fotografar area de descarte para relatorio","Acompanhar morador em agendamento"],
}

tarefas = []
for offset in range(30, -1, -1):
    data_t = (HOJE - timedelta(days=offset)).isoformat()
    for _ in range(random.randint(3, 5)):
        cat = random.choice(list(TAREFAS.keys()))
        desc = random.choice(TAREFAS[cat])
        concluida = random.random() < (0.92 if offset > 1 else 0.55)
        t = {
            "zelador_id": zelador_id,
            "descricao":  desc,
            "data":       data_t,
            "concluida":  concluida,
            "prioridade": random.choices(["baixa","media","alta"], weights=[25,55,20])[0],
            "categoria":  cat,
        }
        if concluida:
            h = random.randint(8, 17)
            t["hora_conclusao"] = f"{data_t}T{h:02d}:{random.randint(0,59):02d}:00+00:00"
        tarefas.append(t)

for i in range(0, len(tarefas), 50):
    db.table("tarefas_zelador").insert(tarefas[i:i+50]).execute()
print(f"  {len(tarefas)} tarefas do zelador inseridas")

# =============================================================
# CHAT MENSAGENS + FAQ ANALYTICS (ultimos 60 dias)
# =============================================================
print("\n" + "=" * 60)
print("INSERINDO CHAT E FAQ ANALYTICS")
print("=" * 60)

FAQ_DATA = [
    ("Posso jogar isopor na coleta seletiva?",         "reciclagem",  62),
    ("Onde descarto eletronicos como celular antigo?",  "eletronico",  38),
    ("Qual o horario da coleta de organicos?",          "coleta",      34),
    ("Como funciona o agendamento de volumosos?",       "volumoso",    29),
    ("Papelao molhado vai para o reciclavel?",          "reciclagem",  27),
    ("Onde jogo fralda descartavel?",                   "rejeito",     24),
    ("Vidro quebrado pode ir no reciclavel?",           "vidro",       21),
    ("Como descarto oleo de cozinha usado?",            "ecoponto",    18),
    ("Quando e a coleta de reciclavel?",                "coleta",      16),
    ("Posso deixar entulho na area de lixo?",           "volumoso",    14),
    ("Pilha e bateria onde descartar?",                 "eletronico",  12),
    ("O que e residuo organico?",                       "educacao",    11),
    ("Lata de tinta pode ir no reciclavel?",            "reciclagem",   9),
    ("Como separo plastico do metal?",                  "reciclagem",   8),
    ("Ha ecoponto no condominio?",                      "ecoponto",     7),
]
RESPOSTAS = {
    "reciclagem": "O isopor pode ser descartado na coleta seletiva limpo e seco. A coleta seletiva ocorre toda terca-feira as 08h.",
    "eletronico": "Eletronicos devem ir ao ecoponto do terreo (bloco A). Nao jogue na lixeira comum — contem substancias toxicas.",
    "coleta":     "Organicos: segunda e quinta as 07h. Reciclaveis: terca as 08h. Rejeitos: quarta as 07h.",
    "volumoso":   "Para agendar coleta de volumosos, acesse 'Agendamentos' no app. O zelador aprovara em ate 2 dias uteis.",
    "rejeito":    "Fraldas sao rejeitos — lixo comum (saco preto). Nao podem ser recicladas.",
    "vidro":      "Vidro quebrado: embrulhe em jornal e lixo comum. Vidros inteiros e limpos: coleta seletiva.",
    "ecoponto":   "Ecoponto no terreo bloco A: pilhas, baterias, oleo usado (garrafa PET), medicamentos e eletronicos.",
    "educacao":   "Residuos organicos sao restos de alimentos, cascas, borra de cafe. Lixeira organica (segunda e quinta).",
}

faq_records = [{"pergunta": p, "categoria": c, "contagem": n} for p, c, n in FAQ_DATA]
db.table("faq_analytics").insert(faq_records).execute()
print(f"  {len(faq_records)} FAQ analytics inseridos")

perguntas_pool = [(p, c) for p, c, _ in FAQ_DATA]
chat_msgs = []
for dia_offset in range(60):
    data_chat = HOJE - timedelta(days=dia_offset)
    n_users = random.randint(2, 5)
    usuarios_dia = random.sample(moradores, min(n_users, len(moradores)))
    for m in usuarios_dia:
        sessao_id = str(uuid_mod.uuid4())
        n_perguntas = random.randint(1, 3)
        pergs = random.sample(perguntas_pool, n_perguntas)
        hora_base = random.randint(8, 21)
        for j, (pergunta, categoria) in enumerate(pergs):
            resposta = RESPOSTAS.get(categoria, "Entre em contato com o zelador.")
            ts_user = f"{data_chat.isoformat()}T{hora_base:02d}:{j*5:02d}:00+00:00"
            ts_bot  = f"{data_chat.isoformat()}T{hora_base:02d}:{j*5+1:02d}:00+00:00"
            chat_msgs.append({"morador_id": m["id"], "sessao_id": sessao_id,
                              "role": "user",      "conteudo": pergunta,
                              "metadata": {"categoria": categoria}, "created_at": ts_user})
            chat_msgs.append({"morador_id": m["id"], "sessao_id": sessao_id,
                              "role": "assistant", "conteudo": resposta,
                              "metadata": {"categoria": categoria,
                                           "confianca": round(random.uniform(0.82, 0.98), 2)},
                              "created_at": ts_bot})

for i in range(0, len(chat_msgs), 80):
    db.table("chat_mensagens").insert(chat_msgs[i:i+80]).execute()
print(f"  {len(chat_msgs)} mensagens de chat inseridas")

# =============================================================
# RESUMO FINAL
# =============================================================
print("\n" + "=" * 60)
print("SEED CONCLUIDO COM SUCESSO!")
print("=" * 60)
print(f"  Moradores ativos:       {len(moradores)}")
print(f"  Coletas agendadas:      {len(coletas)}")
print(f"  Registros de descarte:  {len(registros)}")
print(f"  Agendamentos volumosos: {len(agendamentos)}")
print(f"  Tarefas do zelador:     {len(tarefas)}")
print(f"  Mensagens de chat:      {len(chat_msgs)}")
print(f"  FAQ analytics:          {len(faq_records)}")
print(f"\n  Sindico:  {sindico_row['email'] if sindico_row else 'N/A'}")
print(f"  Zelador:  {zelador_row['email'] if zelador_row else 'N/A'}")
print(f"  Senha padrao moradores: Greenbin@123 (para os @greenbin.com)")
