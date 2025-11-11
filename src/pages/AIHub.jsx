import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot, Send, Loader2, Zap, BookOpen, Building2, 
  Sparkles, MessageCircle, Trash2, Plus, User, X
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
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className={`h-8 w-8 rounded-xl bg-gradient-to-r ${selectedAgent.color} flex items-center justify-center flex-shrink-0`}>
            <selectedAgent.icon className="w-4 h-4 text-white" />
          </div>
        )}
        
        <div className={`max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
          {message.content && (
            <div className={`rounded-2xl px-4 py-3 ${
              isUser 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                : 'bg-white border border-slate-200'
            }`}>
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
            </div>
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
          <div className="h-8 w-8 rounded-xl bg-slate-600 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
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

        {/* Agent Selector */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const isActive = selectedAgent.id === agent.id;
            
            return (
              <button
                key={agent.id}
                onClick={() => switchAgent(agent)}
                className={`p-4 rounded-2xl border-2 transition-all text-left touch-manipulation ${
                  isActive
                    ? `bg-gradient-to-r ${agent.color} text-white border-transparent shadow-lg`
                    : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-white/20' : `bg-gradient-to-r ${agent.color}`
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold mb-1 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {agent.name}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isActive ? 'text-white/80' : 'text-slate-600'}`}>
                      {agent.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="flex-shrink-0">
                      <Badge className="bg-white/20 text-white border-white/40">
                        Active
                      </Badge>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Chat Interface */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-purple-200 shadow-xl overflow-hidden">
          
          {/* Chat Header */}
          <div className={`bg-gradient-to-r ${selectedAgent.color} p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <selectedAgent.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{selectedAgent.name}</h2>
                <p className="text-xs text-white/80">AI Agent</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={createNewConversation}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Chat
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-slate-50 to-purple-50/30">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className={`w-16 h-16 bg-gradient-to-r ${selectedAgent.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <selectedAgent.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {selectedAgent.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    {selectedAgent.greeting}
                  </p>
                  <Badge className={`bg-gradient-to-r ${selectedAgent.color} text-white border-0`}>
                    Start chatting below
                  </Badge>
                </div>
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
              <div className="flex gap-3 justify-start">
                <div className={`h-8 w-8 rounded-xl bg-gradient-to-r ${selectedAgent.color} flex items-center justify-center flex-shrink-0`}>
                  <selectedAgent.icon className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    <span className="text-sm text-slate-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t-2 border-purple-200">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Message ${selectedAgent.name}...`}
                className="flex-1 min-h-[44px] max-h-[120px] resize-none border-purple-200 focus-visible:ring-purple-500"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isSending}
                className={`bg-gradient-to-r ${selectedAgent.color} hover:opacity-90 text-white px-6 h-11 touch-manipulation`}
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-slate-500 mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
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