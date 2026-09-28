import { hash, verify, type Options } from "@node-rs/argon2";

const opts: Options = {
  memoryCost: Number(process.env.ARGON2_MEMORY_COST),
  timeCost: Number(process.env.ARGON2_TIME_COST),
  parallelism: 4,
  outputLen: 32,
  algorithm: 2,
};

export class PasswordService {
  static async hashPassword(password: string): Promise<string> { return hash(password, opts) }
  static async verifyPassword(data: { password: string; hash: string }): Promise<boolean> { return verify(data.hash, data.password, opts) }
}