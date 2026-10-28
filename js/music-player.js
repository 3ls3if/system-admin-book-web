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

    // Start with a lower ambient volume initially (default 0.20 / 20%)
    let savedVol = localStorage.getItem('cyber_music_volume');
    if (!savedVol || parseFloat(savedVol) > 0.35) {
      savedVol = '0.20';
      localStorage.setItem('cyber_music_volume', savedVol);
    }
    this.volume = parseFloat(savedVol);

    // Procedural Synth State
    this.synthCtx = null;
    this.synthInterval = null;
    this.synthGain = null;
    this.synthArpIndex = 0;
    this.ahomDroneOsc1 = null;
    this.ahomDroneOsc2 = null;

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
      this.stopProceduralSynth();
      this.startProceduralSynth();
    } else if (track.type === 'ahom-synth') {
      this.audioElement.pause();
      this.stopProceduralSynth();
      this.startAhomSynth();
    } else {
      this.stopProceduralSynth();
      if (this.audioElement.src !== track.url) {
        this.audioElement.src = track.url;
      }
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Audio play autoplay policy or error:', err);
        });
      }
      this.connectVisualizerNode(this.audioElement);
    }

    this.updateUI();
    this.startVisualizer();
  }

  initAutoplay() {
    // Attempt automatic playback at lower initial volume (0.20)
    setTimeout(() => {
      try {
        const track = this.getCurrentTrack();
        if (track.type === 'synth' || track.type === 'ahom-synth') {
          // For web audio, context needs resume on interaction if blocked
          this.play();
        } else {
          const promise = this.audioElement.play();
          if (promise !== undefined) {
            promise.then(() => {
              this.isPlaying = true;
              this.updateUI();
              this.startVisualizer();
            }).catch(() => {
              this.armAutoplayUnlock();
            });
          }
        }
      } catch (e) {
        this.armAutoplayUnlock();
      }
    }, 600);
  }

  armAutoplayUnlock() {
    const unlock = () => {
      ['click', 'keydown', 'scroll', 'touchstart', 'pointerdown'].forEach(evt => {
        window.removeEventListener(evt, unlock, { capture: true });
      });
      if (!this.isPlaying) {
        try {
          this.play();
        } catch (err) {
          console.warn('Playback on user gesture failed:', err);
        }
      }
    };

    ['click', 'keydown', 'scroll', 'touchstart', 'pointerdown'].forEach(evt => {
      window.addEventListener(evt, unlock, { capture: true, once: true });
    });
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

  /* ================= AHOM WARRIOR CYBER SYNTH ================= */
  startAhomSynth() {
    this.initSynthContext();
    if (this.synthInterval) clearInterval(this.synthInterval);
    if (this.ahomDroneOsc1) {
      try { this.ahomDroneOsc1.stop(); } catch(e){}
      this.ahomDroneOsc1 = null;
    }
    if (this.ahomDroneOsc2) {
      try { this.ahomDroneOsc2.stop(); } catch(e){}
      this.ahomDroneOsc2 = null;
    }

    const t0 = this.synthCtx.currentTime;

    // Continuous Deep Brahmaputra War Drone
    const droneGain = this.synthCtx.createGain();
    droneGain.gain.setValueAtTime(0.12, t0);
    droneGain.connect(this.synthGain);

    const droneFilter = this.synthCtx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(140, t0);
    droneFilter.connect(droneGain);

    this.ahomDroneOsc1 = this.synthCtx.createOscillator();
    this.ahomDroneOsc1.type = 'sawtooth';
    this.ahomDroneOsc1.frequency.setValueAtTime(73.42, t0); // D2
    this.ahomDroneOsc1.connect(droneFilter);
    this.ahomDroneOsc1.start(t0);

    this.ahomDroneOsc2 = this.synthCtx.createOscillator();
    this.ahomDroneOsc2.type = 'triangle';
    this.ahomDroneOsc2.frequency.setValueAtTime(110.00, t0); // A2 (Fifth)
    this.ahomDroneOsc2.connect(droneFilter);
    this.ahomDroneOsc2.start(t0);

    // Martial Ahom Scale: D3, F3, G3, A3, C4, D4, E4, F4
    const ahomScale = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 329.63, 349.23];
    const ahomMotif = [0, 2, 3, 5, 3, 2, 0, 4, 3, 1, 0, 3, 5, 7, 5, 3];
    let step = 0;

    const playAhomBeat = () => {
      if (!this.isPlaying || !this.synthCtx) return;
      const t = this.synthCtx.currentTime;

      // 1. Ahom War Drum (Heavy low kick on beats 0, 4, 8, 12, with syncopated 10)
      if (step % 4 === 0 || step % 16 === 10) {
        const drumOsc = this.synthCtx.createOscillator();
        const drumGain = this.synthCtx.createGain();

        drumOsc.type = 'sine';
        drumOsc.frequency.setValueAtTime(step % 16 === 0 ? 140 : 110, t);
        drumOsc.frequency.exponentialRampToValueAtTime(32, t + 0.28);

        drumGain.gain.setValueAtTime(0.4, t);
        drumGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        drumOsc.connect(drumGain);
        drumGain.connect(this.synthGain);

        drumOsc.start(t);
        drumOsc.stop(t + 0.3);
      }

      // 2. Metallic Hengdang Blade clash / cyber hi-hat (on odd 16th beats)
      if (step % 2 === 1) {
        const bufferSize = Math.floor(this.synthCtx.sampleRate * 0.04);
        const noiseBuffer = this.synthCtx.createBuffer(1, bufferSize, this.synthCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const noise = this.synthCtx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = this.synthCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(6000, t);

        const noiseGain = this.synthCtx.createGain();
        noiseGain.gain.setValueAtTime(0.08, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.synthGain);

        noise.start(t);
        noise.stop(t + 0.05);
      }

      // 3. Cyber Hengdang Lead Synth (Heroic martial melody)
      const noteIdx = ahomMotif[step % ahomMotif.length];
      const freq = ahomScale[noteIdx % ahomScale.length];

      const leadOsc = this.synthCtx.createOscillator();
      const leadFilter = this.synthCtx.createBiquadFilter();
      const leadGain = this.synthCtx.createGain();

      leadOsc.type = 'sawtooth';
      leadOsc.frequency.setValueAtTime(freq, t);

      leadFilter.type = 'lowpass';
      leadFilter.frequency.setValueAtTime(1400 + Math.sin(step * 0.4) * 600, t);
      leadFilter.Q.setValueAtTime(5, t);

      leadGain.gain.setValueAtTime(0.16, t);
      leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      leadOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(this.synthGain);

      leadOsc.start(t);
      leadOsc.stop(t + 0.24);

      step++;
    };

    // 124 BPM = ~121ms per 16th note
    this.synthInterval = setInterval(playAhomBeat, 121);
  }

  stopProceduralSynth() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.ahomDroneOsc1) {
      try { this.ahomDroneOsc1.stop(); } catch(e){}
      this.ahomDroneOsc1 = null;
    }
    if (this.ahomDroneOsc2) {
      try { this.ahomDroneOsc2.stop(); } catch(e){}
      this.ahomDroneOsc2 = null;
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
