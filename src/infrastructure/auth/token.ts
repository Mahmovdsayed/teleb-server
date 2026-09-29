import { z } from "zod";
import { sign, verify } from "hono/jwt";
import { env } from "../../config/env";
import type { User } from "../../types/user";

const tokenPayloadSchema = z.compile(
  z.object({
    id: z.number().int().positive(),
    email: z.email(),
    role: z.string(),
    name: z.string(),
    iat: z.number(),
    exp: z.number(),
  }),
);

type TokenPayload = z.infer<typeof tokenPayloadSchema>;


class TokenService {
  public async create(user: User) {
    const now = Math.floor(Date.now() / 1000);

    return await sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        iat: now,
        exp: now + 7 * 24 * 60 * 60,
      },
      env.LOGIN_SIG,
      "HS256",
    );
  }

  public async verify(token: string): Promise<TokenPayload> {
    const payload = await verify(token, env.LOGIN_SIG, "HS256");
    return tokenPayloadSchema.parse(payload);
  }
}

export const tokenService = new TokenService();
