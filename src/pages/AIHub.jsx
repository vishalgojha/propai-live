import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot, Send, Loader2, Zap, BookOpen, Building2, 
  Sparkles, Plus, User
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
    color: 'blue-600',
    description: 'Super-fast property & requirement parser. Processes WhatsApp listings instantly.',
    greeting: '👋 PropAI Sync here! Send me property listings or requirements and I\'ll process them in seconds! 🚀',
  },
  {
    id: 'blog_generator',
    name: 'Content Writer',
    icon: BookOpen,
    color: 'orange-600',
    description: 'Sassy Mumbai real estate writer. No fluff, just facts and opinions.',
    greeting: '👋 Content Writer here! I create real estate content with personality. What should we write about?',
  },
  {
    id: 'building_assistant',
    name: 'Building Intel',
    icon: Building2,
    color: 'cyan-600',
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

    return (
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className={`h-10 w-10 rounded-xl bg-${selectedAgent.color} flex items-center justify-center flex-shrink-0`}>
            <selectedAgent.icon className="w-5 h-5 text-white" />
          </div>
        )}
        
        <div className={`max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
          {message.content && (
            <div className={`rounded-xl px-4 py-3 ${
                isUser 
                  ? 'bg-slate-900 text-white' 
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
          <div className="h-10 w-10 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
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
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                AI Hub
              </h1>
              <p className="text-sm text-slate-600">All your AI agents in one place</p>
            </div>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="mb-6 flex gap-2">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const isActive = selectedAgent.id === agent.id;
            
            return (
              <button
                key={agent.id}
                onClick={() => switchAgent(agent)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all touch-manipulation ${
                  isActive
                    ? 'bg-white border-blue-600 text-blue-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{agent.name}</span>
              </button>
            );
          })}
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Chat Header */}
          <div className="bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <selectedAgent.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedAgent.name}</h2>
                  <p className="text-xs text-white/70">AI Assistant</p>
                </div>
              </div>
              
              <Button
                onClick={createNewConversation}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-[550px] overflow-y-auto p-6 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className={`w-16 h-16 bg-${selectedAgent.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <selectedAgent.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{selectedAgent.name}</h3>
                  <p className="text-sm text-slate-600">{selectedAgent.greeting}</p>
                </div>
              </div>
            )}
            
            {messages.map((message, idx) => (
              <MessageBubble key={idx} message={message} />
            ))}
            
            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className={`h-10 w-10 rounded-xl bg-${selectedAgent.color} flex items-center justify-center flex-shrink-0`}>
                  <selectedAgent.icon className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
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
                placeholder={`Ask ${selectedAgent.name} anything...`}
                className="flex-1 min-h-[48px] max-h-[120px] resize-none rounded-lg"
                rows={1}
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isSending}
                className={`bg-${selectedAgent.color} hover:opacity-90 text-white px-5 h-[48px] rounded-lg disabled:opacity-50`}
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}