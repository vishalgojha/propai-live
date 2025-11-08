import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Loader2, Sparkles, User, Bot,
  Minimize2, Maximize2
} from "lucide-react";
import { toast } from "sonner";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hey! I'm your PropAI assistant. Just forward me any property message from WhatsApp and I'll list it instantly. Or ask me anything about Mumbai real estate!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [funnyStatus, setFunnyStatus] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const funnyStatuses = [
    "🔍 Decoding broker language...",
    "🏠 Talking to buildings...",
    "📱 Reading WhatsApp screenshots...",
    "🤔 Asking ChatGPT for help...",
    "🧠 Connecting the dots...",
    "💡 Having an aha moment...",
    "📊 Crunching numbers...",
    "🗺️ Mapping Mumbai...",
    "🕵️ Detective mode activated...",
    "✨ Sprinkling some AI magic...",
    "🎯 Locking in on details...",
    "🚀 Processing at light speed...",
    "🎨 Making it look pretty...",
    "🔮 Consulting the crystal ball...",
    "🏗️ Building intelligence...",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const getRandomStatus = () => {
    return funnyStatuses[Math.floor(Math.random() * funnyStatuses.length)];
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Show funny loading statuses
    const statusInterval = setInterval(() => {
      setFunnyStatus(getRandomStatus());
    }, 1500);

    try {
      const response = await base44.agents.invoke('chariot_master', {
        message: userMessage.content
      });

      clearInterval(statusInterval);
      setFunnyStatus("");

      const assistantMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show appropriate toast
      if (response.includes('✅') || response.includes('Listed')) {
        toast.success('🎉 Property Listed!', {
          description: 'Your property is now live on SmartFeed',
          duration: 3000,
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0'
        });
      } else if (response.includes('duplicate') || response.includes('Already')) {
        toast.warning('⚠️ Duplicate Detected', {
          description: 'This property already exists',
          duration: 3000
        });
      }
    } catch (error) {
      clearInterval(statusInterval);
      setFunnyStatus("");

      const errorMessage = {
        role: "assistant",
        content: `Oops! 😅 Something went wrong:\n${error.message}\n\nTry again or rephrase your message.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      toast.error('❌ Failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: "📸 List Property", value: "I have a property to list" },
    { label: "🔍 Find Match", value: "I'm looking for a property" },
    { label: "🏢 Building Info", value: "Tell me about buildings in Bandra" },
    { label: "💰 Market Trends", value: "What's the market like?" },
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl flex items-center justify-center group relative"
            >
              <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed ${isMinimized ? 'bottom-6 right-6' : 'bottom-6 right-6'} z-50 ${
              isMinimized ? 'w-80' : 'w-[420px] h-[600px]'
            }`}
          >
            <Card className="w-full h-full bg-white shadow-2xl border-2 border-purple-200 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">PropAI Assistant</h3>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white/90">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsMinimized(!isMinimized)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50/30 to-white">
                    {messages.map((message, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                              : 'bg-white border border-purple-200 text-slate-800'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                            {format(message.timestamp, 'HH:mm')}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-slate-600" />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* Loading State with Funny Status */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 justify-start"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                        <div className="bg-white border border-purple-200 rounded-2xl px-4 py-2.5">
                          <p className="text-sm text-slate-800 font-medium animate-pulse">
                            {funnyStatus}
                          </p>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Actions */}
                  {messages.length <= 1 && !isLoading && (
                    <div className="p-4 border-t border-purple-100 bg-purple-50/30">
                      <p className="text-xs text-slate-600 mb-2 font-semibold">Quick Actions:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {quickActions.map((action, idx) => (
                          <Button
                            key={idx}
                            onClick={() => {
                              setInput(action.value);
                              inputRef.current?.focus();
                            }}
                            variant="outline"
                            size="sm"
                            className="text-xs h-auto py-2 hover:bg-purple-50 hover:border-purple-300"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-4 border-t border-purple-200 bg-white">
                    <div className="flex gap-2">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message or paste WhatsApp text..."
                        disabled={isLoading}
                        className="flex-1 resize-none border border-purple-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm max-h-24"
                        rows={1}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-10 px-4"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Minimized State */}
              {isMinimized && (
                <div className="p-4 text-center">
                  <p className="text-sm text-slate-600">Chat minimized. Click to expand.</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function format(date, formatStr) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}