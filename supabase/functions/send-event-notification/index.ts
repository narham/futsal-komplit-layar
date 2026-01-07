import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Association email for submission notifications (from environment variable)
const ASSOCIATION_EMAIL = Deno.env.get("ASSOCIATION_EMAIL") || "sulsel.afp@gmail.com";

// Sender email - must be verified domain in Resend or use onboarding@resend.dev for testing
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "FFI Sulsel <onboarding@resend.dev>";

interface EventNotificationRequest {
  eventId: string;
  type: "submission" | "approval";
  approvalNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    console.log("Resend configured, sender:", SENDER_EMAIL);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { eventId, type = "submission", approvalNotes }: EventNotificationRequest = await req.json();
    console.log("Processing event notification:", { eventId, type });

    // Fetch event data with related info
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`
        *,
        creator:created_by (id, full_name),
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

    // Format event date
    const eventDate = new Date(event.date).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let recipientEmail: string;
    let emailSubject: string;
    let emailHtml: string;
    let attachments: { filename: string; content: string }[] = [];

    if (type === "submission") {
      // SUBMISSION: Send to association email with document attachment
      recipientEmail = ASSOCIATION_EMAIL;
      emailSubject = `[Pengajuan Event] ${event.name}`;

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
          const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          const filename = event.document_path.split("/").pop() || "surat-permohonan";
          
          attachments.push({
            filename,
            content: base64Content,
          });
          console.log("Document attached:", filename);
        }
      }

      // Build submission email HTML
      emailHtml = `
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
              ${attachments.length > 0 ? `
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
    } else {
      // APPROVAL: Send to event creator's email
      if (!event.created_by) {
        console.error("Event has no creator");
        return new Response(
          JSON.stringify({ error: "Event has no creator" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get creator's email from auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(event.created_by);
      
      if (userError || !userData?.user?.email) {
        console.error("Failed to get creator email:", userError);
        return new Response(
          JSON.stringify({ error: "Creator email not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      recipientEmail = userData.user.email;
      emailSubject = `[Event Disetujui] ${event.name}`;

      console.log("Sending approval notification to:", recipientEmail);

      // Build approval email HTML
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .info-row { display: flex; margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px; }
            .info-label { font-weight: bold; width: 150px; color: #374151; }
            .info-value { flex: 1; }
            .success-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-bottom: 15px; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #1f2937; margin-top: 0; }
            .notes-box { background: #fef3c7; border: 1px solid #fcd34d; padding: 12px; border-radius: 6px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Event Telah Disetujui</h1>
            </div>
            <div class="content">
              <p>Halo <strong>${event.creator?.full_name || "Panitia"}</strong>,</p>
              <p>Selamat! Event yang Anda ajukan telah <strong>disetujui</strong> oleh Admin Provinsi.</p>
              
              <div class="success-badge">Status: DISETUJUI</div>
              
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
              ${event.category ? `
              <div class="info-row">
                <span class="info-label">Kategori:</span>
                <span class="info-value">${event.category}</span>
              </div>
              ` : ""}
              ${approvalNotes ? `
              <div class="notes-box">
                <strong>📝 Catatan dari Admin:</strong>
                <p style="margin: 5px 0 0 0;">${approvalNotes}</p>
              </div>
              ` : ""}
              
              <p style="margin-top: 20px;">Silakan login ke aplikasi untuk melihat detail lengkap dan mengelola event Anda.</p>
            </div>
            <div class="footer">
              <p>Email ini dikirim otomatis dari Sistem Manajemen Wasit FFI Sulsel</p>
              <p>© ${new Date().getFullYear()} Federasi Futsal Indonesia - Sulawesi Selatan</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    console.log("Sending email to:", recipientEmail);

    // Send email using Resend
    const emailPayload: any = {
      from: SENDER_EMAIL,
      to: [recipientEmail],
      subject: emailSubject,
      html: emailHtml,
    };

    // Add attachments if any
    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const { data: emailResult, error: emailError } = await resend.emails.send(emailPayload);

    if (emailError) {
      console.error("Failed to send email:", emailError);
      return new Response(
        JSON.stringify({ error: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully via Resend:", emailResult);

    return new Response(
      JSON.stringify({ success: true, recipientEmail, emailId: emailResult?.id }),
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
