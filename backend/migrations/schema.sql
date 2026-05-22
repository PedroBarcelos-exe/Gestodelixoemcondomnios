-- =============================================================
-- GreenBin – Schema Supabase (PostgreSQL + pgvector)
-- Execute este SQL no SQL Editor do seu projeto Supabase
-- =============================================================

-- Habilitar extensão pgvector para embeddings RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================
-- TABELA: profiles (extensão do auth.users do Supabase)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('morador', 'zelador', 'sindico')),
    apartamento TEXT,
    bloco TEXT,
    telefone TEXT,
    foto_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: moradores só veem seu próprio perfil, admins veem todos
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários veem seu próprio perfil" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins veem todos os perfis" ON public.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('zelador', 'sindico'))
    );

-- =============================================================
-- TABELA: coletas (calendário de coletas)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.coletas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('organico', 'reciclavel', 'rejeito', 'volumoso', 'eletronico', 'vidro')),
    data DATE NOT NULL,
    horario TIME NOT NULL DEFAULT '07:00',
    descricao TEXT,
    recorrencia TEXT CHECK (recorrencia IN ('diaria', 'semanal', 'quinzenal', 'mensal', 'unica')) DEFAULT 'semanal',
    dia_semana INT CHECK (dia_semana BETWEEN 0 AND 6),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coletas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver coletas" ON public.coletas FOR SELECT USING (TRUE);
CREATE POLICY "Admins gerenciam coletas" ON public.coletas FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('zelador', 'sindico'))
);

-- =============================================================
-- TABELA: agendamentos_volumosos
-- =============================================================
CREATE TABLE IF NOT EXISTS public.agendamentos_volumosos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    morador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tipo_item TEXT NOT NULL,
    descricao TEXT NOT NULL,
    data_preferencial DATE NOT NULL,
    data_agendada DATE,
    status TEXT NOT NULL CHECK (status IN ('pendente', 'aprovado', 'concluido', 'cancelado')) DEFAULT 'pendente',
    observacao_zelador TEXT,
    zelador_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agendamentos_volumosos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Moradores veem seus agendamentos" ON public.agendamentos_volumosos
    FOR SELECT USING (auth.uid() = morador_id);
CREATE POLICY "Zeladores/Síndicos veem todos agendamentos" ON public.agendamentos_volumosos
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('zelador', 'sindico'))
    );
CREATE POLICY "Moradores criam agendamentos" ON public.agendamentos_volumosos
    FOR INSERT WITH CHECK (auth.uid() = morador_id);

-- =============================================================
-- TABELA: tarefas_zelador
-- =============================================================
CREATE TABLE IF NOT EXISTS public.tarefas_zelador (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zelador_id UUID REFERENCES public.profiles(id),
    descricao TEXT NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    concluida BOOLEAN DEFAULT FALSE,
    hora_conclusao TIMESTAMPTZ,
    prioridade TEXT CHECK (prioridade IN ('baixa', 'media', 'alta')) DEFAULT 'media',
    categoria TEXT CHECK (categoria IN ('limpeza', 'coleta', 'manutencao', 'outro')) DEFAULT 'outro',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tarefas_zelador ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zeladores gerenciam suas tarefas" ON public.tarefas_zelador
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('zelador', 'sindico'))
    );

-- =============================================================
-- TABELA: registros_descarte
-- =============================================================
CREATE TABLE IF NOT EXISTS public.registros_descarte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    morador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('organico', 'reciclavel', 'rejeito', 'volumoso', 'eletronico', 'vidro')),
    correto BOOLEAN NOT NULL DEFAULT TRUE,
    peso_kg DECIMAL(8,2),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.registros_descarte ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Moradores veem seus registros" ON public.registros_descarte
    FOR ALL USING (auth.uid() = morador_id);
CREATE POLICY "Admins veem todos registros" ON public.registros_descarte
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('zelador', 'sindico'))
    );

-- =============================================================
-- TABELA: relatorios_mensais (dados agregados para síndico)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.relatorios_mensais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INT NOT NULL,
    total_organico_kg DECIMAL(10,2) DEFAULT 0,
    total_reciclavel_kg DECIMAL(10,2) DEFAULT 0,
    total_rejeito_kg DECIMAL(10,2) DEFAULT 0,
    total_volumosos INT DEFAULT 0,
    taxa_participacao DECIMAL(5,2) DEFAULT 0,
    moradores_ativos INT DEFAULT 0,
    co2_evitado_kg DECIMAL(10,2) DEFAULT 0,
    economia_reais DECIMAL(10,2) DEFAULT 0,
    gerado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mes, ano)
);

ALTER TABLE public.relatorios_mensais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Síndico vê relatórios" ON public.relatorios_mensais
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'sindico')
    );

-- =============================================================
-- TABELA: chat_mensagens (histórico do chatbot)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.chat_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    morador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sessao_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    conteudo TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Moradores veem seu histórico de chat" ON public.chat_mensagens
    FOR ALL USING (auth.uid() = morador_id);
CREATE POLICY "Admins veem todos os chats" ON public.chat_mensagens
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('zelador', 'sindico'))
    );

-- =============================================================
-- TABELA: knowledge_documents (base de conhecimento RAG)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('regras', 'coleta', 'ecopontos', 'municipal', 'faq', 'outro')),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ler knowledge base" ON public.knowledge_documents
    FOR SELECT USING (ativo = TRUE);
CREATE POLICY "Admins gerenciam knowledge base" ON public.knowledge_documents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('zelador', 'sindico'))
    );

-- =============================================================
-- TABELA: knowledge_embeddings (vetores para RAG com pgvector)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INT NOT NULL DEFAULT 0,
    embedding vector(768),  -- dimensão do modelo Gemini text-embedding-004
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice HNSW para busca vetorial eficiente
CREATE INDEX IF NOT EXISTS knowledge_embeddings_embedding_idx
    ON public.knowledge_embeddings
    USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ler embeddings" ON public.knowledge_embeddings
    FOR SELECT USING (TRUE);

-- =============================================================
-- TABELA: faq_analytics (análise de perguntas do chatbot)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.faq_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pergunta TEXT NOT NULL,
    categoria TEXT,
    contagem INT DEFAULT 1,
    primeira_vez TIMESTAMPTZ DEFAULT NOW(),
    ultima_vez TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faq_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins veem analytics" ON public.faq_analytics
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('zelador', 'sindico'))
    );
CREATE POLICY "Sistema insere analytics" ON public.faq_analytics
    FOR INSERT WITH CHECK (TRUE);

-- =============================================================
-- FUNÇÃO: busca vetorial por similaridade (para RAG)
-- =============================================================
CREATE OR REPLACE FUNCTION match_knowledge(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    chunk_text TEXT,
    similarity float
)
LANGUAGE SQL STABLE AS $$
    SELECT
        ke.id,
        ke.document_id,
        ke.chunk_text,
        1 - (ke.embedding <=> query_embedding) AS similarity
    FROM public.knowledge_embeddings ke
    WHERE 1 - (ke.embedding <=> query_embedding) > match_threshold
    ORDER BY ke.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- =============================================================
-- TRIGGER: atualizar updated_at automaticamente
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER agendamentos_updated_at BEFORE UPDATE ON public.agendamentos_volumosos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER knowledge_docs_updated_at BEFORE UPDATE ON public.knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- DADOS INICIAIS: coletas recorrentes
-- =============================================================
INSERT INTO public.coletas (tipo, data, horario, descricao, recorrencia, dia_semana) VALUES
    ('organico', CURRENT_DATE, '07:00', 'Coleta de resíduos orgânicos', 'semanal', 1),
    ('organico', CURRENT_DATE + 3, '07:00', 'Coleta de resíduos orgânicos', 'semanal', 4),
    ('reciclavel', CURRENT_DATE + 1, '08:00', 'Coleta seletiva - recicláveis', 'semanal', 2),
    ('rejeito', CURRENT_DATE + 2, '07:00', 'Coleta de rejeitos', 'semanal', 3),
    ('vidro', CURRENT_DATE + 4, '09:00', 'Coleta de vidro - ecoponto', 'quinzenal', 5)
ON CONFLICT DO NOTHING;
