import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Loader2, Sparkles, User, Bot,
  Minimize2, Maximize2, Info, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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
    "🎯 Locking in on details...",
    "🚀 Processing at light speed...",
    "🎨 Making it look pretty...",
    "🔮 Consulting the crystal ball...",
    "🏗️ Building intelligence...",
    "🔬 Analyzing data patterns...",
    "🎪 Juggling information...",
    "🎭 Reading between the lines...",
    "🎲 Rolling the AI dice...",
    "🎸 Tuning the algorithms...",
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

  // Listen for custom event to open chat
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
    };
    
    window.addEventListener('openChatWidget', handleOpenChat);
    
    return () => {
      window.removeEventListener('openChatWidget', handleOpenChat);
    };
  }, []);

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
      // Update messages from conversation snapshot
      setMessages(data.messages || []);
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

    // Show funny loading statuses every 2 seconds
    const statusInterval = setInterval(() => {
      setFunnyStatus(getRandomStatus());
    }, 2000);

    // Initial status
    setFunnyStatus(getRandomStatus());

    try {
      // Add message to conversation (this will trigger AI response)
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: userMessageContent
      });

      clearInterval(statusInterval);
      setFunnyStatus("");

      // Check if response indicates success
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant') {
        const content = lastMessage.content;
        if (content.includes('✅') || content.includes('Listed')) {
          toast.success('🎉 Property Listed!', {
            description: 'Your property is now live on SmartFeed',
            duration: 3000,
            className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0'
          });
        } else if (content.includes('duplicate') || content.includes('Already')) {
          toast.warning('⚠️ Duplicate Detected', {
            description: 'This property already exists',
            duration: 3000
          });
        }
      }
    } catch (error) {
      clearInterval(statusInterval);
      setFunnyStatus("");

      // Enhanced error handling
      const errorMessage = {
        role: "assistant",
        content: `❌ **Action Not Completed**\n\nSomething went wrong: ${error.message}\n\n**What to do:**\n• Try rephrasing your message\n• Make sure all details are clear\n• If issue persists, contact support at hello@propai.live\n\nDon't worry - your data is safe! Just try again. 🙏`,
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);

      toast.error('❌ Action Failed', {
        description: 'Check the chat for details on what to do next',
        duration: 5000,
        className: 'bg-red-600 text-white border-0'
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
      {/* Floating Chat Button - TOP RIGHT */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-20 right-4 md:right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl flex items-center justify-center group relative"
            >
              <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-white group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window - TOP RIGHT POSITION */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed z-50 ${
              isMinimized 
                ? 'top-20 right-4 md:right-6 w-[calc(100vw-2rem)] max-w-xs' 
                : 'top-20 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-[420px] h-[calc(100vh-6rem)] md:h-[600px]'
            }`}
          >
            <Card className="w-full h-full bg-white shadow-2xl border-2 border-purple-200 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 md:p-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm md:text-base truncate">PropAI Assistant</h3>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white/90">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <Button
                    onClick={() => setIsMinimized(!isMinimized)}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20"
                  >
                    {isMinimized ? <Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Minimize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20"
                  >
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Usage Guidelines - Collapsible */}
                  {showGuidelines && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 flex-shrink-0"
                    >
                      <div className="p-2.5 md:p-3">
                        <div className="flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amber-900 mb-1">Usage Guidelines</p>
                            <ul className="text-xs text-amber-800 space-y-0.5">
                              <li>• ⏳ Wait for AI to respond before sending next message</li>
                              <li>• 🚫 Don't overload - one request at a time</li>
                              <li>• ✅ Use responsibly - this helps everyone</li>
                              <li>• 💡 Be clear and specific for best results</li>
                              <li>• 📞 Include valid broker phone number (10 digits) for parsing</li>
                            </ul>
                          </div>
                          <Button
                            onClick={() => setShowGuidelines(false)}
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 md:h-6 md:w-6 text-amber-600 hover:bg-amber-100 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Show Guidelines Link if Hidden */}
                  {!showGuidelines && (
                    <button
                      onClick={() => setShowGuidelines(true)}
                      className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1 text-xs text-slate-600 border-b border-slate-200 flex-shrink-0"
                    >
                      <Info className="w-3 h-3" />
                      <span>Show Usage Guidelines</span>
                    </button>
                  )}

                  {/* Messages - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gradient-to-b from-purple-50/30 to-white">
                    {isInitializing && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                      </div>
                    )}

                    {!isInitializing && messages.map((message, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 md:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.isError 
                              ? 'bg-gradient-to-br from-red-500 to-rose-500'
                              : 'bg-gradient-to-br from-purple-500 to-blue-500'
                          }`}>
                            {message.isError ? (
                              <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                            )}
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 md:px-4 md:py-2.5 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                              : message.isError
                                ? 'bg-red-50 border border-red-200 text-slate-800'
                                : 'bg-white border border-purple-200 text-slate-800'
                          }`}
                        >
                          <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          {message.created_at && (
                            <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                              {format(new Date(message.created_at), 'HH:mm')}
                            </p>
                          )}
                        </div>
                        {message.role === 'user' && (
                          <div className="w-7 h-7 md:w-8 md:h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-600" />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* Loading State with Funny Status */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 md:gap-3 justify-start"
                      >
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white animate-spin" />
                        </div>
                        <div className="bg-white border border-purple-200 rounded-2xl px-3 py-2 md:px-4 md:py-2.5">
                          <p className="text-xs md:text-sm text-slate-800 font-medium animate-pulse">
                            {funnyStatus}
                          </p>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Actions */}
                  {messages.length === 0 && !isLoading && !isInitializing && (
                    <div className="p-3 md:p-4 border-t border-purple-100 bg-purple-50/30 flex-shrink-0">
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

                  {/* Input - Fixed at Bottom */}
                  <div className="p-3 md:p-4 border-t border-purple-200 bg-white flex-shrink-0">
                    <div className="flex gap-2">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message or paste WhatsApp text..."
                        disabled={isLoading || isInitializing}
                        className="flex-1 resize-none border border-purple-200 rounded-xl px-3 py-2 md:px-4 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs md:text-sm max-h-20 md:max-h-24"
                        rows={1}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading || isInitializing}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-9 md:h-10 px-3 md:px-4 flex-shrink-0"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
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