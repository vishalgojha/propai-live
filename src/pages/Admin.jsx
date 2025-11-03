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
  Eye, Trash2, AlertTriangle, Copy, Upload,
  Image as ImageIcon, X, CheckCircle2, RefreshCw,
  Sparkles, Clock, TrendingUp, BarChart3, ArrowLeft,
  Package
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

  // Image upload states
  const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false);
  const [selectedPropertyForImages, setSelectedPropertyForImages] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagesToUpload, setImagesToUpload] = useState([]);

  // Deals Radar state
  const [dealsLoading, setDealsLoading] = useState(false);

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

  // Filtered & paginated properties
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
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
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
                Sync Trust
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

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Overview Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.properties.active}</p>
                    <p className="text-sm text-slate-500">Active Properties</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Copy className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.properties.duplicates}</p>
                    <p className="text-sm text-slate-500">Duplicates</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.properties.needsPhotos}</p>
                    <p className="text-sm text-slate-500">Need Photos</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.brokers.active}</p>
                    <p className="text-sm text-slate-500">Active Brokers</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.requirements.active}</p>
                    <p className="text-sm text-slate-500">Active Leads</p>
                  </div>
                </div>

                {/* Quick Actions Grid */}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                {/* Search & Filters */}
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

                {/* Properties List */}
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
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-[#FFD300] hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-4">
                            {/* Image Thumbnail */}
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

                            {/* Info */}
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

                            {/* Actions */}
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
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination */}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
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

          {/* Brokers Tab - Navigate to dedicated page */}
          {activeTab === "brokers" && (
            <motion.div
              key="brokers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-12 text-center border border-slate-200"
            >
              <Users className="w-16 h-16 text-[#FFD300] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Broker Management</h3>
              <p className="text-slate-600 mb-6">View and manage all broker relationships</p>
              <Button
                onClick={() => navigate(createPageUrl("AdminBrokers"))}
                className="bg-[#FFD300] hover:bg-[#FFC700] text-black font-bold"
              >
                <Users className="w-4 h-4 mr-2" />
                Go to Brokers Section
              </Button>
            </motion.div>
          )}

          {/* Requirements Tab - Navigate to dedicated page */}
          {activeTab === "requirements" && (
            <motion.div
              key="requirements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-12 text-center border border-slate-200"
            >
              <FileText className="w-16 h-16 text-[#FFD300] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Lead Management</h3>
              <p className="text-slate-600 mb-6">View and manage client requirements</p>
              <Button
                onClick={() => navigate(createPageUrl("AdminRequirements"))}
                className="bg-[#FFD300] hover:bg-[#FFC700] text-black font-bold"
              >
                <FileText className="w-4 h-4 mr-2" />
                Go to Requirements Section
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ImageUploadModal />
    </div>
  );
}