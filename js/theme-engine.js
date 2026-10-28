/**
 * CYBERPUNK THEME ENGINE & CANVAS BACKGROUND
 * Controls themes, CRT scanlines, and animated Cyber Grid / Matrix canvas.
 */

class CyberThemeEngine {
  constructor() {
    this.themes = window.CYBER_CONFIG.themes || [];
    this.currentTheme = localStorage.getItem('cyber_theme') || 'neo-tokyo';
    this.scanlinesEnabled = localStorage.getItem('cyber_scanlines') !== 'false';
    this.canvasEnabled = localStorage.getItem('cyber_canvas_anim') !== 'false';

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

    // Update Theme Selector Dropdown / HUD
    const select = document.getElementById('theme-selector');
    if (select) select.value = theme.id;

    if (window.cyberI18n) {
      window.cyberI18n.updateStaticUI();
    }

    if (playSfx && window.cyberSFX) {
      window.cyberSFX.playConfirm();
    }

    // Re-seed canvas colors if needed
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

  /* ================= CYBER BACKGROUND CANVAS ================= */
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
    const count = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 25000));
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2
      });
    }
  }

  startCanvasAnimation() {
    const render = () => {
      if (!this.canvas || !this.ctx || !this.canvasEnabled) return;
      const w = this.canvas.width;
      const h = this.canvas.height;

      this.ctx.clearRect(0, 0, w, h);

      // Check current theme colors
      const isMatrix = this.currentTheme === 'matrix-netrunner';
      const isArasaka = this.currentTheme === 'arasaka-corpo';
      const isGhost = this.currentTheme === 'ghost-shell';
      const isSynthwave = this.currentTheme === 'synthwave-sunset';
      const isAhom = this.currentTheme === 'ahom-warrior';

      let nodeColor = 'rgba(0, 243, 255, '; // default cyan
      let lineColor = 'rgba(0, 243, 255, 0.04)';

      if (isAhom) {
        nodeColor = 'rgba(255, 183, 0, '; // Royal Muga Gold
        lineColor = 'rgba(255, 23, 68, 0.06)'; // Imperial Crimson
      } else if (isMatrix) {
        nodeColor = 'rgba(0, 255, 102, ';
        lineColor = 'rgba(0, 255, 102, 0.05)';
      } else if (isArasaka) {
        nodeColor = 'rgba(255, 0, 60, ';
        lineColor = 'rgba(255, 0, 60, 0.04)';
      } else if (isGhost) {
        nodeColor = 'rgba(0, 180, 216, ';
        lineColor = 'rgba(0, 180, 216, 0.05)';
      } else if (isSynthwave) {
        nodeColor = 'rgba(255, 94, 0, ';
        lineColor = 'rgba(181, 23, 158, 0.04)';
      }

      // Draw subtle cyber grid in horizon
      this.ctx.strokeStyle = lineColor;
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

      // Update and draw floating cyber data nodes
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        if (isAhom && i % 2 === 0) {
          this.ctx.fillStyle = `rgba(255, 23, 68, ${p.alpha * 0.9})`;
        } else {
          this.ctx.fillStyle = `${nodeColor}${p.alpha})`;
        }
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, isAhom ? p.size * 1.2 : p.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const edgeAlpha = (1 - dist / 120) * 0.15;
            this.ctx.strokeStyle = `${nodeColor}${edgeAlpha})`;
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
    const select = document.getElementById('theme-selector');
    if (select) {
      select.addEventListener('change', (e) => {
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
