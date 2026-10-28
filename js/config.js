/**
 * CYBERPUNK SYSADMIN DOCS ENGINE - CONFIGURATION
 * Central configuration for GitHub repository data, themes, and audio player.
 */

window.CYBER_CONFIG = {
  // Target GitHub Repository containing Markdown docs
  github: {
    owner: '3ls3if',
    repo: 'sys-admin-book',
    branch: 'main',
    summaryFile: 'SUMMARY.md',
    // Fallback files bundled in repository
    fallbackSummaryUrl: 'assets/fallback-summary.md',
    fallbackJsonUrl: 'assets/fallback-summary.json',
    // Raw base URL generator
    getRawBaseUrl: function() {
      return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/`;
    },
    // File view URL generator
    getGitHubFileUrl: function(path) {
      return `https://github.com/${this.owner}/${this.repo}/blob/${this.branch}/${path}`;
    }
  },

  // Cyberpunk Anime Themes
  themes: [
    {
      id: 'neo-tokyo',
      name: 'Neo Tokyo (Cyber Neon)',
      description: 'Electric Cyan & Hot Pink / Magenta',
      primary: '#00f3ff',
      secondary: '#ff007f',
      accent: '#ffe600',
      bgDark: '#080a12',
      bgCard: '#0f1424'
    },
    {
      id: 'matrix-netrunner',
      name: 'Matrix Netrunner (Hacker Green)',
      description: 'Phosphor Green & Terminal Emerald',
      primary: '#00ff66',
      secondary: '#00cc44',
      accent: '#aaff00',
      bgDark: '#040805',
      bgCard: '#08120a'
    },
    {
      id: 'arasaka-corpo',
      name: 'Arasaka Corpo (Blood Neon)',
      description: 'Cyber Crimson & Radiant Amber',
      primary: '#ff003c',
      secondary: '#ff8800',
      accent: '#ffd700',
      bgDark: '#0d090a',
      bgCard: '#1a1012'
    },
    {
      id: 'ghost-shell',
      name: 'Ghost in the Shell (Kusanagi Blue)',
      description: 'Tactical Cobalt & Ice Cerulean',
      primary: '#00b4d8',
      secondary: '#7209b7',
      accent: '#90e0ef',
      bgDark: '#060a17',
      bgCard: '#0d162e'
    },
    {
      id: 'synthwave-sunset',
      name: 'Synthwave 80s (Retro Sunset)',
      description: 'Sunset Orange, Purple & Fuchsia',
      primary: '#ff5e00',
      secondary: '#b5179e',
      accent: '#7209b7',
      bgDark: '#0f0817',
      bgCard: '#1f0d2e'
    }
  ],

  // Cyberpunk Audio Deck Playlist
  playlist: [
    {
      id: 'procedural-synth',
      title: 'Neural Cyber-Synth (Procedural)',
      artist: 'AI Web Audio Synthesizer',
      type: 'synth', // Generated dynamically via Web Audio API, works 100% offline!
      duration: 'Infinite ∞',
      tag: 'REALTIME SYNTH'
    },
    {
      id: 'cyberpunk-future',
      title: 'Cyberpunk Future',
      artist: 'Sound Gallery',
      type: 'stream',
      url: 'https://archive.org/download/jamendo-547905/01-2130771-Sound Gallery by Dmitry Taras-Cyberpunk Future.mp3',
      duration: '2:45',
      tag: 'DARK SYNTH'
    },
    {
      id: 'cyberpunk-dynamic',
      title: 'Cyberpunk Dynamic Beats',
      artist: 'AlexZavesa',
      type: 'stream',
      url: 'https://archive.org/download/jamendo-454845/01-1885395-AlexZavesa-Cyberpunk Dynamic _Main Version_.mp3',
      duration: '2:15',
      tag: 'ANIME ACTION'
    },
    {
      id: 'dreamscape',
      title: 'Dreamscape Synthwave',
      artist: 'Moonwalk',
      type: 'stream',
      url: 'https://archive.org/download/jamendo-526070/01-2037555-Moonwalk-Dreamscape _Synthwave cinematic_.mp3',
      duration: '3:10',
      tag: 'RETROWAVE'
    },
    {
      id: 'runner-2049',
      title: '2049 Blade Runner Tribute',
      artist: 'GH0ST // RERUN',
      type: 'stream',
      url: 'https://archive.org/download/ghost-rerun-cyberwitch-ep/05%20-%202049.mp3',
      duration: '3:47',
      tag: 'AMBIENT CYBER'
    },
    {
      id: 'nightwave-plaza',
      title: 'Nightwave Plaza Live 24/7',
      artist: 'Global Cyber Radio',
      type: 'stream',
      url: 'https://radio.plaza.one/mp3',
      duration: 'LIVE 24/7',
      tag: 'VAPORWAVE RADIO'
    }
  ],

  // Category Color Palette for Knowledge Graph & Badges
  categoryColors: {
    'Tech Consultancy': '#00f3ff',
    'Hardware/Physical Machines': '#ffb000',
    'System Configuration': '#00ff66',
    'Windows Server': '#00d0ff',
    'Linux Servers': '#ffaa00',
    'Containers': '#00ffa6',
    'Control Panels': '#ff007f',
    'Virtualization': '#b5179e',
    'Web Servers and WAFs': '#ff003c',
    'VPNs and Proxy Servers': '#4cc9f0',
    'Database Servers': '#f72585',
    'CDN Servers': '#7209b7',
    'Web Dev Stacks': '#3a0ca3',
    'IT Ticketing Systems': '#4361ee',
    'AWS Environment': '#ff9900',
    'Git/GitHub': '#f05032',
    'Azure Environment': '#0078d4',
    'Backup and Security': '#ff0055',
    'Email and Office 365': '#d83b01',
    'Firewalls and Access Points': '#e63946',
    'Networking': '#2a9d8f',
    'Migration': '#e76f51',
    'Monitoring': '#80ed99',
    'Data Center': '#57cc99',
    'IT Auditing': '#38b000',
    'Load Balancers': '#0077b6',
    'Other Technologies': '#9d4edd',
    'Certifications': '#ffd166',
    'General': '#00f3ff'
  }
};
