# Blutag — AI-Powered Alt Text for Bluesky

Generate accurate, accessible alt text for your photos using AI, then post directly to [Bluesky](https://bsky.social).

🔗 **[Try it live → blutag.lovable.app](https://blutag.lovable.app)**

## Features

- 📸 Upload up to 4 photos (max 25 MB each)
- 🤖 AI-generated alt text powered by Google Gemini
- 🗺️ EXIF-aware — uses date, location, and camera info for better descriptions
- ✏️ Edit, copy, or regenerate alt text before posting
- 🦋 Post directly to Bluesky via AT Protocol OAuth (your password never enters the app)
- 🔒 Privacy-first — photos are processed in-memory and never stored
- 📱 Responsive drag-and-drop interface

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Bun](https://bun.sh/)

### Setup

```bash
# Clone the repository
git clone https://github.com/sesamsys/blutag.git
cd blutag

# Install dependencies
bun install

# Copy environment template and fill in your values
cp .env.example .env

# Start the dev server
bun run dev
```

See `.env.example` for the required environment variables. The app uses [Lovable Cloud](https://lovable.dev) as its backend (Supabase under the hood).

### Running Tests

```bash
npm test
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI | shadcn/ui, Tailwind CSS |
| Backend | Supabase Edge Functions (Deno) |
| AI | Google Gemini 2.5 Flash via Lovable AI Gateway |
| Social | AT Protocol (`@atproto/oauth-client-browser`) |
| Hosting | [Lovable](https://lovable.dev) |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

## Links

- [Live App](https://blutag.lovable.app)
- [Bluesky](https://bsky.app/profile/sesam.hu)
- [GitHub](https://github.com/sesamsys)
- [LinkedIn](https://linkedin.com/in/pszilagyi)
