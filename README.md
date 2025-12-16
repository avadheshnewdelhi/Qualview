# Qualview — AI Research Copilot for Figma

An AI-native research copilot embedded directly inside Figma and FigJam that helps UX designers conduct qualitative research.

## Features

- **Context Ingestion** — Canvas selection, manual input, file upload (CSV, XLSX, DOCX, images with OCR)
- **Research Framing** — AI-generated research approach recommendations
- **Research Plan** — Structured plans with goals and focus areas
- **Screener Questions** — Bias-resistant, non-gameable screener generation
- **Response Evaluation** — AI scoring of participant responses
- **Interview Guide** — Structured guides with warm-up, core, wrap-up sections
- **Synthesis** — Transcript analysis into themes, insights, HMW prompts
- **Canvas Rendering** — Research Objects inserted onto Figma/FigJam canvas

## Tech Stack

- **Plugin Main Thread**: TypeScript
- **UI**: React + Vite + shadcn/ui
- **AI**: OpenAI GPT-4o (direct API)
- **State**: Zustand
- **Persistence**: Figma Plugin Storage

## Development

```bash
# Install dependencies
npm install

# Development (watches both main thread and UI)
npm run dev

# Build for production
npm run build
```

## Loading in Figma

1. Open Figma Desktop
2. Go to **Plugins** → **Development** → **Import plugin from manifest...**
3. Select `manifest.json` from this folder
4. Run via **Plugins** → **Development** → **Qualview**

## Configuration

1. Click the Settings icon in the plugin header
2. Enter your OpenAI API key
3. Select model (GPT-4o recommended)

## License

Private - All rights reserved
