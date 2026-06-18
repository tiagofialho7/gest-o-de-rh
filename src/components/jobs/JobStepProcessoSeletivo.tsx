import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, ArrowUp, ArrowDown, Info, Youtube } from "lucide-react";
import type { JobFormData } from "@/types/job";

interface JobStepProcessoSeletivoProps {
  form: UseFormReturn<JobFormData>;
}

const isFitCultural = (nome: string) =>
  nome.toLowerCase().includes("fit cultural");

export function JobStepProcessoSeletivo({ form }: JobStepProcessoSeletivoProps) {
  const { fields, append, remove, move, update } = useFieldArray({
    control: form.control,
    name: "stages",
  });

  const youtubeUrl = form.watch("youtube_url");

  const handleAdd = () => {
    append({
      nome: "",
      descricao: "",
      mensagem_email: "",
      enviar_email: true,
      ordem: fields.length,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Processo Seletivo</h2>
        <p className="text-muted-foreground">
          Configure as etapas do processo seletivo desta vaga. Cada etapa pode disparar
          um e-mail automático ao candidato quando ele for movido para ela.
        </p>
      </div>

      {!youtubeUrl && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Dica: adicione o <strong>Link do Vídeo Institucional (YouTube)</strong> na
            etapa <em>Básico</em> para que ele seja incluído automaticamente em etapas
            chamadas “Fit Cultural”.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
            Nenhuma etapa cadastrada. Adicione a primeira etapa do seu processo seletivo.
          </p>
        )}

        {fields.map((field, index) => {
          const stage = form.watch(`stages.${index}`);
          const isFit = isFitCultural(stage?.nome || "");
          return (
            <Card key={field.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold"
                      style={{ backgroundColor: "#E8571A" }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">Etapa</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label>Nome da etapa *</Label>
                    <Input
                      placeholder='Ex: "Triagem", "Fit Cultural PWR", "Entrevista Técnica"'
                      {...form.register(`stages.${index}.nome` as const)}
                    />
                  </div>

                  <div>
                    <Label>Descrição (interna)</Label>
                    <Input
                      placeholder="Notas internas sobre esta etapa"
                      {...form.register(`stages.${index}.descricao` as const)}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Mensagem de e-mail ao candidato</Label>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`enviar-${index}`}
                          className="text-xs text-muted-foreground"
                        >
                          Enviar e-mail nesta etapa
                        </Label>
                        <Switch
                          id={`enviar-${index}`}
                          checked={stage?.enviar_email ?? true}
                          onCheckedChange={(v) =>
                            update(index, { ...stage, enviar_email: v })
                          }
                        />
                      </div>
                    </div>
                    <Textarea
                      rows={5}
                      placeholder="Esta mensagem será enviada por e-mail ao candidato ao ser movido para esta etapa."
                      {...form.register(`stages.${index}.mensagem_email` as const)}
                    />
                    {isFit && (
                      <Alert className="mt-2 border-[#E8571A]/30 bg-[#E8571A]/5">
                        <Youtube className="h-4 w-4 text-[#E8571A]" />
                        <AlertDescription className="text-xs">
                          O link do vídeo institucional será incluído automaticamente
                          nesta etapa.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button type="button" variant="outline" onClick={handleAdd} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar etapa
        </Button>
      </div>
    </div>
  );
}