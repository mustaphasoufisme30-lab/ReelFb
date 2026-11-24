import React, { useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Sliders,
  Sparkles,
  Smartphone,
  Eye,
  Check,
} from 'lucide-react';
import { ReelProject } from '../types/reel';

interface BackgroundImageManagerProps {
  project: ReelProject;
  activeSceneIndex: number;
  onUpdateProject: (updated: ReelProject) => void;
}

const PRESET_BACKGROUNDS = [
  {
    name: 'Bureau Studio',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=720&q=80',
  },
  {
    name: 'Café & Lifestyle',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=720&q=80',
  },
  {
    name: 'Lumières Urbaines',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=720&q=80',
  },
  {
    name: 'Nature & Montagne',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=720&q=80',
  },
];

export const BackgroundImageManager: React.FC<BackgroundImageManagerProps> = ({
  project,
  activeSceneIndex,
  onUpdateProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isArabic = project.language === 'arabe' || /[\u0600-\u06FF]/.test(project.title);

  const activeScene = project.scenes[activeSceneIndex];
  const currentImage = activeScene?.customImage || project.globalBackgroundImage;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      onUpdateProject({
        ...project,
        globalBackgroundImage: dataUrl,
        backgroundDim: project.backgroundDim ?? 0.45,
      });
    };
    reader.readAsDataURL(file);
    // Reset file input value so same image can be re-uploaded if desired
    e.target.value = '';
  };

  const handleSetSceneImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const updatedScenes = [...project.scenes];
      updatedScenes[activeSceneIndex] = {
        ...updatedScenes[activeSceneIndex],
        customImage: dataUrl,
      };

      onUpdateProject({
        ...project,
        scenes: updatedScenes,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveGlobalImage = () => {
    onUpdateProject({
      ...project,
      globalBackgroundImage: undefined,
    });
  };

  const handleRemoveSceneImage = () => {
    const updatedScenes = [...project.scenes];
    updatedScenes[activeSceneIndex] = {
      ...updatedScenes[activeSceneIndex],
      customImage: undefined,
    };
    onUpdateProject({
      ...project,
      scenes: updatedScenes,
    });
  };

  const handleDimChange = (val: number) => {
    onUpdateProject({
      ...project,
      backgroundDim: val,
    });
  };

  const handleSelectPreset = (url: string) => {
    onUpdateProject({
      ...project,
      globalBackgroundImage: url,
      backgroundDim: project.backgroundDim ?? 0.45,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 border rounded-2xl">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Smartphone size={15} className="text-blue-600 dark:text-blue-400" />
          <span>
            {isArabic
              ? 'صورة الخلفية من الهاتف (أو الكاميرا) :'
              : "Image d'arrière-plan depuis votre téléphone :"}
          </span>
        </label>
        {project.globalBackgroundImage && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Check size={11} />
            <span>Image Active</span>
          </span>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Upload Zone & Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Main Phone Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-4 rounded-xl border-2 border-dashed border-blue-400/60 hover:border-blue-500 bg-blue-50/70 hover:bg-blue-100/70 text-slate-800 dark:border-blue-500/40 dark:hover:border-blue-400 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-slate-200 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-blue-600/15 text-blue-600 dark:bg-blue-600/30 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload size={20} />
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {isArabic ? 'اختر صورة من الهاتف' : 'Importer une photo du téléphone'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {isArabic
                ? 'معرض الصور، الكاميرا، أو الملفات (JPG/PNG)'
                : 'Galerie photo, caméra ou fichiers (JPG, PNG)'}
            </div>
          </div>
        </button>

        {/* Current Image Preview & Management */}
        {currentImage ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950 flex items-center p-2 gap-3">
            <img
              src={currentImage}
              alt="Arrière-plan"
              className="w-16 h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-md"
            />
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                {activeScene?.customImage
                  ? `Image pour Scène ${activeSceneIndex + 1}`
                  : 'Image Globale (20s)'}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Recadrage vertical 9:16 automatique
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-[10px] font-bold cursor-pointer"
                >
                  Changer
                </button>
                <button
                  type="button"
                  onClick={
                    activeScene?.customImage
                      ? handleRemoveSceneImage
                      : handleRemoveGlobalImage
                  }
                  className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/60 dark:hover:bg-red-900/60 dark:text-red-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={11} />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/40 flex flex-col justify-center items-center text-center text-slate-500 dark:text-slate-400 text-xs">
            <ImageIcon size={24} className="text-slate-400 dark:text-slate-600 mb-1" />
            <span>Aucune image sélectionnée</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              (L'animation dynamique du thème est affichée)
            </span>
          </div>
        )}
      </div>

      {/* Dimming Slider */}
      {currentImage && (
        <div className="p-3 bg-white border-slate-200 dark:bg-slate-950/60 dark:border-slate-800 border rounded-xl space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sliders size={13} className="text-blue-600 dark:text-blue-400" />
              <span>
                {isArabic
                  ? 'تعتيم الخلفية لزيادة وضوح النص :'
                  : "Assombrir l'image (Contraste des sous-titres) :"}
              </span>
            </span>
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {Math.round((project.backgroundDim ?? 0.45) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.85"
            step="0.05"
            value={project.backgroundDim ?? 0.45}
            onChange={(e) => handleDimChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Clair (10%)</span>
            <span>Équilibré (45%)</span>
            <span>Très sombre (85%)</span>
          </div>
        </div>
      )}

      {/* Preset Quick Images */}
      <div>
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
          {isArabic ? 'أو اختر صورة جاهزة بجودة عالية :' : "Ou choisissez une image prête à l'emploi :"}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_BACKGROUNDS.map((bg, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(bg.url)}
              className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-500 h-16 transition-all text-left cursor-pointer"
            >
              <img
                src={bg.url}
                alt={bg.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-end p-1.5">
                <span className="text-[10px] font-bold text-white drop-shadow truncate">
                  {bg.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
