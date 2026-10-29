import type { LoginCredentials, Role } from '@/types/auth';

export type LoginErrors = Partial<Record<keyof LoginCredentials, string>>;

export function validateLogin(role: Role, values: LoginCredentials): LoginErrors {
  const errors: LoginErrors = {};
  const identifier = values.identifier.trim();

  if (!identifier) {
    errors.identifier = 'Bu alan boş bırakılamaz.';
  } else if (role === 'student' && !/^\d{4,12}$/.test(identifier)) {
    errors.identifier = 'Öğrenci numarası 4–12 haneli olmalıdır.';
  } else if (role === 'academic' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
    errors.identifier = 'Geçerli bir kurumsal e-posta adresi gir.';
  } else if (role === 'admin' && identifier.length < 3) {
    errors.identifier = 'Kullanıcı adı en az 3 karakter olmalıdır.';
  }

  if (!values.password) {
    errors.password = 'Şifreni gir.';
  } else if (values.password.length < 6) {
    errors.password = 'Şifre en az 6 karakter olmalıdır.';
  }

  return errors;
}
