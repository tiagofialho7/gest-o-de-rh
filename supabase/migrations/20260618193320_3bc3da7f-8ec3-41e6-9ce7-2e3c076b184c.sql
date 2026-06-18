
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS youtube_url text;

CREATE TABLE public.job_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  mensagem_email text,
  enviar_email boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_stages_job_id ON public.job_stages(job_id, ordem);

GRANT SELECT ON public.job_stages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_stages TO authenticated;
GRANT ALL ON public.job_stages TO service_role;

ALTER TABLE public.job_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_stages_select_public ON public.job_stages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_stages.job_id
        AND (j.status = 'active'::job_status OR is_same_org(j.organization_id))
    )
  );

CREATE POLICY job_stages_manage ON public.job_stages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_stages.job_id
        AND (
          has_org_role(auth.uid(), j.organization_id, 'admin')
          OR has_org_role(auth.uid(), j.organization_id, 'people')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_stages.job_id
        AND (
          has_org_role(auth.uid(), j.organization_id, 'admin')
          OR has_org_role(auth.uid(), j.organization_id, 'people')
        )
    )
  );

CREATE TRIGGER update_job_stages_updated_at
  BEFORE UPDATE ON public.job_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
