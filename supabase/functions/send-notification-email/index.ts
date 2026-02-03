import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "payment_confirmation" | "trial_expiry" | "invoice_reminder";
  to: string;
  data: {
    name?: string;
    amount?: number;
    invoiceNumber?: string;
    dueDate?: string;
    trialEndsAt?: string;
    planName?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();
    let subject = "";
    let html = "";

    switch (type) {
      case "payment_confirmation":
        subject = `Payment Confirmed - ₹${data.amount}`;
        html = `<h1>Payment Confirmed</h1><p>Dear ${data.name || "Customer"}, your payment of ₹${data.amount} has been received.</p>`;
        break;
      case "trial_expiry":
        subject = "Your HybridERP Trial is Ending Soon";
        html = `<h1>Trial Ending Soon</h1><p>Dear ${data.name || "User"}, your trial ends on ${data.trialEndsAt}.</p>`;
        break;
      case "invoice_reminder":
        subject = `Payment Reminder - Invoice #${data.invoiceNumber}`;
        html = `<h1>Payment Reminder</h1><p>Invoice #${data.invoiceNumber} for ₹${data.amount} is due on ${data.dueDate}.</p>`;
        break;
      default:
        throw new Error("Invalid email type");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "HybridERP <notifications@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);