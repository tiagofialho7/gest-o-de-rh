import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown, X, Youtube } from "lucide-react";
import type { JobFormData, PerguntaFitTipo } from "@/types/job";

interface JobStepFitCulturalProps {
  form: UseFormReturn<JobFormData>;
}

const TIPO_LABELS: Record<PerguntaFitTipo, string> = {
  texto_longo: "Texto livre",
  multipla_escolha: "Múltipla escolha",
  escala: "Escala 1–5",
};

export function JobStepFitCultural({ form }: JobStepFitCulturalProps) {
  const { fields, append, remove, move, update } = useFieldArray({
    control: form.control,
    name: "perguntas_fit",
  });

  const handleAdd = () => {
    append({
      texto: "",
      tipo: "texto_longo",
      opcoes: [],
      obrigatoria: true,
      ordem: fields.length,
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Fit Cultural PWR</h2>
        <p className="text-muted-foreground">
          Configure o vídeo institucional e as perguntas personalizadas que serão
          apresentadas ao candidato na etapa de Fit Cultural.
        </p>
      </div>

      {/* Bloco Vídeo */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5" style={{ color: "#E8571A" }} />
            <h3 className="font-semibold text-base">Vídeo & Introdução</h3>
          </div>

          <div>
            <Label>Título do Fit Cultural *</Label>
            <Input
              placeholder="Ex: Fit Cultural PWR"
              {...form.register("fit_cultural_titulo")}
            />
          </div>

          <div>
            <Label>Link do Vídeo (YouTube) *</Label>
            <Input
              placeholder="https://youtube.com/watch?v=..."
              {...form.register("fit_cultural_video_url")}
            />
            {form.formState.errors.fit_cultural_video_url && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.fit_cultural_video_url.message as string}
              </p>
            )}
          </div>

          <div>
            <Label>Descrição / Introdução</Label>
            <Textarea
              rows={4}
              placeholder="Texto exibido ao candidato acima das perguntas"
              {...form.register("fit_cultural_descricao")}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="fit-ativo" className="text-sm">
              Fit Cultural ativo para esta vaga
            </Label>
            <Switch
              id="fit-ativo"
              checked={form.watch("fit_cultural_ativo")}
              onCheckedChange={(v) => form.setValue("fit_cultural_ativo", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bloco Perguntas */}
      <div className="space-y-4">
        <div
          className="pl-3"
          style={{ borderLeft: "3px solid #E8571A" }}
        >
          <h3
            className="font-bold text-lg"
            style={{ color: "#1A2B5C" }}
          >
            Perguntas Personalizadas
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione perguntas que ajudam a avaliar o alinhamento do candidato com
            a cultura da empresa.
          </p>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
            Nenhuma pergunta cadastrada.
          </p>
        )}

        {fields.map((field, index) => {
          const pergunta = form.watch(`perguntas_fit.${index}`);
          const isMultipla = pergunta?.tipo === "multipla_escolha";

          return (
            <Card key={field.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold"
                      style={{ backgroundColor: "#1A2B5C" }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">Pergunta</span>
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

                <div>
                  <Label>Texto da pergunta *</Label>
                  <Textarea
                    rows={2}
                    placeholder="Ex: Descreva uma situação em que você teve que se adaptar rapidamente..."
                    {...form.register(`perguntas_fit.${index}.texto` as const)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Tipo de resposta</Label>
                    <Select
                      value={pergunta?.tipo ?? "texto_longo"}
                      onValueChange={(v) =>
                        update(index, {
                          ...pergunta,
                          tipo: v as PerguntaFitTipo,
                          opcoes: v === "multipla_escolha" ? pergunta?.opcoes ?? [] : [],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TIPO_LABELS) as PerguntaFitTipo[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {TIPO_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end justify-between">
                    <Label htmlFor={`obrig-${index}`} className="text-sm">
                      Resposta obrigatória
                    </Label>
                    <Switch
                      id={`obrig-${index}`}
                      checked={pergunta?.obrigatoria ?? true}
                      onCheckedChange={(v) =>
                        update(index, { ...pergunta, obrigatoria: v })
                      }
                    />
                  </div>
                </div>

                {isMultipla && (
                  <div className="space-y-2">
                    <Label>Opções</Label>
                    {(pergunta?.opcoes ?? []).map((op, opIdx) => (
                      <div key={opIdx} className="flex items-center gap-2">
                        <Input
                          value={op}
                          onChange={(e) => {
                            const next = [...(pergunta?.opcoes ?? [])];
                            next[opIdx] = e.target.value;
                            update(index, { ...pergunta, opcoes: next });
                          }}
                          placeholder={`Opção ${opIdx + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const next = (pergunta?.opcoes ?? []).filter(
                              (_, i) => i !== opIdx
                            );
                            update(index, { ...pergunta, opcoes: next });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        update(index, {
                          ...pergunta,
                          opcoes: [...(pergunta?.opcoes ?? []), ""],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar opção
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Button
          type="button"
          onClick={handleAdd}
          className="w-full text-white font-semibold"
          style={{ backgroundColor: "#E8571A", borderRadius: "50px" }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Pergunta
        </Button>
      </div>
    </div>
  );
}