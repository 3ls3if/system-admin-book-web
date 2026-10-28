/**
 * CYBERPUNK MUSIC PLAYER & SYNTH ENGINE
 * Plays curated Cyberpunk / Synthwave streams and features a built-in
 * procedural Web Audio synth engine for infinite offline cyberpunk music.
 */

class CyberMusicPlayer {
  constructor() {
    this.playlist = window.CYBER_CONFIG.playlist || [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.volume = parseFloat(localStorage.getItem('cyber_music_volume') || '0.5');

    // Procedural Synth State
    this.synthCtx = null;
    this.synthInterval = null;
    this.synthGain = null;
    this.synthArpIndex = 0;

    // Visualizer State
    this.visualizerCanvas = null;
    this.visualizerCtx = null;
    this.analyser = null;
    this.audioSourceNode = null;
    this.animFrameId = null;

    this.initAudioElement();
  }

  initAudioElement() {
    this.audioElement.volume = this.volume;

    this.audioElement.addEventListener('ended', () => {
      this.next();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio stream error, falling back or advancing:', e);
      // If stream has an issue, gracefully advance or notify
      if (this.isPlaying) {
        this.next();
      }
    });
  }

  getCurrentTrack() {
    return this.playlist[this.currentIndex];
  }

  play() {
    const track = this.getCurrentTrack();
    this.isPlaying = true;

    if (track.type === 'synth') {
      this.audioElement.pause();
      this.startProceduralSynth();
    } else {
      this.stopProceduralSynth();
      if (this.audioElement.src !== track.url) {
        this.audioElement.src = track.url;
      }
      this.audioElement.play().catch(err => {
        console.warn('Audio play autoplay policy or error:', err);
      });
      this.connectVisualizerNode(this.audioElement);
    }

    this.updateUI();
    this.startVisualizer();
  }

  pause() {
    this.isPlaying = false;
    this.audioElement.pause();
    this.stopProceduralSynth();
    this.updateUI();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  next() {
    const wasPlaying = this.isPlaying;
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    if (wasPlaying) {
      this.play();
    } else {
      this.updateUI();
    }
  }

  prev() {
    const wasPlaying = this.isPlaying;
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    if (wasPlaying) {
      this.play();
    } else {
      this.updateUI();
    }
  }

  selectTrack(index) {
    if (index >= 0 && index < this.playlist.length) {
      this.currentIndex = index;
      this.play();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    this.audioElement.volume = this.volume;
    if (this.synthGain && this.synthCtx) {
      this.synthGain.gain.setValueAtTime(this.volume * 0.4, this.synthCtx.currentTime);
    }
    localStorage.setItem('cyber_music_volume', this.volume);
    const volSlider = document.getElementById('music-volume-slider');
    if (volSlider) volSlider.value = this.volume;
  }

  /* ================= PROCEDURAL SYNTH ENGINE ================= */
  initSynthContext() {
    if (!this.synthCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.synthCtx = new AudioContext();

      this.analyser = this.synthCtx.createAnalyser();
      this.analyser.fftSize = 64;

      this.synthGain = this.synthCtx.createGain();
      this.synthGain.gain.setValueAtTime(this.volume * 0.4, this.synthCtx.currentTime);

      this.synthGain.connect(this.analyser);
      this.analyser.connect(this.synthCtx.destination);
    }
    if (this.synthCtx.state === 'suspended') {
      this.synthCtx.resume();
    }
  }

  startProceduralSynth() {
    this.initSynthContext();
    if (this.synthInterval) clearInterval(this.synthInterval);

    // Chords in D minor Cyber Scale: Dm, Bb, F, C
    const chordProgressions = [
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [116.54, 146.83, 174.61, 233.08], // BbMaj7
      [130.81, 164.81, 196.00, 261.63], // F
      [130.81, 164.81, 196.00, 246.94]  // C / Em
    ];

    let chordStep = 0;
    let stepCount = 0;

    // Arpeggiator note trigger function
    const playNote = () => {
      if (!this.isPlaying || !this.synthCtx) return;
      const t = this.synthCtx.currentTime;
      const currentChord = chordProgressions[chordStep];
      const noteFreq = currentChord[this.synthArpIndex % currentChord.length];

      // Bass note on every 4th 16th-beat
      if (stepCount % 4 === 0) {
        const bassOsc = this.synthCtx.createOscillator();
        const bassFilter = this.synthCtx.createBiquadFilter();
        const bassGain = this.synthCtx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(currentChord[0] / 2, t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(280, t);
        bassFilter.frequency.exponentialRampToValueAtTime(100, t + 0.35);

        bassGain.gain.setValueAtTime(0.3, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.synthGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.4);
      }

      // Lead Synth Note (80s Cyber Arp)
      const leadOsc = this.synthCtx.createOscillator();
      const leadFilter = this.synthCtx.createBiquadFilter();
      const leadGain = this.synthCtx.createGain();

      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(noteFreq * 2, t);

      leadFilter.type = 'lowpass';
      leadFilter.frequency.setValueAtTime(1600 + Math.sin(stepCount * 0.2) * 800, t);
      leadFilter.Q.setValueAtTime(4, t);

      leadGain.gain.setValueAtTime(0.18, t);
      leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      leadOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(this.synthGain);

      leadOsc.start(t);
      leadOsc.stop(t + 0.2);

      this.synthArpIndex = (this.synthArpIndex + 1) % 4;
      stepCount++;
      if (stepCount % 16 === 0) {
        chordStep = (chordStep + 1) % chordProgressions.length;
      }
    };

    // 130 BPM = 115ms per 16th note
    this.synthInterval = setInterval(playNote, 120);
  }

  stopProceduralSynth() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  /* ================= AUDIO SPECTRUM VISUALIZER ================= */
  connectVisualizerNode(audioEl) {
    if (!this.synthCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.synthCtx = new AudioContext();
    }
    if (!this.audioSourceNode && audioEl) {
      try {
        this.audioSourceNode = this.synthCtx.createMediaElementSource(audioEl);
        this.analyser = this.synthCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.audioSourceNode.connect(this.analyser);
        this.analyser.connect(this.synthCtx.destination);
      } catch (e) {
        // May already be connected or CORS restricted
      }
    }
  }

  startVisualizer() {
    this.visualizerCanvas = document.getElementById('music-visualizer');
    if (!this.visualizerCanvas) return;
    this.visualizerCtx = this.visualizerCanvas.getContext('2d');

    const render = () => {
      if (!this.visualizerCanvas || !this.visualizerCtx) return;
      const width = this.visualizerCanvas.width;
      const height = this.visualizerCanvas.height;

      this.visualizerCtx.clearRect(0, 0, width, height);

      const numBars = 16;
      const barWidth = width / numBars - 2;

      let dataArray = new Uint8Array(numBars);

      if (this.isPlaying && this.analyser) {
        try {
          const buffer = new Uint8Array(this.analyser.frequencyBinCount);
          this.analyser.getByteFrequencyData(buffer);
          for (let i = 0; i < numBars; i++) {
            dataArray[i] = buffer[i * 2] || 0;
          }
        } catch (e) {
          // Synthetic visualizer if CORS restricts Web Audio node
          for (let i = 0; i < numBars; i++) {
            dataArray[i] = Math.floor(Math.sin(Date.now() * 0.005 + i) * 60 + 80 + Math.random() * 40);
          }
        }
      } else if (this.isPlaying) {
        // Fallback animated simulation
        for (let i = 0; i < numBars; i++) {
          dataArray[i] = Math.floor(Math.sin(Date.now() * 0.007 + i * 0.5) * 50 + 70 + Math.random() * 30);
        }
      }

      for (let i = 0; i < numBars; i++) {
        const val = this.isPlaying ? Math.max(4, (dataArray[i] / 255) * height) : 3;
        const x = i * (barWidth + 2);
        const y = height - val;

        const grad = this.visualizerCtx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, 'var(--primary, #00f3ff)');
        grad.addColorStop(1, 'var(--secondary, #ff007f)');

        this.visualizerCtx.fillStyle = grad;
        this.visualizerCtx.fillRect(x, y, barWidth, val);
      }

      this.animFrameId = requestAnimationFrame(render);
    };

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    render();
  }

  updateUI() {
    const track = this.getCurrentTrack();
    const titleEl = document.getElementById('music-track-title');
    const artistEl = document.getElementById('music-track-artist');
    const tagEl = document.getElementById('music-track-tag');
    const playBtn = document.getElementById('music-btn-play');
    const selectEl = document.getElementById('music-track-select');

    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;
    if (tagEl) tagEl.textContent = track.tag;
    if (selectEl) selectEl.value = this.currentIndex;

    if (playBtn) {
      playBtn.innerHTML = this.isPlaying
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      playBtn.title = this.isPlaying ? 'Pause Music' : 'Play Cyber Music';
    }

    const deckEl = document.getElementById('cyber-audio-deck');
    if (deckEl) {
      if (this.isPlaying) {
        deckEl.classList.add('playing');
      } else {
        deckEl.classList.remove('playing');
      }
    }
  }
}

window.cyberMusic = new CyberMusicPlayer();
