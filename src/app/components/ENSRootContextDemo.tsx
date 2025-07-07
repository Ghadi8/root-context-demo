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
  Send,
  User,
  Bot,
  ArrowRight,
  Copy,
  MessageSquare,
  Zap,
  Globe,
  Code,
  Info,
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
  const [copied, setCopied] = useState<boolean>(false);

  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

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

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantResponse += chunk;
          
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
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const client = React.useMemo(() => {
    try {
      return createEnsPublicClient({
        chain: mainnet,
        transport: http("https://eth.drpc.org"),
      });
    } catch (error) {
      console.warn("Failed to create ENS client, using fallback:", error);
      return createPublicClient({
        chain: mainnet,
        transport: http("https://eth.drpc.org"),
      });
    }
  }, []);

  const resolveENSName = async (name: string): Promise<void> => {
    setLoading(true);
    setError("");
    setStep(1);
    setAgentReady(false);

    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 800));

      const result: ENSRecordsResult = await getRecords(client as any, {
        name: name,
        texts: ["root-context"],
        coins: ["60"],
      });

      setStep(2);
      await new Promise<void>((resolve) => setTimeout(resolve, 600));

      const rootContextValue = result.texts?.find(
        (text) => text.key === "root-context"
      )?.value;
      const ethAddress = result.coins?.find((coin) => coin.id === 60)?.value;

      if (!rootContextValue) {
        setRootContext("");
        setError(`ENS name "${name}" found but no root-context record available. Please set a root-context text record to enable AI chat functionality.`);
        setLoading(false);
        setStep(0);
        return;
      } else {
        setRootContext(rootContextValue);
      }
      setEnsAddress(ethAddress || "No address set");

      setStep(3);
      await new Promise<void>((resolve) => setTimeout(resolve, 1200));

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rootContext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 relative overflow-hidden">
      {/* Dynamic animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse-gentle"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,107,107,0.2),transparent_50%)] animate-float"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.2),transparent_50%)] animate-float-delayed"></div>

        {/* Floating orbs */}
        <div className="floating-orb absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rounded-full blur-3xl animate-float-glow"></div>
        <div className="floating-orb absolute top-60 right-20 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-pink-600/30 rounded-full blur-3xl animate-float-delayed-glow"></div>
        <div className="floating-orb absolute bottom-32 left-1/4 w-56 h-56 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float-slow-glow"></div>
        <div className="floating-orb absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-br from-yellow-400/25 to-orange-600/25 rounded-full blur-2xl animate-float-reverse"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-8 h-8 text-white animate-pulse-gentle" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping-slow shadow-lg">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent tracking-tight mb-2">
                  ENS Root-Context AI
                </h1>
                <p className="text-xl text-cyan-200/80 font-medium">Intelligent AI agents through decentralized naming</p>
              </div>
            </div>
            
            {/* Info Button */}
            <div className="relative">
              <button
                onClick={() => setShowHowItWorks(true)}
                className="group relative p-4 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-2xl transition-all duration-300 hover:shadow-2xl backdrop-blur-sm animate-pulse-gentle"
                title="How it works"
              >
                <Info className="w-6 h-6 text-white group-hover:text-cyan-400 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
          <p className="text-xl text-slate-300 max-w-4xl leading-relaxed font-light">
            Discover and interact with <span className="text-cyan-400 font-medium">AI agents</span> through ENS names using intelligent context resolution.
            Each ENS name can define its own <span className="text-purple-400 font-medium">AI personality</span> and capabilities.
          </p>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <div className="space-y-12">
          {/* ENS Resolution and Controls Row */}
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left Panel - ENS Resolution */}
            <div className="lg:col-span-2 space-y-10">
            {/* ENS Input Card */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse-gentle"></div>
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Search className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Resolve ENS Name</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={ensName}
                      onChange={(e) => setEnsName(e.target.value)}
                      placeholder="Enter ENS name (e.g., vitalik.eth)"
                      className="w-full px-6 py-5 bg-white/5 border border-white/20 rounded-2xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 text-white placeholder-slate-400 text-lg font-medium backdrop-blur-sm hover:bg-white/10"
                      disabled={loading}
                      onKeyPress={handleKeyPress}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !ensName.trim()}
                    className="w-full px-8 py-5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-4 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/50 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    {loading ? (
                      <>
                        <Loader className="w-6 h-6 animate-spin" />
                        Resolving...
                      </>
                    ) : (
                      <>
                        <Search className="w-6 h-6" />
                        Resolve ENS
                        <ArrowRight className="w-5 h-5 ml-2 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Progress Steps */}
            {step > 0 && (
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl animate-slide-up">
                  <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    Resolution Progress
                  </h3>
                  <div className="space-y-6">
                    {steps.map(({ num, label, icon: Icon }) => (
                      <div key={num} className="flex items-center gap-6 group/step">
                        <div
                          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                            step >= num
                              ? step === num
                                ? "bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-2xl shadow-cyan-500/50 animate-pulse-gentle"
                                : "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl shadow-green-500/50"
                              : "bg-white/5 text-slate-400 border border-white/10"
                          }`}
                        >
                          {step > num ? (
                            <CheckCircle className="w-7 h-7" />
                          ) : (
                            <Icon className="w-7 h-7" />
                          )}
                          {step === num && loading && (
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 animate-shimmer"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`font-bold text-lg transition-colors ${
                            step >= num ? "text-white" : "text-slate-500"
                          }`}>
                            {label}
                          </span>
                          {step === num && loading && (
                            <div className="mt-3">
                              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2 rounded-full animate-progress shadow-lg shadow-cyan-500/50"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {(error || chatError) && (
              <div className="group relative animate-shake">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-red-900/40 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
                      <AlertCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-red-200 mb-3 text-xl">Error Detected</h4>
                      <p className="text-red-300 leading-relaxed text-lg font-medium">{error || chatError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step > 0 && (
              <button
                onClick={reset}
                className="group relative w-full px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-2xl backdrop-blur-sm overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-3">
                  <ArrowRight className="w-5 h-5 transform rotate-180" />
                  Try Another ENS Name
                </span>
              </button>
            )}
          </div>

          {/* Right Panel - Chat Interface */}
          <div className="lg:col-span-3 space-y-10">
            {agentReady ? (
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 animate-gradient-shift"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl h-[800px] flex flex-col shadow-2xl">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-8 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-t-3xl">
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
                          <Bot className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-black animate-pulse shadow-lg">
                          <div className="w-full h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping-slow"></div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">AI Agent</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                          <span className="text-lg text-cyan-200 font-medium">Connected & Ready</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400 font-medium">Active Context:</div>
                      <div className="font-bold text-white text-lg bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{ensName}</div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-b from-transparent to-black/20">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center">
                        <div className="animate-bounce-slow">
                          <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl backdrop-blur-sm border border-white/10">
                            <MessageSquare className="w-12 h-12 text-purple-300 animate-glow-pulse" />
                          </div>
                          <h4 className="text-3xl font-bold text-white mb-4">Start a conversation!</h4>
                          <p className="text-slate-300 mb-6 text-xl">The AI has been initialized with the ENS context.</p>
                          <div className="flex items-center justify-center gap-3 text-lg text-purple-300">
                            <span>Try asking about Web3, ENS, or anything else</span>
                            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse-gentle" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex gap-6 animate-message-in ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {message.role === 'assistant' && (
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl border border-white/10">
                                <Bot className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] px-6 py-4 rounded-3xl shadow-xl backdrop-blur-sm transition-all duration-300 ${
                                message.role === 'user'
                                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-cyan-500/50 border border-cyan-400/30'
                                  : 'bg-white/10 border border-white/20 text-white shadow-purple-500/20'
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap text-lg font-medium">
                                {message.content}
                              </p>
                            </div>
                            {message.role === 'user' && (
                              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl border border-white/10">
                                <User className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex gap-6 justify-start animate-message-in">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl border border-white/10">
                              <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div className="bg-white/10 border border-white/20 px-6 py-4 rounded-3xl shadow-xl backdrop-blur-sm">
                              <div className="flex gap-2">
                                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-8 border-t border-white/10 bg-gradient-to-r from-black/20 to-purple-900/20 rounded-b-3xl backdrop-blur-sm">
                    <form onSubmit={handleChatSubmit} className="flex gap-4">
                      <div className="flex-1 relative group">
                        <input
                          type="text"
                          value={input}
                          onChange={handleInputChange}
                          placeholder="Type your message..."
                          className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition-all duration-300 text-white placeholder-slate-400 text-lg font-medium backdrop-blur-sm hover:bg-white/10"
                          disabled={isChatLoading}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isChatLoading || !input.trim()}
                        className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 disabled:shadow-sm font-bold text-lg overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <Send className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Send</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              /* Chat Placeholder */
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl h-[800px] flex items-center justify-center shadow-2xl">
                  <div className="text-center animate-bounce-slow">
                    <div className="w-32 h-32 bg-gradient-to-br from-slate-700/20 to-slate-800/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl backdrop-blur-sm border border-white/5">
                      {ensName && error && error.includes("no root-context record") ? (
                        <AlertCircle className="w-16 h-16 text-red-400 animate-glow-pulse" />
                      ) : (
                        <MessageSquare className="w-16 h-16 text-slate-400 animate-glow-pulse" />
                      )}
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      {ensName && error && error.includes("no root-context record") 
                        ? "No Root-Context Available" 
                        : "Chat Interface"
                      }
                    </h3>
                    <p className="text-slate-300 mb-8 leading-relaxed text-xl">
                      {ensName && error && error.includes("no root-context record") 
                        ? `The ENS name "${ensName}" does not have a root-context text record set. To enable AI chat functionality, please add a root-context record to this ENS name.`
                        : "Resolve an ENS name to start chatting with an AI agent"
                      }
                    </p>
                    {!(ensName && error && error.includes("no root-context record")) && (
                      <div className="flex items-center justify-center gap-4 text-lg text-slate-400">
                        <div>
                          <span className="font-medium">1. Enter ENS</span>
                        </div>
                        <ArrowRight className="w-5 h-5" />
                        <div>
                          <span className="font-medium">2. Resolve</span>
                        </div>
                        <ArrowRight className="w-5 h-5" />
                        <div>
                          <span className="font-medium">3. Chat</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Full-width Root Context Display */}
          {rootContext && (
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl animate-slide-up">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                      <Code className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Root Context</h3>
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`p-4 rounded-2xl transition-all duration-300 shadow-lg ${
                      copied 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20'
                    }`}
                    title="Copy context"
                  >
                    {copied ? <CheckCircle className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                  </button>
                </div>
                <div className="bg-slate-950/80 rounded-2xl p-8 border border-emerald-500/20 shadow-inner backdrop-blur-sm">
                  <pre className="text-sm text-emerald-300 whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed font-medium">
                    {rootContext}
                  </pre>
                </div>
                {ensAddress && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <span className="text-sm font-bold text-blue-200">
                        ETH Address: <span className="font-mono text-blue-300 text-base">{ensAddress}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reset button - moved out of grid */}
          {step > 0 && (
            <div className="flex justify-center">
              <button
                onClick={reset}
                className="group relative px-12 py-5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-2xl backdrop-blur-sm overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-3">
                  <ArrowRight className="w-5 h-5 transform rotate-180" />
                  Try Another ENS Name
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="group relative max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur opacity-30 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-black/95 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">How It Works</h3>
                </div>
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-2xl transition-all duration-300 text-white hover:text-red-400"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-8">
                {[
                  {
                    icon: Search,
                    title: "ENS Resolution",
                    desc: "Resolves ENS name and searches for root-context text record",
                    color: "from-blue-500 to-cyan-500"
                  },
                  {
                    icon: ExternalLink,
                    title: "Context Discovery",
                    desc: "Reads AI instructions and personality from the context record",
                    color: "from-emerald-500 to-teal-500"
                  },
                  {
                    icon: Brain,
                    title: "AI Initialization",
                    desc: "Initializes the agent with the discovered context",
                    color: "from-purple-500 to-pink-500"
                  },
                  {
                    icon: Zap,
                    title: "Interactive Chat",
                    desc: "Chat with the context-aware AI agent",
                    color: "from-amber-500 to-orange-500"
                  }
                ].map(({ icon: Icon, title, desc, color }) => (
                  <div key={title} className="flex gap-6 p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 border border-white/5 hover:border-white/10">
                    <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-xl`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-3 text-xl">{title}</h4>
                      <p className="text-slate-300 leading-relaxed text-base">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <Globe className="w-6 h-6 text-blue-400" />
                  Setting Up Your ENS
                </h4>
                <p className="text-slate-300 leading-relaxed text-base mb-4">
                  To enable AI chat functionality for your ENS name, add a <span className="font-mono bg-slate-800 px-2 py-1 rounded text-cyan-400">root-context</span> text record.
                </p>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-sm text-slate-400 mb-2">Example record:</p>
                  <code className="text-emerald-300 text-sm block">
                    Key: root-context<br/>
                    Value: You are a helpful AI assistant...
                  </code>
                </div>
              </div>

              {/* Close button at bottom */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/50"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ENSRootContextDemo;