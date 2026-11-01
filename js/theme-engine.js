/**
 * CYBERPUNK THEME ENGINE & AMBIENT CANVAS BACKGROUND
 * Default: Permanent Neo-Tokyo Night Cyberpunk Wallpaper
 * Overlay: Subtle Animated Neural Grid & Laser Data Nodes
 * Supports all 6 Cyberpunk Anime Themes & CRT Scanlines.
 */

class CyberThemeEngine {
  constructor() {
    this.themes = window.CYBER_CONFIG.themes || [];
    this.currentTheme = localStorage.getItem('cyber_theme') || 'neo-tokyo';
    this.scanlinesEnabled = localStorage.getItem('cyber_scanlines') !== 'false';
    this.canvasEnabled = true;

    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.particles = [];
  }

  init() {
    this.applyTheme(this.currentTheme, false);
    this.applyScanlines(this.scanlinesEnabled);
    this.initCanvasBackground();
    this.initEventListeners();
  }

  applyTheme(themeId, playSfx = true) {
    const theme = this.themes.find(t => t.id === themeId) || this.themes[0];
    this.currentTheme = theme.id;
    document.documentElement.setAttribute('data-theme', theme.id);
    localStorage.setItem('cyber_theme', theme.id);

    const select = document.getElementById('theme-selector');
    if (select) select.value = theme.id;

    if (window.cyberI18n) {
      window.cyberI18n.updateStaticUI();
    }

    if (playSfx && window.cyberSFX) {
      window.cyberSFX.playConfirm();
    }

    if (this.canvas) {
      this.initParticles();
    }
  }

  applyScanlines(enabled) {
    this.scanlinesEnabled = enabled;
    localStorage.setItem('cyber_scanlines', enabled);
    const overlay = document.getElementById('cyber-scanlines-overlay');
    if (overlay) {
      overlay.style.display = enabled ? 'block' : 'none';
    }
  }

  toggleScanlines() {
    this.applyScanlines(!this.scanlinesEnabled);
    if (window.cyberSFX) window.cyberSFX.playClick();
    return this.scanlinesEnabled;
  }

  /* ================= AMBIENT NEURAL CANVAS BACKGROUND ================= */
  initCanvasBackground() {
    this.canvas = document.getElementById('cyber-grid-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.initParticles();
    };

    window.addEventListener('resize', resize);
    resize();
    this.startCanvasAnimation();
  }

  initParticles() {
    this.particles = [];
    const w = this.canvas.width;
    const h = this.canvas.height;
    const count = Math.min(65, Math.floor((w * h) / 24000));

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.25
      });
    }
  }

  getThemeColors() {
    const isMatrix = this.currentTheme === 'matrix-netrunner';
    const isArasaka = this.currentTheme === 'arasaka-corpo';
    const isGhost = this.currentTheme === 'ghost-shell';
    const isSynthwave = this.currentTheme === 'synthwave-sunset';
    const isAhom = this.currentTheme === 'ahom-warrior';

    if (isAhom) {
      return { primary: '#ff1744', secondary: '#ffb700', rgb: '255, 183, 0', lineRgb: '255, 23, 68' };
    } else if (isMatrix) {
      return { primary: '#00ff66', secondary: '#00ffcc', rgb: '0, 255, 102', lineRgb: '0, 255, 102' };
    } else if (isArasaka) {
      return { primary: '#ff003c', secondary: '#ff7700', rgb: '255, 0, 60', lineRgb: '255, 0, 60' };
    } else if (isGhost) {
      return { primary: '#00b4d8', secondary: '#90e0ef', rgb: '0, 180, 216', lineRgb: '0, 180, 216' };
    } else if (isSynthwave) {
      return { primary: '#ff007f', secondary: '#00f3ff', rgb: '255, 0, 127', lineRgb: '181, 23, 158' };
    }
    // Default Neo Tokyo
    return { primary: '#00f3ff', secondary: '#ff007f', rgb: '0, 243, 255', lineRgb: '0, 243, 255' };
  }

  startCanvasAnimation() {
    const render = () => {
      if (!this.canvas || !this.ctx || !this.canvasEnabled) return;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const colors = this.getThemeColors();

      this.ctx.clearRect(0, 0, w, h);

      // Subtle Cyber Grid
      this.ctx.strokeStyle = `rgba(${colors.lineRgb}, 0.05)`;
      this.ctx.lineWidth = 1;
      const step = 80;
      for (let x = 0; x < w; x += step) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, h);
        this.ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(w, y);
        this.ctx.stroke();
      }

      // Floating Neural Data Nodes & Connecting Laser Vectors
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        this.ctx.fillStyle = `rgba(${colors.rgb}, ${p.alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();

        for (let j = i + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const edgeAlpha = (1 - dist / 120) * 0.22;
            this.ctx.strokeStyle = `rgba(${colors.rgb}, ${edgeAlpha})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
          }
        }
      }

      this.animId = requestAnimationFrame(render);
    };

    if (this.animId) cancelAnimationFrame(this.animId);
    render();
  }

  initEventListeners() {
    const themeSelect = document.getElementById('theme-selector');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.applyTheme(e.target.value, true);
      });
    }

    const scanBtn = document.getElementById('btn-toggle-scanlines');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => {
        this.toggleScanlines();
      });
    }
  }
}

window.cyberTheme = new CyberThemeEngine();
