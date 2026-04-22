export interface User {
  id: string;
  username: string;
  passwordHash: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}
