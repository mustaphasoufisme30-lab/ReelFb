import React, { useState } from 'react';
import { Lock, CheckCircle2, KeyRound, X, Copy, Check, Sparkles } from 'lucide-react';
import {
  WHATSAPP_DISPLAY_NUMBER,
  getWhatsAppUnlockUrl,
  tryUnlockApp,
} from '../utils/trialManager';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  isArabic: boolean;
}

export const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M16.002 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.59 4.46 1.71 6.4L3.2 28.8l6.58-1.72a12.74 12.74 0 0 0 6.22 1.61h.01c7.06 0 12.8-5.74 12.8-12.8 0-3.42-1.33-6.64-3.75-9.05a12.72 12.72 0 0 0-9.06-3.64zm0 23.33h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.9 1.02 1.04-3.8-.25-.4a10.58 10.58 0 0 1-1.63-5.64c0-5.85 4.76-10.61 10.62-10.61 2.84 0 5.5 1.11 7.5 3.11a10.55 10.55 0 0 1 3.11 7.5c0 5.86-4.76 10.62-10.69 10.53zm5.82-7.95c-.32-.16-1.88-.93-2.18-1.03-.29-.11-.5-.16-.72.16-.21.32-.82 1.03-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.3 3.3c.16.21 2.26 3.45 5.47 4.84.76.33 1.36.53 1.82.67.77.24 1.46.21 2.01.13.61-.09 1.88-.77 2.15-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z" />
  </svg>
);

export const UnlockModal: React.FC<UnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlocked,
  isArabic,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const whatsappUrl = getWhatsAppUnlockUrl(isArabic);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (tryUnlockApp(code)) {
      setCode('');
      onUnlocked();
    } else {
      setError(
        isArabic
          ? 'كود التفعيل غير صحيح. تواصل معنا عبر واتساب للحصول على الكود.'
          : "Code d'activation invalide. Contactez-nous sur WhatsApp pour obtenir votre code."
      );
    }
  };

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(WHATSAPP_DISPLAY_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        dir={isArabic ? 'rtl' : 'ltr'}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Top Accent Header */}
        <div className="relative p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-3 shadow-inner">
            <Lock size={24} className="text-amber-300" />
          </div>

          <h2 className="text-lg font-black tracking-tight">
            {isArabic
              ? 'انتهت التجربة المجانية — افتح التطبيق الكامل'
              : "Test gratuit terminé — Déverrouillez l'application"}
          </h2>
          <p className="text-xs text-blue-100 mt-1 leading-relaxed">
            {isArabic
              ? 'لقد استخدمت تجربتك المجانية الواحدة. تواصل معنا عبر واتساب لتفعيل النسخة الكاملة وإنشاء ريلز غير محدودة.'
              : "Vous avez utilisé votre unique test gratuit. Contactez-nous sur WhatsApp pour déverrouiller la version complète sans limite."}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Features List */}
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>
                {isArabic
                  ? 'إنشاء عدد غير محدود من ريلز فيسبوك (20 ثانية)'
                  : 'Création illimitée de Réels Facebook de 20 secondes'}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>
                {isArabic
                  ? 'صوت ذكاء اصطناعي Gemini متزامن مع النص تلقائياً'
                  : 'Voix IA Gemini synchronisée automatiquement avec le texte'}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>
                {isArabic
                  ? 'تحميل فيديو MP4 عالي الجودة مع خلفية من هاتفك'
                  : 'Téléchargement MP4 HD illimité avec vos photos du téléphone'}
              </span>
            </li>
          </ul>

          {/* Primary WhatsApp CTA Button */}
          <div className="space-y-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition transform active:scale-[0.99]"
            >
              <WhatsAppIcon size={20} />
              <span>
                {isArabic
                  ? `تواصل معنا عبر واتساب : ${WHATSAPP_DISPLAY_NUMBER}`
                  : `Contacter nous (WhatsApp) : ${WHATSAPP_DISPLAY_NUMBER}`}
              </span>
            </a>

            <button
              type="button"
              onClick={handleCopyNumber}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span>
                    {isArabic
                      ? `تم نسخ الرقم ${WHATSAPP_DISPLAY_NUMBER}`
                      : `Numéro ${WHATSAPP_DISPLAY_NUMBER} copié !`}
                  </span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>
                    {isArabic
                      ? `نسخ رقم الواتساب : ${WHATSAPP_DISPLAY_NUMBER}`
                      : `Copier le numéro : ${WHATSAPP_DISPLAY_NUMBER}`}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Activation Code Form */}
          <form
            onSubmit={handleUnlockSubmit}
            className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5"
          >
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <KeyRound size={14} className="text-blue-600 dark:text-blue-400" />
              <span>
                {isArabic
                  ? 'هل لديك كود التفعيل؟ أدخله هنا :'
                  : "Vous avez reçu votre code d'activation ?"}
              </span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder={isArabic ? 'أدخل كود التفعيل...' : 'Entrez le code...'}
                className="flex-1 text-xs font-mono uppercase bg-slate-50 border border-slate-300 text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!code.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles size={14} />
                <span>{isArabic ? 'تفعيل' : 'Déverrouiller'}</span>
              </button>
            </div>

            {error && (
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
