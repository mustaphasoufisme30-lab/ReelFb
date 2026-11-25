import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Film,
  Layers,
  Type,
  TrendingUp,
  Share2,
  Play,
  RotateCcw,
  Check,
  Zap,
  Info,
  Globe2,
  Image as ImageIcon,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react';
import { ReelProject } from './types/reel';
import { IdeaGenerator } from './components/IdeaGenerator';
import { SceneEditor } from './components/SceneEditor';
import { SubtitleStylePicker } from './components/SubtitleStylePicker';
import { BackgroundImageManager } from './components/BackgroundImageManager';
import { FacebookGrowthKit } from './components/FacebookGrowthKit';
import { ReelPhonePlayer } from './components/ReelPhonePlayer';
import { UnlockModal, WhatsAppIcon } from './components/UnlockModal';
import {
  TrialStatus,
  WHATSAPP_DISPLAY_NUMBER,
  consumeFreeTest,
  getTrialStatus,
  getWhatsAppUnlockUrl,
} from './utils/trialManager';

// French starter Reel project
const INITIAL_PROJECT_FR: ReelProject = {
  id: 'reel-fr-initial',
  title: 'La Règle des 2 Minutes du Matin',
  idea: 'Pourquoi 90% des gens ruinent leur journée dès les 10 premières minutes et la technique de 2 minutes pour avoir une concentration laser.',
  tone: 'viral',
  language: 'français',
  hookRating: 'A+ Viral',
  viralityScore: 96,
  retentionTip: 'L\'accroche visuelle en jaune fluo avec le mot "ARRÊTE" capte 3x plus l\'attention dans le fil Facebook.',
  recommendedBgmTrack: 'Électro Hype Beat (120 BPM)',
  fbPostCaption: `⚡ ARRÊTEZ DE FAIRE ÇA LE MATIN ! Si vous vous levez fatigué ou distrait, voici la méthode exacte en 20 secondes.\n\nRegardez jusqu'à la fin pour la technique des 2 minutes ! 🧠\n\n👇 Commentez 'FOCUS' pour recevoir la checklist matinale complète !`,
  hashtags: [
    '#ReelsFacebook',
    '#Productivite',
    '#MotivationMatin',
    '#Astuce20s',
    '#Discipline',
    '#FacebookReels',
  ],
  subtitleStyle: 'hormozi',
  musicMood: 'energetic',
  scenes: [
    {
      id: 'sc-1',
      order: 1,
      phase: 'hook',
      phaseLabel: "L'Accroche (0-3s)",
      startTime: 0,
      endTime: 3,
      duration: 3,
      narration: "Arrête tout ! Ce que tu fais dès le réveil détruit complètement ta journée.",
      overlayTitle: 'ARRÊTE TOUT !',
      overlaySubtitle: 'Ta première habitude te sabote...',
      badge: '🚨 ATTENTION',
      soundEffect: 'whoosh',
      visualTheme: 'crimson',
    },
    {
      id: 'sc-2',
      order: 2,
      phase: 'problem',
      phaseLabel: 'Le Problème (3-8s)',
      startTime: 3,
      endTime: 8,
      duration: 5,
      narration: "Regarder ton téléphone dans les 10 premières minutes bombarde ton cerveau de dopamine bon marché et ruine ta concentration.",
      overlayTitle: 'LE PIÈGE DU TÉLÉPHONE',
      overlaySubtitle: 'Dopamine toxique dès le réveil',
      badge: '❌ L\'ERREUR DE 90%',
      soundEffect: 'impact',
      visualTheme: 'dark-luxe',
    },
    {
      id: 'sc-3',
      order: 3,
      phase: 'solution',
      phaseLabel: 'La Solution (8-15s)',
      startTime: 8,
      endTime: 15,
      duration: 7,
      narration: "Fais plutôt la règle des 2 minutes : bois un grand verre d'eau, respire profondément devant la lumière naturelle et note ton unique priorité du jour.",
      overlayTitle: 'LA RÈGLE DES 2 MINUTES',
      overlaySubtitle: 'Eau + Lumière + 1 Priorité',
      badge: '💡 LA MÉTHODE SECRÈTE',
      soundEffect: 'ding',
      visualTheme: 'emerald',
    },
    {
      id: 'sc-4',
      order: 4,
      phase: 'cta',
      phaseLabel: "L'Appel à l'Action (15-20s)",
      startTime: 15,
      endTime: 20,
      duration: 5,
      narration: "Enregistre ce réel pour tester dès demain matin, et commente FOCUS pour recevoir le guide !",
      overlayTitle: 'ENREGISTRE CE RÉEL !',
      overlaySubtitle: 'Commente FOCUS en bas 👇',
      badge: '🔥 PASSE À L\'ACTION',
      soundEffect: 'pop',
      visualTheme: 'electric',
    },
  ],
};

// Arabic starter Reel project (نموذج عربي احترافي)
const INITIAL_PROJECT_AR: ReelProject = {
  id: 'reel-ar-initial',
  title: 'قاعدة الدقيقتين في الصباح',
  idea: 'لماذا يدمر 90% من الناس يومهم في أول 10 دقائق بعد الاستيقاظ والتقنية البسيطة التي تجعلك في قمة التركيز طوال اليوم.',
  tone: 'viral',
  language: 'arabe',
  hookRating: 'A+ فيروسي',
  viralityScore: 98,
  retentionTip: 'العنوان الصادم باللون الأصفر في أول ثانيتين يجبر المشاهد على التوقف ومتابعة الفيديو للنهاية.',
  recommendedBgmTrack: 'إيقاع إلكتروني سريع ومحفز (120 BPM)',
  fbPostCaption: `⚡ توقف عن هذا فوراً كل صباح! إذا كنت تستيقظ شارد الذهن أو متعباً، فإليك الحل الحقيقي في 20 ثانية فقط.\n\nشاهد حتى النهاية لمعرفة قاعدة الدقيقتين! 🧠\n\n👇 اكتب 'تركيز' في التعليقات للحصول على الدليل الصباحي الكامل!`,
  hashtags: [
    '#ريلز_فيسبوك',
    '#تطوير_الذات',
    '#تحفيز_الصباح',
    '#نصائح_في_20_ثانية',
    '#ريلز',
    '#فيسبوك',
  ],
  subtitleStyle: 'hormozi',
  musicMood: 'energetic',
  scenes: [
    {
      id: 'sc-ar-1',
      order: 1,
      phase: 'hook',
      phaseLabel: 'المقدمة الخاطفة (0-3 ث)',
      startTime: 0,
      endTime: 3,
      duration: 3,
      narration: 'توقف فوراً ! ما تفعله في أول 10 دقائق بعد استيقاظك يدمر إنتاجيتك بالكامل دون أن تشعر.',
      overlayTitle: 'توقف عن هذا فوراً !',
      overlaySubtitle: 'عادتك الأولى في الصباح تدمر يومك...',
      badge: '🚨 انتبه جيداً',
      soundEffect: 'whoosh',
      visualTheme: 'crimson',
    },
    {
      id: 'sc-ar-2',
      order: 2,
      phase: 'problem',
      phaseLabel: 'المشكلة الكبرى (3-8 ث)',
      startTime: 3,
      endTime: 8,
      duration: 5,
      narration: 'تصفح هاتفك بمجرد فتح عينيك يغمر عقلك بدوبامين رخيص ويسرق طاقتك وتركيزك لساعات طويلة.',
      overlayTitle: 'فخ الهاتف صباحاً',
      overlaySubtitle: 'دوبامين سام يسرق طاقتك اليومية',
      badge: '❌ خطأ 90% من الناس',
      soundEffect: 'impact',
      visualTheme: 'dark-luxe',
    },
    {
      id: 'sc-ar-3',
      order: 3,
      phase: 'solution',
      phaseLabel: 'الحل الذكي (8-15 ث)',
      startTime: 8,
      endTime: 15,
      duration: 7,
      narration: 'طبق قاعدة الدقيقتين: اشرب كوب ماء كبير، تنفس بعمق أمام ضوء النهار، وحدد أهم مهمة واحدة لإنجازها اليوم.',
      overlayTitle: 'قاعدة الدقيقتين',
      overlaySubtitle: 'ماء + ضوء طبيعي + هدف واحد فقط',
      badge: '💡 السر الفعال',
      soundEffect: 'ding',
      visualTheme: 'emerald',
    },
    {
      id: 'sc-ar-4',
      order: 4,
      phase: 'cta',
      phaseLabel: 'الدعوة للتفاعل (15-20 ث)',
      startTime: 15,
      endTime: 20,
      duration: 5,
      narration: 'احفظ هذا الريل لتجربته غداً صباحاً، واكتب كلمة "تركيز" في التعليقات لأرسل لك الدليل المجاني !',
      overlayTitle: 'احفظ الريل الآن !',
      overlaySubtitle: 'اكتب "تركيز" في التعليقات 👇',
      badge: '🔥 ابدأ التغيير الآن',
      soundEffect: 'pop',
      visualTheme: 'electric',
    },
  ],
};

type ActiveTab = 'idea' | 'scenes' | 'style' | 'growth';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('reelmaker-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });
  const [project, setProject] = useState<ReelProject>(INITIAL_PROJECT_AR);
  const [activeTab, setActiveTab] = useState<ActiveTab>('idea');
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>(() => getTrialStatus());
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('reelmaker-theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const extractErrorMessage = (input: unknown, fallback: string): string => {
    if (!input) return fallback;
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed || trimmed === '[object Object]') return fallback;
      // If the string itself is JSON (e.g. serialized ApiError), try to unwrap .error.message
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          return extractErrorMessage(JSON.parse(trimmed), fallback);
        } catch {
          return trimmed;
        }
      }
      return trimmed;
    }
    if (input instanceof Error) {
      return extractErrorMessage(input.message, fallback);
    }
    if (typeof input === 'object') {
      const obj = input as Record<string, unknown>;
      if (obj.error !== undefined) {
        const nested = extractErrorMessage(obj.error, '');
        if (nested) return nested;
      }
      if (obj.message !== undefined) {
        const nested = extractErrorMessage(obj.message, '');
        if (nested) return nested;
      }
      if (typeof obj.statusText === 'string' && obj.statusText.trim()) {
        return obj.statusText.trim();
      }
      if (typeof obj.status === 'string' && obj.status.trim()) {
        return obj.status.trim();
      }
      try {
        const serialized = JSON.stringify(obj);
        if (serialized && serialized !== '{}') return serialized.slice(0, 220);
      } catch {}
    }
    return fallback;
  };

  const showToast = (message: unknown, type: 'success' | 'error' = 'success') => {
    const safeMessage = extractErrorMessage(
      message,
      type === 'error' ? 'Une erreur est survenue.' : 'Opération réussie.'
    );
    setNotification({ message: safeMessage, type });
    setTimeout(() => setNotification(null), type === 'error' ? 6000 : 3500);
  };

  const handleGenerateReel = async (data: {
    idea: string;
    tone: string;
    targetAudience: string;
    language: string;
  }) => {
    const latestStatus = getTrialStatus();
    if (latestStatus.isLocked) {
      setTrialStatus(latestStatus);
      setIsUnlockModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    const requestReel = async () => {
      const response = await fetch('/api/generate-reel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();
      let parsed: any = null;
      if (contentType.includes('application/json') || rawText.trim().startsWith('{')) {
        try {
          parsed = JSON.parse(rawText);
        } catch {
          parsed = null;
        }
      }

      if (!response.ok) {
        const retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
        const fallbackMsg =
          data.language === 'arabe'
            ? `خطأ في الخادم (${response.status}). يرجى المحاولة مرة أخرى.`
            : `Erreur serveur (${response.status}). Veuillez réessayer.`;
        const msg = extractErrorMessage(parsed?.error ?? parsed, fallbackMsg);
        const err: any = new Error(msg);
        err.retryable = retryable;
        throw err;
      }

      if (!parsed || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
        const err: any = new Error(
          data.language === 'arabe'
            ? 'استجابة غير متوقعة من الخادم. يرجى إعادة المحاولة.'
            : 'Réponse invalide du serveur. Veuillez réessayer.'
        );
        err.retryable = true;
        throw err;
      }

      return parsed as ReelProject;
    };

    try {
      let generatedProject: ReelProject;
      try {
        generatedProject = await requestReel();
      } catch (firstErr: any) {
        const isNetwork = firstErr instanceof TypeError || firstErr?.retryable;
        if (!isNetwork) throw firstErr;
        await new Promise((resolve) => setTimeout(resolve, 1200));
        generatedProject = await requestReel();
      }

      setProject((prev) => ({
        ...generatedProject,
        globalBackgroundImage: prev.globalBackgroundImage,
        backgroundDim: prev.backgroundDim,
        subtitleStyle: prev.subtitleStyle || generatedProject.subtitleStyle || 'hormozi',
        musicMood: prev.musicMood || generatedProject.musicMood || 'energetic',
      }));
      setCurrentSceneIndex(0);
      setActiveTab('scenes');
      const nextTrial = consumeFreeTest();
      setTrialStatus(nextTrial);
      showToast(
        data.language === 'arabe'
          ? 'تم إنشاء الريل الخاص بك بنجاح ! 🚀'
          : 'Votre Réel de 20s a été généré avec succès ! 🚀',
        'success'
      );
    } catch (err: any) {
      console.error('Generation failed:', err);
      const fallbackErr =
        data.language === 'arabe'
          ? 'حدث خطأ أثناء إنشاء الريل. يرجى المحاولة مجدداً.'
          : 'Erreur lors de la génération. Veuillez réessayer.';
      const errMsg = extractErrorMessage(err, fallbackErr);
      setGenerationError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const isCurrentArabic = project.language === 'arabe' || /[\u0600-\u06FF]/.test(project.title);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 max-w-sm ${
            notification.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-blue-600 text-white animate-bounce'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle size={16} className="shrink-0" />
          ) : (
            <Check size={16} className="shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white/85 dark:border-slate-800/80 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/20 dark:shadow-blue-900/40 shrink-0">
              <Film className="text-white" size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg sm:text-xl tracking-tight text-slate-900 dark:bg-gradient-to-r dark:from-white dark:via-slate-200 dark:to-slate-400 dark:bg-clip-text dark:text-transparent truncate">
                  ReelMaker <span className="text-blue-600 dark:text-blue-500">20s</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/25 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30">
                  <span className="text-blue-600 dark:text-blue-500 font-bold">f</span> Réels FB
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Créez un Réel Facebook viral de 20s en Arabe ou Français
              </p>
            </div>
          </div>

          {/* Navbar Controls: Language Switcher + Dark/Light Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800 p-1 rounded-xl border">
              <button
                type="button"
                onClick={() => {
                  setProject(INITIAL_PROJECT_AR);
                  setCurrentSceneIndex(0);
                  showToast('Modèle en Arabe chargé 🇸🇦');
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  isCurrentArabic
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Charger un exemple en Arabe"
              >
                <span>🇸🇦</span>
                <span className="hidden xs:inline sm:inline">العربية</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProject(INITIAL_PROJECT_FR);
                  setCurrentSceneIndex(0);
                  showToast('Modèle en Français chargé 🇫🇷');
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  !isCurrentArabic
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Charger un exemple en Français"
              >
                <span>🇫🇷</span>
                <span className="hidden xs:inline sm:inline">Français</span>
              </button>
            </div>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Passer au thème Light' : 'Passer au thème Dark'}
              title={theme === 'dark' ? 'Passer au thème clair (Light)' : 'Passer au thème sombre (Dark)'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-indigo-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* WhatsApp Contact / Unlock Button */}
            {trialStatus.isLocked ? (
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-black shadow-sm transition cursor-pointer"
                title={`Contacter nous sur WhatsApp (${WHATSAPP_DISPLAY_NUMBER})`}
              >
                <WhatsAppIcon size={14} />
                <span className="hidden md:inline">Déverrouiller</span>
              </button>
            ) : (
              <a
                href={getWhatsAppUnlockUrl(isCurrentArabic)}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] dark:text-[#25D366] border border-[#25D366]/30 text-xs font-bold transition"
                title={`Contacter nous sur WhatsApp : ${WHATSAPP_DISPLAY_NUMBER}`}
              >
                <WhatsAppIcon size={14} />
                <span className="hidden lg:inline">Contacter nous</span>
                <span className="font-mono text-[11px]">{WHATSAPP_DISPLAY_NUMBER}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Creator Studio & Tabs (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col space-y-5">
            {/* Studio Navigation Tabs */}
            <div className="p-1 bg-white border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 border rounded-2xl flex items-center gap-1 overflow-x-auto scrollbar-none shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('idea')}
                className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'idea'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 dark:shadow-blue-900/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                }`}
              >
                <Sparkles size={14} />
                <span>1. {isCurrentArabic ? 'الفكرة واللغة' : 'Idée Texte'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('scenes')}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'scenes'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 dark:shadow-blue-900/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                }`}
              >
                <Layers size={14} />
                <span>2. {isCurrentArabic ? 'المشاهد (20 ث)' : 'Scènes (20s)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'style'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 dark:shadow-blue-900/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                }`}
              >
                <ImageIcon size={14} />
                <span>3. {isCurrentArabic ? 'خلفية الهاتف والخط' : 'Photo & Style'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('growth')}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'growth'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 dark:shadow-blue-900/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                }`}
              >
                <TrendingUp size={14} />
                <span>4. {isCurrentArabic ? 'منشور فيسبوك' : 'Post Facebook'}</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-white border-slate-200/90 shadow-sm dark:bg-slate-900/40 dark:border-slate-800/80 dark:shadow-xl border rounded-3xl p-5 sm:p-6 backdrop-blur-sm transition-colors duration-200">
              {activeTab === 'idea' && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>
                        {isCurrentArabic
                          ? 'حوّل فكرتك إلى ريل فيسبوك احترافي'
                          : 'Transformez votre idée en Réel Facebook'}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                        20s
                      </span>
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {isCurrentArabic
                        ? 'الذكاء الاصطناعي يقسم فكرتك بدقة إلى 4 مشاهد متزامنة (المقدمة الخاطفة، المشكلة، الحل، والدعوة للتفاعل) لزيادة المشاهدات والانتشار.'
                        : "L'IA découpe votre idée en 4 scènes synchronisées (Accroche, Tension, Solution, Appel à l'action) pour maximiser la rétention."}
                    </p>
                  </div>
                  <IdeaGenerator
                    onGenerate={handleGenerateReel}
                    isLoading={isGenerating}
                    errorMessage={generationError}
                    trialStatus={trialStatus}
                    onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
                  />
                </div>
              )}

              {activeTab === 'scenes' && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">
                        {isCurrentArabic
                          ? 'محرر المشاهد (4 مشاهد = 20 ثانية بالضبط)'
                          : 'Éditeur de Timeline (4 Scènes = 20s)'}
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {isCurrentArabic
                          ? 'عدّل النص المنطوق، العناوين البارزة، والملصقات والمؤثرات الصوتية.'
                          : 'Personnalisez le script vocal, les titres en gras et les effets sonores.'}
                      </p>
                    </div>
                  </div>
                  <SceneEditor
                    project={project}
                    activeSceneIndex={currentSceneIndex}
                    onSelectScene={(idx) => setCurrentSceneIndex(idx)}
                    onUpdateProject={setProject}
                  />
                </div>
              )}

              {activeTab === 'style' && (
                <div className="space-y-6">
                  {/* Phone Background Image Manager */}
                  <BackgroundImageManager
                    project={project}
                    activeSceneIndex={currentSceneIndex}
                    onUpdateProject={setProject}
                  />

                  {/* Subtitle Styles and Music Mood */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="mb-4">
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">
                        {isCurrentArabic
                          ? 'تخصيص الخطوط والموسيقى التصويرية'
                          : 'Styles des Sous-titres & Musique de Fond'}
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {isCurrentArabic
                          ? 'اختر تصميم النص (صندوق هورموزي الأصفر، مستر بيست، نيون)، ونوع الموسيقى الخلفية.'
                          : "Choisissez le format de sous-titres (Hormozi, MrBeast, Néon) et l'ambiance musicale."}
                      </p>
                    </div>
                    <SubtitleStylePicker
                      project={project}
                      onUpdateProject={setProject}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'growth' && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {isCurrentArabic
                        ? 'حزمة الانتشار لمنشور فيسبوك ريلز'
                        : 'Kit de Croissance Facebook & Viralité'}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {isCurrentArabic
                        ? 'نص المنشور جاهز للنسخ، الهاشتاجات الأكثر تفاعلاً، وملف الترجمة .SRT.'
                        : 'Texte de publication prêt à copier, hashtags viraux et sous-titres .SRT téléchargeables.'}
                    </p>
                  </div>
                  <FacebookGrowthKit project={project} />
                </div>
              )}
            </div>

            {/* Reel Blueprint / Formula Explainer */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border-blue-200/70 text-slate-700 dark:bg-slate-900/30 dark:border-slate-800/60 dark:text-slate-400 border text-xs flex items-start gap-3">
              <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-slate-300 block mb-1">
                  {isCurrentArabic
                    ? 'لماذا تعتبر 20 ثانية المدة الذهبية لريلز فيسبوك ؟'
                    : 'Pourquoi 20 secondes est la durée reine sur Facebook Reels ?'}
                </strong>
                {isCurrentArabic
                  ? 'خوارزمية فيسبوك تكافئ الفيديوهات التي تحقق نسبة إكمال تفوق 85%. مع مدة 20 ثانية، يشاهد الجمهور الفيديو بالكامل وتتيح الحلقة الأخيرة إعادة المشاهدة تلقائياً.'
                  : "L'algorithme de recommandation Facebook privilégie un taux de complétion supérieur à 85%. Avec un format condensé de 20s, vos spectateurs regardent l'intégralité de la vidéo et bénéficient de la boucle finale, multipliant sa viralité organique."}
              </div>
            </div>
          </div>

          {/* Right Column: 9:16 Vertical Smartphone Player Simulator (5 cols on lg) */}
          <div className="lg:col-span-5 sticky top-20 flex flex-col items-center">
            <ReelPhonePlayer
              project={project}
              currentSceneIndex={currentSceneIndex}
              onSceneChange={(idx) => setCurrentSceneIndex(idx)}
              onUpdateProject={setProject}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Copyright@MahfoudDigital2026
          </span>
        </div>
      </footer>

      {/* Single Free Trial Unlock Modal (WhatsApp 0635230749) */}
      <UnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onUnlocked={() => {
          setTrialStatus(getTrialStatus());
          setIsUnlockModalOpen(false);
          showToast(
            isCurrentArabic
              ? 'تم فتح النسخة الكاملة بنجاح ! 🎉'
              : "Application déverrouillée avec succès ! 🎉",
            'success'
          );
        }}
        isArabic={isCurrentArabic}
      />
    </div>
  );
}
