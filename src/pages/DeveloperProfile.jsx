import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, MapPin, Star, TrendingUp, ArrowLeft,
  CheckCircle2, Award, Globe, Calendar, Sparkles, Home
} from "lucide-react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

export default function DeveloperProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const developerId = urlParams.get('id');

  const { data: developer, isLoading: developerLoading } = useQuery({
    queryKey: ['developer', developerId],
    queryFn: async () => {
      const developers = await base44.entities.Developer.list();
      return developers.find(d => d.id === developerId);
    },
    enabled: !!developerId,
  });

  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ['developer-buildings', developerId],
    queryFn: async () => {
      if (!developer?.id) return [];
      const allBuildings = await base44.entities.Building.list();
      return allBuildings.filter(b => b.developer_id === developer.id);
    },
    enabled: !!developer?.id,
    initialData: [],
  });

  const { data: allProperties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list(),
    initialData: [],
  });

  const developerStats = useMemo(() => {
    if (!developer || buildings.length === 0) return null;

    const buildingIds = buildings.map(b => b.id);
    const developerProperties = allProperties.filter(p => 
      buildingIds.includes(p.building_id)
    );

    const activeProperties = developerProperties.filter(p => 
      p.status === 'Active' && !p.is_duplicate
    );

    const salesProps = developerProperties.filter(p => p.listing_type === 'Sale' && p.price);
    const avgSalePrice = salesProps.length > 0 
      ? (salesProps.reduce((sum, p) => {
          const priceInCr = p.price_unit === 'crores' ? p.price : p.price / 100;
          return sum + priceInCr;
        }, 0) / salesProps.length).toFixed(2)
      : null;

    return {
      totalBuildings: buildings.length,
      totalProperties: developerProperties.length,
      activeProperties: activeProperties.length,
      avgSalePrice,
      locationSpread: [...new Set(buildings.map(b => b.location))].length
    };
  }, [developer, buildings, allProperties]);

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

  if (!developerId) {
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64 w-full mb-8 rounded-3xl" />
          <Skeleton className="h-12 w-3/4 mb-4" />
        </div>
      </div>
    );
  }

  const developerSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": developer.name,
    "url": developer.website,
    "description": developer.description || `${developer.name} is a ${developer.tier} real estate developer in Mumbai`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": developer.locations_active?.[0] || "Mumbai",
      "addressCountry": "IN"
    },
    "aggregateRating": developer.reputation_score ? {
      "@type": "AggregateRating",
      "ratingValue": (developer.reputation_score / 20).toFixed(1),
      "bestRating": "5",
      "worstRating": "0"
    } : undefined
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <SEO
        title={`${developer.name} - Developer Profile | PropAI Live`}
        description={`${developer.name} (${developer.tier}) - Track record, reputation, and ${buildings.length} buildings in Mumbai. ${developer.description || 'Verified developer profile on PropAI Live.'}`}
        schema={[developerSchema]}
        canonical={window.location.href}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <Button
          onClick={() => navigate(createPageUrl("DeveloperDirectory"))}
          variant="ghost"
          className="mb-6 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Developers
        </Button>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-3xl p-8 mb-8 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`${getTierColor(developer.tier)} font-bold px-3 py-1 shadow-md border-0`}>
                  {developer.tier}
                </Badge>
                {developer.verified && (
                  <Badge className="bg-white text-purple-700 border-0 font-bold">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {developer.sustainability_focus && (
                  <Badge className="bg-green-500 text-white border-0 font-bold">
                    🌿 Sustainable
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-2">{developer.name}</h1>
              {developer.known_variants && developer.known_variants.length > 0 && (
                <p className="text-white/80 text-sm italic">
                  Also known as: {developer.known_variants.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          {developerStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="text-white/80 text-xs mb-1">Buildings</p>
                <p className="text-3xl font-bold">{developerStats.totalBuildings}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="text-white/80 text-xs mb-1">Active Listings</p>
                <p className="text-3xl font-bold">{developerStats.activeProperties}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="text-white/80 text-xs mb-1">Locations</p>
                <p className="text-3xl font-bold">{developerStats.locationSpread}</p>
              </div>
              {developerStats.avgSalePrice && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <p className="text-white/80 text-xs mb-1">Avg Sale Price</p>
                  <p className="text-2xl font-bold">₹{developerStats.avgSalePrice} Cr</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            {developer.description && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  About
                </h3>
                <p className="text-slate-700 leading-relaxed">{developer.description}</p>
              </div>
            )}

            {/* Notable Projects */}
            {developer.notable_projects && developer.notable_projects.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Flagship Projects
                </h3>
                <div className="grid gap-3">
                  {developer.notable_projects.map((project, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                      <Star className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-slate-900">{project}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specializations */}
            {developer.specializations && developer.specializations.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Specializations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {developer.specializations.map((spec, idx) => (
                    <Badge key={idx} className="bg-purple-100 text-purple-800 border-purple-300 text-sm">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Awards */}
            {developer.awards && developer.awards.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Awards & Recognition
                </h3>
                <ul className="space-y-2">
                  {developer.awards.map((award, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>{award}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Quick Facts */}
          <div className="space-y-4">
            {/* Reputation Score */}
            {developer.reputation_score && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200">
                <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Reputation</h4>
                <div className="mb-3">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all"
                      style={{ width: `${developer.reputation_score}%` }}
                    />
                  </div>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {developer.reputation_score}/100
                </p>
              </div>
            )}

            {/* Track Record */}
            {developer.delivery_track_record && developer.delivery_track_record !== "Unknown" && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200">
                <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Track Record</h4>
                <Badge className={`${getDeliveryBadgeColor(developer.delivery_track_record)} font-bold text-lg px-4 py-2`}>
                  {developer.delivery_track_record}
                </Badge>
              </div>
            )}

            {/* Market Segment */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200">
              <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Market Focus</h4>
              <p className="text-lg font-bold text-slate-900">{developer.market_segment}</p>
            </div>

            {/* Scale */}
            {developer.est_sq_ft_developed && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200">
                <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Developed</h4>
                <p className="text-2xl font-bold text-purple-700">{developer.est_sq_ft_developed}</p>
                <p className="text-xs text-slate-500 mt-1">Square feet</p>
              </div>
            )}

            {/* Established */}
            {developer.year_established && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200">
                <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Established
                </h4>
                <p className="text-2xl font-bold text-slate-900">{developer.year_established}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date().getFullYear() - developer.year_established} years</p>
              </div>
            )}

            {/* Website */}
            {developer.website && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200">
                <a 
                  href={developer.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-700 hover:text-purple-800 font-semibold"
                >
                  <Globe className="w-4 h-4" />
                  Visit Website
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Focus Areas */}
        {developer.key_focus_areas && developer.key_focus_areas.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Key Focus Areas
            </h3>
            <div className="flex flex-wrap gap-3">
              {developer.key_focus_areas.map((area, idx) => (
                <Badge key={idx} className="bg-purple-500/20 text-purple-900 border-purple-500 text-sm px-4 py-2">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Active Locations */}
        {developer.locations_active && developer.locations_active.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Active Locations
            </h3>
            <div className="flex flex-wrap gap-2">
              {developer.locations_active.map((loc, idx) => (
                <Badge key={idx} variant="outline" className="text-sm border-purple-300 text-purple-700">
                  <MapPin className="w-3 h-3 mr-1" />
                  {loc}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Buildings Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-purple-600" />
              Buildings ({buildings.length})
            </h3>
            <Button
              onClick={() => navigate(createPageUrl("Buildings") + `?developer=${encodeURIComponent(developer.name)}`)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl"
            >
              View All Buildings
            </Button>
          </div>

          {buildingsLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : buildings.length === 0 ? (
            <div className="text-center py-12 bg-purple-50 rounded-2xl">
              <Building2 className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <p className="text-slate-600">No buildings tracked yet for this developer</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {buildings.slice(0, 6).map((building) => (
                <div
                  key={building.id}
                  onClick={() => navigate(createPageUrl("BuildingProfile") + `?id=${building.id}`)}
                  className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  <h4 className="font-bold text-slate-900 mb-2 group-hover:text-purple-700 transition-colors">
                    {building.name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <MapPin className="w-3 h-3 text-purple-500" />
                    <span>{building.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{building.active_listings || 0} active listings</span>
                    {building.year_built && (
                      <span>Built {building.year_built}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {buildings.length > 6 && (
            <div className="mt-4 text-center">
              <Button
                onClick={() => navigate(createPageUrl("Buildings") + `?developer=${encodeURIComponent(developer.name)}`)}
                variant="outline"
                className="border-purple-300 text-purple-700"
              >
                View All {buildings.length} Buildings
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}