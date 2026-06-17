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
import team1 from "@/assets/team/team-1.png";
import team2 from "@/assets/team/team-2.png";

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
    <div className="min-h-screen bg-white text-[#333333]">
      {/* HEADER NAV */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <img src={pwrLogo} alt="PWR Gestão" className="h-11 w-auto bg-transparent" style={{ background: "transparent", backgroundColor: "transparent" }} />
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold uppercase tracking-wider text-white/80">
            <a href="#sobre" className="hover:text-[#E8571A] transition-colors">Sobre</a>
            <a href="#vagas" className="hover:text-[#E8571A] transition-colors">Vagas</a>
            <a href="https://pwrgestao.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#E8571A] transition-colors">Site</a>
          </nav>
        </div>
      </header>

      {/* HERO com banner como background */}
      <section
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(10,10,10,0.7), rgba(10,10,10,0.85)), url(${pwrBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Vinheta laranja */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#E8571A]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-[#E8571A]/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-20">
          <Badge className="mb-6 bg-[#E8571A] hover:bg-[#E8571A] text-white border-0 px-4 py-1.5 text-sm font-bold tracking-widest uppercase rounded-full">
            #NuncaParar
          </Badge>
          <h1 className="text-5xl md:text-[4rem] lg:text-[4rem] font-black uppercase leading-[0.95] tracking-tight mb-6 text-white">
            <span className="block">Venha fazer parte</span>
            <span className="block">dessa <span className="text-[#E8571A]">jornada</span></span>
          </h1>
          <p className="text-[1.125rem] text-white max-w-2xl mx-auto mb-10 font-normal">
            Nós somos <strong className="font-bold text-white">o time que nunca para</strong>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-[#E8571A] hover:bg-[#C4481A] text-white font-bold uppercase tracking-wider rounded-[50px] px-8 py-6 text-base border-0 shadow-2xl shadow-[#E8571A]/40">
              <a href="#vagas">Ver vagas abertas</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-white bg-transparent hover:bg-white hover:text-[#1A2B5C] text-white font-bold uppercase tracking-wider rounded-[50px] px-8 py-6 text-base">
              <a href="#sobre">Conheça a PWR</a>
            </Button>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-24 px-4 bg-white relative">
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-14">
            <div className="inline-block mb-6">
              <div className="h-1 w-20 bg-[#E8571A] mx-auto mb-4" />
              <span className="text-[#E8571A] uppercase tracking-[0.25em] text-[0.75rem] font-bold">Quem somos</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-[#1A2B5C] uppercase leading-[1]">
              NÓS SOMOS O TIME QUE
              <span className="block text-[#E8571A] mt-2">NUNCA PARA</span>
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-relaxed text-[#222222] [&_p]:text-justify [&_strong]:text-[#E8571A]">
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
            <p className="text-xl font-semibold text-center text-[#1A2B5C]">
              E se eu pudesse lhe dar um conselho, apenas <span className="text-[#E8571A]">NÃO PARE, NUNCA!</span> Pois, o imbatível não é o que sempre vence, é o que NUNCA PARA.
            </p>
            <p className="text-2xl font-extrabold text-center text-[#E8571A] uppercase tracking-wide pt-4">
              Nós somos o time que nunca para! Venha fazer parte desse time!!!
            </p>
          </div>

          {/* MISSÃO + 10 ANOS */}
          <div className="grid md:grid-cols-2 gap-6 mt-20">
            <Card className="bg-[#1A2B5C] border-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-12 rounded-full bg-[#E8571A] flex items-center justify-center">
                    <Target className="size-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black uppercase text-white">Nossa Missão</h3>
                </div>
                <p className="text-white leading-relaxed">
                  O Grupo PWR Gestão promove a <strong className="text-white">riqueza e a produtividade</strong>, por meio da garra, da consistência e da gratidão, defendendo irrestritamente o empreendedorismo e a liberdade.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#F5F5F5] border-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-12 rounded-full bg-white flex items-center justify-center">
                    <Sparkles className="size-6 text-[#E8571A]" />
                  </div>
                  <h3 className="text-[2.5rem] font-black text-[#E8571A] leading-none">10</h3>
                  <h3 className="text-2xl font-black uppercase text-[#1A2B5C]">anos de jornada</h3>
                </div>
                <p className="text-[#1A2B5C] leading-relaxed">
                  Uma <strong className="text-[#1A2B5C]">década de muitas histórias e conquistas</strong>, construída com pessoas que nunca param e estão sempre evoluindo.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA TIME */}
      <section className="bg-[#E8571A] text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><path d=%22M0 60L60 0%22 stroke=%22white%22 stroke-opacity=%220.05%22/></svg>')] opacity-50" />
        <div className="max-w-4xl mx-auto text-center">
          <Users className="size-12 mx-auto mb-4 text-white" />
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">Venha fazer parte do Nosso Time</h2>
          <p className="text-white text-lg max-w-2xl mx-auto">
            Procuramos pessoas que compartilhem da nossa filosofia: garra, consistência, gratidão e a vontade de <strong>nunca parar</strong>.
          </p>
        </div>
      </section>

      {/* NOSSA HISTÓRIA - VIDEO */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-[900px] mx-auto text-center">
          <div className="h-1 w-20 bg-[#E8571A] mx-auto mb-4" />
          <span className="text-[#E8571A] uppercase tracking-[0.25em] text-[0.75rem] font-bold">Nossa História</span>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#1A2B5C] mt-3 mb-10">
            Conheça a PWR <span className="text-[#E8571A]">em movimento</span>
          </h2>
          <div className="w-full" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src="https://www.youtube.com/embed/oGaWrCdAwHM"
              title="PWR Gestão"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "none", borderRadius: "12px" }}
            />
          </div>
        </div>
      </section>

      {/* NOSSO TIME - PHOTOS */}
      <section className="py-20 px-4 bg-[#F5F5F5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="h-1 w-20 bg-[#E8571A] mx-auto mb-4" />
            <span className="text-[#E8571A] uppercase tracking-[0.25em] text-[0.75rem] font-bold">Nosso Time</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#1A2B5C] mt-3">
              Pessoas que <span className="text-[#E8571A]">nunca param</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <img src={team1} alt="Time PWR Gestão" className="w-full h-auto rounded-xl shadow-lg object-cover" />
            <img src={team2} alt="Equipe PWR Gestão reunida" className="w-full h-auto rounded-xl shadow-lg object-cover" />
          </div>
        </div>
      </section>

      {/* VAGAS */}
      <section id="vagas" className="py-20 px-4 bg-[#F5F5F5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="h-1 w-20 bg-[#E8571A] mx-auto mb-4" />
            <span className="text-[#E8571A] uppercase tracking-[0.25em] text-[0.75rem] font-bold">Oportunidades</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[#1A2B5C] mt-3 flex items-center justify-center gap-3">
              Vagas <span className="text-[#E8571A]">abertas</span>
              <span className="inline-flex items-center justify-center min-w-10 h-10 px-3 rounded-full bg-[#E8571A] text-white text-base font-bold">{filtered.length}</span>
            </h2>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-8 [&_button]:bg-white [&_button]:border [&_button]:border-[#D0D0D0] [&_button]:text-[#1A2B5C] [&_button]:rounded-lg [&_button_svg]:text-[#E8571A] [&_input]:bg-white [&_input]:text-[#1A2B5C] [&_input]:placeholder:text-[#1A2B5C]/50">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#1A2B5C]/60 z-10" />
              <Input
                placeholder="Buscar vaga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[1.5px] border-[#1A2B5C] rounded-lg focus-visible:ring-2 focus-visible:ring-[#E8571A] focus-visible:ring-offset-0"
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
            <Card className="bg-white border-[1.5px] border-[#E8E8E8] rounded-xl">
              <CardContent className="p-12 text-center">
                <Briefcase className="size-12 text-[#1A2B5C]/40 mx-auto mb-4" />
                <p className="text-lg font-bold text-[#1A2B5C] mb-1">Nenhuma vaga encontrada</p>
                <p className="text-sm text-[#333333] mb-6">
                  Não encontrou uma vaga que combine com você? Cadastre-se no nosso banco de talentos!
                </p>
                <Button asChild className="bg-[#E8571A] hover:bg-[#C4481A] text-white rounded-[50px]">
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
                  <Card className="bg-white border-[1.5px] border-[#E8E8E8] rounded-xl hover:shadow-lg hover:border-[#E8571A]/40 transition-all duration-200">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[1.125rem] mb-2 text-[#1A2B5C] group-hover:text-[#E8571A] transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-[#333333]">
                          {job.department && <Badge className="bg-[#E8571A] text-white border-0 hover:bg-[#E8571A] rounded text-[0.75rem] uppercase font-bold">{job.department}</Badge>}
                          {job.work_model && (
                            <Badge className="bg-[#EEF2FF] text-[#1A2B5C] border-0 hover:bg-[#EEF2FF] rounded">{WORK_MODEL_LABELS[job.work_model] || job.work_model}</Badge>
                          )}
                          {job.contract_type && (
                            <Badge className="bg-[#EEF2FF] text-[#1A2B5C] border-0 hover:bg-[#EEF2FF] rounded">{CONTRACT_LABELS[job.contract_type] || job.contract_type}</Badge>
                          )}
                          {job.unit_city && (
                            <span className="flex items-center gap-1 text-[#333333]">
                              <MapPin className="size-3.5" />
                              {job.unit_city}{job.unit_state ? ` - ${job.unit_state}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-[#E8571A] group-hover:translate-x-1 transition-all" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Banco de Talentos CTA */}
          <Card className="mt-10 border-0 bg-[#111827] rounded-xl">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="size-16 rounded-full bg-transparent flex items-center justify-center shrink-0">
                <Sparkles className="size-10 text-[#E8571A]" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black uppercase mb-1 text-white">Não encontrou a vaga ideal?</h3>
                <p className="text-[#AAAAAA]">
                  Cadastre-se no nosso <strong>Banco de Talentos</strong> e seja considerado para futuras oportunidades.
                </p>
              </div>
              <Button asChild size="lg" className="bg-[#E8571A] hover:bg-[#C4481A] text-white shrink-0 font-bold uppercase tracking-wider rounded-[50px] px-8">
                <Link to="/vagas/00000000-0000-0000-0000-000000000001/aplicar">
                  Quero me cadastrar
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={pwrLogo} alt="PWR Gestão" className="h-10 bg-white rounded p-1" />
            <div>
              <p className="font-bold">PWR Gestão</p>
              <p className="text-xs text-[#888888]">#NuncaParar #SempreEvoluir</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://pwrgestao.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Site"
              className="size-10 rounded-full bg-transparent border border-[#333333] hover:border-[#E8571A] text-white flex items-center justify-center transition-colors"
            >
              <Globe className="size-5" />
            </a>
            <a
              href="https://www.linkedin.com/company/pwrgestao/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="size-10 rounded-full bg-transparent border border-[#333333] hover:border-[#E8571A] text-white flex items-center justify-center transition-colors"
            >
              <Linkedin className="size-5" />
            </a>
            <a
              href="https://www.instagram.com/pwrgestao/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="size-10 rounded-full bg-transparent border border-[#333333] hover:border-[#E8571A] text-white flex items-center justify-center transition-colors"
            >
              <Instagram className="size-5" />
            </a>
          </div>

          <p className="text-sm text-[#555555]">
            © {new Date().getFullYear()} PWR Gestão. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PwrCareers;