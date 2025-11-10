
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Search, TrendingUp, Shield, Award,
  MapPin, ArrowLeft, Sparkles, CheckCircle2, Home, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import { toast } from "sonner"; // For comparison error messages

export default function DeveloperDirectory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState("all");
  const [selectedSegment, setSelectedSegment] = useState("all"); // NEW
  const [showComparison, setShowComparison] = useState(false); // NEW
  const [comparisonDevelopers, setComparisonDevelopers] = useState([]); // NEW

  const { data: developers = [], isLoading } = useQuery({
    queryKey: ['developers'],
    queryFn: () => base44.entities.Developer.list('-reputation_score'),
    initialData: [],
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(),
    initialData: [],
  });

  const filteredDevelopers = useMemo(() => {
    return developers.filter(dev => {
      const matchesTier = selectedTier === "all" || dev.tier === selectedTier;
      const matchesSegment = selectedSegment === "all" || dev.market_segment === selectedSegment; // NEW
      const matchesSearch = !searchQuery ||
        dev.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.known_variants?.some(v => v.toLowerCase().includes(searchQuery.toLowerCase())) ||
        dev.notable_projects?.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTier && matchesSegment && matchesSearch; // Updated return
    });
  }, [developers, selectedTier, selectedSegment, searchQuery]); // Updated dependency array

  const tierStats = useMemo(() => {
    return {
      total: developers.length,
      tier1: developers.filter(d => d.tier === "Tier 1").length,
      tier2: developers.filter(d => d.tier === "Tier 2").length,
      tier3: developers.filter(d => d.tier === "Tier 3").length,
    };
  }, [developers]);

  // ✅ NEW: Market insights
  const marketInsights = useMemo(() => {
    const totalBuildings = buildings.filter(b => b.developer_id).length;
    const avgReputation = developers.reduce((sum, d) => sum + (d.reputation_score || 0), 0) / developers.length || 0;
    const sustainableDevelopers = developers.filter(d => d.sustainability_focus).length;
    
    return {
      totalBuildings,
      avgReputation: avgReputation.toFixed(1),
      sustainableDevelopers,
      topDeveloper: developers[0] // Already sorted by reputation, so first is top
    };
  }, [developers, buildings]);

  // ✅ NEW: Comparison toggle
  const toggleComparison = (developer) => {
    if (comparisonDevelopers.find(d => d.id === developer.id)) {
      setComparisonDevelopers(comparisonDevelopers.filter(d => d.id !== developer.id));
    } else if (comparisonDevelopers.length < 3) {
      setComparisonDevelopers([...comparisonDevelopers, developer]);
    } else {
      toast.error('You can compare a maximum of 3 developers at a time.');
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "Tier 1": return "bg-gradient-to-r from-amber-500 to-yellow-500 text-white";
      case "Tier 2": return "bg-gradient-to-r from-blue-500 to-indigo-500 text-white";
      case "Tier 3": return "bg-gradient-to-r from-emerald-500 to-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  // Function for tier badges in comparison table, reusing logic from getTierColor
  const getTierBadgeClass = (tier) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <SEO
        title="Mumbai Developers Directory | PropAI Live"
        description="Comprehensive directory of Mumbai's top real estate developers. Browse by tier, reputation, and track record. From Lodha to Godrej, explore verified developer profiles."
        canonical={window.location.href}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(createPageUrl("Home"))}
            variant="ghost"
            className="mb-6 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
                Developer Directory
              </h1>
              <p className="text-sm text-slate-600">Mumbai's top builders & their track records</p>
            </div>
          </div>

          {/* ✅ NEW: Market Insights Bar */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Market Insights
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-white/80 text-xs mb-1">Total Developers</p>
                <p className="text-3xl font-bold">{tierStats.total}</p>
              </div>
              <div>
                <p className="text-white/80 text-xs mb-1">Buildings Tracked</p>
                <p className="text-3xl font-bold">{marketInsights.totalBuildings}</p>
              </div>
              <div>
                <p className="text-white/80 text-xs mb-1">Avg Reputation</p>
                <p className="text-3xl font-bold">{marketInsights.avgReputation}/100</p>
              </div>
              <div>
                <p className="text-white/80 text-xs mb-1">Green Developers</p>
                <p className="text-3xl font-bold">{marketInsights.sustainableDevelopers}</p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-purple-200">
              <p className="text-2xl font-bold text-slate-900">{tierStats.total}</p>
              <p className="text-xs text-slate-600">Total Developers</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <p className="text-2xl font-bold text-amber-700">{tierStats.tier1}</p>
              <p className="text-xs text-amber-700">Tier 1 (Mega)</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">{tierStats.tier2}</p>
              <p className="text-xs text-blue-700">Tier 2 (Established)</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-700">{tierStats.tier3}</p>
              <p className="text-xs text-emerald-700">Tier 3 (Emerging)</p>
            </div>
          </div>

          {/* Search & Filters - ENHANCED */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search developers, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 border-purple-200 focus-visible:ring-purple-500 h-12 rounded-2xl"
              />
            </div>

            {/* ✅ NEW: Market Segment Filter */}
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="px-4 py-2 rounded-xl border-2 border-purple-200 text-sm font-semibold focus:ring-purple-500"
              >
                <option value="all">All Segments</option>
                <option value="Ultra-Luxury">Ultra-Luxury</option>
                <option value="Luxury">Luxury</option>
                <option value="Premium">Premium</option>
                <option value="Mid-Segment">Mid-Segment</option>
                <option value="Affordable">Affordable</option>
              </select>
            </div>
          </div>

          {/* Tier Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6"> {/* Added mb-6 */}
            <Button
              onClick={() => setSelectedTier("all")}
              variant={selectedTier === "all" ? "default" : "outline"}
              className={`rounded-xl ${selectedTier === "all" ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white" : "border-purple-200"}`}
            >
              All Tiers
            </Button>
            <Button
              onClick={() => setSelectedTier("Tier 1")}
              variant={selectedTier === "Tier 1" ? "default" : "outline"}
              className={`rounded-xl ${selectedTier === "Tier 1" ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white" : "border-amber-200"}`}
            >
              Tier 1
            </Button>
            <Button
              onClick={() => setSelectedTier("Tier 2")}
              variant={selectedTier === "Tier 2" ? "default" : "outline"}
              className={`rounded-xl ${selectedTier === "Tier 2" ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" : "border-blue-200"}`}
            >
              Tier 2
            </Button>
            <Button
              onClick={() => setSelectedTier("Tier 3")}
              variant={selectedTier === "Tier 3" ? "default" : "outline"}
              className={`rounded-xl ${selectedTier === "Tier 3" ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white" : "border-emerald-200"}`}
            >
              Tier 3
            </Button>
            
            {/* ✅ NEW: Comparison Mode Toggle */}
            {comparisonDevelopers.length > 0 && (
              <Button
                onClick={() => setShowComparison(!showComparison)}
                className={`rounded-xl ${showComparison ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-purple-50 text-purple-700 border-2 border-purple-300"}`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Compare ({comparisonDevelopers.length})
              </Button>
            )}
          </div>
        </div>

        {/* ✅ NEW: Comparison View */}
        {showComparison && comparisonDevelopers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 bg-white rounded-3xl p-6 border-2 border-purple-300 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Developer Comparison</h2>
              <Button
                onClick={() => {
                  setComparisonDevelopers([]);
                  setShowComparison(false);
                }}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-purple-200">
                    <th className="text-left p-3 text-sm font-bold text-slate-700">Metric</th>
                    {comparisonDevelopers.map(dev => (
                      <th key={dev.id} className="text-left p-3 text-sm font-bold text-purple-700">
                        {dev.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-purple-100">
                    <td className="p-3 font-semibold text-slate-700">Tier</td>
                    {comparisonDevelopers.map(dev => (
                      <td key={dev.id} className="p-3">
                        <Badge className={`${getTierBadgeClass(dev.tier)} font-bold text-xs px-3 py-1 rounded-full border-0 shadow-md`}>
                          {dev.tier}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-purple-100">
                    <td className="p-3 font-semibold text-slate-700">Reputation</td>
                    {comparisonDevelopers.map(dev => (
                      <td key={dev.id} className="p-3">
                        <span className="text-lg font-bold text-purple-700">
                          {dev.reputation_score || 'N/A'}/100
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-purple-100">
                    <td className="p-3 font-semibold text-slate-700">Track Record</td>
                    {comparisonDevelopers.map(dev => (
                      <td key={dev.id} className="p-3">
                        <Badge className={`${getDeliveryBadgeColor(dev.delivery_track_record)} font-semibold text-xs px-3 py-1`}>
                          {dev.delivery_track_record || 'Unknown'}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-purple-100">
                    <td className="p-3 font-semibold text-slate-700">Buildings Tracked</td>
                    {comparisonDevelopers.map(dev => {
                      const devBuildings = buildings.filter(b => b.developer_id === dev.id).length;
                      return (
                        <td key={dev.id} className="p-3">
                          <span className="text-lg font-bold text-slate-900">{devBuildings}</span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-purple-100">
                    <td className="p-3 font-semibold text-slate-700">Sq.Ft Developed</td>
                    {comparisonDevelopers.map(dev => (
                      <td key={dev.id} className="p-3 text-slate-700">
                        {dev.est_sq_ft_developed || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-purple-100">
                    <td className="p-3 font-semibold text-slate-700">Market Segment</td>
                    {comparisonDevelopers.map(dev => (
                      <td key={dev.id} className="p-3 text-slate-700">
                        {dev.market_segment || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-purple-100">
                    <td className="p-3 font-semibold text-slate-700">Sustainability</td>
                    {comparisonDevelopers.map(dev => (
                      <td key={dev.id} className="p-3">
                        {dev.sustainability_focus ? (
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-700">Primary Locations</td>
                    {comparisonDevelopers.map(dev => (
                      <td key={dev.id} className="p-3 text-xs text-slate-600">
                        {dev.locations_active?.slice(0, 3).join(', ') || 'N/A'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Developers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-3xl" />
            ))}
          </div>
        ) : filteredDevelopers.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No developers found</h3>
            <p className="text-slate-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevelopers.map((dev) => {
              const devBuildings = buildings.filter(b => b.developer_id === dev.id);
              const isInComparison = comparisonDevelopers.find(d => d.id === dev.id); // NEW
              
              return (
                <motion.div
                  key={dev.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border ${
                    isInComparison ? 'border-purple-500 border-2' : 'border-purple-200/50 hover:border-purple-400'
                  } cursor-pointer relative`} // Updated class name and added relative
                >
                  {/* ✅ NEW: Comparison checkbox */}
                  <div className="absolute top-4 right-4 z-10">
                    <input
                      type="checkbox"
                      checked={isInComparison}
                      onChange={(e) => {
                        e.stopPropagation(); // Prevent card click when checkbox is clicked
                        toggleComparison(dev);
                      }}
                      className="w-5 h-5 rounded accent-purple-600 cursor-pointer"
                    />
                  </div>

                  {/* Wrapped the entire card content, except the checkbox, in a div with the onClick */}
                  <div onClick={() => navigate(createPageUrl("Buildings") + `?developer=${encodeURIComponent(dev.name)}`)}>
                    {/* Header with Tier Badge */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-purple-100">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={`${getTierColor(dev.tier)} font-bold text-xs px-3 py-1 rounded-full border-0 shadow-md`}>
                          {dev.tier}
                        </Badge>
                        {dev.reputation_score && dev.reputation_score >= 85 && (
                          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{dev.name}</h3>
                      {dev.known_variants && dev.known_variants.length > 0 && (
                        <p className="text-xs text-slate-500 italic">
                          Also known as: {dev.known_variants[0]}
                        </p>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      {/* Reputation Score */}
                      {dev.reputation_score && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                          <span className="text-sm font-semibold text-slate-700">Reputation</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                                style={{ width: `${dev.reputation_score}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-purple-700">{dev.reputation_score}/100</span>
                          </div>
                        </div>
                      )}

                      {/* Track Record */}
                      {dev.delivery_track_record && dev.delivery_track_record !== "Unknown" && (
                        <Badge className={`${getDeliveryBadgeColor(dev.delivery_track_record)} font-semibold text-xs px-3 py-1`}>
                          {dev.delivery_track_record} Track Record
                        </Badge>
                      )}

                      {/* Key Focus */}
                      {dev.key_focus_areas && dev.key_focus_areas.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Focus Areas</p>
                          <div className="flex flex-wrap gap-2">
                            {dev.key_focus_areas.slice(0, 3).map((area, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs border-purple-200 text-slate-700">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notable Projects */}
                      {dev.notable_projects && dev.notable_projects.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Notable Projects</p>
                          <ul className="space-y-1">
                            {dev.notable_projects.slice(0, 3).map((project, idx) => (
                              <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                <Sparkles className="w-3 h-3 text-purple-500 mt-1 flex-shrink-0" />
                                <span className="line-clamp-1">{project}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-purple-100">
                        <div>
                          <p className="text-xs text-slate-500">Buildings Tracked</p>
                          <p className="text-lg font-bold text-slate-900">{devBuildings.length}</p>
                        </div>
                        {dev.est_sq_ft_developed && (
                          <div>
                            <p className="text-xs text-slate-500">Developed</p>
                            <p className="text-lg font-bold text-slate-900">{dev.est_sq_ft_developed}</p>
                          </div>
                        )}
                      </div>

                      {/* Locations Active */}
                      {dev.locations_active && dev.locations_active.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <MapPin className="w-3 h-3 text-purple-500" />
                          <span className="line-clamp-1">{dev.locations_active.slice(0, 3).join(", ")}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl">
                        View Buildings ({devBuildings.length})
                      </Button>
                    </div>
                  </div> {/* End of onClick wrapper div */}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
