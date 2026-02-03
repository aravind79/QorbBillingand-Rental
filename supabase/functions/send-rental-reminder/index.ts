import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  rentalId?: string;
  type: "overdue" | "due_today" | "manual";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { rentalId, type }: ReminderRequest = await req.json();

    let rentalsToNotify: any[] = [];

    if (rentalId) {
      // Manual reminder for specific rental
      const { data, error } = await supabase
        .from("rental_invoices")
        .select(`
          *,
          customer:rental_customers(name, email, phone)
        `)
        .eq("id", rentalId)
        .single();

      if (error) throw error;
      if (data) rentalsToNotify = [data];
    } else {
      // Auto reminders based on type
      const today = new Date().toISOString().split("T")[0];

      if (type === "overdue") {
        // Get rentals past expected return date that are still active
        const { data, error } = await supabase
          .from("rental_invoices")
          .select(`
            *,
            customer:rental_customers(name, email, phone)
          `)
          .in("rental_status", ["active", "overdue"])
          .lt("expected_return_date", today);

        if (error) throw error;
        rentalsToNotify = data || [];

        // Update status to overdue
        for (const rental of rentalsToNotify) {
          if (rental.rental_status !== "overdue") {
            await supabase
              .from("rental_invoices")
              .update({ rental_status: "overdue" })
              .eq("id", rental.id);
          }
        }
      } else if (type === "due_today") {
        // Get rentals due today
        const { data, error } = await supabase
          .from("rental_invoices")
          .select(`
            *,
            customer:rental_customers(name, email, phone)
          `)
          .eq("rental_status", "active")
          .eq("expected_return_date", today);

        if (error) throw error;
        rentalsToNotify = data || [];
      }
    }

    const results = [];

    for (const rental of rentalsToNotify) {
      const customer = rental.customer;
      if (!customer?.email) continue;

      // Get business settings for the rental owner
      const { data: businessSettings } = await supabase
        .from("business_settings")
        .select("business_name, phone")
        .eq("user_id", rental.user_id)
        .single();

      const businessName = businessSettings?.business_name || "HybridERP";
      const isOverdue = type === "overdue" || rental.rental_status === "overdue";
      
      const daysOverdue = isOverdue
        ? Math.ceil((new Date().getTime() - new Date(rental.expected_return_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const lateFees = isOverdue && rental.late_fee_per_day 
        ? daysOverdue * rental.late_fee_per_day 
        : 0;

      const subject = isOverdue
        ? `⚠️ Overdue Rental Return - ${rental.rental_number}`
        : `📅 Rental Return Reminder - ${rental.rental_number}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isOverdue ? '#dc2626' : '#0d9488'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 10px 15px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isOverdue ? '⚠️ Overdue Return Notice' : '📅 Return Reminder'}</h1>
            </div>
            <div class="content">
              <p>Dear ${customer.name},</p>
              
              ${isOverdue 
                ? `<p>Your rental <strong>${rental.rental_number}</strong> was due for return on <strong>${new Date(rental.expected_return_date).toLocaleDateString()}</strong> and is now <strong>${daysOverdue} day(s) overdue</strong>.</p>`
                : `<p>This is a friendly reminder that your rental <strong>${rental.rental_number}</strong> is due for return <strong>today</strong>.</p>`
              }
              
              <div class="details">
                <p><strong>Rental Number:</strong> ${rental.rental_number}</p>
                <p><strong>Return Date:</strong> ${new Date(rental.expected_return_date).toLocaleDateString()}</p>
                <p><strong>Security Deposit:</strong> ₹${rental.security_deposit || 0}</p>
                ${lateFees > 0 ? `<p><strong>Late Fees Accrued:</strong> ₹${lateFees}</p>` : ''}
              </div>
              
              ${isOverdue ? `
              <div class="warning">
                <strong>Important:</strong> Late fees of ₹${rental.late_fee_per_day || 0} per day are being applied. Please return the items immediately to minimize additional charges.
              </div>
              ` : ''}
              
              <p>Please return the rented items in good condition. Your security deposit of ₹${rental.security_deposit || 0} will be refunded upon satisfactory return.</p>
              
              ${businessSettings?.phone ? `<p>For questions, contact us at: ${businessSettings.phone}</p>` : ''}
              
              <p>Thank you for choosing ${businessName}!</p>
            </div>
            <div class="footer">
              <p>This is an automated reminder from ${businessName}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      if (RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `${businessName} <notifications@resend.dev>`,
            to: [customer.email],
            subject,
            html,
          }),
        });

        const emailResult = await res.json();
        results.push({
          rentalId: rental.id,
          rentalNumber: rental.rental_number,
          email: customer.email,
          success: res.ok,
          result: emailResult,
        });
      } else {
        results.push({
          rentalId: rental.id,
          rentalNumber: rental.rental_number,
          email: customer.email,
          success: false,
          error: "RESEND_API_KEY not configured",
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} reminders`,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
