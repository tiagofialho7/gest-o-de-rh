import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useDepartments, type Department } from "@/hooks/useDepartments";
import { useDeleteDepartment } from "@/hooks/useDeleteDepartment";
import { useEmployees } from "@/hooks/useEmployees";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, ChevronDown, Edit, Plus, Trash2, Users, MoreHorizontal, Mail, Phone, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExcelImportDialog, type ImportResult } from "@/components/ExcelImportDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";

export default function Departments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canEdit } = useUserRole(user?.id);
  const { data: departments, isLoading } = useDepartments();
  const { data: employees } = useEmployees();
  const deleteMutation = useDeleteDepartment();
  const queryClient = useQueryClient();
  const { organization } = useRequireOrganization();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);

  const handleEdit = (department: Department) => {
    navigate(`/departments/${department.id}/edit`);
  };

  const handleCreate = () => {
    navigate("/departments/new");
  };

  const handleDeleteClick = (id: string) => {
    setDepartmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (departmentToDelete) {
      await deleteMutation.mutateAsync(departmentToDelete);
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const toggleDepartment = (id: string) => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getEmployeesForDepartment = (departmentId: string, managerId: string | null) => {
    if (!employees) return [];
    return employees.filter(
      (emp) =>
        emp.department_id === departmentId &&
        emp.id !== managerId &&
        emp.status === "active"
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Departamentos</h1>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Lista de Departamentos</CardTitle>
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Importar Excel
                </Button>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Departamento
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !departments || departments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum departamento cadastrado.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    {canEdit && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => {
                    const deptEmployees = getEmployeesForDepartment(
                      department.id,
                      department.manager_id
                    );
                    const isExpanded = expandedDepartments.has(department.id);

                    return (
                      <Collapsible key={department.id} asChild open={isExpanded}>
                        <>
                          <TableRow>
                            <TableCell className="p-2">
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => toggleDepartment(department.id)}
                                  className="h-6 w-6"
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell className="font-medium">{department.name}</TableCell>
                            <TableCell>{department.description || "-"}</TableCell>
                            <TableCell>
                              {department.manager?.full_name || department.manager?.email || "-"}
                            </TableCell>
                            <TableCell>
                              {department.email ? (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {department.email}
                                </span>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              {department.phone ? (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  {department.phone}
                                  {department.extension && ` (${department.extension})`}
                                </span>
                              ) : "-"}
                            </TableCell>
                            {canEdit && (
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(department)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteClick(department.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={canEdit ? 7 : 6} className="p-0">
                                <div className="px-6 py-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      Colaboradores ({deptEmployees.length})
                                    </span>
                                  </div>
                                  {deptEmployees.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                      Nenhum colaborador neste departamento.
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                      {deptEmployees.map((emp) => (
                                        <div
                                          key={emp.id}
                                          className="flex items-center gap-2 p-2 rounded-md bg-background border text-sm"
                                        >
                                          <span className="truncate">
                                            {emp.full_name || emp.email}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este departamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar Departamentos"
        description="Importe vários departamentos via planilha Excel."
        templateFileName="modelo-departamentos.xlsx"
        sheetName="Departamentos"
        columns={[
          { header: "Nome do Departamento", example: "Consultoria", required: true },
          { header: "Código", example: "CON" },
          { header: "Descrição", example: "Área de consultoria empresarial" },
        ]}
        notes={[
          "Nome do Departamento é obrigatório.",
          'A coluna "Código" será incluída no início da Descrição como "[CÓD] descrição" (o esquema atual não tem campo dedicado para código).',
          "Departamentos com nome duplicado serão sinalizados como aviso, mas não bloqueiam a importação.",
        ]}
        onImport={async (rows): Promise<ImportResult> => {
          const result: ImportResult = { success: 0, errors: [], warnings: [] };
          if (!organization?.id) {
            result.errors.push({ row: 0, message: "Organização não encontrada" });
            return result;
          }

          const existingNames = new Set(
            (departments || []).map((d) => d.name.trim().toLowerCase())
          );

          for (let i = 0; i < rows.length; i++) {
            const rowNum = i + 2; // header is row 1
            const r = rows[i];
            const name = (r["Nome do Departamento"] || "").trim();
            const code = (r["Código"] || "").trim();
            const desc = (r["Descrição"] || "").trim();

            if (!name) {
              result.errors.push({ row: rowNum, message: "Nome do Departamento é obrigatório" });
              continue;
            }

            if (existingNames.has(name.toLowerCase())) {
              result.warnings.push({ row: rowNum, message: `Departamento "${name}" já existe (importado mesmo assim)` });
            }

            const description = code
              ? `[${code}] ${desc}`.trim()
              : desc || null;

            const { error } = await supabase
              .from("departments")
              .insert({ name, description, organization_id: organization.id });

            if (error) {
              result.errors.push({ row: rowNum, message: error.message });
            } else {
              result.success++;
              existingNames.add(name.toLowerCase());
            }
          }

          queryClient.invalidateQueries({ queryKey: ["departments"] });
          return result;
        }}
      />
    </>
  );
}
