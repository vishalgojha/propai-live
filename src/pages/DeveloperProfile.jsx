import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PropertyCard from "../components/property/PropertyCard";
import {
  Building2, MapPin, Star, TrendingUp, Award,
  ArrowLeft, Sparkles, CheckCircle2, Globe, Calendar,
  Package, Shield, BarChart3, Home
} from "lucide-react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import { Toaster } from "sonner";

export default function DeveloperProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const developerId = urlParams.get('id');
  const developerSlug = urlParams.get('slug');
  const [selectedProperty, setSelectedProperty] = useState(null);

  const { data: developer, isLoading: developerLoading } = useQuery({
    queryKey: ['developer', developerId || developerSlug],
    queryFn: async () => {
      const developers = await base44.entities.Developer.list();
      return developers.find(d => 
        d.id === developerId || 
        d.slug === developerSlug ||
        d.name === developerSlug
      );
    },
    enabled: !!(developerId || developerSlug),
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['developer-buildings', developer?.id],
    queryFn: async () => {
      if (!developer?.id) return [];
      const allBuildings = await base44.entities.Building.list('-active_listings');
      return allBuildings.filter(b => b.developer_id === developer.id);
    },
    enabled: !!developer?.id,
    initialData: [],
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['developer-properties', developer?.id],
    queryFn: async () => {
      if (!developer?.id || buildings.length === 0) return [];
      const allProps = await base44.entities.Property.filter({ status: "Active" }, '-created_date');
      const buildingIds = buildings.map(b => b.id);
      return allProps.filter(p => buildingIds.includes(p.building_id));
    },
    enabled: !!developer?.id && buildings.length > 0,
    initialData: [],
  });

  const { data: allBrokers = [] } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => base44.entities.Broker.list(),
    initialData: [],
  });

  // Calculate developer insights
  const developerInsights = useMemo(() => {
    if (!developer || buildings.length === 0) return null;

    const totalListings = buildings.reduce((sum, b) => sum + (b.total_listings || 0), 0);
    const activeListings = buildings.reduce((sum, b) => sum + (b.active_listings || 0), 0);

    // Find top locations by building count
    const locationCounts = {};
    buildings.forEach(b => {
      if (b.location) {
        locationCounts[b.location] = (locationCounts[b.location] || 0) + 1;
      }
    });
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([loc, count]) => ({ location: loc, count }));

    // Find brokers who work with this developer
    const developerBrokers = [];
    buildings.forEach(building => {
      if (building.broker_references) {
        building.broker_references.forEach(brokerId => {
          if (!developerBrokers.includes(brokerId)) {
            developerBrokers.push(brokerId);
          }
        });
      }
    });

    const brokerProfiles = allBrokers.filter(b => developerBrokers.includes(b.id));

    return {
      totalBuildings: buildings.length,
      totalListings,
      activeListings,
      topLocations,
      brokerProfiles: brokerProfiles.slice(0, 10)
    };
  }, [developer, buildings, allBrokers]);

  const getTierColor = (tier) => {
    switch (tier) {
      case "Tier 1": return "bg-gradient-to-r from-amber-500 to-yellow-500 text-white";
      case "Tier 2": return "bg-gradient-to-r from-blue-500 to-indigo-500 text-white";
      case "Tier 3": return "bg-gradient-to-r from-emerald-500 to-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getDeliveryBadgeColor = (track) => {
    switch (track) {
      case "Excellent": return "bg-green-100 text-green-800 border-green-300";
      case "Good": return "bg-blue-100 text-blue-800 border-blue-300";
      case "Average": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Poor": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const developerSchema = developer ? {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": developer.name,
    "description": developer.description || `${developer.name} - ${developer.tier} real estate developer in Mumbai`,
    "url": `${window.location.origin}/developerprofile?slug=${developer.slug || developer.id}`,
    "logo": developer.logo,
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Maharashtra",
      "addressCountry": "IN"
    },
    "aggregateRating": developer.reputation_score ? {
      "@type": "AggregateRating",
      "ratingValue": (developer.reputation_score / 20).toFixed(1),
      "bestRating": "5",
      "worstRating": "1"
    } : undefined
  } : null;

  if (!developerId && !developerSlug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Developer not found</h2>
          <Button onClick={() => navigate(createPageUrl("DeveloperDirectory"))}>
            Back to Developers
          </Button>
        </div>
      </div>
    );
  }

  if (developerLoading || !developer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96 w-full mb-8 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      <SEO
        title={`${developer.name} | Developer Profile | PropAI Live`}
        description={`${developer.name} - ${developer.tier} developer in Mumbai. ${developer.notable_projects?.slice(0, 3).join(', ')}. ${buildings.length} buildings tracked. ${developer.delivery_track_record} track record.`}
        schema={developerSchema}
        canonical={`${window.location.origin}/developerprofile?slug=${developer.slug || developer.id}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* Back Button */}
        <Button
          onClick={() => navigate(createPageUrl("DeveloperDirectory"))}
          variant="ghost"
          className="mb-6 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Developers
        </Button>

        {/* Hero Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-purple-200/50 overflow-hidden mb-8">
          
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-8 md:p-12">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Badge className={`${getTierColor(developer.tier)} font-bold px-4 py-1.5 mb-4 shadow-lg border-0`}>
                  {developer.tier}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                  {developer.name}
                </h1>
                {developer.known_variants && developer.known_variants.length > 0 && (
                  <p className="text-white/80 text-sm italic mb-4">
                    Also known as: {developer.known_variants.join(', ')}
                  </p>
                )}
              </div>
              
              {developer.verified && (
                <Badge className="bg-white text-purple-700 border-0 font-bold">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/80 text-xs mb-1">Buildings</p>
                <p className="text-3xl font-bold">{developerInsights?.totalBuildings || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/80 text-xs mb-1">Active Listings</p>
                <p className="text-3xl font-bold">{developerInsights?.activeListings || 0}</p>
              </div>
              {developer.reputation_score && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/80 text-xs mb-1">Reputation</p>
                  <p className="text-3xl font-bold">{developer.reputation_score}/100</p>
                </div>
              )}
              {developer.est_sq_ft_developed && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/80 text-xs mb-1">Developed</p>
                  <p className="text-2xl font-bold">{developer.est_sq_ft_developed}</p>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            
            {/* Track Record & Key Info */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {developer.delivery_track_record && developer.delivery_track_record !== "Unknown" && (
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-1">Track Record</p>
                  <Badge className={`${getDeliveryBadgeColor(developer.delivery_track_record)} font-bold`}>
                    {developer.delivery_track_record}
                  </Badge>
                </div>
              )}
              {developer.market_segment && (
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
                  <Home className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-1">Market Segment</p>
                  <p className="text-lg font-bold text-purple-700">{developer.market_segment}</p>
                </div>
              )}
              {developer.year_established && (
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                  <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-1">Established</p>
                  <p className="text-lg font-bold text-blue-700">{developer.year_established}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {developer.description && (
              <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">About {developer.name}</h3>
                </div>
                <p className="text-slate-700 leading-relaxed">{developer.description}</p>
              </div>
            )}

            {/* Notable Projects */}
            {developer.notable_projects && developer.notable_projects.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Notable Projects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {developer.notable_projects.map((project, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-purple-200">
                      <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0" />
                      <span className="font-semibold text-slate-900">{project}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Focus Areas */}
            {developer.key_focus_areas && developer.key_focus_areas.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {developer.key_focus_areas.map((area, idx) => (
                    <Badge key={idx} className="bg-purple-100 text-purple-800 border-purple-300 px-4 py-2">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Active Locations */}
            {developerInsights?.topLocations && developerInsights.topLocations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Active Locations in PropAI
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {developerInsights.topLocations.map((loc, idx) => (
                    <div key={idx} className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <p className="font-bold text-slate-900 text-lg">{loc.location}</p>
                      <p className="text-sm text-purple-700">{loc.count} {loc.count === 1 ? 'building' : 'buildings'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {developer.sustainability_focus && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mb-2" />
                  <p className="font-bold text-slate-900 text-sm">Sustainability Focus</p>
                  <p className="text-xs text-slate-600 mt-1">Green building certified</p>
                </div>
              )}
              {developer.rera_registered && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <Shield className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="font-bold text-slate-900 text-sm">RERA Registered</p>
                  {developer.rera_id && (
                    <p className="text-xs text-slate-600 mt-1 font-mono">{developer.rera_id}</p>
                  )}
                </div>
              )}
              {developer.website && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <Globe className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="font-bold text-slate-900 text-sm mb-2">Official Website</p>
                  <a 
                    href={developer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-purple-700 hover:text-purple-800 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visit Website →
                  </a>
                </div>
              )}
            </div>

            {/* Broker Network for this Developer */}
            {developerInsights?.brokerProfiles && developerInsights.brokerProfiles.length > 0 && (
              <div className="mb-8 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-600" />
                  Broker Network ({developerInsights.brokerProfiles.length})
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Brokers who frequently list {developer.name} properties
                </p>
                <div className="flex flex-wrap gap-2">
                  {developerInsights.brokerProfiles.map((broker) => (
                    <Badge key={broker.id} variant="outline" className="border-cyan-300 text-cyan-800 bg-white px-3 py-1.5">
                      {broker.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Buildings Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Buildings by {developer.name} ({buildings.length})
            </h2>
          </div>

          {buildings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-purple-200">
              <Building2 className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No buildings tracked yet</h3>
              <p className="text-slate-600">Buildings by this developer haven't been added to PropAI yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buildings.map((building) => (
                <motion.div
                  key={building.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl overflow-hidden border border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => navigate(createPageUrl("BuildingProfile") + `?id=${building.id}`)}
                >
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{building.name}</h3>
                    <div className="flex items-center gap-2 text-slate-600 mb-4">
                      <MapPin className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">{building.location}</span>
                    </div>

                    {building.building_type && (
                      <Badge variant="outline" className="mb-3 border-purple-300 text-purple-700">
                        {building.building_type}
                      </Badge>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-purple-100">
                      <div>
                        <p className="text-xs text-slate-500">Active Listings</p>
                        <p className="text-xl font-bold text-purple-700">{building.active_listings || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Total Listings</p>
                        <p className="text-xl font-bold text-indigo-700">{building.total_listings || 0}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Active Properties */}
        {properties.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Active Properties ({properties.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {properties.slice(0, 8).map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={setSelectedProperty}
                />
              ))}
            </div>

            {properties.length > 8 && (
              <div className="text-center mt-8">
                <Button
                  onClick={() => navigate(createPageUrl("Buildings") + `?developer=${encodeURIComponent(developer.name)}`)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg"
                >
                  View All {properties.length} Properties
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}