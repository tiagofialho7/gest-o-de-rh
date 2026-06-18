import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, Upload, FileText, Briefcase, Building2, ArrowRight, Users, Globe, MapPin } from "lucide-react";
import { useJobById } from "@/hooks/useJobById";
import { useBrazilianCities } from "@/hooks/useBrazilianCities";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { JOB_STATUS_LABELS, JOB_STATUS_VARIANTS } from "@/types/job";
import {
  BRAZILIAN_STATES,
  RACE_OPTIONS,
  GENDER_OPTIONS,
  SEXUAL_ORIENTATION_OPTIONS,
  PCD_TYPE_OPTIONS,
} from "@/constants/brazilData";
import { TALENT_BANK_JOB_ID } from "@/constants/talentBank";
import pwrLogo from "@/assets/pwr-logo.png";
import pwrBanner from "@/assets/pwr-banner.png";
import team1 from "@/assets/team/team-1.png";
import team2 from "@/assets/team/team-2.png";

// Age validation constants (16-100 years)
const today = new Date();
const minBirthDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
const maxBirthDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
const defaultBirthMonth = new Date(today.getFullYear() - 25, 0);

const JobApplicationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  
  // Redirect to dedicated talent bank application page
  useEffect(() => {
    if (id === TALENT_BANK_JOB_ID) {
      navigate(`/vagas/${TALENT_BANK_JOB_ID}/aplicar`, { replace: true });
    }
  }, [id, navigate]);
  
  const { data: job, isLoading } = useJobById(id, isDemoMode);
  // Get organization from job data (includes org via JOIN)
  const organization = job?.organizations;

  // Form state
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState<Date>();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // New demographic fields
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [race, setRace] = useState("");
  const [gender, setGender] = useState("");
  const [sexualOrientation, setSexualOrientation] = useState("");
  const [isPcd, setIsPcd] = useState<string>("");
  const [pcdType, setPcdType] = useState("");


  const { cities, isLoading: citiesLoading } = useBrazilianCities(state);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError("E-mail é obrigatório");
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError("E-mail inválido");
      return false;
    }
    setEmailError("");
    return true;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    
    if (digits.length <= 2) {
      return digits.length > 0 ? `(${digits}` : "";
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const validatePhone = (value: string) => {
    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (!value) {
      setPhoneError("Telefone é obrigatório");
      return false;
    }
    if (!phoneRegex.test(value)) {
      setPhoneError("Formato inválido. Use (xx) xxxxx-xxxx");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setPhone(formatted);
    if (formatted.length === 15) {
      validatePhone(formatted);
    } else {
      setPhoneError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value) validateEmail(value);
  };

  const handleStateChange = (value: string) => {
    setState(value);
    setCity("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Formato inválido",
          description: "Por favor, envie um arquivo PDF.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const uploadResume = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const filePath = `${id}/${fileName}`;

    const { error } = await supabase.storage
      .from("resumes")
      .upload(filePath, file, {
        contentType: "application/pdf",
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    return filePath;
  };

  const handleProceedToProfiler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) return;
    if (!validatePhone(phone)) return;
    
    if (!birthDate) {
      toast({
        title: "Data de nascimento obrigatória",
        description: "Por favor, informe sua data de nascimento.",
        variant: "destructive",
      });
      return;
    }
    
    // Age validation (16-100 years)
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    
    if (adjustedAge < 16 || adjustedAge > 100) {
      toast({
        title: "Idade inválida",
        description: "Você deve ter entre 16 e 100 anos para se candidatar.",
        variant: "destructive",
      });
      return;
    }
    if (!resumeFile) {
      toast({
        title: "Currículo obrigatório",
        description: "Por favor, envie seu currículo em PDF.",
        variant: "destructive",
      });
      return;
    }
    if (!state || !city) {
      toast({
        title: "Localização obrigatória",
        description: "Por favor, selecione seu estado e cidade.",
        variant: "destructive",
      });
      return;
    }
    if (!race || !gender || !sexualOrientation) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos demográficos.",
        variant: "destructive",
      });
      return;
    }
    if (!isPcd) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe se você é PCD.",
        variant: "destructive",
      });
      return;
    }
    if (isPcd === "sim" && !pcdType) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o tipo de deficiência.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const resumeUrl = await uploadResume(resumeFile);

      const candidateData = {
        job_id: id,
        candidate_name: fullName,
        candidate_email: email,
        candidate_birth_date: format(birthDate, "yyyy-MM-dd"),
        resume_url: resumeUrl,
        candidate_state: state,
        candidate_city: city,
        candidate_phone: phone,
        candidate_race: race,
        candidate_gender: gender,
        candidate_sexual_orientation: sexualOrientation,
        candidate_pcd: isPcd === "sim",
        candidate_pcd_type: isPcd === "sim" ? pcdType : null,
        desired_position: null,
        desired_seniority: null,
        job_data: {
          title: job?.title,
          description: job?.description,
          requirements: job?.requirements,
          position: job?.positions,
          department: job?.departments,
        },
      };

      sessionStorage.setItem("pending_application", JSON.stringify(candidateData));

      // Store return URL for after submission
      const orgSlug = (job?.organizations as any)?.slug;
      if (orgSlug) {
        sessionStorage.setItem("application_return_url", `/carreiras/${orgSlug}`);
      }

      toast({
        title: "Dados salvos!",
        description: "Agora você precisa responder ao teste de perfil comportamental.",
      });

      navigate(`/profiler-intro?applicationId=${id}`);
    } catch (error) {
      console.error("Error saving data:", error);
      toast({
        title: "Erro ao salvar dados",
        description: "Ocorreu um erro ao salvar seus dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <Skeleton className="h-16 w-16 rounded-lg mx-auto mb-6" />
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[600px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Vaga não encontrada</CardTitle>
            <CardDescription>
              Esta vaga pode ter sido removida ou o link está incorreto.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (job.status !== "active") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Vaga não disponível</CardTitle>
            <CardDescription>
              Esta vaga não está mais aceitando candidaturas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={JOB_STATUS_VARIANTS[job.status]}>
              {JOB_STATUS_LABELS[job.status]}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] text-[#1A2B5C] antialiased">
      {/* High-impact hero header — same background as landing page */}
      <header
        className="relative py-16 md:py-20 px-6 md:px-8 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(10,10,10,0.7), rgba(10,10,10,0.85)), url(${pwrBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#E8571A]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-[#E8571A]/10 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-10 md:mb-12">
            <img src={pwrLogo} alt={organization?.name || "PWR"} className="h-11 w-auto object-contain" />
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-6">
              {job.positions?.title && (
                <span className="px-4 py-1.5 bg-[#E8571A] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
                  {job.positions.title}
                </span>
              )}
              {job.departments?.name && (
                <span className="px-4 py-1.5 bg-white/5 text-white/80 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/10">
                  {job.departments.name}
                </span>
              )}
              <span className="px-4 py-1.5 bg-white/5 text-white/80 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/10">
                Carreiras PWR
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tighter mb-6">
              {job.title}
            </h1>
            {job.units && (
              <p
                className="flex items-center gap-1.5 mb-4"
                style={{ fontSize: "0.8rem", color: "#cccccc" }}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {job.units.name}
                  {job.units.address ? ` — ${job.units.address}` : ""}
                </span>
              </p>
            )}
            <p className="text-white/60 text-lg md:text-xl max-w-xl leading-relaxed font-light">
              Seja parte do <strong className="text-white font-semibold">time que nunca para</strong>. Buscamos mentes criativas para construir o futuro com a gente.
            </p>
          </div>
        </div>
      </header>

      {/* Overlapping content grid */}
      <main className="max-w-6xl mx-auto px-6 md:px-8 -mt-12 md:-mt-16 pb-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Primary column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Job description card */}
            <section className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-[#1A2B5C]/5 ring-1 ring-black/5">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-10 bg-[#E8571A] rounded-full" />
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A2B5C]">Sobre a vaga</h2>
              </div>

              {job.description && (
                <div className="prose prose-sm max-w-none [&_p]:text-[#444444] [&_p]:leading-relaxed [&_li]:text-[#444444] [&_strong]:text-[#1A2B5C] [&_strong]:font-bold [&_h1]:text-[#1A2B5C] [&_h2]:text-[#1A2B5C] [&_h3]:text-[#1A2B5C] [&_h4]:text-[#1A2B5C] [&_h2]:border-l-[3px] [&_h2]:border-[#E8571A] [&_h2]:pl-3 [&_h2]:font-bold [&_h2]:mt-6 [&_h3]:border-l-[3px] [&_h3]:border-[#E8571A] [&_h3]:pl-3 [&_h3]:font-bold [&_h3]:mt-6 [&_ul]:my-2 [&_li]:my-0 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-[#F5F5F5] [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2">
                  <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>{job.description}</ReactMarkdown>
                </div>
              )}
              {job.requirements && (
                <div className="mt-8">
                  <h3 className="font-bold mb-3 border-l-[3px] border-[#E8571A] pl-3 text-[#1A2B5C]">Requisitos</h3>
                  <div className="prose prose-sm max-w-none [&_p]:text-[#444444] [&_li]:text-[#444444] [&_strong]:text-[#1A2B5C] [&_strong]:font-bold [&_ul]:my-2 [&_li]:my-0">
                    <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>{job.requirements}</ReactMarkdown>
                  </div>
                </div>
              )}
            </section>

            {/* Application form card */}
            <section className="bg-white overflow-hidden rounded-3xl shadow-xl shadow-[#1A2B5C]/5 ring-1 ring-black/5">
              <div className="bg-[#F5F5F5] px-8 md:px-12 py-7 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-[#E8571A] rounded-full" />
                  <h2 className="text-xl md:text-2xl font-bold text-[#1A2B5C]">Candidatura</h2>
                </div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Etapa 1 de 2</span>
              </div>

              <form onSubmit={handleProceedToProfiler} className="p-8 md:p-12 space-y-6">
                {/* Personal Info Section */}
                <div className="space-y-4">
                  <h3 style={{ color: "#E8571A", fontSize: "0.7rem", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase" }}>
                    Informações Pessoais
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" style={{ color: "#1A2B5C", fontWeight: 500 }}>Nome Completo *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="focus-visible:ring-[#E8571A] focus-visible:border-[#E8571A]"
                      style={{ border: "1.5px solid #E0E0E0", borderRadius: "8px" }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label style={{ color: "#1A2B5C", fontWeight: 500 }}>Data de Nascimento *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !birthDate && "text-muted-foreground"
                          )}
                          style={{ border: "1.5px solid #E0E0E0", borderRadius: "8px" }}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {birthDate ? (
                            format(birthDate, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={birthDate}
                          onSelect={setBirthDate}
                          disabled={(date) =>
                            date > maxBirthDate || date < minBirthDate
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                          captionLayout="dropdown-buttons"
                          fromYear={minBirthDate.getFullYear()}
                          toYear={maxBirthDate.getFullYear()}
                          defaultMonth={defaultBirthMonth}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      Você deve ter entre 16 e 100 anos para se candidatar.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" style={{ color: "#1A2B5C", fontWeight: 500 }}>E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={() => validateEmail(email)}
                      placeholder="seu@email.com"
                      className={cn("focus-visible:ring-[#E8571A] focus-visible:border-[#E8571A]", emailError ? "border-destructive" : "")}
                      style={{ border: emailError ? undefined : "1.5px solid #E0E0E0", borderRadius: "8px" }}
                      required
                    />
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" style={{ color: "#1A2B5C", fontWeight: 500 }}>Telefone (WhatsApp) *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={() => validatePhone(phone)}
                      placeholder="Seu WhatsApp com DDD"
                      maxLength={15}
                      className={cn("focus-visible:ring-[#E8571A] focus-visible:border-[#E8571A]", phoneError ? "border-destructive" : "")}
                      style={{ border: phoneError ? undefined : "1.5px solid #E0E0E0", borderRadius: "8px" }}
                      required
                    />
                    {phoneError && (
                      <p className="text-sm text-destructive">{phoneError}</p>
                    )}
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4">
                  <h3 style={{ color: "#E8571A", fontSize: "0.7rem", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase" }}>
                    Localização
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Estado *</Label>
                      <Select value={state} onValueChange={handleStateChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRAZILIAN_STATES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cidade *</Label>
                      <Select 
                        value={city} 
                        onValueChange={setCity}
                        disabled={!state || citiesLoading}
                      >
                        <SelectTrigger>
                          <SelectValue 
                            placeholder={
                              citiesLoading 
                                ? "Carregando..." 
                                : !state 
                                  ? "Selecione o estado primeiro" 
                                  : "Selecione a cidade"
                            } 
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Demographics Section */}
                <div className="space-y-4">
                  <h3 style={{ color: "#E8571A", fontSize: "0.7rem", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase" }}>
                    Informações Demográficas
                  </h3>

                  <div className="space-y-2">
                    <Label>Raça *</Label>
                    <Select value={race} onValueChange={setRace}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {RACE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gênero *</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Orientação Sexual *</Label>
                    <Select value={sexualOrientation} onValueChange={setSexualOrientation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEXUAL_ORIENTATION_OPTIONS.map((so) => (
                          <SelectItem key={so.value} value={so.value}>
                            {so.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Pessoa com Deficiência (PCD)? *</Label>
                    <RadioGroup value={isPcd} onValueChange={setIsPcd} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="pcd-sim" />
                        <Label htmlFor="pcd-sim" className="font-normal cursor-pointer">
                          Sim
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="pcd-nao" />
                        <Label htmlFor="pcd-nao" className="font-normal cursor-pointer">
                          Não
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {isPcd === "sim" && (
                    <div className="space-y-2">
                      <Label>Tipo de Deficiência *</Label>
                      <Select value={pcdType} onValueChange={setPcdType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {PCD_TYPE_OPTIONS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Resume Section */}
                <div className="space-y-4">
                  <h3 style={{ color: "#E8571A", fontSize: "0.7rem", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase" }}>
                    Currículo
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="resume">Currículo (PDF) *</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("resume")?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {resumeFile ? "Trocar arquivo" : "Selecionar PDF"}
                      </Button>
                    </div>
                    {resumeFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{resumeFile.name}</span>
                        <span className="flex-shrink-0">
                          ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info about next step */}
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Próximo passo:</p>
                  <p>Após salvar seus dados, você responderá ao teste de perfil comportamental (aproximadamente 5 minutos). Sua candidatura só será enviada após a conclusão do teste.</p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#E8571A] hover:bg-[#C4481A] text-white"
                  style={{ borderRadius: "50px", fontWeight: 700 }}
                  disabled={uploading}
                >
                  {uploading ? (
                    "Salvando..."
                  ) : (
                    <>
                      Continuar para o Teste de Perfil
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </section>
          </div>

          {/* Sidebar column */}
          <aside className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
            {/* Culture card */}
            <div className="bg-[#1A2B5C] text-white p-8 rounded-3xl shadow-2xl shadow-[#1A2B5C]/20 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-[#E8571A] rounded-full" />
                  <h3 className="text-[10px] font-bold text-[#E8571A] uppercase tracking-[0.25em]">Nossa Cultura</h3>
                </div>
                <div className="rounded-2xl overflow-hidden mb-6 grid grid-cols-2 gap-2">
                  <img src={team1} alt="Time PWR" className="w-full aspect-square object-cover rounded-xl" />
                  <img src={team2} alt="Time PWR" className="w-full aspect-square object-cover rounded-xl mt-3" />
                </div>
                <p className="text-sm text-white/70 italic leading-relaxed">
                  "Trabalhar na {organization?.name || "PWR"} é ter a liberdade de criar e a responsabilidade de impactar vidas todos os dias."
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E8571A] flex items-center justify-center text-white font-black text-sm">#</div>
                  <div className="text-[11px]">
                    <p className="font-bold">Time Nunca Para</p>
                    <p className="opacity-50">{organization?.industry || "Consultoria"} · {organization?.employee_count ? `${organization.employee_count}+ colaboradores` : "51-200 colaboradores"}</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#E8571A]/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-bl-full" />
            </div>

            {/* Process card */}
            <div className="bg-white p-8 rounded-3xl ring-1 ring-black/5 shadow-xl shadow-[#1A2B5C]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-[#E8571A] rounded-full" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A2B5C]">Como funciona</h3>
              </div>
              <ol className="space-y-5">
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#F5F5F5] text-[#1A2B5C] font-black text-sm flex items-center justify-center">1</span>
                  <div>
                    <p className="text-sm font-bold text-[#1A2B5C]">Preencha seus dados</p>
                    <p className="text-xs text-gray-500 mt-0.5">Informações pessoais e currículo</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#E8571A] text-white font-black text-sm flex items-center justify-center">2</span>
                  <div>
                    <p className="text-sm font-bold text-[#1A2B5C]">Teste de perfil</p>
                    <p className="text-xs text-gray-500 mt-0.5">~5 minutos · comportamental</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#F5F5F5] text-[#1A2B5C] font-black text-sm flex items-center justify-center">3</span>
                  <div>
                    <p className="text-sm font-bold text-[#1A2B5C]">Nosso time avalia</p>
                    <p className="text-xs text-gray-500 mt-0.5">Retorno por e-mail</p>
                  </div>
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 md:px-8 py-8 text-center text-xs" style={{ color: "#888888" }}>
        <p>© {new Date().getFullYear()} {organization?.name || "PWR"}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default JobApplicationPage;
