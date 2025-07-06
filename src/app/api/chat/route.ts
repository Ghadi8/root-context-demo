import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { messages, rootContext } = await req.json();

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create system message with root context or default
    const defaultContext = `You are a helpful AI assistant that has been initialized through an ENS name resolution system. You should be friendly, knowledgeable, and helpful. You can discuss a wide range of topics including blockchain, Web3, technology, and general questions. Always be respectful and provide accurate information.`;

    const contextToUse = rootContext || defaultContext;

    const systemMessage = {
      role: 'system' as const,
      content: `You are an AI assistant with the following context and instructions:

${contextToUse}

Please respond according to this context and be helpful to the user. If the context provides specific instructions about your role, personality, or capabilities, follow them closely.`
    };

    // Create the chat completion with streaming
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, ...messages],
      max_completion_tokens: 2000,
      temperature: 0.7,
      stream: true,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process AI request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
