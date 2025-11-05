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
  Shield, Home, Users, FileText, Search,
  Eye, Trash2, AlertTriangle, Upload, MessageCircle,
  Image as ImageIcon, X, RefreshCw, MapPin,
  Phone, Mail, Package, BarChart3, CheckCircle2, Zap
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

  // Processing states
  const [testingPropAI, setTestingPropAI] = useState(false);
  const [backfillingIds, setBackfillingIds] = useState(false);

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

      toast.success(`✅ Uploaded ${uploadedUrls.length} image(s)!`, {
        className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0',
        duration: 3000
      });
    } catch (error) {
      toast.error('Failed to upload images', {
        description: error.message,
        className: 'bg-red-600 text-white border-0'
      });
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

  // Property actions
  const handleViewProperty = (propertyId) => {
    navigate(createPageUrl("PropertyDetails") + `?id=${propertyId}`);
  };

  const handleDeleteProperty = (propertyId) => {
    if (confirm("Delete this property?")) {
      deletePropertyMutation.mutate(propertyId);
      toast.info('Property deleted!');
    }
  };

  const testPropAIConnection = async () => {
    setTestingPropAI(true);
    toast.loading('🔌 Testing PropAI Live connection...', { id: 'propai-test' });

    try {
      const response = await base44.functions.invoke('testPropAIConnection', {});
      toast.dismiss('propai-test');

      if (response.data.success) {
        toast.success('✅ PropAI Live Connected!', {
          description: 'Connection working perfectly',
          duration: 6000
        });
      } else {
        toast.error('❌ PropAI Connection Failed', {
          description: response.data.error,
          duration: 8000
        });
      }
    } catch (error) {
      toast.dismiss('propai-test');
      toast.error('❌ Test Failed', {
        description: error.message,
        duration: 5000
      });
    } finally {
      setTestingPropAI(false);
    }
  };

  const backfillCustomIds = async () => {
    if (!confirm('🔧 Backfill Custom IDs?\n\nThis will:\n• Generate CHT-{LOC}-XXXX for Properties\n• Generate CHR-BRK-XXXX for Brokers\n• Generate CHR-REQ-XXXX for Requirements\n\nRun dry-run first?')) {
      return;
    }

    setBackfillingIds(true);
    toast.loading('🔍 Analyzing missing custom IDs...', { id: 'customid-dry-run' });

    try {
      const dryRunResponse = await base44.functions.invoke('backfillCustomIds', { mode: 'dry_run' });
      toast.dismiss('customid-dry-run');

      const analysis = dryRunResponse.data.analysis;
      const totalMissing = analysis.total_missing;

      if (totalMissing === 0) {
        toast.success('✅ All Custom IDs Present!', {
          description: 'Every record already has a custom_id',
          duration: 4000
        });
        setBackfillingIds(false);
        return;
      }

      const shouldFix = confirm(
        `Found ${totalMissing} records missing custom_id:\n\n` +
        `• Properties: ${analysis.properties_missing}\n` +
        `• Brokers: ${analysis.brokers_missing}\n` +
        `• Requirements: ${analysis.requirements_missing}\n\n` +
        `Generate custom IDs now?`
      );

      if (!shouldFix) {
        setBackfillingIds(false);
        return;
      }

      toast.loading('🔧 Generating custom IDs...', { id: 'customid-fix' });
      const fixResponse = await base44.functions.invoke('backfillCustomIds', { mode: 'fix' });
      toast.dismiss('customid-fix');

      const results = fixResponse.data.results;

      toast.success('✅ Custom IDs Generated!', {
        description: `Properties: ${results.properties_fixed} • Brokers: ${results.brokers_fixed} • Requirements: ${results.requirements_fixed}`,
        duration: 8000
      });

      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      queryClient.invalidateQueries({ queryKey: ['requirements'] });

    } catch (error) {
      toast.dismiss('customid-dry-run');
      toast.dismiss('customid-fix');
      toast.error('❌ Custom ID Backfill Failed', {
        description: error.message || 'Something went wrong',
        duration: 5000
      });
    } finally {
      setBackfillingIds(false);
    }
  };

  // Broker handlers
  const handleWhatsApp = (broker) => {
    const brokerProps = properties.filter(p => p.broker_id === broker.id);
    let message = `Hi ${broker.name}, this is Chariot Realty.\n\n`;
    
    if (brokerProps.length > 0) {
      message += `Regarding your ${brokerProps.length} listing${brokerProps.length > 1 ? 's' : ''}`;
    } else {
      message += `Can we discuss potential property listings?`;
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
    },
    brokers: {
      total: brokers.length,
      active: brokers.filter(b => b.status === "Active").length,
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
      <Toaster position="top-center" richColors closeButton />
      
      {/* Fixed Header */}
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
                onClick={backfillCustomIds}
                disabled={backfillingIds}
                size="sm"
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold"
              >
                <AlertTriangle className={`w-4 h-4 mr-2 ${backfillingIds ? 'animate-spin' : ''}`} />
                {backfillingIds ? 'Fixing...' : 'Fix Custom IDs'}
              </Button>
              <Button
                onClick={testPropAIConnection}
                disabled={testingPropAI}
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Zap className={`w-4 h-4 mr-2 ${testingPropAI ? 'animate-spin' : ''}`} />
                {testingPropAI ? 'Testing...' : 'Test PropAI'}
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
                <SelectItem value="brokers">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Brokers ({stats.brokers.active})</span>
                  </div>
                </SelectItem>
                <SelectItem value="requirements">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Requirements ({stats.requirements.active})</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">{stats.properties.active}</p>
                  <p className="text-sm text-slate-500">Active Properties</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">{stats.brokers.active}</p>
                  <p className="text-sm text-slate-500">Active Brokers</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">{stats.requirements.active}</p>
                  <p className="text-sm text-slate-500">Active Requirements</p>
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
                              {property.images && property.images[0] ? (
                                <img 
                                  src={property.images[0]} 
                                  alt=""
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center">
                                  <Home className="w-8 h-8 text-slate-300" />
                                </div>
                              )}
                              <Badge className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5">
                                {property.images?.length || 0}
                              </Badge>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-2 flex-wrap">
                                <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300] text-xs">
                                  {property.bhk}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
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

          {/* Brokers Tab */}
          {activeTab === "brokers" && (
            <motion.div
              key="brokers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                    </div>
                  ) : (
                    filteredBrokers.map((broker) => {
                      const brokerProps = properties.filter(p => p.broker_id === broker.id);
                      return (
                        <div
                          key={broker.id}
                          className="bg-white rounded-2xl p-5 border border-slate-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 mb-1">{broker.name}</h3>
                              {broker.custom_id && (
                                <Badge variant="outline" className="font-mono text-xs mb-2">
                                  {broker.custom_id}
                                </Badge>
                              )}
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {broker.phone}
                                </span>
                                <span>•</span>
                                <span>{brokerProps.length} listings</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleWhatsApp(broker)}
                            className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                            size="sm"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </Button>
                        </div>
                      );
                    })
                  )}
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
            >
              <div className="space-y-4">
                {requirements.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No requirements yet</h3>
                  </div>
                ) : (
                  requirements.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-slate-900">{req.client_name}</h3>
                        <Badge className="bg-green-500 text-white">{req.status}</Badge>
                      </div>
                      
                      {req.client_phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                          <Phone className="w-4 h-4" />
                          {req.client_phone}
                        </div>
                      )}

                      {req.custom_id && (
                        <Badge variant="outline" className="font-mono text-xs mb-3">
                          {req.custom_id}
                        </Badge>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500 mb-1">Looking For</p>
                          <p className="font-bold text-slate-900">
                            {req.bhk_preference?.join(", ") || "Any"} BHK
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500 mb-1">Budget</p>
                          <p className="font-bold text-slate-900">
                            ₹{req.budget_min}-{req.budget_max}
                            {req.budget_unit === 'crores' ? ' Cr' : 'L'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {req.client_phone && (
                          <Button
                            onClick={() => {
                              const message = `Hi ${req.client_name}, this is Chariot Realty.`;
                              window.open(`https://wa.me/${req.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                            className="bg-[#25D366] hover:bg-[#20BD5A] text-white flex-1"
                            size="sm"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </Button>
                        )}
                        <Button
                          onClick={() => handleFindMatches(req)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Find Matches
                        </Button>
                      </div>
                    </div>
                  ))
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