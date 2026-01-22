import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Inbox, Users, X, Loader2, Building2, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import { format } from "date-fns";

export default function BrokerInbox() {
  const [user, setUser] = useState(null);
  const [brokerProfile, setBrokerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [composingNew, setComposingNew] = useState(false);
  const [recipientBrokerId, setRecipientBrokerId] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        setUser(currentUser);

        if (currentUser.broker_id) {
          const brokers = await base44.entities.Broker.list();
          const broker = brokers.find(b => b.id === currentUser.broker_id);
          setBrokerProfile(broker);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        base44.auth.redirectToLogin(window.location.pathname);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ['broker-messages', brokerProfile?.id],
    queryFn: () => base44.entities.BrokerMessage.list('-created_date'),
    enabled: !!brokerProfile,
    refetchInterval: 5000,
    initialData: []
  });

  const { data: allBrokers = [] } = useQuery({
    queryKey: ['all-brokers'],
    queryFn: () => base44.entities.Broker.list(),
    initialData: []
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.BrokerMessage.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries(['broker-messages']);
      setNewMessage("");
      setComposingNew(false);
      toast.success('Message sent!');
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.BrokerMessage.update(id, { 
      is_read: true, 
      read_at: new Date().toISOString() 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['broker-messages']);
    }
  });

  const threads = messages.reduce((acc, msg) => {
    const otherBrokerId = msg.sender_broker_id === brokerProfile?.id 
      ? msg.recipient_broker_id 
      : msg.sender_broker_id;
    
    const threadKey = msg.thread_id || otherBrokerId;
    
    if (!acc[threadKey]) {
      acc[threadKey] = {
        id: threadKey,
        otherBrokerId,
        otherBrokerName: msg.sender_broker_id === brokerProfile?.id 
          ? msg.recipient_name 
          : msg.sender_name,
        messages: [],
        lastMessage: msg,
        unreadCount: 0
      };
    }
    
    acc[threadKey].messages.push(msg);
    
    if (!msg.is_read && msg.recipient_broker_id === brokerProfile?.id) {
      acc[threadKey].unreadCount++;
    }
    
    if (new Date(msg.created_date) > new Date(acc[threadKey].lastMessage.created_date)) {
      acc[threadKey].lastMessage = msg;
    }
    
    return acc;
  }, {});

  const threadsList = Object.values(threads).sort((a, b) => 
    new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
  );

  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
    thread.messages
      .filter(m => !m.is_read && m.recipient_broker_id === brokerProfile.id)
      .forEach(m => markAsReadMutation.mutate({ id: m.id }));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    const messageData = {
      sender_broker_id: brokerProfile.id,
      sender_name: brokerProfile.name,
      recipient_broker_id: selectedThread.otherBrokerId,
      recipient_name: selectedThread.otherBrokerName,
      message: newMessage.trim(),
      thread_id: selectedThread.id,
      message_type: "general"
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleSendNewMessage = async () => {
    if (!newMessage.trim() || !recipientBrokerId) {
      toast.error('Please select a broker and enter a message');
      return;
    }

    const recipient = allBrokers.find(b => b.id === recipientBrokerId);
    if (!recipient) return;

    const messageData = {
      sender_broker_id: brokerProfile.id,
      sender_name: brokerProfile.name,
      recipient_broker_id: recipientBrokerId,
      recipient_name: recipient.name,
      message: newMessage.trim(),
      subject: messageSubject.trim() || "New message",
      thread_id: `${brokerProfile.id}_${recipientBrokerId}_${Date.now()}`,
      message_type: "general"
    };

    sendMessageMutation.mutate(messageData);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread?.messages]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
      </div>
    );
  }

  if (!brokerProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Broker Profile Required</h2>
          <p className="text-slate-600 mb-4">Complete your broker profile to access messaging</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors closeButton />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Inbox</h1>
              <p className="text-sm text-slate-600">Direct messaging with brokers</p>
            </div>
          </div>
          <Button
            onClick={() => setComposingNew(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Threads List */}
          <Card className="md:col-span-1 p-4 overflow-y-auto bg-white border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Conversations ({threadsList.length})
            </h3>

            {threadsList.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {threadsList.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => handleSelectThread(thread)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedThread?.id === thread.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-slate-900 text-sm">{thread.otherBrokerName}</p>
                      {thread.unreadCount > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs">{thread.unreadCount}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{thread.lastMessage.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(thread.lastMessage.created_date), 'MMM d, h:mm a')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Messages View */}
          <Card className="md:col-span-2 flex flex-col bg-white border border-slate-200">
            {composingNew ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">New Message</h3>
                  <Button variant="ghost" size="sm" onClick={() => setComposingNew(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">To:</label>
                    <select
                      value={recipientBrokerId}
                      onChange={(e) => setRecipientBrokerId(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select a broker...</option>
                      {allBrokers
                        .filter(b => b.id !== brokerProfile.id)
                        .map(broker => (
                          <option key={broker.id} value={broker.id}>
                            {broker.name} - {broker.agency_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Subject (optional):</label>
                    <Input
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      placeholder="What's this about?"
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Message:</label>
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="min-h-[200px]"
                    />
                  </div>

                  <Button
                    onClick={handleSendNewMessage}
                    disabled={sendMessageMutation.isLoading || !recipientBrokerId || !newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            ) : selectedThread ? (
              <>
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{selectedThread.otherBrokerName}</p>
                      <p className="text-xs text-slate-600">{selectedThread.messages.length} messages</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedThread(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                  {selectedThread.messages
                    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                    .map((msg) => {
                      const isMine = msg.sender_broker_id === brokerProfile.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isMine ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-900'} rounded-lg p-4`}>
                            {msg.subject && (
                              <p className="font-bold text-sm mb-2">{msg.subject}</p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p className={`text-xs mt-2 ${isMine ? 'text-blue-100' : 'text-slate-500'}`}>
                              {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-200 bg-white">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 min-h-[60px] max-h-[120px]"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isLoading || !newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white self-end"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Select a conversation to view messages</p>
                  <p className="text-sm text-slate-500 mt-2">or start a new conversation</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}