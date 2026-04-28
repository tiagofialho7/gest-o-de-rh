import { useState, useRef } from "react";
import ExcelJS from "exceljs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export type ExcelColumn = {
  header: string;
  example: string;
  required?: boolean;
};

export type ImportResult = {
  success: number;
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
};

type ExcelImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  templateFileName: string;
  sheetName: string;
  columns: ExcelColumn[];
  onImport: (rows: Record<string, string>[]) => Promise<ImportResult>;
  notes?: string[];
};

export function ExcelImportDialog({
  open,
  onOpenChange,
  title,
  description,
  templateFileName,
  sheetName,
  columns,
  onImport,
  notes,
}: ExcelImportDialogProps) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRows([]);
    setFileName("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) reset();
    onOpenChange(newOpen);
  };

  const downloadTemplate = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(sheetName);

    ws.addRow(columns.map((c) => c.header));
    ws.addRow(columns.map((c) => c.example));

    // Style header
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };
    });

    // Auto width
    ws.columns.forEach((col, i) => {
      const header = columns[i]?.header || "";
      const example = columns[i]?.example || "";
      col.width = Math.max(header.length, example.length, 15) + 4;
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf);
      const ws = wb.worksheets[0];
      if (!ws || ws.rowCount < 2) {
        toast.error("Arquivo vazio ou sem dados.");
        return;
      }
      const headerRow = ws.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value ?? "").trim();
      });

      const parsed: Record<string, string>[] = [];
      for (let i = 2; i <= ws.rowCount; i++) {
        const row = ws.getRow(i);
        const obj: Record<string, string> = {};
        let hasData = false;
        headers.forEach((h, idx) => {
          const v = row.getCell(idx + 1).value;
          const str = v == null ? "" : String(typeof v === "object" && "text" in (v as object) ? (v as { text: string }).text : v).trim();
          if (str !== "") hasData = true;
          obj[h] = str;
        });
        if (hasData) parsed.push(obj);
      }

      if (parsed.length === 0) {
        toast.error("Nenhuma linha com dados encontrada.");
        return;
      }

      setRows(parsed);
      setFileName(file.name);
      setResult(null);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao ler arquivo Excel.");
    }
  };

  const handleConfirm = async () => {
    setIsImporting(true);
    try {
      const r = await onImport(rows);
      setResult(r);
      if (r.errors.length === 0) {
        toast.success(`${r.success} registro(s) importado(s) com sucesso.`);
      } else {
        toast.warning(`${r.success} sucesso, ${r.errors.length} com erro.`);
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Erro na importação");
    } finally {
      setIsImporting(false);
    }
  };

  const previewRows = rows.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Modelo Excel</p>
                <p className="text-muted-foreground">
                  Baixe o modelo, preencha os dados e faça upload abaixo.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar modelo
            </Button>
          </div>

          {notes && notes.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Observações</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  {notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Upload area */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm mb-3">
              {fileName ? (
                <span className="font-medium">{fileName}</span>
              ) : (
                "Selecione o arquivo .xlsx preenchido"
              )}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {fileName ? "Trocar arquivo" : "Selecionar arquivo"}
            </Button>
          </div>

          {/* Preview */}
          {rows.length > 0 && !result && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Preview ({Math.min(5, rows.length)} de {rows.length} linha
                {rows.length === 1 ? "" : "s"})
              </p>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((c) => (
                        <TableHead key={c.header}>{c.header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((r, i) => (
                      <TableRow key={i}>
                        {columns.map((c) => (
                          <TableCell key={c.header} className="text-sm">
                            {r[c.header] || "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Alert variant={result.errors.length === 0 ? "default" : "destructive"}>
                {result.errors.length === 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>Resultado da importação</AlertTitle>
                <AlertDescription>
                  {result.success} registro(s) importado(s) com sucesso,{" "}
                  {result.errors.length} com erro
                  {result.warnings.length > 0
                    ? `, ${result.warnings.length} aviso(s)`
                    : ""}
                  .
                </AlertDescription>
              </Alert>

              {result.errors.length > 0 && (
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">Erros:</p>
                  <ul className="text-sm space-y-1">
                    {result.errors.map((err, i) => (
                      <li key={i} className="text-destructive">
                        Linha {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">Avisos:</p>
                  <ul className="text-sm space-y-1">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="text-muted-foreground">
                        Linha {w.row}: {w.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={() => handleClose(false)}>Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={rows.length === 0 || isImporting}
              >
                {isImporting ? "Importando..." : "Confirmar importação"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}