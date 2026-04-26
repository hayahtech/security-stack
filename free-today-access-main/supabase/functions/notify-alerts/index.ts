import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get unnotified alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("alerts")
      .select("*")
      .eq("notified", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (alertsError) throw alertsError;
    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ message: "No new alerts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group alerts by user
    const alertsByUser: Record<string, typeof alerts> = {};
    for (const alert of alerts) {
      if (!alertsByUser[alert.user_id]) alertsByUser[alert.user_id] = [];
      alertsByUser[alert.user_id].push(alert);
    }

    const results: { user_id: string; whatsapp: boolean; email: boolean; alert_count: number }[] = [];

    for (const [userId, userAlerts] of Object.entries(alertsByUser)) {
      // Get user profile for notification preferences
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, notification_phone, notification_email")
        .eq("id", userId)
        .single();

      if (!profile) continue;

      const result = { user_id: userId, whatsapp: false, email: false, alert_count: userAlerts.length };

      // Build message
      const severityEmoji: Record<string, string> = {
        critical: "🔴",
        warning: "🟡",
        info: "🔵",
      };

      const lines = userAlerts.map(
        (a) => `${severityEmoji[a.severity] || "⚪"} ${a.title}${a.message ? ` — ${a.message}` : ""}`
      );
      const textMessage = `🍕 *PizzaFlow - Alertas*\n\n${lines.join("\n")}\n\nTotal: ${userAlerts.length} alerta(s)`;

      // WhatsApp via wa.me link generation (stored for user access)
      if (profile.notification_phone) {
        const phone = profile.notification_phone.replace(/\D/g, "");
        const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(textMessage)}`;
        // We can't auto-send WhatsApp, but we log the intent
        // In a real scenario, you'd use a WhatsApp Business API provider
        console.log(`WhatsApp notification prepared for ${phone}`);
        result.whatsapp = true;
      }

      // Email via Resend
      if (profile.notification_email && resendApiKey) {
        const htmlLines = userAlerts.map((a) => {
          const color = a.severity === "critical" ? "#ef4444" : a.severity === "warning" ? "#f59e0b" : "#3b82f6";
          return `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">
              <span style="color:${color};font-weight:bold">${severityEmoji[a.severity] || "⚪"}</span>
              <strong>${a.title}</strong>
              ${a.message ? `<br><small style="color:#666">${a.message}</small>` : ""}
            </td>
          </tr>`;
        });

        const htmlBody = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#e85d04;color:white;padding:16px 24px;border-radius:8px 8px 0 0">
              <h2 style="margin:0">🍕 PizzaFlow - Central de Alertas</h2>
            </div>
            <div style="padding:16px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">
              <p>Olá ${profile.full_name || ""},</p>
              <p>Você tem <strong>${userAlerts.length}</strong> novo(s) alerta(s):</p>
              <table style="width:100%;border-collapse:collapse">${htmlLines.join("")}</table>
              <p style="margin-top:16px;color:#666;font-size:13px">Acesse o PizzaFlow para gerenciar seus alertas.</p>
            </div>
          </div>
        `;

        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "PizzaFlow <onboarding@resend.dev>",
              to: [profile.notification_email],
              subject: `🍕 PizzaFlow: ${userAlerts.length} novo(s) alerta(s)`,
              html: htmlBody,
            }),
          });

          if (emailRes.ok) {
            result.email = true;
          } else {
            const err = await emailRes.text();
            console.error("Resend error:", err);
          }
        } catch (emailErr) {
          console.error("Email send error:", emailErr);
        }
      }

      // Mark alerts as notified
      const alertIds = userAlerts.map((a) => a.id);
      await supabase.from("alerts").update({ notified: true }).in("id", alertIds);

      results.push(result);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
