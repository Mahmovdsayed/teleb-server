import {
  handleCallback,
  registerDevConsumer,
  QueueClient,
} from "@vercel/queue";
import type { Locale } from "../modules/message/message.types";
import { SUPPORTED_LANGS } from "../i18n";
import { processContactClassification } from "./contact-classification";

type ContactClassificationJob = {
  messageId: number;
  locale: Locale;
};

function isContactClassificationJob(
  value: unknown,
): value is ContactClassificationJob {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const job = value as Record<string, unknown>;

  return (
    typeof job.messageId === "number" &&
    Number.isInteger(job.messageId) &&
    job.messageId > 0 &&
    (SUPPORTED_LANGS as readonly string[]).includes(String(job.locale))
  );
}

export const contactClassificationHandler = handleCallback<unknown>(
  async (job: unknown) => {
    if (!isContactClassificationJob(job)) {
      throw new Error("Invalid contact classification job payload");
    }
    await processContactClassification(job);
  },
  {
    retry: (_err, meta) => {
      if (meta.deliveryCount >= 3) return { acknowledge: true };
      return { afterSeconds: 30 };
    },
  },
);

const devClient = new QueueClient();
registerDevConsumer({
  topic: "contact-classification",
  client: devClient,
  handler: async (job: unknown) => {
    if (!isContactClassificationJob(job)) {
      console.warn("[dev consumer] Skipping invalid job payload:", job);
      return;
    }
    await processContactClassification(job);
  },
  consumerGroup: "dev-contact-classification",
});
