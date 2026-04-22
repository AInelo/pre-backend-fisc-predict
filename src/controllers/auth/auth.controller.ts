import { Request, Response } from 'express';
import { login } from '@/services/auth/auth.service';

export async function loginController(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'username et password sont requis.' });
    return;
  }

  const result = await login(username, password);

  if (!result.success) {
    res.status(401).json({ success: false, message: result.message });
    return;
  }

  res.status(200).json({
    success: true,
    token: result.token,
    username: result.username,
  });
}
