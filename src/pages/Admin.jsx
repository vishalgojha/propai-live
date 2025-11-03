
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  Shield, Home, Users, Building2, FileText, Search, Filter,
  Eye, Edit2, Trash2, AlertTriangle, Copy, MessageCircle,
  Phone, Star, MapPin, Download, Sparkles, Clock, TrendingUp,
  MessageSquare, Send, CheckCircle2, Mail, Calendar, IndianRupee,
  HomeIcon, Upload, Image as ImageIcon, X, ChevronDown, MoreVertical,
  RefreshCw, ExternalLink, Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("properties");

  // Properties state
  const [propSearchQuery, setPropSearchQuery] = useState("");
  const [propStatusFilter, setPropStatusFilter] = useState("all");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propViewMode, setPropViewMode] = useState("properties");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Brokers state
  const [brokerSearchQuery, setBrokerSearchQuery] = useState("");
  const [brokerStatusFilter, setBrokerStatusFilter] = useState("all");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewPropertiesModalOpen, setViewPropertiesModalOpen] = useState(false);

  // AI Assistant States
  const [aiAssistantModalOpen, setAiAssistantModalOpen] = useState(false);
  const [selectedBrokerForAI, setSelectedBrokerForAI] = useState(null);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [brokerAnalytics, setBrokerAnalytics] = useState(null);
  const [conversationText, setConversationText] = useState("");

  // Deals Radar state
  const [showDealsRadar, setShowDealsRadar] = useState(false);
  const [dealsData, setDealsData] = useState(null);
  const [dealsLoading, setDealsLoading] = useState(false);

  // Image upload states
  const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false);
  const [selectedPropertyForImages, setSelectedPropertyForImages] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagesToUpload, setImagesToUpload] = useState([]);

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
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Queries with LIVE UPDATES
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    initialData: [],
    enabled: isAuthorized,
    refetchInterval: 10000,
  });

  const { data: duplicates = [] } = useQuery({
    queryKey: ['duplicate-properties'],
    queryFn: () => base44.entities.Property.filter({ is_duplicate: true }, '-created_date'),
    initialData: [],
    enabled: isAuthorized,
    refetchInterval: 10000,
  });

  const { data: brokers = [] } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => base44.entities.Broker.list('-last_activity'),
    initialData: [],
    enabled: isAuthorized,
    refetchInterval: 10000,
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    initialData: [],
    enabled: isAuthorized,
    refetchInterval: 10000,
  });

  // Mutations
  const deletePropertyMutation = useMutation({
    mutationFn: (id) => base44.entities.Property.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-properties'] });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Property.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-properties'] });
      setImageUploadModalOpen(false);
      setSelectedPropertyForImages(null);
      setImagesToUpload([]);
    },
  });

  const updateBrokerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Broker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      setEditModalOpen(false);
      setSelectedBroker(null);
    },
  });

  // Image upload handlers
  const handleImageUpload = (property) => {
    setSelectedPropertyForImages(property);
    setImageUploadModalOpen(true);
    setImagesToUpload([]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setImagesToUpload(files);
  };

  const handleUploadImages = async () => {
    if (imagesToUpload.length === 0 || !selectedPropertyForImages) return;

    setUploadingImages(true);

    try {
      const uploadedUrls = [];

      for (const file of imagesToUpload) {
        const response = await base44.integrations.Core.UploadFile({ file });
        if (response && response.file_url) {
          uploadedUrls.push(response.file_url);
        } else {
          console.error("File upload response missing file_url:", response);
          throw new Error("Failed to get file URL from upload response.");
        }
      }

      const existingImages = selectedPropertyForImages.images || [];
      const updatedImages = [...existingImages, ...uploadedUrls];

      await updatePropertyMutation.mutateAsync({
        id: selectedPropertyForImages.id,
        data: { images: updatedImages }
      });

      alert(`✅ Successfully uploaded ${uploadedUrls.length} image(s)!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (imageUrl) => {
    if (!selectedPropertyForImages) return;

    if (!confirm('Are you sure you want to remove this image?')) return;

    const updatedImages = (selectedPropertyForImages.images || []).filter(img => img !== imageUrl);

    try {
      await updatePropertyMutation.mutateAsync({
        id: selectedPropertyForImages.id,
        data: { images: updatedImages }
      });

      setSelectedPropertyForImages({
        ...selectedPropertyForImages,
        images: updatedImages
      });
      alert('✅ Image removed successfully!');
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Failed to remove image');
    }
  };

  // Property functions
  const handleViewProperty = (propertyId) => {
    navigate(createPageUrl("PropertyDetails") + `?id=${propertyId}`);
  };

  const handleDeleteProperty = (propertyId) => {
    if (confirm("Are you sure you want to delete this property permanently? This action cannot be undone.")) {
      deletePropertyMutation.mutate(propertyId);
    }
  };

  const handleRestoreDuplicate = (propertyId) => {
    if (confirm("Restore this property from duplicates?")) {
      updatePropertyMutation.mutate({
        id: propertyId,
        data: { is_duplicate: false, duplicate_of: null }
      });
    }
  };

  // Load Deals Radar
  const loadDealsRadar = async () => {
    setDealsLoading(true);
    try {
      const response = await base44.functions.invoke('getDealsRadar', {});
      setDealsData(response.data);
      setShowDealsRadar(true);
    } catch (error) {
      console.error('Error loading deals radar:', error);
      alert('Failed to load deals radar');
    } finally {
      setDealsLoading(false);
    }
  };

  // Calculate all broker trust scores
  const recalculateBrokerTrust = async () => {
    if (!confirm('Recalculate trust scores for all brokers? This may take a minute.')) return;

    try {
      const response = await base44.functions.invoke('calculateBrokerTrust', {
        recalculateAll: true
      });
      alert(`✅ Trust scores calculated for ${response.data.brokersScored} brokers!`);
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
    } catch (error) {
      console.error('Error calculating trust:', error);
      alert('Failed to calculate trust scores');
    }
  };

  // Broker functions
  const getBrokerProperties = (brokerId) => {
    return properties.filter(p => p.broker_id === brokerId);
  };

  const handleWhatsApp = (broker) => {
    const brokerProps = getBrokerProperties(broker.id);
    let message = `Hi ${broker.name}, this is Chariot Realty.\n\n`;

    if (brokerProps.length > 0) {
      message += `Regarding your ${brokerProps.length} listing${brokerProps.length > 1 ? 's' : ''}:\n\n`;
      brokerProps.slice(0, 3).forEach((prop, idx) => {
        message += `${idx + 1}. ${prop.bhk || 'Property'} in ${prop.location || 'Mumbai'}\n`;
        message += `   ${prop.building_name ? `${prop.building_name}, ` : ''}`;
        message += `₹${prop.price}${prop.price_unit === 'crores' ? ' Cr' : 'L'}\n`;
        if (prop.custom_id) message += `   ID: ${prop.custom_id}\n`;
        message += '\n';
      });
      if (brokerProps.length > 3) {
        message += `...and ${brokerProps.length - 3} more listing${brokerProps.length - 3 > 1 ? 's' : ''}\n\n`;
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

  const handleExportBrokersCSV = () => {
    const csv = [
      ['ID', 'Name', 'Phone', 'Agency', 'Total Listings', 'Active Listings', 'Status', 'Rating', 'Areas'].join(','),
      ...brokers.map(b => [
        b.custom_id || b.id,
        b.name,
        b.phone,
        b.agency_name || '',
        b.total_listings_count || 0,
        getBrokerProperties(b.id).length,
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

  // AI functions
  const handleGenerateFollowUp = async (broker, propertyId = null, context = "") => {
    setFollowUpLoading(true);
    setSelectedBrokerForAI(broker);
    setBrokerAnalytics(null);
    setFollowUpMessage("");
    setAiAssistantModalOpen(true);

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
      setAiAssistantModalOpen(false);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleAnalyzeBroker = async (broker) => {
    setSelectedBrokerForAI(broker);
    setBrokerAnalytics(null);
    setFollowUpMessage("");
    setAiAssistantModalOpen(true);

    try {
      const response = await base44.functions.invoke('analyzeBrokerPatterns', {
        brokerId: broker.id
      });
      setBrokerAnalytics(response.data);
    } catch (error) {
      console.error('Error analyzing broker:', error);
      alert('Failed to analyze broker patterns');
      setAiAssistantModalOpen(false);
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
      setAiAssistantModalOpen(false);
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

  // Requirements functions
  const handleFindMatches = (req) => {
    const searchParams = new URLSearchParams();
    if (req.bhk_preference?.[0]) searchParams.set('bhk', req.bhk_preference[0]);
    if (req.listing_type) searchParams.set('listingType', req.listing_type);
    if (req.preferred_locations?.[0]) searchParams.set('search', req.preferred_locations[0]);
    navigate(createPageUrl("SmartFeed") + "?" + searchParams.toString());
  };

  // Filtered data
  const filteredProperties = properties.filter(property => {
    const matchesSearch = !propSearchQuery ||
      property.building_name?.toLowerCase().includes(propSearchQuery.toLowerCase()) ||
      property.location?.toLowerCase().includes(propSearchQuery.toLowerCase()) ||
      property.custom_id?.toLowerCase().includes(propSearchQuery.toLowerCase()) ||
      property.bhk?.toLowerCase().includes(propSearchQuery.toLowerCase());

    const matchesStatus = propStatusFilter === "all" || property.status === propStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = !brokerSearchQuery ||
      broker.name?.toLowerCase().includes(brokerSearchQuery.toLowerCase()) ||
      broker.phone?.includes(brokerSearchQuery) ||
      broker.agency_name?.toLowerCase().includes(brokerSearchQuery.toLowerCase()) ||
      broker.areas_covered?.some(area => area.toLowerCase().includes(brokerSearchQuery.toLowerCase()));

    const matchesStatus = brokerStatusFilter === "all" || broker.status === brokerStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const propStats = {
    total: properties.length,
    active: properties.filter(p => p.status === "Active" && !p.is_duplicate).length,
    duplicates: properties.filter(p => p.is_duplicate).length,
    draft: properties.filter(p => p.status === "Draft").length,
    sold: properties.filter(p => p.status === "Sold" || p.status === "Rented").length,
  };

  const brokerStats = {
    total: brokers.length,
    active: brokers.filter(b => b.status === "Active").length,
    verified: brokers.filter(b => b.verified).length,
    blacklisted: brokers.filter(b => b.status === "Blacklisted").length,
    totalListings: brokers.reduce((sum, b) => sum + (b.total_listings_count || 0), 0),
    activeListings: properties.filter(p => p.status === "Active").length,
  };

  const reqStats = {
    total: requirements.length,
    active: requirements.filter(r => r.status === "Active").length,
    matched: requirements.filter(r => r.status === "Matched").length,
    closed: requirements.filter(r => r.status === "Closed").length,
  };

  // Modals
  const BrokerPropertiesModal = () => {
    if (!selectedBroker) return null;
    const brokerProps = getBrokerProperties(selectedBroker.id);

    return (
      <Dialog open={viewPropertiesModalOpen} onOpenChange={setViewPropertiesModalOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#FFD300]" />
              {selectedBroker.name}'s Portfolio ({brokerProps.length} properties)
            </DialogTitle>
          </DialogHeader>

          {brokerProps.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No properties found for this broker.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {brokerProps.map((property) => (
                <div
                  key={property.id}
                  className="group p-5 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 hover:border-[#FFD300] transition-all cursor-pointer"
                  onClick={() => {
                    setViewPropertiesModalOpen(false);
                    navigate(createPageUrl("PropertyDetails") + `?id=${property.id}`);
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Property Image */}
                    {property.images?.[0] ? (
                      <img
                        src={property.images[0]}
                        alt={property.ai_title}
                        className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-10 h-10 text-gray-400" />
                      </div>
                    )}

                    {/* Property Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-[#FFD300] text-black font-bold">
                              {property.bhk || 'N/A'}
                            </Badge>
                            <Badge variant="outline" className={
                              property.status === "Active" ? "border-green-500 text-green-700" :
                                "border-gray-400 text-gray-600"
                            }>
                              {property.status}
                            </Badge>
                            {property.custom_id && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {property.custom_id}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                            {property.ai_title || `${property.bhk} in ${property.location || 'Mumbai'}`}
                          </h4>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#FFD300] transition-colors" />
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Location</p>
                          <p className="font-semibold text-gray-900">{property.location || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Price</p>
                          <p className="font-semibold text-gray-900">
                            ₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Type</p>
                          <p className="font-semibold text-gray-900">{property.listing_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Area</p>
                          <p className="font-semibold text-gray-900">{property.carpet_area || 'N/A'} sq.ft</p>
                        </div>
                      </div>

                      {property.building_name && (
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {property.building_name}
                        </p>
                      )}
                    </div>
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
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
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
                    onClick={() => setFormData({ ...formData, reliability_rating: rating })}
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
              <Select value={formData.response_time} onValueChange={(val) => setFormData({ ...formData, response_time: val })}>
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
                onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-semibold text-[#111111]">Verified Broker</label>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#111111] mb-2 block">Internal Notes</label>
              <Textarea
                placeholder="e.g., 'reliable, only Juhu flats, fast response'"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                    placeholder="Message will appear here..."
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
                  placeholder="Paste conversation here..."
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

  const DealsRadarModal = () => {
    if (!dealsData) return null;

    return (
      <Dialog open={showDealsRadar} onOpenChange={setShowDealsRadar}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFD300]" />
              AI Deals Radar - Your Unfair Advantage
            </DialogTitle>
          </DialogHeader>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-xs text-green-700 mb-1">Underpriced Deals</p>
              <p className="text-3xl font-bold text-green-600">{dealsData.summary.underpricedDeals}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-700 mb-1">Price Drops</p>
              <p className="text-3xl font-bold text-blue-600">{dealsData.summary.priceDrops}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-purple-700 mb-1">Hidden Matches</p>
              <p className="text-3xl font-bold text-purple-600">{dealsData.summary.hiddenMatches}</p>
            </div>
          </div>

          <Tabs defaultValue="underpriced">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="underpriced">💎 Underpriced</TabsTrigger>
              <TabsTrigger value="drops">📉 Price Drops</TabsTrigger>
              <TabsTrigger value="matches">🎯 Hidden Matches</TabsTrigger>
            </TabsList>

            <TabsContent value="underpriced" className="space-y-3 mt-4">
              {dealsData.deals.underpriced.length === 0 ? (
                <p className="text-center text-[#3B3B3B] py-8">No underpriced deals found</p>
              ) : (
                dealsData.deals.underpriced.map((deal, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-[#111111] mb-1">{deal.title}</h4>
                        <p className="text-sm text-[#3B3B3B]">{deal.building} • {deal.location}</p>
                      </div>
                      <Badge className="bg-green-500 text-white text-lg px-3 py-1">
                        {deal.discount} OFF
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-[#3B3B3B]">Actual Price</p>
                        <p className="font-bold text-green-600">{deal.actualPrice}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#3B3B3B]">Expected Price</p>
                        <p className="font-bold text-[#111111]">{deal.expectedPrice}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#3B3B3B]">You Save</p>
                        <p className="font-bold text-green-600">{deal.discountAmount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#3B3B3B]">Broker Trust</p>
                        <p className="font-bold text-[#111111]">{deal.brokerTrustScore}/100</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(createPageUrl("PropertyDetails") + `?id=${deal.propertyId}`)}
                      size="sm"
                      className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Property
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="drops" className="space-y-3 mt-4">
              {dealsData.deals.priceDrops.length === 0 ? (
                <p className="text-center text-[#3B3B3B] py-8">No price drops detected</p>
              ) : (
                dealsData.deals.priceDrops.map((drop, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-bold text-[#111111] mb-2">{drop.title}</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-[#3B3B3B]">Old Price</p>
                        <p className="font-bold text-gray-500 line-through">₹{drop.oldPrice}{drop.priceUnit === 'crores' ? ' Cr' : 'L'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#3B3B3B]">New Price</p>
                        <p className="font-bold text-blue-600">₹{drop.newPrice}{drop.priceUnit === 'crores' ? ' Cr' : 'L'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#3B3B3B]">Drop Amount</p>
                        <p className="font-bold text-green-600">-₹{drop.dropAmount}{drop.priceUnit === 'crores' ? ' Cr' : 'L'}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(createPageUrl("PropertyDetails") + `?id=${drop.propertyId}`)}
                      size="sm"
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      View Property
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="matches" className="space-y-3 mt-4">
              {dealsData.deals.hiddenMatches.length === 0 ? (
                <p className="text-center text-[#3B3B3B] py-8">No hidden matches found</p>
              ) : (
                dealsData.deals.hiddenMatches.map((match, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge className="bg-purple-500 text-white mb-2">Draft Property Match</Badge>
                        <h4 className="font-bold text-[#111111]">{match.title}</h4>
                        <p className="text-sm text-[#3B3B3B] mt-1">{match.location} • {match.price}</p>
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 mt-3">
                      <p className="text-xs text-purple-700 mb-1">Matches Requirement:</p>
                      <p className="font-semibold text-[#111111]">{match.clientName}</p>
                      <p className="text-sm text-[#3B3B3B]">{match.clientPhone}</p>
                      <p className="text-xs text-purple-600 mt-2">{match.matchReason}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => navigate(createPageUrl("PropertyDetails") + `?id=${match.propertyId}`)}
                        size="sm"
                        variant="outline"
                      >
                        View Property
                      </Button>
                      <Button
                        onClick={() => {
                          const message = `Hi ${match.clientName}, we found a perfect match for your requirement! ${match.title} in ${match.location} at ${match.price}. Interested?`;
                          window.open(`https://wa.me/${match.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        size="sm"
                        className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact Client
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>

          <p className="text-xs text-[#3B3B3B] text-center mt-4 italic">
            🔮 Generated: {new Date(dealsData.generatedAt).toLocaleString()} • Refresh for latest intelligence
          </p>
        </DialogContent>
      </Dialog>
    );
  };

  // Image Upload Modal
  const ImageUploadModal = () => {
    if (!selectedPropertyForImages) return null;

    return (
      <Dialog open={imageUploadModalOpen} onOpenChange={setImageUploadModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#FFD300]" />
              Manage Images
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              {selectedPropertyForImages.ai_title || `${selectedPropertyForImages.bhk} in ${selectedPropertyForImages.location}`}
            </p>
          </DialogHeader>

          {/* Current Images */}
          {selectedPropertyForImages.images && selectedPropertyForImages.images.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm flex items-center justify-between">
                <span>Current Images ({selectedPropertyForImages.images.length})</span>
                <Badge variant="outline">{selectedPropertyForImages.images.length} photos</Badge>
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {selectedPropertyForImages.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`Property ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      onClick={() => handleRemoveImage(img)}
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 bg-red-500 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Upload New Images</h4>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop or click to browse
            </p>

            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="cursor-pointer mb-4"
            />

            {imagesToUpload.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {imagesToUpload.length} file(s) selected
                </p>
                <div className="space-y-1">
                  {imagesToUpload.map((file, idx) => (
                    <p key={idx} className="text-xs text-blue-600 truncate">{file.name}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleUploadImages}
                disabled={uploadingImages || imagesToUpload.length === 0}
                className="bg-[#FFD300] text-black hover:bg-[#FFC700] flex-1"
              >
                {uploadingImages ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {imagesToUpload.length} Image(s)
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setImageUploadModalOpen(false);
                  setImagesToUpload([]);
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#FFD300] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-black" />
          </div>
          <p className="text-gray-600 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">

        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-[#FFD300] to-[#FFA500] rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-7 h-7 text-black" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm text-gray-500">Live updates • Auto-refresh every 10s</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                onClick={loadDealsRadar}
                disabled={dealsLoading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {dealsLoading ? 'Loading...' : 'AI Deals Radar'}
              </Button>
              <Button
                onClick={recalculateBrokerTrust}
                variant="outline"
                className="border-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Trust Scores
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs - Modern Horizontal Design */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-2 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("properties")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold transition-all ${
                activeTab === "properties"
                  ? "bg-gradient-to-r from-[#FFD300] to-[#FFA500] text-black shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Properties</span>
              <Badge className={activeTab === "properties" ? "bg-black/20 text-black" : "bg-gray-200 text-gray-700"}>
                {propStats.active}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab("brokers")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold transition-all ${
                activeTab === "brokers"
                  ? "bg-gradient-to-r from-[#FFD300] to-[#FFA500] text-black shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Brokers</span>
              <Badge className={activeTab === "brokers" ? "bg-black/20 text-black" : "bg-gray-200 text-gray-700"}>
                {brokerStats.active}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab("requirements")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold transition-all ${
                activeTab === "requirements"
                  ? "bg-gradient-to-r from-[#FFD300] to-[#FFA500] text-black shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline">Requirements</span>
              <Badge className={activeTab === "requirements" ? "bg-black/20 text-black" : "bg-gray-200 text-gray-700"}>
                {reqStats.active}
              </Badge>
            </button>
          </div>
        </div>

        {/* Tab Content - Properties */}
        <AnimatePresence mode="wait">
          {activeTab === "properties" && (
            <motion.div
              key="properties"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Stats Grid - Larger & More Prominent */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <Package className="w-8 h-8 text-gray-400" />
                    <Badge variant="outline" className="text-xs">Total</Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{propStats.total}</p>
                  <p className="text-sm text-gray-500">All Properties</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <Badge className="bg-green-600 text-white text-xs">Live</Badge>
                  </div>
                  <p className="text-3xl font-bold text-green-700 mb-1">{propStats.active}</p>
                  <p className="text-sm text-green-600">Active Listings</p>
                </div>

                <div
                  className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setPropViewMode('duplicates')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Copy className="w-8 h-8 text-orange-600" />
                    <Badge className="bg-orange-600 text-white text-xs">Review</Badge>
                  </div>
                  <p className="text-3xl font-bold text-orange-700 mb-1">{propStats.duplicates}</p>
                  <p className="text-sm text-orange-600">Duplicates</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-8 h-8 text-gray-400" />
                    <Badge variant="outline" className="text-xs">Pending</Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-700 mb-1">{propStats.draft}</p>
                  <p className="text-sm text-gray-500">Draft</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <Badge className="bg-blue-600 text-white text-xs">Closed</Badge>
                  </div>
                  <p className="text-3xl font-bold text-blue-700 mb-1">{propStats.sold}</p>
                  <p className="text-sm text-blue-600">Sold/Rented</p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white rounded-2xl p-1.5 border border-gray-200 shadow-sm inline-flex gap-1">
                  <Button
                    onClick={() => setPropViewMode('properties')}
                    variant={propViewMode === 'properties' ? 'default' : 'ghost'}
                    size="sm"
                    className={`rounded-xl ${propViewMode === 'properties' ? 'bg-[#FFD300] text-black shadow-sm' : ''}`}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Active Properties
                  </Button>
                  <Button
                    onClick={() => setPropViewMode('duplicates')}
                    variant={propViewMode === 'duplicates' ? 'default' : 'ghost'}
                    size="sm"
                    className={`rounded-xl ${propViewMode === 'duplicates' ? 'bg-orange-500 text-white shadow-sm' : ''}`}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicates ({propStats.duplicates})
                  </Button>
                </div>

                <Button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  variant="outline"
                  className="border-2"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {/* Filters - Collapsible */}
              <AnimatePresence>
                {filtersExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Search</label>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            placeholder="Search by building, location, ID, or BHK..."
                            value={propSearchQuery}
                            onChange={(e) => setPropSearchQuery(e.target.value)}
                            className="pl-12 h-11 rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                        <Select value={propStatusFilter} onValueChange={setPropStatusFilter}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Sold">Sold</SelectItem>
                            <SelectItem value="Rented">Rented</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Properties List - Card Layout */}
              {propertiesLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-48 rounded-3xl" />
                  ))}
                </div>
              ) : propViewMode === 'properties' ? (
                <div className="grid gap-4">
                  {filteredProperties.filter(p => !p.is_duplicate).map((property) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-white hover:bg-gray-50 rounded-3xl p-6 border border-gray-200 hover:border-[#FFD300] hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-6">
                        {/* Property Image */}
                        <div className="relative flex-shrink-0">
                          {property.images?.[0] ? (
                            <img
                              src={property.images[0]}
                              alt={property.ai_title}
                              className="w-32 h-32 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <Building2 className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-md">
                            <Badge className="text-xs">
                              {property.images?.length || 0} 📷
                            </Badge>
                          </div>
                        </div>

                        {/* Property Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-[#FFD300] text-black font-bold">
                                  {property.bhk}
                                </Badge>
                                <Badge variant="outline" className={
                                  property.status === "Active" ? "border-green-500 text-green-700 bg-green-50" :
                                    "border-gray-400 text-gray-600"
                                }>
                                  {property.status}
                                </Badge>
                                {property.custom_id && (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {property.custom_id}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
                                {property.ai_title || `${property.bhk} in ${property.location}`}
                              </h3>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {property.location} {property.building_name && `• ${property.building_name}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">
                                ₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}
                              </p>
                              <p className="text-xs text-gray-500">{property.listing_type}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs mb-0.5">Area</p>
                              <p className="font-semibold text-gray-900">{property.carpet_area || 'N/A'} sq.ft</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-0.5">Furnishing</p>
                              <p className="font-semibold text-gray-900">{property.furnishing || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-0.5">Parking</p>
                              <p className="font-semibold text-gray-900">{property.parking || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-0.5">Added</p>
                              <p className="font-semibold text-gray-900">
                                {format(new Date(property.created_date), "MMM dd")}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleImageUpload(property)}
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Manage Images
                            </Button>
                            <Button
                              onClick={() => handleViewProperty(property.id)}
                              size="sm"
                              variant="outline"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              onClick={() => handleDeleteProperty(property.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {duplicates.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-gray-200">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">All Clean!</h3>
                      <p className="text-gray-500">No duplicate properties found</p>
                    </div>
                  ) : (
                    duplicates.map((property) => (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-6 border-2 border-orange-200"
                      >
                        <div className="flex items-start gap-6">
                          {property.images?.[0] ? (
                            <img
                              src={property.images[0]}
                              alt={property.ai_title}
                              className="w-32 h-32 rounded-2xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-12 h-12 text-gray-400" />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-orange-600 text-white">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    DUPLICATE
                                  </Badge>
                                  <Badge className="bg-[#FFD300] text-black">
                                    {property.bhk}
                                  </Badge>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  {property.ai_title || `${property.bhk} in ${property.location}`}
                                </h3>
                                {property.duplicate_of && (
                                  <p className="text-sm text-orange-700 font-semibold">
                                    Duplicate of: {property.duplicate_of}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">
                                  ₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
                              <div>
                                <p className="text-gray-600 text-xs mb-0.5">Building</p>
                                <p className="font-semibold text-gray-900">{property.building_name || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 text-xs mb-0.5">Area</p>
                                <p className="font-semibold text-gray-900">{property.carpet_area || 'N/A'} sq.ft</p>
                              </div>
                              <div>
                                <p className="text-gray-600 text-xs mb-0.5">Floor</p>
                                <p className="font-semibold text-gray-900">{property.floor || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 text-xs mb-0.5">Added</p>
                                <p className="font-semibold text-gray-900">
                                  {format(new Date(property.created_date), "MMM dd")}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleViewProperty(property.id)}
                                size="sm"
                                variant="outline"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              <Button
                                onClick={() => handleRestoreDuplicate(property.id)}
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-green-700 text-white"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Restore
                              </Button>
                              <Button
                                onClick={() => handleDeleteProperty(property.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 border-red-200"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Tab Content - Brokers (keeping existing but improved styling) */}
          {activeTab === "brokers" && (
            <motion.div
              key="brokers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
                  <p className="text-xs text-[#3B3B3B] mb-1">Total Brokers</p>
                  <p className="text-2xl font-bold text-[#111111]">{brokerStats.total}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
                  <p className="text-xs text-[#3B3B3B] mb-1">Active</p>
                  <p className="text-2xl font-bold text-green-600">{brokerStats.active}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
                  <p className="text-xs text-[#3B3B3B] mb-1">Verified</p>
                  <p className="text-2xl font-bold text-[#FFD300]">{brokerStats.verified}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
                  <p className="text-xs text-[#3B3B3B] mb-1">Blacklisted</p>
                  <p className="text-2xl font-bold text-red-600">{brokerStats.blacklisted}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
                  <p className="text-xs text-[#3B3B3B] mb-1">Total Listings</p>
                  <p className="text-2xl font-bold text-[#111111]">{brokerStats.totalListings}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
                  <p className="text-xs text-[#3B3B3B] mb-1">Active Listings</p>
                  <p className="text-2xl font-bold text-blue-600">{brokerStats.activeListings}</p>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-[#F7F7F7]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3B3B3B]" />
                    <Input
                      placeholder="Search brokers by name, phone, agency, or area..."
                      value={brokerSearchQuery}
                      onChange={(e) => setBrokerSearchQuery(e.target.value)}
                      className="pl-11"
                    />
                  </div>
                  <Select value={brokerStatusFilter} onValueChange={setBrokerStatusFilter}>
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
                  <Button onClick={handleExportBrokersCSV} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Brokers List */}
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
            </motion.div>
          )}

          {/* Tab Content - Requirements */}
          {activeTab === "requirements" && (
            <motion.div
              key="requirements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
                  <p className="text-xs text-[#3B3B3B] mb-1">Total Requirements</p>
                  <p className="text-2xl font-bold text-[#111111]">{reqStats.total}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
                  <p className="text-xs text-[#3B3B3B] mb-1">Active</p>
                  <p className="text-2xl font-bold text-green-600">{reqStats.active}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
                  <p className="text-xs text-[#3B3B3B] mb-1">Matched</p>
                  <p className="text-2xl font-bold text-blue-600">{reqStats.matched}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
                  <p className="text-xs text-[#3B3B3B] mb-1">Closed</p>
                  <p className="text-2xl font-bold text-[#3B3B3B]">{reqStats.closed}</p>
                </div>
              </div>

              {/* Requirements List */}
              {requirements.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border-2 border-[#F7F7F7]">
                  <Search className="w-12 h-12 text-[#3B3B3B] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#111111] mb-2">No requirements yet</h3>
                  <p className="text-[#3B3B3B]">Client requirements will appear here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {requirements.map((req) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-[#F7F7F7] hover:border-[#FFD300]/30"
                    >
                      {/* Header Section */}
                      <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-6 py-5 border-b border-stone-200/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-2xl font-bold text-[#111111]">{req.client_name}</h3>
                              <Badge className={
                                req.status === "Active" ? "bg-green-500 text-white border-0" :
                                  req.status === "Matched" ? "bg-blue-500 text-white border-0" :
                                    req.status === "Closed" ? "bg-gray-500 text-white border-0" :
                                      "bg-orange-500 text-white border-0"
                              }>
                                {req.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[#3B3B3B]">
                              {req.client_phone && (
                                <span className="flex items-center gap-1.5">
                                  <Phone className="w-4 h-4 text-stone-500" />
                                  {req.client_phone}
                                </span>
                              )}
                              {req.client_email && (
                                <span className="flex items-center gap-1.5">
                                  <Mail className="w-4 h-4 text-stone-500" />
                                  {req.client_email}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-stone-500">
                            {format(new Date(req.created_date), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>

                      {/* Core Requirements */}
                      <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-[#F7F7F7] rounded-2xl p-4">
                            <p className="text-xs text-[#3B3B3B]/60 mb-2 flex items-center gap-1">
                              <HomeIcon className="w-3 h-3" />
                              Type
                            </p>
                            <Badge className="bg-[#FFD300] text-black border-0 font-bold">
                              {req.listing_type}
                            </Badge>
                          </div>
                          <div className="bg-[#F7F7F7] rounded-2xl p-4">
                            <p className="text-xs text-[#3B3B3B]/60 mb-2">BHK</p>
                            <p className="text-base font-bold text-[#111111]">
                              {req.bhk_preference?.join(", ") || "Any"}
                            </p>
                          </div>
                          <div className="bg-[#F7F7F7] rounded-2xl p-4 md:col-span-2">
                            <p className="text-xs text-[#3B3B3B]/60 mb-2 flex items-center gap-1">
                              <IndianRupee className="w-3 h-3" />
                              Budget
                            </p>
                            <p className="text-base font-bold text-[#111111]">
                              ₹{req.budget_min || 0}{req.budget_unit === "crores" ? " Cr" : "L"} -
                              ₹{req.budget_max || 0}{req.budget_unit === "crores" ? " Cr" : "L"}
                            </p>
                          </div>
                        </div>

                        {/* Locations */}
                        {req.preferred_locations && req.preferred_locations.length > 0 && (
                          <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                            <p className="text-xs text-blue-700 font-semibold mb-3 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Preferred Locations
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {req.preferred_locations.map((loc, idx) => (
                                <Badge key={idx} className="bg-white text-blue-700 border-blue-300 font-semibold">
                                  {loc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Preferences */}
                        <div className="mb-6">
                          <p className="text-xs text-[#3B3B3B]/60 mb-3 font-semibold uppercase tracking-wide">Preferences</p>
                          <div className="flex flex-wrap gap-2">
                            {req.furnishing_preference && req.furnishing_preference !== "Any" && (
                              <Badge variant="outline" className="border-stone-300 text-stone-700">
                                {req.furnishing_preference}
                              </Badge>
                            )}
                            {req.veg_nonveg && (
                              <Badge variant="outline" className="border-stone-300 text-stone-700">
                                {req.veg_nonveg}
                              </Badge>
                            )}
                            {req.parking_required && (
                              <Badge variant="outline" className="border-stone-300 text-stone-700">
                                Parking Required
                              </Badge>
                            )}
                            {req.possession_timeline && (
                              <Badge variant="outline" className="border-stone-300 text-stone-700">
                                <Clock className="w-3 h-3 mr-1" />
                                {req.possession_timeline}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Amenities */}
                        {req.amenities_required && req.amenities_required.length > 0 && (
                          <div className="mb-6">
                            <p className="text-xs text-[#3B3B3B]/60 mb-3 font-semibold uppercase tracking-wide">Required Amenities</p>
                            <div className="flex flex-wrap gap-2">
                              {req.amenities_required.map((amenity, idx) => (
                                <Badge key={idx} className="bg-amber-50 text-amber-900 border-amber-200">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {req.notes && (
                          <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                            <p className="text-xs text-stone-600 font-semibold mb-2">Internal Notes</p>
                            <p className="text-sm text-[#111111] leading-relaxed">{req.notes}</p>
                          </div>
                        )}

                        {/* Source Text */}
                        {req.source_text && (
                          <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <p className="text-xs text-blue-600 font-semibold mb-2">Original Message</p>
                            <p className="text-sm text-[#111111] italic leading-relaxed">{req.source_text}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                          {req.client_phone && (
                            <Button
                              onClick={() => {
                                const message = `Hi ${req.client_name}, this is Chariot Realty. We have some properties matching your requirement for ${req.bhk_preference?.join("/")} in ${req.preferred_locations?.join("/")}. Can we share details?`;
                                window.open(`https://wa.me/${req.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                              className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-2xl"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp Client
                            </Button>
                          )}
                          <Button
                            onClick={() => handleFindMatches(req)}
                            variant="outline"
                            className="border-2 border-[#FFD300] text-black hover:bg-[#FFD300] font-semibold rounded-2xl"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Find Matches
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <BrokerPropertiesModal />
      <BrokerEditModal />
      <AIAssistantModal />
      <DealsRadarModal />
      <ImageUploadModal />
    </div>
  );
}
