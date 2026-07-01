declare module "bcrypt" {
  export function hash(data: string, saltOrRounds: string | number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
}

declare module "jsonwebtoken" {
  export type JwtPayload = string | { [key: string]: unknown };

  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: string,
    options?: {
      expiresIn?: string | number;
    },
  ): string;

  export function verify(token: string, secretOrPublicKey: string): JwtPayload;
}
