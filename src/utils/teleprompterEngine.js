/**
 * TeleVideo Studio - 2D Canvas Engine
 * Handles rendering backgrounds, teleprompter scroll animations, kinetic typography, and overlays.
 */

// Helper to split text into wrapped lines based on canvas max width
export function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// Universal rounded rectangle renderer (supports browser Canvas and node-canvas Cairo backend)
export function drawRoundedRect(ctx, x, y, width, height, radius = 0) {
  const r = Math.max(0, Math.min(Number(radius) || 0, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

// Particle system state for dynamic backgrounds
const particles = Array.from({ length: 30 }, () => ({
  x: Math.random(),
  y: Math.random(),
  radius: Math.random() * 4 + 2,
  speedX: (Math.random() - 0.5) * 0.001,
  speedY: (Math.random() - 0.5) * 0.001,
  alpha: Math.random() * 0.5 + 0.2
}));

export function renderTeleprompterCanvas(ctx, options) {
  const {
    width,
    height,
    scriptText,
    progress = 0, // 0 to 1
    currentTime = 0,
    aspectRatio = '9:16',
    
    // Teleprompter Config
    scrollMode = 'smooth-scroll', // 'smooth-scroll' | 'kinetic-words' | 'line-focus' | 'news-ticker'
    fontFamily = 'Inter',
    fontSize = 36,
    textColor = '#ffffff',
    highlightColor = '#f59e0b',
    activeLineBg = 'rgba(99, 102, 241, 0.25)',
    boxOpacity = 0.6,
    textPosition = 'center', // 'top' | 'center' | 'bottom'

    // Reading Focus Box Controls
    showReadingBox = true,
    boxScale = 1.0,
    boxWidthPercent = 90,
    boxBorderRadius = 16,
    boxBorderWidth = 2,
    
    // Background Config
    bgTheme = 'animated-gradient', // 'animated-gradient' | 'cyberpunk-grid' | 'dark-glass' | 'warm-sunset' | 'emerald-gold' | 'solid-color'
    solidBgColor = '#090b10',
    
    // Overlays
    showProgressBar = true,
    showAudioVisualizer = true,
    audioData = null, // Float32Array frequency data if available
    watermarkText = '@ReadLoudAndClear',
    showWatermark = true
  } = options;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // ----------------------------------------------------
  // 1. RENDER BACKGROUND
  // ----------------------------------------------------
  renderBackground(ctx, width, height, bgTheme, solidBgColor, currentTime);

  if (!scriptText || scriptText.trim().length === 0) {
    // Draw placeholder message
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = `600 ${fontSize * 0.8}px ${fontFamily}, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Paste your script to begin teleprompting...', width / 2, height / 2);
    ctx.restore();
    return;
  }

  // ----------------------------------------------------
  // 2. RENDER TELEPROMPTER CONTENT ACCORDING TO MODE
  // ----------------------------------------------------
  const paddingX = width * 0.08;
  const maxWidth = width - paddingX * 2;

  if (scrollMode === 'kinetic-words') {
    renderKineticWords(ctx, {
      width,
      height,
      scriptText,
      progress,
      fontFamily,
      fontSize,
      textColor,
      highlightColor,
      activeLineBg,
      textPosition,
      showReadingBox,
      boxScale,
      boxWidthPercent,
      boxBorderRadius,
      boxBorderWidth
    });
  } else if (scrollMode === 'line-focus') {
    renderLineFocus(ctx, {
      width,
      height,
      scriptText,
      progress,
      maxWidth,
      fontFamily,
      fontSize,
      textColor,
      highlightColor,
      activeLineBg,
      textPosition,
      showReadingBox,
      boxScale,
      boxWidthPercent,
      boxBorderRadius,
      boxBorderWidth
    });
  } else if (scrollMode === 'news-ticker') {
    renderNewsTicker(ctx, {
      width,
      height,
      scriptText,
      progress,
      fontFamily,
      fontSize,
      textColor,
      highlightColor,
      activeLineBg
    });
  } else {
    // Default: smooth-scroll
    renderSmoothScroll(ctx, {
      width,
      height,
      scriptText,
      progress,
      maxWidth,
      fontFamily,
      fontSize,
      textColor,
      highlightColor,
      activeLineBg,
      boxOpacity,
      textPosition,
      showReadingBox,
      boxScale,
      boxWidthPercent,
      boxBorderRadius,
      boxBorderWidth
    });
  }

  // ----------------------------------------------------
  // 3. RENDER OVERLAYS & ACCESSORIES
  // ----------------------------------------------------
  if (showAudioVisualizer) {
    renderAudioVisualizer(ctx, width, height, audioData, currentTime, highlightColor);
  }

  if (showProgressBar) {
    renderProgressBar(ctx, width, height, progress, highlightColor);
  }

  if (showWatermark && watermarkText) {
    renderWatermark(ctx, width, height, watermarkText, fontFamily);
  }
}

// Background Renderer
function renderBackground(ctx, width, height, theme, solidColor, time) {
  ctx.save();

  if (theme === 'solid-color') {
    ctx.fillStyle = solidColor;
    ctx.fillRect(0, 0, width, height);
  } else if (theme === 'cyberpunk-grid') {
    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(width / 2, height * 0.4, 10, width / 2, height * 0.4, width * 0.8);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
    gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.15)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (theme === 'warm-sunset') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1f091c');
    grad.addColorStop(0.5, '#4a154b');
    grad.addColorStop(1, '#8c2443');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const sunGrad = ctx.createRadialGradient(width / 2, height * 0.35, 20, width / 2, height * 0.35, width * 0.5);
    sunGrad.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, height);
  } else if (theme === 'emerald-gold') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#041612');
    grad.addColorStop(0.5, '#092d24');
    grad.addColorStop(1, '#051813');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    particles.forEach(p => {
      p.x = (p.x + p.speedX) % 1;
      p.y = (p.y + p.speedY) % 1;
      if (p.x < 0) p.x += 1;
      if (p.y < 0) p.y += 1;
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (theme === 'dark-glass') {
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    const angle = time * 0.3;
    const cx1 = width * 0.3 + Math.sin(angle) * 80;
    const cy1 = height * 0.3 + Math.cos(angle) * 80;
    const grad1 = ctx.createRadialGradient(cx1, cy1, 10, cx1, cy1, width * 0.6);
    grad1.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Default: 'animated-gradient'
    const angle = time * 0.2;
    const x1 = Math.cos(angle) * width;
    const y1 = Math.sin(angle) * height;
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0a0d18');
    grad.addColorStop(0.4, '#171a2e');
    grad.addColorStop(0.8, '#1e1b36');
    grad.addColorStop(1, '#0c0f1d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const blob1X = width * 0.5 + Math.sin(time * 0.5) * width * 0.25;
    const blob1Y = height * 0.4 + Math.cos(time * 0.7) * height * 0.2;
    const grad1 = ctx.createRadialGradient(blob1X, blob1Y, 10, blob1X, blob1Y, width * 0.5);
    grad1.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

// Mode 1: Smooth Vertical Teleprompter Scroll
function renderSmoothScroll(ctx, config) {
  const {
    width,
    height,
    scriptText,
    progress,
    maxWidth,
    fontFamily,
    fontSize,
    textColor,
    highlightColor,
    activeLineBg,
    boxOpacity,
    textPosition,
    showReadingBox = true,
    boxScale = 1.0,
    boxWidthPercent = 90,
    boxBorderRadius = 16,
    boxBorderWidth = 2
  } = config;

  ctx.save();
  ctx.font = `700 ${fontSize}px ${fontFamily}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const paragraphs = scriptText.split('\n');
  let allLines = [];
  paragraphs.forEach(p => {
    if (p.trim() === '') {
      allLines.push('');
    } else {
      const wrapped = wrapText(ctx, p.trim(), maxWidth);
      allLines.push(...wrapped);
    }
  });

  const lineHeight = fontSize * 1.55;
  const totalContentHeight = allLines.length * lineHeight;
  
  let targetCenterY = height / 2;
  if (textPosition === 'top') targetCenterY = height * 0.3;
  if (textPosition === 'bottom') targetCenterY = height * 0.7;

  const startY = targetCenterY + height * 0.2;
  const endY = targetCenterY - totalContentHeight - height * 0.2;
  const currentScrollY = startY + progress * (endY - startY);

  // Draw central Reading Guide Box (if enabled)
  if (showReadingBox) {
    const boxHeight = lineHeight * 1.4 * boxScale;
    const boxWidth = width * (boxWidthPercent / 100);
    const boxX = (width - boxWidth) / 2;

    ctx.fillStyle = activeLineBg;
    drawRoundedRect(ctx, boxX, targetCenterY - boxHeight / 2, boxWidth, boxHeight, boxBorderRadius);
    ctx.fill();

    if (boxBorderWidth > 0) {
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = boxBorderWidth;
      ctx.stroke();
    }
  }

  // Draw Lines
  allLines.forEach((line, index) => {
    const lineY = currentScrollY + index * lineHeight;

    if (lineY > -50 && lineY < height + 50) {
      const distFromCenter = Math.abs(lineY - targetCenterY);
      const isCentered = distFromCenter < lineHeight * 0.6;

      if (isCentered) {
        ctx.fillStyle = highlightColor;
        ctx.font = `800 ${fontSize * 1.06}px ${fontFamily}, sans-serif`;
        // Dark drop shadow for crisp readability without washed-out white bloom
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
      } else {
        const opacity = Math.max(0.2, 1 - distFromCenter / (height * 0.45));
        ctx.fillStyle = textColor;
        ctx.font = `700 ${fontSize}px ${fontFamily}, sans-serif`;
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = opacity;
      }

      ctx.fillText(line, width / 2, lineY);
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
  });

  ctx.restore();
}

// Mode 2: Kinetic Words (Hormozi / Viral Shorts Pop Style)
function renderKineticWords(ctx, config) {
  const {
    width,
    height,
    scriptText,
    progress,
    fontFamily,
    fontSize,
    textColor,
    highlightColor,
    activeLineBg,
    textPosition
  } = config;

  ctx.save();

  const words = scriptText.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return;

  const currentWordIndex = Math.min(
    words.length - 1,
    Math.floor(progress * words.length)
  );

  const chunkSize = 3;
  const currentChunkIndex = Math.floor(currentWordIndex / chunkSize);
  const chunkStart = currentChunkIndex * chunkSize;
  const chunkWords = words.slice(chunkStart, chunkStart + chunkSize);

  const activeInChunk = currentWordIndex - chunkStart;

  let centerY = height * 0.5;
  if (textPosition === 'top') centerY = height * 0.35;
  if (textPosition === 'bottom') centerY = height * 0.65;

  const bigFontSize = Math.max(42, fontSize * 1.4);
  ctx.font = `900 ${bigFontSize}px ${fontFamily}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let totalWidth = 0;
  const wordWidths = chunkWords.map(w => {
    const wWidth = ctx.measureText(w.toUpperCase()).width;
    totalWidth += wWidth;
    return wWidth;
  });

  const gap = 16;
  totalWidth += gap * (chunkWords.length - 1);
  const maxWidth = width * 0.85;

  if (totalWidth < maxWidth) {
    let currentX = (width - totalWidth) / 2;

    chunkWords.forEach((word, idx) => {
      const wWidth = wordWidths[idx];
      const wordCenterX = currentX + wWidth / 2;
      const isActive = idx === activeInChunk;

      if (isActive) {
        ctx.fillStyle = highlightColor;
        drawRoundedRect(ctx, currentX - 10, centerY - bigFontSize * 0.65, wWidth + 20, bigFontSize * 1.3, 12);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = textColor;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
      }

      ctx.fillText(word.toUpperCase(), wordCenterX, centerY);
      currentX += wWidth + gap;
    });
  } else {
    const stackLineHeight = bigFontSize * 1.25;
    const startY = centerY - ((chunkWords.length - 1) * stackLineHeight) / 2;

    chunkWords.forEach((word, idx) => {
      const lineY = startY + idx * stackLineHeight;
      const isActive = idx === activeInChunk;
      const wWidth = ctx.measureText(word.toUpperCase()).width;

      if (isActive) {
        ctx.fillStyle = highlightColor;
        drawRoundedRect(ctx, width / 2 - wWidth / 2 - 14, lineY - bigFontSize * 0.6, wWidth + 28, bigFontSize * 1.2, 12);
        ctx.fill();

        ctx.fillStyle = '#000000';
      } else {
        ctx.fillStyle = textColor;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
      }

      ctx.fillText(word.toUpperCase(), width / 2, lineY);
    });
  }

  ctx.restore();
}

// Mode 3: Line Focus Teleprompter
function renderLineFocus(ctx, config) {
  const {
    width,
    height,
    scriptText,
    progress,
    maxWidth,
    fontFamily,
    fontSize,
    textColor,
    highlightColor,
    activeLineBg,
    textPosition,
    showReadingBox = true,
    boxScale = 1.0,
    boxWidthPercent = 90,
    boxBorderRadius = 16,
    boxBorderWidth = 2
  } = config;

  ctx.save();
  ctx.font = `700 ${fontSize}px ${fontFamily}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const paragraphs = scriptText.split('\n').filter(p => p.trim() !== '');
  let allLines = [];
  paragraphs.forEach(p => {
    allLines.push(...wrapText(ctx, p.trim(), maxWidth));
  });

  if (allLines.length === 0) return;

  const currentLineIndex = Math.min(
    allLines.length - 1,
    Math.floor(progress * allLines.length)
  );

  let centerY = height * 0.5;
  if (textPosition === 'top') centerY = height * 0.35;
  if (textPosition === 'bottom') centerY = height * 0.65;

  const lineHeight = fontSize * 1.6;

  // Active line highlight box (if enabled)
  if (showReadingBox) {
    const boxHeight = lineHeight * 1.35 * boxScale;
    const boxWidth = width * (boxWidthPercent / 100);
    const boxX = (width - boxWidth) / 2;

    ctx.fillStyle = activeLineBg;
    drawRoundedRect(ctx, boxX, centerY - boxHeight / 2, boxWidth, boxHeight, boxBorderRadius);
    ctx.fill();

    if (boxBorderWidth > 0) {
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = boxBorderWidth;
      ctx.stroke();
    }
  }

  // Render 5 visible lines around current index
  for (let offset = -2; offset <= 2; offset++) {
    const idx = currentLineIndex + offset;
    if (idx >= 0 && idx < allLines.length) {
      const lineY = centerY + offset * lineHeight;
      const isActive = offset === 0;

      if (isActive) {
        ctx.fillStyle = highlightColor;
        ctx.font = `800 ${fontSize * 1.1}px ${fontFamily}, sans-serif`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
      } else {
        ctx.font = `600 ${fontSize * 0.9}px ${fontFamily}, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = Math.max(0.15, 0.6 - Math.abs(offset) * 0.25);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.fillText(allLines[idx], width / 2, lineY);
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  ctx.restore();
}

// Mode 4: News Ticker Bottom Banner
function renderNewsTicker(ctx, config) {
  const {
    width,
    height,
    scriptText,
    progress,
    fontFamily,
    fontSize,
    textColor,
    highlightColor,
    activeLineBg
  } = config;

  ctx.save();

  const cleanText = scriptText.replace(/\n+/g, ' • ').trim();

  const bannerHeight = 80;
  const bannerY = height - bannerHeight - 40;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fillRect(0, bannerY, width, bannerHeight);

  ctx.fillStyle = highlightColor;
  ctx.fillRect(0, bannerY, width, 4);
  ctx.fillRect(0, bannerY + bannerHeight - 4, width, 4);

  ctx.fillStyle = highlightColor;
  ctx.fillRect(0, bannerY, 140, bannerHeight);
  ctx.fillStyle = '#000000';
  ctx.font = `900 16px ${fontFamily}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LIVE SCRIPT', 70, bannerY + bannerHeight / 2);

  ctx.save();
  ctx.beginPath();
  ctx.rect(140, bannerY, width - 140, bannerHeight);
  ctx.clip();

  ctx.font = `700 ${fontSize * 0.85}px ${fontFamily}, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';

  const textWidth = ctx.measureText(cleanText).width;
  const totalTravel = textWidth + width;
  const textX = width - progress * totalTravel;

  ctx.fillText(cleanText, textX, bannerY + bannerHeight / 2);
  ctx.restore();

  ctx.restore();
}

// Audio Visualizer Overlay
function renderAudioVisualizer(ctx, width, height, audioData, time, color) {
  ctx.save();
  const barCount = 32;
  const barWidth = (width * 0.6) / barCount;
  const startX = (width - barCount * barWidth) / 2;
  const bottomY = height - 24;

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5;

  for (let i = 0; i < barCount; i++) {
    let barHeight = 6;
    if (audioData && audioData.length > i) {
      barHeight = Math.max(4, audioData[i] * 40);
    } else {
      const phase = time * 4 + i * 0.3;
      barHeight = 4 + Math.sin(phase) * 12 + Math.cos(phase * 1.5) * 8;
    }

    const x = startX + i * barWidth;
    ctx.fillRect(x, bottomY - barHeight, barWidth - 3, barHeight);
  }
  ctx.restore();
}

// Progress Bar Overlay
function renderProgressBar(ctx, width, height, progress, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(0, 0, width, 5);

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width * Math.min(1, Math.max(0, progress)), 5);

  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillRect(width * progress - 4, 0, 4, 5);
  ctx.restore();
}

// Watermark Tag Overlay
function renderWatermark(ctx, width, height, text, fontFamily) {
  ctx.save();
  ctx.font = `600 14px ${fontFamily}, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(text, width - 20, 16);
  ctx.restore();
}
