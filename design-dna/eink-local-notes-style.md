# E-Ink Local Notes Design DNA

## One-Line Style

Low-contrast e-ink web interface for a local-first notes/audio archive: off-white screen, black ink typography, thin rounded outlines, utilitarian pills, sparse layout, and the faint gray-green cast of a photographed monochrome display.

## Design DNA JSON

```json
{
  "design_system": {
    "color": {
      "background": {
        "page": "#E7EAE2",
        "surface": "#EEF0EA",
        "surface_subtle": "#DDE1D8",
        "browser_chrome": "#D5DAD2"
      },
      "ink": {
        "primary": "#090A09",
        "secondary": "#3D423D",
        "muted": "#6F766D",
        "faint": "#9BA398"
      },
      "border": {
        "default": "#252825",
        "soft": "#6D746B",
        "inactive": "#9DA69A"
      },
      "accent": {
        "deep_wine_shadow": "#3A0012",
        "active_black": "#080908",
        "audio_bar": "#737D72",
        "danger_faint": "#9D7C7A"
      }
    },
    "typography": {
      "logo": {
        "family": "heavy grotesk sans",
        "weight": 900,
        "style": "compact, stacked, blunt"
      },
      "heading": {
        "family": "system sans / grotesk",
        "weight": 750,
        "size_range": "20-26px",
        "line_height": "1.05"
      },
      "body": {
        "family": "system sans",
        "weight": 400,
        "size_range": "13-16px",
        "line_height": "1.35"
      },
      "meta": {
        "family": "system sans",
        "weight": 500,
        "size_range": "11-13px",
        "letter_spacing": "0.02em"
      },
      "buttons": {
        "family": "system sans",
        "weight": 650,
        "size_range": "11-14px"
      }
    },
    "spacing": {
      "density": "medium-loose",
      "page_margin": "large left gutter, broad empty right canvas",
      "card_padding": "18-24px",
      "stack_gap": "10-14px",
      "filter_gap": "8-10px",
      "section_gap": "28-36px"
    },
    "layout": {
      "composition": "narrow content column aligned left of center with oversized blank space to the right",
      "max_content_width": "680-760px",
      "header": "compact stacked brand mark, subtitle, tag filters, note count badge offset to the right",
      "list": "vertical stack of note cards with audio controls and action buttons",
      "viewport_feel": "web page seen through a slightly angled photographed screen"
    },
    "shape": {
      "radius": {
        "pills": "18-24px",
        "cards": "18-24px",
        "audio_bar": "6-8px",
        "tiny_badges": "12-16px"
      },
      "borders": {
        "card": "1.5-2px black ink outline",
        "button": "1.25-1.5px outline",
        "active": "solid black fill"
      },
      "corner_style": "soft utilitarian rounded rectangles, not decorative"
    },
    "elevation": {
      "shadow_style": "almost flat e-ink with a subtle deep wine/black offset edge",
      "card_shadow": "2-4px offset, dark wine-black, very low blur",
      "surface_shadow": "minimal or none"
    },
    "components": {
      "tag_pill": {
        "inactive": "transparent/off-white fill, black outline, compact label",
        "active": "black fill, off-white text"
      },
      "primary_button": {
        "fill": "black ink",
        "text": "off-white",
        "shape": "compact pill"
      },
      "secondary_button": {
        "fill": "transparent/off-white",
        "text": "ink",
        "border": "soft black outline"
      },
      "note_card": {
        "fill": "off-white e-ink surface",
        "border": "black outline",
        "shadow": "thin wine-black offset edge",
        "structure": "id, title, timestamp, transcript, audio bar, actions, tag badge"
      },
      "audio_bar": {
        "fill": "muted gray-green",
        "icons": "small white/gray glyphs",
        "progress": "low-contrast track"
      }
    }
  },
  "design_style": {
    "mood": [
      "local",
      "quiet",
      "utilitarian",
      "low-tech",
      "personal archive",
      "e-ink",
      "DIY web tool"
    ],
    "personality": "A private, local-first note transfer portal that feels like a physical monochrome device interface rather than a glossy SaaS dashboard.",
    "visual_language": {
      "archetype": "e-ink brutal utility",
      "influences": [
        "monochrome e-reader UI",
        "personal server admin page",
        "small web tool",
        "field-note archive",
        "audio recorder log"
      ],
      "ornamentation": "very low",
      "brand_expression": "blunt logo, compact labels, function-first controls"
    },
    "composition": {
      "strategy": "dense functional cards in one column, surrounded by intentional empty space",
      "hierarchy": "title and active actions use black ink; everything else recedes into gray-green e-ink tones",
      "asymmetry": "left-weighted content with note count floating in the empty field"
    },
    "texture": {
      "screen_cast": "slight gray-green tint, low contrast, photographed-screen softness",
      "grain": "fine display noise or subtle paper/e-ink diffusion",
      "edges": "black outlines with slight imperfect optical softness"
    },
    "brand_voice": {
      "tone": "direct, local, unpolished-in-a-good-way",
      "copy_style": "plain labels and machine-like utility language",
      "examples": [
        "LOCAL NOTE TRANSFER",
        "Download all TXT",
        "Download WAV",
        "5 notes"
      ]
    }
  },
  "visual_effects": {
    "overview": {
      "effect_intensity": "low",
      "performance_tier": "lightweight",
      "primary_effect_language": "CSS borders, subtle shadows, texture overlay, optional screen-photo treatment"
    },
    "eink_texture": {
      "enabled": true,
      "implementation": "subtle noise overlay, low opacity, multiply blend or radial/linear grain"
    },
    "photographed_screen_cast": {
      "enabled": true,
      "implementation": "gray-green background tint, slight vignette, optional perspective skew when used for presentation mockups"
    },
    "deep_edge_shadow": {
      "enabled": true,
      "implementation": "thin offset shadow in deep wine-black, especially on cards"
    },
    "glassmorphism": {
      "enabled": false,
      "notes": "Avoid blur, transparency, glossy surfaces"
    },
    "webgl_3d": {
      "enabled": false,
      "notes": "No 3D scene; the style should remain flat and device-like"
    },
    "particles": {
      "enabled": false,
      "notes": "No particles or decorative effects"
    },
    "motion": {
      "enabled": "minimal",
      "recommended": "instant or very short 80-140ms opacity/ink-fill changes; avoid bouncy motion"
    }
  }
}
```

## Reusable Positive Prompt

Use this prompt when generating a design in this style:

```text
Design a low-contrast e-ink local-first web interface with a quiet personal-server feel. Use an off-white gray-green page background, black ink typography, muted gray secondary text, thin black rounded outlines, compact pill filters, blunt functional buttons, and vertically stacked rounded note cards. The layout should be left-weighted with a narrow content column and generous empty space on the right. Cards should feel almost flat, with 1.5-2px ink borders and a subtle deep wine-black offset edge shadow. Add a faint e-ink/paper grain texture and photographed-screen softness, but keep all text crisp and readable. Use a heavy compact grotesk logo, bold sans headings, small uppercase metadata, gray-green audio/control bars, and utility labels like a local note transfer tool. The result should feel like a private monochrome device UI, not a glossy SaaS product.
```

## Reusable Negative Prompt

```text
Avoid glossy gradients, glassmorphism, neon colors, saturated palettes, large hero marketing sections, decorative illustrations, stock photos, heavy shadows, complex 3D, particles, bokeh, rounded card-heavy SaaS aesthetics, pastel mobile app softness, emoji icons, luxurious typography, centered landing-page composition, and high-contrast black-white brutalism that loses the e-ink gray-green softness.
```

## Frontend Implementation Rules

```css
:root {
  --eink-page: #e7eae2;
  --eink-surface: #eef0ea;
  --eink-surface-subtle: #dde1d8;
  --eink-ink: #090a09;
  --eink-ink-soft: #3d423d;
  --eink-muted: #6f766d;
  --eink-border: #252825;
  --eink-border-soft: #6d746b;
  --eink-audio: #737d72;
  --eink-wine-shadow: #3a0012;
  --radius-pill: 999px;
  --radius-card: 22px;
  --shadow-card: 3px 4px 0 var(--eink-wine-shadow);
}
```

- Use one main column around `680-760px`, positioned slightly left of center.
- Keep the right side mostly empty; the whitespace is part of the identity.
- Use black-filled pills only for active filters and primary utility actions.
- Use outlined pills for secondary tags and downloads.
- Use card borders instead of soft drop shadows for hierarchy.
- Use `box-shadow: 3px 4px 0 var(--eink-wine-shadow)` sparingly on cards.
- Add e-ink texture through a very subtle pseudo-element noise overlay or CSS radial grain.
- Keep text contrast high enough even though the palette is muted.
- Avoid excessive animation; use short opacity/fill transitions only.

## Compact Prompt For Future Codex Requests

```text
Use the E-Ink Local Notes DNA: off-white gray-green e-ink background, black ink type, compact grotesk logo/headers, thin rounded black outlines, active black pills, outlined inactive pills, left-weighted narrow column, large empty right field, stacked utility cards, muted gray-green audio/control bars, subtle deep wine-black offset card shadows, faint screen/paper grain, local-first DIY tool mood. Avoid glossy, colorful, SaaS, glass, gradient, 3D, or decorative styling.
```
