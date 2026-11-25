const FREE_TESTS_KEY = 'reelmaker-free-tests-used';
const UNLOCKED_KEY = 'reelmaker-pro-unlocked';
export const MAX_FREE_TESTS = 1;

export const WHATSAPP_DISPLAY_NUMBER = '0635230749';
export const WHATSAPP_INTERNATIONAL_NUMBER = '212635230749';

const VALID_UNLOCK_CODES = new Set([
  'MAHFOUD2026',
  'MAHFOUDDIGITAL2026',
  'REELPRO2026',
  'PRO0635',
  'VIP2026',
]);

export interface TrialStatus {
  isUnlocked: boolean;
  freeTestsUsed: number;
  freeTestsRemaining: number;
  isLocked: boolean;
}

export function getTrialStatus(): TrialStatus {
  let isUnlocked = false;
  let freeTestsUsed = 0;

  try {
    isUnlocked = localStorage.getItem(UNLOCKED_KEY) === 'true';
    const rawUsed = parseInt(localStorage.getItem(FREE_TESTS_KEY) || '0', 10);
    freeTestsUsed = Number.isFinite(rawUsed) && rawUsed > 0 ? rawUsed : 0;
  } catch {
    // localStorage unavailable
  }

  const freeTestsRemaining = isUnlocked
    ? Infinity
    : Math.max(0, MAX_FREE_TESTS - freeTestsUsed);

  return {
    isUnlocked,
    freeTestsUsed,
    freeTestsRemaining,
    isLocked: !isUnlocked && freeTestsUsed >= MAX_FREE_TESTS,
  };
}

export function consumeFreeTest(): TrialStatus {
  const current = getTrialStatus();
  if (current.isUnlocked) return current;

  const nextUsed = current.freeTestsUsed + 1;
  try {
    localStorage.setItem(FREE_TESTS_KEY, String(nextUsed));
  } catch {
    // ignore storage errors
  }

  return getTrialStatus();
}

export function tryUnlockApp(codeInput: string): boolean {
  const normalized = (codeInput || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!normalized || !VALID_UNLOCK_CODES.has(normalized)) {
    return false;
  }
  try {
    localStorage.setItem(UNLOCKED_KEY, 'true');
  } catch {
    // ignore storage errors
  }
  return true;
}

export function getWhatsAppUnlockUrl(isArabic: boolean): string {
  const msg = isArabic
    ? 'مرحباً، لقد جربت تطبيق ReelMaker 20s وأرغب في فتح النسخة الكاملة (كود التفعيل).'
    : "Bonjour, j'ai testé l'application ReelMaker 20s et je souhaite déverrouiller la version complète.";
  return `https://wa.me/${WHATSAPP_INTERNATIONAL_NUMBER}?text=${encodeURIComponent(msg)}`;
}
