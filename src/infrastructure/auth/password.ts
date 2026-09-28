export class PasswordService {
  static async hashPassword(password: string): Promise<string> {
    return Bun.password.hash(password, { algorithm: "argon2id" });
  }
  static async verifyPassword(data: { password: string; hash: string }): Promise<boolean> {
    return Bun.password.verify(data.password, data.hash, "argon2id")
  }
}