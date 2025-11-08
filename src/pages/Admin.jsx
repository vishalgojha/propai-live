
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, BarChart3, BookOpen, Building2, Car, CheckCircle2, ChevronDown, Clock, Copy, Eye, FileText, Home,
  Image as ImageIcon, Mail, MapPin, MessageCircle, Package, Phone, RefreshCw, Search, Shield,
  Sparkles, Star, Trash2, TrendingUp, Upload, Users, X, Zap, AlertCircleIcon
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

  // AI Parser states
  const [aiParserModalOpen, setAiParserModalOpen] = useState(false);
  const [parserInput, setParserInput] = useState("");
  const [parsingInProgress, setParsingInProgress] = useState(false);
  const [parserResult, setParserResult] = useState(null);

  // Processing states
  const [dealsLoading, setDealsLoading] = useState(false);
  const [generatingSlugs, setGeneratingSlugs] = useState(false); // Used for multiple background tasks
  const [detectingDuplicates, setDetectingDuplicates] = useState(false);
  const [generatingDescriptions, setGeneratingDescriptions] = useState(false);
  const [testingPropAI, setTestingPropAI] = useState(false);
  const [backfillingIds, setBackfillingIds] = useState(false);
  const [detectingBuildingDuplicates, setDetectingBuildingDuplicates] = useState(false);
  const [normalizingLocations, setNormalizingLocations] = useState(false);
  const [normalizingBhk, setNormalizingBhk] = useState(false);
  const [cleaningBuildings, setCleaningBuildings] = useState(false);

  // Building query modal states
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

  const { data: duplicates = [], isLoading: duplicatesLoading } = useQuery({
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

  const loadDealsRadar = async () => {
    setDealsLoading(true);
    try {
      const response = await base44.functions.invoke('getDealsRadar', {});
      toast.success('Deals Radar Loaded', {
        description: `💎 ${response.data.summary.underpricedDeals} Underpriced | 📉 ${response.data.summary.priceDrops} Price Drops`,
        duration: 5000,
        className: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0'
      });
    } catch (error) {
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
      const response = await base44.functions.invoke('generatePropertySlugs', { generateForAll: true });
      toast.success('✅ SEO Slugs Generated', {
        description: `Generated ${response.data.successCount} slugs`,
        className: 'bg-gradient-to-r from-[#FFD300] to-[#FFA500] text-black border-0',
        duration: 4000
      });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (error) {
      toast.error('Failed to generate slugs', {
        description: error.message
      });
    } finally {
      setGeneratingSlugs(false);
    }
  };

  const backfillBuildings = async () => {
    if (!confirm('Generate buildings from all properties?')) return;
    setGeneratingSlugs(true);
    toast.loading('🏗️ Building Intelligence System running...', { id: 'building-backfill' });

    try {
      const response = await base44.functions.invoke('backfillBuildings', {});
      toast.dismiss('building-backfill');
      toast.success('✅ Backfill Complete!', {
        description: `Created ${response.data.results.buildings_created} buildings`,
        duration: 6000
      });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (error) {
      toast.dismiss('building-backfill');
      toast.error('❌ Building Backfill Failed', {
        description: error.message
      });
    } finally {
      setGeneratingSlugs(false);
    }
  };

  const recalculateBuildingStats = async () => {
    if (!confirm('🔢 Recalculate Building Stats?\n\nThis will fix all building listing counts.')) return;
    setGeneratingSlugs(true);
    toast.loading('🔢 Recalculating building stats...', { id: 'building-stats' });

    try {
      const response = await base44.functions.invoke('recalculateBuildingStats', {});
      toast.dismiss('building-stats');
      
      const summary = response.data.summary;
      toast.success('✅ Building Stats Updated!', {
        description: `Updated ${summary.buildings_updated} buildings (${summary.buildings_unchanged} unchanged)`,
        duration: 6000
      });
      
      // Refresh property data as building stats might affect how properties are displayed or linked
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (error) {
      toast.dismiss('building-stats');
      toast.error('❌ Stats Recalculation Failed', {
        description: error.message
      });
    } finally {
      setGeneratingSlugs(false);
    }
  };

  const runDataCleanup = async () => {
    if (!confirm('🧹 Run Data Cleanup?\n\nRun dry-run first?')) return;
    setGeneratingSlugs(true);
    toast.loading('🔍 Analyzing data issues...', { id: 'cleanup-dry-run' });

    try {
      const dryRunResponse = await base44.functions.invoke('dataCleanup', { mode: 'dry_run' });
      toast.dismiss('cleanup-dry-run');

      const issues = dryRunResponse.data.issues;
      const totalIssues = Object.values(issues).reduce((sum, count) => sum + count, 0);

      if (totalIssues === 0) {
        toast.success('✅ All data is clean!');
        setGeneratingSlugs(false);
        return;
      }

      const shouldFix = confirm(`Found ${totalIssues} issues. Fix now?`);
      if (!shouldFix) {
        setGeneratingSlugs(false);
        return;
      }

      toast.loading('🔧 Fixing data issues...', { id: 'cleanup-fix' });
      const fixResponse = await base44.functions.invoke('dataCleanup', { mode: 'fix' });
      toast.dismiss('cleanup-fix');

      toast.success('✅ Data Cleanup Complete!', {
        duration: 8000
      });

      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (error) {
      toast.dismiss('cleanup-dry-run');
      toast.dismiss('cleanup-fix');
      toast.error('❌ Data Cleanup Failed', {
        description: error.message
      });
    } finally {
      setGeneratingSlugs(false);
    }
  };

  const detectDuplicates = async () => {
    if (!confirm('🔍 Detect Duplicates?')) return;
    setDetectingDuplicates(true);
    toast.loading('🔍 Analyzing properties for duplicates...', { id: 'dedup-analysis' });

    try {
      const dryRunResponse = await base44.functions.invoke('detectDuplicates', { mode: 'dry_run' });
      toast.dismiss('dedup-analysis');

      const summary = dryRunResponse.data.summary;
      if (summary.total_duplicates === 0) {
        toast.success('✅ No Duplicates Found!');
        setDetectingDuplicates(false);
        return;
      }

      const shouldMark = confirm(`Found ${summary.total_duplicates} issues. Mark them now?`);
      if (!shouldMark) {
        setDetectingDuplicates(false);
        return;
      }

      toast.loading('🔧 Marking duplicates...', { id: 'dedup-mark' });
      const markResponse = await base44.functions.invoke('detectDuplicates', { mode: 'live' });
      toast.dismiss('dedup-mark');

      toast.success('✅ Deduplication Complete!', {
        duration: 8000
      });

      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-properties'] });
    } catch (error) {
      toast.dismiss('dedup-analysis');
      toast.dismiss('dedup-mark');
      toast.error('❌ Deduplication Failed', {
        description: error.message
      });
    } finally {
      setDetectingDuplicates(false);
    }
  };

  const detectBrokerDuplicates = async () => {
    if (!confirm('🔍 Detect Broker Duplicates?\n\nThis will:\n• Scan all brokers for duplicates\n• Match by phone numbers and similar names\n• Merge duplicates (oldest kept as original)\n• Reassign all properties to original broker\n\nRun analysis first?')) {
      return;
    }

    setDetectingDuplicates(true);
    toast.loading('🔍 Analyzing brokers for duplicates...', { id: 'broker-dedup-analysis' });

    try {
      const dryRunResponse = await base44.functions.invoke('detectBrokerDuplicates', { mode: 'dry_run' });
      toast.dismiss('broker-dedup-analysis');

      const summary = dryRunResponse.data.summary;
      if (summary.total_duplicates === 0) {
        toast.success('✅ No Broker Duplicates Found!', {
          description: `Scanned ${summary.total_brokers_scanned} brokers - all unique`,
          duration: 4000
        });
        setDetectingDuplicates(false);
        return;
      }

      const shouldMerge = confirm(
        `🎯 Analysis Complete!\n\n` +
        `Found ${summary.duplicate_groups_found} duplicate groups:\n` +
        `• ${summary.total_duplicates} duplicate brokers\n` +
        `• ${summary.total_brokers_scanned - summary.total_duplicates} unique brokers\n\n` +
        `Merge duplicates now?\n` +
        `(Oldest broker in each group will be kept as original, all properties will be reassigned)`
      );

      if (!shouldMerge) {
        setDetectingDuplicates(false);
        return;
      }

      toast.loading('🔧 Merging duplicate brokers...', { id: 'broker-dedup-merge' });
      const mergeResponse = await base44.functions.invoke('detectBrokerDuplicates', { mode: 'live' });
      toast.dismiss('broker-dedup-merge');

      const results = mergeResponse.data.summary;

      toast.success('✅ Broker Deduplication Complete!', {
        description: (
          <div className="space-y-2">
            <div className="font-semibold">Brokers cleaned up successfully</div>
            <div className="text-xs opacity-90 space-y-1">
              <div>• Scanned: {results.total_brokers_scanned} brokers</div>
              <div>• Found: {results.duplicate_groups_found} duplicate groups</div>
              <div>• Merged: {results.duplicates_merged} duplicates</div>
              {results.errors > 0 && (
                <div className="text-red-300">⚠ Errors: {results.errors}</div>
              )}
            </div>
          </div>
        ),
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
        duration: 8000
      });

      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });

    } catch (error) {
      toast.dismiss('broker-dedup-analysis');
      toast.dismiss('broker-dedup-merge');
      toast.error('❌ Broker Deduplication Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setDetectingDuplicates(false);
    }
  };

  const detectBuildingDuplicates = async () => {
    if (!confirm('🔍 Detect Building Duplicates?\n\nThis will:\n• Scan all buildings for duplicates\n• Match by name similarity + location\n• Merge duplicates (oldest kept as original)\n• Reassign all properties to original building\n\nRun analysis first?')) {
      return;
    }

    setDetectingBuildingDuplicates(true);
    toast.loading('🔍 Analyzing buildings for duplicates...', { id: 'building-dedup-analysis' });

    try {
      const dryRunResponse = await base44.functions.invoke('detectBuildingDuplicates', { mode: 'dry_run' });
      toast.dismiss('building-dedup-analysis');

      const summary = dryRunResponse.data.summary;
      if (summary.total_duplicates === 0) {
        toast.success('✅ No Building Duplicates Found!', {
          description: `Scanned ${summary.total_buildings_scanned} buildings - all unique`,
          duration: 4000
        });
        setDetectingBuildingDuplicates(false);
        return;
      }

      const shouldMerge = confirm(
        `🎯 Analysis Complete!\n\n` +
        `Found ${summary.duplicate_groups_found} duplicate groups:\n` +
        `• ${summary.total_duplicates} duplicate buildings\n` +
        `• ${summary.total_buildings_scanned - summary.total_duplicates} unique buildings\n\n` +
        `Merge duplicates now?\n` +
        `(Oldest building in each group will be kept as original, all properties will be reassigned)`
      );

      if (!shouldMerge) {
        setDetectingBuildingDuplicates(false);
        return;
      }

      toast.loading('🔧 Merging duplicate buildings...', { id: 'building-dedup-merge' });
      const mergeResponse = await base44.functions.invoke('detectBuildingDuplicates', { mode: 'live' });
      toast.dismiss('building-dedup-merge');

      const results = mergeResponse.data.summary;

      toast.success('✅ Building Deduplication Complete!', {
        description: (
          <div className="space-y-2">
            <div className="font-semibold">Buildings cleaned up successfully</div>
            <div className="text-xs opacity-90 space-y-1">
              <div>• Scanned: {results.total_buildings_scanned} buildings</div>
              <div>• Found: {results.duplicate_groups_found} duplicate groups</div>
              <div>• Merged: {results.duplicates_merged} duplicates</div>
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

    } catch (error) {
      toast.dismiss('building-dedup-analysis');
      toast.dismiss('building-dedup-merge');
      toast.error('❌ Building Deduplication Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setDetectingBuildingDuplicates(false);
    }
  };

  const generatePropertyDescriptions = async () => {
    if (!confirm('🤖 Generate AI Descriptions?')) return;
    setGeneratingDescriptions(true);
    toast.loading('🤖 AI Description Generator running...', { id: 'desc-gen' });

    try {
      const response = await base44.functions.invoke('generatePropertyDescriptions', { regenerateAll: false });
      toast.dismiss('desc-gen');

      toast.success('✅ Descriptions Generated!', {
        duration: 6000
      });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (error) {
      toast.dismiss('desc-gen');
      toast.error('❌ Description Generation Failed', {
        description: error.message
      });
    } finally {
      setGeneratingDescriptions(false);
    }
  };

  const handleBuildingQuery = async () => {
    if (!buildingQuery.trim()) {
      toast.error('Please enter a building query');
      return;
    }

    setQueryingBuilding(true);
    setBuildingQueryResult(null);

    try {
      const response = await base44.agents.invoke('building_assistant', {
        query: buildingQuery
      });

      setBuildingQueryResult(response);
      toast.success('✅ Query Complete!');
    } catch (error) {
      toast.error('❌ Query Failed', {
        description: error.message
      });
    } finally {
      setQueryingBuilding(false);
    }
  };

  const testPropAIConnection = async () => {
    setTestingPropAI(true);
    toast.loading('🔌 Testing PropAI Live connection...', { id: 'propai-test' });

    try {
      const response = await base44.functions.invoke('testPropAIConnection', {});
      toast.dismiss('propai-test');

      console.log('PropAI Test Response:', response.data);

      if (response.data.success) {
        toast.success('✅ PropAI Live Connected!', {
          description: 'Connection working perfectly',
          duration: 6000,
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0'
        });
      } else {
        // Show detailed error with help text
        const errorMessage = response.data.error || 'Unknown error';
        
        toast.error('❌ PropAI Connection Failed', {
          description: (
            <div className="space-y-2">
              <div className="font-semibold">{errorMessage}</div>
              {response.data.help && (
                <div className="text-xs opacity-90 whitespace-pre-line">
                  {response.data.help}
                </div>
              )}
            </div>
          ),
          duration: 10000,
          className: 'bg-red-600 text-white border-0'
        });
      }
    } catch (error) {
      toast.dismiss('propai-test');
      console.error('PropAI Test Error:', error);
      toast.error('❌ Test Failed', {
        description: error.response?.data?.error || error.message || 'Unknown error occurred',
        duration: 8000,
        className: 'bg-red-600 text-white border-0'
      });
    } finally {
      setTestingPropAI(false);
    }
  };

  const backfillCustomIds = async () => {
    if (!confirm('🔧 Backfill Custom IDs?\n\nRun dry-run first?')) return;
    setBackfillingIds(true);
    toast.loading('🔍 Analyzing missing custom IDs...', { id: 'customid-dry-run' });

    try {
      const dryRunResponse = await base44.functions.invoke('backfillCustomIds', { mode: 'dry_run' });
      toast.dismiss('customid-dry-run');

      const analysis = dryRunResponse.data.analysis;
      const totalMissing = analysis.total_missing;

      if (totalMissing === 0) {
        toast.success('✅ All Custom IDs Present!');
        setBackfillingIds(false);
        return;
      }

      const shouldFix = confirm(`Found ${totalMissing} records missing custom_id. Generate now?`);
      if (!shouldFix) {
        setBackfillingIds(false);
        return;
      }

      toast.loading('🔧 Generating custom IDs...', { id: 'customid-fix' });
      const fixResponse = await base44.functions.invoke('backfillCustomIds', { mode: 'fix' });
      toast.dismiss('customid-fix');

      toast.success('✅ Custom IDs Generated!', {
        duration: 8000
      });

      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
    } catch (error) {
      toast.dismiss('customid-dry-run');
      toast.dismiss('customid-fix');
      toast.error('❌ Custom ID Backfill Failed', {
        description: error.message
      });
    } finally {
      setBackfillingIds(false);
    }
  };

  const normalizeLocations = async () => {
    if (!confirm('🗺️ Normalize All Locations?\n\nThis will:\n• Fix "Bandra" → "Bandra West"\n• Fix "Khar" → "Khar West"\n• Standardize all location names\n• Update properties, buildings, requirements\n\nRun analysis first?')) {
      return;
    }

    setNormalizingLocations(true);
    toast.loading('🔍 Analyzing location inconsistencies...', { id: 'location-analysis' });

    try {
      const dryRunResponse = await base44.functions.invoke('normalizeLocations', { mode: 'dry_run' });
      toast.dismiss('location-analysis');

      const summary = dryRunResponse.data.summary;
      const totalChanges = summary.properties_to_update + summary.buildings_to_update + summary.requirements_to_update;

      if (totalChanges === 0) {
        toast.success('✅ All Locations Already Normalized!', {
          description: `${summary.unique_locations_after} unique locations`,
          duration: 4000
        });
        setNormalizingLocations(false);
        return;
      }

      const shouldFix = confirm(
        `🎯 Analysis Complete!\n\n` +
        `Found location inconsistencies:\n` +
        `• ${summary.properties_to_update} properties to update\n` +
        `• ${summary.buildings_to_update} buildings to update\n` +
        `• ${summary.requirements_to_update} requirements to update\n\n` +
        `Will reduce ${summary.unique_locations_before} locations to ${summary.unique_locations_after} (${summary.reduction} duplicates removed)\n\n` +
        `Fix now?`
      );

      if (!shouldFix) {
        setNormalizingLocations(false);
        return;
      }

      toast.loading('🔧 Normalizing all locations...', { id: 'location-fix' });
      const fixResponse = await base44.functions.invoke('normalizeLocations', { mode: 'live' });
      toast.dismiss('location-fix');

      const results = fixResponse.data.summary;

      toast.success('✅ Location Normalization Complete!', {
        description: (
          <div className="space-y-2">
            <div className="font-semibold">Locations standardized successfully</div>
            <div className="text-xs opacity-90 space-y-1">
              <div>• Properties: {results.properties_updated} updated</div>
              <div>• Buildings: {results.buildings_updated} updated</div>
              <div>• Requirements: {results.requirements_updated} updated</div>
              <div>• Locations reduced: {results.unique_locations_before} → {results.unique_locations_after}</div>
              {results.errors > 0 && (
                <div className="text-red-300">⚠ Errors: {results.errors}</div>
              )}
            </div>
          </div>
        ),
        className: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0',
        duration: 8000
      });

      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['brokers'] }); // Brokers might have locations in their listings
      queryClient.invalidateQueries({ queryKey: ['requirements'] }); // Requirements have preferred_locations

    } catch (error) {
      toast.dismiss('location-analysis');
      toast.dismiss('location-fix');
      toast.error('❌ Location Normalization Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setNormalizingLocations(false);
    }
  };

  // NEW: AI Parser handler
  const handleAIParse = async () => {
    if (!parserInput.trim()) {
      toast.error('Please enter a broker message to parse');
      return;
    }

    setParsingInProgress(true);
    setParserResult(null);

    try {
      toast.loading('🤖 AI Master parsing message...', { id: 'ai-parse' });

      const response = await base44.agents.invoke('chariot_master', {
        message: parserInput
      });

      toast.dismiss('ai-parse');

      // Check if it was a duplicate
      if (response.includes('duplicate') || response.includes('Already have this')) {
        toast.warning('⚠️ Duplicate Detected', {
          description: 'This property already exists in the system',
          duration: 5000,
          className: 'bg-orange-600 text-white border-0'
        });
      } else if (response.includes('✅') || response.includes('Listed')) {
        toast.success('✅ Property Parsed & Listed!', {
          description: 'Property is now live on SmartFeed',
          duration: 5000,
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0'
        });
      } else if (response.includes('Missing') || response.includes('Can\'t')) {
        toast.error('❌ Parse Failed', {
          description: response,
          duration: 6000,
          className: 'bg-red-600 text-white border-0'
        });
      }

      setParserResult(response);
      
      // Refresh properties list
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['brokers'] });

    } catch (error) {
      toast.dismiss('ai-parse');
      toast.error('❌ AI Parse Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
      setParserResult(`Error: ${error.message}`);
    } finally {
      setParsingInProgress(false);
    }
  };

  // NEW: Normalize BHK Values handler
  const normalizeBhkValues = async () => {
    if (!confirm('🔧 Normalize BHK Values?\n\nThis will:\n• Fix "1bhk" → "1 BHK"\n• Fix "2BHK" → "2 BHK"\n• Fix "3.5bhk" → "3.5 BHK"\n• Standardize all BHK formats\n\nRun analysis first?')) {
      return;
    }

    setNormalizingBhk(true);
    toast.loading('🔍 Analyzing BHK inconsistencies...', { id: 'bhk-analysis' });

    try {
      const dryRunResponse = await base44.functions.invoke('normalizeBhkValues', { dryRun: true });
      toast.dismiss('bhk-analysis');

      const stats = dryRunResponse.data.stats;

      if (stats.normalized === 0) {
        toast.success('✅ All BHK Values Already Normalized!', {
          description: `${stats.total} properties scanned - all consistent`,
          duration: 4000
        });
        setNormalizingBhk(false);
        return;
      }

      const shouldFix = confirm(
        `🎯 Analysis Complete!\n\n` +
        `Found BHK inconsistencies:\n` +
        `• ${stats.normalized} properties need normalization\n` +
        `• ${stats.unchanged} already correct\n\n` +
        `Fix now?`
      );

      if (!shouldFix) {
        setNormalizingBhk(false);
        return;
      }

      toast.loading('🔧 Normalizing all BHK values...', { id: 'bhk-fix' });
      const fixResponse = await base44.functions.invoke('normalizeBhkValues', { dryRun: false });
      toast.dismiss('bhk-fix');

      const results = fixResponse.data.stats;

      toast.success('✅ BHK Normalization Complete!', {
        description: (
          <div className="space-y-2">
            <div className="font-semibold">BHK values standardized successfully</div>
            <div className="text-xs opacity-90 space-y-1">
              <div>• Normalized: {results.normalized} properties</div>
              <div>• Unchanged: {results.unchanged} properties</div>
              {results.errors > 0 && (
                <div className="text-red-300">⚠ Errors: {results.errors}</div>
              )}
            </div>
          </div>
        ),
        className: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0',
        duration: 8000
      });

      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });

    } catch (error) {
      toast.dismiss('bhk-analysis');
      toast.dismiss('bhk-fix');
      toast.error('❌ BHK Normalization Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setNormalizingBhk(false);
    }
  };

  const normalizeParkingValues = async () => {
    if (!confirm('🚗 Normalize Parking Values?\n\nThis will:\n• Fix "1CP" → "1 Covered"\n• Fix "2 cp" → "2 Covered"\n• Fix "1OP" → "1 Open"\n• Fix "No parking" → "No Parking"\n• Standardize all parking formats\n\nRun analysis first?')) {
      return;
    }

    setNormalizingBhk(true); // Using same loading state as BHK normalization
    toast.loading('🔍 Analyzing parking inconsistencies...', { id: 'parking-analysis' });

    try {
      const dryRunResponse = await base44.functions.invoke('normalizeParkingValues', { dryRun: true });
      toast.dismiss('parking-analysis');

      const stats = dryRunResponse.data.stats;

      if (stats.normalized === 0) {
        toast.success('✅ All Parking Values Already Normalized!', {
          description: `${stats.total} properties scanned - all consistent`,
          duration: 4000
        });
        setNormalizingBhk(false);
        return;
      }

      // Show examples
      let exampleText = '';
      if (stats.examples && stats.examples.length > 0) {
        exampleText = '\n\nExamples:\n' + stats.examples.map(ex => 
          `• "${ex.original}" → "${ex.normalized}"`
        ).join('\n');
      }

      const shouldFix = confirm(
        `🎯 Analysis Complete!\n\n` +
        `Found parking inconsistencies:\n` +
        `• ${stats.normalized} properties need normalization\n` +
        `• ${stats.unchanged} already correct\n` +
        exampleText +
        `\n\nFix now?`
      );

      if (!shouldFix) {
        setNormalizingBhk(false);
        return;
      }

      toast.loading('🔧 Normalizing all parking values...', { id: 'parking-fix' });
      const fixResponse = await base44.functions.invoke('normalizeParkingValues', { dryRun: false });
      toast.dismiss('parking-fix');

      const results = fixResponse.data.stats;

      toast.success('✅ Parking Normalization Complete!', {
        description: (
          <div className="space-y-2">
            <div className="font-semibold">Parking values standardized successfully</div>
            <div className="text-xs opacity-90 space-y-1">
              <div>• Normalized: {results.normalized} properties</div>
              <div>• Unchanged: {results.unchanged} properties</div>
              {results.errors > 0 && (
                <div className="text-red-300">⚠ Errors: {results.errors}</div>
              )}
            </div>
          </div>
        ),
        className: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0',
        duration: 8000
      });

      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });

    } catch (error) {
      toast.dismiss('parking-analysis');
      toast.dismiss('parking-fix');
      toast.error('❌ Parking Normalization Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setNormalizingBhk(false);
    }
  };

  const cleanBuildingData = async () => {
    if (!confirm('🧹 Clean Building Data?\n\nThis will:\n• Remove all MagicBricks references\n• Fix incorrect listing counts\n• Identify missing summaries\n\nRun analysis first?')) {
      return;
    }

    setCleaningBuildings(true);
    toast.loading('🔍 Analyzing building data...', { id: 'building-cleanup-analysis' });

    try {
      const dryRunResponse = await base44.functions.invoke('cleanBuildingData', { mode: 'dry_run' });
      toast.dismiss('building-cleanup-analysis');

      const summary = dryRunResponse.data.summary;
      const totalIssues = summary.magicbricks_references + summary.incorrect_counts + summary.missing_summaries;

      if (totalIssues === 0) {
        toast.success('✅ All Building Data is Clean!', {
          description: `${summary.total_buildings} buildings scanned - no issues found`,
          duration: 4000
        });
        setCleaningBuildings(false);
        return;
      }

      const shouldFix = confirm(
        `🎯 Analysis Complete!\n\n` +
        `Found building data issues:\n` +
        `• ${summary.magicbricks_references} buildings with MagicBricks references\n` +
        `• ${summary.incorrect_counts} buildings with wrong listing counts\n` +
        `• ${summary.missing_summaries} buildings missing summaries\n\n` +
        `Clean now?`
      );

      if (!shouldFix) {
        setCleaningBuildings(false);
        return;
      }

      toast.loading('🧹 Cleaning building data...', { id: 'building-cleanup-fix' });
      const fixResponse = await base44.functions.invoke('cleanBuildingData', { mode: 'live' });
      toast.dismiss('building-cleanup-fix');

      const results = fixResponse.data.summary;

      toast.success('✅ Building Data Cleaned!', {
        description: (
          <div className="space-y-2">
            <div className="font-semibold">Buildings cleaned successfully</div>
            <div className="text-xs opacity-90 space-y-1">
              <div>• MagicBricks removed: {results.magicbricks_cleaned} buildings</div>
              <div>• Listing counts fixed: {results.counts_fixed} buildings</div>
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

    } catch (error) {
      toast.dismiss('building-cleanup-analysis');
      toast.dismiss('building-cleanup-fix');
      toast.error('❌ Building Cleanup Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setCleaningBuildings(false);
    }
  };


  // Broker handlers
  const handleWhatsApp = (broker) => {
    const activeListings = broker.active_listings_count || 0;
    let message = `Hi ${broker.name}, this is PropAI.\n\n`;
    
    if (activeListings > 0) {
      message += `Regarding your ${activeListings} active listing${activeListings > 1 ? 's' : ''} on PropAI SmartFeed.\n\n`;
      message += `We're seeing good traction on your properties. Let's discuss any updates or new listings.\n\n`;
    } else {
      message += `Hope you're doing well!\n\nWe'd love to feature your properties on PropAI SmartFeed. Mumbai's smartest property platform.\n\n`;
      message += `Send us listings anytime - we'll handle the rest.\n\n`;
    }
    
    message += `Team PropAI\n📱 www.propai.live`;
    
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
                      className="w-full h-24 object-cover rounded-xl"
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
          <Input
            placeholder='e.g., "Tell me about Maker Tower"'
            value={buildingQuery}
            onChange={(e) => setBuildingQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleBuildingQuery()}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleBuildingQuery}
              disabled={queryingBuilding || !buildingQuery.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-1"
            >
              {queryingBuilding ? 'Querying...' : 'Query Buildings'}
            </Button>
            <Button onClick={() => setBuildingQueryModalOpen(false)} variant="outline">
              Close
            </Button>
          </div>
          {buildingQueryResult && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">
                {typeof buildingQueryResult === 'string' ? buildingQueryResult : JSON.stringify(buildingQueryResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // NEW: AI Parser Modal
  const AIParserModal = () => (
    <Dialog open={aiParserModalOpen} onOpenChange={setAiParserModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Master - Quick Parse
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              Paste Broker Message:
            </label>
            <textarea
              value={parserInput}
              onChange={(e) => setParserInput(e.target.value)}
              placeholder="Example: 2 BHK Bandra West, 2.5L rent, fully furnished, 2 parking, Ramesh 9820056789"
              className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
              disabled={parsingInProgress}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAIParse}
              disabled={parsingInProgress || !parserInput.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex-1"
            >
              {parsingInProgress ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Parse with AI Master
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setAiParserModalOpen(false);
                setParserInput('');
                setParserResult(null);
              }}
              variant="outline"
            >
              Close
            </Button>
          </div>

          {/* Sample Messages */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-600 mb-2">Quick Examples (click to use):</p>
            <div className="space-y-1">
              <button
                onClick={() => setParserInput('2 BHK Bandra West, ₹2.5L rent, fully furnished, 2 parking, Ramesh 9820056789')}
                className="text-xs text-left text-slate-600 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded w-full transition-colors"
              >
                • 2 BHK Bandra West, ₹2.5L rent, fully furnished, 2 parking, Ramesh 9820056789
              </button>
              <button
                onClick={() => setParserInput('3 BHK Oberoi Sky Heights Khar West, 4.5Cr sale, 1800 sqft, Priya 9820012345')}
                className="text-xs text-left text-slate-600 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded w-full transition-colors"
              >
                • 3 BHK Oberoi Sky Heights Khar West, 4.5Cr sale, 1800 sqft, Priya 9820012345
              </button>
              <button
                onClick={() => setParserInput('Office space BKC 5000sqft lease 8L/month bare shell Amit Properties 9820098200')}
                className="text-xs text-left text-slate-600 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded w-full transition-colors"
              >
                • Office space BKC 5000sqft lease 8L/month bare shell Amit Properties 9820098200
              </button>
            </div>
          </div>

          {/* Result */}
          {parserResult && (
            <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-xs text-slate-400">AI Master Response:</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(parserResult);
                    toast.success('Response copied!');
                  }}
                  className="h-6 text-slate-400 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                {parserResult}
              </pre>
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

            {/* Organized Quick Actions with Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* AI Master Parser Button */}
              <Button
                onClick={() => setAiParserModalOpen(true)}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Parser
              </Button>

              {/* Critical: Fix Custom IDs */}
              <Button
                onClick={backfillCustomIds}
                disabled={backfillingIds}
                size="sm"
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold"
              >
                <AlertTriangle className={`w-4 h-4 mr-2 ${backfillingIds ? 'animate-spin' : ''}`} />
                {backfillingIds ? 'Fixing...' : 'Fix IDs'}
              </Button>

              {/* Data Quality Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="border-sky-300 text-sky-700 hover:bg-sky-50">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Data Quality
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={runDataCleanup}
                    disabled={generatingSlugs}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generatingSlugs ? 'animate-spin' : ''}`} />
                    Fix Data Issues
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={normalizeLocations}
                    disabled={normalizingLocations}
                  >
                    <MapPin className={`w-4 h-4 mr-2 ${normalizingLocations ? 'animate-spin' : ''}`} />
                    Normalize Locations
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={normalizeBhkValues}
                    disabled={normalizingBhk}
                  >
                    <Home className={`w-4 h-4 mr-2 ${normalizingBhk ? 'animate-spin' : ''}`} />
                    Normalize BHK Values
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={normalizeParkingValues}
                    disabled={normalizingBhk}
                  >
                    <Car className={`w-4 h-4 mr-2 ${normalizingBhk ? 'animate-spin' : ''}`} />
                    Normalize Parking
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={generatePropertySlugs}
                    disabled={generatingSlugs}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generatingSlugs ? 'animate-spin' : ''}`} />
                    Generate SEO Slugs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Deduplication Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                    <Copy className="w-4 h-4 mr-2" />
                    Deduplication
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={detectDuplicates}
                    disabled={detectingDuplicates}
                  >
                    <Copy className={`w-4 h-4 mr-2 ${detectingDuplicates ? 'animate-spin' : ''}`} />
                    Dedup Properties
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={detectBrokerDuplicates}
                    disabled={detectingDuplicates}
                  >
                    <Users className={`w-4 h-4 mr-2 ${detectingDuplicates ? 'animate-spin' : ''}`} />
                    Dedup Brokers
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={detectBuildingDuplicates}
                    disabled={detectingBuildingDuplicates}
                  >
                    <Building2 className={`w-4 h-4 mr-2 ${detectingBuildingDuplicates ? 'animate-spin' : ''}`} />
                    Dedup Buildings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* AI Tools Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Tools
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={generatePropertyDescriptions}
                    disabled={generatingDescriptions}
                  >
                    <Sparkles className={`w-4 h-4 mr-2 ${generatingDescriptions ? 'animate-spin' : ''}`} />
                    Generate Descriptions
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={loadDealsRadar}
                    disabled={dealsLoading}
                  >
                    <Sparkles className={`w-4 h-4 mr-2 ${dealsLoading ? 'animate-spin' : ''}`} />
                    Deals Radar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Buildings Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
                    <Building2 className="w-4 h-4 mr-2" />
                    Buildings
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={cleanBuildingData}
                    disabled={cleaningBuildings}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${cleaningBuildings ? 'animate-spin' : ''}`} />
                    Clean Building Data
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={backfillBuildings}
                    disabled={generatingSlugs}
                  >
                    <Building2 className={`w-4 h-4 mr-2 ${generatingSlugs ? 'animate-spin' : ''}`} />
                    Generate Buildings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={recalculateBuildingStats}
                    disabled={generatingSlugs}
                  >
                    <TrendingUp className={`w-4 h-4 mr-2 ${generatingSlugs ? 'animate-spin' : ''}`} />
                    Recalculate Stats
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Broker Trust Score */}
              <Button onClick={recalculateBrokerTrust} size="sm" variant="outline">
                <Star className="w-4 h-4 mr-2" />
                Trust
              </Button>
            </div>
          </div>

          {/* Tab Selector */}
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
                <SelectItem value="broker-analytics">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Broker Analytics</span>
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

          {/* Duplicates Tab */}
          {activeTab === "duplicates" && (
            <motion.div
              key="duplicates"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <p className="text-sm text-slate-500">Showing {duplicates.length} potential duplicate properties.</p>
                </div>
                {duplicatesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                  </div>
                ) : duplicates.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                    <Copy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No duplicates found</h3>
                    <p className="text-slate-500">All properties are unique (or haven't been scanned yet).</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {duplicates.map((property) => (
                      <div
                        key={property.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all"
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
                              <Badge className="bg-orange-400/20 text-orange-900 border-orange-400 text-xs">
                                Duplicate
                              </Badge>
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
                  
                  <div className="bg-amber-50 rounded-lg p-3 mt-3 border border-amber-200">
                    <p className="text-xs text-amber-800">
                      <strong>💡 Tip:</strong> If listing counts are incorrect, click "Data Quality" → "Fix Data Issues" or use "Build All Profiles" to recalculate.
                    </p>
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
                      const activeListings = broker.active_listings_count || 0;
                      const totalListings = broker.total_listings_count || 0;
                      
                      return (
                        <div
                          key={broker.id}
                          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all"
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
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  <strong>{activeListings}</strong> active
                                </span>
                                {totalListings > activeListings && (
                                  <>
                                    <span>•</span>
                                    <span className="text-xs text-slate-500">{totalListings} total</span>
                                  </>
                                )}
                              </div>
                              {broker.trust_score && (
                                <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300] mt-2">
                                  <Star className="w-3 h-3 mr-1" fill="currentColor" />
                                  Trust: {broker.trust_score}/100
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleWhatsApp(broker)}
                              className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                              size="sm"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp
                            </Button>
                            <Button
                              onClick={() => navigate(createPageUrl("BrokerProfile") + `?id=${broker.id}`)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                            <Button
                              onClick={() => navigate(createPageUrl("BrokerPerformance") + `?id=${broker.id}`)}
                              variant="outline"
                              size="sm"
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analytics
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* NEW: Broker Analytics Tab */}
          {activeTab === "broker-analytics" && (
            <motion.div
              key="broker-analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 text-center">
                <BarChart3 className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Broker Analytics</h3>
                <p className="text-slate-600 mb-6">
                  View detailed performance analytics for all brokers
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("BrokerPerformance"))}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Open Broker Analytics Dashboard
                </Button>
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
              <div className="space-y-3">
                {requirements.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No requirements yet</h3>
                  </div>
                ) : (
                  requirements.map((req) => {
                    // Extract broker info from notes if it's a broker referral
                    const isBrokerReferral = req.client_type === "Broker Referral";
                    const brokerInfo = isBrokerReferral && req.notes 
                      ? req.notes.split('|')[0]?.replace('Broker:', '').trim()
                      : null;

                    // Normalize budget display
                    const budgetMin = req.budget_min || 0;
                    const budgetMax = req.budget_max || 0;
                    const budgetUnit = req.budget_unit === 'crores' ? 'Cr' : 'L';
                    const budgetDisplay = budgetMin && budgetMax 
                      ? `₹${budgetMin}-${budgetMax}${budgetUnit}`
                      : budgetMin 
                        ? `₹${budgetMin}${budgetUnit}+`
                        : budgetMax
                          ? `Up to ₹${budgetMax}${budgetUnit}`
                          : 'Budget not specified';

                    return (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-purple-300 transition-all"
                      >
                        {/* Header - Always Visible */}
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-base truncate">
                                {req.client_name}
                              </h3>
                              {req.custom_id && (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {req.custom_id}
                                </Badge>
                              )}
                              <Badge 
                                className={
                                  req.status === "Active" 
                                    ? "bg-green-500 text-white" 
                                    : "bg-slate-400 text-white"
                                }
                              >
                                {req.status}
                              </Badge>
                            </div>

                            {/* Quick Summary */}
                            <div className="flex items-center gap-3 text-xs text-slate-600">
                              {isBrokerReferral && brokerInfo && (
                                <>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    Broker: {brokerInfo}
                                  </span>
                                  <span>•</span>
                                </>
                              )}
                              {req.client_phone && (
                                <>
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {req.client_phone}
                                  </span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{req.bhk_preference?.join(", ") || "Any"}</span>
                              <span>•</span>
                              <span>{budgetDisplay}</span>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Details */}
                        <details className="group">
                          <summary className="px-4 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-between text-sm font-semibold text-slate-700">
                            <span>View Details</span>
                            <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                          </summary>
                          
                          <div className="p-4 space-y-4 border-t border-slate-100">
                            {/* Source Info */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50 rounded-xl p-3">
                                <p className="text-xs text-slate-500 mb-1">Source</p>
                                <p className="font-semibold text-slate-900 text-sm">
                                  {req.client_type || "Direct Client"}
                                </p>
                              </div>

                              {isBrokerReferral && brokerInfo && (
                                <div className="bg-purple-50 rounded-xl p-3">
                                  <p className="text-xs text-slate-500 mb-1">Broker</p>
                                  <p className="font-semibold text-purple-900 text-sm">
                                    {brokerInfo}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Requirements Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50 rounded-xl p-3">
                                <p className="text-xs text-slate-500 mb-1">BHK</p>
                                <p className="font-bold text-slate-900">
                                  {req.bhk_preference?.join(", ") || "Any"}
                                </p>
                              </div>

                              <div className="bg-slate-50 rounded-xl p-3">
                                <p className="text-xs text-slate-500 mb-1">Budget</p>
                                <p className="font-bold text-slate-900">
                                  {budgetDisplay}
                                </p>
                              </div>

                              <div className="bg-slate-50 rounded-xl p-3">
                                <p className="text-xs text-slate-500 mb-1">Type</p>
                                <p className="font-bold text-slate-900">
                                  {req.listing_type}
                                </p>
                              </div>

                              {req.furnishing_preference && req.furnishing_preference !== "Any" && (
                                <div className="bg-slate-50 rounded-xl p-3">
                                  <p className="text-xs text-slate-500 mb-1">Furnishing</p>
                                  <p className="font-bold text-slate-900">
                                    {req.furnishing_preference}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Locations */}
                            {req.preferred_locations && req.preferred_locations.length > 0 && (
                              <div className="bg-slate-50 rounded-xl p-3">
                                <p className="text-xs text-slate-500 mb-2">Preferred Locations</p>
                                <div className="flex flex-wrap gap-1">
                                  {req.preferred_locations.map((loc, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      <MapPin className="w-3 h-3 mr-1" />
                                      {loc}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Additional Requirements */}
                            {(req.parking_required || req.amenities_required?.length > 0 || req.veg_nonveg || req.possession_timeline) && (
                              <div className="bg-slate-50 rounded-xl p-3">
                                <p className="text-xs text-slate-500 mb-2">Additional Requirements</p>
                                <div className="space-y-1 text-xs text-slate-700">
                                  {req.parking_required && <p>• Parking Required</p>}
                                  {req.veg_nonveg && <p>• {req.veg_nonveg}</p>}
                                  {req.amenities_required?.length > 0 && (
                                    <p>• {req.amenities_required.join(", ")}</p>
                                  )}
                                  {req.possession_timeline && (
                                    <p>• Possession: {req.possession_timeline}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {req.notes && (
                              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                                <p className="text-xs text-amber-700 mb-1">Notes</p>
                                <p className="text-xs text-slate-700 whitespace-pre-line">
                                  {req.notes}
                                </p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t border-slate-200">
                              {req.client_phone && (
                                <Button
                                  onClick={() => {
                                    const message = `Hi ${req.client_name}, this is Chariot Realty. Regarding your requirement for ${req.bhk_preference?.join("/")} in Mumbai.`;
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
                        </details>
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
      <BuildingQueryModal />
      <AIParserModal />
    </div>
  );
}
