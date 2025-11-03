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
  Package, Star, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [propSearchQuery, setPropSearchQuery] = useState("");
  const [propStatusFilter, setPropStatusFilter] = useState("Active");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [brokerSearchQuery, setBrokerSearchQuery] = useState("");
  const [brokerStatusFilter, setBrokerStatusFilter] = useState("all");
  const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false);
  const [selectedPropertyForImages, setSelectedPropertyForImages] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagesToUpload, setImagesToUpload] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(false);
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

      toast.success(`✅ Uploaded ${uploadedUrls.length} image(s)!`);
    } catch (error) {
      toast.error('Failed to upload images');
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
      toast.success('Image removed!');
    } catch (error) {
      toast.error('Failed to remove image');
    }
  };

  const handleViewProperty = (propertyId) => {
    navigate(createPageUrl("PropertyDetails") + `?id=${propertyId}`);
  };

  const handleDeleteProperty = (propertyId) => {
    if (confirm("Delete this property?")) {
      deletePropertyMutation.mutate(propertyId);
      toast.info('Property deleted!');
    }
  };

  const loadDealsRadar = async () => {
    setDealsLoading(true);
    try {
      const response = await base44.functions.invoke('getDealsRadar', {});
      toast.success('Deals Radar Loaded', {
        description: `💎 ${response.data.summary.underpricedDeals} Underpriced | 📉 ${response.data.summary.priceDrops} Price Drops | 🎯 ${response.data.summary.hiddenMatches} Hidden Matches`,
      });
    } catch (error) {
      toast.error('Failed to load deals radar');
    } finally {
      setDealsLoading(false);
    }
  };

  const recalculateBrokerTrust = async () => {
    if (!confirm('Recalculate all broker trust scores?')) return;
    try {
      const response = await base44.functions.invoke('calculateBrokerTrust', { recalculateAll: true });
      toast.success(`✅ Scored ${response.data.brokersScored} brokers!`);
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
    } catch (error) {
      toast.error('Failed to calculate scores');
    }
  };

  const generatePropertySlugs = async () => {
    if (!confirm('Generate SEO slugs for all properties without slugs?')) return;
    setGeneratingSlugs(true);
    try {
      const response = await base44.functions.invoke('generatePropertySlugs', { 
        generateForAll: true 
      });
      toast.success(`✅ Generated ${response.data.successCount} slugs!`);
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (error) {
      toast.error('Failed to generate slugs');
    } finally {
      setGeneratingSlugs(false);
    }
  };

  const backfillBuildings = async () => {
    if (!confirm('Generate buildings from all properties?\n\nThis will:\n1. Find properties with building names\n2. Create Building entities\n3. Link properties to buildings')) return;
    setGeneratingSlugs(true);
    
    toast.loading('🏗️ Building Intelligence System running...', { id: 'building-backfill' });

    try {
      const response = await base44.functions.invoke('backfillBuildings', {});
      const { results } = response.data;
      
      toast.dismiss('building-backfill');
      
      if (results.properties_processed === 0) {
        toast.info(`✅ All properties already linked! Created ${results.buildings_created} buildings total.`);
      } else {
        toast.success(`✅ Processed ${results.properties_processed} properties! Created ${results.buildings_created} buildings, linked ${results.buildings_linked} existing.`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (error) {
      toast.dismiss('building-backfill');
      toast.error(`❌ Failed: ${error.message}`);
    } finally {
      setGeneratingSlugs(false);
    }
  };

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

  const handleFindMatches = (req) => {
    const searchParams = new URLSearchParams();
    if (req.bhk_preference?.[0]) searchParams.set('bhk', req.bhk_preference[0]);
    if (req.listing_type) searchParams.set('listingType', req.listing_type);
    if (req.preferred_locations?.[0]) searchParams.set('search', req.preferred_locations[0]);
    navigate(createPageUrl("SmartFeed") + "?" + searchParams.toString());
  };

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
      <Toaster position="top-center" richColors closeButton />
      
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#FFD300] to-[#FFA500] rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">Auto-refresh: 15s</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                {generatingSlugs ? 'Processing...' : 'SEO Slugs'}
              </Button>
              <Button
                onClick={backfillBuildings}
                disabled={generatingSlugs}
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Building2 className={`w-4 h-4 mr-2 ${generatingSlugs ? 'animate-spin' : ''}`} />
                {generatingSlugs ? 'Processing...' : 'Buildings'}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full md:w-80 h-12 font-semibold text-base bg-white border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Overview</span>
                  </div>
                </SelectItem>
                <SelectItem value="properties">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    <span>Properties ({stats.properties.active})</span>
                  </div>
                </SelectItem>
                <SelectItem value="duplicates">
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    <span>Duplicates ({stats.properties.duplicates})</span>
                  </div>
                </SelectItem>
                <SelectItem value="brokers">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Brokers ({stats.brokers.active})</span>
                  </div>
                </SelectItem>
                <SelectItem value="requirements">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Leads ({stats.requirements.active})</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.properties.active}</p>
                    <p className="text-sm text-slate-500">Active Properties</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-2">
                      <Copy className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.properties.duplicates}</p>
                    <p className="text-sm text-slate-500">Duplicates</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.properties.needsPhotos}</p>
                    <p className="text-sm text-slate-500">Need Photos</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.brokers.active}</p>
                    <p className="text-sm text-slate-500">Active Brokers</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stats.requirements.active}</p>
                    <p className="text-sm text-slate-500">Active Leads</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "properties" && (
            <motion.div key="properties" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                                {property.ai_title || `${property.bhk} in ${property.location || 'Mumbai'}`}
                              </h3>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>{property.location || 'Mumbai'}</span>
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

          {activeTab === "brokers" && (
            <motion.div key="brokers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
        </AnimatePresence>
      </div>

      <ImageUploadModal />
    </div>
  );
}