-- Criar tabela de contratos/companhias
CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para contracts
CREATE POLICY "Users can create contracts" 
  ON public.contracts 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their contracts" 
  ON public.contracts 
  FOR SELECT 
  USING (created_by = auth.uid());

CREATE POLICY "Users can update their contracts" 
  ON public.contracts 
  FOR UPDATE 
  USING (created_by = auth.uid());

-- Adicionar campos à tabela companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES public.contracts(id),
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Atualizar políticas RLS para companies considerando a nova estrutura
DROP POLICY IF EXISTS "Users can view accessible companies" ON public.companies;
CREATE POLICY "Users can view accessible companies" 
  ON public.companies 
  FOR SELECT 
  USING (
    is_deleted = false AND (
      created_by = auth.uid() OR 
      contract_id IN (SELECT id FROM contracts WHERE created_by = auth.uid()) OR
      id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Atualizar política de inserção para verificar contrato
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
CREATE POLICY "Users can create companies" 
  ON public.companies 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = created_by AND
    (contract_id IS NULL OR contract_id IN (SELECT id FROM contracts WHERE created_by = auth.uid()))
  );

-- Trigger para atualizar updated_at em contracts
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();