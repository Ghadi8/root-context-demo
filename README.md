# ENS Root-Context AI Demo

A modern, elegant application that demonstrates how to use ENS (Ethereum Name Service) root-context records to initialize AI agents with specific context and capabilities.

## About This Project

This project was agent-coded with the purpose of acting as a demo to the root-context idea outlined in [ENSIP-TBD-11](https://github.com/nxt3d/ensips/blob/ensip-ideas/ensips/ensip-TBD-11.md). It was deliberately agent-coded to test how comprehensive the ENSIP is for enabling AI agents to understand and implement the root-context specification. The fact that an AI agent could successfully build this functional demo from the ENSIP documentation serves as validation of the specification's clarity and completeness.

## Features

- **ENS Resolution**: Resolves ENS names and reads root-context text records
- **AI Agent Initialization**: Uses the root-context to initialize GPT-4 with specific instructions
- **Interactive Chat**: Chat with AI agents that understand their specific context
- **Real-time Streaming**: AI responses stream in real-time using Vercel AI SDK

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure OpenAI API

1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Copy `.env.local` and add your API key:

```bash
OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 3. Run the Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **ENS Resolution**: Enter an ENS name (e.g., `demo.eth`) and the app resolves it
2. **Context Discovery**: The app looks for a `root-context` text record on the ENS name
3. **AI Initialization**: If found, the context is used to initialize a GPT-4 agent with specific instructions
4. **Interactive Chat**: Chat with the AI agent that follows the context from the ENS record

## License

MIT License
