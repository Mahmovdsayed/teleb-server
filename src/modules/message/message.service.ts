import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../../database";
import { messageTable } from "../../database/schemas";
import { emailService } from "../../infrastructure/email/email";
import { normalizeEmail, normalizePhone } from "../../infrastructure/email/email.utils";
import type {
  CreateMessage,
  GetMessagesOptions,
  IMessageService,
  Locale,
  MessageListItem,
  MessageResponse,
} from "./message.types";

class MessageService implements IMessageService {
  public async create(data: CreateMessage, locale: Locale): Promise<void> {
    const email = normalizeEmail(data.email);
    const phone = normalizePhone(data.phone);

    const [pending] = await db
      .select({ id: messageTable.id })
      .from(messageTable)
      .where(
        or(
          and(
            eq(messageTable.email, email),
            eq(messageTable.isViewed, false),
          ),
          and(
            eq(messageTable.phone, phone),
            eq(messageTable.isViewed, false),
          ),
        ),
      )
      .limit(1);

    if (pending) {
      throw new Error("MESSAGE_ALREADY_PENDING");
    }

    const [message] = await db
      .insert(messageTable)
      .values({
        fullName: data.fullName.trim(),
        email,
        phone,
        subject: data.subject.trim(),
        message: data.message.trim(),
        isViewed: false,
      })
      .returning();

    if (!message) {
      throw new Error("MESSAGE_CREATE_FAILED");
    }

    queueMicrotask(() => {
      emailService
        .sendContactEmails(
          {
            fullName: message.fullName,
            email: message.email,
            phone: message.phone,
            subject: message.subject,
            message: message.message,
            createdAt: message.createdAt,
          },
          locale,
        )
        .catch((error) => {
          console.error("Failed to send contact notification emails:", error);
        });
    });
  }

  public async getAll(options: GetMessagesOptions): Promise<{
    data: MessageListItem[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 10,
      isViewed,
      search,
      sort = "createdAt",
      order = "desc",
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (isViewed !== undefined) {
      conditions.push(eq(messageTable.isViewed, isViewed));
    }

    if (search && search.trim().length > 0) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(messageTable.fullName, pattern),
          ilike(messageTable.email, pattern),
          ilike(messageTable.phone, pattern),
          ilike(messageTable.subject, pattern),
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumns = {
      createdAt: messageTable.createdAt,
      fullName: messageTable.fullName,
      email: messageTable.email,
      subject: messageTable.subject,
      isViewed: messageTable.isViewed,
    };

    const selectedColumn =
      sort && sortColumns[sort] ? sortColumns[sort] : messageTable.createdAt;
    const orderBy = order === "asc" ? asc(selectedColumn) : desc(selectedColumn);

    const [messages, countResult] = await db.batch([
      db
        .select({
          id: messageTable.id,
          fullName: messageTable.fullName,
          email: messageTable.email,
          phone: messageTable.phone,
          subject: messageTable.subject,
          isViewed: messageTable.isViewed,
          createdAt: messageTable.createdAt,
        })
        .from(messageTable)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      db.select({ count: count() }).from(messageTable).where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { data: messages, total };
  }

  public async getById(id: number): Promise<MessageResponse> {
    const [message] = await db
      .select()
      .from(messageTable)
      .where(eq(messageTable.id, id))
      .limit(1);

    if (!message) {
      throw new Error("MESSAGE_NOT_FOUND");
    }

    return message;
  }

  public async markAsViewed(id: number): Promise<MessageResponse> {
    const [updated] = await db
      .update(messageTable)
      .set({
        isViewed: true,
        updatedAt: new Date(),
      })
      .where(eq(messageTable.id, id))
      .returning();

    if (!updated) {
      throw new Error("MESSAGE_NOT_FOUND");
    }

    return updated;
  }

  public async delete(id: number): Promise<void> {
    const [deleted] = await db
      .delete(messageTable)
      .where(eq(messageTable.id, id))
      .returning({ id: messageTable.id });

    if (!deleted) {
      throw new Error("MESSAGE_NOT_FOUND");
    }
  }
}

export const messageService = new MessageService();
