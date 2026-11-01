# ⚡ CYBER//SYSADMIN v2.0
### Futuristic Anime Cyberpunk Documentation & Knowledge Graph Web App

An awesome, high-performance static documentation viewer built specifically for **[3ls3if/sys-admin-book](https://github.com/3ls3if/sys-admin-book)**. It dynamically loads Markdown documentation directly from GitHub in realtime, renders GitBook features, visualizes document connections in an **Obsidian-style Connected Knowledge Graph**, and immerses the reader in a **Cyberpunk Anime HUD** with multiple themes and a background cyberpunk synthwave music player.

Designed to be hosted 100% free on **GitHub Pages** with zero build steps (pure HTML5, CSS3, and JavaScript).


---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` or `/` | Focus instant search |
| `T` | Toggle Cyber Sysadmin Tools Deck |
| `G` | Toggle Connected Docs Knowledge Graph |
| `M` | Toggle Background Music Play / Pause |
| `[` | Toggle Sidebar open / close |
| `Esc` | Close modals, lightbox, or knowledge graph |

---

## ⚡ Cyber Sysadmin Tools Deck

The website now features a 100% client-side, zero-server Sysadmin Utilities suite accessible via the top HUD button or by pressing `T`:

1. **🌐 Live DNS over HTTPS (DoH) Explorer**: Realtime DNS record lookups (`A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `PTR`, `SRV`, `SOA`) via Cloudflare (`1.1.1.1`) and Google (`8.8.8.8`) with concurrent multi-record audits.
2. **💾 Storage & RAM Precision Converter**: Bi-directional conversions across Bytes, KB, MB, GB, TB, and PB. Highlights the discrepancy between drive manufacturer 1000-decimal vs Windows 1024-binary, includes Windows Pagefile Sizing recommendations and IOPS-to-throughput calculators.
3. **🖧 IPv4 Subnetting & Windows DHCP Scope Builder**: Visualizes CIDR prefixes, wildcard masks, usable host ranges, 32-bit network/host bit boundaries, and generates copy-ready Windows Server `Add-DhcpServerv4Scope` and `Add-DhcpServerv4ExclusionRange` PowerShell commands.
4. **📝 Cyber Admin Scratchpad & Direct Exporter**: In-browser monospace notepad that auto-saves to `localStorage`. Includes starter templates for PowerShell, Batch, and Registry fixes, with 1-click direct file downloads (`.txt`, `.ps1`, `.bat`, `.reg`).
5. **⚡ Interactive PowerShell Arsenal**: Dynamic parameter configurator built around scripts from the GitBook (Windows Server Security Audit, IIS Port 80/443 Log Parser, MS SQL Automated Backups, Server & TCP Health Monitor, M365 Guest User Cleaner, Robocopy Enterprise Migrator).
6. **🖧 Interactive Network & Virtual Infrastructure Builder**: Visual network architecture canvas with drag-and-drop components (Internet WAN, Cloud WAF, Edge Firewalls, VPN Gateways, Load Balancers, Reverse Proxies, Core L3 Switches, Windows IIS, Active Directory Domain Controllers, Linux App Servers, Kubernetes Clusters, MS SQL, PostgreSQL, SAN S2D Storage). Features animated neon pulse connectors, node inspector (IPs, zones, ports, status), pre-built topology templates (3-Tier Web App, Zero-Trust DMZ, Corporate AD LAN), and instant exports to **Mermaid.js Flowchart** code and **High-Resolution PNG** blueprints.

---

## 🌌 Cyberpunk HUD Visuals & Audio Deck

* **Neo-Tokyo Cyberpunk Aesthetic**: High-definition Neo-Tokyo Night backdrop with floating neural grid data nodes, custom neon color schemes across 6 switchable cyber themes (Neo-Tokyo, Ahom Kingdom, Netrunner Matrix, Arasaka Corpo, Ghost in Shell, Synthwave Sunset).
* **Text Decryption Scramble Engine**: Smooth sci-fi title scramble animation on document transitions.
* **Realtime Diagnostics HUD**: Live Local clock, UTC cyber clock, and FPS meter.
* **Sci-Fi Corner Brackets `[ + ]`**: High-tech chamfered accents across all HUD cards.

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
│   ├── tools.css               # Cyber Sysadmin Utilities Deck styling
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
│   ├── cyber-tools.js          # Client-side DNS, Subnet, Storage & PowerShell Tools
│   └── app.js                  # Main controller, router & keyboard shortcuts
└── assets/
    ├── fallback-summary.md     # Bundled snapshot of SUMMARY.md
    └── fallback-summary.json   # Pre-indexed JSON tree of 607 documents
```


