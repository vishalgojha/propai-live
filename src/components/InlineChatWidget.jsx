import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Loader2, Sparkles, User, Bot, Info, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function InlineChatWidget({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [funnyStatus, setFunnyStatus] = useState("");
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
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
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize conversation when widget opens
  useEffect(() => {
    if (isOpen && !conversation) {
      initializeConversation();
    }
  }, [isOpen]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setIsLoading(false); // ✅ FIXED: Stop loading when new message arrives
    });

    return () => {
      unsubscribe();
    };
  }, [conversation?.id]);

  const initializeConversation = async () => {
    setIsInitializing(true);
    try {
      const newConversation = await base44.agents.createConversation({
        agent_name: "chariot_master",
        metadata: {
          name: "PropAI Chat",
          description: "Property listing and search assistance"
        }
      });
      setConversation(newConversation);
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      toast.error('Failed to start chat', {
        description: 'Please try again',
        duration: 3000
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const getRandomStatus = () => {
    return funnyStatuses[Math.floor(Math.random() * funnyStatuses.length)];
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !conversation) return;

    const userMessageContent = input.trim();
    setInput("");
    setIsLoading(true);

    const statusInterval = setInterval(() => {
      setFunnyStatus(getRandomStatus());
    }, 2000);

    setFunnyStatus(getRandomStatus());

    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: userMessageContent
      });

      clearInterval(statusInterval);
      setFunnyStatus("");

      // ✅ REMOVED: setIsLoading(false) - now handled by subscription

    } catch (error) {
      clearInterval(statusInterval);
      setFunnyStatus("");
      setIsLoading(false); // ✅ Only stop loading on error

      const errorMessage = {
        role: "assistant",
        content: `❌ **Action Not Completed**\n\nSomething went wrong: ${error.message}\n\n**What to do:**\n• Try rephrasing your message\n• Make sure all details are clear\n• If issue persists, contact support at hello@propai.live`,
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);

      toast.error('❌ Action Failed', {
        description: 'Check the chat for details',
        duration: 5000
      });
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="w-full max-w-2xl mx-auto"
      >
        <Card className="w-full bg-white shadow-xl border-2 border-purple-200 overflow-hidden">
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
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 touch-manipulation"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Usage Guidelines */}
          {showGuidelines && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-900 mb-1">Usage Guidelines</p>
                    <ul className="text-xs text-amber-800 space-y-0.5">
                      <li>• ⏳ Wait for AI to respond before sending next message</li>
                      <li>• 💡 Be clear and specific for best results</li>
                      <li>• 📞 Include valid broker phone number (10 digits) for parsing</li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => setShowGuidelines(false)}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-amber-600 hover:bg-amber-100 touch-manipulation"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50/30 to-white">
            {isInitializing && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            )}

            {!isInitializing && messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-4">
                  👋 Hi! I'm your PropAI assistant. How can I help you today?
                </p>
                <p className="text-xs text-slate-500">
                  Try asking about properties, listing a new property, or market trends
                </p>
              </div>
            )}

            {!isInitializing && messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.isError 
                      ? 'bg-gradient-to-br from-red-500 to-rose-500'
                      : 'bg-gradient-to-br from-purple-500 to-blue-500'
                  }`}>
                    {message.isError ? (
                      <AlertCircle className="w-4 h-4 text-white" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-white" />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : message.isError
                        ? 'bg-red-50 border border-red-200 text-slate-800'
                        : 'bg-white border border-purple-200 text-slate-800'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="bg-white border border-purple-200 rounded-2xl px-4 py-2.5">
                  <p className="text-sm text-slate-800 font-medium animate-pulse">
                    {funnyStatus}
                  </p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 0 && !isLoading && !isInitializing && (
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
                    className="text-xs h-auto py-2 hover:bg-purple-50 hover:border-purple-300 touch-manipulation"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input - FIXED SEND BUTTON */}
          <div className="p-4 border-t border-purple-200 bg-white">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message or paste WhatsApp text..."
                disabled={isLoading || isInitializing}
                className="flex-1 resize-none border border-purple-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm max-h-24 disabled:opacity-50 disabled:cursor-not-allowed"
                rows={2}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || isInitializing || !conversation}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-auto px-4 py-2 touch-manipulation min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            {/* ✅ NEW: Helper text when disabled */}
            {isInitializing && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                ⏳ Initializing chat...
              </p>
            )}
            {isLoading && (
              <p className="text-xs text-purple-600 mt-2 text-center font-semibold">
                🤖 AI is thinking...
              </p>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}