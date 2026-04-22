import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByUsername } from '@/mocks/user/user.mock';
import { JwtPayload } from '@/models/user';

const JWT_SECRET = process.env.JWT_SECRET ?? 'fiscpredict-dev-secret';
// 24h en secondes — configurable via JWT_EXPIRES_IN_SECONDS si besoin
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 86400);

export interface LoginResult {
  success: true;
  token: string;
  username: string;
}

export interface LoginError {
  success: false;
  message: string;
}

export async function login(username: string, password: string): Promise<LoginResult | LoginError> {
  const user = findUserByUsername(username);

  if (!user) {
    return { success: false, message: 'Identifiants invalides.' };
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return { success: false, message: 'Identifiants invalides.' };
  }

  const payload: JwtPayload = { sub: user.id, username: user.username };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return { success: true, token, username: user.username };
}
