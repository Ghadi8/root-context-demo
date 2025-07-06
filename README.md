# ENS Root-Context AI Demo

A modern, elegant application that demonstrates how to use ENS (Ethereum Name Service) root-context records to initialize AI agents with specific context and capabilities.

## Features

- **ENS Resolution**: Resolves ENS names and reads root-context text records
- **AI Agent Initialization**: Uses the root-context to initialize GPT-4 with specific instructions
- **Interactive Chat**: Chat with AI agents that understand their specific context
- **Elegant UI**: Clean, modern interface with glass morphism design
- **Real-time Streaming**: AI responses stream in real-time using Vercel AI SDK

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure OpenAI API

1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Copy `.env.local` and add your API key:

```bash
OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **ENS Resolution**: Enter an ENS name (e.g., `demo.eth`) and the app resolves it
2. **Context Discovery**: The app looks for a `root-context` text record on the ENS name
3. **AI Initialization**: If found, the context is used to initialize a GPT-4 agent with specific instructions
4. **Interactive Chat**: Chat with the AI agent that follows the context from the ENS record

## ENS Root-Context Format

The `root-context` text record should contain instructions for the AI agent:

```
You are a helpful assistant for [Domain Name]. Your role is to...
- Help users with specific tasks
- Provide information about specific topics
- Follow specific personality guidelines
```

## Demo Mode

If an ENS name doesn't have a root-context record, the app will use a default context for demonstration purposes.

## Technology Stack

- **Next.js 15** - React framework
- **Vercel AI SDK** - Streaming AI responses
- **OpenAI GPT-4** - AI model
- **ENS.js** - ENS resolution
- **Viem** - Ethereum client
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## API Routes

- `POST /api/chat` - Handles AI chat functionality with context injection

## Contributing

Feel free to contribute by:
- Adding support for more AI models
- Improving the UI/UX
- Adding more ENS record types
- Enhancing error handling

## License

MIT License
