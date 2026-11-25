import React from 'react';
import {
  Download,
  X,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  Film,
  Sparkles,
  Share2,
} from 'lucide-react';
import { downloadBlob } from '../utils/videoExporter';

interface VideoDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoBlob: Blob | null;
  videoUrl: string | null;
  videoFormat: 'mp4' | 'webm';
  projectTitle: string;
}

export const VideoDownloadModal: React.FC<VideoDownloadModalProps> = ({
  isOpen,
  onClose,
  videoBlob,
  videoUrl,
  videoFormat,
  projectTitle,
}) => {
  if (!isOpen || !videoUrl) return null;

  const filename = `${(projectTitle || 'reel-facebook-20s')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')}-20s.${videoFormat}`;

  const handleDownload = () => {
    if (videoBlob) {
      downloadBlob(videoBlob, filename);
    } else if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 1000);
    }
  };

  const canShareFile =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof File !== 'undefined' &&
    Boolean(videoBlob);

  const handleMobileShareSave = async () => {
    if (!videoBlob) return;
    try {
      const file = new File([videoBlob], filename, {
        type: videoFormat === 'mp4' ? 'video/mp4' : 'video/webm',
      });
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        handleDownload();
        return;
      }
      await navigator.share({
        title: projectTitle || 'Mon Réel Facebook 20s',
        files: [file],
      });
    } catch {
      // User cancelled share sheet or unsupported; fallback to direct download
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700/80 border rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 transition cursor-pointer"
          title="Fermer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-3 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-1">
            <CheckCircle2 size={13} />
            <span>Vidéo prête (20 secondes)</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Votre Réel Facebook est terminé ! 🎉
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Format {videoFormat.toUpperCase()} optimisé pour mobile et Facebook
          </p>
        </div>

        {/* Video Player Preview */}
        <div className="relative w-full aspect-[9/16] max-h-[48vh] mx-auto rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-300 dark:border-slate-800 mb-4 flex items-center justify-center">
          <video
            src={videoUrl}
            controls
            playsInline
            autoPlay
            loop
            className="w-full h-full object-contain"
          />
        </div>

        {/* 4-Scene Verification Badge */}
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-500/30 border">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Vidéo complète vérifiée : Les 4 scènes sont incluses (20s)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] text-slate-700 dark:text-slate-300">
            <div className="p-1 rounded bg-white border-emerald-200/80 dark:bg-slate-900/80 dark:border-slate-800 border text-center">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold block">1. Accroche</span>
              <span className="text-slate-500 dark:text-slate-400">0s - 3s</span>
            </div>
            <div className="p-1 rounded bg-white border-emerald-200/80 dark:bg-slate-900/80 dark:border-slate-800 border text-center">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold block">2. Problème</span>
              <span className="text-slate-500 dark:text-slate-400">3s - 8s</span>
            </div>
            <div className="p-1 rounded bg-white border-emerald-200/80 dark:bg-slate-900/80 dark:border-slate-800 border text-center">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold block">3. Solution</span>
              <span className="text-slate-500 dark:text-slate-400">8s - 15s</span>
            </div>
            <div className="p-1 rounded bg-white border-emerald-200/80 dark:bg-slate-900/80 dark:border-slate-800 border text-center">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold block">4. CTA Boucle</span>
              <span className="text-slate-500 dark:text-slate-400">15s - 20s</span>
            </div>
          </div>
        </div>

        {/* Mobile Download Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleDownload}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-blue-600/20 dark:shadow-blue-900/40 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
          >
            <Download size={18} />
            <span>Télécharger le Réel ({videoFormat.toUpperCase()})</span>
          </button>

          {canShareFile && (
            <button
              onClick={handleMobileShareSave}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Share2 size={15} />
              <span>Enregistrer dans la Galerie / Partager</span>
            </button>
          )}

          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 font-bold text-xs border transition flex items-center justify-center gap-2"
          >
            <ExternalLink size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Ouvrir dans un nouvel onglet plein écran</span>
          </a>
        </div>

        {/* Smartphone Instructions Helper */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950/80 dark:border-slate-800/80 dark:text-slate-400 border text-[11px] space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-300 text-xs">
            <Smartphone size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Astuce d'enregistrement sur smartphone :</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Sur iPhone :</strong> Vous pouvez faire un <em>appui long sur la vidéo</em> ci-dessus puis choisir <strong>« Enregistrer dans Photos »</strong>.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Sur Android :</strong> Appuyez sur les <em>3 points du lecteur</em> pour télécharger directement dans votre Galerie.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
