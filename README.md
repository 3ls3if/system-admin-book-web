# ⚡ CYBER//SYSADMIN v2.0
### Futuristic Anime Cyberpunk Documentation & Knowledge Graph Web App

An awesome, high-performance static documentation viewer built specifically for **[3ls3if/sys-admin-book](https://github.com/3ls3if/sys-admin-book)**. It dynamically loads Markdown documentation directly from GitHub in realtime, renders GitBook features, visualizes document connections in an **Obsidian-style Connected Knowledge Graph**, and immerses the reader in a **Cyberpunk Anime HUD** with multiple themes and a background cyberpunk synthwave music player.

Designed to be hosted 100% free on **GitHub Pages** with zero build steps (pure HTML5, CSS3, and JavaScript).

---

## 🌟 Key Features

### 1. 🔄 Realtime Dynamic GitHub Loading
- **No rebuilds needed**: When you add, edit, or remove docs in `3ls3if/sys-admin-book` on GitHub, this website automatically loads the latest version dynamically via raw GitHub endpoints!
- **Dynamic `SUMMARY.md` Syncing**: Parses the table of contents and generates the entire navigation hierarchy on the fly.
- **Offline & Fallback Safety**: Includes a pre-bundled snapshot (`assets/fallback-summary.json`) so the site renders instantly even if GitHub API or connection is offline.
- **"SYNC GITHUB" Button**: Click the button in the top HUD anytime to flush cache and fetch fresh documents.

### 2. 🕸️ Connected Docs Knowledge Graph (Obsidian Style)
- Interactive force-directed network graph (press `G` or click **GRAPH VIEW**).
- Visualizes the 600+ documents and 30 category clusters with glowing cyber nodes.
- **Interactive Physics**: Zoom, pan, drag nodes, filter by category, or search for any doc.
- **Hover Intel Tooltip**: Highlights connected edges and displays file path, category, and connected node count.
- **Instant Jump**: Click any node in the graph to immediately navigate to that document.

### 3. 🎨 6 Cyberpunk Themes (Including Ahom Warrior of Assam)
Switch themes instantly from the top HUD dropdown (persisted in `localStorage`):
- **Ahom Dynasty (Cyber Warrior // অসম)**: Imperial Ahom Scarlet / Crimson (`#ff1744`), Royal Muga Silk Gold (`#ffb700`), and Brahmaputra Neon Jade (`#00f0aa`). Honors the historic 600-year unconquered Ahom Kingdom of Assam and General Lachit Borphukan's Battle of Saraighat (1671). Features golden victory sparks, glowing Hengdang sword motifs, and authentic Assamese cultural flair!
- **Neo Tokyo (Cyber Neon)**: Electric Cyan (`#00f3ff`) & Hot Pink Magenta (`#ff007f`).
- **Matrix Netrunner (Hacker Green)**: Phosphor Terminal Green (`#00ff66`) on Obsidian.
- **Arasaka Corpo (Blood Neon)**: Cyber Crimson (`#ff003c`) & Radiant Amber (`#ff8800`).
- **Ghost in the Shell (Kusanagi Indigo)**: Cerulean Tactical Blue (`#00b4d8`) & Deep Navy.
- **Synthwave Sunset (Retro 80s)**: Ultraviolet, sunset orange, and hot fuchsia.
- **CRT Scanlines**: Toggle vintage CRT monitor scanlines overlay with one click.
- **Cyber Grid Canvas**: Ambient animated cyber particle and grid network running at 60fps in the background with theme-aware particle physics.

### 4. 🌐 Multi-Language Translation (4 Languages)
Built-in neural translation engine allowing readers worldwide to localize the interface and all 600+ documentation blogs:
- **English (Default)**: Original neural documentation stream.
- **অসমীয়া (Assamese)**: Native Assamese language translation honoring the cultural roots of Assam.
- **中文 (Chinese)**: Simplified / Traditional Chinese localization for global readers.
- **日本語 (Japanese)**: Japanese localization for cyber-anime netrunners.
- **Dynamic Content Localizer**: Automatically translates headings, paragraphs, lists, and tables while strictly preserving code blocks (`<pre><code>`), syntax highlighting, and technical commands!
- **Quick English Toggle**: "SHOW ORIGINAL (EN)" button lets readers instantly compare or toggle back to English with zero latency.
- **Smart Local Storage Caching**: Translated documents are cached locally so revisited guides load instantaneously offline.

### 5. 🎵 Cyberpunk Audio Deck (13 Curated Tracks + Autoplay at Low Volume)
Includes an integrated cyber audio deck with ambient reading tracks and procedural web audio:
- **Automatic Ambient Start**: The music automatically starts at a comfortable lower ambient level (20% volume) so readers can immediately immerse into the blogs without being blasted with loud audio.
- **Track 1: Neural Cyber-Synth (Procedural)**: Generative Web Audio synthesizer engine playing infinite 80s D-minor arpeggios, sub-bass pulse, and filter sweeps—100% offline, zero buffering!
- **Track 2: Lachit Cyber-Hengdang // Ahom War Synth (Procedural)**: Custom-crafted martial Web Audio synthesizer track inspired by Ahom war drums, deep sub-bass drones, and heroic ancient-futuristic D-Phrygian arp melodies!
- **Track 3: The Synapse (Hong Kong Cyberpunk Streets)**: The legendary tech soundtrack by Alexander Brandon (Deus Ex).
- **Track 4: Night City**: From the Cyberpunk 2077 Original Soundtrack (R E L & Artemis Delta).
- **Track 5: I Really Want to Stay at Your House**: The iconic Cyberpunk: Edgerunners anthem (Rosa Walton).
- **Track 6: Battleground Arasaka**: High-intensity cyber combat beat (Marcin Przybyłowicz).
- **Track 7: Cyberpunk Future**: High-octane dark synth beat (Sound Gallery).
- **Track 8: Cyberpunk Dynamic Beats**: Fast anime action cyber track (AlexZavesa).
- **Track 9: Dreamscape Synthwave**: Warm retro 80s neon chill (Moonwalk).
- **Track 10: 2049 Blade Runner Tribute**: Atmospheric ambient cyber tension (GH0ST // RERUN).
- **Track 11: Dark Lonely Water (Cyber Witch)**: Haunting atmospheric cyber track (GH0ST // RERUN).
- **Track 12: Deus Ex Cyberpunk Main Title**: The classic cyber theme (Alexander Brandon).
- **Track 13: Nightwave Plaza Live 24/7**: 24/7 Vaporwave and Cyberpunk radio station.
- **Realtime Spectrum Visualizer**: Animated neon frequency bars reacting while music is playing.
- **Synthesized UI Sound FX (SFX)**: Web Audio anime HUD clicks, hover chimes, terminal blips, and bootup tones (toggleable on/off).

### 6. 📖 GitBook Markdown Compatibility
- GitBook Hints parsed into Cyberpunk HUD alert cards (`{% hint style="info" %}`, `{% hint style="warning" %}`, `{% hint style="danger" %}`, `{% hint style="success" %}`).
- Figures & Images (`<figure><img ...></figure>`) resolved to absolute GitHub raw URLs with click-to-zoom Lightbox modal.
- Internal relative markdown links (`[link](path.md)`) automatically converted into SPA hash routes (`#/path.md`).
- Syntax highlighting via Prism.js with custom Cyber HUD header and **Copy Code** button.
- Sticky **On-This-Page Table of Contents** with active scroll spy.
- Reading time calculation and word count stats.

### 7. 🔍 Fast Search & Bookmarks
- Instant fuzzy search across all 600+ doc titles and categories (`Ctrl+K` or `/`).
- Bookmark system to save favorite guides locally.
- Direct "OPEN IN GITHUB" button on every doc to jump straight to the source file for editing.

---

## 🚀 How to Host on GitHub Pages

### Step 1: Create a New GitHub Repository
1. Go to [GitHub](https://github.com/new) and create a new repository (e.g., `sys-admin-docs` or `sys-admin-book-website`).
2. Clone or push this repository directory to your new repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Cyberpunk SysAdmin Docs Website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

### Step 2: Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** > **Pages** (under Code and automation in the left sidebar).
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` branch, `/ (root)` folder.
   - Click **Save**.
4. That's it! In 1-2 minutes, GitHub Pages will give you your live URL:
   `https://<your-username>.github.io/<your-repo-name>/`

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` or `/` | Focus instant search |
| `G` | Toggle Connected Docs Knowledge Graph |
| `M` | Toggle Background Music Play / Pause |
| `[` | Toggle Sidebar open / close |
| `Esc` | Close modals, lightbox, or knowledge graph |

---

## 🛠️ Project Structure

```
├── index.html                  # Cyberpunk HUD Shell & CDN includes
├── README.md                   # Documentation & Deployment guide
├── .nojekyll                   # Disables Jekyll processing on GitHub Pages
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── css/
│   ├── cyberpunk-core.css      # Themes, variables, glowing effects, typography
│   ├── layout.css              # Header, Sidebar, Main Content, On-this-page ToC
│   ├── markdown.css            # Markdown styling, tables, code blocks, alerts
│   ├── graph.css               # Connected docs graph view styling & HUD modal
│   ├── music-player.css        # Cyber audio player, visualizer bars, equalizer
│   └── responsive.css          # Mobile / tablet responsive HUD styling
├── js/
│   ├── config.js               # Target GitHub repo config, themes, playlist
│   ├── sfx.js                  # Web Audio synthesized sci-fi sound effects
│   ├── music-player.js         # Cyberpunk audio player & procedural synth
│   ├── theme-engine.js         # 5 Cyberpunk Anime themes & canvas background
│   ├── github-service.js       # Dynamic GitHub fetcher (SUMMARY.md & raw docs)
│   ├── markdown-renderer.js    # Marked.js, GitBook tag parser, code copy & ToC
│   ├── nav-tree.js             # Parses SUMMARY.md into tree, search & bookmarks
│   ├── graph-view.js           # Obsidian-style Canvas force-directed graph
│   └── app.js                  # Main controller, router & keyboard shortcuts
└── assets/
    ├── fallback-summary.md     # Bundled snapshot of SUMMARY.md
    └── fallback-summary.json   # Pre-indexed JSON tree of 607 documents
```


