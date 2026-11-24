import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Play,
  Palette,
  BellRing,
  Clock,
  Layers,
  Wand2,
  Check,
} from 'lucide-react';
import { ReelProject, ReelScene, SoundEffectType, VisualThemeKey } from '../types/reel';
import { audioEngine } from '../utils/audioEngine';

interface SceneEditorProps {
  project: ReelProject;
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
  onUpdateProject: (updated: ReelProject) => void;
}

const BADGE_PRESETS = [
  '🚨 ATTENTION',
  '💡 LE SECRET',
  '❌ L\'ERREUR',
  '📈 RÉSULTATS',
  '🔥 ASTUCE #1',
  '⚡ EN 20 SECONDES',
  '👇 ACTION IMMÉDIATE',
];

const THEMES: { id: VisualThemeKey; label: string; bg: string }[] = [
  { id: 'electric', label: 'Électrique', bg: 'bg-indigo-950 border-cyan-500/50' },
  { id: 'sunset', label: 'Coucher de Soleil', bg: 'bg-amber-950 border-orange-500/50' },
  { id: 'emerald', label: 'Émeraude / Cash', bg: 'bg-emerald-950 border-emerald-500/50' },
  { id: 'crimson', label: 'Alerte Rouge', bg: 'bg-rose-950 border-rose-500/50' },
  { id: 'dark-luxe', label: 'Dark Luxe', bg: 'bg-zinc-900 border-zinc-500/50' },
  { id: 'cyber', label: 'Cyberpunk', bg: 'bg-slate-900 border-blue-500/50' },
];

export const SceneEditor: React.FC<SceneEditorProps> = ({
  project,
  activeSceneIndex,
  onSelectScene,
  onUpdateProject,
}) => {
  const [refiningSceneId, setRefiningSceneId] = useState<string | null>(null);
  const [customInstruction, setCustomInstruction] = useState('');
  const [activeInstructionSceneId, setActiveInstructionSceneId] = useState<string | null>(null);

  const handleUpdateScene = (index: number, partial: Partial<ReelScene>) => {
    const updatedScenes = [...project.scenes];
    updatedScenes[index] = {
      ...updatedScenes[index],
      ...partial,
    };
    onUpdateProject({
      ...project,
      scenes: updatedScenes,
    });
  };

  const handleTestSFX = (sfx: SoundEffectType) => {
    audioEngine.playSoundEffect(sfx);
  };

  const handleTestVoice = (scene: ReelScene) => {
    audioEngine.speakFallback(scene.narration);
  };

  // Call /api/refine-scene to polish with Gemini
  const handleRefineWithAI = async (index: number, instruction?: string) => {
    const scene = project.scenes[index];
    setRefiningSceneId(scene.id);
    try {
      const res = await fetch('/api/refine-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentScene: scene,
          instruction: instruction || 'Rends cette scène encore plus virale et percutante pour Facebook',
        }),
      });
      const data = await res.json();
      if (data && data.overlayTitle) {
        handleUpdateScene(index, {
          narration: data.narration,
          overlayTitle: data.overlayTitle,
          overlaySubtitle: data.overlaySubtitle,
          badge: data.badge,
          soundEffect: data.soundEffect || scene.soundEffect,
        });
      }
    } catch (err) {
      console.error('Refine failed:', err);
    } finally {
      setRefiningSceneId(null);
      setActiveInstructionSceneId(null);
      setCustomInstruction('');
    }
  };

  return (
    <div className="space-y-4">
      {/* 20s Breakdown Summary Header */}
      <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="text-blue-400" size={18} />
          <span className="text-sm font-bold text-slate-200">
            Structure des 4 Scènes (Total : 20.0s)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Formule Rétention FB
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            20s Exactes
          </span>
        </div>
      </div>

      {/* 4 Scene Cards */}
      <div className="space-y-3">
        {project.scenes.map((scene, idx) => {
          const isActive = idx === activeSceneIndex;
          const isRefining = refiningSceneId === scene.id;

          const phaseColorMap: Record<string, string> = {
            hook: 'border-l-rose-500 text-rose-400',
            problem: 'border-l-amber-500 text-amber-400',
            solution: 'border-l-emerald-500 text-emerald-400',
            cta: 'border-l-blue-500 text-blue-400',
          };

          const phaseColor = phaseColorMap[scene.phase] || 'border-l-blue-500 text-blue-400';

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(idx)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900/90 border-blue-500/60 shadow-lg shadow-blue-950/30 ring-1 ring-blue-500/30'
                  : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/60'
              } border-l-4 ${phaseColor}`}
            >
              {/* Scene Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Scène {scene.order}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {scene.phaseLabel}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    <Clock size={12} />
                    {scene.startTime}s - {scene.endTime}s ({scene.duration}s)
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestVoice(scene);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Écouter la narration"
                  >
                    <Volume2 size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveInstructionSceneId(
                        activeInstructionSceneId === scene.id ? null : scene.id
                      );
                    }}
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors"
                    title="Optimiser cette scène avec l'IA"
                  >
                    <Sparkles size={12} />
                    <span>IA Boost</span>
                  </button>
                </div>
              </div>

              {/* Quick AI Refine Popup/Input */}
              {activeInstructionSceneId === scene.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mb-3 p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl space-y-2 animate-fadeIn"
                >
                  <label className="text-xs font-semibold text-indigo-200 block">
                    Consigne d'optimisation IA pour la Scène {scene.order} :
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customInstruction}
                      onChange={(e) => setCustomInstruction(e.target.value)}
                      placeholder="Ex: Rends l'accroche plus provocante, ajoute une question..."
                      className="flex-1 text-xs bg-slate-900 border border-indigo-500/50 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <button
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefineWithAI(idx, customInstruction)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {isRefining ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Wand2 size={12} />
                      )}
                      <span>Booster</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Editable Fields */}
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                {/* 1. Headline (Overlay Title) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Grand Titre Écran (Overlay) / العنوان الرئيسي
                  </label>
                  <input
                    type="text"
                    dir={/[\u0600-\u06FF]/.test(scene.overlayTitle) ? 'rtl' : 'ltr'}
                    value={scene.overlayTitle}
                    onChange={(e) => handleUpdateScene(idx, { overlayTitle: e.target.value })}
                    className="w-full text-sm font-bold bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    placeholder="TITRE EN GROS..."
                  />
                </div>

                {/* 2. Narration (Voiceover Text) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Texte Parlé (Voix Off) / النص المنطوق
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {scene.narration.split(' ').filter(Boolean).length} mots (~
                      {(scene.narration.split(' ').filter(Boolean).length / 2.8).toFixed(1)}s)
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    dir={/[\u0600-\u06FF]/.test(scene.narration) ? 'rtl' : 'ltr'}
                    value={scene.narration}
                    onChange={(e) => handleUpdateScene(idx, { narration: e.target.value })}
                    className="w-full text-xs font-normal bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                    placeholder="Le script prononcé pendant ces secondes..."
                  />
                </div>

                {/* 3. Badge & Sound Effect & Theme row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Badge */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Badge Sticker
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={scene.badge}
                        onChange={(e) => handleUpdateScene(idx, { badge: e.target.value })}
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Sound Effect */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Effet Sonore (SFX)
                      </label>
                      {scene.soundEffect !== 'none' && (
                        <button
                          type="button"
                          onClick={() => handleTestSFX(scene.soundEffect)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
                        >
                          <Play size={10} /> Test
                        </button>
                      )}
                    </div>
                    <select
                      value={scene.soundEffect}
                      onChange={(e) =>
                        handleUpdateScene(idx, {
                          soundEffect: e.target.value as SoundEffectType,
                        })
                      }
                      className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="whoosh">💨 Whoosh (Transition)</option>
                      <option value="ding">🔔 Ding (Révélation)</option>
                      <option value="pop">🎈 Pop (Impact doux)</option>
                      <option value="impact">💥 Impact (Sub Bass)</option>
                      <option value="none">Aucun son</option>
                    </select>
                  </div>

                  {/* Visual Theme */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Ambiance Visuelle
                    </label>
                    <select
                      value={scene.visualTheme}
                      onChange={(e) =>
                        handleUpdateScene(idx, {
                          visualTheme: e.target.value as VisualThemeKey,
                        })
                      }
                      className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                      {THEMES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
