import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FUNCTION_NAME = "send-stage-email";

interface Payload {
  job_id: string;
  stage_label: string;
  candidate_ids: string[];
  origin?: string | null;
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br/>");

function buildHtml(opts: {
  candidateName: string;
  jobTitle: string;
  message: string;
  youtubeUrl?: string | null;
  isFitCultural: boolean;
  orgName: string;
  fitAccessUrl?: string | null;
}) {
  const { candidateName, jobTitle, message, youtubeUrl, isFitCultural, orgName, fitAccessUrl } =
    opts;
  const videoBlock =
    isFitCultural && youtubeUrl
      ? `
        <div style="margin: 24px 0; padding: 18px; background-color: #F5F5F5; border-left: 4px solid #E8571A; border-radius: 8px;">
          <p style="margin: 0 0 10px 0; color: #1A2B5C; font-weight: 600;">
            Assista ao nosso vídeo institucional:
          </p>
          <a href="${youtubeUrl}" target="_blank"
             style="display: inline-block; background-color: #E8571A; color: #ffffff; padding: 12px 22px; border-radius: 50px; text-decoration: none; font-weight: 700;">
            ▶ Assistir ao vídeo
          </a>
        </div>`
      : "";
  const fitBlock =
    isFitCultural && fitAccessUrl
      ? `
        <div style="margin: 28px 0; padding: 24px; background-color: #1A2B5C; border-radius: 12px; text-align: center;">
          <p style="margin: 0 0 6px 0; color: #ffffff; font-weight: 700; font-size: 16px;">
            Sua etapa de Fit Cultural PWR está liberada
          </p>
          <p style="margin: 0 0 18px 0; color: #E8E8E8; font-size: 14px;">
            Acesse o formulário exclusivo para concluir esta etapa.
          </p>
          <a href="${fitAccessUrl}" target="_blank"
             style="display: inline-block; background-color: #E8571A; color: #ffffff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 15px;">
            Acessar Fit Cultural
          </a>
          <p style="margin: 16px 0 0 0; color: #B8C0D6; font-size: 12px;">
            Este link expira em 7 dias.
          </p>
        </div>`
      : "";
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff; color: #1A2B5C;">
    <div style="border-left: 4px solid #E8571A; padding-left: 14px; margin-bottom: 24px;">
      <h2 style="margin: 0; color: #1A2B5C; font-size: 22px;">${escapeHtml(jobTitle)}</h2>
      <p style="margin: 4px 0 0 0; color: #888888; font-size: 13px;">Atualização do seu processo seletivo</p>
    </div>
    <p style="color: #1A2B5C; font-size: 16px;">Olá, ${escapeHtml(candidateName)}!</p>
    <div style="color: #444444; font-size: 15px; line-height: 1.6;">
      ${escapeHtml(message)}
    </div>
    ${fitBlock}
    ${videoBlock}
    <hr style="border: none; border-top: 1px solid #E8E8E8; margin: 32px 0;" />
    <p style="color: #888888; font-size: 12px; text-align: center;">
      <span style="color: #E8571A; font-weight: 700;">${escapeHtml(orgName)}</span><br/>
      Este é um e-mail automático do processo seletivo. Por favor não responda.
    </p>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = (await req.json()) as Payload;
    if (!body.job_id || !body.stage_label || !Array.isArray(body.candidate_ids)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load job + org
    const { data: job, error: jobErr } = await supabaseAdmin
      .from("jobs")
      .select("id, title, youtube_url, organization_id")
      .eq("id", body.job_id)
      .maybeSingle();
    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name, invite_from_email, invite_from_name")
      .eq("id", job.organization_id)
      .maybeSingle();

    // Load stages and pick a matching one (case-insensitive contains)
    const { data: stages } = await supabaseAdmin
      .from("job_stages")
      .select("*")
      .eq("job_id", body.job_id);

    const label = body.stage_label.toLowerCase();
    const stage = (stages || []).find(
      (s: any) =>
        s.nome &&
        (s.nome.toLowerCase() === label ||
          s.nome.toLowerCase().includes(label) ||
          label.includes(s.nome.toLowerCase()))
    );

    if (!stage) {
      console.log(`[${FUNCTION_NAME}] No matching stage for label "${body.stage_label}"`);
      return new Response(JSON.stringify({ skipped: "no_matching_stage" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!stage.enviar_email || !stage.mensagem_email) {
      return new Response(JSON.stringify({ skipped: "disabled_or_empty" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resend integration
    const { getIntegrationSecret } = await import(
      "../_shared/get-integration-secret.ts"
    );
    const resendApiKey = await getIntegrationSecret(
      supabaseAdmin,
      job.organization_id,
      "resend",
      { updateLastUsed: true, callerFunction: FUNCTION_NAME }
    );

    if (!resendApiKey || !org?.invite_from_email) {
      console.log(`[${FUNCTION_NAME}] Resend not configured`);
      return new Response(JSON.stringify({ skipped: "resend_not_configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load candidates
    const { data: candidates, error: candErr } = await supabaseAdmin
      .from("job_applications")
      .select("id, candidate_name, candidate_email")
      .in("id", body.candidate_ids);

    if (candErr) throw candErr;

    const isFit = stage.nome.toLowerCase().includes("fit cultural");
    const fromName = org.invite_from_name || org.name || "PWR Gestão";
    const fromEmail = org.invite_from_email;
    const baseUrl = (body.origin || "").replace(/\/+$/, "");

    const results: any[] = [];
    for (const c of candidates || []) {
      if (!c.candidate_email) continue;

      // For Fit Cultural stage: invalidate previous tokens for this candidate/job
      // and create a fresh AcessoFit token valid for 7 days.
      let fitAccessUrl: string | null = null;
      if (isFit) {
        try {
          await supabaseAdmin
            .from("acessos_fit")
            .update({ expires_at: new Date().toISOString(), usado: true })
            .eq("candidato_id", c.id)
            .eq("vaga_id", body.job_id);

          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          const { data: acesso, error: acessoErr } = await supabaseAdmin
            .from("acessos_fit")
            .insert({
              candidato_id: c.id,
              vaga_id: body.job_id,
              expires_at: expiresAt,
              usado: false,
            })
            .select("token")
            .single();

          if (acessoErr) throw acessoErr;
          if (baseUrl && acesso?.token) {
            fitAccessUrl = `${baseUrl}/fit-cultural/${acesso.token}`;
          }
        } catch (err) {
          console.error(`[${FUNCTION_NAME}] Failed to create AcessoFit for ${c.id}:`, err);
        }
      }

      const html = buildHtml({
        candidateName: c.candidate_name || "candidato(a)",
        jobTitle: job.title,
        message: stage.mensagem_email,
        youtubeUrl: job.youtube_url,
        isFitCultural: isFit,
        orgName: org.name || "PWR Gestão",
        fitAccessUrl,
      });

      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [c.candidate_email],
          subject: isFit
            ? `Próxima etapa: Fit Cultural PWR — ${job.title}`
            : `Atualização do seu processo seletivo — ${job.title} | PWR Gestão`,
          html,
        }),
      });

      results.push({ id: c.id, ok: resp.ok, status: resp.status });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error(`[${FUNCTION_NAME}] Resend error for ${c.candidate_email}:`, txt);
      }
    }

    return new Response(JSON.stringify({ sent: results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`[${FUNCTION_NAME}] error:`, e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});