import type {
  WorkModel,
  JobContractType,
  JobSeniority,
  SalaryType,
  JobUrgency,
  DescriptionTone,
  EducationLevel,
} from "@/types/job";

export const JOB_WIZARD_STEPS = [
  { id: 1, title: "Básico", description: "Informações gerais da vaga" },
  { id: 2, title: "Requisitos", description: "Habilidades e qualificações" },
  { id: 3, title: "Remuneração", description: "Salário e benefícios" },
  { id: 4, title: "Descrição", description: "Gerar descrição com IA" },
  { id: 5, title: "Configurações", description: "Datas e configurações" },
  { id: 6, title: "Processo Seletivo", description: "Etapas do processo e e-mails automáticos" },
  { id: 7, title: "Revisão", description: "Confirmar e publicar" },
];

export const WORK_MODEL_LABELS: Record<WorkModel, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};

export const CONTRACT_TYPE_LABELS: Record<JobContractType, string> = {
  clt: "CLT",
  pj: "PJ",
  internship: "Estágio",
  temporary: "Temporário",
  freelancer: "Freelancer",
};

export const JOB_SENIORITY_LABELS: Record<JobSeniority, string> = {
  intern: "Estagiário",
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  specialist: "Especialista",
  lead: "Tech Lead",
  manager: "Gerente",
  director: "Diretor",
};

export const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  not_disclosed: "Não informar",
  negotiable: "A combinar",
  fixed: "Valor fixo",
  range: "Faixa salarial",
};

export const JOB_URGENCY_LABELS: Record<JobUrgency, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export const DESCRIPTION_TONE_LABELS: Record<DescriptionTone, string> = {
  startup: "Startup",
  corporate: "Corporativo",
  balanced: "Equilibrado",
  creative: "Criativo",
};

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  elementary: "Ensino Fundamental",
  high_school: "Ensino Médio",
  technical: "Técnico",
  undergraduate_ongoing: "Ensino Superior Cursando",
  undergraduate: "Ensino Superior Completo",
  postgraduate: "Pós-graduação",
  masters: "Mestrado",
  doctorate: "Doutorado",
  postdoc: "Pós-doutorado",
};

export const JOB_BENEFITS = [
  "Ajuda de Custo com Alimentação",
  "Ajuda de Custo com Transporte",
  "Plano de saúde",
  "Plano odontológico",
  "Seguro de vida",
  "Gympass/Wellhub",
  "Home office",
  "PPR",
  "Stock options",
  "Bolsa Capacitação para Estudos",
  "Treinamentos Internos",
  "Convênio farmácia",
  "Licença Maternidade estendida",
  "Acesso à Plataforma de Cursos Corporativos da PWR",
];

export const LANGUAGE_OPTIONS = [
  "Inglês",
  "Espanhol",
  "Francês",
  "Alemão",
  "Italiano",
  "Mandarim",
  "Japonês",
  "Coreano",
  "Russo",
  "Árabe",
  "Português",
];

export const LANGUAGE_LEVEL_OPTIONS = [
  { value: "basic", label: "Básico" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
  { value: "fluent", label: "Fluente" },
  { value: "native", label: "Nativo" },
];

export const JOB_TAGS = [
  "Urgente",
  "Home Office",
  "Presencial",
  "Híbrido",
  "Startup",
  "Tech",
  "Inovação",
  "Liderança",
  "Primeiro Emprego",
  "Programa de Estágio",
  "Trainee",
  "Diversidade e Inclusão",
  "Banco de Talentos",
];
