
-- Habilitar Row Level Security em todas as tabelas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sped_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sped_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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

-- Função para automatizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualização automática de timestamps
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

-- Função para criar perfil automaticamente quando usuário se cadastra
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

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Índices para melhor performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_sped_records_upload_account ON public.sped_records(upload_id, account_code);
CREATE INDEX IF NOT EXISTS idx_sped_records_fiscal_year ON public.sped_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_sped_uploads_user_company ON public.sped_uploads(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_sped_uploads_status ON public.sped_uploads(processing_status);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_upload ON public.chart_of_accounts(upload_id);

-- Inserir dados de exemplo para teste
INSERT INTO public.companies (name, cnpj, email, city, state) VALUES
    ('Empresa Demo Ltda', '12.345.678/0001-90', 'contato@empresademo.com.br', 'São Paulo', 'SP'),
    ('Contabilidade ABC', '98.765.432/0001-10', 'admin@contabilidadeabc.com.br', 'Rio de Janeiro', 'RJ')
ON CONFLICT DO NOTHING;
