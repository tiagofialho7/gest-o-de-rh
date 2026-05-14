import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, MoreHorizontal, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePositions } from "@/hooks/usePositions";
import { useDeletePosition } from "@/hooks/useDeletePosition";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { ExcelImportDialog, type ImportResult } from "@/components/ExcelImportDialog";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type SeniorityLevel = Database["public"]["Enums"]["seniority_level"];

const LEVEL_MAP: Record<string, SeniorityLevel> = {
  estagiario: "estagiario",
  estagiário: "estagiario",
  trainee: "junior", // mapped: enum doesn't have trainee
  junior: "junior",
  júnior: "junior",
  pleno: "pleno",
  senior: "senior",
  sênior: "senior",
  especialista: "especialista",
  lider: "lider",
  líder: "lider",
};


export default function Positions() {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: positions, isLoading } = usePositions();
  const deletePosition = useDeletePosition();
  const { user } = useAuth();
  const { canEdit } = useUserRole(user?.id);
  const { organization } = useRequireOrganization();
  const queryClient = useQueryClient();

  const handleEdit = (id: string) => {
    navigate(`/positions/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    setPositionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (positionToDelete) {
      deletePosition.mutate(positionToDelete);
      setDeleteDialogOpen(false);
      setPositionToDelete(null);
    }
  };


  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cargos</h1>
          <p className="text-muted-foreground">
            Gerencie os cargos e níveis da empresa
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Lista de Cargos</CardTitle>
            <div className="flex gap-2">
              {canEdit && (
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Importar Excel
                </Button>
              )}
              <Button onClick={() => navigate("/positions/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cargo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Níveis</TableHead>
                  <TableHead>Regime</TableHead>
                  <TableHead>Perfil Esperado</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-[200px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[60px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[250px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-[100px] ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : positions && positions.length > 0 ? (
                  positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">{position.title}</TableCell>
                      <TableCell>
                        {position.has_levels ? (
                          <Badge variant="secondary">Com níveis</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {position.employment_regime ? (
                          <Badge variant="outline" className="uppercase">
                            {position.employment_regime === "socio" ? "Sócio" : position.employment_regime}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {position.expected_profile_code ? (
                          <Badge variant="outline">{position.expected_profile_code}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {position.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(position.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(position.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum cargo cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>


        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este cargo? Esta ação não pode ser
                desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ExcelImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Cargos"
          description="Importe vários cargos via planilha Excel."
          templateFileName="modelo-cargos.xlsx"
          sheetName="Cargos"
          columns={[
            { header: "Nome do Cargo", example: "Consultor de Gestão", required: true },
            { header: "Nível", example: "Pleno" },
            { header: "Departamento", example: "Consultoria" },
            { header: "Regime", example: "CLT" },
            { header: "Descrição", example: "Responsável por projetos de gestão empresarial" },
          ]}
          notes={[
            "Nome do Cargo é obrigatório.",
            "Níveis válidos: Estagiário, Trainee, Júnior, Pleno, Sênior, Especialista, Líder.",
            'Quando informado, o Nível cria automaticamente um registro de senioridade vinculado ao cargo. "Trainee" é mapeado para "Júnior".',
            'A coluna "Departamento" é informativa (será adicionada à descrição entre colchetes), pois cargos não são vinculados a departamentos no sistema atual.',
            'Regime aceita: CLT, PJ ou Sócio (opcional).',
            "Cargos com nome duplicado serão sinalizados como aviso, mas não bloqueiam a importação.",
          ]}
          onImport={async (rows): Promise<ImportResult> => {
            const result: ImportResult = { success: 0, errors: [], warnings: [] };
            if (!organization?.id) {
              result.errors.push({ row: 0, message: "Organização não encontrada" });
              return result;
            }

            const existingTitles = new Set(
              (positions || []).map((p) => p.title.trim().toLowerCase())
            );

            for (let i = 0; i < rows.length; i++) {
              const rowNum = i + 2;
              const r = rows[i];
              const title = (r["Nome do Cargo"] || "").trim();
              const levelRaw = (r["Nível"] || "").trim();
              const dept = (r["Departamento"] || "").trim();
              const desc = (r["Descrição"] || "").trim();
              const regimeRaw = (r["Regime"] || "").trim().toLowerCase();
              const REGIME_MAP: Record<string, "clt" | "pj" | "socio"> = {
                clt: "clt",
                pj: "pj",
                socio: "socio",
                "sócio": "socio",
              };
              let employment_regime: "clt" | "pj" | "socio" | null = null;
              if (regimeRaw) {
                const m = REGIME_MAP[regimeRaw];
                if (!m) {
                  result.errors.push({
                    row: rowNum,
                    message: `Regime inválido "${r["Regime"]}". Use: CLT, PJ ou Sócio.`,
                  });
                  continue;
                }
                employment_regime = m;
              }

              if (!title) {
                result.errors.push({ row: rowNum, message: "Nome do Cargo é obrigatório" });
                continue;
              }

              let seniority: SeniorityLevel | null = null;
              if (levelRaw) {
                const mapped = LEVEL_MAP[levelRaw.toLowerCase()];
                if (!mapped) {
                  result.errors.push({
                    row: rowNum,
                    message: `Nível inválido "${levelRaw}". Use: Estagiário, Trainee, Júnior, Pleno, Sênior, Especialista, Líder.`,
                  });
                  continue;
                }
                seniority = mapped;
                if (levelRaw.toLowerCase() === "trainee") {
                  result.warnings.push({
                    row: rowNum,
                    message: 'Nível "Trainee" mapeado para "Júnior" (enum do sistema).',
                  });
                }
              }

              if (existingTitles.has(title.toLowerCase())) {
                result.warnings.push({
                  row: rowNum,
                  message: `Cargo "${title}" já existe (importado mesmo assim)`,
                });
              }

              const description = dept ? `[${dept}] ${desc}`.trim() : desc || null;
              const has_levels = !!seniority;

              const { data: inserted, error } = await supabase
                .from("positions")
                .insert({
                  title,
                  description,
                  has_levels,
                  employment_regime,
                  organization_id: organization.id,
                })
                .select("id")
                .single();

              if (error) {
                result.errors.push({ row: rowNum, message: error.message });
                continue;
              }

              if (seniority && inserted) {
                const { error: lvlError } = await supabase
                  .from("position_seniority_levels")
                  .insert({
                    position_id: inserted.id,
                    seniority,
                  });
                if (lvlError) {
                  result.warnings.push({
                    row: rowNum,
                    message: `Cargo criado, mas falhou ao adicionar nível: ${lvlError.message}`,
                  });
                }
              }

              result.success++;
              existingTitles.add(title.toLowerCase());
            }

            queryClient.invalidateQueries({ queryKey: ["positions"] });
            return result;
          }}
        />

      </div>
    </Layout>
  );
}
