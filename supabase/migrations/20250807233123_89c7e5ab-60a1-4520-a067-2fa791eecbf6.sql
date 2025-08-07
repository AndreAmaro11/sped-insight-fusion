-- Criar tabela de metadados para indicadores financeiros
CREATE TABLE public.financial_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  client_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_indicators ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view indicators for their companies" 
ON public.financial_indicators 
FOR SELECT 
USING (
  client_id IS NULL OR 
  client_id IN (
    SELECT id FROM public.companies 
    WHERE created_by = auth.uid() OR 
    id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can create indicators for their companies" 
ON public.financial_indicators 
FOR INSERT 
WITH CHECK (
  client_id IS NULL OR 
  client_id IN (
    SELECT id FROM public.companies 
    WHERE created_by = auth.uid() OR 
    id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can update indicators for their companies" 
ON public.financial_indicators 
FOR UPDATE 
USING (
  client_id IS NULL OR 
  client_id IN (
    SELECT id FROM public.companies 
    WHERE created_by = auth.uid() OR 
    id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_financial_indicators_updated_at
BEFORE UPDATE ON public.financial_indicators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default indicators
INSERT INTO public.financial_indicators (name, slug, description, display_order, enabled) VALUES
('DRE', 'dre', 'Demonstração do Resultado do Exercício', 1, true),
('Balanço Patrimonial', 'balanco', 'Balanço Patrimonial', 2, true),
('FCVPL', 'fcvpl', 'Fluxo de Caixa para a Vida do Projeto', 3, true),
('Indicadores Financeiros', 'indicadores', 'KPIs e Indicadores Financeiros Diversos', 4, true),
('Kanitz', 'kanitz', 'Indicador de Kanitz', 5, true),
('EVA', 'eva', 'Valor Econômico Agregado', 6, true),
('Ativo e Investimento', 'ativo-investimento', 'Análise de Ativo e Investimento', 7, true),
('Goodwill', 'goodwill', 'Análise de Goodwill', 8, true),
('GAO/GAF', 'alavancagem', 'Alavancagens Operacional e Financeira', 9, true);