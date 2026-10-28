# ⚡ CYBER//SYSADMIN v2.0
### Futuristic Anime Cyberpunk Documentation & Knowledge Graph Web App

An awesome, high-performance static documentation viewer built specifically for **[3ls3if/sys-admin-book](https://github.com/3ls3if/sys-admin-book)**. It dynamically loads Markdown documentation directly from GitHub in realtime, renders GitBook features, visualizes document connections in an **Obsidian-style Connected Knowledge Graph**, and immerses the reader in a **Cyberpunk Anime HUD** with multiple themes and a background cyberpunk synthwave music player.

Designed to be hosted 100% free on **GitHub Pages** with zero build steps (pure HTML5, CSS3, and JavaScript).


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


