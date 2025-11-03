
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Users, MessageCircle, Phone, Star, Search, Filter,
  Eye, CheckCircle2, Edit2, Download, MapPin, Shield, Building2,
  Sparkles, Clock, TrendingUp, MessageSquare, Send, ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AdminBrokers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewPropertiesModalOpen, setViewPropertiesModalOpen] = useState(false); // New state for properties modal
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // AI Assistant States
  const [aiAssistantModalOpen, setAiAssistantModalOpen] = useState(false);
  const [selectedBrokerForAI, setSelectedBrokerForAI] = useState(null);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [brokerAnalytics, setBrokerAnalytics] = useState(null);
  const [conversationText, setConversationText] = useState("");

  const queryClient = useQueryClient();

  // Check if user is admin
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
        console.error("Authorization check failed:", error); // Log the error for debugging
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: brokers = [], isLoading: brokersLoading } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => base44.entities.Broker.list('-last_activity'),
    initialData: [],
    enabled: isAuthorized,
  });

  const { data: allProperties = [] } = useQuery({
    queryKey: ['all-properties'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    initialData: [],
    enabled: isAuthorized,
  });

  const updateBrokerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Broker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      queryClient.invalidateQueries({ queryKey: ['all-properties'] }); // Invalidate properties too if relevant
      setEditModalOpen(false);
      setSelectedBroker(null);
    },
  });

  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = !searchQuery ||
      broker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.phone?.includes(searchQuery) ||
      broker.agency_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.areas_covered?.some(area => area.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || broker.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getBrokerProperties = (brokerId) => {
    return allProperties.filter(p => p.broker_id === brokerId);
  };

  const stats = {
    total: brokers.length,
    active: brokers.filter(b => b.status === "Active").length,
    verified: brokers.filter(b => b.verified).length,
    blacklisted: brokers.filter(b => b.status === "Blacklisted").length,
    totalListings: brokers.reduce((sum, b) => sum + (b.total_listings_count || 0), 0),
    // Using filtered properties for active listings count in stats
    activeListings: allProperties.filter(p => p.status === "Active").length,
  };

  const handleWhatsApp = (broker) => {
    const properties = getBrokerProperties(broker.id);
    
    let message = `Hi ${broker.name}, this is Chariot Realty.\n\n`;
    
    if (properties.length > 0) {
      message += `Regarding your ${properties.length} listing${properties.length > 1 ? 's' : ''}:\n\n`;
      properties.slice(0, 3).forEach((prop, idx) => {
        message += `${idx + 1}. ${prop.bhk || 'Property'} in ${prop.location || 'Mumbai'}\n`;
        message += `   ${prop.building_name ? `${prop.building_name}, ` : ''}`;
        message += `₹${prop.price}${prop.price_unit === 'crores' ? ' Cr' : 'L'}\n`;
        if (prop.custom_id) message += `   ID: ${prop.custom_id}\n`;
        message += '\n';
      });
      if (properties.length > 3) {
        message += `...and ${properties.length - 3} more listing${properties.length - 3 > 1 ? 's' : ''}\n\n`;
      }
      message += `Can we discuss these listings? Need updated photos, availability, and viewing schedule.`;
    } else {
      message += `Can we discuss potential property listings in ${broker.areas_covered?.join(', ') || 'your areas'}?`;
    }
    
    window.open(`https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleViewListings = (broker) => {
    setSelectedBroker(broker);
    setViewPropertiesModalOpen(true);
  };

  const handleExportCSV = () => {
    const csv = [
      ['ID', 'Name', 'Phone', 'Agency', 'Total Listings', 'Active Listings', 'Status', 'Rating', 'Areas'].join(','),
      ...filteredBrokers.map(b => [
        b.custom_id || b.id,
        b.name,
        b.phone,
        b.agency_name || '',
        b.total_listings_count || 0,
        getBrokerProperties(b.id).length, // Use actual active listings from allProperties
        b.status,
        b.reliability_rating || '',
        (b.areas_covered || []).join('; ')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chariot-brokers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handleGenerateFollowUp = async (broker, propertyId = null, context = "") => {
    setFollowUpLoading(true);
    setSelectedBrokerForAI(broker); // Ensure broker is selected for AI modal
    setBrokerAnalytics(null); // Clear previous analytics
    setFollowUpMessage(""); // Clear previous message
    setAiAssistantModalOpen(true); // Open modal immediately for feedback

    try {
      const response = await base44.functions.invoke('generateBrokerFollowUp', {
        brokerId: broker.id,
        propertyId,
        context
      });

      setFollowUpMessage(response.data.message);
      setBrokerAnalytics({
        recommendations: response.data.recommendations,
        whatsappUrl: response.data.whatsappUrl
      });
    } catch (error) {
      console.error('Error generating follow-up:', error);
      alert('Failed to generate follow-up message');
      setAiAssistantModalOpen(false); // Close if error
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleAnalyzeBroker = async (broker) => {
    setSelectedBrokerForAI(broker);
    setBrokerAnalytics(null); // Clear previous analytics
    setFollowUpMessage(""); // Clear previous message
    setAiAssistantModalOpen(true); // Open modal immediately

    try {
      const response = await base44.functions.invoke('analyzeBrokerPatterns', {
        brokerId: broker.id
      });
      setBrokerAnalytics(response.data);
    } catch (error) {
      console.error('Error analyzing broker:', error);
      alert('Failed to analyze broker patterns');
      setAiAssistantModalOpen(false); // Close if error
    }
  };

  const handleSummarizeConversation = async (broker) => {
    if (!conversationText.trim()) {
      alert('Please paste conversation text');
      return;
    }

    try {
      const response = await base44.functions.invoke('summarizeConversation', {
        conversationText,
        brokerId: broker.id
      });

      alert(`Conversation Summarized!\n\nSummary: ${response.data.summary}\n\nKey Points: ${response.data.key_points.join(', ')}\n\nSentiment: ${response.data.sentiment}`);
      
      setConversationText("");
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      setAiAssistantModalOpen(false); // Close modal after successful summary
    } catch (error) {
      console.error('Error summarizing:', error);
      alert('Failed to summarize conversation');
    }
  };

  const sendFollowUp = () => {
    if (brokerAnalytics?.whatsappUrl) {
      window.open(brokerAnalytics.whatsappUrl, '_blank');
      setAiAssistantModalOpen(false);
    }
  };

  const BrokerPropertiesModal = () => {
    if (!selectedBroker) return null;
    const properties = getBrokerProperties(selectedBroker.id);

    return (
      <Dialog open={viewPropertiesModalOpen} onOpenChange={setViewPropertiesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBroker.name}'s Listings ({properties.length})
            </DialogTitle>
          </DialogHeader>

          {properties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#3B3B3B]">No properties found for this broker.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="p-4 bg-[#F7F7F7] rounded-2xl border-2 border-[#F7F7F7] hover:border-[#FFD300]/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300]">
                          {property.bhk || 'N/A'}
                        </Badge>
                        <Badge variant="outline" className={
                          property.status === "Active" ? "bg-green-500/20 text-green-700 border-green-500" :
                          "bg-gray-500/20 text-gray-700 border-gray-500"
                        }>
                          {property.status}
                        </Badge>
                        {property.custom_id && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {property.custom_id}
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-[#111111] mb-2">
                        {property.ai_title || `${property.bhk} in ${property.location || 'Mumbai'}`}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-[#3B3B3B]/60">Location</p>
                          <p className="text-sm font-semibold text-[#111111]">
                            {property.location || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#3B3B3B]/60">Price</p>
                          <p className="text-sm font-semibold text-[#111111]">
                            ₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#3B3B3B]/60">Type</p>
                          <p className="text-sm font-semibold text-[#111111]">
                            {property.listing_type}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#3B3B3B]/60">Area</p>
                          <p className="text-sm font-semibold text-[#111111]">
                            {property.carpet_area || 'N/A'} sq.ft
                          </p>
                        </div>
                      </div>
                      {property.building_name && (
                        <p className="text-sm text-[#3B3B3B] mb-2">
                          <Building2 className="w-3 h-3 inline mr-1" />
                          {property.building_name}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setViewPropertiesModalOpen(false); // Close current modal
                        navigate(createPageUrl("PropertyDetails") + `?id=${property.id}`);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const BrokerEditModal = () => {
    if (!selectedBroker) return null;

    const [formData, setFormData] = useState({
      reliability_rating: selectedBroker.reliability_rating || 0,
      notes: selectedBroker.notes || '',
      status: selectedBroker.status || 'Active',
      verified: selectedBroker.verified || false,
      response_time: selectedBroker.response_time || 'Unknown',
    });

    return (
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Broker: {selectedBroker.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#111111] mb-2 block">Status</label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Dormant">Dormant</SelectItem>
                  <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#111111] mb-2 block">Reliability Rating (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setFormData({...formData, reliability_rating: rating})}
                    className={`p-2 rounded-xl transition-all ${
                      formData.reliability_rating >= rating
                        ? 'bg-[#FFD300] text-black'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Star className="w-5 h-5" fill={formData.reliability_rating >= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#111111] mb-2 block">Response Time</label>
              <Select value={formData.response_time} onValueChange={(val) => setFormData({...formData, response_time: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fast">Fast</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Slow">Slow</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.verified}
                onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                className="w-4 h-4"
              />
              <label className="text-sm font-semibold text-[#111111]">Verified Broker</label>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#111111] mb-2 block">Internal Notes</label>
              <Textarea
                placeholder="e.g., 'reliable, only Juhu flats, fast response'"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateBrokerMutation.mutate({ id: selectedBroker.id, data: formData })}
                className="bg-[#FFD300] text-black hover:bg-[#FFC700]"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const AIAssistantModal = () => {
    if (!selectedBrokerForAI) return null;

    return (
      <Dialog open={aiAssistantModalOpen} onOpenChange={setAiAssistantModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFD300]" />
              AI Broker Assistant: {selectedBrokerForAI.name}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="followup" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="followup">Follow-Up</TabsTrigger>
              <TabsTrigger value="analyze">Analytics</TabsTrigger>
              <TabsTrigger value="summarize">Summarize Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="followup" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  AI-Generated Follow-Up Message
                </h3>
                <p className="text-xs text-[#3B3B3B] mb-3">
                  Focused on availability and photo requests
                </p>

                {followUpLoading ? (
                  <Textarea
                    value="Generating message..."
                    rows={5}
                    className="mb-3 text-gray-500"
                    readOnly
                  />
                ) : (
                  <Textarea
                    value={followUpMessage}
                    onChange={(e) => setFollowUpMessage(e.target.value)}
                    rows={5}
                    className="mb-3"
                    placeholder="Message will appear here after generation..."
                  />
                )}

                {brokerAnalytics?.recommendations && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Sending Recommendations
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Timing:</strong> {brokerAnalytics.recommendations.sendTiming}</p>
                      <p><strong>Best Time:</strong> {brokerAnalytics.recommendations.bestTimeOfDay}</p>
                      <p><strong>Last Contact:</strong> {brokerAnalytics.recommendations.daysSinceLastContact} days ago</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={sendFollowUp}
                    className="bg-[#25D366] hover:bg-[#20BD5A] text-white flex-1"
                    disabled={!followUpMessage || followUpLoading}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send via WhatsApp
                  </Button>
                  <Button
                    onClick={() => navigator.clipboard.writeText(followUpMessage)}
                    variant="outline"
                    disabled={!followUpMessage || followUpLoading}
                  >
                    Copy Message
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">Generate New Follow-Up</h4>
                <Input
                  placeholder="Add context (e.g., 'urgent client request', 'price change')..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleGenerateFollowUp(selectedBrokerForAI, null, e.target.value);
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="analyze" className="space-y-4">
              {!brokerAnalytics ? (
                <div className="text-center py-8">
                  <Button onClick={() => handleAnalyzeBroker(selectedBrokerForAI)}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analyze Broker Patterns
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F7F7F7] rounded-xl p-4">
                      <p className="text-xs text-[#3B3B3B] mb-1">Total Interactions</p>
                      <p className="text-2xl font-bold">{brokerAnalytics.totalInteractions || 0}</p>
                    </div>
                    <div className="bg-[#F7F7F7] rounded-xl p-4">
                      <p className="text-xs text-[#3B3B3B] mb-1">Reliability Score</p>
                      <p className="text-2xl font-bold text-green-600">
                        {brokerAnalytics.recommendations?.reliabilityScore || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {brokerAnalytics.recommendations && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold mb-3">📊 Contact Recommendations</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#3B3B3B]">Best Time of Day:</span>
                          <span className="font-semibold">{brokerAnalytics.recommendations.bestTimeOfDay}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#3B3B3B]">Best Day:</span>
                          <span className="font-semibold">{brokerAnalytics.recommendations.bestDayOfWeek}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#3B3B3B]">Avg Response Time:</span>
                          <span className="font-semibold">{brokerAnalytics.recommendations.avgResponseTime}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {brokerAnalytics.metrics && (
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="font-semibold mb-3">📈 Performance Metrics</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[#3B3B3B]">Availability Confirmation</p>
                          <p className="font-bold text-green-600">{brokerAnalytics.metrics.availabilityConfirmationRate}</p>
                        </div>
                        <div>
                          <p className="text-[#3B3B3B]">Photo Sharing Rate</p>
                          <p className="font-bold text-green-600">{brokerAnalytics.metrics.photoSharingRate}</p>
                        </div>
                        <div>
                          <p className="text-[#3B3B3B]">Follow-Up Needed</p>
                          <p className="font-bold text-orange-600">{brokerAnalytics.metrics.followUpRate}</p>
                        </div>
                        <div>
                          <p className="text-[#3B3B3B]">Sentiment</p>
                          <p className="font-bold text-blue-600">{brokerAnalytics.metrics.sentimentScore}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {brokerAnalytics.recentInteractions && brokerAnalytics.recentInteractions.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Recent Interactions</h4>
                      <div className="space-y-2">
                        {brokerAnalytics.recentInteractions.map((interaction, idx) => (
                          <div key={idx} className="bg-[#F7F7F7] rounded-xl p-3 text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-[#3B3B3B]">{interaction.date}</span>
                              <Badge className={
                                interaction.sentiment === 'Positive' ? 'bg-green-500/20 text-green-700' :
                                interaction.sentiment === 'Negative' ? 'bg-red-500/20 text-red-700' :
                                'bg-gray-500/20 text-gray-700'
                              }>
                                {interaction.sentiment}
                              </Badge>
                            </div>
                            <p className="text-[#111111]">{interaction.summary}</p>
                            <div className="flex gap-2 mt-2">
                              {interaction.availabilityConfirmed && (
                                <Badge variant="outline" className="text-xs">✅ Available</Badge>
                              )}
                              {interaction.photosReceived && (
                                <Badge variant="outline" className="text-xs">📷 Photos</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="summarize" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Paste WhatsApp Conversation</h3>
                <p className="text-xs text-[#3B3B3B] mb-3">
                  AI will extract: availability status, photo sharing, key points, sentiment
                </p>

                <Textarea
                  value={conversationText}
                  onChange={(e) => setConversationText(e.target.value)}
                  rows={10}
                  placeholder="Paste conversation here...&#10;&#10;Example:&#10;You: Hi Ramesh, is the 3 BHK still available?&#10;Broker: Yes available. Want to see photos?&#10;You: Yes please..."
                  className="mb-3 font-mono text-xs"
                />

                <Button
                  onClick={() => handleSummarizeConversation(selectedBrokerForAI)}
                  className="w-full bg-[#FFD300] text-black hover:bg-[#FFC700]"
                  disabled={!conversationText.trim()}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Summarize & Save to CRM
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-[#FFD300] mx-auto mb-4 animate-pulse" />
          <p className="text-[#3B3B3B]">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">

        {/* Back Button + Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(createPageUrl("Admin"))}
            variant="ghost"
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-[#111111] mb-2">Brokers</h1>
          <p className="text-[#3B3B3B]">Manage broker relationships & intelligence</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Total Brokers</p>
            <p className="text-2xl font-bold text-[#111111]">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Verified</p>
            <p className="text-2xl font-bold text-[#FFD300]">{stats.verified}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Blacklisted</p>
            <p className="text-2xl font-bold text-red-600">{stats.blacklisted}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Total Listings</p>
            <p className="text-2xl font-bold text-[#111111]">{stats.totalListings}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Active Listings</p>
            <p className="text-2xl font-bold text-blue-600">{stats.activeListings}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-[#F7F7F7]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3B3B3B]" />
              <Input
                placeholder="Search brokers by name, phone, agency, or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Dormant">Dormant</SelectItem>
                <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportCSV} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {brokersLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredBrokers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-[#F7F7F7]">
            <Users className="w-12 h-12 text-[#3B3B3B] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#111111] mb-2">No brokers found</h3>
            <p className="text-[#3B3B3B]">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBrokers.map((broker) => {
              const brokerProps = getBrokerProperties(broker.id);
              
              return (
                <motion.div
                  key={broker.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 border-2 border-[#F7F7F7] hover:border-[#FFD300]/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#FFD300]/20 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-[#FFD300]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-[#111111]">{broker.name}</h3>
                          {broker.verified && (
                            <Badge className="bg-green-500/20 text-green-700 border-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        {broker.custom_id && (
                          <p className="text-xs text-[#3B3B3B]/60 font-mono mb-2">{broker.custom_id}</p>
                        )}
                        {broker.agency_name && (
                          <p className="text-sm text-[#3B3B3B] mb-2">{broker.agency_name}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {broker.status}
                          </Badge>
                          {broker.response_time && broker.response_time !== "Unknown" && (
                            <Badge variant="outline" className="text-xs">
                              {broker.response_time} Response
                            </Badge>
                          )}
                          {broker.reliability_rating && (
                            <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300] text-xs">
                              <Star className="w-3 h-3 mr-1" fill="currentColor" />
                              {broker.reliability_rating}/5
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedBroker(broker);
                        setEditModalOpen(true);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-[#3B3B3B]/60 mb-1">Contact</p>
                      <div className="flex items-center gap-1 text-sm text-[#111111]">
                        <Phone className="w-3 h-3" />
                        {broker.phone}
                      </div>
                      {broker.alternate_phones && broker.alternate_phones.length > 0 && (
                        <div className="text-xs text-[#3B3B3B]/60 mt-1">
                          +{broker.alternate_phones.length} alt number{broker.alternate_phones.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-[#3B3B3B]/60 mb-1">Total Listings</p>
                      <p className="text-sm font-bold text-[#111111]">{broker.total_listings_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#3B3B3B]/60 mb-1">Active Listings</p>
                      <p className="text-sm font-bold text-green-600">{brokerProps.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#3B3B3B]/60 mb-1">Last Activity</p>
                      <p className="text-sm text-[#111111]">
                        {broker.last_activity ? format(new Date(broker.last_activity), "MMM dd, yyyy") : "Never"}
                      </p>
                    </div>
                  </div>

                  {broker.areas_covered && broker.areas_covered.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-[#3B3B3B]/60 mb-2">Areas Covered</p>
                      <div className="flex flex-wrap gap-2">
                        {broker.areas_covered.map((area, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {broker.notes && (
                    <div className="mb-4 p-3 bg-[#F7F7F7] rounded-xl">
                      <p className="text-xs text-[#3B3B3B]/60 mb-1">Notes</p>
                      <p className="text-sm text-[#111111]">{broker.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleWhatsApp(broker)}
                      className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                      size="sm"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp {brokerProps.length > 0 && `(${brokerProps.length})`}
                    </Button>
                    
                    <Button
                      onClick={() => handleGenerateFollowUp(broker)}
                      className="bg-[#FFD300] hover:bg-[#FFC700] text-black font-semibold"
                      size="sm"
                      disabled={followUpLoading}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Follow-Up
                    </Button>

                    <Button
                      onClick={() => handleAnalyzeBroker(broker)}
                      variant="outline"
                      size="sm"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>

                    {brokerProps.length > 0 && (
                      <Button
                        onClick={() => handleViewListings(broker)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View {brokerProps.length} Listing{brokerProps.length > 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BrokerEditModal />
      <BrokerPropertiesModal />
      <AIAssistantModal />
    </div>
  );
}
