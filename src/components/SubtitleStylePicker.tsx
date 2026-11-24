import React from 'react';
import { Type, Sparkles, Music2 } from 'lucide-react';
import { ReelProject, SubtitleStyle } from '../types/reel';

interface SubtitleStylePickerProps {
  project: ReelProject;
  onUpdateProject: (updated: ReelProject) => void;
}

const SUBTITLE_STYLES: {
  id: SubtitleStyle;
  name: string;
  desc: string;
  previewClass: string;
}[] = [
  {
    id: 'hormozi',
    name: 'Alex Hormozi',
    desc: 'Boîte jaune percutante & contraste maximal',
    previewClass: 'bg-yellow-400 text-black font-black px-2 py-0.5 rounded',
  },
  {
    id: 'beast',
    name: 'MrBeast Pop',
    desc: 'Gros texte blanc à contour noir épais',
    previewClass: 'text-white font-black drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-wide',
  },
  {
    id: 'neon',
    name: 'Néon Cyber',
    desc: 'Lueur cyan & violet électrique',
    previewClass: 'text-cyan-300 font-extrabold shadow-cyan-500/50 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]',
  },
  {
    id: 'clean',
    name: 'Élégant Minimal',
    desc: 'Fond semi-transparent sombre épuré',
    previewClass: 'bg-black/60 text-white font-bold px-2 py-0.5 rounded-lg border border-white/20',
  },
];

const MUSIC_MOODS: {
  id: 'energetic' | 'dramatic' | 'lofi' | 'hype' | 'minimal';
  name: string;
  desc: string;
}[] = [
  { id: 'energetic', name: '⚡ Énergique (120 BPM)', desc: 'Idéal pour astuces rapides & punch' },
  { id: 'hype', name: '🔥 Hype & Bass (128 BPM)', desc: 'Intensité maximale pour buzz' },
  { id: 'dramatic', name: '🎻 Suspense & Mystère', desc: 'Accroche la curiosité' },
  { id: 'lofi', name: '☕ Lo-Fi Chill (84 BPM)', desc: 'Posé & storytelling' },
  { id: 'minimal', name: '🤫 Voix Seule + SFX', desc: 'Sans musique de fond' },
];

export const SubtitleStylePicker: React.FC<SubtitleStylePickerProps> = ({
  project,
  onUpdateProject,
}) => {
  const handleSelectStyle = (style: SubtitleStyle) => {
    onUpdateProject({
      ...project,
      subtitleStyle: style,
    });
  };

  const handleSelectMood = (mood: 'energetic' | 'dramatic' | 'lofi' | 'hype' | 'minimal') => {
    onUpdateProject({
      ...project,
      musicMood: mood,
    });
  };

  return (
    <div className="space-y-5">
      {/* Subtitles Style */}
      <div>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <Type size={14} className="text-blue-600 dark:text-blue-400" />
          <span>Style des Sous-titres & Titres Écran :</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SUBTITLE_STYLES.map((st) => {
            const isSelected = project.subtitleStyle === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSelectStyle(st.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 dark:bg-blue-600/15 dark:border-blue-500 shadow-md ring-1 ring-blue-500/40'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900/60 dark:border-slate-800 dark:hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{st.name}</span>
                  <span className="inline-flex items-center justify-center rounded-md bg-slate-900 px-1.5 py-0.5">
                    <span className={st.previewClass}>TEXTE</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{st.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Background Music Mood */}
      <div>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <Music2 size={14} className="text-purple-600 dark:text-purple-400" />
          <span>Musique de Fond (Synthétisée) :</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MUSIC_MOODS.map((m) => {
            const isSelected = (project.musicMood || 'energetic') === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMood(m.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-50 border-purple-500 text-purple-950 dark:bg-purple-600/15 dark:border-purple-500 dark:text-white shadow-sm ring-1 ring-purple-500/40'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                <div className="text-xs font-bold">{m.name}</div>
                <div className="text-[10px] text-slate-500">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
