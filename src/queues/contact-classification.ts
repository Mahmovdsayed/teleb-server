import { eq } from "drizzle-orm";
import type { Locale } from "../modules/message/message.types";
import { db } from "../database";
import { messageTable } from "../database/schemas";
import { classifyContact } from "../infrastructure/ai/classify-contact";
import { emailService } from "../infrastructure/email/email";

type ContactClassificationJob = {
  messageId: number;
  locale: Locale;
};

export async function processContactClassification(
  job: ContactClassificationJob,
): Promise<void> {
  const [message] = await db
    .select()
    .from(messageTable)
    .where(eq(messageTable.id, job.messageId))
    .limit(1);

  if (!message) {
    throw new Error(`Contact message ${job.messageId} was not found`);
  }

  const classificationResult = await classifyContact(
    `Subject: ${message.subject}\nMessage: ${message.message}`,
  );

  const category = classificationResult.category.choice;
  const priority = classificationResult.priority.choice;

  await db
    .update(messageTable)
    .set({ category, priority, updatedAt: new Date() })
    .where(eq(messageTable.id, message.id));

  const emailData = {
    fullName: message.fullName,
    email: message.email,
    phone: message.phone,
    subject: message.subject,
    message: message.message,
    createdAt: message.createdAt,
  };

  try {
    await emailService.sendMessageReceivedEmail(emailData, job.locale);
  } catch (emailError) {
    console.error(
      `[contact-classification] Failed to send customer email for message ${message.id}:`,
      emailError,
    );
  }

  if (priority === "high") {
    try {
      await emailService.sendAdminNewMessageEmail(emailData);
    } catch (emailError) {
      console.error(
        `[contact-classification] Failed to send admin notification for message ${message.id}:`,
        emailError,
      );
    }
  }
}
