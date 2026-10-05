import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { offerTable } from "../../database/schemas";

export type Offer = InferSelectModel<typeof offerTable>;
export type NewOffer = InferInsertModel<typeof offerTable>;

export interface OfferResponse {
  id: number;

  arName: string;
  arDescription: string;
  arBannerText: string;

  enName: string;
  enDescription: string;
  enBannerText: string;

  percentage: string;

  startDate: Date;
  endDate: Date;

  isActive: boolean;
  showBanner: boolean;

  bannerBackgroundColor: string;
  bannerTextColor: string;

  createdBy: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOffer {
  arName: string;
  arDescription?: string | undefined;
  arBannerText?: string | undefined;

  enName: string;
  enDescription?: string | undefined;
  enBannerText?: string | undefined;

  percentage: string;

  startDate: Date;
  endDate: Date;

  isActive?: boolean | undefined;
  showBanner?: boolean | undefined;

  bannerBackgroundColor?: string | undefined;
  bannerTextColor?: string | undefined;
}

export interface UpdateOffer {
  arName?: string | undefined;
  arDescription?: string | undefined;
  arBannerText?: string | undefined;

  enName?: string | undefined;
  enDescription?: string | undefined;
  enBannerText?: string | undefined;

  percentage?: string | undefined;

  startDate?: Date | undefined;
  endDate?: Date | undefined;

  isActive?: boolean | undefined;
  showBanner?: boolean | undefined;

  bannerBackgroundColor?: string | undefined;
  bannerTextColor?: string | undefined;
}

export interface GetOffersOptions {
  page: number;
  limit: number;
  isActive?: boolean | undefined;
  showBanner?: boolean | undefined;
  sort?: "createdAt" | "startDate" | "endDate" | "percentage" | undefined;
  order?: "asc" | "desc" | undefined;
}

export interface IOfferService {
  getAll(options: GetOffersOptions): Promise<{
    data: OfferResponse[];
    total: number;
  }>;

  getById(id: number): Promise<OfferResponse>;

  getCurrentBannerOffer(): Promise<OfferResponse | null>;

  create(
    data: CreateOffer,
    userId: number,
  ): Promise<OfferResponse>;

  update(
    id: number,
    data: UpdateOffer,
  ): Promise<OfferResponse>;

  delete(id: number): Promise<void>;

  updateStatus(
    id: number,
    value: boolean,
  ): Promise<OfferResponse>;

  updateShowBanner(
    id: number,
    value: boolean,
  ): Promise<OfferResponse>;
}
