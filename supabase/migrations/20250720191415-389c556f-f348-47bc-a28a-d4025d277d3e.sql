-- Criação do esquema completo para o sistema SPED
-- Sistema para upload e processamento de arquivos SPED (Sistema Público de Escrituração Digital)

-- 1. Tabela de empresas/organizações
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zipcode TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de perfis de usuários
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'accountant')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. Tabela de uploads de arquivos SPED
CREATE TABLE public.sped_uploads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    fiscal_year INTEGER,
    sped_version TEXT, -- ECD, ECF, etc.
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
    error_message TEXT,
    total_records INTEGER DEFAULT 0,
    upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela do plano de contas
CREATE TABLE public.chart_of_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID NOT NULL REFERENCES public.sped_uploads(id) ON DELETE CASCADE,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_level INTEGER,
    parent_account_code TEXT,
    account_type TEXT, -- ativo, passivo, resultado, etc.
    is_synthetic BOOLEAN DEFAULT false, -- conta sintética ou analítica
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(upload_id, account_code)
);

-- 5. Tabela de registros SPED (lançamentos contábeis)
CREATE TABLE public.sped_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID NOT NULL REFERENCES public.sped_uploads(id) ON DELETE CASCADE,
    account_code TEXT NOT NULL,
    account_description TEXT,
    final_balance DECIMAL(15,2) DEFAULT 0,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    block_type TEXT, -- I155, C155, etc.
    fiscal_year INTEGER,
    record_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    INDEX(upload_id, account_code),
    INDEX(upload_id, fiscal_year)
);

-- 6. Tabela de relatórios gerados (DRE e Balanço)
CREATE TABLE public.generated_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID NOT NULL REFERENCES public.sped_uploads(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('dre', 'balanco')),
    fiscal_year INTEGER NOT NULL,
    report_data JSONB NOT NULL, -- dados do relatório em JSON
    generated_by UUID NOT NULL REFERENCES auth.users(id),
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Tabela de auditoria/logs
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- upload, process, generate_report, etc.
    entity_type TEXT, -- sped_upload, report, etc.
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Índices para melhor performance
CREATE INDEX idx_sped_records_upload_account ON public.sped_records(upload_id, account_code);
CREATE INDEX idx_sped_records_fiscal_year ON public.sped_records(fiscal_year);
CREATE INDEX idx_sped_uploads_user_company ON public.sped_uploads(user_id, company_id);
CREATE INDEX idx_sped_uploads_status ON public.sped_uploads(processing_status);
CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_chart_accounts_upload ON public.chart_of_accounts(upload_id);

-- 9. Habilitar Row Level Security (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sped_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sped_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. Políticas de segurança (RLS Policies)

-- Políticas para perfis de usuários
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Políticas para empresas
CREATE POLICY "Users can view their company" 
ON public.companies FOR SELECT 
USING (
    id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Company admins can update company" 
ON public.companies FOR UPDATE 
USING (
    id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Políticas para uploads SPED
CREATE POLICY "Users can view uploads from their company" 
ON public.sped_uploads FOR SELECT 
USING (
    user_id = auth.uid() OR 
    company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create uploads" 
ON public.sped_uploads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads" 
ON public.sped_uploads FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas para plano de contas
CREATE POLICY "Users can view chart of accounts from their uploads" 
ON public.chart_of_accounts FOR SELECT 
USING (
    upload_id IN (
        SELECT id FROM public.sped_uploads 
        WHERE user_id = auth.uid() OR 
        company_id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can insert chart of accounts for their uploads" 
ON public.chart_of_accounts FOR INSERT 
WITH CHECK (
    upload_id IN (
        SELECT id FROM public.sped_uploads 
        WHERE user_id = auth.uid()
    )
);

-- Políticas para registros SPED
CREATE POLICY "Users can view SPED records from their uploads" 
ON public.sped_records FOR SELECT 
USING (
    upload_id IN (
        SELECT id FROM public.sped_uploads 
        WHERE user_id = auth.uid() OR 
        company_id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can insert SPED records for their uploads" 
ON public.sped_records FOR INSERT 
WITH CHECK (
    upload_id IN (
        SELECT id FROM public.sped_uploads 
        WHERE user_id = auth.uid()
    )
);

-- Políticas para relatórios gerados
CREATE POLICY "Users can view reports from their uploads" 
ON public.generated_reports FOR SELECT 
USING (
    upload_id IN (
        SELECT id FROM public.sped_uploads 
        WHERE user_id = auth.uid() OR 
        company_id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can create reports for their uploads" 
ON public.generated_reports FOR INSERT 
WITH CHECK (
    generated_by = auth.uid() AND
    upload_id IN (
        SELECT id FROM public.sped_uploads 
        WHERE user_id = auth.uid()
    )
);

-- Políticas para audit logs
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (true);

-- 11. Funções para automatizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Triggers para atualização automática de timestamps
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sped_uploads_updated_at
    BEFORE UPDATE ON public.sped_uploads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Função para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 15. Inserir dados de exemplo para teste
INSERT INTO public.companies (name, cnpj, email, city, state) VALUES
    ('Empresa Demo Ltda', '12.345.678/0001-90', 'contato@empresademo.com.br', 'São Paulo', 'SP'),
    ('Contabilidade ABC', '98.765.432/0001-10', 'admin@contabilidadeabc.com.br', 'Rio de Janeiro', 'RJ');