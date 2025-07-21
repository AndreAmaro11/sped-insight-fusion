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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
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