import z from "zod";

export const paramValidationSchema = z.compile(
  z.object({
    id: z.coerce.number().int().positive(),
  }),
);

export type ParamRequest = z.infer<typeof paramValidationSchema>;
