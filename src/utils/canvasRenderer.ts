import { ReelScene, SubtitleStyle, VisualThemeKey } from '../types/reel';

export interface RenderFrameOptions {
  currentTime: number; // 0 to 20
  currentScene: ReelScene;
  subtitleStyle: SubtitleStyle;
  showFbOverlay?: boolean;
  globalBackgroundImage?: string;
  backgroundDim?: number;
  backgroundBlur?: number;
}

export class ReelCanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public width = 720;
  public height = 1280;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  public preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      const cached = this.imageCache.get(src)!;
      if (cached.complete) return Promise.resolve(cached);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        resolve(img);
      };
      img.src = src;
      this.imageCache.set(src, img);
    });
  }

  public render(options: RenderFrameOptions) {
    const {
      currentTime,
      currentScene,
      subtitleStyle,
      globalBackgroundImage,
      backgroundDim = 0.45,
    } = options;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw background (Custom phone image or dynamic gradient)
    const activeImageSrc = currentScene.customImage || globalBackgroundImage;
    this.drawBackground(currentScene.visualTheme, currentTime, activeImageSrc, backgroundDim);

    // 2. Draw Top Progress Bar (20-second breakdown)
    this.drawProgressBar(currentTime);

    // 3. Draw Scene Phase Tag
    this.drawPhaseBadge(currentScene, currentTime);

    // 4. Draw Center Badge (Sticker)
    this.drawStickerBadge(currentScene.badge, currentTime, currentScene.startTime);

    // 5. Draw Big Bold Headline (overlayTitle)
    this.drawHeadline(currentScene.overlayTitle, subtitleStyle, currentTime, currentScene.startTime);

    // 6. Draw Animated Karaoke Subtitles / Narration
    this.drawNarrationKaraoke(
      currentScene.narration,
      currentScene.startTime,
      currentScene.endTime,
      currentTime,
      subtitleStyle
    );

    // 7. Draw Audio Visualizer Waveform at bottom
    this.drawAudioWave(currentTime);
  }

  private drawBackground(
    theme: VisualThemeKey,
    t: number,
    imageSrc?: string,
    dim: number = 0.45
  ) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Check if phone image is available
    if (imageSrc) {
      let img = this.imageCache.get(imageSrc);
      if (!img) {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageSrc;
        this.imageCache.set(imageSrc, img);
      }

      if (img.complete && img.naturalWidth > 0) {
        // Draw image cover (9:16 vertical crop)
        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        const targetAspect = w / h; // 720 / 1280 = 0.5625
        const imgAspect = imgW / imgH;

        let srcW = imgW;
        let srcH = imgH;
        let srcX = 0;
        let srcY = 0;

        if (imgAspect > targetAspect) {
          // Image is wider than 9:16
          srcW = imgH * targetAspect;
          srcX = (imgW - srcW) / 2;
        } else {
          // Image is taller than 9:16
          srcH = imgW / targetAspect;
          srcY = (imgH - srcH) / 2;
        }

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, w, h);

        // Apply dark dimming overlay for subtitle contrast
        ctx.fillStyle = `rgba(0, 0, 0, ${dim})`;
        ctx.fillRect(0, 0, w, h);

        // Subtle gradient shading top and bottom
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(0,0,0,0.5)');
        grad.addColorStop(0.25, 'rgba(0,0,0,0)');
        grad.addColorStop(0.7, 'rgba(0,0,0,0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        return;
      }
    }

    let grad = ctx.createLinearGradient(0, 0, w, h);

    switch (theme) {
      case 'electric':
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#312e81');
        break;
      case 'sunset':
        grad.addColorStop(0, '#1c1917');
        grad.addColorStop(0.5, '#7c2d12');
        grad.addColorStop(1, '#9a3412');
        break;
      case 'emerald':
        grad.addColorStop(0, '#022c22');
        grad.addColorStop(0.6, '#064e3b');
        grad.addColorStop(1, '#065f46');
        break;
      case 'crimson':
        grad.addColorStop(0, '#18181b');
        grad.addColorStop(0.5, '#450a0a');
        grad.addColorStop(1, '#881337');
        break;
      case 'dark-luxe':
        grad.addColorStop(0, '#09090b');
        grad.addColorStop(0.5, '#18181b');
        grad.addColorStop(1, '#27272a');
        break;
      case 'cyber':
      default:
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(0.5, '#111827');
        grad.addColorStop(1, '#0c1b33');
        break;
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Dynamic light orbs
    ctx.save();
    const orb1X = w * 0.3 + Math.sin(t * 1.5) * 80;
    const orb1Y = h * 0.4 + Math.cos(t * 1.2) * 120;
    const radGrad1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, 340);
    radGrad1.addColorStop(0, theme === 'electric' ? 'rgba(56, 189, 248, 0.28)' : 'rgba(249, 115, 22, 0.25)');
    radGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad1;
    ctx.beginPath();
    ctx.arc(orb1X, orb1Y, 340, 0, Math.PI * 2);
    ctx.fill();

    const orb2X = w * 0.7 + Math.cos(t * 1.8) * 90;
    const orb2Y = h * 0.65 + Math.sin(t * 1.4) * 110;
    const radGrad2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, 320);
    radGrad2.addColorStop(0, theme === 'emerald' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(168, 85, 247, 0.22)');
    radGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad2;
    ctx.beginPath();
    ctx.arc(orb2X, orb2Y, 320, 0, Math.PI * 2);
    ctx.fill();

    // Subtle perspective grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawProgressBar(t: number) {
    const ctx = this.ctx;
    const w = this.width;
    const totalSec = 20;
    const barY = 48;
    const barHeight = 8;
    const margin = 32;
    const totalWidth = w - margin * 2;

    // 4 scene chunks: 0-3s, 3-8s, 8-15s, 15-20s
    const segments = [
      { start: 0, end: 3 },
      { start: 3, end: 8 },
      { start: 8, end: 15 },
      { start: 15, end: 20 },
    ];

    const gap = 6;
    const segmentWidth = (totalWidth - gap * 3) / 4;

    segments.forEach((seg, i) => {
      const segX = margin + i * (segmentWidth + gap);

      // Background segment track
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.drawRoundedRect(ctx, segX, barY, segmentWidth, barHeight, 4);
      ctx.fill();

      // Filled progress inside this segment
      if (t > seg.start) {
        const segDuration = seg.end - seg.start;
        const progressInSeg = Math.min(1, Math.max(0, (t - seg.start) / segDuration));
        const fillW = segmentWidth * progressInSeg;

        ctx.fillStyle = '#38bdf8'; // vibrant cyan glow
        ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
        ctx.shadowBlur = 8;
        this.drawRoundedRect(ctx, segX, barY, fillW, barHeight, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Time ticker on the right
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'right';
    const formatted = `${Math.min(20, Math.floor(t))}s / 20s`;
    ctx.fillText(formatted, w - margin, barY + 36);
  }

  private isArabic(text: string): boolean {
    return /[\u0600-\u06FF]/.test(text);
  }

  private drawPhaseBadge(scene: ReelScene, _t: number) {
    const ctx = this.ctx;
    const isAr = this.isArabic(scene.phaseLabel);
    const pillY = 90;
    const pillX = 32;

    ctx.save();
    ctx.direction = isAr ? 'rtl' : 'ltr';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    this.drawRoundedRect(ctx, pillX, pillY, 210, 36, 18);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glowing dot
    ctx.beginPath();
    ctx.arc(pillX + 20, pillY + 18, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();

    ctx.font = `bold 14px 'Noto Sans Arabic', 'Segoe UI', Tahoma, system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(scene.phaseLabel.toUpperCase(), pillX + 34, pillY + 23);
    ctx.restore();
  }

  private drawStickerBadge(badge: string, currentTime: number, startTime: number) {
    if (!badge) return;
    const ctx = this.ctx;
    const w = this.width;
    const badgeY = 320;
    const isAr = this.isArabic(badge);

    // Pop scale animation during the first 0.3s of scene
    const elapsed = currentTime - startTime;
    const scale = elapsed < 0.25 ? Math.min(1.15, 0.6 + elapsed * 2.5) : 1.0;

    ctx.save();
    ctx.direction = isAr ? 'rtl' : 'ltr';
    ctx.translate(w / 2, badgeY);
    ctx.scale(scale, scale);

    ctx.font = `900 24px 'Noto Sans Arabic', 'Segoe UI', Tahoma, system-ui, sans-serif`;
    const textWidth = ctx.measureText(badge).width;
    const padX = 28;
    const padY = 14;

    // Glowing badge background
    ctx.shadowColor = 'rgba(234, 179, 8, 0.6)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#fbbf24'; // Yellow alert badge
    this.drawRoundedRect(ctx, -textWidth / 2 - padX, -padY - 14, textWidth + padX * 2, padY * 2 + 28, 16);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Text in black bold
    ctx.fillStyle = '#09090b';
    ctx.textAlign = 'center';
    ctx.fillText(badge, 0, 7);
    ctx.restore();
  }

  private drawHeadline(
    title: string,
    style: SubtitleStyle,
    currentTime: number,
    startTime: number
  ) {
    if (!title) return;
    const ctx = this.ctx;
    const w = this.width;
    const centerY = 480;
    const isAr = this.isArabic(title);

    const elapsed = currentTime - startTime;
    // Punchy zoom-in
    const zoom = elapsed < 0.2 ? 0.9 + elapsed * 0.5 : 1.0;

    ctx.save();
    ctx.direction = isAr ? 'rtl' : 'ltr';
    ctx.translate(w / 2, centerY);
    ctx.scale(zoom, zoom);

    ctx.font = isAr
      ? `900 46px 'Noto Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif`
      : `900 48px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';

    const words = title.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > w - 100) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);

    const lineHeight = isAr ? 72 : 66;
    const startY = -((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, idx) => {
      const y = startY + idx * lineHeight;
      const textW = ctx.measureText(line).width;

      if (style === 'hormozi') {
        // Hormozi Style: Vibrant yellow box behind text
        ctx.fillStyle = idx % 2 === 0 ? '#facc15' : '#4ade80';
        this.drawRoundedRect(ctx, -textW / 2 - 18, y - 42, textW + 36, 56, 8);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.fillText(line, 0, y);
      } else if (style === 'beast') {
        // MrBeast Style: Huge white text with massive black outline
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#000000';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;
        ctx.strokeText(line, 0, y);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, 0, y);
      } else if (style === 'neon') {
        // Neon Cyber Style
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 24;
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#0891b2';
        ctx.strokeText(line, 0, y);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, 0, y);
        ctx.shadowBlur = 0;
      } else {
        // Clean Minimalist
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        this.drawRoundedRect(ctx, -textW / 2 - 18, y - 44, textW + 36, 58, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, 0, y);
      }
    });

    ctx.restore();
  }

  private drawNarrationKaraoke(
    narration: string,
    sceneStart: number,
    sceneEnd: number,
    currentTime: number,
    _style: SubtitleStyle
  ) {
    if (!narration) return;
    const ctx = this.ctx;
    const w = this.width;
    const boxY = 820;
    const isAr = this.isArabic(narration);

    const words = narration.split(' ');
    const totalWords = words.length;
    const sceneDuration = sceneEnd - sceneStart;
    const progress = Math.min(1, Math.max(0, (currentTime - sceneStart) / sceneDuration));
    const activeWordIndex = Math.floor(progress * totalWords);

    ctx.save();
    ctx.direction = isAr ? 'rtl' : 'ltr';
    ctx.font = isAr
      ? `700 27px 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif`
      : `700 28px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';

    const lines: { text: string; words: string[]; startIndex: number }[] = [];
    let currentWords: string[] = [];
    let currentLineText = '';
    let lineStartIndex = 0;

    words.forEach((word, i) => {
      const test = currentLineText ? `${currentLineText} ${word}` : word;
      if (ctx.measureText(test).width > w - 120) {
        lines.push({
          text: currentLineText,
          words: currentWords,
          startIndex: lineStartIndex,
        });
        currentWords = [word];
        currentLineText = word;
        lineStartIndex = i;
      } else {
        currentWords.push(word);
        currentLineText = test;
      }
    });
    if (currentWords.length > 0) {
      lines.push({
        text: currentLineText,
        words: currentWords,
        startIndex: lineStartIndex,
      });
    }

    // Draw container card for captions
    const pad = 24;
    const lineHeight = isAr ? 48 : 42;
    const totalBoxHeight = lines.length * lineHeight + pad * 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.drawRoundedRect(ctx, 40, boxY - pad, w - 80, totalBoxHeight, 20);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Render words with highlight on current spoken word
    lines.forEach((line, lIdx) => {
      const lineY = boxY + pad + lIdx * lineHeight;
      const lineWidth = ctx.measureText(line.text).width;

      if (isAr) {
        // RTL layout: first word is at the right edge
        let curX = (w + lineWidth) / 2;
        line.words.forEach((word, wIdx) => {
          const globalIdx = line.startIndex + wIdx;
          const wordWidth = ctx.measureText(word + ' ').width;

          if (globalIdx === activeWordIndex) {
            ctx.fillStyle = '#a3e635';
            ctx.font = `900 29px 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif`;
            ctx.fillText(word, curX - wordWidth / 2, lineY);
          } else if (globalIdx < activeWordIndex) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `700 27px 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif`;
            ctx.fillText(word, curX - wordWidth / 2, lineY);
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.font = `600 27px 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif`;
            ctx.fillText(word, curX - wordWidth / 2, lineY);
          }

          curX -= wordWidth;
        });
      } else {
        // LTR layout
        let curX = (w - lineWidth) / 2;
        line.words.forEach((word, wIdx) => {
          const globalIdx = line.startIndex + wIdx;
          const wordWidth = ctx.measureText(word + ' ').width;

          if (globalIdx === activeWordIndex) {
            ctx.fillStyle = '#a3e635';
            ctx.font = '900 30px system-ui, -apple-system, sans-serif';
            ctx.fillText(word, curX + wordWidth / 2, lineY);
          } else if (globalIdx < activeWordIndex) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 28px system-ui, -apple-system, sans-serif';
            ctx.fillText(word, curX + wordWidth / 2, lineY);
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.font = '600 28px system-ui, -apple-system, sans-serif';
            ctx.fillText(word, curX + wordWidth / 2, lineY);
          }

          curX += wordWidth;
        });
      }
    });

    ctx.restore();
  }

  private drawAudioWave(t: number) {
    const ctx = this.ctx;
    const w = this.width;
    const waveY = 1140;
    const numBars = 28;
    const barW = 6;
    const gap = 8;
    const totalW = numBars * (barW + gap) - gap;
    const startX = (w - totalW) / 2;

    ctx.save();
    for (let i = 0; i < numBars; i++) {
      const height = Math.abs(Math.sin(t * 8 + i * 0.4)) * 36 + 8;
      const x = startX + i * (barW + gap);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      this.drawRoundedRect(ctx, x, waveY - height / 2, barW, height, 3);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
