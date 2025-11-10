import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Loader2, Sparkles, User, Bot, Info, AlertCircle, RotateCcw, StopCircle, Zap, Clock
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
  
  // ✅ NEW: Rate limit handling
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [nextRetryTime, setNextRetryTime] = useState(null);
  const [messageQueue, setMessageQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const retryTimeoutRef = useRef(null);

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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !conversation) {
      initializeConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!conversation) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      const validMessages = (data.messages || []).filter(msg => 
        msg && msg.content && msg.content.trim().length > 0
      );
      setMessages(validMessages);
      setIsLoading(false);
      setIsRateLimited(false); // Clear rate limit flag on successful response
      setRetryCount(0);
    });

    return () => {
      unsubscribe();
    };
  }, [conversation?.id]);

  // ✅ NEW: Auto-retry countdown timer
  useEffect(() => {
    if (nextRetryTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now >= nextRetryTime) {
          setNextRetryTime(null);
          setIsRateLimited(false);
          setRetryCount(0);
          processQueue(); // Try to process any queued messages
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [nextRetryTime]);

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

  const handleResetConversation = async () => {
    setIsLoading(false);
    setFunnyStatus("");
    setMessages([]);
    setInput("");
    setConversation(null);
    setIsRateLimited(false);
    setRetryCount(0);
    setNextRetryTime(null);
    setMessageQueue([]);
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    toast.success('Chat reset! Starting fresh... ✨', {
      duration: 2000
    });
    
    await initializeConversation();
  };

  const handleStopProcessing = () => {
    setIsLoading(false);
    setFunnyStatus("");
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    toast.info('Processing stopped', {
      description: 'You can start a new message',
      duration: 2000
    });
  };

  const getRandomStatus = () => {
    return funnyStatuses[Math.floor(Math.random() * funnyStatuses.length)];
  };

  // ✅ NEW: Calculate exponential backoff delay
  const getBackoffDelay = (retryAttempt) => {
    // Exponential backoff: 2^attempt * 1000ms (1s, 2s, 4s, 8s, 16s)
    return Math.min(Math.pow(2, retryAttempt) * 1000, 30000); // Max 30 seconds
  };

  // ✅ NEW: Check if error is rate limit
  const isRateLimitError = (error) => {
    const errorString = error?.message?.toLowerCase() || '';
    return errorString.includes('rate limit') || 
           errorString.includes('429') || 
           errorString.includes('resource exhausted') ||
           errorString.includes('quota');
  };

  // ✅ NEW: Process message queue
  const processQueue = async () => {
    if (isProcessingQueue || messageQueue.length === 0 || isRateLimited) return;
    
    setIsProcessingQueue(true);
    const nextMessage = messageQueue[0];
    
    try {
      await sendMessageInternal(nextMessage);
      setMessageQueue(prev => prev.slice(1)); // Remove processed message
    } catch (error) {
      // Keep in queue if rate limited
      if (!isRateLimitError(error)) {
        setMessageQueue(prev => prev.slice(1)); // Remove on other errors
      }
    } finally {
      setIsProcessingQueue(false);
    }
  };

  // ✅ NEW: Internal send with retry logic
  const sendMessageInternal = async (userMessageContent, attempt = 0) => {
    if (!conversation) return;

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
      setRetryCount(0);

    } catch (error) {
      clearInterval(statusInterval);
      setFunnyStatus("");

      // ✅ NEW: Handle rate limit errors with retry
      if (isRateLimitError(error) && attempt < 3) {
        const delay = getBackoffDelay(attempt);
        const retryTime = Date.now() + delay;
        
        setIsRateLimited(true);
        setRetryCount(attempt + 1);
        setNextRetryTime(retryTime);
        setIsLoading(false);

        toast.warning(`⏳ AI is busy! Auto-retrying in ${Math.round(delay / 1000)}s...`, {
          description: 'Too many requests. Waiting for capacity.',
          duration: delay,
        });

        // Schedule retry
        retryTimeoutRef.current = setTimeout(() => {
          setIsRateLimited(false);
          setNextRetryTime(null);
          sendMessageInternal(userMessageContent, attempt + 1);
        }, delay);

        return;
      }

      // ✅ IMPROVED: Better error messages
      setIsLoading(false);
      
      let errorTitle = '❌ Action Not Completed';
      let errorMessage = error.message;
      let suggestions = [
        '• Try rephrasing your message',
        '• Make sure all details are clear',
        '• Use the Reset button to start fresh'
      ];

      if (isRateLimitError(error)) {
        errorTitle = '⏳ AI Capacity Reached';
        errorMessage = 'The AI service is currently overwhelmed with requests.';
        suggestions = [
          '• Wait 1-2 minutes and try again',
          '• Click Reset to clear the conversation',
          '• Try shorter, simpler messages',
          '• Consider using WhatsApp AI for faster response'
        ];
      } else if (error.message.includes('timeout')) {
        errorTitle = '⏱️ Request Timeout';
        errorMessage = 'The request took too long to process.';
        suggestions = [
          '• Try again with a shorter message',
          '• Check your internet connection',
          '• Use the Reset button to start fresh'
        ];
      }

      const displayMessage = {
        role: "assistant",
        content: `**${errorTitle}**\n\n${errorMessage}\n\n**What to do:**\n${suggestions.join('\n')}\n\nIf issue persists, contact support at hello@propai.live`,
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, displayMessage]);

      toast.error(errorTitle, {
        description: errorMessage,
        duration: 5000
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !conversation || isRateLimited) return;

    const userMessageContent = input.trim();
    setInput("");
    setIsLoading(true);

    // ✅ NEW: Add to queue if rate limited
    if (isRateLimited) {
      setMessageQueue(prev => [...prev, userMessageContent]);
      toast.info('⏳ Message queued', {
        description: `Will send when AI is available (${messageQueue.length + 1} in queue)`,
        duration: 3000
      });
      return;
    }

    await sendMessageInternal(userMessageContent);
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

  // ✅ NEW: Format countdown timer
  const getRetryCountdown = () => {
    if (!nextRetryTime) return null;
    const remainingMs = nextRetryTime - Date.now();
    const remainingSec = Math.ceil(remainingMs / 1000);
    return remainingSec > 0 ? remainingSec : 0;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
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
                {isRateLimited ? (
                  <>
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white/90">Rate Limited ({getRetryCountdown()}s)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white/90">Online</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isLoading && (
              <Button
                onClick={handleStopProcessing}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 touch-manipulation"
                title="Stop processing"
              >
                <StopCircle className="w-4 h-4" />
              </Button>
            )}
            
            {messages.length > 0 && !isInitializing && (
              <Button
                onClick={handleResetConversation}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 touch-manipulation"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 touch-manipulation"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ✅ NEW: Rate Limit Banner */}
        {isRateLimited && (
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 border-b border-orange-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-bold">⏳ AI Capacity Reached</p>
                <p className="text-xs text-white/90">
                  Auto-retrying in {getRetryCountdown()}s • {messageQueue.length} message{messageQueue.length !== 1 ? 's' : ''} queued
                </p>
              </div>
            </div>
          </div>
        )}

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
                    <li>• 🔄 Use reset button if conversation gets stuck</li>
                    <li>• ⚡ If rate limited, wait 1-2 min or use WhatsApp AI</li>
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

        {/* Messages Container */}
        <div 
          ref={chatContainerRef}
          className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50/30 to-white"
          style={{ scrollBehavior: 'smooth' }}
        >
          {isInitializing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          )}

          {!isInitializing && messages.length === 0 && !isLoading && (
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

          {!isInitializing && messages.map((message, idx) => {
            if (!message || !message.content || message.content.trim().length === 0) {
              return null;
            }

            return (
              <motion.div
                key={`${message.timestamp || idx}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </motion.div>
            );
          })}

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
                <p className="text-sm text-slate-800 font-medium">
                  {funnyStatus || "Thinking..."}
                </p>
              </div>
            </motion.div>
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
                  disabled={isRateLimited}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isRateLimited ? "Waiting for AI capacity..." : "Type a message or paste WhatsApp text..."}
              disabled={isLoading || isInitializing || isRateLimited}
              className="flex-1 resize-none border border-purple-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm max-h-24 disabled:opacity-50 disabled:cursor-not-allowed"
              rows={2}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isInitializing || !conversation || isRateLimited}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-auto px-4 py-2 touch-manipulation min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          
          {/* Status messages */}
          {isInitializing && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              ⏳ Initializing chat...
            </p>
          )}
          
          {isLoading && !isRateLimited && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-purple-600 font-semibold">
                🤖 AI is thinking...
              </p>
              <Button
                onClick={handleStopProcessing}
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <StopCircle className="w-3 h-3 mr-1" />
                Stop
              </Button>
            </div>
          )}

          {/* ✅ NEW: Rate limit status */}
          {isRateLimited && (
            <div className="flex items-center justify-between mt-2 bg-orange-50 rounded-lg px-3 py-2 border border-orange-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
                <p className="text-xs text-orange-800 font-semibold">
                  Retry in {getRetryCountdown()}s • {retryCount}/3 attempts
                </p>
              </div>
              <Button
                onClick={handleResetConversation}
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
          )}

          {/* ✅ NEW: Queue status */}
          {messageQueue.length > 0 && (
            <div className="mt-2 text-center">
              <p className="text-xs text-slate-500">
                📬 {messageQueue.length} message{messageQueue.length !== 1 ? 's' : ''} queued
              </p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}