import { tr, type MessageKey } from '@/i18n/messages';
import type { LoginCredentials, Role } from '@/types/auth';

export type LoginErrors = Partial<Record<keyof LoginCredentials, string>>;

type Translate = (key: MessageKey) => string;

export function validateLogin(
  role: Role,
  values: LoginCredentials,
  t: Translate = (key) => tr[key],
): LoginErrors {
  const errors: LoginErrors = {};
  const identifier = values.identifier.trim();

  if (!identifier) {
    errors.identifier = t('validation.required');
  } else if (role === 'student' && !/^\d{4,12}$/.test(identifier)) {
    errors.identifier = t('validation.studentNumber');
  } else if (role === 'academic' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
    errors.identifier = t('validation.academicEmail');
  } else if (role === 'admin' && identifier.length < 3) {
    errors.identifier = t('validation.username');
  }

  if (!values.password) {
    errors.password = t('validation.passwordRequired');
  } else if (values.password.length < 6) {
    errors.password = t('validation.passwordLength');
  }

  return errors;
}
