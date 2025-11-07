import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Users, MessageCircle, Star, Package, Eye, Send, ThumbsUp,
  AlertCircle, TrendingUp, Clock, CheckCircle2, EyeOff, Share2,
  Sparkles, Filter, Search, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function AgentHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inbox");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [newMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [shareOffMarketModalOpen, setShareOffMarketModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [messageForm, setMessageForm] = useState({
    to_agent_id: "",
    subject: "",
    message: "",
    priority: "Medium",
    property_id: "",
    requirement_id: ""
  });

  const [recommendForm, setRecommendForm] = useState({
    to_agent_id: "",
    property_id: "",
    requirement_id: "",
    recommendation_reason: "",
    priority: "Medium"
  });

  const [offMarketForm, setOffMarketForm] = useState({
    property_id: "",
    to_agent_id: "",
    message: "",
    expected_listing_date: ""
  });

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
          navigate(createPageUrl("Home"));
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Queries
  const { data: collaborations = [], isLoading: collabLoading } = useQuery({
    queryKey: ['agent-collaborations'],
    queryFn: () => base44.entities.AgentCollaboration.list('-created_date'),
    initialData: [],
    enabled: !!currentUser,
    refetchInterval: 10000
  });

  const { data: allAgents = [] } = useQuery({
    queryKey: ['all-agents'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role === 'admin' || u.role === 'agent');
    },
    initialData: [],
    enabled: !!currentUser
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['agent-properties'],
    queryFn: () => base44.entities.Property.list('-created_date', 500),
    initialData: [],
    enabled: !!currentUser
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['agent-requirements'],
    queryFn: () => base44.entities.Requirement.filter({ status: "Active" }, '-created_date'),
    initialData: [],
    enabled: !!currentUser
  });

  // Mutations
  const createCollabMutation = useMutation({
    mutationFn: (data) => base44.entities.AgentCollaboration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-collaborations'] });
      toast.success('✅ Sent successfully!');
      setNewMessageModalOpen(false);
      setRecommendModalOpen(false);
      setShareOffMarketModalOpen(false);
      resetForms();
    }
  });

  const updateCollabMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AgentCollaboration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-collaborations'] });
      toast.success('✅ Updated!');
    }
  });

  const resetForms = () => {
    setMessageForm({ to_agent_id: "", subject: "", message: "", priority: "Medium", property_id: "", requirement_id: "" });
    setRecommendForm({ to_agent_id: "", property_id: "", requirement_id: "", recommendation_reason: "", priority: "Medium" });
    setOffMarketForm({ property_id: "", to_agent_id: "", message: "", expected_listing_date: "" });
  };

  // Filter collaborations
  const filteredCollaborations = useMemo(() => {
    if (!currentUser) return [];

    let items = collaborations;

    // Tab filter
    if (activeTab === "inbox") {
      items = items.filter(c => c.to_agent_id === currentUser.id || c.visibility === "all_agents");
    } else if (activeTab === "sent") {
      items = items.filter(c => c.from_agent_id === currentUser.id);
    } else if (activeTab === "off-market") {
      items = items.filter(c => c.collaboration_type === "off_market_share");
    } else if (activeTab === "recommendations") {
      items = items.filter(c => c.collaboration_type === "property_recommendation");
    }

    // Status filter
    if (statusFilter !== "all") {
      items = items.filter(c => c.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      items = items.filter(c => c.collaboration_type === typeFilter);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(c =>
        c.subject?.toLowerCase().includes(query) ||
        c.message?.toLowerCase().includes(query) ||
        c.property_summary?.toLowerCase().includes(query) ||
        c.requirement_summary?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [collaborations, currentUser, activeTab, statusFilter, typeFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!currentUser) return {};

    const myInbox = collaborations.filter(c => c.to_agent_id === currentUser.id);
    const unread = myInbox.filter(c => c.status === "Unread").length;
    const urgent = myInbox.filter(c => c.priority === "Urgent" && c.status === "Unread").length;
    const offMarket = collaborations.filter(c => c.collaboration_type === "off_market_share").length;
    const recommendations = collaborations.filter(c => c.collaboration_type === "property_recommendation" && c.to_agent_id === currentUser.id).length;

    return { unread, urgent, offMarket, recommendations };
  }, [collaborations, currentUser]);

  // Off-market properties
  const offMarketProperties = useMemo(() => {
    return properties.filter(p => 
      p.visibility === "off_market" || 
      p.visibility === "agents_only" || 
      p.visibility === "coming_soon"
    );
  }, [properties]);

  // Handlers
  const handleSendMessage = async () => {
    if (!messageForm.subject || !messageForm.message) {
      toast.error('Please fill subject and message');
      return;
    }

    const data = {
      collaboration_type: "message",
      from_agent_id: currentUser.id,
      from_agent_name: currentUser.full_name || currentUser.email,
      to_agent_id: messageForm.to_agent_id || null,
      to_agent_name: messageForm.to_agent_id ? allAgents.find(a => a.id === messageForm.to_agent_id)?.full_name : null,
      subject: messageForm.subject,
      message: messageForm.message,
      priority: messageForm.priority,
      property_id: messageForm.property_id || null,
      requirement_id: messageForm.requirement_id || null,
      visibility: messageForm.to_agent_id ? "private" : "all_agents"
    };

    createCollabMutation.mutate(data);
  };

  const handleSendRecommendation = async () => {
    if (!recommendForm.property_id || !recommendForm.requirement_id) {
      toast.error('Please select property and requirement');
      return;
    }

    const property = properties.find(p => p.id === recommendForm.property_id);
    const requirement = requirements.find(r => r.id === recommendForm.requirement_id);

    const data = {
      collaboration_type: "property_recommendation",
      from_agent_id: currentUser.id,
      from_agent_name: currentUser.full_name || currentUser.email,
      to_agent_id: recommendForm.to_agent_id || null,
      to_agent_name: recommendForm.to_agent_id ? allAgents.find(a => a.id === recommendForm.to_agent_id)?.full_name : null,
      property_id: recommendForm.property_id,
      property_summary: property ? `${property.bhk} in ${property.location} - ₹${property.price}${property.price_unit === 'crores' ? ' Cr' : 'L'}` : null,
      requirement_id: recommendForm.requirement_id,
      requirement_summary: requirement ? `${requirement.client_name} - ${requirement.bhk_preference?.join("/")}` : null,
      subject: `Property Match: ${property?.ai_title || property?.building_name}`,
      recommendation_reason: recommendForm.recommendation_reason,
      priority: recommendForm.priority,
      visibility: recommendForm.to_agent_id ? "private" : "all_agents"
    };

    createCollabMutation.mutate(data);
  };

  const handleShareOffMarket = async () => {
    if (!offMarketForm.property_id) {
      toast.error('Please select a property');
      return;
    }

    const property = properties.find(p => p.id === offMarketForm.property_id);

    const data = {
      collaboration_type: "off_market_share",
      from_agent_id: currentUser.id,
      from_agent_name: currentUser.full_name || currentUser.email,
      to_agent_id: offMarketForm.to_agent_id || null,
      to_agent_name: offMarketForm.to_agent_id ? allAgents.find(a => a.id === offMarketForm.to_agent_id)?.full_name : null,
      property_id: offMarketForm.property_id,
      property_summary: property ? `${property.bhk} in ${property.location} - ₹${property.price}${property.price_unit === 'crores' ? ' Cr' : 'L'}` : null,
      subject: `Off-Market: ${property?.building_name || property?.location}`,
      message: offMarketForm.message,
      visibility: offMarketForm.to_agent_id ? "private" : "all_agents"
    };

    createCollabMutation.mutate(data);
  };

  const handleMarkAsRead = (item) => {
    if (item.status === "Unread") {
      updateCollabMutation.mutate({
        id: item.id,
        data: { status: "Read", read_at: new Date().toISOString() }
      });
    }
  };

  const handleViewProperty = (propertyId) => {
    navigate(createPageUrl("PropertyDetails") + `?id=${propertyId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 font-medium">Loading Agent Hub...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <Toaster position="top-center" richColors closeButton />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Agent Hub</h1>
                <p className="text-slate-600">Internal collaboration & off-market listings</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShareOffMarketModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Share Off-Market
              </Button>
              <Button
                onClick={() => setRecommendModalOpen(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
              >
                <Star className="w-4 h-4 mr-2" />
                Recommend
              </Button>
              <Button
                onClick={() => setNewMessageModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-2 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.urgent || 0}</p>
                  <p className="text-xs text-slate-600">Urgent</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border-2 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.unread || 0}</p>
                  <p className="text-xs text-slate-600">Unread</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border-2 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.offMarket || 0}</p>
                  <p className="text-xs text-slate-600">Off-Market</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border-2 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.recommendations || 0}</p>
                  <p className="text-xs text-slate-600">Recommendations</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search messages, properties, requirements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Unread">Unread</SelectItem>
                <SelectItem value="Read">Read</SelectItem>
                <SelectItem value="Actioned">Actioned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
                <SelectItem value="property_recommendation">Recommendations</SelectItem>
                <SelectItem value="off_market_share">Off-Market</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border-2 border-slate-200">
            <TabsTrigger value="inbox" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Inbox {stats.unread > 0 && `(${stats.unread})`}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="w-4 h-4" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="off-market" className="gap-2">
              <EyeOff className="w-4 h-4" />
              Off-Market ({offMarketProperties.length})
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-2">
              <Star className="w-4 h-4" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          {/* Content */}
          <TabsContent value={activeTab} className="space-y-3">
            {collabLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
              </div>
            ) : filteredCollaborations.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border-2 border-slate-200">
                <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No items found</h3>
                <p className="text-slate-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCollaborations.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                      item.status === "Unread" ? "border-blue-300 bg-blue-50/50" : "border-slate-200"
                    } hover:shadow-md`}
                    onClick={() => {
                      handleMarkAsRead(item);
                      setSelectedItem(item);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.collaboration_type === "message" ? "bg-blue-100" :
                          item.collaboration_type === "property_recommendation" ? "bg-green-100" :
                          "bg-purple-100"
                        }`}>
                          {item.collaboration_type === "message" && <MessageCircle className="w-5 h-5 text-blue-600" />}
                          {item.collaboration_type === "property_recommendation" && <Star className="w-5 h-5 text-green-600" />}
                          {item.collaboration_type === "off_market_share" && <EyeOff className="w-5 h-5 text-purple-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 truncate">{item.subject}</h3>
                            {item.priority === "Urgent" && (
                              <Badge className="bg-red-500 text-white">Urgent</Badge>
                            )}
                            {item.status === "Unread" && (
                              <Badge className="bg-blue-500 text-white">New</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">
                            {item.from_agent_id === currentUser.id ? "You" : item.from_agent_name} → {item.to_agent_id === currentUser.id ? "You" : item.to_agent_name || "All Agents"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-500">{format(new Date(item.created_date), 'MMM d, h:mm a')}</p>
                        {item.status === "Actioned" && (
                          <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto mt-1" />
                        )}
                      </div>
                    </div>

                    {item.property_summary && (
                      <div className="bg-slate-50 rounded-xl p-3 mb-2">
                        <p className="text-xs text-slate-600 mb-1">Property:</p>
                        <p className="text-sm font-semibold text-slate-900">{item.property_summary}</p>
                      </div>
                    )}

                    {item.requirement_summary && (
                      <div className="bg-amber-50 rounded-xl p-3 mb-2">
                        <p className="text-xs text-amber-600 mb-1">Requirement:</p>
                        <p className="text-sm font-semibold text-amber-900">{item.requirement_summary}</p>
                      </div>
                    )}

                    <p className="text-sm text-slate-700 line-clamp-2">{item.message || item.recommendation_reason}</p>

                    {item.property_id && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProperty(item.property_id);
                        }}
                        size="sm"
                        variant="outline"
                        className="mt-3"
                      >
                        <Eye className="w-3 h-3 mr-2" />
                        View Property
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* New Message Modal */}
        <Dialog open={newMessageModalOpen} onOpenChange={setNewMessageModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                New Message
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">To:</label>
                <Select value={messageForm.to_agent_id} onValueChange={(val) => setMessageForm({...messageForm, to_agent_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Agents</SelectItem>
                    {allAgents.filter(a => a.id !== currentUser.id).map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name || agent.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Priority:</label>
                <Select value={messageForm.priority} onValueChange={(val) => setMessageForm({...messageForm, priority: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="Subject"
                value={messageForm.subject}
                onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
              />
              <Textarea
                placeholder="Your message..."
                value={messageForm.message}
                onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                className="h-32"
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewMessageModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} className="bg-blue-600 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Recommend Property Modal */}
        <Dialog open={recommendModalOpen} onOpenChange={setRecommendModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-green-600" />
                Recommend Property
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">To Agent:</label>
                <Select value={recommendForm.to_agent_id} onValueChange={(val) => setRecommendForm({...recommendForm, to_agent_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Agents</SelectItem>
                    {allAgents.filter(a => a.id !== currentUser.id).map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name || agent.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Property:</label>
                <Select value={recommendForm.property_id} onValueChange={(val) => setRecommendForm({...recommendForm, property_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.filter(p => p.status === "Active").slice(0, 50).map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.custom_id} - {prop.bhk} in {prop.location} - ₹{prop.price}{prop.price_unit === 'crores' ? ' Cr' : 'L'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">For Requirement:</label>
                <Select value={recommendForm.requirement_id} onValueChange={(val) => setRecommendForm({...recommendForm, requirement_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select requirement" />
                  </SelectTrigger>
                  <SelectContent>
                    {requirements.slice(0, 50).map(req => (
                      <SelectItem key={req.id} value={req.id}>
                        {req.custom_id} - {req.client_name} ({req.bhk_preference?.join("/")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="Why this is a good match..."
                value={recommendForm.recommendation_reason}
                onChange={(e) => setRecommendForm({...recommendForm, recommendation_reason: e.target.value})}
                className="h-24"
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRecommendModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendRecommendation} className="bg-green-600 text-white">
                  <Star className="w-4 h-4 mr-2" />
                  Send Recommendation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Off-Market Modal */}
        <Dialog open={shareOffMarketModalOpen} onOpenChange={setShareOffMarketModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-purple-600" />
                Share Off-Market Listing
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Property:</label>
                <Select value={offMarketForm.property_id} onValueChange={(val) => setOffMarketForm({...offMarketForm, property_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select off-market property" />
                  </SelectTrigger>
                  <SelectContent>
                    {offMarketProperties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.custom_id} - {prop.bhk} in {prop.location} - {prop.visibility}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Share With:</label>
                <Select value={offMarketForm.to_agent_id} onValueChange={(val) => setOffMarketForm({...offMarketForm, to_agent_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Agents</SelectItem>
                    {allAgents.filter(a => a.id !== currentUser.id).map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name || agent.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="Additional notes about this off-market property..."
                value={offMarketForm.message}
                onChange={(e) => setOffMarketForm({...offMarketForm, message: e.target.value})}
                className="h-24"
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShareOffMarketModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleShareOffMarket} className="bg-purple-600 text-white">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Listing
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}