# 🎨 Colour Palette Snapshot — Madhu Textorium
> **Snapshot taken:** 2026-07-06  
> **Purpose:** Rollback reference — full colour token state BEFORE the brand-brown (bag colour) accent update.  
> **File:** `app/globals.css`

---

## 🌑 DARK THEME (default / `:root` + `[data-theme="dark"]`)

| Token | Value | Notes |
|---|---|---|
| `--gold` | `#C9A84C` | Rich gold |
| `--gold-light` | `#E8C96A` | Bright gold |
| `--gold-dark` | `#A07830` | Deep amber |
| `--gold-pale` | `#F5EDD5` | Pale cream gold |
| `--bg` | `#0A0A0A` | Near-black |
| `--bg-soft` | `#111111` | Soft black |
| `--bg-card` | `#161616` | Card background |
| `--bg-charcoal` | `#1E1E1E` | Charcoal |
| `--bg-charcoal-light` | `#2A2A2A` | Light charcoal |
| `--text-primary` | `#F5F0E8` | Off-white |
| `--text-secondary` | `#B8A882` | Warm grey-gold |
| `--text-muted` | `#6B6350` | Muted tan |
| `--accent` | `#C9A84C` | Gold accent |
| `--accent-hover` | `#E8C96A` | Gold hover |
| `--accent-pale` | `rgba(201,168,76,0.08)` | Pale gold tint |
| `--accent-border` | `rgba(201,168,76,0.25)` | Gold border |
| `--accent-shadow` | `rgba(201,168,76,0.15)` | Gold glow shadow |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Hairline border |
| `--border-medium` | `rgba(255,255,255,0.1)` | Medium border |
| `--navbar-bg` | `rgba(10,10,10,0.95)` | Navbar frosted |
| `--card-bg` | `#161616` | Card bg |
| `--footer-bg` | `#111111` | Footer bg |
| `--usp-bg` | `#1E1E1E` | USP strip bg |
| `--shadow-card` | `0 8px 40px rgba(0,0,0,0.5)` | Card shadow |
| `--shadow-hover` | `0 20px 60px rgba(0,0,0,0.7)` | Hover shadow |
| `--shadow-accent` | `0 0 40px rgba(201,168,76,0.15)` | Gold glow |

---

## ☀️ LIGHT THEME (`[data-theme="light"]`) — PRE-UPDATE STATE

| Token | Value | Notes |
|---|---|---|
| `--gold` | `#8B1A1A` | Crimson red |
| `--gold-light` | `#B02020` | Bright red |
| `--gold-dark` | `#6A1010` | Deep red |
| `--gold-pale` | `#F5E8E8` | Pale blush |
| `--bg` | `#F7F0E3` | Warm cream |
| `--bg-soft` | `#EDE5CE` | Parchment |
| `--bg-card` | `#FFFFFF` | White card |
| `--bg-charcoal` | `#E8DFCA` | Light tan |
| `--bg-charcoal-light` | `#DDD4BC` | Beige |
| `--text-primary` | `#1A0E00` | Near-black brown |
| `--text-secondary` | `#5C4A2A` | Warm brown |
| `--text-muted` | `#9C8860` | Muted tan |
| `--accent` | `#8B1A1A` | Crimson accent |
| `--accent-hover` | `#B02020` | Crimson hover |
| `--accent-pale` | `rgba(139,26,26,0.06)` | Pale blush tint |
| `--accent-border` | `rgba(139,26,26,0.2)` | Red border |
| `--accent-shadow` | `rgba(139,26,26,0.12)` | Red glow |
| `--border-subtle` | `rgba(0,0,0,0.08)` | Hairline border |
| `--border-medium` | `rgba(0,0,0,0.12)` | Medium border |
| `--navbar-bg` | `rgba(247,240,227,0.97)` | Cream navbar |
| `--card-bg` | `#FFFFFF` | White card |
| `--footer-bg` | `#EDE5CE` | Parchment footer |
| `--usp-bg` | `#EDE5CE` | Parchment strip |
| `--shadow-card` | `0 4px 24px rgba(0,0,0,0.1)` | Soft shadow |
| `--shadow-hover` | `0 12px 40px rgba(0,0,0,0.15)` | Hover shadow |
| `--shadow-accent` | `0 0 30px rgba(139,26,26,0.1)` | Red glow |

---

## 🏷️ Shared Tokens (both themes)

| Token | Value |
|---|---|
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `16px` |
| `--radius-xl` | `24px` |
| `--font-brand` | `'Cinzel Decorative', 'Playfair Display', Georgia, serif` |
| `--font-serif` | `'Cormorant Garamond', 'Playfair Display', Georgia, serif` |
| `--font-display` | `'Playfair Display', Georgia, serif` |
| `--font-sans` | `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` |
| `--transition-fast` | `0.2s ease` |
| `--transition-med` | `0.4s cubic-bezier(0.4,0,0.2,1)` |
| `--transition-slow` | `0.7s cubic-bezier(0.4,0,0.2,1)` |

---

## 🛍️ Brand Bag Reference Colours

The Madhu Textorium shopping bag has two brand-defining colours:

| Role | Hex | Notes |
|---|---|---|
| Bag body (dark espresso brown) | `#2C1208` | Used as 10% accent in light theme after update |
| Bag text / logo gold | `#C9A84C` | Already present in dark theme gold tokens |

---

## 🔁 Rollback Instructions

To revert the light theme to **exactly this pre-update state**, replace the `[data-theme="light"]` block in `app/globals.css` with:

```css
[data-theme="light"] {
  --gold: #8B1A1A;
  --gold-light: #B02020;
  --gold-dark: #6A1010;
  --gold-pale: #F5E8E8;

  --bg: #F7F0E3;
  --bg-soft: #EDE5CE;
  --bg-card: #FFFFFF;
  --bg-charcoal: #E8DFCA;
  --bg-charcoal-light: #DDD4BC;

  --text-primary: #1A0E00;
  --text-secondary: #5C4A2A;
  --text-muted: #9C8860;

  --accent: #8B1A1A;
  --accent-hover: #B02020;
  --accent-pale: rgba(139,26,26,0.06);
  --accent-border: rgba(139,26,26,0.2);
  --accent-shadow: rgba(139,26,26,0.12);

  --border-subtle: rgba(0,0,0,0.08);
  --border-medium: rgba(0,0,0,0.12);

  --navbar-bg: rgba(247,240,227,0.97);
  --card-bg: #FFFFFF;
  --footer-bg: #EDE5CE;
  --usp-bg: #EDE5CE;

  --shadow-card: 0 4px 24px rgba(0,0,0,0.1);
  --shadow-hover: 0 12px 40px rgba(0,0,0,0.15);
  --shadow-accent: 0 0 30px rgba(139,26,26,0.1);
}
```
