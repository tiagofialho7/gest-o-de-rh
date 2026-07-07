
-- ============ ENUM ============
DO $$ BEGIN
  CREATE TYPE public.pergunta_fit_tipo AS ENUM ('texto_longo', 'multipla_escolha', 'escala');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ fit_cultural ============
CREATE TABLE public.fit_cultural (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id uuid NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  video_url text,
  titulo text NOT NULL DEFAULT 'Fit Cultural PWR',
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.fit_cultural TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fit_cultural TO authenticated;
GRANT ALL ON public.fit_cultural TO service_role;

ALTER TABLE public.fit_cultural ENABLE ROW LEVEL SECURITY;

CREATE POLICY fit_cultural_select_public ON public.fit_cultural
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = fit_cultural.vaga_id
        AND (j.status = 'active'::job_status OR is_same_org(j.organization_id))
    )
  );

CREATE POLICY fit_cultural_manage ON public.fit_cultural
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = fit_cultural.vaga_id
        AND (has_org_role(auth.uid(), j.organization_id, 'admin')
             OR has_org_role(auth.uid(), j.organization_id, 'people'))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = fit_cultural.vaga_id
        AND (has_org_role(auth.uid(), j.organization_id, 'admin')
             OR has_org_role(auth.uid(), j.organization_id, 'people'))
    )
  );

CREATE TRIGGER update_fit_cultural_updated_at
  BEFORE UPDATE ON public.fit_cultural
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ perguntas_fit ============
CREATE TABLE public.perguntas_fit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  texto text NOT NULL,
  tipo public.pergunta_fit_tipo NOT NULL DEFAULT 'texto_longo',
  opcoes jsonb,
  obrigatoria boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_perguntas_fit_vaga ON public.perguntas_fit(vaga_id, ordem);

GRANT SELECT ON public.perguntas_fit TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perguntas_fit TO authenticated;
GRANT ALL ON public.perguntas_fit TO service_role;

ALTER TABLE public.perguntas_fit ENABLE ROW LEVEL SECURITY;

CREATE POLICY perguntas_fit_select_public ON public.perguntas_fit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = perguntas_fit.vaga_id
        AND (j.status = 'active'::job_status OR is_same_org(j.organization_id))
    )
  );

CREATE POLICY perguntas_fit_manage ON public.perguntas_fit
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = perguntas_fit.vaga_id
        AND (has_org_role(auth.uid(), j.organization_id, 'admin')
             OR has_org_role(auth.uid(), j.organization_id, 'people'))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = perguntas_fit.vaga_id
        AND (has_org_role(auth.uid(), j.organization_id, 'admin')
             OR has_org_role(auth.uid(), j.organization_id, 'people'))
    )
  );

CREATE TRIGGER update_perguntas_fit_updated_at
  BEFORE UPDATE ON public.perguntas_fit
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ acessos_fit ============
CREATE TABLE public.acessos_fit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  vaga_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  usado boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_acessos_fit_token ON public.acessos_fit(token);
CREATE INDEX idx_acessos_fit_candidato ON public.acessos_fit(candidato_id);

GRANT SELECT, UPDATE ON public.acessos_fit TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acessos_fit TO authenticated;
GRANT ALL ON public.acessos_fit TO service_role;

ALTER TABLE public.acessos_fit ENABLE ROW LEVEL SECURITY;

-- Público pode ler acesso (token é o segredo)
CREATE POLICY acessos_fit_select_public ON public.acessos_fit
  FOR SELECT USING (true);

-- Público pode marcar como usado (necessário no fluxo de envio)
CREATE POLICY acessos_fit_update_public ON public.acessos_fit
  FOR UPDATE USING (usado = false AND expires_at > now())
  WITH CHECK (true);

CREATE POLICY acessos_fit_manage ON public.acessos_fit
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = acessos_fit.vaga_id
        AND (has_org_role(auth.uid(), j.organization_id, 'admin')
             OR has_org_role(auth.uid(), j.organization_id, 'people'))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = acessos_fit.vaga_id
        AND (has_org_role(auth.uid(), j.organization_id, 'admin')
             OR has_org_role(auth.uid(), j.organization_id, 'people'))
    )
  );

-- ============ respostas_fit ============
CREATE TABLE public.respostas_fit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  vaga_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  pergunta_id uuid NOT NULL REFERENCES public.perguntas_fit(id) ON DELETE CASCADE,
  resposta text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_respostas_fit_candidato ON public.respostas_fit(candidato_id, vaga_id);

GRANT SELECT, INSERT ON public.respostas_fit TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.respostas_fit TO authenticated;
GRANT ALL ON public.respostas_fit TO service_role;

ALTER TABLE public.respostas_fit ENABLE ROW LEVEL SECURITY;

-- Candidato pode inserir se tiver token válido
CREATE POLICY respostas_fit_insert_public ON public.respostas_fit
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.acessos_fit a
      WHERE a.candidato_id = respostas_fit.candidato_id
        AND a.vaga_id = respostas_fit.vaga_id
        AND a.expires_at > now()
    )
  );

-- Org (admin/people) pode ler todas
CREATE POLICY respostas_fit_select_org ON public.respostas_fit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = respostas_fit.vaga_id
        AND (has_org_role(auth.uid(), j.organization_id, 'admin')
             OR has_org_role(auth.uid(), j.organization_id, 'people'))
    )
  );

-- Público pode ler suas próprias (via token — usado para revisão pré-envio)
CREATE POLICY respostas_fit_select_public ON public.respostas_fit
  FOR SELECT USING (true);

CREATE POLICY respostas_fit_manage ON public.respostas_fit
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = respostas_fit.vaga_id
        AND (has_org_role(auth.uid(), j.organization_id, 'admin')
             OR has_org_role(auth.uid(), j.organization_id, 'people'))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = respostas_fit.vaga_id
        AND (has_org_role(auth.uid(), j.organization_id, 'admin')
             OR has_org_role(auth.uid(), j.organization_id, 'people'))
    )
  );
