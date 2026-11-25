export type ReelPhase = 'hook' | 'problem' | 'solution' | 'cta';

export type VisualThemeKey = 
  | 'electric' 
  | 'sunset' 
  | 'dark-luxe' 
  | 'emerald' 
  | 'crimson' 
  | 'cyber';

export type SoundEffectType = 'whoosh' | 'ding' | 'pop' | 'impact' | 'none';

export type SubtitleStyle = 'hormozi' | 'beast' | 'neon' | 'clean' | 'cyber';

export interface ReelScene {
  id: string;
  order: number;
  phase: ReelPhase;
  phaseLabel: string;
  startTime: number;
  endTime: number;
  duration: number;
  narration: string;
  overlayTitle: string;
  overlaySubtitle: string;
  badge: string;
  soundEffect: SoundEffectType;
  visualTheme: VisualThemeKey;
  customImage?: string; // Data URL or object URL of phone image for this scene
}

export interface ReelProject {
  id: string;
  title: string;
  idea: string;
  tone: string;
  language: string;
  hookRating: string;
  viralityScore: number;
  retentionTip: string;
  recommendedBgmTrack: string;
  fbPostCaption: string;
  hashtags: string[];
  scenes: ReelScene[];
  subtitleStyle: SubtitleStyle;
  musicMood: 'energetic' | 'dramatic' | 'lofi' | 'hype' | 'minimal';
  globalBackgroundImage?: string; // Phone image applied across all scenes
  backgroundDim?: number; // 0 to 1, default 0.45
  backgroundBlur?: number; // 0 to 10 px
}

export interface PresetIdea {
  category: string;
  title: string;
  prompt: string;
  tone: string;
}
