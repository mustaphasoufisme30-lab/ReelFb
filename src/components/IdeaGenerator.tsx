import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Flame,
  Lightbulb,
  Mic,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Globe2,
} from 'lucide-react';
import { PRESET_IDEAS } from '../data/presetIdeas';
import { PresetIdea } from '../types/reel';

interface IdeaGeneratorProps {
  onGenerate: (data: {
    idea: string;
    tone: string;
    targetAudience: string;
    language: string;
    voiceName: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const LANGUAGES = [
  { id: 'arabe', label: 'العربية (Arabe)', flag: '🇸🇦', isRtl: true },
  { id: 'français', label: 'Français', flag: '🇫🇷', isRtl: false },
  { id: 'anglais', label: 'English', flag: '🇬🇧', isRtl: false },
];

const TONES_FR = [
  { id: 'viral', label: '🔥 Viral & Choc', desc: 'Accroche explosive' },
  { id: 'éducatif', label: '💡 Éducatif & Direct', desc: 'Clair et percutant' },
  { id: 'business', label: '💼 Business & Cash', desc: 'Haute valeur' },
  { id: 'humour', label: '😂 Humour & Second degré', desc: 'Divertissant' },
  { id: 'mystérieux', label: '🔮 Mystère & Révélation', desc: 'Intrigue maximale' },
];

const TONES_AR = [
  { id: 'viral', label: '🔥 فيروسي وحماسي', desc: 'مقدمة صادمة تجذب الانتباه' },
  { id: 'éducatif', label: '💡 تعليمي ومباشر', desc: 'خطوات سريعة واضحة' },
  { id: 'business', label: '💼 مال وأعمال', desc: 'قيمة استثمارية عالية' },
  { id: 'humour', label: '😂 فكاهي وذكي', desc: 'أسلوب ممتع ومسلي' },
  { id: 'mystérieux', label: '🔮 غموض وتشويق', desc: 'سر يكشف لأول مرة' },
];

const VOICES = [
  { id: 'Fenrir', name: 'Fenrir', desc: 'Dynamique & percutant' },
  { id: 'Kore', name: 'Kore', desc: 'Chaleureuse & captivante' },
  { id: 'Puck', name: 'Puck', desc: 'Jeune & énergique' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Professionnel & clair' },
  { id: 'Charon', name: 'Charon', desc: 'Profond & autoritaire' },
];

export const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({
  onGenerate,
  isLoading,
}) => {
  const [language, setLanguage] = useState<'arabe' | 'français' | 'anglais'>('arabe');
  const [ideaText, setIdeaText] = useState('');
  const [tone, setTone] = useState('viral');
  const [targetAudience, setTargetAudience] = useState('Grand public');
  const [voiceName, setVoiceName] = useState('Fenrir');

  const isArabic = language === 'arabe';
  const tones = isArabic ? TONES_AR : TONES_FR;

  // Filter preset ideas for selected language
  const filteredPresets = PRESET_IDEAS.filter((p) => p.language === language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim() || isLoading) return;
    onGenerate({
      idea: ideaText.trim(),
      tone,
      targetAudience,
      language,
      voiceName,
    });
  };

  const handleSelectPreset = (preset: PresetIdea) => {
    setIdeaText(preset.prompt);
    setTone(preset.tone);
  };

  const handleLanguageChange = (newLang: 'arabe' | 'français' | 'anglais') => {
    setLanguage(newLang);
    // Auto populate idea if empty or switching languages
    const firstMatchingPreset = PRESET_IDEAS.find((p) => p.language === newLang);
    if (firstMatchingPreset && (!ideaText.trim() || PRESET_IDEAS.some(p => p.prompt === ideaText))) {
      setIdeaText(firstMatchingPreset.prompt);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. Language Selector Toolbar */}
      <div className="p-3 bg-slate-50 border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 border rounded-2xl">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-2">
          <Globe2 size={15} className="text-emerald-600 dark:text-emerald-400" />
          <span>Langue du Réel Facebook / لغة الريل :</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleLanguageChange(lang.id as any)}
                className={`py-2 px-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 font-bold text-xs cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20 dark:shadow-blue-900/40 ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-950/60 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Inspiration Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb size={14} className="text-amber-500 dark:text-amber-400" />
            <span>
              {isArabic
                ? 'أفكار سريعة جاهزة للاختبار بنقرة واحدة :'
                : 'Idées rapides à tester en 1 clic :'}
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5" dir={isArabic ? 'rtl' : 'ltr'}>
          {filteredPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 dark:hover:border-slate-700 transition flex items-center gap-1.5 text-left cursor-pointer"
            >
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">
                [{preset.category}]
              </span>
              <span className="truncate max-w-[150px] sm:max-w-[220px]">
                {preset.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Text Area for the Idea */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label
            htmlFor="idea-input"
            className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
          >
            <MessageSquare size={14} className="text-blue-600 dark:text-blue-400" />
            <span>
              {isArabic
                ? 'فكرة الريل (اكتب فكرتك هنا) :'
                : 'Votre Idée de Réel (Texte) :'}
            </span>
          </label>
          <span className="text-xs text-slate-500 font-mono">
            {ideaText.length} caractères
          </span>
        </div>

        <div className="relative">
          <textarea
            id="idea-input"
            rows={3}
            dir={isArabic ? 'rtl' : 'ltr'}
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder={
              isArabic
                ? 'مثال: 3 أخطاء شائعة تدمر طاقتك في الصباح، وطريقة سهلة للتخلص منها في 20 ثانية...'
                : 'Ex: 3 habitudes simples le soir qui permettent de se réveiller en pleine forme sans réveil...'
            }
            className="w-full text-sm bg-white border border-slate-300 text-slate-900 placeholder-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:placeholder-slate-500 focus:border-blue-500 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none shadow-inner"
          />
        </div>
      </div>

      {/* Tone Selection */}
      <div>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
          {isArabic ? 'نبرة وأسلوب الريل على فيسبوك :' : 'Ton du Réel Facebook :'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" dir={isArabic ? 'rtl' : 'ltr'}>
          {tones.map((t) => {
            const isSelected = tone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-600/15 dark:border-blue-500 dark:text-white shadow-sm ring-1 ring-blue-500/40'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold truncate">{t.label}</div>
                <div className="text-[10px] text-slate-500 truncate">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Audience & Voice Persona */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Audience */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            {isArabic ? 'الجمهور المستهدف :' : 'Public Cible :'}
          </label>
          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-slate-300 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
          >
            {isArabic ? (
              <>
                <option value="الجمهور العام">الجمهور العام (فيسبوك العام)</option>
                <option value="رواد الأعمال والمستقلين">رواد الأعمال والمهنيين</option>
                <option value="الشباب والطلاب">الشباب والطلاب</option>
                <option value="المهتمين بالصحة والرياضة">المهتمين بالصحة والرياضة</option>
                <option value="صناع المحتوى">صناع المحتوى الرقمي</option>
              </>
            ) : (
              <>
                <option value="Grand public">Grand public (Facebook général)</option>
                <option value="Entrepreneurs & Freelances">Entrepreneurs & Freelances</option>
                <option value="Étudiants & Jeunes actifs">Étudiants & Jeunes actifs</option>
                <option value="Passionnés de Fitness & Santé">Passionnés de Fitness & Santé</option>
                <option value="Créateurs de contenu">Créateurs de contenu</option>
              </>
            )}
          </select>
        </div>

        {/* Voice Persona */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <Mic size={13} className="text-purple-600 dark:text-purple-400" />
            <span>Voix IA Gemini :</span>
          </label>
          <select
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-slate-300 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.desc})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !ideaText.trim()}
        className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm tracking-wide shadow-xl shadow-blue-600/20 dark:shadow-blue-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>
              {isArabic
                ? 'جاري إنشاء وتجهيز الريل (20 ثانية)...'
                : 'Génération du Réel 20s en cours...'}
            </span>
          </>
        ) : (
          <>
            <Sparkles size={18} className="text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>
              {isArabic
                ? 'إنشاء ريل فيسبوك احترافي (20 ثانية)'
                : 'GÉNÉRER LE RÉEL FACEBOOK DE 20S'}
            </span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      {/* Retention Guarantee Note */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
        <Zap size={13} className="text-emerald-500 dark:text-emerald-400" />
        <span>
          {isArabic
            ? 'تنسيق 20 ثانية مبرمج لمعايير خوارزمية ريلز فيسبوك 2026'
            : "Format 20 secondes calibré pour l'algorithme des Réels Facebook"}
        </span>
      </div>
    </form>
  );
};
