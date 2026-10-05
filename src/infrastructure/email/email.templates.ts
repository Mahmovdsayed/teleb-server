import type { ContactMessageEmailData, EmailLocale } from "./email.types";
import { escapeHtml } from "./email.utils";

export function getAdminNewMessageTemplate(data: ContactMessageEmailData): {
  subject: string;
  html: string;
} {
  const safeName = escapeHtml(data.fullName);
  const safeEmail = escapeHtml(data.email);
  const safePhone = escapeHtml(data.phone);
  const safeSubject = escapeHtml(data.subject);
  const safeMessage = escapeHtml(data.message).replace(/\n/g, "<br/>");
  const dateStr = (data.createdAt ?? new Date()).toUTCString();

  const emailSubject = `New Contact Message: ${data.fullName} - ${data.subject}`;

  const html = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(emailSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">New Contact Message</h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Received on ${dateStr}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 16px;">
                    <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Sender Name</span>
                    <span style="font-size: 15px; font-weight: 600; color: #0f172a;">${safeName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Email Address</span>
                    <a href="mailto:${safeEmail}" style="font-size: 15px; color: #2563eb; text-decoration: none;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Phone Number</span>
                    <a href="tel:${safePhone}" style="font-size: 15px; color: #0f172a; text-decoration: none;">${safePhone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Subject</span>
                    <span style="font-size: 16px; font-weight: 600; color: #0f172a;">${safeSubject}</span>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Message</span>
                    <div style="font-size: 15px; line-height: 1.6; color: #334155; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                      ${safeMessage}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
              You can reply directly to this email to respond to the sender.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject: emailSubject, html };
}

export function getMessageReceivedTemplate(
  data: ContactMessageEmailData,
  locale: EmailLocale,
): { subject: string; html: string } {
  const isArabic = locale === "ar";
  const safeName = escapeHtml(data.fullName);
  const safeSubject = escapeHtml(data.subject);

  const subject = isArabic
    ? `تم استلام رسالتك بنجاح: ${data.subject}`
    : `We received your message: ${data.subject}`;

  const greeting = isArabic ? `مرحبًا ${safeName}،` : `Hello ${safeName},`;
  const headline = isArabic
    ? "شكرًا لتواصلك معنا"
    : "Thank you for contacting us";
  const paragraph1 = isArabic
    ? "لقد استلمنا رسالتك بنجاح وسيقوم فريقنا بمراجعتها والتواصل معك في أقرب وقت ممكن."
    : "We have received your message successfully. Our team will review your inquiry and get back to you as soon as possible.";
  const subjectLabel = isArabic ? "الموضوع:" : "Subject:";
  const footerText = isArabic
    ? "هذه رسالة تأكيد تلقائية، يرجى عدم الرد المباشر عليها."
    : "This is an automated confirmation email, please do not reply directly to this message.";

  const dir = isArabic ? "rtl" : "ltr";
  const textAlign = isArabic ? "right" : "left";

  const html = `
<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; direction: ${dir}; text-align: ${textAlign};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: ${textAlign};">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">${headline}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px; text-align: ${textAlign};">
              <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #0f172a;">${greeting}</p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">${paragraph1}</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">${subjectLabel}</span>
                <span style="font-size: 15px; font-weight: 600; color: #0f172a;">${safeSubject}</span>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
              ${footerText}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}
