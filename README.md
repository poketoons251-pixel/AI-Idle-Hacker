# AI Idle Hacker

[![Play](https://img.shields.io/badge/Play-GitHub%20Pages-blue?style=for-the-badge)](https://poketoons251-pixel.github.io/AI-Idle-Hacker/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An idle/incremental game about AI-assisted hacking. Build skills, hack targets, manage AI companions, and uncover narrative-driven content.

## Play Now

**https://poketoons251-pixel.github.io/AI-Idle-Hacker/**

## Features

- **Hacking System**: Hack 20+ targets with escalating difficulty using techniques like brute force, SQL injection, social engineering, and zero-day exploits
- **AI Companions**: Recruit and train AI partners with unique personalities that assist your operations
- **Skill Progression**: Level up hacking, stealth, social engineering, and hardware skills
- **Idle Progression**: Resources generate automatically — optimize your setup and come back to rewards
- **Narrative System**: Story-driven quests, episodic campaigns, and branching choices
- **Guild System**: Form or join guilds, participate in guild wars
- **Equipment System**: Acquire and upgrade hacking tools
- **Save/Export**: Cross-device save export/import with base64 encoding
- **Dark/Light Theme**: Toggle between themes

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (with persist middleware)
- **Cloud Sync**: Supabase
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Testing Library
- **Code Quality**: ESLint + TypeScript strict mode
- **Deployment**: GitHub Pages

## Development

```bash
npm install
npm run dev         # Start dev server (client + server)
npm test            # Run tests
npm run test:run    # Run tests once
npm run build       # Production build
npm run check       # TypeScript check
npm run deploy      # Deploy to GitHub Pages
```

## Project Structure

```
src/
├── components/     # React components
├── config/         # Game balance configuration
├── lib/            # Utilities (supabase, storage, audio)
├── pages/          # Page-level components
├── store/          # Zustand game store
├── types/          # TypeScript type definitions
├── utils/          # Game logic (error handling, hacking, AI)
└── tests/          # Test files
```

## License

MIT
