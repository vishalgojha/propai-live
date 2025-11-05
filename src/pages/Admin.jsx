
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

  // Deals Radar state
  const [dealsLoading, setDealsLoading] = useState(false);

  // Slug generation and building backfill state (reused for general processing)
  const [generatingSlugs, setGeneratingSlugs] = useState(false);

  // Duplicate detection state
  const [detectingDuplicates, setDetectingDuplicates] = useState(false);

  // AI Description generation state
  const [generatingDescriptions, setGeneratingDescriptions] = useState(false);

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

  // PropAI Connection Test State
  const [testingPropAI, setTestingPropAI] = useState(false);

  // Custom ID Backfill State
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

  const loadDealsRadar = async () => {
    setDealsLoading(true);
    try {
      const response = await base44.functions.invoke('getDealsRadar', {});
      toast.success('Deals Radar Loaded', {
        description: `💎 ${response.data.summary.underpricedDeals} Underpriced | 📉 ${response.data.summary.priceDrops} Price Drops | 🎯 ${response.data.summary.hiddenMatches} Hidden Matches`,
        duration: 5000,
        className: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0'
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load deals radar', {
        description: error.message,
        className: 'bg-red-600 text-white border-0'
      });
    } finally {
      setDealsLoading(false);
    }
  };

  const recalculateBrokerTrust = async () => {
    if (!confirm('Recalculate all broker trust scores?')) return;
    try {
      const response = await base44.functions.invoke('calculateBrokerTrust', { recalculateAll: true });
      toast.success('✅ Broker Trust Scores Updated', {
        description: `Scored ${response.data.brokersScored} brokers successfully`,
        className: 'bg-gradient-to-r from-[#FFD300] to-[#FFA500] text-black border-0',
        duration: 4000
      });
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
    } catch (error) {
      toast.error('Failed to calculate scores', {
        description: error.message,
        className: 'bg-red-600 text-white border-0'
      });
    }
  };

  const generatePropertySlugs = async () => {
    if (!confirm('Generate SEO slugs for all properties without slugs?')) return;
    setGeneratingSlugs(true);
    try {
      const response = await base44.functions.invoke('generatePropertySlugs', { 
        generateForAll: true 
      });
      toast.success('✅ SEO Slugs Generated', {
        description: `Generated ${response.data.successCount} slugs. All properties now have SEO-friendly URLs.`,
        className: 'bg-gradient-to-r from-[#FFD300] to-[#FFA500] text-black border-0',
        duration: 4000
      });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (error) {
      toast.error('Failed to generate slugs', {
        description: error.message,
        className: 'bg-red-600 text-white border-0'
      });
    } finally {
      setGeneratingSlugs(false);
    }
  };

  const backfillBuildings = async () => {
    if (!confirm('Generate buildings from all properties?\n\nThis will:\n1. Find properties with building names\n2. Create Building entities\n3. Link properties to buildings')) return;
    setGeneratingSlugs(true);
    
    // Show loading toast
    toast.loading('🏗️ Building Intelligence System running...', {
      description: 'Scanning properties, fuzzy matching buildings, enriching with web data...',
      className: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0',
      id: 'building-backfill'
    });

    try {
      const response = await base44.functions.invoke('backfillBuildings', {});
      
      const { results } = response.data;
      
      // Dismiss loading toast
      toast.dismiss('building-backfill');
      
      // Show result toast
      if (results.properties_processed === 0) {
        toast.info('✅ Backfill Complete', {
          description: (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>All properties already linked to buildings!</span>
              </div>
              <div className="text-xs opacity-90 mt-2 space-y-1">
                <div>• Properties with building_name: {results.total_properties}</div>
                <div>• Already linked: All ✅</div>
                <div>• New buildings created: {results.buildings_created}</div>
              </div>
            </div>
          ),
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
          duration: 6000
        });
      } else {
        toast.success('✅ Backfill Complete!', {
          description: (
            <div className="space-y-2">
              <div className="font-semibold">{response.data.message}</div>
              <div className="text-xs opacity-90 space-y-1">
                <div>📊 Stats:</div>
                <div>• Properties processed: {results.properties_processed}</div>
                <div>• Buildings created: {results.buildings_created}</div>
                <div>• Linked to existing: {results.buildings_linked}</div>
              </div>
            </div>
          ),
          className: 'bg-gradient-to-r from-[#FFD300] to-[#FFA500] text-black border-0',
          duration: 6000
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (error) {
      toast.dismiss('building-backfill');
      toast.error('❌ Building Backfill Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setGeneratingSlugs(false);
    }
  };

  const runDataCleanup = async () => {
    if (!confirm('🧹 Run Data Cleanup?\n\nThis will:\n• Fix missing locations (default to Mumbai)\n• Generate missing custom_id & slug\n• Link buildings if building_name exists\n\nRun dry-run first?')) {
      return;
    }

    setGeneratingSlugs(true);

    // Dry run first
    toast.loading('🔍 Analyzing data issues...', {
      description: 'Running dry-run to detect problems',
      className: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0',
      id: 'cleanup-dry-run'
    });

    try {
      const dryRunResponse = await base44.functions.invoke('dataCleanup', { mode: 'dry_run' });
      toast.dismiss('cleanup-dry-run');

      const issues = dryRunResponse.data.issues;
      const totalIssues = Object.values(issues).reduce((sum, count) => sum + count, 0);

      if (totalIssues === 0) {
        toast.success('✅ All data is clean!', {
          description: 'No issues found. All properties have proper IDs and relationships.',
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
          duration: 4000
        });
        setGeneratingSlugs(false);
        return;
      }

      // Show issues and confirm fix
      const shouldFix = confirm(
        `Found ${totalIssues} issues:\n\n` +
        `• Missing location: ${issues.missing_location}\n` +
        `• Missing custom_id: ${issues.missing_custom_id}\n` +
        `• Missing slug: ${issues.missing_slug}\n` +
        `• Missing broker_id: ${issues.missing_broker_id}\n` +
        `• Missing building_id: ${issues.missing_building_id_but_has_name}\n\n` +
        `Fix all issues now?`
      );

      if (!shouldFix) {
        setGeneratingSlugs(false);
        return;
      }

      // Run fix mode
      toast.loading('🔧 Fixing data issues...', {
        description: 'Generating IDs, linking relationships...',
        className: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-0',
        id: 'cleanup-fix'
      });

      const fixResponse = await base44.functions.invoke('dataCleanup', { mode: 'fix' });
      toast.dismiss('cleanup-fix');

      const fixes = fixResponse.data.fixes;

      toast.success('✅ Data Cleanup Complete!', {
        description: (
          <div className="space-y-2">
            <div className="text-xs opacity-90 space-y-1">
              <div>✓ Locations fixed: {fixes.location_fixed}</div>
              <div>✓ IDs generated: {fixes.custom_id_generated}</div>
              <div>✓ Slugs generated: {fixes.slug_generated}</div>
              <div>✓ Buildings linked: {fixes.building_linked}</div>
              {fixes.errors.length > 0 && (
                <div className="text-red-300">⚠ Errors: {fixes.errors.length}</div>
              )}
            </div>
          </div>
        ),
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
        duration: 8000
      });

      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });

    } catch (error) {
      toast.dismiss('cleanup-dry-run');
      toast.dismiss('cleanup-fix');
      toast.error('❌ Data Cleanup Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setGeneratingSlugs(false);
    }
  };

  const detectDuplicates = async () => {
    if (!confirm('🔍 Detect Duplicates?\n\nThis will:\n• Scan all active properties\n• Find exact/similar matches\n• Mark duplicates automatically\n\nRun analysis first?')) {
      return;
    }

    setDetectingDuplicates(true);

    // Dry run first
    toast.loading('🔍 Analyzing properties for duplicates...', {
      description: 'Checking for matching building, BHK, price, floor...',
      className: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-0',
      id: 'dedup-analysis'
    });

    try {
      const dryRunResponse = await base44.functions.invoke('detectDuplicates', { mode: 'dry_run' });
      toast.dismiss('dedup-analysis');

      const summary = dryRunResponse.data.summary;

      if (summary.total_duplicates === 0) {
        toast.success('✅ No Duplicates Found!', {
          description: `Scanned ${summary.total_properties_scanned} properties - all unique`,
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
          duration: 4000
        });
        setDetectingDuplicates(false);
        return;
      }

      // Show results and confirm marking
      const shouldMark = confirm(
        `🎯 Analysis Complete!\n\n` +
        `Found ${summary.duplicate_groups_found} duplicate groups:\n` +
        `• ${summary.total_duplicates} properties are duplicates\n` +
        `• ${summary.total_properties_scanned - summary.total_duplicates} unique properties\n\n` +
        `Mark duplicates now?\n` +
        `(Oldest listing in each group will be kept as original)`
      );

      if (!shouldMark) {
        setDetectingDuplicates(false);
        return;
      }

      // Run live mode
      toast.loading('🔧 Marking duplicates...', {
        description: 'Updating property records...',
        className: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0',
        id: 'dedup-mark'
      });

      const markResponse = await base44.functions.invoke('detectDuplicates', { mode: 'live' });
      toast.dismiss('dedup-mark');

      const results = markResponse.data.summary;

      toast.success('✅ Deduplication Complete!', {
        description: (
          <div className="space-y-2">
            <div className="font-semibold">Properties cleaned up successfully</div>
            <div className="text-xs opacity-90 space-y-1">
              <div>• Scanned: {results.total_properties_scanned} properties</div>
              <div>• Found: {results.duplicate_groups_found} duplicate groups</div>
              <div>• Marked: {results.duplicates_marked} as duplicates</div>
              {results.errors > 0 && (
                <div className="text-red-300">⚠ Errors: {results.errors}</div>
              )}
            </div>
          </div>
        ),
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
        duration: 8000
      });

      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-properties'] });

    } catch (error) {
      toast.dismiss('dedup-analysis');
      toast.dismiss('dedup-mark');
      toast.error('❌ Deduplication Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setDetectingDuplicates(false);
    }
  };

  const generatePropertyDescriptions = async () => {
    if (!confirm('🤖 Generate AI Descriptions?\n\nThis will:\n• Find properties without ai_description\n• Generate compelling 3-4 line descriptions\n• Use property + building context\n\nThis may take a few minutes for many properties. Continue?')) {
      return;
    }

    setGeneratingDescriptions(true);

    toast.loading('🤖 AI Description Generator running...', {
      description: 'Analyzing properties and crafting descriptions...',
      className: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0',
      id: 'desc-gen'
    });

    try {
      const response = await base44.functions.invoke('generatePropertyDescriptions', { 
        regenerateAll: false // Only properties missing descriptions
      });

      toast.dismiss('desc-gen');

      const { results } = response.data;

      if (results.success_count === 0) {
        toast.info('✅ All Descriptions Present', {
          description: 'Every property already has an AI-generated description!',
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
          duration: 4000
        });
      } else {
        toast.success('✅ Descriptions Generated!', {
          description: (
            <div className="space-y-2">
              <div className="font-semibold">AI descriptions added successfully</div>
              <div className="text-xs opacity-90 space-y-1">
                <div>✓ Generated: {results.success_count}</div>
                <div>✓ Total processed: {results.total_processed}</div>
                {results.error_count > 0 && (
                  <div className="text-red-300">⚠ Errors: {results.error_count}</div>
                )}
              </div>
            </div>
          ),
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
          duration: 6000
        });
      }

      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });

    } catch (error) {
      toast.dismiss('desc-gen');
      toast.error('❌ Description Generation Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setGeneratingDescriptions(false);
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

  const handleGenerateBlog = async () => {
    if (!blogPrompt.trim()) {
      toast.error('Please provide a topic/prompt', {
        className: 'bg-red-600 text-white border-0'
      });
      return;
    }

    setGeneratingBlog(true);

    const loadingToast = toast.loading('🤖 AI Blog Generator Running...', {
      description: 'Researching topic, pulling building data, crafting content...',
      className: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0',
    });

    try {
      const tags = blogTags.split(',').map(t => t.trim()).filter(Boolean);
      const relatedLocs = blogRelatedLocations.split(',').map(l => l.trim()).filter(Boolean);

      const response = await base44.agents.invoke('blog_generator', {
        prompt: blogPrompt,
        category: blogCategory,
        tags: tags,
        related_locations: relatedLocs
      });

      toast.dismiss(loadingToast);

      toast.success('✅ Blog Post Generated!', {
        description: `"${response.title}" is ready for review`,
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
        duration: 5000
      });

      // Reset form
      setBlogPrompt("");
      setBlogTags("");
      setBlogRelatedLocations("");
      setBlogGenModalOpen(false);

      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Blog Generation Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0'
      });
    } finally {
      setGeneratingBlog(false);
    }
  };

  const handleDeleteBlog = (blogId) => {
    if (confirm("Delete this blog post?")) {
      deleteBlogMutation.mutate(blogId);
    }
  };

  const handleToggleFeatured = async (blog) => {
    await updateBlogMutation.mutateAsync({
      id: blog.id,
      data: { featured: !blog.featured }
    });
  };

  const handleToggleStatus = async (blog) => {
    const newStatus = blog.status === "Published" ? "Draft" : "Published";
    await updateBlogMutation.mutateAsync({
      id: blog.id,
      data: { status: newStatus }
    });
  };

  const handleBuildingQuery = async () => {
    if (!buildingQuery.trim()) {
      toast.error('Please enter a building query', {
        className: 'bg-red-600 text-white border-0'
      });
      return;
    }

    setQueryingBuilding(true);
    setBuildingQueryResult(null);

    const loadingToast = toast.loading('🧠 Querying Building Intelligence...', {
      description: 'Searching building database and analyzing data...',
      className: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0',
    });

    try {
      // Call the building_assistant agent
      const response = await base44.agents.invoke('building_assistant', {
        query: buildingQuery
      });

      toast.dismiss(loadingToast);

      setBuildingQueryResult(response);

      toast.success('✅ Query Complete!', {
        description: 'Building intelligence retrieved',
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
        duration: 3000
      });

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Query Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setQueryingBuilding(false);
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

  const backfillCustomIds = async () => {
    if (!confirm('🔧 Backfill Custom IDs?\n\nThis will:\n• Generate CHT-{LOC}-XXXX for Properties\n• Generate CHR-BRK-XXXX for Brokers\n• Generate CHR-REQ-XXXX for Requirements\n\nRun dry-run first?')) {
      return;
    }

    setBackfillingIds(true);

    // Dry run first
    toast.loading('🔍 Analyzing missing custom IDs...', {
      description: 'Running dry-run to detect records without custom_id',
      className: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0',
      id: 'customid-dry-run'
    });

    try {
      const dryRunResponse = await base44.functions.invoke('backfillCustomIds', { mode: 'dry_run' });
      toast.dismiss('customid-dry-run');

      const analysis = dryRunResponse.data.analysis;
      const totalMissing = analysis.total_missing;

      if (totalMissing === 0) {
        toast.success('✅ All Custom IDs Present!', {
          description: 'Every record already has a custom_id',
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
          duration: 4000
        });
        setBackfillingIds(false);
        return;
      }

      // Show results and confirm fix
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

      // Run fix mode
      toast.loading('🔧 Generating custom IDs...', {
        description: 'Creating unique IDs for all records...',
        className: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-0',
        id: 'customid-fix'
      });

      const fixResponse = await base44.functions.invoke('backfillCustomIds', { mode: 'fix' });
      toast.dismiss('customid-fix');

      const results = fixResponse.data.results;

      toast.success('✅ Custom IDs Generated!', {
        description: (
          <div className="space-y-2">
            <div className="font-semibold">All records now have custom IDs</div>
            <div className="text-xs opacity-90 space-y-1">
              <div>✓ Properties: {results.properties_fixed} fixed</div>
              <div>✓ Brokers: {results.brokers_fixed} fixed</div>
              <div>✓ Requirements: {results.requirements_fixed} fixed</div>
              {results.errors.length > 0 && (
                <div className="text-red-300">⚠ Errors: {results.errors.length}</div>
              )}
            </div>
          </div>
        ),
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
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
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setBackfillingIds(false);
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

  // Blog Generation Modal
  const BlogGenModal = () => (
    <Dialog open={blogGenModalOpen} onOpenChange={setBlogGenModalOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Generate Blog with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Topic / Prompt</label>
            <Input
              placeholder="e.g., Write a guide about living in Pali Hill for expats"
              value={blogPrompt}
              onChange={(e) => setBlogPrompt(e.target.value)}
              className="mb-2"
            />
            <p className="text-xs text-slate-500">Be specific about what you want the blog to cover</p>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Category</label>
            <Select value={blogCategory} onValueChange={setBlogCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Neighborhood Guide">Neighborhood Guide</SelectItem>
                <SelectItem value="Expat Series">Expat Series</SelectItem>
                <SelectItem value="Market Insights">Market Insights</SelectItem>
                <SelectItem value="Rental & Legal">Rental & Legal</SelectItem>
                <SelectItem value="Real Stories">Real Stories</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Tags (comma-separated)</label>
            <Input
              placeholder="e.g., Bandra, Expat, Luxury, Sea View"
              value={blogTags}
              onChange={(e) => setBlogTags(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Related Locations (comma-separated)</label>
            <Input
              placeholder="e.g., Pali Hill, Bandra West, Juhu"
              value={blogRelatedLocations}
              onChange={(e) => setBlogRelatedLocations(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">Properties from these locations will be suggested at the end</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-700">
            <p className="font-semibold mb-1">🤖 AI will:</p>
            <ul className="space-y-1 text-xs">
              <li>• Research the topic with web search</li>
              <li>• Pull real building data if locations mentioned</li>
              <li>• Generate SEO-optimized title & content</li>
              <li>• Create excerpt and meta description</li>
              <li>• Auto-publish to your blog (status: Published)</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleGenerateBlog}
              disabled={generatingBlog || !blogPrompt.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex-1"
            >
              {generatingBlog ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Blog Post
                </>
              )}
            </Button>
            <Button
              onClick={() => setBlogGenModalOpen(false)}
              variant="outline"
              disabled={generatingBlog}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Building Query Modal
  const BuildingQueryModal = () => (
    <Dialog open={buildingQueryModalOpen} onOpenChange={setBuildingQueryModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Building Intelligence Tool
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Ask About Any Building</label>
            <Input
              placeholder='e.g., "Tell me about Maker Tower" or "Best buildings in Bandra for expats?"'
              value={buildingQuery}
              onChange={(e) => setBuildingQuery(e.target.value)}
              className="mb-2"
              onKeyPress={(e) => e.key === 'Enter' && handleBuildingQuery()}
            />
            <p className="text-xs text-slate-500">Query pricing trends, tenant profiles, amenities, market activity, or compare buildings</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <p className="font-semibold mb-1">💡 Example queries:</p>
            <ul className="space-y-1 text-xs">
              <li>• "What's the average rent for 2 BHK in Oberoi Sky Heights?"</li>
              <li>• "Compare Maker Tower and Rustomjee Paramount"</li>
              <li>• "Which buildings in Juhu are expat-friendly?"</li>
              <li>• "Show me recent activity in Pali Hill buildings"</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleBuildingQuery}
              disabled={queryingBuilding || !buildingQuery.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex-1"
            >
              {queryingBuilding ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Querying...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Query Buildings
                </>
              )}
            </Button>
            <Button
              onClick={() => setBuildingQueryModalOpen(false)}
              variant="outline"
              disabled={queryingBuilding}
            >
              Close
            </Button>
          </div>

          {/* Query Result */}
          {buildingQueryResult && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Intelligence Result:
              </h4>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-white p-4 rounded-lg border">
                  {typeof buildingQueryResult === 'string' 
                    ? buildingQueryResult 
                    : JSON.stringify(buildingQueryResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

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

            {/* Quick Actions */}
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
                onClick={() => setBuildingQueryModalOpen(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Building Intel
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
                onClick={detectDuplicates}
                disabled={detectingDuplicates}
                size="sm"
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
              >
                <Copy className={`w-4 h-4 mr-2 ${detectingDuplicates ? 'animate-spin' : ''}`} />
                {detectingDuplicates ? 'Scanning...' : 'Dedup'}
              </Button>
              <Button
                onClick={generatePropertyDescriptions}
                disabled={generatingDescriptions}
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Sparkles className={`w-4 h-4 mr-2 ${generatingDescriptions ? 'animate-spin' : ''}`} />
                {generatingDescriptions ? 'Writing...' : 'Descriptions'}
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
                onClick={runDataCleanup}
                disabled={generatingSlugs}
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generatingSlugs ? 'animate-spin' : ''}`} />
                {generatingSlugs ? 'Processing...' : 'Fix Data'}
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

          {/* Dropdown Tab Selector */}
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
                <SelectItem value="blogs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Blogs ({stats.blogs.published})</span>
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
                    <p className="text-sm text-slate-600 mb-4">{stats.properties.needsPhotos} potential duplicates found</p>
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
                                {property.images && property.images[0] ? (
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
                                toast.success('Property restored!', {
                                  description: `Property ${property.custom_id || property.id} is no longer marked as duplicate.`,
                                  className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0',
                                  duration: 2000
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
                    })}
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
                        <div className="grid grid-cols-2 md::grid-cols-4 gap-3 mb-4">
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

          {/* Blogs Tab */}
          {activeTab === "blogs" && (
            <motion.div
              key="blogs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="space-y-4">
                {/* Header with Generate Button */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">Blog Posts</h3>
                    <p className="text-sm text-slate-500">{blogs.length} total • {stats.blogs.published} published • {stats.blogs.aiGenerated} AI-generated</p>
                  </div>
                  <Button
                    onClick={() => setBlogGenModalOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>

                {/* Blog List */}
                {blogs.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No blog posts yet</h3>
                    <p className="text-slate-500 mb-4">Create your first AI-generated blog post</p>
                    <Button
                      onClick={() => setBlogGenModalOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Blog Post
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blogs.map((blog) => (
                      <div
                        key={blog.id}
                        className={`bg-white rounded-2xl p-5 border-2 transition-all ${
                          blog.status === "Published" 
                            ? "border-green-200 hover:border-green-300" 
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Featured Image or Placeholder */}
                          <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100">
                            {blog.featured_image ? (
                              <img src={blog.featured_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-10 h-10 text-purple-400" />
                              </div>
                            )}
                          </div>

                          {/* Blog Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{blog.title}</h3>
                                  {blog.featured && (
                                    <Badge className="bg-[#FFD300] text-black border-0">
                                      ⭐ Featured
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                                  <Badge className={`${
                                    blog.status === "Published" ? "bg-green-500/20 text-green-700 border-green-500" :
                                    "bg-slate-500/20 text-slate-700 border-slate-500"
                                  }`}>
                                    {blog.status}
                                  </Badge>
                                  <Badge variant="outline">{blog.category}</Badge>
                                  {blog.ai_generated && (
                                    <Badge variant="outline" className="border-purple-300 text-purple-700">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      AI
                                    </Badge>
                                  )}
                                  <span>{format(new Date(blog.created_date), "MMM dd, yyyy")}</span>
                                  <span>• {blog.views_count || 0} views</span>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2">{blog.excerpt}</p>
                              </div>
                            </div>

                            {/* Tags */}
                            {blog.tags && blog.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {blog.tags.slice(0, 5).map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => navigate(createPageUrl("BlogPost") + `?slug=${blog.slug}`)}
                                size="sm"
                                variant="outline"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                onClick={() => handleToggleStatus(blog)}
                                size="sm"
                                variant="outline"
                                className={blog.status === "Published" ? "text-orange-600" : "text-green-600"}
                              >
                                {blog.status === "Published" ? "Unpublish" : "Publish"}
                              </Button>
                              <Button
                                onClick={() => handleToggleFeatured(blog)}
                                size="sm"
                                variant="outline"
                                className="text-[#FFD300]"
                              >
                                <Star className={`w-4 h-4 ${blog.featured ? 'fill-current' : ''}`} />
                              </Button>
                              <Button
                                onClick={() => handleDeleteBlog(blog.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ImageUploadModal />
      <BlogGenModal />
      <BuildingQueryModal />
    </div>
  );
}
