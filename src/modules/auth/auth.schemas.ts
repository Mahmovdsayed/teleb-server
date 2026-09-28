import z from "zod";

export const singUpSchema = z.compile(
  z.object({
    name: z.string().min(1).max(20),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
  }),
);

export const signInSchema = z.compile(
  z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
  }),
);

export type SignUpInput = z.infer<typeof singUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
