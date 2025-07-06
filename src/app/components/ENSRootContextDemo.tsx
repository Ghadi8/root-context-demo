"use client";

import React, { useState, FormEvent, KeyboardEvent } from "react";
import {
  Search,
  Brain,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
  LucideIcon,
  Sparkles,
  Globe,
  Send,
  User,
  Bot,
} from "lucide-react";
import { createEnsPublicClient } from "@ensdomains/ensjs";
import { mainnet } from "viem/chains";
import { http, createPublicClient } from "viem";
import { getRecords } from "@ensdomains/ensjs/public";

// Type definitions
interface StepInfo {
  num: number;
  label: string;
  icon: LucideIcon;
}

interface ENSRecordsResult {
  texts?: Array<{ key: string; value: string }>;
  coins?: Array<{ id: number; value: string }>;
}

const ENSRootContextDemo: React.FC = () => {
  const [ensName, setEnsName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [rootContext, setRootContext] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<number>(0);
  const [ensAddress, setEnsAddress] = useState<string>("");
  const [agentReady, setAgentReady] = useState<boolean>(false);

  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsChatLoading(true);
    setChatError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          rootContext: rootContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      // Add an empty assistant message that we'll update as we stream
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantResponse += chunk;
          
          // Update the last message (assistant response) with the accumulated content
          setMessages(prev => 
            prev.map((msg, index) => 
              index === prev.length - 1 
                ? { ...msg, content: assistantResponse }
                : msg
            )
          );
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setChatError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Remove the empty assistant message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Initialize ENS client with proper typing
  const client = React.useMemo(() => {
    try {
      return createEnsPublicClient({
        chain: mainnet,
        transport: http("https://eth.drpc.org"),
      });
    } catch (error) {
      // Fallback to regular public client if ENS client fails
      console.warn("Failed to create ENS client, using fallback:", error);
      return createPublicClient({
        chain: mainnet,
        transport: http("https://eth.drpc.org"),
      });
    }
  }, []);

  // Real ENS resolution function
  const resolveENSName = async (name: string): Promise<void> => {
    setLoading(true);
    setError("");
    setStep(1);
    setAgentReady(false);

    try {
      // Step 1: Resolve ENS name
      await new Promise<void>((resolve) => setTimeout(resolve, 500)); // UX delay

      // Use the original getRecords approach
      const result: ENSRecordsResult = await getRecords(client as any, {
        name: name,
        texts: ["root-context"],
        coins: ["60"],
      });

      setStep(2);

      // Check if root-context exists
      const rootContextValue = result.texts?.find(
        (text) => text.key === "root-context"
      )?.value;
      const ethAddress = result.coins?.find((coin) => coin.id === 60)?.value;

      if (!rootContextValue) {
        // For demo purposes, we'll use a default context
        const defaultContext = `You are a helpful AI assistant for ${name}. You are knowledgeable about Web3, blockchain technology, and can assist with general questions. You were initialized through the ENS Root-Context system.`;
        setRootContext(defaultContext);
        setError(`ENS name "${name}" found but no root-context record available. Using default AI context for demo.`);
      } else {
        setRootContext(rootContextValue);
      }
      setEnsAddress(ethAddress || "No address set");

      // Step 3: Process AI context
      setStep(3);
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));

      // Step 4: Agent is ready
      setStep(4);
      setAgentReady(true);
      setLoading(false);
    } catch (err) {
      console.error("ENS resolution error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to resolve ENS name "${name}": ${errorMessage}`);
      setLoading(false);
      setStep(0);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (ensName.trim()) {
      resolveENSName(ensName.trim());
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      const form = e.currentTarget.form;
      if (form) {
        handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
      }
    }
  };

  const handleExampleClick = (name: string): void => {
    setEnsName(name);
  };

  const reset = (): void => {
    setStep(0);
    setRootContext("");
    setError("");
    setEnsName("");
    setEnsAddress("");
    setAgentReady(false);
    setMessages([]);
    setInput('');
    setChatError('');
  };

  const steps: StepInfo[] = [
    { num: 1, label: "Resolving ENS", icon: Search },
    { num: 2, label: "Reading Context", icon: ExternalLink },
    { num: 3, label: "Initializing AI", icon: Brain },
    { num: 4, label: "Ready", icon: CheckCircle },
  ];

  const exampleNames: string[] = ["vitalik.eth", "ens.eth", "nick.eth"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-gray-800 mb-4 tracking-tight">
            ENS Root-Context AI
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Discover and interact with AI agents through ENS names using intelligent context resolution
          </p>
        </div>

        {/* Main Demo Area */}
        <div className="elegant-card p-8 mb-8">
          {/* ENS Input */}
          <div className="mb-8">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={ensName}
                  onChange={(e) => setEnsName(e.target.value)}
                  placeholder="Enter ENS name (e.g., demo.eth)"
                  className="w-full px-6 py-4 elegant-input text-gray-700 placeholder-gray-400 font-medium"
                  disabled={loading}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !ensName.trim()}
                className="px-8 py-4 elegant-button text-white font-medium flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Resolve
              </button>
            </form>
          </div>

          {/* Demo Examples */}
          <div className="mb-8">
            <p className="text-gray-600 mb-4 font-medium">
              Try these ENS names (demo purposes - they'll use a default context):
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              {exampleNames.map((name) => (
                <button
                  key={name}
                  onClick={() => handleExampleClick(name)}
                  className="px-4 py-2 elegant-tag text-gray-700 font-medium"
                  disabled={loading}
                >
                  {name}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 italic">
              Note: For demo purposes, we'll use a default AI context if no root-context record is found
            </p>
          </div>

          {/* Progress Steps */}
          {step > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                {steps.map(({ num, label, icon: Icon }) => (
                  <div key={num} className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 elegant-step flex items-center justify-center mb-3 ${
                        step >= num
                          ? "completed"
                          : step === num
                          ? "active"
                          : ""
                      }`}
                    >
                      {step > num ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className={`w-6 h-6 ${
                          step >= num ? "text-white" : "text-gray-400"
                        }`} />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      step >= num ? "text-gray-700" : "text-gray-400"
                    }`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="elegant-progress h-2">
                <div
                  className="elegant-progress-bar h-full"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {(error || chatError) && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{error || chatError}</span>
            </div>
          )}

          {/* Root Context Display */}
          {rootContext && (
            <div className="mb-8">
              <div className="elegant-card p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <Globe className="w-6 h-6 text-blue-500" />
                  Root-Context Record
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                    {rootContext}
                  </pre>
                </div>
                {ensAddress && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-800">
                      ETH Address: <span className="font-mono">{ensAddress}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Chat Interface */}
          {agentReady && (
            <div className="mb-8">
              <div className="elegant-card p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <Brain className="w-6 h-6 text-purple-500" />
                  Chat with AI Agent
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">Ready</span>
                </h3>
                
                {/* Chat Messages */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 h-80 overflow-y-auto mb-4 p-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>Start a conversation with the AI agent!</p>
                        <p className="text-sm mt-1">The agent has been initialized with the ENS context.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`flex gap-3 max-w-[80%] ${
                              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-purple-500 text-white'
                            }`}>
                              {message.role === 'user' ? (
                                <User className="w-4 h-4" />
                              ) : (
                                <Bot className="w-4 h-4" />
                              )}
                            </div>
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white border border-gray-200 text-gray-700'
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 elegant-input text-gray-700 placeholder-gray-400"
                    disabled={isChatLoading}
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !input.trim()}
                    className="px-6 py-3 elegant-button text-white font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Reset Button */}
          {step > 0 && (
            <button
              onClick={reset}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Try Another ENS Name
            </button>
          )}
        </div>

        {/* Info Panel */}
        <div className="elegant-card p-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">
            How It Works
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Search,
                title: "ENS Resolution",
                desc: "The system resolves your ENS name and searches for the root-context text record.",
                color: "text-blue-500"
              },
              {
                icon: ExternalLink,
                title: "Context Discovery",
                desc: "The root-context record contains instructions and personality for the AI agent.",
                color: "text-green-500"
              },
              {
                icon: Brain,
                title: "AI Initialization",
                desc: "The agent processes the context to understand its role and capabilities",
                color: "text-purple-500"
              },
              {
                icon: Sparkles,
                title: "Interactive Chat",
                desc: "Chat with the AI agent that understands the specific context and can help accordingly.",
                color: "text-orange-500"
              }
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ENSRootContextDemo;
