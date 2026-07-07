import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import pwrLogo from "@/assets/pwr-logo.png";

interface Acesso {
  id: string;
  candidato_id: string;
  vaga_id: string;
  token: string;
  usado: boolean;
  expires_at: string;
}

interface Candidato {
  id: string;
  candidate_name: string | null;
  candidate_email: string | null;
}

interface Fit {
  titulo: string;
  video_url: string | null;
  descricao: string | null;
  ativo: boolean;
}

interface Pergunta {
  id: string;
  texto: string;
  tipo: "texto_longo" | "multipla_escolha" | "escala";
  opcoes: string[] | null;
  obrigatoria: boolean;
  ordem: number;
}

interface Job {
  title: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "already_done" }
  | {
      status: "ready";
      acesso: Acesso;
      candidato: Candidato;
      fit: Fit | null;
      perguntas: Pergunta[];
      job: Job;
    };

// -------- helpers --------

function toYouTubeEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.replace("/", "")}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {
    return null;
  }
  return null;
}

// -------- sub-components --------

function BrandShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white" style={{ color: "#1A2B5C" }}>
      <header
        className="w-full py-10 px-6"
        style={{
          backgroundColor: "#1A2B5C",
          borderBottom: "4px solid #E8571A",
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <img src={pwrLogo} alt="PWR Gestão" className="h-12 w-auto" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Fit Cultural PWR
            </h1>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}

function ErrorScreen({ title, message }: { title: string; message: string }) {
  return (
    <BrandShell>
      <div
        className="rounded-xl p-8 text-center"
        style={{
          border: "1px solid #E8E8E8",
          borderLeft: "4px solid #E8571A",
        }}
      >
        <h2 className="text-xl font-bold mb-3" style={{ color: "#1A2B5C" }}>
          {title}
        </h2>
        <p style={{ color: "#444444" }}>{message}</p>
      </div>
    </BrandShell>
  );
}

// -------- main page --------

export default function FitCulturalPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) {
        setState({ status: "invalid" });
        return;
      }

      const { data: acesso } = await (supabase as any)
        .from("acessos_fit")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (!acesso) {
        setState({ status: "invalid" });
        return;
      }

      const now = new Date();
      const exp = new Date(acesso.expires_at);
      if (exp <= now) {
        setState({ status: "invalid" });
        return;
      }

      if (acesso.usado) {
        // Check if already has responses
        const { data: existing } = await (supabase as any)
          .from("respostas_fit")
          .select("id")
          .eq("candidato_id", acesso.candidato_id)
          .eq("vaga_id", acesso.vaga_id)
          .limit(1);
        if (existing && existing.length > 0) {
          setState({ status: "already_done" });
          return;
        }
      }

      const [candRes, fitRes, perguntasRes, jobRes] = await Promise.all([
        (supabase as any)
          .from("job_applications")
          .select("id, candidate_name, candidate_email")
          .eq("id", acesso.candidato_id)
          .maybeSingle(),
        (supabase as any)
          .from("fit_cultural")
          .select("titulo, video_url, descricao, ativo")
          .eq("vaga_id", acesso.vaga_id)
          .maybeSingle(),
        (supabase as any)
          .from("perguntas_fit")
          .select("*")
          .eq("vaga_id", acesso.vaga_id)
          .order("ordem", { ascending: true }),
        (supabase as any)
          .from("jobs")
          .select("title")
          .eq("id", acesso.vaga_id)
          .maybeSingle(),
      ]);

      if (!candRes.data || !jobRes.data) {
        setState({ status: "invalid" });
        return;
      }

      const perguntas: Pergunta[] = (perguntasRes.data || []).map((p: any) => ({
        id: p.id,
        texto: p.texto,
        tipo: p.tipo,
        opcoes: Array.isArray(p.opcoes) ? p.opcoes : null,
        obrigatoria: p.obrigatoria,
        ordem: p.ordem,
      }));

      setState({
        status: "ready",
        acesso,
        candidato: candRes.data,
        fit: fitRes.data,
        perguntas,
        job: jobRes.data,
      });
    })();
  }, [token]);

  const embedUrl = useMemo(
    () =>
      state.status === "ready" ? toYouTubeEmbed(state.fit?.video_url) : null,
    [state]
  );

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      const { [id]: _drop, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async () => {
    if (state.status !== "ready") return;

    const newErrors: Record<string, string> = {};
    for (const p of state.perguntas) {
      if (p.obrigatoria && !answers[p.id]?.trim()) {
        newErrors[p.id] = "Esta pergunta é obrigatória.";
      }
    }
    setErrors(newErrors);

    if (!acceptedTerms) {
      setTermsError(true);
    }
    if (Object.keys(newErrors).length > 0 || !acceptedTerms) return;

    setSubmitting(true);
    try {
      const rows = state.perguntas
        .filter((p) => answers[p.id] != null)
        .map((p) => ({
          candidato_id: state.acesso.candidato_id,
          vaga_id: state.acesso.vaga_id,
          pergunta_id: p.id,
          resposta: answers[p.id],
        }));

      if (rows.length > 0) {
        const { error: insErr } = await (supabase as any)
          .from("respostas_fit")
          .insert(rows);
        if (insErr) throw insErr;
      }

      const { error: updErr } = await (supabase as any)
        .from("acessos_fit")
        .update({ usado: true })
        .eq("id", state.acesso.id);
      if (updErr) throw updErr;

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Erro ao enviar respostas:", err);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar suas respostas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // -------- render --------

  if (state.status === "loading") {
    return (
      <BrandShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </BrandShell>
    );
  }

  if (state.status === "invalid") {
    return (
      <ErrorScreen
        title="Link inválido ou expirado"
        message="Este link expirou ou é inválido. Entre em contato com a PWR Gestão."
      />
    );
  }

  if (state.status === "already_done" || submitted) {
    return (
      <ErrorScreen
        title="Fit Cultural concluído"
        message="Você já completou o Fit Cultural. Obrigado!"
      />
    );
  }

  const firstName =
    state.candidato.candidate_name?.split(" ")[0] ?? "Candidato(a)";

  return (
    <div className="min-h-screen bg-white" style={{ color: "#1A2B5C" }}>
      {/* Hero */}
      <header
        className="w-full py-10 px-6"
        style={{
          backgroundColor: "#1A2B5C",
          borderBottom: "4px solid #E8571A",
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <img src={pwrLogo} alt="PWR Gestão" className="h-14 w-auto" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Fit Cultural PWR
            </h1>
            <p className="text-white/80 mt-1">
              Olá, {firstName} — vaga {state.job.title}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* Section 1 — Video */}
        {(state.fit?.titulo || embedUrl || state.fit?.descricao) && (
          <section className="space-y-4">
            {state.fit?.titulo && (
              <h2
                className="text-2xl font-bold"
                style={{ color: "#1A2B5C" }}
              >
                {state.fit.titulo}
              </h2>
            )}
            {embedUrl && (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <iframe
                  src={embedUrl}
                  title="Vídeo institucional PWR"
                  frameBorder={0}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: "100%", height: "100%", border: 0 }}
                />
              </div>
            )}
            {state.fit?.descricao && (
              <p
                className="text-base leading-relaxed whitespace-pre-line"
                style={{ color: "#444444" }}
              >
                {state.fit.descricao}
              </p>
            )}
          </section>
        )}

        {/* Section 2 — Questions */}
        {state.perguntas.length > 0 && (
          <section className="space-y-4">
            <div
              className="pl-3"
              style={{ borderLeft: "3px solid #E8571A" }}
            >
              <h2
                className="text-xl font-bold"
                style={{ color: "#1A2B5C" }}
              >
                Perguntas
              </h2>
              <p className="text-sm" style={{ color: "#666666" }}>
                Responda com sinceridade — não há respostas certas ou erradas.
              </p>
            </div>

            {state.perguntas.map((p, idx) => (
              <div
                key={p.id}
                className="bg-white p-6 space-y-4"
                style={{
                  borderRadius: 12,
                  border: "1px solid #E8E8E8",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: "#E8571A" }}
                  >
                    {idx + 1}
                  </span>
                  <p className="font-bold text-base" style={{ color: "#1A2B5C" }}>
                    {p.texto}
                    {p.obrigatoria && (
                      <span style={{ color: "#E8571A" }}> *</span>
                    )}
                  </p>
                </div>

                {p.tipo === "texto_longo" && (
                  <Textarea
                    rows={4}
                    value={answers[p.id] ?? ""}
                    onChange={(e) => setAnswer(p.id, e.target.value)}
                    placeholder="Escreva sua resposta..."
                    style={{
                      border: "1.5px solid #E0E0E0",
                      borderRadius: 10,
                    }}
                    className="focus-visible:ring-0 focus-visible:border-[#E8571A]"
                  />
                )}

                {p.tipo === "multipla_escolha" && (
                  <div className="space-y-2">
                    {(p.opcoes ?? []).map((op, opIdx) => {
                      const checked = answers[p.id] === op;
                      return (
                        <label
                          key={opIdx}
                          className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
                          style={{
                            border: "1.5px solid",
                            borderColor: checked ? "#E8571A" : "#E0E0E0",
                            borderRadius: 10,
                            backgroundColor: checked ? "#FFF4EE" : "#ffffff",
                          }}
                        >
                          <input
                            type="radio"
                            name={`p-${p.id}`}
                            checked={checked}
                            onChange={() => setAnswer(p.id, op)}
                            className="accent-[#E8571A]"
                            style={{ accentColor: "#E8571A" }}
                          />
                          <span style={{ color: "#1A2B5C" }}>{op}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {p.tipo === "escala" && (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const selected = answers[p.id] === String(n);
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setAnswer(p.id, String(n))}
                          className="flex-1 h-12 font-bold transition-all"
                          style={{
                            border: "1.5px solid",
                            borderColor: selected ? "#E8571A" : "#E0E0E0",
                            borderRadius: 10,
                            backgroundColor: selected ? "#E8571A" : "#ffffff",
                            color: selected ? "#ffffff" : "#1A2B5C",
                          }}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                )}

                {errors[p.id] && (
                  <p className="text-sm" style={{ color: "#E8571A" }}>
                    {errors[p.id]}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* LGPD */}
        <div
          className="p-4 flex items-start gap-3"
          style={{
            border: "1px solid #E8E8E8",
            borderRadius: 10,
            backgroundColor: "#FAFAFA",
          }}
        >
          <Checkbox
            id="lgpd"
            checked={acceptedTerms}
            onCheckedChange={(v) => {
              setAcceptedTerms(!!v);
              if (v) setTermsError(false);
            }}
            className="mt-1 data-[state=checked]:bg-[#E8571A] data-[state=checked]:border-[#E8571A]"
          />
          <label htmlFor="lgpd" className="text-sm" style={{ color: "#444444" }}>
            Autorizo o tratamento dos meus dados pessoais para fins do processo
            seletivo, conforme a{" "}
            <a
              href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#E8571A", fontWeight: 600 }}
            >
              Lei Geral de Proteção de Dados
            </a>
            .
          </label>
        </div>
        {termsError && (
          <p className="text-sm" style={{ color: "#E8571A" }}>
            Você precisa aceitar os termos para enviar suas respostas.
          </p>
        )}

        {/* Submit */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full text-white font-bold py-6"
          style={{
            backgroundColor: "#E8571A",
            borderRadius: 50,
            fontSize: "1rem",
          }}
        >
          {submitting ? "Enviando..." : "Enviar Respostas"}
        </Button>

        <p
          className="text-center text-xs mt-4"
          style={{ color: "#888888" }}
        >
          PWR Gestão · Processo Seletivo
        </p>
      </main>
    </div>
  );
}