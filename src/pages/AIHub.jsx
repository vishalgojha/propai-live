import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot, Send, Loader2, Zap, BookOpen, Building2, 
  Sparkles, MessageCircle, Trash2, Plus, User, X, QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const AGENTS = [
  {
    id: 'chariot_master',
    name: 'PropAI Sync',
    icon: Zap,
    color: 'from-purple-600 to-blue-600',
    description: 'Super-fast property & requirement parser. Processes WhatsApp listings instantly.',
    greeting: '👋 PropAI Sync here! Send me property listings or requirements and I\'ll process them in seconds! 🚀',
  },
  {
    id: 'blog_generator',
    name: 'Content Writer',
    icon: BookOpen,
    color: 'from-orange-600 to-red-600',
    description: 'Sassy Mumbai real estate writer. No fluff, just facts and opinions.',
    greeting: '👋 Content Writer here! I create real estate content with personality. What should we write about?',
  },
  {
    id: 'building_assistant',
    name: 'Building Intel',
    icon: Building2,
    color: 'from-cyan-600 to-blue-600',
    description: 'Building data expert. Fixes locations, enriches profiles, answers queries.',
    greeting: '👋 Building Intelligence here! I can fix building errors, enrich data, or answer questions about any building.',
  },
];

export default function AIHub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [conversations, setConversations] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          navigate(createPageUrl("Home"));
          return;
        }
        setUser(currentUser);
        
        // Load or create conversation for default agent
        await loadOrCreateConversation(AGENTS[0].id);
      } catch (error) {
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const loadOrCreateConversation = async (agentId) => {
    try {
      // Try to find existing conversation for this agent
      const existingConversations = await base44.agents.listConversations({
        agent_name: agentId,
      });

      let conversation;
      if (existingConversations && existingConversations.length > 0) {
        // Use the most recent conversation
        conversation = existingConversations[0];
      } else {
        // Create new conversation
        conversation = await base44.agents.createConversation({
          agent_name: agentId,
          metadata: {
            name: `${AGENTS.find(a => a.id === agentId)?.name} Chat`,
            description: `Admin chat with ${agentId}`,
          }
        });
      }

      setConversations(prev => ({
        ...prev,
        [agentId]: conversation
      }));

      setActiveConversationId(conversation.id);
      setMessages(conversation.messages || []);

    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const switchAgent = async (agent) => {
    setSelectedAgent(agent);
    
    // Check if we already have a conversation for this agent
    if (conversations[agent.id]) {
      setActiveConversationId(conversations[agent.id].id);
      setMessages(conversations[agent.id].messages || []);
    } else {
      // Load or create conversation for this agent
      await loadOrCreateConversation(agent.id);
    }
  };

  const createNewConversation = async () => {
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: selectedAgent.id,
        metadata: {
          name: `${selectedAgent.name} - ${new Date().toLocaleTimeString()}`,
          description: `New chat with ${selectedAgent.id}`,
        }
      });

      setConversations(prev => ({
        ...prev,
        [selectedAgent.id]: conversation
      }));

      setActiveConversationId(conversation.id);
      setMessages([]);
      toast.success('New conversation started!');
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create new conversation');
    }
  };

  useEffect(() => {
    if (!activeConversationId) return;

    const conversation = Object.values(conversations).find(c => c.id === activeConversationId);
    if (!conversation) return;

    const unsubscribe = base44.agents.subscribeToConversation(activeConversationId, (data) => {
      setMessages(data.messages || []);
    });

    return () => unsubscribe();
  }, [activeConversationId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !activeConversationId || isSending) return;

    const userMessage = input.trim();
    setInput("");
    setIsSending(true);

    try {
      const conversation = Object.values(conversations).find(c => c.id === activeConversationId);
      
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: userMessage
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    return (
      <motion.div 
        className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
        initial={{ opacity: 0, x: isUser ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {!isUser && (
          <motion.div 
            className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${selectedAgent.color} flex items-center justify-center flex-shrink-0 shadow-md`}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <selectedAgent.icon className="w-5 h-5 text-white" />
          </motion.div>
        )}
        
        <div className={`max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
          {message.content && (
            <motion.div 
              className={`rounded-2xl px-5 py-3.5 ${
                isUser 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                  : 'bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-md'
              }`}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {isUser ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              ) : (
                <ReactMarkdown 
                  className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  components={{
                    p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="my-0.5">{children}</li>,
                    code: ({ inline, children }) => inline ? (
                      <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto my-2">
                        <code className="text-xs">{children}</code>
                      </pre>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </motion.div>
          )}
          
          {message.tool_calls && message.tool_calls.length > 0 && (
            <div className="space-y-1 mt-2">
              {message.tool_calls.map((toolCall, idx) => (
                <div key={idx} className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-700 font-semibold">
                      {toolCall.name?.split('.').pop() || 'Action'}
                    </span>
                    {toolCall.status === 'running' && (
                      <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                    )}
                    {toolCall.status === 'completed' && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {isUser && (
          <motion.div 
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-md"
            whileHover={{ scale: 1.1 }}
          >
            <User className="w-5 h-5 text-white" />
          </motion.div>
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-medium">Loading AI Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors closeButton />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Hub
              </h1>
              <p className="text-sm text-slate-600">All your AI agents in one place</p>
            </div>
          </div>
        </div>

        {/* Agent Selector - Modern Card Layout */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {AGENTS.map((agent, idx) => {
            const Icon = agent.icon;
            const isActive = selectedAgent.id === agent.id;
            
            return (
              <motion.button
                key={agent.id}
                onClick={() => switchAgent(agent)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: isActive ? 1 : 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative p-6 rounded-xl border transition-all text-left touch-manipulation overflow-hidden ${
                  isActive
                    ? 'bg-white border-slate-900 shadow-lg'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Gradient Overlay for Active */}
                {isActive && (
                  <motion.div 
                    className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-5`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.05 }}
                  />
                )}
                
                <div className="relative flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <motion.div 
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                        isActive 
                          ? `bg-gradient-to-br ${agent.color}` 
                          : `bg-gradient-to-br ${agent.color} opacity-80`
                      }`}
                      whileHover={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </motion.div>
                    
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-md"
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
                      </motion.div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className={`font-bold text-lg mb-2 ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>
                      {agent.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {agent.description}
                    </p>
                  </div>
                  
                  {isActive && (
                    <motion.div 
                      className="flex items-center gap-2 text-xs text-slate-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Active conversation</span>
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Chat Interface - Professional */}
        <motion.div 
          className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          
          {/* Chat Header */}
          <motion.div 
            className="bg-slate-900 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <selectedAgent.icon className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedAgent.name}
                    <motion.div
                      className="w-2 h-2 bg-green-400 rounded-full shadow-lg"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </h2>
                  <p className="text-sm text-white/80 font-medium">AI-Powered Assistant</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={createNewConversation}
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30 h-10 rounded-xl shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Messages Area - Enhanced Design */}
          <div className="h-[550px] overflow-y-auto p-6 space-y-5 bg-gradient-to-br from-slate-50/50 via-purple-50/20 to-blue-50/30 relative">
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(100 100 100) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }} />
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full relative z-10">
                <motion.div 
                  className="text-center max-w-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className={`w-20 h-20 bg-gradient-to-br ${selectedAgent.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl`}
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 4,
                      ease: "easeInOut"
                    }}
                  >
                    <selectedAgent.icon className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <motion.h3 
                    className="text-2xl font-bold text-slate-900 mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {selectedAgent.name}
                  </motion.h3>
                  
                  <motion.p 
                    className="text-sm text-slate-600 mb-6 leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {selectedAgent.greeting}
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Badge className={`bg-gradient-to-r ${selectedAgent.color} text-white border-0 px-4 py-2 text-sm shadow-lg`}>
                      <Sparkles className="w-3 h-3 mr-2" />
                      Ready to assist
                    </Badge>
                  </motion.div>
                </motion.div>
              </div>
            )}
            
            <AnimatePresence initial={false}>
              {messages.map((message, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageBubble message={message} />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isSending && (
              <motion.div 
                className="flex gap-3 justify-start relative z-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div 
                  className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${selectedAgent.color} flex items-center justify-center flex-shrink-0 shadow-md`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <selectedAgent.icon className="w-5 h-5 text-white" />
                </motion.div>
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl px-5 py-3.5 shadow-md">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Loader2 className="w-5 h-5 text-slate-400" />
                    </motion.div>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-slate-400 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 0.6,
                            delay: i * 0.1
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Modern Design */}
          <div className="p-5 bg-white/95 backdrop-blur-sm border-t border-slate-200/50">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Ask ${selectedAgent.name} anything...`}
                  className="flex-1 min-h-[52px] max-h-[120px] resize-none border-slate-200 focus-visible:ring-2 focus-visible:ring-purple-500/50 rounded-2xl bg-white/50 backdrop-blur-sm pr-12"
                  rows={1}
                />
                {input.trim() && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isSending}
                  className={`bg-gradient-to-r ${selectedAgent.color} hover:opacity-90 text-white px-6 h-[52px] rounded-2xl shadow-lg disabled:opacity-50 touch-manipulation relative overflow-hidden`}
                >
                  {isSending && (
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                  )}
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  ) : (
                    <Send className="w-5 h-5 relative z-10" />
                  )}
                </Button>
              </motion.div>
            </div>
            
            <motion.p 
              className="text-xs text-slate-500 mt-3 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-3 h-3" />
              Press Enter to send • Shift+Enter for new line
            </motion.p>
          </div>
        </motion.div>

        {/* QR Code Generator */}
        <div className="mt-6 bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">QR Code Generator</h3>
              <p className="text-xs text-slate-600">Generate QR codes from any text</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Textarea
              placeholder="Paste your text here (e.g., WhatsApp pairing code, URL, etc.)..."
              className="min-h-[80px]"
              id="qr-input"
            />
            <Button
              onClick={async () => {
                const text = document.getElementById('qr-input').value;
                if (!text.trim()) {
                  toast.error('Please enter some text');
                  return;
                }
                
                try {
                  toast.loading('Generating QR code...');
                  const response = await base44.functions.invoke('generateQRCode', {
                    text: text.trim(),
                    size: 400
                  });
                  toast.dismiss();
                  
                  if (response.data.success) {
                    // Open QR code in new window
                    const win = window.open('', '_blank');
                    win.document.write(`
                      <html>
                        <head><title>QR Code</title></head>
                        <body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5;">
                          <div style="text-align:center;padding:20px;">
                            <img src="${response.data.qrCodeDataUrl}" style="max-width:100%;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);" />
                            <p style="margin-top:20px;color:#666;font-family:sans-serif;">Right-click to save image</p>
                          </div>
                        </body>
                      </html>
                    `);
                    toast.success('QR code generated! Opening in new window...');
                  }
                } catch (error) {
                  toast.dismiss();
                  toast.error('Failed to generate QR code: ' + error.message);
                }
              }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Generate QR Code
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-200">
            <h4 className="font-bold text-slate-900 mb-2 text-sm">💡 Quick Tips</h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Switch agents anytime using tabs above</li>
              <li>• Each agent has its own conversation history</li>
              <li>• Start a new chat with the "New Chat" button</li>
            </ul>
          </div>
          
          {selectedAgent.id === 'chariot_master' && (
            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-300">
              <h4 className="font-bold text-purple-900 mb-2 text-sm">🚀 PropAI Sync Examples</h4>
              <ul className="text-xs text-slate-700 space-y-1">
                <li>• "2bhk 80L rent bandra west furnished"</li>
                <li>• "3bhk sale worli 5cr sea view"</li>
                <li>• "Client needs 2bhk under 1cr juhu"</li>
              </ul>
            </div>
          )}
          
          {selectedAgent.id === 'blog_generator' && (
            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-300">
              <h4 className="font-bold text-orange-900 mb-2 text-sm">📝 Content Examples</h4>
              <ul className="text-xs text-slate-700 space-y-1">
                <li>• "Write about Pali Hill vs Carter Road"</li>
                <li>• "Guide for expats renting in Bandra"</li>
                <li>• "Why BKC rents are dropping in 2025"</li>
              </ul>
            </div>
          )}
          
          {selectedAgent.id === 'building_assistant' && (
            <div className="bg-cyan-50 rounded-2xl p-4 border border-cyan-300">
              <h4 className="font-bold text-cyan-900 mb-2 text-sm">🏗️ Building Intel Examples</h4>
              <ul className="text-xs text-slate-700 space-y-1">
                <li>• "Tell me about Maker Tower"</li>
                <li>• "Ekta Trinity is Santacruz West, not Bandra"</li>
                <li>• "Enrich Oberoi Sky Heights profile"</li>
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}