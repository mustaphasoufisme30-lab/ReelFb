import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { ReelProject, ReelScene } from '../types/reel';
import { ReelCanvasRenderer } from './canvasRenderer';
import { audioEngine } from './audioEngine';

export interface ExportProgress {
  percent: number;
  currentSecond: number;
  sceneIndex: number;
  sceneTitle: string;
  totalScenes: number;
  status: string;
  phase: 'recording' | 'converting' | 'done';
}

export interface ExportOptions {
  format?: 'mp4' | 'webm';
  canvas?: HTMLCanvasElement;
  onProgress?: (progress: ExportProgress) => void;
  signal?: AbortSignal;
}

// Normalize all 4 scenes to ensure exact, contiguous 20.0 second timeline
export function normalizeProjectScenes(scenes: ReelScene[]): ReelScene[] {
  const standardTimings = [
    { start: 0.0, end: 3.0, phase: 'hook' as const, label: "L'Accroche (0-3s)" },
    { start: 3.0, end: 8.0, phase: 'problem' as const, label: 'Le Problème (3-8s)' },
    { start: 8.0, end: 15.0, phase: 'solution' as const, label: 'La Solution (8-15s)' },
    { start: 15.0, end: 20.0, phase: 'cta' as const, label: "L'Appel à l'Action (15-20s)" },
  ];

  if (!scenes || scenes.length === 0) {
    return standardTimings.map((std, idx) => ({
      id: `scene-fallback-${idx + 1}`,
      order: idx + 1,
      phase: std.phase,
      phaseLabel: std.label,
      startTime: std.start,
      endTime: std.end,
      duration: std.end - std.start,
      narration: '',
      overlayTitle: std.label,
      overlaySubtitle: '',
      badge: '🔥',
      soundEffect: 'whoosh',
      visualTheme: 'electric',
    }));
  }

  return standardTimings.map((std, idx) => {
    const s = scenes[idx] || scenes[scenes.length - 1];
    return {
      ...s,
      id: s.id || `sc-${idx + 1}`,
      order: idx + 1,
      phase: s.phase || std.phase,
      startTime: std.start,
      endTime: std.end,
      duration: Number((std.end - std.start).toFixed(1)),
      phaseLabel: s.phaseLabel || std.label,
    };
  });
}

// Get exact scene for the current timestamp (0.0 to 20.0s)
export function getSceneAtTimestamp(
  scenes: ReelScene[],
  currentTime: number
): { scene: ReelScene; index: number } {
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const isLast = i === scenes.length - 1;
    if (
      currentTime >= s.startTime &&
      (currentTime < s.endTime || (isLast && currentTime <= 20.0))
    ) {
      return { scene: s, index: i };
    }
  }
  return { scene: scenes[scenes.length - 1], index: scenes.length - 1 };
}

function withPromiseTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} (timeout ${ms}ms)`)), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Synthesize a complete 20.0-second Float32 mono audio track directly in the browser
 * (background beat + scene transition SFX) so client-side MP4 needs zero server calls.
 */
function synthesizeClientAudioPcm(
  durationSec: number,
  sampleRate: number,
  musicMood: string = 'energetic',
  scenes: Array<{ startTime: number; endTime: number; soundEffect?: string }> = []
): Float32Array<ArrayBuffer> {
  const numSamples = Math.floor(durationSec * sampleRate);
  const mix = new Float32Array(new ArrayBuffer(numSamples * 4));

  // 1. Background beat
  if (musicMood !== 'minimal') {
    const bpm = musicMood === 'lofi' ? 88 : musicMood === 'dramatic' ? 105 : 122;
    const stepDur = 60 / bpm / 4;
    const totalSteps = Math.floor(durationSec / stepDur);

    for (let step = 0; step < totalSteps; step++) {
      const startSample = Math.floor(step * stepDur * sampleRate);
      const isKick = step % 4 === 0;
      const isSnare = step % 8 === 4;
      const isHat = step % 2 === 1;

      if (isKick) {
        const kickLen = Math.floor(0.14 * sampleRate);
        for (let i = 0; i < kickLen && startSample + i < numSamples; i++) {
          const t = i / sampleRate;
          const freq = 130 * Math.exp(-t * 24) + 42;
          const env = Math.exp(-t * 18) * 0.22;
          mix[startSample + i] += Math.sin(2 * Math.PI * freq * t) * env;
        }
      }

      if (isSnare) {
        const snareLen = Math.floor(0.08 * sampleRate);
        for (let i = 0; i < snareLen && startSample + i < numSamples; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 35) * 0.1;
          const noise = Math.sin(i * 12.9898) * 43758.5453;
          const rand = (noise - Math.floor(noise)) * 2 - 1;
          mix[startSample + i] += rand * env;
        }
      }

      if (isHat) {
        const hatLen = Math.floor(0.03 * sampleRate);
        for (let i = 0; i < hatLen && startSample + i < numSamples; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 80) * 0.04;
          const noise = Math.sin(i * 78.233) * 43758.5453;
          const rand = (noise - Math.floor(noise)) * 2 - 1;
          mix[startSample + i] += rand * env;
        }
      }
    }
  }

  // 2. Scene transition Sound FX (0s, 3s, 8s, 15s)
  for (const scene of scenes) {
    const startSample = Math.max(0, Math.floor((scene.startTime || 0) * sampleRate));
    const sfx = scene.soundEffect || 'whoosh';

    if (sfx === 'whoosh') {
      const len = Math.floor(0.32 * sampleRate);
      for (let i = 0; i < len && startSample + i < numSamples; i++) {
        const t = i / sampleRate;
        const env = Math.sin((Math.PI * i) / len) * 0.25;
        const freq = 280 + 900 * Math.sin((Math.PI * i) / len);
        mix[startSample + i] += Math.sin(2 * Math.PI * freq * t) * env;
      }
    } else if (sfx === 'impact') {
      const len = Math.floor(0.45 * sampleRate);
      for (let i = 0; i < len && startSample + i < numSamples; i++) {
        const t = i / sampleRate;
        const freq = 110 * Math.exp(-t * 10) + 35;
        const env = Math.exp(-t * 7) * 0.38;
        mix[startSample + i] += Math.sin(2 * Math.PI * freq * t) * env;
      }
    } else if (sfx === 'ding') {
      const len = Math.floor(0.55 * sampleRate);
      for (let i = 0; i < len && startSample + i < numSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 6) * 0.25;
        mix[startSample + i] +=
          (Math.sin(2 * Math.PI * 1318.5 * t) + 0.5 * Math.sin(2 * Math.PI * 2637 * t)) * env;
      }
    } else if (sfx === 'pop') {
      const len = Math.floor(0.1 * sampleRate);
      for (let i = 0; i < len && startSample + i < numSamples; i++) {
        const t = i / sampleRate;
        const freq = 750 * Math.exp(-t * 22) + 180;
        const env = Math.exp(-t * 25) * 0.35;
        mix[startSample + i] += Math.sin(2 * Math.PI * freq * t) * env;
      }
    }
  }

  for (let i = 0; i < numSamples; i++) {
    if (mix[i] > 0.98) mix[i] = 0.98;
    else if (mix[i] < -0.98) mix[i] = -0.98;
  }

  return mix;
}

/**
 * Primary Export Function:
 * - For MP4 (default):
 *   1. Pure client-side WebCodecs + mp4-muxer (0 bytes uploaded, works on mobile, Vercel & offline, finishes 0->100% cleanly).
 *   2. Lightweight server FFmpeg fallback (small 480x854 payload ~2MB with strict 25s timeout & animated progress).
 *   3. Hardened MediaRecorder fallback.
 */
export async function exportReelVideo(
  project: ReelProject,
  options: ExportOptions = {}
): Promise<{ blob: Blob; format: 'mp4' | 'webm'; url: string }> {
  const { format = 'mp4', canvas: userCanvas, onProgress, signal } = options;

  const normalizedScenes = normalizeProjectScenes(project.scenes);
  const normalizedProject: ReelProject = {
    ...project,
    scenes: normalizedScenes,
  };

  if (format === 'mp4') {
    // Tier 1: Direct on-device WebCodecs H.264 + AAC MP4 encoding (never stalls on mobile upload!)
    if (typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined') {
      try {
        return await exportClientWebCodecsMp4(normalizedProject, {
          canvas: userCanvas,
          onProgress,
          signal,
        });
      } catch (err: any) {
        if (signal?.aborted || err?.message?.includes('annulé')) {
          throw err;
        }
        console.warn('Client WebCodecs MP4 unavailable, trying server FFmpeg fallback:', err);
      }
    }

    // Tier 2: Lightweight Server FFmpeg compilation with strict timeout
    try {
      return await exportServerFramesMp4(normalizedProject, {
        canvas: userCanvas,
        onProgress,
        signal,
      });
    } catch (err: any) {
      if (signal?.aborted || err?.message?.includes('annulé')) {
        throw err;
      }
      console.warn('Server MP4 compiler fallback to MediaRecorder:', err);
    }
  }

  // Tier 3: Browser MediaRecorder
  return await exportViaMediaRecorder(normalizedProject, {
    format,
    canvas: userCanvas,
    onProgress,
    signal,
  });
}

/**
 * Tier 1: 100% Client-Side Hardware H.264 + AAC MP4 Compiler (WebCodecs + mp4-muxer)
 * Zero network upload, guaranteed all 4 scenes, never gets stuck at 85% on mobile!
 */
async function exportClientWebCodecsMp4(
  project: ReelProject,
  options: {
    canvas?: HTMLCanvasElement;
    onProgress?: (progress: ExportProgress) => void;
    signal?: AbortSignal;
  }
): Promise<{ blob: Blob; format: 'mp4'; url: string }> {
  const { canvas: userCanvas, onProgress, signal } = options;
  const normalizedScenes = project.scenes;

  const fps = 15;
  const totalDuration = 20.0;
  const totalFrames = Math.round(totalDuration * fps); // 300 smooth frames

  // Probe supported H.264 encoder configuration for mobile & desktop GPUs
  const resolutions = [
    { width: 720, height: 1280, bitrate: 2_400_000 },
    { width: 540, height: 960, bitrate: 1_800_000 },
  ];
  const avcCodecs = [
    'avc1.420028',
    'avc1.420020',
    'avc1.4d0028',
    'avc1.640028',
    'avc1.42001f',
  ];

  let chosenVideoConfig: VideoEncoderConfig | null = null;
  for (const res of resolutions) {
    for (const codec of avcCodecs) {
      for (const hw of ['prefer-hardware', 'no-preference'] as const) {
        const candidate: VideoEncoderConfig = {
          codec,
          width: res.width,
          height: res.height,
          bitrate: res.bitrate,
          framerate: fps,
          hardwareAcceleration: hw,
          avc: { format: 'avc' },
        };
        try {
          const support = await VideoEncoder.isConfigSupported(candidate);
          if (support.supported) {
            chosenVideoConfig = support.config || candidate;
            break;
          }
        } catch {
          // try next config
        }
      }
      if (chosenVideoConfig) break;
    }
    if (chosenVideoConfig) break;
  }

  if (!chosenVideoConfig) {
    throw new Error('Aucun encodeur H.264 WebCodecs supporté sur ce navigateur.');
  }

  const outWidth = chosenVideoConfig.width;
  const outHeight = chosenVideoConfig.height;

  // Probe optional AAC AudioEncoder support (never blocks video export if unsupported)
  let chosenAudioConfig: AudioEncoderConfig | null = null;
  if (typeof AudioEncoder !== 'undefined' && typeof AudioData !== 'undefined') {
    for (const sampleRate of [44100, 48000]) {
      const candidate: AudioEncoderConfig = {
        codec: 'mp4a.40.2',
        numberOfChannels: 1,
        sampleRate,
        bitrate: 128_000,
      };
      try {
        const support = await AudioEncoder.isConfigSupported(candidate);
        if (support.supported) {
          chosenAudioConfig = support.config || candidate;
          break;
        }
      } catch {
        // continue
      }
    }
  }

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width: outWidth,
      height: outHeight,
    },
    ...(chosenAudioConfig
      ? {
          audio: {
            codec: 'aac',
            numberOfChannels: chosenAudioConfig.numberOfChannels,
            sampleRate: chosenAudioConfig.sampleRate,
          },
        }
      : {}),
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  let videoEncoderError: Error | null = null;
  let audioEncoderError: Error | null = null;

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (err) => {
      videoEncoderError = err instanceof Error ? err : new Error(String(err));
    },
  });
  videoEncoder.configure(chosenVideoConfig);

  let audioEncoder: AudioEncoder | null = null;
  if (chosenAudioConfig) {
    audioEncoder = new AudioEncoder({
      output: (chunk, meta) => {
        muxer.addAudioChunk(chunk, meta);
      },
      error: (err) => {
        audioEncoderError = err instanceof Error ? err : new Error(String(err));
      },
    });
    audioEncoder.configure(chosenAudioConfig);
  }

  // Render canvas is always 720x1280 for ReelCanvasRenderer
  const exportCanvas = userCanvas || document.createElement('canvas');
  exportCanvas.width = 720;
  exportCanvas.height = 1280;

  let scaledCanvas: HTMLCanvasElement | null = null;
  let scaledCtx: CanvasRenderingContext2D | null = null;
  if (outWidth !== 720 || outHeight !== 1280) {
    scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = outWidth;
    scaledCanvas.height = outHeight;
    scaledCtx = scaledCanvas.getContext('2d');
  }

  const renderer = new ReelCanvasRenderer(exportCanvas);

  try {
    if (project.globalBackgroundImage) {
      await renderer.preloadImage(project.globalBackgroundImage);
    }
    for (const scene of normalizedScenes) {
      if (scene.customImage) {
        await renderer.preloadImage(scene.customImage);
      }
    }

    const frameDurationUs = Math.round(1_000_000 / fps);

    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) {
        throw new Error("Export vidéo annulé par l'utilisateur.");
      }
      if (videoEncoderError) {
        throw videoEncoderError;
      }

      const currentTime = Number(((i / totalFrames) * totalDuration).toFixed(3));
      const { scene: currentScene, index: activeIdx } = getSceneAtTimestamp(
        normalizedScenes,
        currentTime
      );

      renderer.render({
        currentTime,
        currentScene,
        subtitleStyle: project.subtitleStyle || 'hormozi',
        globalBackgroundImage: project.globalBackgroundImage,
        backgroundDim: project.backgroundDim,
        backgroundBlur: project.backgroundBlur,
      });

      let frameSource: HTMLCanvasElement = exportCanvas;
      if (scaledCanvas && scaledCtx) {
        scaledCtx.drawImage(exportCanvas, 0, 0, outWidth, outHeight);
        frameSource = scaledCanvas;
      }

      // Apply backpressure so mobile GPU encoders never overflow memory
      let waitLoops = 0;
      while (videoEncoder.encodeQueueSize > 6 && waitLoops < 400) {
        if (signal?.aborted) throw new Error("Export vidéo annulé par l'utilisateur.");
        if (videoEncoderError) throw videoEncoderError;
        await new Promise((r) => setTimeout(r, 15));
        waitLoops++;
      }

      const timestampUs = i * frameDurationUs;
      const frame = new VideoFrame(frameSource, {
        timestamp: timestampUs,
        duration: frameDurationUs,
      });
      videoEncoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();

      if (i % 4 === 0 || i === totalFrames - 1) {
        const percent = Math.min(84, Math.round(((i + 1) / totalFrames) * 84));
        if (onProgress) {
          onProgress({
            percent,
            currentSecond: Number(currentTime.toFixed(1)),
            sceneIndex: activeIdx,
            sceneTitle: currentScene.overlayTitle || currentScene.phaseLabel,
            totalScenes: normalizedScenes.length,
            status: `Scène ${activeIdx + 1}/4 : ${currentScene.phaseLabel} (${currentTime.toFixed(1)}s / 20.0s)`,
            phase: 'recording',
          });
        }
        // Yield to keep mobile UI & progress bar silky smooth
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    if (signal?.aborted) {
      throw new Error("Export vidéo annulé par l'utilisateur.");
    }

    // Encode 20s synthesized AAC audio locally
    if (audioEncoder && chosenAudioConfig && !audioEncoderError) {
      if (onProgress) {
        onProgress({
          percent: 88,
          currentSecond: 20.0,
          sceneIndex: 3,
          sceneTitle: normalizedScenes[3]?.overlayTitle || "L'Appel à l'Action",
          totalScenes: normalizedScenes.length,
          status: 'Mixage audio HD (musique + effets sonores)...',
          phase: 'converting',
        });
      }

      const sr = chosenAudioConfig.sampleRate;
      const pcm = synthesizeClientAudioPcm(
        totalDuration,
        sr,
        project.musicMood || 'energetic',
        normalizedScenes
      );
      const chunkFrames = 1024;
      for (let offset = 0; offset < pcm.length; offset += chunkFrames) {
        if (signal?.aborted) throw new Error("Export vidéo annulé par l'utilisateur.");
        if (audioEncoderError) break;

        const len = Math.min(chunkFrames, pcm.length - offset);
        const slice = new Float32Array(new ArrayBuffer(len * 4));
        slice.set(pcm.subarray(offset, offset + len));
        const audioData = new AudioData({
          format: 'f32',
          sampleRate: sr,
          numberOfFrames: len,
          numberOfChannels: 1,
          timestamp: Math.round((offset / sr) * 1_000_000),
          data: slice,
        });
        audioEncoder.encode(audioData);
        audioData.close();

        if (offset % (chunkFrames * 64) === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    }

    if (onProgress) {
      onProgress({
        percent: 95,
        currentSecond: 20.0,
        sceneIndex: 3,
        sceneTitle: normalizedScenes[3]?.overlayTitle || "L'Appel à l'Action",
        totalScenes: normalizedScenes.length,
        status: 'Finalisation du fichier MP4 mobile...',
        phase: 'converting',
      });
    }

    await withPromiseTimeout(videoEncoder.flush(), 15000, 'Flush vidéo MP4');
    if (audioEncoder && !audioEncoderError) {
      await withPromiseTimeout(audioEncoder.flush(), 10000, 'Flush audio AAC');
    }

    if (videoEncoderError) throw videoEncoderError;

    muxer.finalize();

    const mp4Blob = new Blob([target.buffer], { type: 'video/mp4' });
    if (mp4Blob.size < 10_000) {
      throw new Error('Fichier MP4 généré vide ou invalide.');
    }

    const url = URL.createObjectURL(mp4Blob);

    if (onProgress) {
      onProgress({
        percent: 100,
        currentSecond: 20.0,
        sceneIndex: 3,
        sceneTitle: 'Terminé',
        totalScenes: normalizedScenes.length,
        status: 'Vidéo MP4 complète (4 scènes - 20s) prête !',
        phase: 'done',
      });
    }

    return { blob: mp4Blob, format: 'mp4', url };
  } finally {
    try {
      if (videoEncoder.state !== 'closed') videoEncoder.close();
    } catch {}
    try {
      if (audioEncoder && audioEncoder.state !== 'closed') audioEncoder.close();
    } catch {}
  }
}

/**
 * Tier 2: Lightweight Server Frame-by-Frame FFmpeg Compiler
 * Uses compact 480x854 frames (~2.2 MB total instead of 15 MB) + strict 25s timeout + live progress tick
 */
async function exportServerFramesMp4(
  project: ReelProject,
  options: {
    canvas?: HTMLCanvasElement;
    onProgress?: (progress: ExportProgress) => void;
    signal?: AbortSignal;
  }
): Promise<{ blob: Blob; format: 'mp4'; url: string }> {
  const { canvas: userCanvas, onProgress, signal } = options;
  const normalizedScenes = project.scenes;

  const exportCanvas = userCanvas || document.createElement('canvas');
  exportCanvas.width = 720;
  exportCanvas.height = 1280;

  // Compact transfer canvas (480x854) keeps total payload ~2 MB so phones upload in ~1-2s
  const transferCanvas = document.createElement('canvas');
  transferCanvas.width = 480;
  transferCanvas.height = 854;
  const transferCtx = transferCanvas.getContext('2d');

  const renderer = new ReelCanvasRenderer(exportCanvas);

  if (project.globalBackgroundImage) {
    await renderer.preloadImage(project.globalBackgroundImage);
  }
  for (const scene of normalizedScenes) {
    if (scene.customImage) {
      await renderer.preloadImage(scene.customImage);
    }
  }

  const totalDuration = 20.0;
  const fps = 4; // 80 frames across 20s -> smooth & lightweight (~2 MB)
  const totalFrames = totalDuration * fps;
  const frames: string[] = [];

  for (let i = 0; i < totalFrames; i++) {
    if (signal?.aborted) {
      throw new Error("Export vidéo annulé par l'utilisateur.");
    }

    const currentTime = Number(((i / totalFrames) * totalDuration).toFixed(2));
    const { scene: currentScene, index: activeIdx } = getSceneAtTimestamp(
      normalizedScenes,
      currentTime
    );

    renderer.render({
      currentTime,
      currentScene,
      subtitleStyle: project.subtitleStyle || 'hormozi',
      globalBackgroundImage: project.globalBackgroundImage,
      backgroundDim: project.backgroundDim,
      backgroundBlur: project.backgroundBlur,
    });

    let dataUrl: string;
    if (transferCtx) {
      transferCtx.drawImage(exportCanvas, 0, 0, transferCanvas.width, transferCanvas.height);
      dataUrl = transferCanvas.toDataURL('image/jpeg', 0.68);
    } else {
      dataUrl = exportCanvas.toDataURL('image/jpeg', 0.68);
    }
    frames.push(dataUrl);

    if (i % 2 === 0 || i === totalFrames - 1) {
      const percent = Math.min(80, Math.round(((i + 1) / totalFrames) * 80));
      if (onProgress) {
        onProgress({
          percent,
          currentSecond: Number(currentTime.toFixed(1)),
          sceneIndex: activeIdx,
          sceneTitle: currentScene.overlayTitle || currentScene.phaseLabel,
          totalScenes: normalizedScenes.length,
          status: `Scène ${activeIdx + 1}/4 : ${currentScene.phaseLabel} (${currentTime.toFixed(1)}s / 20.0s)`,
          phase: 'recording',
        });
      }
      await new Promise((r) => setTimeout(r, 8));
    }
  }

  if (signal?.aborted) {
    throw new Error("Export vidéo annulé par l'utilisateur.");
  }

  let serverPercent = 84;
  const emitServerProgress = (pct: number, statusText: string) => {
    if (onProgress) {
      onProgress({
        percent: pct,
        currentSecond: 20.0,
        sceneIndex: 3,
        sceneTitle: normalizedScenes[3]?.overlayTitle || "L'Appel à l'Action",
        totalScenes: normalizedScenes.length,
        status: statusText,
        phase: 'converting',
      });
    }
  };

  emitServerProgress(serverPercent, 'Compilation MP4 HD des 4 scènes + mixage audio (20s)...');

  // Animated progress ticker during server compile + strict 25s abort timeout (never freezes at 85%!)
  const fetchController = new AbortController();
  const onParentAbort = () => fetchController.abort();
  signal?.addEventListener('abort', onParentAbort);

  const timeoutId = setTimeout(() => fetchController.abort(), 25000);
  const progressTicker = setInterval(() => {
    serverPercent = Math.min(96, serverPercent + 2);
    emitServerProgress(serverPercent, 'Encodage MP4 H.264 + audio en cours...');
  }, 1200);

  const cleanTitle = (project.title || 'reel-facebook-20s')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');

  try {
    const res = await fetch('/api/compile-frames-mp4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frames,
        fps,
        musicMood: project.musicMood || 'energetic',
        scenes: normalizedScenes.map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          soundEffect: s.soundEffect,
        })),
        filename: `${cleanTitle}-20s.mp4`,
      }),
      signal: fetchController.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Erreur serveur');
      throw new Error(`Échec compilation MP4 (${res.status}): ${errText}`);
    }

    const mp4Blob = await res.blob();
    const url = URL.createObjectURL(mp4Blob);

    if (onProgress) {
      onProgress({
        percent: 100,
        currentSecond: 20.0,
        sceneIndex: 3,
        sceneTitle: 'Terminé',
        totalScenes: normalizedScenes.length,
        status: 'Vidéo MP4 complète (4 scènes - 20s) prête !',
        phase: 'done',
      });
    }

    return { blob: mp4Blob, format: 'mp4', url };
  } finally {
    clearTimeout(timeoutId);
    clearInterval(progressTicker);
    signal?.removeEventListener('abort', onParentAbort);
  }
}

/**
 * Tier 3: Hardened Browser MediaRecorder Exporter (Native MP4 preferred on mobile, never stalls on suspended audio)
 */
async function exportViaMediaRecorder(
  project: ReelProject,
  options: ExportOptions
): Promise<{ blob: Blob; format: 'mp4' | 'webm'; url: string }> {
  const { format = 'webm', canvas: userCanvas, onProgress, signal } = options;

  return new Promise(async (resolve, reject) => {
    let internalCanvasCreated = false;
    let exportCanvas: HTMLCanvasElement;
    let recorder: MediaRecorder | null = null;
    let timerInterval: ReturnType<typeof setInterval> | null = null;
    let safetyTimeout: ReturnType<typeof setTimeout> | null = null;
    let isAborted = false;

    const cleanup = () => {
      audioEngine.stopAll();
      if (timerInterval) clearInterval(timerInterval);
      if (safetyTimeout) clearTimeout(safetyTimeout);
      if (internalCanvasCreated && exportCanvas && exportCanvas.parentNode) {
        try {
          document.body.removeChild(exportCanvas);
        } catch {}
      }
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        isAborted = true;
        cleanup();
        reject(new Error("Export vidéo annulé par l'utilisateur."));
      });
    }

    try {
      const normalizedScenes = project.scenes;

      if (userCanvas) {
        exportCanvas = userCanvas;
        exportCanvas.width = 720;
        exportCanvas.height = 1280;
      } else {
        internalCanvasCreated = true;
        exportCanvas = document.createElement('canvas');
        exportCanvas.width = 720;
        exportCanvas.height = 1280;
        exportCanvas.style.position = 'fixed';
        exportCanvas.style.top = '0';
        exportCanvas.style.left = '0';
        exportCanvas.style.width = '240px';
        exportCanvas.style.height = '426px';
        exportCanvas.style.zIndex = '-999';
        exportCanvas.style.opacity = '0.01';
        exportCanvas.style.pointerEvents = 'none';
        document.body.appendChild(exportCanvas);
      }

      const renderer = new ReelCanvasRenderer(exportCanvas);

      if (project.globalBackgroundImage) {
        await renderer.preloadImage(project.globalBackgroundImage);
      }
      for (const scene of normalizedScenes) {
        if (scene.customImage) {
          await renderer.preloadImage(scene.customImage);
        }
      }

      if (isAborted) return;

      const canvasStream = exportCanvas.captureStream(24);
      const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      // Only attach live audio tracks (avoids Chrome Android hanging on suspended AudioContext)
      try {
        const audioStream = audioEngine.getMediaStream();
        if (audioStream) {
          const liveAudioTracks = audioStream
            .getAudioTracks()
            .filter((t) => t.readyState === 'live');
          if (liveAudioTracks.length > 0) {
            tracks.push(...liveAudioTracks);
          }
        }
      } catch {}

      const combinedStream = new MediaStream(tracks);

      const candidateTypes =
        format === 'mp4'
          ? [
              'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
              'video/mp4;codecs=avc1',
              'video/mp4',
              'video/webm;codecs=vp8,opus',
              'video/webm;codecs=vp8',
              'video/webm',
            ]
          : [
              'video/webm;codecs=vp8,opus',
              'video/webm;codecs=vp9,opus',
              'video/webm',
              'video/mp4',
            ];

      const mimeType =
        candidateTypes.find((t) => {
          try {
            return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t);
          } catch {
            return false;
          }
        }) || '';

      recorder = mimeType
        ? new MediaRecorder(combinedStream, { mimeType })
        : new MediaRecorder(combinedStream);

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        cleanup();
        if (isAborted) return;

        const actualMime = mimeType || recorder?.mimeType || 'video/webm';
        const recordedBlob = new Blob(chunks, { type: actualMime });

        if (format === 'mp4' && !actualMime.includes('mp4')) {
          try {
            if (onProgress) {
              onProgress({
                percent: 94,
                currentSecond: 20.0,
                sceneIndex: 3,
                sceneTitle: normalizedScenes[3]?.overlayTitle || "L'Appel à l'Action",
                totalScenes: normalizedScenes.length,
                status: 'Conversion MP4 finale...',
                phase: 'converting',
              });
            }
            const cleanTitle = (project.title || 'reel-facebook-20s')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-');
            const mp4Blob = await withPromiseTimeout(
              convertBlobToMp4(recordedBlob, `${cleanTitle}-20s.mp4`),
              15000,
              'Conversion MP4'
            );
            const url = URL.createObjectURL(mp4Blob);
            if (onProgress) {
              onProgress({
                percent: 100,
                currentSecond: 20.0,
                sceneIndex: 3,
                sceneTitle: 'Terminé',
                totalScenes: normalizedScenes.length,
                status: 'Vidéo MP4 complète prête !',
                phase: 'done',
              });
            }
            resolve({ blob: mp4Blob, format: 'mp4', url });
            return;
          } catch {
            // Serve recorded blob directly instead of failing or hanging
          }
        }

        const outFormat: 'mp4' | 'webm' = actualMime.includes('mp4') ? 'mp4' : 'webm';
        const url = URL.createObjectURL(recordedBlob);
        if (onProgress) {
          onProgress({
            percent: 100,
            currentSecond: 20.0,
            sceneIndex: 3,
            sceneTitle: 'Terminé',
            totalScenes: normalizedScenes.length,
            status: `Vidéo ${outFormat.toUpperCase()} prête !`,
            phase: 'done',
          });
        }
        resolve({
          blob: recordedBlob,
          format: outFormat,
          url,
        });
      };

      recorder.onerror = (err) => {
        cleanup();
        reject(err);
      };

      safetyTimeout = setTimeout(() => {
        if (recorder && recorder.state === 'recording') {
          recorder.stop();
        }
      }, 23000);

      recorder.start(250);
      audioEngine.startBgmLoop(project.musicMood || 'energetic');

      const targetDurationSec = 20.0;
      const startTime = performance.now();
      let lastSceneIdx = -1;
      let lastProgressTime = 0;

      timerInterval = setInterval(() => {
        if (isAborted) return;
        const now = performance.now();
        const currentTime = Math.min(targetDurationSec, (now - startTime) / 1000);

        const { scene: currentScene, index: activeIdx } = getSceneAtTimestamp(
          normalizedScenes,
          currentTime
        );

        if (activeIdx !== lastSceneIdx) {
          lastSceneIdx = activeIdx;
          if (currentScene.soundEffect && currentScene.soundEffect !== 'none') {
            audioEngine.playSoundEffect(currentScene.soundEffect);
          }
        }

        renderer.render({
          currentTime,
          currentScene,
          subtitleStyle: project.subtitleStyle || 'hormozi',
          globalBackgroundImage: project.globalBackgroundImage,
          backgroundDim: project.backgroundDim,
          backgroundBlur: project.backgroundBlur,
        });

        if (now - lastProgressTime >= 200 || currentTime >= targetDurationSec) {
          lastProgressTime = now;
          const percent = Math.min(92, Math.round((currentTime / targetDurationSec) * 92));
          if (onProgress) {
            onProgress({
              percent,
              currentSecond: Number(currentTime.toFixed(1)),
              sceneIndex: activeIdx,
              sceneTitle: currentScene.overlayTitle || currentScene.phaseLabel,
              totalScenes: normalizedScenes.length,
              status: `Scène ${activeIdx + 1}/4 : ${currentScene.phaseLabel} (${currentTime.toFixed(1)}s / 20.0s)`,
              phase: 'recording',
            });
          }
        }

        if (currentTime >= targetDurationSec) {
          if (timerInterval) clearInterval(timerInterval);
          if (recorder && recorder.state === 'recording') {
            recorder.stop();
          }
        }
      }, 50);
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

// Convert WebM Blob to universal MP4 via server FFmpeg using raw binary stream
export async function convertBlobToMp4(
  webmBlob: Blob,
  filename: string
): Promise<Blob> {
  const res = await fetch(
    `/api/convert-to-mp4?filename=${encodeURIComponent(filename)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'video/webm',
      },
      body: webmBlob,
    }
  );

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Erreur inconnue');
    throw new Error(`Échec conversion serveur (${res.status}): ${errorText}`);
  }

  return await res.blob();
}

// Download blob helper with reliable mobile & desktop file trigger
export function downloadBlob(blob: Blob, filename: string): string {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    try {
      if (a.parentNode) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }, 120000);

  return url;
}

// SRT Subtitles generator for Facebook upload
export function generateSRT(project: ReelProject): string {
  let srt = '';
  const normalized = normalizeProjectScenes(project.scenes);
  normalized.forEach((scene, idx) => {
    const start = formatTime(scene.startTime);
    const end = formatTime(scene.endTime);
    srt += `${idx + 1}\n${start} --> ${end}\n${scene.overlayTitle}\n${scene.narration}\n\n`;
  });
  return srt;
}

function formatTime(sec: number): string {
  const ms = Math.floor((sec % 1) * 1000);
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function pad(num: number, size = 2): string {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}
