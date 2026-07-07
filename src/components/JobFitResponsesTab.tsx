import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useJobFitResponses,
  type JobFitCandidateResponse,
} from "@/hooks/useJobFitResponses";

const NAVY = "#1A2B5C";
const ORANGE = "#E8571A";
const ANSWER = "#444444";

const fmt = (d: string) =>
  d ? format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "-";

interface Props {
  jobId: string;
}

const JobFitResponsesTab = ({ jobId }: Props) => {
  const { data, isLoading } = useJobFitResponses(jobId);
  const [selected, setSelected] = useState<JobFitCandidateResponse | null>(null);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum candidato respondeu ao Fit Cultural desta vaga ainda.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: `${NAVY}0D` }}>
              <TableHead style={{ color: NAVY }} className="font-semibold">
                Candidato
              </TableHead>
              <TableHead style={{ color: NAVY }} className="font-semibold">
                Data de envio
              </TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((c) => (
              <TableRow key={c.application_id}>
                <TableCell>
                  <div className="font-medium">{c.candidate_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.candidate_email}
                  </div>
                </TableCell>
                <TableCell>{fmt(c.submitted_at)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => setSelected(c)}
                    style={{ backgroundColor: ORANGE, borderRadius: 999 }}
                    className="text-white hover:opacity-90"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Respostas
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: NAVY }}>
              {selected?.candidate_name}
            </DialogTitle>
            <DialogDescription>
              Respostas enviadas em {selected ? fmt(selected.submitted_at) : ""}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-5 py-2">
              {selected?.answers.map((a, idx) => (
                <div key={a.pergunta_id} className="space-y-1">
                  <p className="font-bold text-sm" style={{ color: NAVY }}>
                    {idx + 1}. {a.texto}
                  </p>
                  <p
                    className="text-sm whitespace-pre-wrap"
                    style={{ color: ANSWER }}
                  >
                    {a.resposta && a.resposta.trim().length > 0
                      ? a.resposta
                      : "— (sem resposta)"}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobFitResponsesTab;