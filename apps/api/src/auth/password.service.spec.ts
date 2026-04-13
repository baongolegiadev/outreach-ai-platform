import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies a password', () => {
    const hash = service.hashPassword('StrongPass123!');
    expect(hash).toContain('scrypt$');
    expect(service.verifyPassword('StrongPass123!', hash)).toBe(true);
    expect(service.verifyPassword('WrongPass123!', hash)).toBe(false);
  });
});
