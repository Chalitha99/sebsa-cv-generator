export interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

/** Shared across /signup and /auth/set-password — the only two places a password is ever set. */
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lowercase', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { id: 'number', label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { id: 'special', label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((req) => req.test(password));
}
