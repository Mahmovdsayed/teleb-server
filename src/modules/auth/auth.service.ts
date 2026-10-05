import { eq } from "drizzle-orm";
import { db } from "../../database";
import { userTable } from "../../database/schemas";
import type { SignInInput, SignUpInput } from "./auth.schemas";
import { PasswordService } from "../../infrastructure/auth/password";

interface IAuthService {
  signUp(input: SignUpInput): Promise<any>;
  signIn(input: SignInInput): Promise<any>;
}

// Precomputed Argon2id dummy hash for constant-time comparison when email is not found
const DUMMY_HASH = "$argon2id$v=19$m=65536,t=2,p=1$PoiUcKWVemFaNBRwrok1P39aZFXXYCmUjNNTrRwcv9Q$SjwRw+TncLLh0EXs9QVSAZN6hTsoCLTSSXVsNz2n4mo";

class AuthService implements IAuthService {
  public async signUp(input: SignUpInput): Promise<any> {
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, input.email))
      .limit(1);

    if (existingUser.length > 0) throw new Error("EMAIL_ALREADY_EXISTS");
    const hashedPassword = await PasswordService.hashPassword(input.password);

    const [user] = await db
      .insert(userTable)
      .values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: "user",
      })
      .returning();

    return user;
  }

  public async signIn(input: SignInInput): Promise<any> {
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, input.email))
      .limit(1);

    if (!user || !user.password) {
      await PasswordService.verifyPassword({ password: input.password, hash: DUMMY_HASH });
      throw new Error("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await PasswordService.verifyPassword({
      password: input.password,
      hash: user.password,
    });
    if (!isPasswordValid) throw new Error("INVALID_CREDENTIALS");

    return user;
  }
}

export const authService = new AuthService();
