import React, { useState, useMemo, useEffect } from "react";
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
import PropertyCard from "../components/property/PropertyCard";
import {
  Building2, MapPin, Star, TrendingUp, Home, Sparkles,
  ArrowLeft, MessageCircle, RefreshCw, Edit, Save, X,
  Loader2, AlertCircle, Calendar, Eye, CheckCircle2,
  ShieldCheck, Merge, Info
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import SEO from "../components/SEO";
import { toast, Toaster } from "sonner";
import { format } from "date-fns";

export default function BuildingBlog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // ✅ Admin editing states
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  
  const [showMergeTool, setShowMergeTool] = useState(false);
  const [mergeSearchQuery, setMergeSearchQuery] = useState("");
  const [selectedMergeTarget, setSelectedMergeTarget] = useState(null);
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoadingUser(true);
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const isAdmin = user?.role === 'admin';

  // ✅ FETCH BUILDING
  const { data: building, isLoading: buildingLoading } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      const buildings = await base44.entities.Building.list();
      return buildings.find(b => b.id === buildingId);
    },
    enabled: !!buildingId,
  });

  // ✅ FETCH BUILDING BLOG
  const { data: buildingBlog, isLoading: blogLoading } = useQuery({
    queryKey: ['building-blog', buildingId],
    queryFn: async () => {
      if (!buildingId) return null;
      const blogs = await base44.entities.Blog.filter({ building_id: buildingId });
      return blogs.find(b => b.building_id === buildingId && b.category === "Building Blog");
    },
    enabled: !!buildingId,
  });

  // ✅ FETCH ACTIVE PROPERTIES
  const { data: properties = [] } = useQuery({
    queryKey: ['building-properties', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      const allProps = await base44.entities.Property.filter({ 
        status: "Active",
        building_id: buildingId
      });
      return allProps.filter(p => !p.is_duplicate);
    },
    enabled: !!buildingId,
    initialData: [],
  });

  // ✅ FETCH DEVELOPER
  const { data: developer } = useQuery({
    queryKey: ['developer', building?.developer_id],
    queryFn: async () => {
      if (!building?.developer_id) return null;
      const developers = await base44.entities.Developer.list();
      return developers.find(d => d.id === building.developer_id);
    },
    enabled: !!building?.developer_id,
  });

  // ✅ FETCH ALL BUILDINGS (for merge tool)
  const { data: allBuildings = [] } = useQuery({
    queryKey: ['all-buildings'],
    queryFn: () => base44.entities.Building.list(),
    enabled: isAdmin && showMergeTool,
    initialData: [],
  });

  // ✅ REGENERATE BUILDING BLOG
  const handleRegenerate = async () => {
    if (!building) return;

    setIsRegenerating(true);
    const loadingToast = toast.loading('🔄 Regenerating Building Blog...', {
      description: 'Analyzing latest market data and property listings'
    });

    try {
      const response = await base44.functions.invoke('generateBuildingBlog', {
        building_id: building.id
      });

      if (response.data.success) {
        toast.dismiss(loadingToast);
        toast.success('✅ Building Blog Updated!', {
          description: `${response.data.data.active_listings} active listings analyzed`,
          duration: 5000
        });

        queryClient.invalidateQueries({ queryKey: ['building-blog'] });
        queryClient.invalidateQueries({ queryKey: ['building'] });
      } else {
        throw new Error(response.data.error || 'Failed to regenerate blog');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Generation Failed', {
        description: error.message
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // ✅ SAVE ADDRESS (ADMIN ONLY)
  const handleSaveAddress = async () => {
    if (!building || !addressInput.trim()) return;

    setSavingAddress(true);
    try {
      await base44.entities.Building.update(building.id, {
        full_address: addressInput.trim()
      });

      toast.success('✅ Address Updated!');
      queryClient.invalidateQueries({ queryKey: ['building'] });
      setEditingAddress(false);
    } catch (error) {
      toast.error('Failed to save address', {
        description: error.message
      });
    } finally {
      setSavingAddress(false);
    }
  };

  // ✅ MERGE BUILDINGS (ADMIN ONLY)
  const handleMergeBuildings = async () => {
    if (!building || !selectedMergeTarget) return;

    if (!window.confirm(`Merge "${selectedMergeTarget.name}" into "${building.name}"? This will reassign all properties and cannot be undone.`)) {
      return;
    }

    setIsMerging(true);
    const loadingToast = toast.loading('🔄 Merging buildings...', {
      description: 'Reassigning properties and updating references'
    });

    try {
      // Reassign all properties from target to current building
      const allProps = await base44.entities.Property.list();
      const targetProps = allProps.filter(p => p.building_id === selectedMergeTarget.id);

      for (const prop of targetProps) {
        await base44.entities.Property.update(prop.id, {
          building_id: building.id,
          building_name: building.name
        });
      }

      // Mark target building as duplicate
      await base44.entities.Building.update(selectedMergeTarget.id, {
        duplicate_of: building.id,
        verified: false,
        admin_notes: `Merged into ${building.name} on ${new Date().toLocaleDateString()}`
      });

      toast.dismiss(loadingToast);
      toast.success('✅ Buildings Merged!', {
        description: `${targetProps.length} properties reassigned`,
        duration: 5000
      });

      queryClient.invalidateQueries({ queryKey: ['building'] });
      queryClient.invalidateQueries({ queryKey: ['building-properties'] });
      queryClient.invalidateQueries({ queryKey: ['all-buildings'] });
      
      setShowMergeTool(false);
      setSelectedMergeTarget(null);
      setMergeSearchQuery("");

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Merge Failed', {
        description: error.message
      });
    } finally {
      setIsMerging(false);
    }
  };

  // ✅ FILTER BUILDINGS FOR MERGE (exclude current + duplicates)
  const mergeCandidates = useMemo(() => {
    if (!building || !mergeSearchQuery.trim()) return [];
    
    const query = mergeSearchQuery.toLowerCase();
    return allBuildings.filter(b => 
      b.id !== building.id &&
      !b.duplicate_of &&
      (b.name.toLowerCase().includes(query) || 
       b.location.toLowerCase().includes(query))
    ).slice(0, 10);
  }, [allBuildings, building, mergeSearchQuery]);

  // ✅ INCREMENT VIEW COUNT
  useEffect(() => {
    if (buildingBlog) {
      base44.entities.Blog.update(buildingBlog.id, {
        views_count: (buildingBlog.views_count || 0) + 1
      });
    }
  }, [buildingBlog?.id]);

  if (!buildingId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Building not found</h2>
          <Button onClick={() => navigate(createPageUrl("Buildings"))}>
            Back to Buildings
          </Button>
        </div>
      </div>
    );
  }

  if (buildingLoading || !building || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96 w-full mb-8 rounded-3xl" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
        </div>
      </div>
    );
  }

  const blogSchema = buildingBlog ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": buildingBlog.seo_title || buildingBlog.title,
    "description": buildingBlog.meta_description || buildingBlog.excerpt,
    "author": {
      "@type": "Organization",
      "name": "PropAI Live"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PropAI Live",
      "logo": {
        "@type": "ImageObject",
        "url": "https://propai.live/logo.png"
      }
    },
    "datePublished": buildingBlog.created_date,
    "dateModified": buildingBlog.last_auto_update || buildingBlog.updated_date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://propai.live/building-blog/${buildingBlog.slug}`
    }
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      {buildingBlog && (
        <SEO
          title={buildingBlog.seo_title || `${building.name} - ${building.location} | Building Intelligence`}
          description={buildingBlog.meta_description || buildingBlog.excerpt}
          schema={blogSchema}
          canonical={`https://propai.live/building-blog/${buildingBlog.slug}`}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">

        {/* Back Button */}
        <Button
          onClick={() => navigate(createPageUrl("Buildings"))}
          variant="ghost"
          className="mb-6 text-slate-700 hover:text-slate-900 hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Buildings
        </Button>

        {/* ✅ ADMIN TOOLS BAR */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4 mb-6 shadow-lg"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Admin Controls
                </p>
                <p className="text-xs text-white/80">Manage building data & merge duplicates</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Blog
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setEditingAddress(!editingAddress)}
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Address
                </Button>
                <Button
                  onClick={() => setShowMergeTool(!showMergeTool)}
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Merge className="w-4 h-4 mr-2" />
                  Merge Duplicates
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ✅ ADDRESS EDITING PANEL */}
        {isAdmin && editingAddress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl p-6 mb-6 border-2 border-purple-200 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Edit Full Address
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingAddress(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Paste the complete address from Google Maps or any source. This will be used for SEO and display.
            </p>
            <Textarea
              value={addressInput || building.full_address || ""}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="e.g., Oberoi Sky Heights, Lokhandwala Complex, Andheri West, Mumbai, Maharashtra 400053"
              className="mb-4 h-24"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveAddress}
                disabled={savingAddress || !addressInput.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                {savingAddress ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Address
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAddressInput(building.full_address || "");
                  setEditingAddress(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {/* ✅ MERGE TOOL PANEL */}
        {isAdmin && showMergeTool && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl p-6 mb-6 border-2 border-orange-200 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Merge className="w-5 h-5 text-orange-600" />
                Merge Duplicate Buildings
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowMergeTool(false);
                  setSelectedMergeTarget(null);
                  setMergeSearchQuery("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                This will merge another building INTO "{building.name}"
              </p>
              <p className="text-xs text-orange-700 mt-1">
                All properties from the selected building will be reassigned here. This action cannot be undone.
              </p>
            </div>

            <Input
              value={mergeSearchQuery}
              onChange={(e) => setMergeSearchQuery(e.target.value)}
              placeholder="Search for duplicate building by name or location..."
              className="mb-4"
            />

            {mergeCandidates.length > 0 && (
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {mergeCandidates.map(candidate => (
                  <Card
                    key={candidate.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedMergeTarget?.id === candidate.id
                        ? 'border-2 border-orange-500 bg-orange-50'
                        : 'border hover:border-orange-300'
                    }`}
                    onClick={() => setSelectedMergeTarget(candidate)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{candidate.name}</p>
                        <p className="text-xs text-slate-600">{candidate.location}{candidate.pocket ? `, ${candidate.pocket}` : ''}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {candidate.active_listings || 0} active • {candidate.total_listings || 0} total listings
                        </p>
                      </div>
                      {selectedMergeTarget?.id === candidate.id && (
                        <CheckCircle2 className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {selectedMergeTarget && (
              <Button
                onClick={handleMergeBuildings}
                disabled={isMerging}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Merging Buildings...
                  </>
                ) : (
                  <>
                    <Merge className="w-4 h-4 mr-2" />
                    Merge "{selectedMergeTarget.name}" into "{building.name}"
                  </>
                )}
              </Button>
            )}
          </motion.div>
        )}

        {/* ✅ NO BLOG YET - GENERATE PROMPT */}
        {!blogLoading && !buildingBlog && isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-3xl p-8 mb-8 border-2 border-purple-300 text-center"
          >
            <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Building Blog Not Generated Yet</h2>
            <p className="text-slate-700 mb-6">
              This building doesn't have an auto-generated blog post. Generate one now to create dynamic, data-driven content.
            </p>
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12 px-8 rounded-2xl shadow-lg"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Building Blog
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* ✅ BUILDING BLOG CONTENT */}
        {buildingBlog && (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl overflow-hidden shadow-xl border border-purple-200 mb-8"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                  Building Blog
                </Badge>
                {building.verified && (
                  <Badge className="bg-white text-purple-700 border-0 font-bold">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {buildingBlog.last_auto_update && (
                  <Badge className="bg-white/10 backdrop-blur-sm text-white/90 border-white/20 text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    Updated {format(new Date(buildingBlog.last_auto_update), "MMM dd, yyyy")}
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {buildingBlog.title}
              </h1>

              {buildingBlog.summary && (
                <p className="text-xl text-white/90 font-light mb-4">
                  {buildingBlog.summary}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {buildingBlog.views_count || 0} views
                </span>
                <span>•</span>
                <span>{buildingBlog.read_time || 5} min read</span>
                <span>•</span>
                <span>By {buildingBlog.author}</span>
              </div>
            </div>

            {/* Blog Content */}
            <div className="p-8">
              {/* Excerpt */}
              <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-8 rounded-r-xl">
                <p className="text-slate-700 font-medium italic">
                  {buildingBlog.excerpt}
                </p>
              </div>

              {/* Main Content */}
              <div className="prose prose-lg prose-purple max-w-none mb-8">
                <ReactMarkdown>{buildingBlog.content}</ReactMarkdown>
              </div>

              {/* Tags */}
              {buildingBlog.tags && buildingBlog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {buildingBlog.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Data Disclaimer */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-xs text-amber-800 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>
                    <strong>Data-Driven Content:</strong> This blog is auto-generated from real property data. Stats update automatically as new listings arrive.
                  </span>
                </p>
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    const message = `Hi, I'm interested in properties at ${building.name}, ${building.location}. Can you share available options?\n\nFound via www.propai.live`;
                    window.open(`https://wa.me/919819471310?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-12 rounded-2xl shadow-md"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Inquire via WhatsApp
                </Button>
              </div>
            </div>
          </motion.article>
        )}

        {/* ✅ ACTIVE PROPERTIES SECTION */}
        {properties.length > 0 && (
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-purple-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Home className="w-6 h-6 text-purple-600" />
                Available Now ({properties.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  user={user}
                  onViewDetails={(prop) => navigate(createPageUrl("PropertyDetails") + `?id=${prop.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ✅ NO PROPERTIES MESSAGE */}
        {properties.length === 0 && !blogLoading && (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-purple-200">
            <Home className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Listings</h3>
            <p className="text-slate-600 mb-6">
              We don't have active properties from this building right now.
            </p>
            <Button
              onClick={() => {
                const message = `Hi, I'm interested in properties at ${building.name}, ${building.location}. Please notify me when listings become available.\n\nFound via www.propai.live`;
                window.open(`https://wa.me/919819471310?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Get Notified
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}