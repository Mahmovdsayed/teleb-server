import nodemailer from "nodemailer";
import type {
  ContactMessageEmailData,
  EmailLocale,
  SendEmailOptions,
} from "./email.types";
import {
  getAdminNewMessageTemplate,
  getMessageReceivedTemplate,
} from "./email.templates";
import { env } from "../../config/env";

const smtpHost = env.SMTP_HOST;
const smtpPort = env.SMTP_PORT;
const smtpSecure = env.SMTP_SECURE;
const smtpUser = env.SMTP_USER;
const smtpPass = env.SMTP_PASSWORD;

function resolveMailFrom(
  mailFromEnv: string,
  smtpUser: string,
  smtpHost: string,
): string {
  if (!mailFromEnv) {
    return smtpUser
      ? `"Teleb Furniture" <${smtpUser}>`
      : `"Teleb Furniture" <no-reply@${smtpHost || "localhost"}>`;
  }

  if (mailFromEnv.includes("@")) {
    return mailFromEnv.includes("<")
      ? mailFromEnv
      : `"Teleb Furniture" <${mailFromEnv}>`;
  }

  const displayName = mailFromEnv.replace(/["']/g, "").trim();
  const address = smtpUser || `no-reply@${smtpHost || "localhost"}`;
  return `"${displayName}" <${address}>`;
}

const mailFrom = resolveMailFrom(env.MAIL_FROM, env.SMTP_USER, env.SMTP_HOST);

const adminEmail = env.ADMIN_EMAIL;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

export class EmailService {
  public async sendEmail(options: SendEmailOptions): Promise<void> {
    await transporter.sendMail({
      from: mailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });
  }

  public async sendAdminNewMessageEmail(
    data: ContactMessageEmailData,
  ): Promise<void> {
    if (!adminEmail) {
      console.warn(
        "ADMIN_EMAIL is not configured, skipping admin notification email.",
      );
      return;
    }

    const { subject, html } = getAdminNewMessageTemplate(data);
    await this.sendEmail({
      to: adminEmail,
      subject,
      html,
      replyTo: data.email,
    });
  }

  public async sendMessageReceivedEmail(
    data: ContactMessageEmailData,
    locale: EmailLocale = "en",
  ): Promise<void> {
    const { subject, html } = getMessageReceivedTemplate(data, locale);
    await this.sendEmail({
      to: data.email,
      subject,
      html,
    });
  }

  public async sendContactEmails(
    data: ContactMessageEmailData,
    locale: EmailLocale = "en",
  ): Promise<void> {
    const results = await Promise.allSettled([
      this.sendAdminNewMessageEmail(data),
      this.sendMessageReceivedEmail(data, locale),
    ]);

    for (const res of results) {
      if (res.status === "rejected") {
        console.error("Failed to send contact notification email:", res.reason);
      }
    }
  }
}

export const emailService = new EmailService();
