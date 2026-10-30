import { runtimeConfig } from '@/config/runtime';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const QR_PREFIX = 'OBS-YOKLAMA';

// Kod okutulduktan sonra dijital imza adımı birkaç rotasyon sürebilir;
// bu yüzden eski kodlar yaklaşık bir dakika boyunca geçerli kalır.
const CODE_GRACE_SLOTS = 3;

function hash32(input: string, seed: number): number {
  let hash = seed >>> 0;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash >>> 0;
}

export function rotationSlot(
  startedAtMs: number,
  rotationSeconds: number,
  nowMs: number,
): number {
  const elapsed = Math.max(0, nowMs - startedAtMs);

  return Math.floor(elapsed / (rotationSeconds * 1000));
}

export function rotationCountdown(
  startedAtMs: number,
  rotationSeconds: number,
  nowMs: number,
): number {
  const windowMs = rotationSeconds * 1000;
  const elapsed = Math.max(0, nowMs - startedAtMs);

  return Math.max(0, Math.ceil((windowMs - (elapsed % windowMs)) / 1000));
}

export function deriveAttendanceCode(
  secret: string,
  sessionId: string,
  slot: number,
  length = runtimeConfig.attendance.codeLength,
): string {
  const source = `${sessionId}:${slot}:${secret}`;
  let code = '';

  for (let block = 0; code.length < length; block += 1) {
    const blockHash = hash32(source, (0x811c9dc5 + block * 0x9e3779b1) >>> 0);

    for (let byte = 0; byte < 4 && code.length < length; byte += 1) {
      code += ALPHABET[(blockHash >>> (byte * 8)) & 31];
    }
  }

  return code;
}

export function sessionCodeAt(session: { id: string; secret: string; startedAt: string; rotationSeconds: number }, nowMs: number): string {
  const slot = rotationSlot(new Date(session.startedAt).getTime(), session.rotationSeconds, nowMs);

  return deriveAttendanceCode(session.secret, session.id, slot);
}

export function isSessionCodeValid(
  session: { id: string; secret: string; startedAt: string; rotationSeconds: number },
  code: string,
  nowMs: number,
): boolean {
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return false;
  }

  const startedAtMs = new Date(session.startedAt).getTime();
  const slot = rotationSlot(startedAtMs, session.rotationSeconds, nowMs);
  const candidates = Array.from(
    { length: CODE_GRACE_SLOTS + 1 },
    (_, offset) => slot - offset,
  ).filter((candidate) => candidate >= 0);

  return candidates.some(
    (candidate) =>
      deriveAttendanceCode(session.secret, session.id, candidate).toUpperCase() === normalized,
  );
}

export function buildQrPayload(sessionId: string, code: string): string {
  return `${QR_PREFIX}:${sessionId}:${code}`;
}

export function parseQrPayload(raw: string): { sessionId: string; code: string } | null {
  const parts = raw.trim().split(':');

  if (parts.length !== 3 || parts[0] !== QR_PREFIX) {
    return null;
  }

  const [, sessionId, code] = parts;

  if (!sessionId || !/^[A-Z0-9]{6}$/i.test(code)) {
    return null;
  }

  return { sessionId, code: code.toUpperCase() };
}
