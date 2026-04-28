import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Search,
  MapPin,
  ChevronRight,
  Instagram,
  Linkedin,
  Globe,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import pwrLogo from "@/assets/pwr-logo.png";
import pwrBanner from "@/assets/pwr-banner.png";

const PWR_SLUG = "pwr-gestao";

const WORK_MODEL_LABELS: Record<string, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};

const CONTRACT_LABELS: Record<string, string> = {
  clt: "CLT",
  pj: "PJ",
  internship: "Estágio",
  temporary: "Temporário",
  freelancer: "Freelancer",
};

interface PwrJob {
  id: string;
  title: string;
  description: string | null;
  work_model: string | null;
  contract_type: string | null;
  seniority: string | null;
  created_at: string;
  department: string | null;
  unit_city: string | null;
  unit_state: string | null;
}

function usePwrJobs() {
  return useQuery({
    queryKey: ["pwr-careers-jobs"],
    queryFn: async (): Promise<PwrJob[]> => {
      // Try to fetch the PWR organization first; fall back to all active jobs
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", PWR_SLUG)
        .maybeSingle();

      let query = supabase
        .from("jobs")
        .select(
          `id, title, description, work_model, contract_type, seniority, created_at,
           departments:department_id (name),
           units:unit_id (city, state)`
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (org?.id) query = query.eq("organization_id", org.id);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((j: any) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        work_model: j.work_model,
        contract_type: j.contract_type,
        seniority: j.seniority,
        created_at: j.created_at,
        department: j.departments?.name ?? null,
        unit_city: j.units?.city ?? null,
        unit_state: j.units?.state ?? null,
      }));
    },
  });
}

const PwrCareers = () => {
  const { data: jobs, isLoading } = usePwrJobs();

  const [search, setSearch] = useState("");
  const [workModel, setWorkModel] = useState<string>("all");
  const [contractType, setContractType] = useState<string>("all");
  const [department, setDepartment] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");

  const departments = useMemo(
    () => Array.from(new Set((jobs || []).map((j) => j.department).filter(Boolean))) as string[],
    [jobs]
  );
  const locations = useMemo(() => {
    const set = new Set<string>();
    (jobs || []).forEach((j) => {
      if (j.unit_city) {
        set.add(j.unit_state ? `${j.unit_city} - ${j.unit_state}` : j.unit_city);
      }
    });
    return Array.from(set);
  }, [jobs]);

  const filtered = (jobs || []).filter((j) => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (workModel !== "all" && j.work_model !== workModel) return false;
    if (contractType !== "all" && j.contract_type !== contractType) return false;
    if (department !== "all" && j.department !== department) return false;
    if (location !== "all") {
      const loc = j.unit_state ? `${j.unit_city} - ${j.unit_state}` : j.unit_city || "";
      if (loc !== location) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER + BANNER */}
      <header className="bg-[hsl(225,55%,15%)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={pwrLogo} alt="PWR Gestão" className="h-12 w-auto bg-white rounded-md p-1.5" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <a href="#sobre" className="hover:text-white transition-colors">Sobre</a>
            <a href="#vagas" className="hover:text-white transition-colors">Vagas</a>
            <a href="https://pwrgestao.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Site</a>
          </nav>
        </div>
        <div className="relative">
          <img src={pwrBanner} alt="Venha fazer parte dessa jornada" className="w-full h-auto block" />
        </div>
      </header>

      {/* SOBRE */}
      <section id="sobre" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-[hsl(20,100%,55%)] hover:bg-[hsl(20,100%,55%)] text-white border-0">
              #NuncaParar
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[hsl(225,55%,15%)] dark:text-foreground">
              NÓS SOMOS O TIME QUE <span className="text-[hsl(20,100%,55%)]">NUNCA PARA</span>
            </h2>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed space-y-5 [&_p]:text-justify">
            <p>
              Somos um tipo diferente de pessoas. Não somos o gênio iluminado, muito menos o artista com um dom especial, nós somos apenas os que <strong>NUNCA PARAM</strong>. Ganhamos, conquistamos, nos apossamos do que queremos não por um milagre, mas pelo suor que derramamos no processo. Não paramos, não descansamos, até conseguir.
            </p>
            <p>
              Se o sucesso é um esporte para poucos, pagamos nosso ingresso com dedicação e entrega muito acima de média. Por sinal, vamos falar "da média", ela não nos interessa, não é lá que nossos sonhos moram, não é lá que queremos estar, não é para lá que vamos. Explicamos isso pelo ritmo, o ritmo que levamos a vida, e ele já é naturalmente alto.
            </p>
            <p>
              E não… não estamos falando apenas de trabalho, de dinheiro, estamos falando de viver, da vida como um todo, o ritmo que você coloca, na sua vida. <strong>NUNCA PARAR</strong> é uma filosofia que engloba tudo que você faz, de como se diverte a como cresce profissionalmente.
            </p>
            <p>
              Se somos radicais? Talvez. Mas, eu prefiro chamar isso de integridade, agimos fortemente de acordo com o que acreditamos, em todas as esferas de nossas vidas. Corremos atrás do que queremos, na verdade, corremos na frente, na direção, na busca, de forma obstinada e constante, sem <strong>NUNCA PARAR</strong>.
            </p>
            <p>
              Acreditamos fortemente que a ação gera a motivação e não o contrário, por isso o movimento, o ritmo, a constância, nos diferenciam. Quando todos estão parados, nós ainda estamos começando. Somos sempre os últimos a sair da sala.
            </p>
            <p>
              A derrota é outro fator diferente para nós, na verdade, nós nunca somos derrotados, não porque ganhamos sempre, mas porque nunca desistimos. Nós sempre tentamos mais uma vez, se hoje não foi possível, amanhã tentaremos de novo, e se não for possível amanhã o depois de amanhã existe para tentarmos outra vez, <strong>NUNCA PARAMOS</strong>. Não há derrota se não há desistência.
            </p>
            <p>
              O tempo não é nosso inimigo, pois parar não é uma opção, e não vamos gerar ilusões de facilidade: o caminho é difícil, ele testa, ele filtra, ele seleciona. E, de verdade, melhor assim. Um grupo seleto sempre foi mais eficiente do que uma multidão incapaz. Um grupo que <strong>NUNCA PARA</strong>.
            </p>
            <p className="text-xl font-semibold text-center text-[hsl(225,55%,15%)] dark:text-foreground">
              E se eu pudesse lhe dar um conselho, apenas <span className="text-[hsl(20,100%,55%)]">NÃO PARE, NUNCA!</span> Pois, o imbatível não é o que sempre vence, é o que NUNCA PARA.
            </p>
            <p className="text-2xl font-extrabold text-center text-[hsl(20,100%,55%)] uppercase tracking-wide pt-4">
              Nós somos o time que nunca para! Venha fazer parte desse time!!!
            </p>
          </div>

          {/* MISSÃO + 10 ANOS */}
          <div className="grid md:grid-cols-2 gap-6 mt-14">
            <Card className="border-2 border-[hsl(20,100%,55%)]/30 bg-gradient-to-br from-[hsl(20,100%,55%)]/5 to-transparent">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-lg bg-[hsl(20,100%,55%)] flex items-center justify-center">
                    <Target className="size-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Nossa Missão</h3>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  O Grupo PWR Gestão promove a riqueza e a produtividade, por meio da garra, da consistência e da gratidão, defendendo irrestritamente o empreendedorismo e a liberdade.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-[hsl(225,55%,15%)]/20 bg-gradient-to-br from-[hsl(225,55%,15%)]/5 to-transparent">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-lg bg-[hsl(225,55%,15%)] flex items-center justify-center">
                    <Sparkles className="size-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">10 anos de jornada</h3>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  Uma década de muitas histórias, conquistas e crescimento — construída com pessoas que <strong>nunca param</strong> e estão sempre evoluindo.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA TIME */}
      <section className="bg-[hsl(225,55%,15%)] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Users className="size-12 mx-auto mb-4 text-[hsl(20,100%,55%)]" />
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Venha fazer parte do Nosso Time</h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Procuramos pessoas que compartilhem da nossa filosofia: garra, consistência, gratidão e a vontade de <strong className="text-[hsl(20,100%,55%)]">nunca parar</strong>.
          </p>
        </div>
      </section>

      {/* VAGAS */}
      <section id="vagas" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="size-6 text-[hsl(20,100%,55%)]" />
            <h2 className="text-3xl font-bold">Vagas Abertas</h2>
            <Badge variant="secondary" className="ml-auto">{filtered.length}</Badge>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vaga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={workModel} onValueChange={setWorkModel}>
              <SelectTrigger><SelectValue placeholder="Modo de trabalho" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os modos</SelectItem>
                <SelectItem value="remote">Remoto</SelectItem>
                <SelectItem value="hybrid">Híbrido</SelectItem>
                <SelectItem value="onsite">Presencial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger><SelectValue placeholder="Tipo de vaga" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="clt">CLT</SelectItem>
                <SelectItem value="pj">PJ</SelectItem>
                <SelectItem value="internship">Estágio</SelectItem>
                <SelectItem value="temporary">Temporário</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger><SelectValue placeholder="Localização" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as localidades</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de vagas */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-1">Nenhuma vaga encontrada</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Não encontrou uma vaga que combine com você? Cadastre-se no nosso banco de talentos!
                </p>
                <Button asChild className="bg-[hsl(20,100%,55%)] hover:bg-[hsl(20,100%,50%)] text-white">
                  <Link to="/vagas/00000000-0000-0000-0000-000000000001/aplicar">
                    Banco de Talentos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((job) => (
                <Link key={job.id} to={`/vagas/${job.id}/aplicar`} className="block group">
                  <Card className="hover:shadow-lg hover:border-[hsl(20,100%,55%)]/50 transition-all duration-200">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-[hsl(20,100%,55%)] transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {job.department && <Badge variant="secondary">{job.department}</Badge>}
                          {job.work_model && (
                            <Badge variant="outline">{WORK_MODEL_LABELS[job.work_model] || job.work_model}</Badge>
                          )}
                          {job.contract_type && (
                            <Badge variant="outline">{CONTRACT_LABELS[job.contract_type] || job.contract_type}</Badge>
                          )}
                          {job.unit_city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5" />
                              {job.unit_city}{job.unit_state ? ` - ${job.unit_state}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground group-hover:text-[hsl(20,100%,55%)] group-hover:translate-x-1 transition-all" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Banco de Talentos CTA */}
          <Card className="mt-8 border-2 border-dashed border-[hsl(20,100%,55%)]/40 bg-[hsl(20,100%,55%)]/5">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="size-14 rounded-full bg-[hsl(20,100%,55%)] flex items-center justify-center shrink-0">
                <Sparkles className="size-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Não encontrou a vaga ideal?</h3>
                <p className="text-muted-foreground">
                  Cadastre-se no nosso <strong>Banco de Talentos</strong> e seja considerado para futuras oportunidades.
                </p>
              </div>
              <Button asChild size="lg" className="bg-[hsl(20,100%,55%)] hover:bg-[hsl(20,100%,50%)] text-white shrink-0">
                <Link to="/vagas/00000000-0000-0000-0000-000000000001/aplicar">
                  Quero me cadastrar
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[hsl(225,55%,15%)] text-white py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={pwrLogo} alt="PWR Gestão" className="h-10 bg-white rounded p-1" />
            <div>
              <p className="font-bold">PWR Gestão</p>
              <p className="text-xs text-white/60">#NuncaParar #SempreEvoluir</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://pwrgestao.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Site"
              className="size-10 rounded-full bg-white/10 hover:bg-[hsl(20,100%,55%)] flex items-center justify-center transition-colors"
            >
              <Globe className="size-5" />
            </a>
            <a
              href="https://www.linkedin.com/company/pwrgestao/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="size-10 rounded-full bg-white/10 hover:bg-[hsl(20,100%,55%)] flex items-center justify-center transition-colors"
            >
              <Linkedin className="size-5" />
            </a>
            <a
              href="https://www.instagram.com/pwrgestao/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="size-10 rounded-full bg-white/10 hover:bg-[hsl(20,100%,55%)] flex items-center justify-center transition-colors"
            >
              <Instagram className="size-5" />
            </a>
          </div>

          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} PWR Gestão. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PwrCareers;