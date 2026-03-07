# 🌱 Damo's Garden

A garden journal from Northeast Scotland — built with [Hugo](https://gohugo.io/), deployed via GitHub Actions + FTP to Hostinger.

## 🚀 Quick Start

```bash
# Clone with submodules (for theme)
git clone --recurse-submodules https://github.com/DamoBird365/garden-site.git
cd garden-site

# Run locally
hugo server -D

# Build for production
hugo --minify
```

## ✍️ Creating a New Blog Post

```bash
hugo new blog/2026-03-15-my-post/index.md
```

This creates a new post with the garden-specific frontmatter template including fields for:
- `vegetables_planted` — which veg you planted (links to the calendar)
- `weather` — current conditions when posting
- `affiliate_links` — Amazon product links

## 📁 Project Structure

```
content/
├── blog/        → Blog posts (Markdown page bundles)
├── about/       → About page
├── calendar/    → Interactive planting calendar
├── gallery/     → Photo gallery
└── wishlist/    → Amazon wishlist / affiliate links
data/
└── planting-calendar.json  → NE Scotland planting schedule
static/js/
├── weather.js   → Open-Meteo weather widget
└── calendar.js  → Interactive planting calendar
```

## 🔐 GitHub Secrets Required

Set these in Settings → Secrets → Actions:

| Secret | Description |
|--------|-------------|
| `FTP_HOSTNAME` | Your Hostinger FTP host |
| `FTP_USERNAME` | FTP username |
| `FTP_PASSWORD` | FTP password |
| `FTP_REMOTE_DIR` | Remote directory (e.g., `/public_html/garden/`) |

## 🌤️ Features

- **Blog** with garden-specific metadata (vegetables, weather, photos)
- **Planting Calendar** for 16 vegetables, tuned for NE Scotland
- **Weather Widget** — live Aberdeen conditions from Open-Meteo
- **Giscus Comments** — powered by GitHub Discussions
- **Amazon Wishlist** — affiliate links for garden supplies
- **RSS Feed** — for subscribers
- **Social Sharing** — Twitter, Facebook, Pinterest, WhatsApp

## 📝 License

Content © Damien B. Site code is open source.
