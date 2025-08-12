-- Enable RLS (no-op if already enabled)
ALTER TABLE public.financial_indicators ENABLE ROW LEVEL SECURITY;

-- Create DELETE policy allowing users to delete indicators for their accessible companies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_indicators'
      AND policyname = 'Users can delete indicators for their companies'
  ) THEN
    CREATE POLICY "Users can delete indicators for their companies"
    ON public.financial_indicators
    FOR DELETE
    USING (
      (client_id IS NULL)
      OR (
        client_id IN (
          SELECT companies.id
          FROM public.companies
          WHERE (
            companies.created_by = auth.uid()
            OR companies.id IN (
              SELECT profiles.company_id
              FROM public.profiles
              WHERE profiles.user_id = auth.uid()
            )
          )
        )
      )
    );
  END IF;
END
$$;