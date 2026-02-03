import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  recipientName: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string | null;
  businessName: string;
  businessEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send invoice email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: SendInvoiceRequest = await req.json();
    console.log("Request body:", body);

    const {
      invoiceId,
      recipientEmail,
      recipientName,
      invoiceNumber,
      totalAmount,
      dueDate,
      businessName,
      businessEmail,
    } = body;

    // Format currency
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(totalAmount);

    // Format date
    const formattedDueDate = dueDate 
      ? new Date(dueDate).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "On Receipt";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${businessName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Invoice ${invoiceNumber}</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Dear ${recipientName},
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Please find attached your invoice <strong>${invoiceNumber}</strong> from ${businessName}.
            </p>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Invoice Number:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Amount Due:</td>
                  <td style="padding: 8px 0; color: #0d9488; font-weight: 700; font-size: 18px; text-align: right;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Due Date:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${formattedDueDate}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              If you have any questions about this invoice, please contact us at ${businessEmail || "our support email"}.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
              Thank you for your business!<br>
              ${businessName}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending email to:", recipientEmail);

    const emailResponse = await resend.emails.send({
      from: `${businessName} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: `Invoice ${invoiceNumber} from ${businessName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invoice-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
