import React, { useState } from 'react';
import {
  Copy,
  Check,
  FileText,
  Flame,
  Award,
  TrendingUp,
  Share2,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';
import { ReelProject } from '../types/reel';
import { generateSRT, downloadBlob } from '../utils/videoExporter';

interface FacebookGrowthKitProps {
  project: ReelProject;
}

export const FacebookGrowthKit: React.FC<FacebookGrowthKitProps> = ({ project }) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);

  const handleCopyCaption = () => {
    const fullText = `${project.fbPostCaption}\n\n${project.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyTags = () => {
    navigator.clipboard.writeText(project.hashtags.join(' '));
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const handleDownloadSRT = () => {
    const srtContent = generateSRT(project);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const cleanTitle = (project.title || 'subtitles')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    downloadBlob(blob, `${cleanTitle}-20s.srt`);
  };

  return (
    <div className="space-y-4">
      {/* Viral Score Card */}
      <div className="p-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex flex-col items-center justify-center shadow-lg shadow-blue-950/50">
              <span className="text-xl font-black text-blue-400">
                {project.viralityScore}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                / 100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Score Viral Facebook</h4>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {project.hookRating}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {project.retentionTip}
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleDownloadSRT}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Télécharger le fichier .SRT pour l'importer sur Facebook"
          >
            <Download size={14} className="text-blue-400" />
            <span>Fichier .SRT</span>
          </button>
        </div>
      </div>

      {/* Ready-to-copy Facebook Caption Box */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={14} className="text-blue-400" />
            <span>Texte de Publication Facebook (Prêt à poster) :</span>
          </label>

          <button
            onClick={handleCopyCaption}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
          >
            {copiedCaption ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copier le texte</span>
              </>
            )}
          </button>
        </div>

        <div
          dir={/[\u0600-\u06FF]/.test(project.fbPostCaption) ? 'rtl' : 'ltr'}
          className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans select-all"
        >
          {project.fbPostCaption}
        </div>
      </div>

      {/* Hashtags */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-400" />
            <span>Hashtags Viraux Recommandés :</span>
          </label>

          <button
            onClick={handleCopyTags}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {copiedTags ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copier tout</span>
              </>
            )}
          </button>
        </div>

        <div
          className="flex flex-wrap gap-1.5"
          dir={/[\u0600-\u06FF]/.test(project.hashtags.join(' ')) ? 'rtl' : 'ltr'}
        >
          {project.hashtags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-950/40 text-blue-300 border border-blue-800/40"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Facebook Algorithm Strategy Tips */}
      <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2">
        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={14} className="text-amber-400" />
          <span>Conseils de publication pour l'algorithme Facebook :</span>
        </h5>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
          <li>
            <strong className="text-slate-200">Meilleurs horaires :</strong> Entre 12h-14h et 18h30-21h30 pour maximiser les vues initiales.
          </li>
          <li>
            <strong className="text-slate-200">Épinglez un commentaire :</strong> Posez une question ouverte ("D'accord ou pas d'accord ?") pour générer 3x plus d'engagement.
          </li>
          <li>
            <strong className="text-slate-200">Boucle parfaite :</strong> La scène 4 (CTA) reconnecte avec la scène 1 (Accroche), ce qui pousse les utilisateurs à revoir la vidéo deux fois.
          </li>
        </ul>
      </div>
    </div>
  );
};
