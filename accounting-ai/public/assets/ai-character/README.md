# AI CPA Character Assets

## Directory Structure

```
ai-character/
├── avatar.png              ← Main avatar (drop final anime art here)
├── avatar-placeholder.svg  ← SVG fallback (auto-used if avatar.png missing)
├── avatar-thinking.png     ← Thinking/loading expression variant
├── avatar-happy.png        ← Success/positive expression
├── avatar-sorry.png        ← Error/apologetic expression
├── hero.png                ← Half/full-body for onboarding & landing
└── README.md
```

## Recommended Export Specs

| File | Dimensions | Format | Notes |
|------|-----------|--------|-------|
| avatar.png | 512×512 | PNG (transparent bg) | Primary circular avatar |
| avatar-thinking.png | 512×512 | PNG (transparent bg) | Eyes looking up, hand on chin |
| avatar-happy.png | 512×512 | PNG (transparent bg) | Warm smile, slight head tilt |
| avatar-sorry.png | 512×512 | PNG (transparent bg) | Apologetic bow, sweatdrop |
| hero.png | 1024×1400 | PNG (transparent bg) | Upper body, suit, slight lean |

## Where Assets Are Used

| Component | File | Size | Variant |
|-----------|------|------|---------|
| AI Assistant Panel header | `assistant-panel.tsx` | sm (32px) | Default |
| AI Input Bar | `ai-input-bar.tsx` | sm (32px) | Default |
| Chat message bubbles | (future) | md (40px) | Default/thinking |
| Onboarding welcome | (future) | 2xl (112px) or hero | Happy |
| Error states | (future) | lg (56px) | Sorry |
| Loading/processing | (future) | md (40px) | Thinking (animated) |
| Login/landing page | (future) | hero | Default |
| Top nav AI button | (future) | xs (24px) | Default |

## AI Art Generation Prompts

### Midjourney / DALL-E 3
```
Handsome anime male CPA accountant, dark navy suit, green tie,
thin-frame glasses, dark hair swept to side, warm confident smile,
professional pose, upper body portrait, clean modern anime style,
transparent background, soft pastel lighting, high detail
```

### Expression variants
- **Thinking**: "...looking upward thoughtfully, hand on chin, slight smile"
- **Happy**: "...bright warm smile, slight head tilt, celebratory"  
- **Sorry**: "...apologetic expression, slight bow, sweatdrop"

### Style keywords to match brand
- Warm pastel palette (pink, peach, cream tones)
- Clean modern anime (not chibi, not hyper-detailed)
- Professional but approachable
- Green accent elements (tie, pocket square, eyes)
