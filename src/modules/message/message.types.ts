import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { messageTable } from "../../database/schemas";
import type { Lang } from "../../i18n";

export type Message = InferSelectModel<typeof messageTable>;
export type NewMessage = InferInsertModel<typeof messageTable>;

export type Locale = Lang;

export interface CreateMessage {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface MessageListItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  isViewed: boolean;
  createdAt: Date;
}

export interface MessageResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isViewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetMessagesOptions {
  page: number;
  limit: number;
  isViewed?: boolean | undefined;
  search?: string | undefined;
  sort?: "createdAt" | "fullName" | "email" | "subject" | "isViewed" | undefined;
  order?: "asc" | "desc" | undefined;
}

export interface IMessageService {
  create(
    data: CreateMessage,
    locale: Locale,
  ): Promise<void>;

  getAll(
    options: GetMessagesOptions,
  ): Promise<{
    data: MessageListItem[];
    total: number;
  }>;

  getById(id: number): Promise<MessageResponse>;

  markAsViewed(id: number): Promise<MessageResponse>;

  delete(id: number): Promise<void>;
}
