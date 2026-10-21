import jwt, { type SignOptions } from "jsonwebtoken";

export type TokenSubject = { id: string; email: string; name: string; roles: string[] };

export function issueAccessToken(user: TokenSubject, secret: string, expiresIn: SignOptions["expiresIn"]) {
  const accessToken = jwt.sign(
    { email: user.email, name: user.name, roles: user.roles },
    secret,
    { subject: user.id, expiresIn, issuer: "iron-ledger-api" },
  );

  return {
    accessToken,
    tokenType: "Bearer" as const,
    expiresIn,
    user: { id: user.id, email: user.email, name: user.name, roles: user.roles },
  };
}
