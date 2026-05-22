INITIAL_KNOWLEDGE_BASE = [
    {
        "titulo": "Coleta de Lixo Orgânico",
        "categoria": "coleta",
        "conteudo": "A coleta de lixo orgânico no condomínio ocorre todas as segundas e quintas-feiras às 07:00 da manhã. Os moradores devem colocar seus sacos de lixo (preferencialmente biodegradáveis ou bem fechados) nas lixeiras da torre até as 06:30 ou na noite anterior após as 20h. O lixo orgânico inclui restos de comida, cascas de frutas e legumes, borra de café, saquinhos de chá e guardanapos de papel usados."
    },
    {
        "titulo": "Coleta Seletiva de Recicláveis",
        "categoria": "coleta",
        "conteudo": "A coleta seletiva de recicláveis (papel, plástico, metal) ocorre todas as terças-feiras às 08:00. Lave os recipientes plásticos e metálicos para remover resíduos de alimentos antes do descarte (isso evita mau cheiro e proliferação de pragas). Papéis devem estar secos e, se possível, dobrados ou rasgados para economizar espaço. Não misture rejeitos orgânicos com os recicláveis."
    },
    {
        "titulo": "Descarte de Vidro",
        "categoria": "coleta",
        "conteudo": "O descarte de vidro deve ser feito exclusivamente no Ecoponto de Vidro localizado no térreo, próximo à garagem B. A coleta de vidro ocorre a cada 15 dias, nas sextas-feiras às 09:00. Garrafas, copos e potes de vidro quebrados devem ser embrulhados em papel jornal ou colocados dentro de uma garrafa pet cortada para proteger os zeladores e coletores de acidentes."
    },
    {
        "titulo": "Descarte de Pilhas, Baterias e Eletrônicos",
        "categoria": "ecopontos",
        "conteudo": "Pilhas, baterias e pequenos aparelhos eletrônicos (celulares antigos, carregadores, cabos) devem ser descartados no Coletor Ecológico localizado no hall de entrada principal, ao lado da portaria. Nunca descarte estes itens no lixo comum ou reciclável, pois eles contêm metais pesados altamente poluentes. Eletrônicos maiores (TVs, computadores) devem ser agendados como Coleta Volumosa."
    },
    {
        "titulo": "Descarte de Lâmpadas",
        "categoria": "ecopontos",
        "conteudo": "O descarte de lâmpadas (especialmente as fluorescentes) deve ser feito unicamente no ecoponto do térreo, ao lado da zeladoria. Lâmpadas nunca devem ser jogadas no lixo comum ou de recicláveis devido ao risco de quebra e contaminação por mercúrio. Lâmpadas LED também devem ser levadas a este ponto para reciclagem especial."
    },
    {
        "titulo": "Descarte de Isopor (Poliestireno Expandido)",
        "categoria": "regras",
        "conteudo": "Sim, o isopor é 100% reciclável! No entanto, ele deve ser descartado limpo e sem resíduos de comida (como caixas de pizza engorduradas). Descarte o isopor limpo no contêiner azul de Recicláveis no subsolo. Isopor sujo de gordura ou molho deve ser descartado no lixo de rejeitos (comum)."
    },
    {
        "titulo": "Descarte de Óleo de Cozinha Usado",
        "categoria": "ecopontos",
        "conteudo": "O óleo de cozinha usado nunca deve ser despejado na pia, pois entope o encanamento e polui milhares de litros de água. O condomínio possui um coletor de óleo no Ecoponto do térreo. Armazene seu óleo usado em uma garrafa PET transparente e bem fechada e deposite a garrafa diretamente no tambor verde indicado."
    },
    {
        "titulo": "Regras para Coleta de Volumosos (Móveis e Eletrodomésticos)",
        "categoria": "regras",
        "conteudo": "Móveis antigos, eletrodomésticos grandes (geladeira, fogão, máquina de lavar) ou colchões não podem ser deixados nas áreas comuns ou nas lixeiras das torres. O morador deve agendar a retirada no app GreenBin na aba 'Agendar Coleta'. O zelador revisará e aprovará uma data para a retirada do item diretamente na sua unidade ou na área designada."
    },
    {
        "titulo": "Regras Gerais de Convivência e Multas",
        "categoria": "regras",
        "conteudo": "Conforme o regimento interno do condomínio (Artigo 42), o descarte incorreto de lixo nas áreas comuns, corredores ou o depósito de lixo fora dos dias/horários corretos está sujeito a advertência por escrito na primeira ocorrência. Em caso de reincidência, será aplicada uma multa no valor de 30% da cota condominial vigente."
    },
    {
        "titulo": "Descarte de Medicamentos Vencidos",
        "categoria": "municipal",
        "conteudo": "Medicamentos vencidos ou em desuso, bem como suas caixas e cartelas, não devem ser jogados no lixo comum ou vaso sanitário. Eles devem ser levados a farmácias parceiras ou postos de saúde locais que possuem coletores específicos para o descarte seguro de fármacos, evitando a contaminação da água e do solo."
    }
]


def seed_knowledge_base(db_admin):
    """Insere as regras iniciais na base de conhecimento se estiver vazia."""
    existing = db_admin.table("knowledge_documents").select("id").limit(1).execute()
    if existing.data:
        return  # Já possui dados

    for doc in INITIAL_KNOWLEDGE_BASE:
        db_admin.table("knowledge_documents").insert(doc).execute()
