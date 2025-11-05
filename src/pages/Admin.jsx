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
  Package, Star, Zap, BookOpen
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

  // Various processing states
  const [dealsLoading, setDealsLoading] = useState(false);
  const [generatingSlugs, setGeneratingSlugs] = useState(false);
  const [detectingDuplicates, setDetectingDuplicates] = useState(false);
  const [generatingDescriptions, setGeneratingDescriptions] = useState(false);
  const [testingPropAI, setTestingPropAI] = useState(false);

  // Blog generation states
  const [blogGenModalOpen, setBlogGenModalOpen] = useState(false);
  const [generatingBlog, setGeneratingBlog] = useState(false);
  const [blogPrompt, setBlogPrompt] = useState("");
  const [blogCategory, setBlogCategory] = useState("Neighborhood Guide");
  const [blogTags, setBlogTags] = useState("");
  const [blogRelatedLocations, setBlogRelatedLocations] = useState("");

  // Building Intelligence Tool states
  const [buildingQueryModalOpen, setBuildingQueryModalOpen] = useState(false);
  const [buildingQuery, setBuildingQuery] = useState("");
  const [buildingQueryResult, setBuildingQueryResult] = useState(null);
  const [queryingBuilding, setQueryingBuilding] = useState(false);

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

  const { data: blogs = [] } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: () => base44.entities.Blog.list('-created_date'),
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

  const deleteBlogMutation = useMutation({
    mutationFn: (id) => base44.entities.Blog.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog deleted!', {
        description: 'Blog post has been removed.',
        className: 'bg-slate-600 text-white border-0',
        duration: 2000
      });
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Blog.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog updated!', {
        className: 'bg-green-600 text-white border-0',
        duration: 2000
      });
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
        description: `Images added to property ${selectedPropertyForImages.custom_id || selectedPropertyForImages.id}.`,
        className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0',
        duration: 3000
      });
    } catch (error) {
      console.error('Error uploading images:', error);
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
      toast.success('Image removed!', {
        description: 'Property images updated.',
        className: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0',
        duration: 2000
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image', {
        description: error.message,
        className: 'bg-red-600 text-white border-0'
      });
    }
  };

  // Property actions
  const handleViewProperty = (propertyId) => {
    navigate(createPageUrl("PropertyDetails") + `?id=${propertyId}`);
  };

  const handleDeleteProperty = (propertyId) => {
    if (confirm("Delete this property?")) {
      deletePropertyMutation.mutate(propertyId);
      toast.info('Property deleted!', {
        description: `Property with ID ${propertyId} has been removed.`,
        className: 'bg-slate-600 text-white border-0',
        duration: 2000
      });
    }
  };

  const testPropAIConnection = async () => {
    setTestingPropAI(true);

    toast.loading('🔌 Testing PropAI Live connection...', {
      description: 'Checking API key, endpoint, and sending test payload...',
      className: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0',
      id: 'propai-test'
    });

    try {
      const response = await base44.functions.invoke('testPropAIConnection', {});
      toast.dismiss('propai-test');

      if (response.data.success) {
        toast.success('✅ PropAI Live Connected!', {
          description: (
            <div className="space-y-2">
              <div className="font-semibold">Connection working perfectly</div>
              <div className="text-xs opacity-90 space-y-1">
                <div>✓ Endpoint: {response.data.connection_details.endpoint}</div>
                <div>✓ API Key: {response.data.connection_details.api_key_preview}</div>
                <div>✓ Status: {response.data.connection_details.response_status}</div>
              </div>
            </div>
          ),
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
          duration: 6000
        });
      } else {
        toast.error('❌ PropAI Connection Failed', {
          description: (
            <div className="space-y-2">
              <div className="font-semibold">{response.data.error}</div>
              {response.data.possible_causes && (
                <div className="text-xs opacity-90 space-y-1">
                  <div>Possible causes:</div>
                  {response.data.possible_causes.map((cause, idx) => (
                    <div key={idx}>• {cause}</div>
                  ))}
                </div>
              )}
            </div>
          ),
          className: 'bg-red-600 text-white border-0',
          duration: 8000
        });
      }
    } catch (error) {
      toast.dismiss('propai-test');
      toast.error('❌ Test Failed', {
        description: error.message || 'Unable to test PropAI connection',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setTestingPropAI(false);
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
    },
    blogs: {
      total: blogs.length,
      published: blogs.filter(b => b.status === "Published").length,
      draft: blogs.filter(b => b.status === "Draft").length,
      aiGenerated: blogs.filter(b => b.ai_generated).length,
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
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="text-center text-slate-600">Overview tab content</div>
            </motion.div>
          )}

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
                      {paginatedProperties.map((property) => {
                        const syncStatus = property.propai_sync_status;
                        const isSynced = syncStatus?.success === true;
                        const syncFailed = syncStatus?.attempted === true && syncStatus?.success === false;
                        
                        return (
                          <div
                            key={property.id}
                            className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-[#FFD300] hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative w-20 h-20 flex-shrink-0">
                                {property.images && property.images.length > 0 ? (
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
                                <div className="flex items-start gap-2 mb-2 flex-wrap">
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
                                  
                                  {isSynced && (
                                    <Badge className="bg-green-500/20 text-green-700 border-green-500 text-xs">
                                      <Zap className="w-3 h-3 mr-1" />
                                      PropAI ✓
                                    </Badge>
                                  )}
                                  {syncFailed && (
                                    <Badge 
                                      className="bg-red-500/20 text-red-700 border-red-500 text-xs cursor-help"
                                      title={`PropAI sync failed: ${syncStatus.error || 'Unknown error'}`}
                                    >
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Sync Failed
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
                        );
                      })}
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
        </AnimatePresence>
      </div>

      <ImageUploadModal />
    </div>
  );
}