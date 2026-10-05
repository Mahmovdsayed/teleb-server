export type EmailLocale = "en" | "ar";

export interface ContactMessageEmailData {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt?: Date | undefined;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | undefined;
}
