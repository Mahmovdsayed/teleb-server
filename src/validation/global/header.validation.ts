import z from "zod";

export const headerValidationSchema = z.compile(
  z.object({
    Authorization: z.string().min(1),
  }),
);

export type HeaderRequest = z.infer<typeof headerValidationSchema>;
