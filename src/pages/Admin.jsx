
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Shield, Home, Users, Building2, FileText, Search,
  Eye, Trash2, AlertTriangle, Copy, Upload, MessageCircle,
  Image as ImageIcon, X, CheckCircle2, RefreshCw, MapPin,
  Sparkles, Clock, TrendingUp, BarChart3, Phone, Mail,
  Package, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Properties state
  const [propSearchQuery, setPropSearchQuery] = useState("");
  const [propStatusFilter, setPropStatusFilter] = useState("Active");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Brokers state
  const [brokerSearchQuery, setBrokerSearchQuery] = useState("");
  const [brokerStatusFilter, setBrokerStatusFilter] = useState("all");

  // Image upload states
  const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false);
  const [selectedPropertyForImages, setSelectedPropertyForImages] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagesToUpload, setImagesToUpload] = useState([]);

  // Deals Radar state
  const [dealsLoading, setDealsLoading] = useState(false);

  // Slug generation state
  const [generatingSlugs, setGeneratingSlugs] = useState(false);

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

  // Queries with auto-refresh
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    initialData: [],
    enabled: isAuthorized,
    refetchInterval: 15000,
  });

  const { data: duplicates = [] } = useQuery({
    queryKey: ['duplicate-properties'],
    queryFn: () => base44.entities.Property.filter({ is_duplicate: true }, '-created_date'),
    initialData: [],
    enabled: isAuthorized,
    refetchInterval: 15000,
  });

  const { data: brokers = [] } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => base44.entities.Broker.list('-last_activity'),
    initialData: [],
    enabled: isAuthorized,
    refetchInterval: 15000,
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    initialData: [],
    enabled: isAuthorized,
    refetchInterval: 15000,
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
      setImageUploadModalOpen(false);
      setSelectedPropertyForImages(null);
      setImagesToUpload([]);
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
        }
      }

      const existingImages = selectedPropertyForImages.images || [];
      const updatedImages = [...existingImages, ...uploadedUrls];

      await updatePropertyMutation.mutateAsync({
        id: selectedPropertyForImages.id,
        data: { images: updatedImages }
      });

      alert(`✅ Uploaded ${uploadedUrls.length} image(s)!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (imageUrl) => {
    if (!selectedPropertyForImages || !confirm('Remove this image?')) return;

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
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Failed to remove image');
    }
  };

  // Property actions
  const handleViewProperty = (propertyId) => {
    navigate(createPageUrl("PropertyDetails") + `?id=${propertyId}`);
  };

  const handleDeleteProperty = (propertyId) => {
    if (confirm("Delete this property?")) {
      deletePropertyMutation.mutate(propertyId);
    }
  };

  const loadDealsRadar = async () => {
    setDealsLoading(true);
    try {
      const response = await base44.functions.invoke('getDealsRadar', {});
      alert(`📊 Deals Radar:\n\n💎 ${response.data.summary.underpricedDeals} Underpriced\n📉 ${response.data.summary.priceDrops} Price Drops\n🎯 ${response.data.summary.hiddenMatches} Hidden Matches`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to load deals radar');
    } finally {
      setDealsLoading(false);
    }
  };

  const recalculateBrokerTrust = async () => {
    if (!confirm('Recalculate all broker trust scores?')) return;
    try {
      const response = await base44.functions.invoke('calculateBrokerTrust', { recalculateAll: true });
      alert(`✅ Scored ${response.data.brokersScored} brokers!`);
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
    } catch (error) {
      alert('Failed to calculate scores');
    }
  };

  const generatePropertySlugs = async () => {
    if (!confirm('Generate SEO slugs for all properties without slugs?')) return;
    setGeneratingSlugs(true);
    try {
      const response = await base44.functions.invoke('generatePropertySlugs', { 
        generateForAll: true 
      });
      alert(`✅ Generated ${response.data.successCount} slugs!\n\nAll properties now have SEO-friendly URLs.`);
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (error) {
      alert('Failed to generate slugs: ' + error.message);
    } finally {
      setGeneratingSlugs(false);
    }
  };

  // Broker handlers
  const handleWhatsApp = (broker) => {
    const brokerProps = properties.filter(p => p.broker_id === broker.id);
    
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
      message += `Can we discuss these listings?`;
    } else {
      message += `Can we discuss potential property listings in ${broker.areas_covered?.join(', ') || 'your areas'}?`;
    }
    
    window.open(`https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Requirement handlers
  const handleFindMatches = (req) => {
    const searchParams = new URLSearchParams();
    if (req.bhk_preference?.[0]) searchParams.set('bhk', req.bhk_preference[0]);
    if (req.listing_type) searchParams.set('listingType', req.listing_type);
    if (req.preferred_locations?.[0]) searchParams.set('search', req.preferred_locations[0]);
    navigate(createPageUrl("SmartFeed") + "?" + searchParams.toString());
  };

  // Stats
  const stats = {
    properties: {
      total: properties.length,
      active: properties.filter(p => p.status === "Active" && !p.is_duplicate).length,
      duplicates: duplicates.length,
      needsPhotos: properties.filter(p => !p.images || p.images.length === 0).length,
    },
    brokers: {
      total: brokers.length,
      active: brokers.filter(b => b.status === "Active").length,
      verified: brokers.filter(b => b.verified).length,
    },
    requirements: {
      total: requirements.length,
      active: requirements.filter(r => r.status === "Active").length,
    }
  };

  // Filtered data
  const filteredProperties = properties.filter(property => {
    if (property.is_duplicate) return false;
    
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
      broker.agency_name?.toLowerCase().includes(brokerSearchQuery.toLowerCase());

    let matchesStatus = true;
    if (brokerStatusFilter === "Active") {
      matchesStatus = broker.status === "Active";
    } else if (brokerStatusFilter === "Verified") {
      matchesStatus = broker.verified;
    } else if (brokerStatusFilter === "Dormant") {
      matchesStatus = broker.status === "Dormant";
    }

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Image Upload Modal
  const ImageUploadModal = () => {
    if (!selectedPropertyForImages) return null;

    return (
      <Dialog open={imageUploadModalOpen} onOpenChange={setImageUploadModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#FFD300]" />
              Images: {selectedPropertyForImages.custom_id || 'Property'}
            </DialogTitle>
          </DialogHeader>

          {selectedPropertyForImages.images && selectedPropertyForImages.images.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm">Current ({selectedPropertyForImages.images.length})</h4>
              <div className="grid grid-cols-4 gap-2">
                {selectedPropertyForImages.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={img} 
                      alt={`${idx + 1}`} 
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      onClick={() => handleRemoveImage(img)}
                      size="icon"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 bg-red-500 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            
            {imagesToUpload.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700 font-semibold">
                  {imagesToUpload.length} file(s) selected
                </p>
              </div>
            )}

            <div className="flex gap-2">
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
                onClick={() => setImageUploadModalOpen(false)}
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#FFD300] to-[#FFA500] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-black" />
          </div>
          <p className="text-slate-600 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Fixed Header */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#FFD300] to-[#FFA500] rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">Auto-refresh: 15s</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={loadDealsRadar}
                disabled={dealsLoading}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {dealsLoading ? 'Loading...' : 'Deals'}
              </Button>
              <Button
                onClick={recalculateBrokerTrust}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Trust
              </Button>
              <Button
                onClick={generatePropertySlugs}
                disabled={generatingSlugs}
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generatingSlugs ? 'animate-spin' : ''}`} />
                {generatingSlugs ? 'Generating...' : 'SEO Slugs'}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-[#FFD300] to-[#FFA500] text-black shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </button>
            
            <button
              onClick={() => setActiveTab("properties")}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === "properties"
                  ? "bg-gradient-to-r from-[#FFD300] to-[#FFA500] text-black shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Home className="w-4 h-4" />
              Properties
              <Badge className={activeTab === "properties" ? "bg-black/20 text-black" : "bg-slate-200 text-slate-700"}>
                {stats.properties.active}
              </Badge>
            </button>
            
            <button
              onClick={() => setActiveTab("duplicates")}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === "duplicates"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Copy className="w-4 h-4" />
              Duplicates
              <Badge className={activeTab === "duplicates" ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"}>
                {stats.properties.duplicates}
              </Badge>
            </button>
            
            <button
              onClick={() => setActiveTab("brokers")}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === "brokers"
                  ? "bg-gradient-to-r from-[#FFD300] to-[#FFA500] text-black shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              Brokers
              <Badge className={activeTab === "brokers" ? "bg-black/20 text-black" : "bg-slate-200 text-slate-700"}>
                {stats.brokers.active}
              </Badge>
            </button>
            
            <button
              onClick={() => setActiveTab("requirements")}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === "requirements"
                  ? "bg-gradient-to-r from-[#FFD300] to-[#FFA500] text-black shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              Leads
              <Badge className={activeTab === "requirements" ? "bg-black/20 text-black" : "bg-slate-200 text-slate-700"}>
                {stats.requirements.active}
              </Badge>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
        
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.properties.active}</p>
                    <p className="text-sm text-slate-500">Active Properties</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-2">
                      <Copy className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.properties.duplicates}</p>
                    <p className="text-sm text-slate-500">Duplicates</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.properties.needsPhotos}</p>
                    <p className="text-sm text-slate-500">Need Photos</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.brokers.active}</p>
                    <p className="text-sm text-slate-500">Active Brokers</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.requirements.active}</p>
                    <p className="text-sm text-slate-500">Active Leads</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Properties needing photos</h3>
                    <p className="text-sm text-slate-600 mb-4">{stats.properties.needsPhotos} properties have no images</p>
                    <Button
                      onClick={() => {
                        setActiveTab("properties");
                        setPropStatusFilter("Active");
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      View & Upload
                    </Button>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Duplicates to review</h3>
                    <p className="text-sm text-slate-600 mb-4">{stats.properties.duplicates} potential duplicates found</p>
                    <Button
                      onClick={() => setActiveTab("duplicates")}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Review Duplicates
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Properties Tab */}
          {activeTab === "properties" && (
            <motion.div
              key="properties"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search by building, location, ID..."
                        value={propSearchQuery}
                        onChange={(e) => {
                          setPropSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Select value={propStatusFilter} onValueChange={(val) => {
                      setPropStatusFilter(val);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-40">
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
                  
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                    <span>{filteredProperties.length} properties</span>
                    <span>Page {currentPage} of {totalPages || 1}</span>
                  </div>
                </div>

                {propertiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No properties found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedProperties.map((property) => (
                        <div
                          key={property.id}
                          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-[#FFD300] hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 flex-shrink-0">
                              {property.images?.[0] ? (
                                <img 
                                  src={property.images[0]} 
                                  alt=""
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center">
                                  <Building2 className="w-8 h-8 text-slate-300" />
                                </div>
                              )}
                              <Badge className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5">
                                {property.images?.length || 0}
                              </Badge>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-2">
                                <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300] text-xs">
                                  {property.bhk}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${
                                  property.status === "Active" ? "border-green-500 text-green-700" : ""
                                }`}>
                                  {property.status}
                                </Badge>
                                {property.custom_id && (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {property.custom_id}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-bold text-slate-900 text-sm mb-1 truncate">
                                {property.ai_title || `${property.bhk} in ${property.location}`}
                              </h3>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>{property.location}</span>
                                <span>•</span>
                                <span>₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}</span>
                                {property.carpet_area && (
                                  <>
                                    <span>•</span>
                                    <span>{property.carpet_area} sqft</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                onClick={() => handleImageUpload(property)}
                                size="sm"
                                variant="outline"
                                className="h-9"
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleViewProperty(property.id)}
                                size="sm"
                                variant="outline"
                                className="h-9"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteProperty(property.id)}
                                size="sm"
                                variant="outline"
                                className="h-9 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-6">
                        <Button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        <span className="px-4 py-2 text-sm text-slate-600">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Duplicates Tab */}
          {activeTab === "duplicates" && (
            <motion.div
              key="duplicates"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="space-y-4">
                {duplicates.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">All Clean!</h3>
                    <p className="text-slate-500">No duplicates found</p>
                  </div>
                ) : (
                  duplicates.map((property) => (
                    <div
                      key={property.id}
                      className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border-2 border-orange-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 flex-shrink-0">
                          {property.images?.[0] ? (
                            <img 
                              src={property.images[0]} 
                              alt=""
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <div className="w-full h-full bg-orange-100 rounded-xl flex items-center justify-center">
                              <Copy className="w-8 h-8 text-orange-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-orange-600 text-white">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              DUPLICATE
                            </Badge>
                            <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300]">
                              {property.bhk}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm mb-1">
                            {property.ai_title || `${property.bhk} in ${property.location}`}
                          </h3>
                          <p className="text-xs text-orange-700">
                            {property.building_name} • ₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewProperty(property.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              if (confirm("Restore?")) {
                                updatePropertyMutation.mutate({
                                  id: property.id,
                                  data: { is_duplicate: false, duplicate_of: null }
                                });
                              }
                            }}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Restore
                          </Button>
                          <Button
                            onClick={() => handleDeleteProperty(property.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Brokers Tab */}
          {activeTab === "brokers" && (
            <motion.div
              key="brokers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search brokers..."
                        value={brokerSearchQuery}
                        onChange={(e) => setBrokerSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={brokerStatusFilter} onValueChange={setBrokerStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Verified">Verified</SelectItem>
                        <SelectItem value="Dormant">Dormant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredBrokers.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                      <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No brokers found</h3>
                      <p className="text-slate-500">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    filteredBrokers.map((broker) => {
                      const brokerProps = properties.filter(p => p.broker_id === broker.id);
                      
                      return (
                        <div
                          key={broker.id}
                          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#FFD300] hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-slate-900">{broker.name}</h3>
                                {broker.verified && (
                                  <Badge className="bg-green-500/20 text-green-700 border-green-500">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              {broker.custom_id && (
                                <p className="text-xs text-slate-500 font-mono mb-2">{broker.custom_id}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {broker.phone}
                                </span>
                                <span>•</span>
                                <span>{brokerProps.length} listings</span>
                                {broker.trust_score && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-[#FFD300]" fill="currentColor" />
                                      {broker.trust_score}/100
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {broker.areas_covered && broker.areas_covered.length > 0 && (
                            <div className="mb-3">
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

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleWhatsApp(broker)}
                              className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                              size="sm"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp
                            </Button>
                          </div>
                        </div>
                      );
                    }))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Requirements Tab */}
          {activeTab === "requirements" && (
            <motion.div
              key="requirements"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="space-y-4">
                {requirements.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No requirements yet</h3>
                    <p className="text-slate-500">Client requirements will appear here</p>
                  </div>
                ) : (
                  requirements.map((req) => {
                    const daysOld = Math.floor((Date.now() - new Date(req.created_date).getTime()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysOld <= 7;
                    const isOld = daysOld > 30;

                    return (
                      <div
                        key={req.id}
                        className={`bg-gradient-to-br rounded-2xl p-6 border-2 hover:shadow-lg transition-all ${
                          req.status === "Active" 
                            ? "from-white to-green-50 border-green-200" 
                            : req.status === "Matched"
                            ? "from-white to-blue-50 border-blue-200"
                            : "from-white to-slate-50 border-slate-200"
                        }`}
                      >
                        {/* Header Row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-slate-900">
                                {req.client_name}
                              </h3>
                              <Badge className={`${
                                req.status === "Active" ? "bg-green-500 text-white" :
                                req.status === "Matched" ? "bg-blue-500 text-white" :
                                "bg-slate-500 text-white"
                              }`}>
                                {req.status}
                              </Badge>
                              {isUrgent && (
                                <Badge className="bg-orange-500 text-white">
                                  🔥 New
                                </Badge>
                              )}
                              {isOld && (
                                <Badge variant="outline" className="text-slate-500">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {daysOld}d old
                                </Badge>
                              )}
                            </div>
                            
                            {req.client_type && (
                              <Badge variant="outline" className="text-xs mb-2">
                                {req.client_type}
                              </Badge>
                            )}
                          </div>
                          
                          <span className="text-sm text-slate-500 whitespace-nowrap ml-4">
                            {format(new Date(req.created_date), "MMM dd, yyyy")}
                          </span>
                        </div>

                        {/* Contact Info Row */}
                        {req.client_phone && (
                          <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-500" />
                              <a 
                                href={`tel:${req.client_phone}`}
                                className="hover:text-[#FFD300] transition-colors"
                              >
                                {req.client_phone}
                              </a>
                            </div>
                            {req.client_email && (
                              <>
                                <span className="text-slate-300">•</span>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-slate-500" />
                                  <a 
                                    href={`mailto:${req.client_email}`}
                                    className="hover:text-[#FFD300] transition-colors"
                                  >
                                    {req.client_email}
                                  </a>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Requirements Summary - Visual Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {/* BHK */}
                          <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">Looking For</p>
                            <p className="font-bold text-slate-900">
                              {req.bhk_preference?.join(", ") || "Any"} BHK
                            </p>
                          </div>

                          {/* Listing Type */}
                          <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">Type</p>
                            <p className="font-bold text-slate-900">{req.listing_type}</p>
                          </div>

                          {/* Budget */}
                          <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">Budget</p>
                            <p className="font-bold text-slate-900">
                              ₹{req.budget_min}-{req.budget_max}
                              {req.budget_unit === 'crores' ? ' Cr' : 'L'}
                            </p>
                          </div>

                          {/* Furnishing */}
                          {req.furnishing_preference && (
                            <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-slate-200">
                              <p className="text-xs text-slate-500 mb-1">Furnishing</p>
                              <p className="font-bold text-slate-900">{req.furnishing_preference}</p>
                            </div>
                          )}
                        </div>

                        {/* Preferred Locations */}
                        {req.preferred_locations && req.preferred_locations.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-slate-500 mb-2">Preferred Locations:</p>
                            <div className="flex flex-wrap gap-2">
                              {req.preferred_locations.map((loc, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-white/50">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {loc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {req.notes && (
                          <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                            <p className="text-xs text-amber-700 font-semibold mb-1">Notes:</p>
                            <p className="text-sm text-amber-900">{req.notes}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-3 border-t border-slate-200">
                          {req.client_phone && (
                            <Button
                              onClick={() => {
                                const message = `Hi ${req.client_name}, this is Chariot Realty. We have properties matching your requirement. Can we share details?`;
                                window.open(`https://wa.me/${req.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                              className="bg-[#25D366] hover:bg-[#20BD5A] text-white flex-1"
                              size="sm"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp Client
                            </Button>
                          )}
                          <Button
                            onClick={() => handleFindMatches(req)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-[#FFD300] text-[#111111] hover:bg-[#FFD300]"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Find Matches
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ImageUploadModal />
    </div>
  );
}
