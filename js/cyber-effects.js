/**
 * CYBERPUNK ANIME SCI-FI HUD EFFECTS
 * - Title Decryption & Scramble Effect
 * - Realtime Cyber Clock (UTC & Local) & FPS / Memory Diagnostics
 * - Sci-fi Terminal Audio & Visual Accents
 */

class CyberScrambleEngine {
  constructor() {
    this.chars = '!<>-_\\/[]{}—=+*^?#________01010101XYZ';
  }

  scramble(element, targetText, duration = 450) {
    if (!element) return;
    const originalText = targetText || element.textContent;
    let iteration = 0;
    const totalFrames = Math.max(14, Math.floor(duration / 25));

    if (element._scrambleTimer) {
      clearInterval(element._scrambleTimer);
    }

    element._scrambleTimer = setInterval(() => {
      element.innerText = originalText
        .split('')
        .map((letter, index) => {
          if (index < iteration) {
            return originalText[index];
          }
          if (letter === ' ') return ' ';
          return this.chars[Math.floor(Math.random() * this.chars.length)];
        })
        .join('');

      iteration += originalText.length / totalFrames;

      if (iteration >= originalText.length) {
        element.innerText = originalText;
        clearInterval(element._scrambleTimer);
        element._scrambleTimer = null;
      }
    }, 25);
  }
}

class CyberDiagnosticsHUD {
  constructor() {
    this.fps = 60;
    this.frames = 0;
    this.lastTime = performance.now();
    this.isRunning = false;
  }

  init() {
    this.startClock();
    this.startFPSMeter();
  }

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');

      // Local Time
      const lH = pad(now.getHours());
      const lM = pad(now.getMinutes());
      const lS = pad(now.getSeconds());
      const localStr = `${lH}:${lM}:${lS}`;

      // UTC Time
      const uH = pad(now.getUTCHours());
      const uM = pad(now.getUTCMinutes());
      const uS = pad(now.getUTCSeconds());
      const utcStr = `UTC ${uH}:${uM}:${uS}`;

      const elLocal = document.getElementById('cyber-clock-local');
      const elUtc = document.getElementById('cyber-clock-utc');

      if (elLocal) elLocal.textContent = localStr;
      if (elUtc) elUtc.textContent = utcStr;
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  startFPSMeter() {
    const calcFPS = (now) => {
      this.frames++;
      if (now - this.lastTime >= 1000) {
        this.fps = Math.round((this.frames * 1000) / (now - this.lastTime));
        this.frames = 0;
        this.lastTime = now;

        const elFps = document.getElementById('cyber-fps-counter');
        if (elFps) {
          elFps.textContent = `${this.fps} FPS`;
          if (this.fps < 30) {
            elFps.style.color = '#ff003c';
          } else if (this.fps < 50) {
            elFps.style.color = '#ffb700';
          } else {
            elFps.style.color = '#00ff66';
          }
        }
      }
      requestAnimationFrame(calcFPS);
    };

    requestAnimationFrame(calcFPS);
  }
}

window.cyberScramble = new CyberScrambleEngine();
window.cyberDiagnostics = new CyberDiagnosticsHUD();

document.addEventListener('DOMContentLoaded', () => {
  window.cyberDiagnostics.init();
});
