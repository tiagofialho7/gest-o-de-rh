ALTER TYPE employment_regime ADD VALUE IF NOT EXISTS 'estagio';
ALTER TYPE employment_regime ADD VALUE IF NOT EXISTS 'associado';

ALTER TYPE seniority_level ADD VALUE IF NOT EXISTS 'trainee';
ALTER TYPE seniority_level ADD VALUE IF NOT EXISTS 'consultor';
ALTER TYPE seniority_level ADD VALUE IF NOT EXISTS 'auxiliar';
ALTER TYPE seniority_level ADD VALUE IF NOT EXISTS 'assistente';
ALTER TYPE seniority_level ADD VALUE IF NOT EXISTS 'analista';
ALTER TYPE seniority_level ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE seniority_level ADD VALUE IF NOT EXISTS 'coordenador';
ALTER TYPE seniority_level ADD VALUE IF NOT EXISTS 'gerente';
ALTER TYPE seniority_level ADD VALUE IF NOT EXISTS 'diretor';
ALTER TYPE seniority_level ADD VALUE IF NOT EXISTS 'administrativo';
ALTER TYPE seniority_level ADD VALUE IF NOT EXISTS 'operacional';