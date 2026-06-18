import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Pencil, Plus, Power } from "lucide-react";
import { useAllUnits, type UnitRecord } from "@/hooks/useAllUnits";
import { useCreateUnit } from "@/hooks/useCreateUnit";
import { useUpdateUnit } from "@/hooks/useUpdateUnit";
import { BRAZILIAN_STATES } from "@/constants/brazilData";
import { useToast } from "@/hooks/use-toast";

const NAVY = "#1A2B5C";
const ORANGE = "#E8571A";

const inputClass =
  "border-[1.5px] border-[#E0E0E0] rounded-lg focus-visible:ring-0 focus-visible:border-[#E8571A] focus-visible:outline-none";

const primaryBtnStyle = {
  backgroundColor: ORANGE,
  color: "#FFFFFF",
  borderRadius: 50,
  fontWeight: 700,
};

interface UnitFormState {
  name: string;
  address: string;
  city: string;
  state: string;
}

const emptyForm: UnitFormState = { name: "", address: "", city: "", state: "" };

const UnitsPage = () => {
  const { data: units, isLoading } = useAllUnits();
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UnitRecord | null>(null);
  const [form, setForm] = useState<UnitFormState>(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (unit: UnitRecord) => {
    setEditing(unit);
    setForm({
      name: unit.name,
      address: unit.address || "",
      city: unit.city,
      state: unit.state,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, endereço, cidade e estado.",
        variant: "destructive",
      });
      return;
    }

    if (editing) {
      await updateUnit.mutateAsync({
        id: editing.id,
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
      });
    } else {
      await createUnit.mutateAsync({
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
      });
    }
    setDialogOpen(false);
  };

  const toggleActive = async (unit: UnitRecord) => {
    await updateUnit.mutateAsync({ id: unit.id, is_active: !unit.is_active });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: NAVY }}>
              Unidades
            </h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie as unidades da sua organização.
            </p>
          </div>
          <Button onClick={openCreate} style={primaryBtnStyle} className="hover:opacity-90 px-6">
            <Plus className="h-4 w-4 mr-2" />
            Nova Unidade
          </Button>
        </div>

        <div className="rounded-xl border border-[#E0E0E0] bg-white overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !units || units.length === 0 ? (
            <div className="p-12 text-center bg-[#F5F5F5]">
              <MapPin className="size-10 mx-auto mb-3" style={{ color: ORANGE }} />
              <p className="font-bold mb-1" style={{ color: NAVY }}>
                Nenhuma unidade cadastrada
              </p>
              <p className="text-sm text-[#666] mb-5">
                Comece criando a primeira unidade da sua organização.
              </p>
              <Button onClick={openCreate} style={primaryBtnStyle} className="hover:opacity-90 px-6">
                <Plus className="h-4 w-4 mr-2" />
                Nova Unidade
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F5F5]">
                  <TableHead style={{ color: NAVY }}>Nome</TableHead>
                  <TableHead style={{ color: NAVY }}>Endereço</TableHead>
                  <TableHead style={{ color: NAVY }}>Cidade</TableHead>
                  <TableHead style={{ color: NAVY }}>Estado</TableHead>
                  <TableHead style={{ color: NAVY }}>Status</TableHead>
                  <TableHead className="w-[140px] text-right" style={{ color: NAVY }}>
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium" style={{ color: NAVY }}>
                      {unit.name}
                    </TableCell>
                    <TableCell className="text-[#444]">{unit.address || "—"}</TableCell>
                    <TableCell className="text-[#444]">{unit.city}</TableCell>
                    <TableCell className="text-[#444]">{unit.state}</TableCell>
                    <TableCell>
                      {unit.is_active ? (
                        <Badge
                          className="border-0 text-white"
                          style={{ backgroundColor: ORANGE }}
                        >
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[#666] border-[#E0E0E0]">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(unit)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" style={{ color: NAVY }} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(unit)}
                          aria-label={unit.is_active ? "Desativar" : "Ativar"}
                        >
                          <Power
                            className="h-4 w-4"
                            style={{ color: unit.is_active ? ORANGE : "#888" }}
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: NAVY }}>
              {editing ? "Editar Unidade" : "Nova Unidade"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit-name">Nome *</Label>
              <Input
                id="unit-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Unidade São Paulo"
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-address">Endereço *</Label>
              <Input
                id="unit-address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Rua, número, bairro, CEP"
                className={inputClass}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="unit-city">Cidade *</Label>
                <Input
                  id="unit-city"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Cidade"
                  className={inputClass}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-state">Estado *</Label>
                <Select
                  value={form.state}
                  onValueChange={(v) => setForm((f) => ({ ...f, state: v }))}
                >
                  <SelectTrigger className={inputClass} id="unit-state">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((s) => (
                      <SelectItem key={s.uf} value={s.uf}>
                        {s.uf} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-[50px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createUnit.isPending || updateUnit.isPending}
                style={primaryBtnStyle}
                className="hover:opacity-90 px-6"
              >
                {editing ? "Salvar alterações" : "Criar unidade"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default UnitsPage;