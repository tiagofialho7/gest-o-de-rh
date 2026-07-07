import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import pwrLogo from "@/assets/pwr-logo.png";

type PerguntaTipo = "texto_longo" | "multipla_escolha" | "escala";

interface Pergunta {
  id: string;
  texto: string;
  tipo: PerguntaTipo;
  opcoes: string[] | null;
  obrigatoria: boolean;
}

const MOCK = {
  candidateName: "João Silva",
  jobTitle: "Trainee",
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  titulo: "Fit Cultural PWR",
  descricao:
    "Antes de responder as perguntas, assista ao vídeo abaixo. Ele foi gravado pelo nosso CEO e explica tudo sobre quem somos e o que acreditamos.",
  perguntas: [
    { id: "1", texto: "Por que você quer fazer parte do time PWR?", tipo: "texto_longo", opcoes: null, obrigatoria: true },
    { id: "2", texto: "O que significa para você Nunca Parar?", tipo: "texto_longo", opcoes: null, obrigatoria: true },
    { id: "3", texto: "Como você lida com metas desafiadoras?", tipo: "texto_longo", opcoes: null, obrigatoria: true },
    { id: "4", texto: "Em qual nível você avalia sua ambição profissional?", tipo: "escala", opcoes: null, obrigatoria: true },
    { id: "5", texto: "O que mais te identificou no vídeo que assistiu?", tipo: "texto_longo", opcoes: null, obrigatoria: true },
  ] as Pergunta[],
};

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.replace("/", "")}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
  } catch {
    return null;
  }
  return null;
}

export default function FitCulturalPreviewPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const embedUrl = toYouTubeEmbed(MOCK.videoUrl);
  const firstName = MOCK.candidateName.split(" ")[0];

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      const { [id]: _drop, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    for (const p of MOCK.perguntas) {
      if (p.obrigatoria && !answers[p.id]?.trim()) {
        newErrors[p.id] = "Esta pergunta é obrigatória.";
      }
    }
    setErrors(newErrors);
    if (!acceptedTerms) setTermsError(true);
    if (Object.keys(newErrors).length > 0 || !acceptedTerms) return;
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white" style={{ color: "#1A2B5C" }}>
        <header
          className="w-full py-10 px-6"
          style={{ backgroundColor: "#1A2B5C", borderBottom: "4px solid #E8571A" }}
        >
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <img src={pwrLogo} alt="PWR Gestão" className="h-12 w-auto" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">Fit Cultural PWR</h1>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-10">
          <div
            className="rounded-xl p-8 text-center"
            style={{ border: "1px solid #E8E8E8", borderLeft: "4px solid #E8571A" }}
          >
            <h2 className="text-xl font-bold mb-3" style={{ color: "#1A2B5C" }}>
              Respostas enviadas com sucesso!
            </h2>
            <p style={{ color: "#444444" }}>
              (Preview — nenhum dado foi salvo no banco.)
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ color: "#1A2B5C" }}>
      <div
        className="w-full text-center text-xs py-2 font-semibold"
        style={{ backgroundColor: "#FFF4EE", color: "#E8571A" }}
      >
        PREVIEW — visualização com dados fictícios (nada é salvo)
      </div>
      <header
        className="w-full py-10 px-6"
        style={{ backgroundColor: "#1A2B5C", borderBottom: "4px solid #E8571A" }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <img src={pwrLogo} alt="PWR Gestão" className="h-14 w-auto" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Fit Cultural PWR</h1>
            <p className="text-white/80 mt-1">
              Olá, {firstName} — vaga {MOCK.jobTitle}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold" style={{ color: "#1A2B5C" }}>
            {MOCK.titulo}
          </h2>
          {embedUrl && (
            <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 12, overflow: "hidden" }}>
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
          <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: "#444444" }}>
            {MOCK.descricao}
          </p>
        </section>

        <section className="space-y-4">
          <div className="pl-3" style={{ borderLeft: "3px solid #E8571A" }}>
            <h2 className="text-xl font-bold" style={{ color: "#1A2B5C" }}>Perguntas</h2>
            <p className="text-sm" style={{ color: "#666666" }}>
              Responda com sinceridade — não há respostas certas ou erradas.
            </p>
          </div>

          {MOCK.perguntas.map((p, idx) => (
            <div
              key={p.id}
              className="bg-white p-6 space-y-4"
              style={{ borderRadius: 12, border: "1px solid #E8E8E8" }}
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
                  {p.obrigatoria && <span style={{ color: "#E8571A" }}> *</span>}
                </p>
              </div>

              {p.tipo === "texto_longo" && (
                <Textarea
                  rows={4}
                  value={answers[p.id] ?? ""}
                  onChange={(e) => setAnswer(p.id, e.target.value)}
                  placeholder="Escreva sua resposta..."
                  style={{ border: "1.5px solid #E0E0E0", borderRadius: 10 }}
                  className="focus-visible:ring-0 focus-visible:border-[#E8571A]"
                />
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

        <div
          className="p-4 flex items-start gap-3"
          style={{ border: "1px solid #E8E8E8", borderRadius: 10, backgroundColor: "#FAFAFA" }}
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
            Autorizo o tratamento dos meus dados pessoais para fins do processo seletivo, conforme a{" "}
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

        <Button
          type="button"
          onClick={handleSubmit}
          className="w-full text-white font-bold py-6"
          style={{ backgroundColor: "#E8571A", borderRadius: 50, fontSize: "1rem" }}
        >
          Enviar Respostas
        </Button>

        <p className="text-center text-xs mt-4" style={{ color: "#888888" }}>
          PWR Gestão · Processo Seletivo
        </p>
      </main>
    </div>
  );
}