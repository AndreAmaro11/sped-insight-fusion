
-- Primeiro, vamos garantir que a tabela companies existe e tem todos os campos necessários
-- Verificar se a tabela companies já tem os campos necessários para o cadastro
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Atualizar políticas RLS para permitir que usuários criem empresas
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
CREATE POLICY "Users can create companies" 
  ON public.companies 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Permitir que usuários vejam empresas que criaram ou estão associados
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
CREATE POLICY "Users can view accessible companies" 
  ON public.companies 
  FOR SELECT 
  USING (
    created_by = auth.uid() OR 
    id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  );

-- Permitir que usuários atualizem empresas que criaram
DROP POLICY IF EXISTS "Company admins can update company" ON public.companies;
CREATE POLICY "Users can update their created companies" 
  ON public.companies 
  FOR UPDATE 
  USING (created_by = auth.uid());

-- Permitir que usuários deletem empresas que criaram
CREATE POLICY "Users can delete their created companies" 
  ON public.companies 
  FOR DELETE 
  USING (created_by = auth.uid());
