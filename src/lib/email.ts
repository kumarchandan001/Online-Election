// =============================================================================
// Email Service — Lightweight Nodemailer utility
//
// Supports two modes:
//   1. PRODUCTION: Uses SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
//   2. DEVELOPMENT: Falls back to Nodemailer's Ethereal test account (no real emails sent)
//
// Emails are sent asynchronously (fire-and-forget) so they don't block the API response.
// =============================================================================

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

/**
 * Lazily initializes the SMTP transporter.
 * Uses real SMTP in production, Ethereal test account in development.
 */
async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // Production SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: use Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(
      `📧 Dev email mode: view sent emails at https://ethereal.email (user: ${testAccount.user})`
    );
  }

  return transporter;
}

/**
 * Send a voter registration notification email.
 * Fire-and-forget — errors are logged but don't propagate.
 */
export async function sendVoterRegistrationEmail(opts: {
  toEmail: string;
  toName: string;
  electionTitle: string;
  loginUrl: string;
}): Promise<void> {
  try {
    const transport = await getTransporter();
    const fromAddress =
      process.env.SMTP_FROM || "noreply@votesecure.app";

    const info = await transport.sendMail({
      from: `"VoteSecure" <${fromAddress}>`,
      to: opts.toEmail,
      subject: `🗳️ You've been registered to vote: ${opts.electionTitle}`,
      text: [
        `Hello ${opts.toName},`,
        "",
        `You have been registered to vote in: ${opts.electionTitle}`,
        "",
        "Please sign in to cast your ballot:",
        opts.loginUrl,
        "",
        "Use your existing account credentials to log in.",
        "If you have any issues, contact your election administrator.",
        "",
        "— VoteSecure Election System",
      ].join("\n"),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; font-size: 28px; width: 56px; height: 56px; line-height: 56px; border-radius: 16px;">🗳️</div>
          </div>
          <h2 style="color: #1e293b; margin-bottom: 8px;">You're registered to vote!</h2>
          <p style="color: #64748b; font-size: 14px;">
            Hello <strong>${opts.toName}</strong>, you've been added to the voter registry for:
          </p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="font-size: 18px; font-weight: 600; color: #1e293b; margin: 0;">${opts.electionTitle}</p>
          </div>
          <a href="${opts.loginUrl}" style="display: block; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 14px; margin: 24px 0;">
            Sign In to Vote →
          </a>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            Use your existing account credentials to log in.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">
            VoteSecure — Secure Online Election System
          </p>
        </div>
      `,
    });

    // In dev mode, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Preview email: ${previewUrl}`);
    }
  } catch (err) {
    // Log but don't throw — email failures shouldn't block voter registration
    console.error("Email send error (non-blocking):", err);
  }
}
