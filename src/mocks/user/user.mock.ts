import { User } from '@/models/user';

// Hash bcrypt (rounds=10) de 'fiscpredict@2026' — précomputé pour éviter le blocage au démarrage
const MOCK_PASSWORD_HASH = '$2a$10$7lMXECewms5dyP.jTZOdWOPFR8Bblnds3tYHJuKQuil/NaF.VL3t6';

export const MOCK_USERS: User[] = [
  {
    id: 'user-fiscpredict-001',
    username: 'fiscpredict@impot.bj',
    passwordHash: MOCK_PASSWORD_HASH,
  },
];

export function findUserByUsername(username: string): User | undefined {
  return MOCK_USERS.find((u) => u.username === username);
}

export function findUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
