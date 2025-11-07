
import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PropertyCard from "../components/property/PropertyCard";
import PropertyDetailsModal from "../components/property/PropertyDetailsModal";
import {
  Building2, MapPin, Star, TrendingUp, Home,
  ArrowLeft, Check, Phone, MessageCircle, Sparkles,
  Users, Calendar, Layers, IndianRupee, Shield, RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BuildingProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('id');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  // Load user for admin check
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

  const { data: building, isLoading: buildingLoading } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      const buildings = await base44.entities.Building.list();
      return buildings.find(b => b.id === buildingId);
    },
    enabled: !!buildingId,
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['building-properties', buildingId],
    queryFn: async () => {
      if (!building?.name) return [];
      const allProps = await base44.entities.Property.filter({ status: "Active" });
      return allProps.filter(p => p.building_name === building.name);
    },
    enabled: !!building?.name,
    initialData: [],
  });

  // Get historical data for Building Memory
  const { data: buildingHistory = [] } = useQuery({
    queryKey: ['building-history', buildingId],
    queryFn: async () => {
      if (!building?.name) return [];
      // Get ALL properties from this building (including sold/rented for history)
      const allProps = await base44.entities.Property.filter({
        building_name: building.name
      }, '-created_date');
      return allProps;
    },
    enabled: !!building?.name,
    initialData: [],
  });

  // Calculate building intelligence
  const buildingIntelligence = useMemo(() => {
    if (buildingHistory.length === 0) return null;

    const now = new Date();
    const sixMonthsAgo = new Date(now); // Create a new Date object
    sixMonthsAgo.setMonth(now.getMonth() - 6); // Set it 6 months ago

    const recent = buildingHistory.filter(p =>
      p.created_date && new Date(p.created_date) >= sixMonthsAgo
    );

    const rentals = buildingHistory.filter(p => p.listing_type === 'Rent');
    const sales = buildingHistory.filter(p => p.listing_type === 'Sale');

    // Calculate average prices by BHK
    // Returns value in Lakhs for consistency (1 Cr = 100 Lakhs)
    const calculateAvg = (props, bhk) => {
      const filtered = props.filter(p => p.bhk === bhk && p.price);
      if (filtered.length === 0) return null;
      const sum = filtered.reduce((acc, p) => {
        // Convert all prices to Lakhs for calculation
        const price = p.price_unit === 'crores' ? p.price * 100 : p.price;
        return acc + price;
      }, 0);
      return (sum / filtered.length).toFixed(2);
    };

    return {
      totalListings: buildingHistory.length,
      listingsLast6Months: recent.length,
      activeListings: buildingHistory.filter(p => p.status === 'Active').length,
      completedDeals: buildingHistory.filter(p => p.status === 'Sold' || p.status === 'Rented').length,
      avgRent2BHK: calculateAvg(rentals, '2 BHK'),
      avgRent3BHK: calculateAvg(rentals, '3 BHK'),
      avgSale2BHK: calculateAvg(sales, '2 BHK'),
      avgSale3BHK: calculateAvg(sales, '3 BHK'),
      activityTrend: recent.length >= 10 ? 'High Activity' : recent.length >= 5 ? 'Moderate' : 'Low Activity'
    };
  }, [buildingHistory]);

  // NEW: Recalculate building stats
  const handleRecalculateStats = async () => {
    if (!building) return;

    setIsRecalculating(true);
    const loadingToast = toast.loading('🔄 Recalculating building statistics...', {
      description: 'Analyzing property data and market trends'
    });

    try {
      const response = await base44.functions.invoke('recalculateBuildingStats', {
        building_id: building.id
      });

      if (response.data.success) {
        toast.dismiss(loadingToast);
        toast.success('✅ Building Stats Updated!', {
          description: `${response.data.stats.total_listings} listings analyzed`,
          duration: 5000
        });

        // Refresh building data
        window.location.reload();
      } else {
        throw new Error(response.data.error || 'Failed to recalculate stats');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Recalculation Failed', {
        description: error.message
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  // NEW: Enrich building from web
  const handleEnrichFromWeb = async () => {
    if (!building) return;

    setIsEnriching(true);
    const loadingToast = toast.loading('🌐 Gathering web intelligence...', {
      description: 'Searching for developer info, amenities, and reviews'
    });

    try {
      const response = await base44.functions.invoke('enrichBuildingFromWeb', {
        building_name: building.name,
        location: building.location
      });

      if (response.data.success) {
        const enrichment = response.data.enrichment;

        // Update building with enriched data
        await base44.entities.Building.update(building.id, {
          developer_name: enrichment.developer_name || building.developer_name,
          developer_reputation: enrichment.developer_reputation || building.developer_reputation,
          year_built: enrichment.year_built || building.year_built,
          building_type: enrichment.building_type || building.building_type,
          total_floors: enrichment.total_floors || building.total_floors,
          total_units: enrichment.total_units || building.total_units,
          amenities: enrichment.amenities?.length > 0 ? [...new Set([...(building.amenities || []), ...enrichment.amenities])] : building.amenities,
          vibe_keywords: enrichment.vibe_keywords?.length > 0 ? [...new Set([...(building.vibe_keywords || []), ...enrichment.vibe_keywords])] : building.vibe_keywords,
          expat_friendly: enrichment.expat_friendly ?? building.expat_friendly,
          pet_friendly: enrichment.pet_friendly ?? building.pet_friendly,
          veg_only: enrichment.veg_only ?? building.veg_only,
          management_quality: enrichment.management_quality !== 'Unknown' ? enrichment.management_quality : building.management_quality,
          building_summary: enrichment.building_summary || building.building_summary,
          verification_source: enrichment.verification_source || building.verification_source,
          last_intelligence_update: new Date().toISOString()
        });

        toast.dismiss(loadingToast);
        toast.success('✅ Web Enrichment Complete!', {
          description: enrichment.verification_source || 'Building data updated from web sources',
          duration: 5000
        });

        // Refresh page to show new data
        window.location.reload();
      } else {
        throw new Error(response.data.error || 'Failed to enrich building');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Web Enrichment Failed', {
        description: error.message
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleWhatsApp = () => {
    // Get broker contact from most recent active property
    let brokerContact = '919819471310'; // Fallback to Vishal
    let brokerName = 'Vishal';
    
    if (properties && properties.length > 0) {
      // Find first property with broker contact
      const propertyWithBroker = properties.find(p => 
        p.broker_contact && 
        p.broker_contact !== '919819471310'
      );
      
      if (propertyWithBroker) {
        brokerContact = propertyWithBroker.broker_contact;
        brokerName = 'Broker';
      }
    }
    
    const message = `Hi${brokerName !== 'Broker' ? ` ${brokerName}` : ''}, I'm interested in properties at ${building.name}, ${building.location}. Can you share available options?\n\nFound via www.propai.live`;
    window.open(`https://wa.me/${brokerContact}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const buildingSchema = building ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Residence",
        "name": building.name,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": building.location,
          "streetAddress": building.pocket || building.location,
          "addressCountry": "IN"
        },
        "description": `${building.name} in ${building.location}. ${building.amenities?.length || 0} amenities, ${building.total_units || 'Multiple'} units.`,
        "numberOfRooms": building.total_units,
        "amenityFeature": building.amenities?.map(a => ({
          "@type": "LocationFeatureSpecification",
          "name": a
        })) || [],
        "image": building.images?.[0],
        "aggregateRating": building.management_quality && building.management_quality !== "Unknown" ? {
          "@type": "AggregateRating",
          "ratingValue": building.management_quality === "Excellent" ? "5" :
                        building.management_quality === "Good" ? "4" :
                        building.management_quality === "Average" ? "3" : "2",
          "bestRating": "5",
          "worstRating": "1"
        } : undefined
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://propai.live"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Buildings",
            "item": "https://propai.live/buildings"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": building.name,
            "item": `https://propai.live/building/${building.slug || building.id}`
          }
        ]
      }
    ]
  } : null;

  if (!buildingId) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#111111] mb-4">Building not found</h2>
          <Button onClick={() => navigate(createPageUrl("Buildings"))}>
            Back to Buildings
          </Button>
        </div>
      </div>
    );
  }

  if (buildingLoading || !building || isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96 w-full mb-8 rounded-3xl" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {building && (
        <SEO
          title={`${building.name}, ${building.location} | Pricing, Amenities & Listings | PropAI`}
          description={`${building.name} in ${building.location} — View active listings, average pricing, building amenities & verified reviews. Street-level property intelligence by PropAI Live.`}
          ogImage={building.images?.[0]}
          schema={buildingSchema}
          canonical={`https://propai.live/building/${building.slug || building.id}`}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">

        {/* Back Button */}
        <Button
          onClick={() => navigate(createPageUrl("Buildings"))}
          variant="ghost"
          className="mb-6 text-[#3B3B3B] hover:text-[#111111] hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Buildings
        </Button>

        {/* NEW: Admin Actions Bar */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4 mb-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">🔧 Admin Tools</p>
                <p className="text-xs text-white/80">Update building intelligence and web data</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleRecalculateStats}
                  disabled={isRecalculating}
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {isRecalculating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Recalculate Stats
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleEnrichFromWeb}
                  disabled={isEnriching}
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {isEnriching ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Enrich from Web
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Hero Section - NO IMAGE */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg mb-8 border border-purple-200/50">
          {/* Header - Text Only */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-12">
            <div className="flex items-center gap-2 mb-3">
              {building.verified && (
                <Badge className="bg-white text-purple-700 border-0 font-bold">
                  <Check className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {building.building_type && (
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                  {building.building_type}
                </Badge>
              )}
              {building.last_intelligence_update && (
                <Badge className="bg-white/10 backdrop-blur-sm text-white/90 border-white/20 text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Updated {format(new Date(building.last_intelligence_update), "MMM dd, yyyy")}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
              {building.name}
            </h1>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="w-4 h-4" />
              <span className="text-lg">{building.location}</span>
              {building.pocket && (
                <>
                  <span>•</span>
                  <span>{building.pocket}</span>
                </>
              )}
            </div>
          </div>

          <div className="p-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {building.active_listings > 0 && (
                <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <p className="text-sm text-slate-600 mb-1">Active Listings</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{building.active_listings}</p>
                </div>
              )}
              {building.total_units && (
                <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <Home className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-1">Total Units</p>
                  <p className="text-2xl font-bold text-slate-900">{building.total_units}</p>
                </div>
              )}
              {building.year_built && (
                <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-1">Year Built</p>
                  <p className="text-2xl font-bold text-slate-900">{building.year_built}</p>
                </div>
              )}
            </div>

            {/* Building Summary - AI Generated or Web Enriched */}
            {building.building_summary && (
              <div className="mb-8 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">About This Building</h3>
                </div>
                <p className="text-slate-700 leading-relaxed">{building.building_summary}</p>
                {building.verification_source && (
                  <p className="text-xs text-indigo-600 mt-3 italic">
                    📊 Source: {building.verification_source}
                  </p>
                )}
              </div>
            )}

            {/* NEW: Building Memory - Enhanced with more details */}
            {buildingIntelligence && buildingIntelligence.totalListings > 0 && (
              <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-purple-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-900">Building Memory™</h3>
                    <Badge className="bg-purple-600 text-white text-xs">Street Intelligence</Badge>
                  </div>
                  {building.market_activity && (
                    <Badge className={`text-xs ${
                      building.market_activity === 'High Activity' ? 'bg-green-500/20 text-green-700 border-green-500' :
                      building.market_activity === 'Moderate' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500' :
                      'bg-slate-500/20 text-slate-700 border-slate-500'
                    }`}>
                      {building.market_activity}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                    <p className="text-xs text-purple-700 mb-1">Total Listings</p>
                    <p className="text-2xl font-bold text-[#111111]">{buildingIntelligence.totalListings}</p>
                    <p className="text-xs text-slate-900 mt-1">All time</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                    <p className="text-xs text-purple-700 mb-1">Last 6 Months</p>
                    <p className="text-2xl font-bold text-blue-600">{buildingIntelligence.listingsLast6Months}</p>
                    <p className="text-xs text-slate-900 mt-1">{buildingIntelligence.activityTrend}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                    <p className="text-xs text-purple-700 mb-1">Active Now</p>
                    <p className="text-2xl font-bold text-green-600">{buildingIntelligence.activeListings}</p>
                    <p className="text-xs text-slate-900 mt-1">Available</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                    <p className="text-xs text-purple-700 mb-1">Deals Closed</p>
                    <p className="text-2xl font-bold text-purple-600">{buildingIntelligence.completedDeals}</p>
                    <p className="text-xs text-slate-900 mt-1">Sold/Rented</p>
                  </div>
                </div>

                {/* Historical Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/80 rounded-xl p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Home className="w-4 h-4 text-blue-600" />
                      Average Rent Trends
                    </h4>
                    {buildingIntelligence.avgRent2BHK && (
                      <div className="mb-2">
                        <p className="text-xs text-[#3B3B3B]">2 BHK Average</p>
                        <p className="text-xl font-bold text-[#111111]">₹{buildingIntelligence.avgRent2BHK}L<span className="text-xs font-normal">/month</span></p>
                      </div>
                    )}
                    {buildingIntelligence.avgRent3BHK && (
                      <div>
                        <p className="text-xs text-[#3B3B3B]">3 BHK Average</p>
                        <p className="text-xl font-bold text-[#111111]">₹{buildingIntelligence.avgRent3BHK}L<span className="text-xs font-normal">/month</span></p>
                      </div>
                    )}
                    {!buildingIntelligence.avgRent2BHK && !buildingIntelligence.avgRent3BHK && (
                      <p className="text-sm text-[#3B3B3B]">No rental data available yet</p>
                    )}
                  </div>

                  <div className="bg-white/80 rounded-xl p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-green-600" />
                      Average Sale Prices
                    </h4>
                    {buildingIntelligence.avgSale2BHK && (
                      <div className="mb-2">
                        <p className="text-xs text-[#3B3B3B]">2 BHK Average</p>
                        <p className="text-xl font-bold text-[#111111]">₹{(buildingIntelligence.avgSale2BHK / 100).toFixed(2)} Cr</p>
                      </div>
                    )}
                    {buildingIntelligence.avgSale3BHK && (
                      <div>
                        <p className="text-xs text-[#3B3B3B]">3 BHK Average</p>
                        <p className="text-xl font-bold text-[#111111]">₹{(buildingIntelligence.avgSale3BHK / 100).toFixed(2)} Cr</p>
                      </div>
                    )}
                    {!buildingIntelligence.avgSale2BHK && !buildingIntelligence.avgSale3BHK && (
                      <p className="text-sm text-[#3B3B3B]">No sale data available yet</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-amber-800 mt-4 italic">
                  📊 AI-calculated from {buildingIntelligence.totalListings} listings • Updated from broker WhatsApp data
                </p>
              </div>
            )}

            {/* Developer Info - Enhanced */}
            {building.developer_name && (
              <div className="mb-8 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide">Developer</p>
                    <p className="text-lg font-bold text-[#111111]">{building.developer_name}</p>
                    {building.developer_reputation && (
                      <p className="text-sm text-stone-600 mt-2">{building.developer_reputation}</p>
                    )}
                  </div>
                  <Badge className="bg-stone-200 text-stone-800 text-xs">
                    Verified
                  </Badge>
                </div>
              </div>
            )}

            {/* Vibe Keywords - NEW SECTION */}
            {building.vibe_keywords && building.vibe_keywords.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[#111111] mb-3 uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Building Vibe
                </h3>
                <div className="flex flex-wrap gap-2">
                  {building.vibe_keywords.map((keyword, idx) => (
                    <Badge key={idx} className="bg-purple-500/20 text-purple-900 border-purple-500">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tags & Features */}
            {building.tags && building.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[#111111] mb-3 uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Building Features
                </h3>
                <div className="flex flex-wrap gap-2">
                  {building.tags.map((tag, idx) => (
                    <Badge key={idx} className="bg-amber-500/20 text-amber-900 border-amber-500">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {building.amenities && building.amenities.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[#111111] mb-3 uppercase tracking-wide">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {building.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-[#3B3B3B]">
                      <Check className="w-4 h-4 text-amber-500" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Management Quality */}
            {building.management_quality && building.management_quality !== "Unknown" && (
              <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                  <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wide">Management Quality</h3>
                </div>
                <p className="text-2xl font-bold text-amber-700">{building.management_quality}</p>
              </div>
            )}

            {/* Average Pricing */}
            {(building.avg_rent_2bhk || building.avg_rent_3bhk || building.avg_sale_2bhk || building.avg_sale_3bhk) && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[#111111] mb-4 uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Average Pricing
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {building.avg_rent_2bhk && (
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">2 BHK Rent</p>
                      <p className="text-2xl font-bold text-[#111111]">₹{building.avg_rent_2bhk}L</p>
                      <p className="text-xs text-blue-600 mt-1">per month</p>
                    </div>
                  )}
                  {building.avg_rent_3bhk && (
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">3 BHK Rent</p>
                      <p className="text-2xl font-bold text-[#111111]">₹{building.avg_rent_3bhk}L</p>
                      <p className="text-xs text-blue-600 mt-1">per month</p>
                    </div>
                  )}
                  {building.avg_sale_2bhk && (
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                      <p className="text-xs text-green-600 mb-1">2 BHK Sale</p>
                      <p className="text-2xl font-bold text-[#111111]">₹{building.avg_sale_2bhk} Cr</p>
                    </div>
                  )}
                  {building.avg_sale_3bhk && (
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                      <p className="text-xs text-green-600 mb-1">3 BHK Sale</p>
                      <p className="text-2xl font-bold text-[#111111]">₹{building.avg_sale_3bhk} Cr</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Notes - ONLY SHOW TO ADMINS */}
            {isAdmin && building.admin_notes && (
              <div className="mb-8 p-4 bg-red-50 rounded-2xl border-2 border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <p className="text-xs text-red-600 font-bold uppercase tracking-wide">⚠️ Admin Only - Internal Notes</p>
                </div>
                <p className="text-sm text-slate-900">{building.admin_notes}</p>
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-3">
              <Button
                onClick={handleWhatsApp}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-12 rounded-2xl shadow-md"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Inquire via WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Available Properties Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#111111]">
              Available Properties ({properties.length})
            </h2>
          </div>

          {propertiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-3xl" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-[#F7F7F7]">
              <Home className="w-12 h-12 text-[#3B3B3B] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#111111] mb-2">No active listings</h3>
              <p className="text-[#3B3B3B] mb-6">
                We don't have active properties from this building right now, but we can notify you when new listings arrive.
              </p>
              <Button onClick={handleWhatsApp} className="bg-[#25D366] hover:bg-[#20BD5A] text-white">
                <MessageCircle className="w-4 h-4 mr-2" />
                Get Notified
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={setSelectedProperty}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
}
