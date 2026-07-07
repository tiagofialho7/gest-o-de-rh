import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, PlayCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useCandidateFitCultural,
  type FitCulturalByJob,
} from "@/hooks/useCandidateFitCultural";

const NAVY = "#1A2B5C";
const ANSWER = "#444444";

const getYoutubeId = (url: string | null): string | null => {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
};

const formatDate = (d: string | null) => {
  if (!d) return "-";
  return format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const StatusBadge = ({ status }: { status: FitCulturalByJob["status"] }) => {
  if (status === "respondido")
    return <Badge className="bg-green-600 hover:bg-green-600">Respondido</Badge>;
  if (status === "aguardando")
    return (
      <Badge variant="outline" className="border-orange-500 text-orange-600">
        Aguardando resposta
      </Badge>
    );
  return <Badge variant="secondary">Sem acesso enviado</Badge>;
};

const FitJobBlock = ({ item }: { item: FitCulturalByJob }) => {
  const ytId = getYoutubeId(item.video_url);

  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <StatusBadge status={item.status} />
        {item.status === "respondido" && item.submitted_at && (
          <span className="text-muted-foreground">
            Enviado em {formatDate(item.submitted_at)}
          </span>
        )}
        {item.status === "aguardando" && item.expires_at && (
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Expira em {formatDate(item.expires_at)}
          </span>
        )}
      </div>

      {ytId && (
        <a
          href={`https://www.youtube.com/watch?v=${ytId}`}
          target="_blank"
          rel="noreferrer"
          className="block relative group rounded-lg overflow-hidden border"
        >
          <img
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            alt={item.fit_titulo ?? "Vídeo Fit Cultural"}
            className="w-full h-auto"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
            <PlayCircle className="h-14 w-14 text-white drop-shadow-lg" />
          </div>
          {item.fit_titulo && (
            <div className="p-2 text-sm font-medium bg-background">
              {item.fit_titulo}
            </div>
          )}
        </a>
      )}

      {item.perguntas.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            {item.perguntas.map((p, idx) => (
              <div key={p.pergunta_id} className="space-y-1">
                <p className="font-bold text-sm" style={{ color: NAVY }}>
                  {idx + 1}. {p.texto}
                </p>
                <p
                  className="text-sm whitespace-pre-wrap"
                  style={{ color: ANSWER }}
                >
                  {p.resposta && p.resposta.trim().length > 0
                    ? p.resposta
                    : item.status === "respondido"
                      ? "— (sem resposta)"
                      : "Aguardando resposta"}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface Props {
  candidateEmail: string | null | undefined;
}

const CandidateFitCulturalTab = ({ candidateEmail }: Props) => {
  const { data, isLoading } = useCandidateFitCultural(candidateEmail);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum Fit Cultural encontrado para este candidato</p>
      </div>
    );
  }

  if (data.length === 1) {
    const item = data[0];
    return (
      <div className="space-y-3 pr-4">
        <h3 className="font-semibold text-base" style={{ color: NAVY }}>
          {item.job_title}
        </h3>
        <FitJobBlock item={item} />
      </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={data.map((d) => d.application_id)}
      className="pr-4"
    >
      {data.map((item) => (
        <AccordionItem key={item.application_id} value={item.application_id}>
          <AccordionTrigger className="text-left">
            <span className="font-semibold" style={{ color: NAVY }}>
              {item.job_title}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <FitJobBlock item={item} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default CandidateFitCulturalTab;