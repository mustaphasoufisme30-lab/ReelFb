import React, { useEffect, useRef, useState } from 'react';
import {
  Film,
  CheckCircle2,
  Loader2,
  X,
  Smartphone,
} from 'lucide-react';
import { ReelProject } from '../types/reel';
import {
  exportReelVideo,
  ExportProgress,
  normalizeProjectScenes,
} from '../utils/videoExporter';

interface ExportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ReelProject;
  format: 'mp4' | 'webm';
  onSuccess: (result: { blob: Blob; format: 'mp4' | 'webm'; url: string }) => void;
  onError: (error: Error) => void;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  onClose,
  project,
  format,
  onSuccess,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRunningRef = useRef(false);

  const [progress, setProgress] = useState<ExportProgress>({
    percent: 0,
    currentSecond: 0,
    sceneIndex: 0,
    sceneTitle: "L'Accroche",
    totalScenes: 4,
    status: 'Initialisation des 4 scènes...',
    phase: 'recording',
  });

  const isArabic =
    project.language === 'arabe' ||
    project.language === 'ar' ||
    /[\u0600-\u06FF]/.test(project.idea || '');

  const normalizedScenes = normalizeProjectScenes(project.scenes);

  useEffect(() => {
    if (!isOpen) {
      isRunningRef.current = false;
      return;
    }

    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        if (!canvasRef.current || controller.signal.aborted) return;

        const result = await exportReelVideo(project, {
          format,
          canvas: canvasRef.current,
          signal: controller.signal,
          onProgress: (p) => {
            if (!controller.signal.aborted) {
              setProgress(p);
            }
          },
        });

        if (!controller.signal.aborted) {
          isRunningRef.current = false;
          onSuccess(result);
        }
      } catch (err: any) {
        isRunningRef.current = false;
        if (controller.signal.aborted || (err.message && err.message.includes('annulé'))) {
          return;
        }
        console.error('Export video error:', err);
        onError(err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      controller.abort();
      isRunningRef.current = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    isRunningRef.current = false;
    onClose();
  };

  const sceneSteps = [
    {
      index: 0,
      labelFr: "1. L'Accroche",
      labelAr: '١. خطاف الانتباه',
      timing: '0s - 3s',
      descFr: 'Capte l’attention en 3 secondes',
      descAr: 'خطف الانتباه خلال 3 ثواني',
    },
    {
      index: 1,
      labelFr: '2. Le Problème',
      labelAr: '٢. المشكلة / الصدمة',
      timing: '3s - 8s',
      descFr: 'Crée la tension et l’intérêt',
      descAr: 'بناء التوتر والفضول',
    },
    {
      index: 2,
      labelFr: '3. La Solution',
      labelAr: '٣. الحل والقيمة',
      timing: '8s - 15s',
      descFr: 'Délivre la valeur concrète',
      descAr: 'تقديم الحل والمعلومة الذهبية',
    },
    {
      index: 3,
      labelFr: "4. L'Appel à l'Action",
      labelAr: '٤. التحفيز والتفاعل',
      timing: '15s - 20s',
      descFr: 'CTA fort et boucle virale',
      descAr: 'طلب التفاعل وحفظ الفيديو',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[95vh] overflow-y-auto">
        {/* Cancel button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          title="Annuler"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-4 pr-6 pl-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold mb-2">
            <Film size={13} className="animate-pulse" />
            <span>
              {isArabic
                ? 'جاري تصدير الريل الكامل السريع (20 ثانية)'
                : 'Compilation Turbo MP4 (4 Scènes - 20s)'}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            {isArabic
              ? 'إنشاء جميع المشاهد الأربعة للهاتف'
              : 'Création haute vitesse des 4 scènes pour mobile'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isArabic
              ? 'يتم تجميع كل مشهد بدقة (0-20 ثانية) مع الخلفية والمؤثرات الصوتية'
              : 'Encodage garanti de chaque scène (0 à 20s) avec votre photo et audio'}
          </p>
        </div>

        {/* Live Canvas View in Smartphone Frame */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div className="relative w-44 sm:w-48 aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl border-2 border-slate-700 flex-shrink-0">
            <canvas
              ref={canvasRef}
              width={720}
              height={1280}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-600/90 text-white text-[10px] font-bold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>{progress.currentSecond.toFixed(1)}s / 20s</span>
            </div>

            <div className="absolute bottom-2 left-2 right-2 z-10 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] text-center font-bold text-white truncate">
              {normalizedScenes[progress.sceneIndex]?.overlayTitle ||
                `Scène ${progress.sceneIndex + 1}`}
            </div>
          </div>

          {/* Real-time 4-Scene Stepper */}
          <div className="flex-1 w-full space-y-2">
            <div className="text-xs font-black text-slate-300 flex items-center justify-between mb-1">
              <span>{isArabic ? 'المشاهد الـ 4 المضمنة :' : 'Progression des 4 scènes :'}</span>
              <span className="text-emerald-400 font-mono">
                {progress.currentSecond.toFixed(1)}s / 20.0s
              </span>
            </div>

            {sceneSteps.map((step) => {
              const isPast =
                progress.phase === 'converting' ||
                progress.phase === 'done' ||
                progress.sceneIndex > step.index;
              const isCurrent =
                progress.phase === 'recording' && progress.sceneIndex === step.index;

              return (
                <div
                  key={step.index}
                  className={`p-2 rounded-xl border text-xs transition-all ${
                    isCurrent
                      ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-950/40'
                      : isPast
                      ? 'bg-slate-800/40 border-emerald-500/30 text-slate-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPast ? (
                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                      ) : isCurrent ? (
                        <Loader2
                          size={14}
                          className="text-blue-400 animate-spin flex-shrink-0"
                        />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex-shrink-0" />
                      )}
                      <span className={`font-bold ${isCurrent ? 'text-white' : ''}`}>
                        {isArabic ? step.labelAr : step.labelFr}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono opacity-80">{step.timing}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 pr-5 pl-5">
                    {isArabic ? step.descAr : step.descFr}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="truncate max-w-[280px]">{progress.status}</span>
            <span className="font-mono text-blue-400 font-bold">{progress.percent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-150"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        {/* Info tip */}
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2">
          <Smartphone size={16} className="text-emerald-400 flex-shrink-0" />
          <span>
            {isArabic
              ? 'تجميع سريع بجميع المشاهد الأربعة (0 إلى 20 ثانية) بصيغة MP4 متوافقة مع الهاتف.'
              : 'Compilation haute vitesse garantissant la présence des 4 scènes (0 à 20s) au format MP4.'}
          </span>
        </div>
      </div>
    </div>
  );
};
