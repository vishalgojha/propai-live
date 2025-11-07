import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Zap, Send, Loader2, CheckCircle2, AlertCircle, Home,
  MessageCircle, Database, ArrowLeft, Sparkles, TrendingUp,
  RefreshCw, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function PropAIConsole() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mode selection
  const [mode, setMode] = useState('parse'); // 'parse' or 'chat'
  
  // Input
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Feed data
  const [listings, setListings] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedStats, setFeedStats] = useState(null);
  
  // Chat history
  const [chatHistory, setChatHistory] = useState([]);
  
  const chatEndRef = useRef(null);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
          navigate(createPageUrl("Home"));
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Load feed data
  const loadFeed = async () => {
    try {
      setFeedLoading(true);
      const response = await base44.functions.invoke('apiListings', {
        limit: 20,
        status: 'Active'
      });

      if (response.data?.success) {
        setListings(response.data.data);
        setFeedStats(response.data.stats);
      }
    } catch (error) {
      console.error('Feed load error:', error);
      toast.error('Failed to load listings');
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadFeed();
    }
  }, [isAuthorized]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handle parse
  const handleParse = async () => {
    if (!input.trim()) {
      toast.error('Please enter a listing message');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('🤖 Parsing property listing...');

    try {
      const response = await base44.functions.invoke('apiParse', {
        message: input,
        mode: 'property'
      });

      toast.dismiss(loadingToast);

      if (response.data?.success) {
        const property = response.data.data;
        
        toast.success('✅ Property Created!', {
          description: `${property.custom_id}: ${property.ai_title}`,
          duration: 5000
        });

        // Add to chat history
        setChatHistory(prev => [...prev, {
          type: 'parse',
          input: input,
          output: property,
          timestamp: new Date()
        }]);

        // Refresh feed
        loadFeed();
        
        // Clear input
        setInput('');
      } else {
        toast.error('❌ Parsing Failed', {
          description: response.data?.error || 'Unknown error',
          duration: 5000
        });

        setChatHistory(prev => [...prev, {
          type: 'parse_error',
          input: input,
          error: response.data?.error,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Request Failed', {
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle chat
  const handleChat = async () => {
    if (!input.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSubmitting(true);

    // Add user message to history
    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await base44.functions.invoke('apiChat', {
        message: input
      });

      if (response.data?.success) {
        setChatHistory(prev => [...prev, {
          type: 'assistant',
          content: response.data.message,
          context: response.data.context,
          timestamp: new Date()
        }]);
      } else {
        toast.error('Chat request failed');
      }
    } catch (error) {
      toast.error('Chat error: ' + error.message);
      setChatHistory(prev => [...prev, {
        type: 'error',
        content: error.message,
        timestamp: new Date()
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'parse') {
      handleParse();
    } else {
      handleChat();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(createPageUrl("Admin"))}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">PropAI Console</h1>
                <p className="text-xs text-slate-500">Power tools for property management</p>
              </div>
            </div>
          </div>

          {feedStats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <p className="font-semibold text-slate-900">{feedStats.total_matched}</p>
                <p className="text-xs text-slate-500">Active Listings</p>
              </div>
              <Button
                onClick={loadFeed}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout: Split View */}
      <div className="flex h-[calc(100vh-73px)]">
        
        {/* LEFT: SmartFeed */}
        <div className="w-1/2 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Live SmartFeed
              </h2>
              <Badge variant="outline" className="text-xs">
                {listings.length} listings
              </Badge>
            </div>

            {feedLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {listings.map((listing, idx) => (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">
                                {listing.title}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <span>{listing.bhk}</span>
                                <span>•</span>
                                <span>{listing.location}</span>
                              </div>
                            </div>
                            <Badge className="bg-amber-500 text-white border-0 ml-2">
                              {listing.price_display}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {listing.custom_id}
                              </Badge>
                              {listing.broker_trust_score >= 70 && (
                                <Badge className="bg-green-500/20 text-green-700 border-green-500 text-xs">
                                  Trusted
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              {new Date(listing.created_date).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Parser + Chat */}
        <div className="w-1/2 bg-slate-50 flex flex-col">
          
          {/* Mode Selector */}
          <div className="bg-white border-b border-slate-200 p-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setMode('parse')}
                variant={mode === 'parse' ? 'default' : 'outline'}
                size="sm"
                className={mode === 'parse' ? 'bg-purple-600' : ''}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Parser
              </Button>
              <Button
                onClick={() => setMode('chat')}
                variant={mode === 'chat' ? 'default' : 'outline'}
                size="sm"
                className={mode === 'chat' ? 'bg-indigo-600' : ''}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Concierge Chat
              </Button>
            </div>
          </div>

          {/* Chat/Parse History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {chatHistory.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {item.type === 'user' && (
                    <div className="flex justify-end">
                      <div className="bg-purple-600 text-white rounded-2xl px-4 py-2 max-w-[80%]">
                        <p className="text-sm">{item.content}</p>
                      </div>
                    </div>
                  )}

                  {item.type === 'assistant' && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl px-4 py-2 max-w-[80%] shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-700">{item.content}</p>
                      </div>
                    </div>
                  )}

                  {item.type === 'parse' && (
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          Property Created
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm font-semibold text-slate-900">{item.output.ai_title}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">{item.output.custom_id}</Badge>
                          <Badge className="bg-amber-500 text-white border-0">
                            {item.output.broker_name}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {item.type === 'parse_error' && (
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-700">Parsing Failed</p>
                            <p className="text-xs text-red-600 mt-1">{item.error}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-slate-200 p-4">
            <div className="space-y-3">
              <Textarea
                placeholder={
                  mode === 'parse'
                    ? 'Paste broker listing here (e.g., "2bhk khar 2.5L fully furnished, Contact Ramesh 9820056789")'
                    : 'Ask anything about properties, brokers, or insights...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="min-h-[100px] resize-none"
              />
              
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  {mode === 'parse' ? '⚡ Fast parser mode' : '💬 AI-powered insights'}
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !input.trim()}
                  className={mode === 'parse' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {mode === 'parse' ? 'Parse & Create' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}