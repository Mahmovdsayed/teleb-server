import { z } from "zod";

const collectionSchema = z.object({
  arName: z.string().trim().min(1).max(100),
  enName: z.string().trim().min(1).max(100),
  icon: z.string().trim().min(1).max(50),
});

export const createCollectionSchema = z.compile(collectionSchema);

export const updateCollectionSchema = z
  .compile(collectionSchema.partial())
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: "At least one field must be provided",
  });

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
