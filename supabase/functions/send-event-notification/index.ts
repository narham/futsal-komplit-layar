import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Association email - can be configured
const ASSOCIATION_EMAIL = "sekretariat@ffisulsel.or.id";

interface EventNotificationRequest {
  eventId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SMTP Configuration
    const smtpHostname = Deno.env.get("SMTP_HOSTNAME");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFrom = Deno.env.get("SMTP_FROM") || smtpUsername;
    const smtpTls = Deno.env.get("SMTP_TLS") === "true";

    if (!smtpHostname || !smtpUsername || !smtpPassword) {
      console.error("SMTP not configured - missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SMTP Configuration loaded:", { 
      hostname: smtpHostname, 
      port: smtpPort, 
      tls: smtpTls,
      from: smtpFrom 
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { eventId }: EventNotificationRequest = await req.json();
    console.log("Processing event notification for:", eventId);

    // Fetch event data with related info
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`
        *,
        creator:created_by (full_name),
        kabupaten_kota:kabupaten_kota_id (name)
      `)
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Event not found:", eventError);
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Event data:", event);

    // Prepare email content
    const eventDate = new Date(event.date).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Prepare attachments
    let attachmentList: { filename: string; content: Uint8Array; contentType: string; encoding: "binary" }[] = [];

    // Download document if exists
    if (event.document_path) {
      console.log("Downloading document:", event.document_path);
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(event.document_path);

      if (downloadError) {
        console.error("Failed to download document:", downloadError);
      } else if (fileData) {
        const arrayBuffer = await fileData.arrayBuffer();
        const filename = event.document_path.split("/").pop() || "surat-permohonan";
        
        // Determine content type
        let contentType = "application/octet-stream";
        if (filename.endsWith(".pdf")) {
          contentType = "application/pdf";
        } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
          contentType = "image/jpeg";
        } else if (filename.endsWith(".png")) {
          contentType = "image/png";
        } else if (filename.endsWith(".doc")) {
          contentType = "application/msword";
        } else if (filename.endsWith(".docx")) {
          contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        attachmentList.push({
          filename,
          content: new Uint8Array(arrayBuffer),
          contentType,
          encoding: "binary",
        });
        console.log("Document attached:", filename, "Type:", contentType);
      }
    }

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a56db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .info-row { display: flex; margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px; }
          .info-label { font-weight: bold; width: 150px; color: #374151; }
          .info-value { flex: 1; }
          h1 { margin: 0; font-size: 24px; }
          h2 { color: #1f2937; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Pengajuan Event Baru</h1>
          </div>
          <div class="content">
            <h2>Detail Event</h2>
            <div class="info-row">
              <span class="info-label">Nama Event:</span>
              <span class="info-value">${event.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tanggal:</span>
              <span class="info-value">${eventDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Lokasi:</span>
              <span class="info-value">${event.location || "-"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Kabupaten/Kota:</span>
              <span class="info-value">${event.kabupaten_kota?.name || "-"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Kategori:</span>
              <span class="info-value">${event.category || "-"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Diajukan oleh:</span>
              <span class="info-value">${event.creator?.full_name || "-"}</span>
            </div>
            ${event.description ? `
            <div class="info-row" style="flex-direction: column;">
              <span class="info-label">Deskripsi:</span>
              <span class="info-value" style="margin-top: 5px;">${event.description}</span>
            </div>
            ` : ""}
            ${attachmentList.length > 0 ? `
            <p style="margin-top: 15px; padding: 10px; background: #dbeafe; border-radius: 4px; color: #1e40af;">
              📎 Surat permohonan terlampir dalam email ini.
            </p>
            ` : ""}
          </div>
          <div class="footer">
            <p>Email ini dikirim otomatis dari Sistem Manajemen Wasit FFI Sulsel</p>
            <p>© ${new Date().getFullYear()} Federasi Futsal Indonesia - Sulawesi Selatan</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending email to:", ASSOCIATION_EMAIL);

    // Initialize SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHostname,
        port: smtpPort,
        tls: smtpTls,
        auth: {
          username: smtpUsername,
          password: smtpPassword,
        },
      },
    });

    // Send email
    await client.send({
      from: smtpFrom!,
      to: ASSOCIATION_EMAIL,
      subject: `[Pengajuan Event] ${event.name}`,
      html: emailHtml,
      attachments: attachmentList.length > 0 ? attachmentList : undefined,
    });

    // Close connection
    await client.close();

    console.log("Email sent successfully via SMTP");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-event-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
