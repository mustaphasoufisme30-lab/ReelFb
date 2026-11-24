import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Music,
  CheckCircle2,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Smartphone,
} from 'lucide-react';
import { ReelProject, ReelScene } from '../types/reel';
import { ReelCanvasRenderer } from '../utils/canvasRenderer';
import { audioEngine } from '../utils/audioEngine';
import { exportReelVideo, downloadBlob, normalizeProjectScenes } from '../utils/videoExporter';
import { VideoDownloadModal } from './VideoDownloadModal';
import { ExportProgressModal } from './ExportProgressModal';

interface ReelPhonePlayerProps {
  project: ReelProject;
  currentSceneIndex: number;
  onSceneChange: (sceneIndex: number) => void;
  onUpdateProject: (updated: ReelProject) => void;
}

export const ReelPhonePlayer: React.FC<ReelPhonePlayerProps> = ({
  project,
  currentSceneIndex,
  onSceneChange,
  onUpdateProject,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<ReelCanvasRenderer | null>(null);
  const phoneFileInputRef = useRef<HTMLInputElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showFbOverlay, setShowFbOverlay] = useState(true);
  const [likes, setLikes] = useState(14200);
  const [isLiked, setIsLiked] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'mp4' | 'webm'>('mp4');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [isVoiceoverLoading, setIsVoiceoverLoading] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [completedBlob, setCompletedBlob] = useState<Blob | null>(null);
  const [completedUrl, setCompletedUrl] = useState<string | null>(null);
  const [completedFormat, setCompletedFormat] = useState<'mp4' | 'webm'>('mp4');

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(0);
  const currentSceneIndexRef = useRef<number>(currentSceneIndex);
  const onSceneChangeRef = useRef(onSceneChange);
  const isMutedRef = useRef<boolean>(isMuted);
  const lastPlayedSceneIdRef = useRef<string>('');

  useEffect(() => {
    currentSceneIndexRef.current = currentSceneIndex;
    // When paused, jump preview to the selected scene so clicking a scene card immediately previews it
    if (!isPlaying && project.scenes[currentSceneIndex]) {
      const targetStart = project.scenes[currentSceneIndex].startTime + 0.05;
      const curScene = project.scenes.find(
        (s) => currentTimeRef.current >= s.startTime && currentTimeRef.current <= s.endTime
      );
      if (curScene?.id !== project.scenes[currentSceneIndex].id) {
        currentTimeRef.current = targetStart;
        setCurrentTime(targetStart);
      }
    }
  }, [currentSceneIndex, isPlaying, project.scenes]);

  // Reset player to 0s whenever a newly generated reel project loads
  useEffect(() => {
    setIsPlaying(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    lastPlayedSceneIdRef.current = '';
    audioEngine.stopAll();
  }, [project.id]);

  useEffect(() => {
    onSceneChangeRef.current = onSceneChange;
  }, [onSceneChange]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Initialize renderer
  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new ReelCanvasRenderer(canvasRef.current);
    }
  }, []);

  // Update canvas rendering whenever currentTime or project changes
  useEffect(() => {
    if (!rendererRef.current) return;
    const scene =
      project.scenes.find(
        (s) => currentTime >= s.startTime && currentTime <= s.endTime
      ) || project.scenes[project.scenes.length - 1];

    rendererRef.current.render({
      currentTime,
      currentScene: scene,
      subtitleStyle: project.subtitleStyle || 'hormozi',
      showFbOverlay,
      globalBackgroundImage: project.globalBackgroundImage,
      backgroundDim: project.backgroundDim,
      backgroundBlur: project.backgroundBlur,
    });
  }, [currentTime, project, showFbOverlay]);

  const playSceneNarration = (scene: ReelScene) => {
    if (isMutedRef.current) return;

    if (scene.audioUrl) {
      // Decode base64 or fetch
      fetch(scene.audioUrl)
        .then((res) => res.arrayBuffer())
        .then((buf) => audioEngine.playVoiceoverBuffer(buf))
        .catch(() => {
          audioEngine.speakFallback(scene.narration);
        });
    } else {
      // Fallback to browser SpeechSynthesis
      audioEngine.speakFallback(scene.narration);
    }
  };

  // Main playback animation loop
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioEngine.stopBgmLoop();
      audioEngine.stopVoiceover();
      return;
    }

    // Start BGM loop on play
    audioEngine.startBgmLoop(project.musicMood || 'energetic');

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaSec = Math.min(0.1, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      let next = currentTimeRef.current + deltaSec;
      if (next >= 20.0) {
        // Loop back to start (seamless Facebook Reel loop)
        lastPlayedSceneIdRef.current = '';
        next = 0;
      }

      currentTimeRef.current = next;
      setCurrentTime(next);

      // Check if scene changed (outside of any React state updater)
      const activeSceneIdx = project.scenes.findIndex(
        (s) => next >= s.startTime && next <= s.endTime
      );
      if (activeSceneIdx !== -1 && activeSceneIdx !== currentSceneIndexRef.current) {
        currentSceneIndexRef.current = activeSceneIdx;
        onSceneChangeRef.current(activeSceneIdx);
      }

      const activeScene = project.scenes[activeSceneIdx !== -1 ? activeSceneIdx : 0];
      if (activeScene && activeScene.id !== lastPlayedSceneIdRef.current) {
        lastPlayedSceneIdRef.current = activeScene.id;
        if (activeScene.soundEffect && activeScene.soundEffect !== 'none') {
          audioEngine.playSoundEffect(activeScene.soundEffect);
        }
        // Voiceover for scene
        playSceneNarration(activeScene);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioEngine.stopBgmLoop();
      audioEngine.stopVoiceover();
    };
  }, [isPlaying, project]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    lastPlayedSceneIdRef.current = '';
    currentSceneIndexRef.current = 0;
    onSceneChange(0);
    audioEngine.stopAll();
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMuted(nextMute);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    currentTimeRef.current = newTime;
    setCurrentTime(newTime);
    const sceneIdx = project.scenes.findIndex(
      (s) => newTime >= s.startTime && newTime <= s.endTime
    );
    if (sceneIdx !== -1 && sceneIdx !== currentSceneIndex) {
      currentSceneIndexRef.current = sceneIdx;
      onSceneChange(sceneIdx);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  // Upload phone photo directly from mobile simulator
  const handlePhonePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateProject({
          ...project,
          globalBackgroundImage: dataUrl,
          backgroundDim: project.backgroundDim ?? 0.45,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Video Export Handler (Initiates visible real-time export modal for 100% full 4-scene capture)
  const handleExport = (formatToExport: 'mp4' | 'webm' = exportFormat) => {
    setIsPlaying(false);
    setExportFormat(formatToExport);
    setIsExporting(true);
  };

  // Generate AI voiceover for all scenes with gemini-3.8-flash-lite-tts
  const handleGenerateAllVoiceovers = async () => {
    setIsVoiceoverLoading(true);
    try {
      const updatedScenes = [...project.scenes];
      for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        const res = await fetch('/api/generate-voiceover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: scene.narration,
            voiceName: project.voiceName || 'Fenrir',
          }),
        });
        const data = await res.json();
        if (data.audioBase64) {
          updatedScenes[i] = {
            ...scene,
            audioUrl: `data:audio/wav;base64,${data.audioBase64}`,
          };
        }
      }
      onUpdateProject({
        ...project,
        scenes: updatedScenes,
      });
    } catch (err) {
      console.warn('Voiceover generation skipped or failed:', err);
    } finally {
      setIsVoiceoverLoading(false);
    }
  };

  const activeScene =
    project.scenes.find(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    ) || project.scenes[0];

  return (
    <div className="flex flex-col items-center">
      {/* Top Phone Header Toolbar */}
      <div className="w-full max-w-sm flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Aperçu Réel Facebook (20s)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowFbOverlay(!showFbOverlay)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700/60 transition-colors border cursor-pointer"
            title="Afficher/Masquer l'interface Facebook"
          >
            {showFbOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Overlay FB</span>
          </button>
        </div>
      </div>

      {/* Realistic Smartphone Frame (9:16 vertical ratio) */}
      <div className="relative w-[320px] h-[568px] sm:w-[350px] sm:h-[622px] bg-black rounded-[42px] p-3 shadow-2xl shadow-indigo-950/40 border-[6px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col justify-between overflow-hidden select-none">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-30 pointer-events-none flex items-center justify-end px-3">
          <div className="w-2 h-2 rounded-full bg-indigo-900/60" />
        </div>

        {/* Video Canvas Layer */}
        <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-slate-950">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
            onClick={handleTogglePlay}
          />

          {/* Facebook Reel UI Overlay */}
          {showFbOverlay && (
            <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 bg-gradient-to-b from-black/40 via-transparent to-black/80">
              {/* Facebook Reel Top Bar */}
              <div className="flex items-center justify-between mt-6">
                <span className="text-xs font-bold text-white/90 drop-shadow flex items-center gap-1">
                  <span className="text-blue-500 font-extrabold text-sm">f</span> Réels
                </span>
                <span className="text-[11px] font-semibold text-white/80 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
                  {Math.floor(currentTime)}s / 20s
                </span>
              </div>

              {/* Right Action Icons (Like, Comment, Share, Remix) */}
              <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 pointer-events-auto">
                <button
                  onClick={handleLike}
                  className="flex flex-col items-center gap-1 transition-transform active:scale-125 group"
                >
                  <div
                    className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
                      isLiked
                        ? 'bg-red-500/90 text-white'
                        : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                  >
                    <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
                  </div>
                  <span className="text-[11px] font-bold text-white drop-shadow">
                    {(likes / 1000).toFixed(1)}k
                  </span>
                </button>

                <div className="flex flex-col items-center gap-1">
                  <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white">
                    <MessageCircle size={22} />
                  </div>
                  <span className="text-[11px] font-bold text-white drop-shadow">348</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white">
                    <Share2 size={22} />
                  </div>
                  <span className="text-[11px] font-bold text-white drop-shadow">Partager</span>
                </div>

                {/* Rotating Music Disc */}
                <div className="relative mt-2">
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 border-2 border-white/80 flex items-center justify-center ${
                      isPlaying ? 'animate-spin' : ''
                    }`}
                    style={{ animationDuration: '3s' }}
                  >
                    <Music size={14} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Bottom Creator Info & Sound Banner */}
              <div className="pointer-events-auto pr-16 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs text-white">
                      PRO
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white drop-shadow">
                        Votre Page Pro
                      </span>
                      <button className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition">
                        Suivre
                      </button>
                    </div>
                  </div>
                </div>

                <p
                  dir={/[\u0600-\u06FF]/.test(project.title) ? 'rtl' : 'ltr'}
                  className="text-xs text-white/95 line-clamp-2 drop-shadow font-medium"
                >
                  {project.title}
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                  <Music size={12} className="animate-pulse text-blue-400" />
                  <span className="truncate font-medium">
                    Son original • {project.recommendedBgmTrack || 'Électro Hype 20s'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Central Play/Pause Overlay indicator when paused */}
          {!isPlaying && (
            <div
              onClick={handleTogglePlay}
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center cursor-pointer z-25 group"
            >
              <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play size={28} className="translate-x-0.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Controls & Scrubber */}
      <div className="w-full max-w-sm mt-4 p-3.5 bg-white border-slate-200 shadow-md dark:bg-slate-900/90 dark:border-slate-800 dark:shadow-xl border rounded-2xl space-y-3 transition-colors duration-200">
        {/* Progress Bar with Scene Segments */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-blue-600 dark:text-blue-400 font-mono">
              {currentTime.toFixed(1)}s / 20.0s
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              {activeScene?.phaseLabel || 'Scène'}
            </span>
          </div>

          <div className="relative pt-1 pb-1">
            <input
              type="range"
              min="0"
              max="20"
              step="0.1"
              value={currentTime}
              onChange={handleScrub}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
            />

            {/* Segment markers (0s, 3s, 8s, 15s, 20s) */}
            <div className="flex justify-between px-1 text-[10px] text-slate-500 font-mono mt-1">
              <span>0s (Hook)</span>
              <span>3s</span>
              <span>8s</span>
              <span>15s (CTA)</span>
              <span>20s</span>
            </div>
          </div>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              className={`p-2.5 rounded-xl font-medium flex items-center justify-center transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
              title={isPlaying ? 'Pause' : 'Lecture'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Recommencer"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={handleToggleMute}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          {/* Quick Voiceover Gen Button */}
          <button
            onClick={handleGenerateAllVoiceovers}
            disabled={isVoiceoverLoading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 border transition-colors cursor-pointer"
            title="Générer la voix off IA pour chaque scène"
          >
            <Sparkles size={14} className="text-amber-500 dark:text-amber-400" />
            <span>{isVoiceoverLoading ? 'Synthèse...' : 'Voix off IA'}</span>
          </button>
        </div>

        {/* Quick Phone Photo Upload Button */}
        <input
          ref={phoneFileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhonePhotoUpload}
          className="hidden"
        />

        <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border-slate-200 dark:bg-slate-950/70 dark:border-slate-800 border rounded-xl">
          <button
            type="button"
            onClick={() => phoneFileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 dark:text-blue-300 dark:border-blue-500/30 border transition-colors cursor-pointer"
          >
            <ImageIcon size={14} className="text-blue-600 dark:text-blue-400" />
            <span>
              {project.globalBackgroundImage
                ? 'Changer photo de fond'
                : 'Ajouter photo du téléphone'}
            </span>
          </button>

          {project.globalBackgroundImage && (
            <button
              type="button"
              onClick={() =>
                onUpdateProject({ ...project, globalBackgroundImage: undefined })
              }
              className="text-[11px] text-slate-600 hover:text-red-600 bg-slate-200 dark:text-slate-400 dark:hover:text-red-400 dark:bg-slate-900 px-2 py-1 rounded cursor-pointer"
              title="Supprimer la photo"
            >
              Retirer
            </button>
          )}
        </div>

        {/* Video Format Selector (MP4 vs WebM) */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 pt-1">
          <span>Format de téléchargement :</span>
          <div className="flex bg-slate-100 border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-1 rounded-lg border">
            <button
              type="button"
              onClick={() => setExportFormat('mp4')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                exportFormat === 'mp4'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Smartphone size={12} />
              <span>MP4 (Mobile)</span>
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('webm')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                exportFormat === 'webm'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              WebM
            </button>
          </div>
        </div>

        {/* Main Video Download Action (MP4 by default) */}
        <button
          onClick={() => {
            setExportStatus('');
            handleExport(exportFormat);
          }}
          disabled={isExporting}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-blue-600/20 dark:shadow-blue-900/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          <Download size={18} />
          <span>
            {exportFormat === 'mp4'
              ? 'Télécharger en MP4 (iPhone / Android)'
              : 'Télécharger la Vidéo (WebM 9:16)'}
          </span>
        </button>

        {exportStatus && (
          <div className="p-2 rounded-lg bg-red-50 border-red-200 text-red-700 dark:bg-red-950/60 dark:border-red-500/40 dark:text-red-300 border text-xs text-center">
            {exportStatus}
          </div>
        )}
      </div>

      {/* Real-time 4-Scene Export Modal with Live Canvas Rendering */}
      <ExportProgressModal
        isOpen={isExporting}
        onClose={() => setIsExporting(false)}
        project={project}
        format={exportFormat}
        onSuccess={(result) => {
          setCompletedBlob(result.blob);
          setCompletedUrl(result.url);
          setCompletedFormat(result.format);
          setIsExporting(false);
          setDownloadModalOpen(true);

          const cleanTitle = (project.title || 'reel-facebook-20s')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-');
          downloadBlob(result.blob, `${cleanTitle}-20s.${result.format}`);
        }}
        onError={(err) => {
          setIsExporting(false);
          setExportStatus("Erreur lors de l'exportation : " + (err.message || 'Erreur inconnue'));
        }}
      />

      {/* Video Download & Preview Modal for Phone & Desktop */}
      <VideoDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        videoBlob={completedBlob}
        videoUrl={completedUrl}
        videoFormat={completedFormat}
        projectTitle={project.title}
      />
    </div>
  );
};
