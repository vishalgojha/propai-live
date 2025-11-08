import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, MapPin, TrendingUp, Package, Search, ChevronDown, Users, Star
} from "lucide-react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

// 🚀 PERFORMANCE OPTIMIZATION: Debounce hook
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Buildings() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [itemsToShow, setItemsToShow] = useState(24);
  const [user, setUser] = useState(null);

  // 🚀 OPTIMIZATION: Debounce search
  const debouncedSearch = useDebounce(searchQuery, 400);

  const ITEMS_PER_PAGE = 24;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  // 🚀 CRITICAL OPTIMIZATION: Aggressive caching for buildings
  // 📊 BASE44 INDEXING NEEDED: location, name, total_listings, active_listings, verified
  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-total_listings'),
    initialData: [],
    staleTime: 60000, // 🚀 Buildings change less frequently - 1 min stale time
    cacheTime: 600000, // 🚀 Cache for 10 mins
    refetchOnWindowFocus: false, // 🚀 Don't refetch on window focus (reduces load)
  });

  // 🚀 OPTIMIZATION: Cache property count query separately
  // 📊 BASE44 INDEXING NEEDED: status, is_duplicate
  const { data: properties = [] } = useQuery({
    queryKey: ['properties-count'],
    queryFn: () => base44.entities.Property.list(),
    initialData: [],
    staleTime: 60000, // 🚀 1 min stale time
    cacheTime: 600000, // 🚀 10 min cache
    select: (data) => data.filter(p => p.status === 'Active' && !p.is_duplicate), // 🚀 Filter in select to cache filtered result
  });

  const uniqueLocations = useMemo(() => {
    const locations = new Set(buildings.map(b => b.location).filter(Boolean));
    return Array.from(locations).sort();
  }, [buildings]);

  // 🚀 OPTIMIZATION: Use debounced search in filtering
  const filteredBuildings = useMemo(() => {
    return buildings.filter(building => {
      // 🚀 Use debounced search value
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = 
          building.name?.toLowerCase().includes(searchLower) ||
          building.location?.toLowerCase().includes(searchLower) ||
          building.pocket?.toLowerCase().includes(searchLower) ||
          building.developer_name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (selectedLocation !== "all" && building.location !== selectedLocation) {
        return false;
      }

      return true;
    });
  }, [buildings, debouncedSearch, selectedLocation]);

  const displayedBuildings = filteredBuildings.slice(0, itemsToShow);
  const hasMore = itemsToShow < filteredBuildings.length;

  const loadMore = () => {
    setItemsToShow(prev => Math.min(prev + ITEMS_PER_PAGE, filteredBuildings.length));
  };

  const stats = {
    total: buildings.length,
    verified: buildings.filter(b => b.verified).length,
    withListings: buildings.filter(b => (b.active_listings || 0) > 0).length,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
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
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <SEO
        title="Mumbai Buildings Directory | Building Intelligence | PropAI Live"
        description="Browse comprehensive building profiles with pricing data, amenities, and market insights. AI-powered building intelligence for Mumbai real estate."
        schema={breadcrumbSchema}
        canonical="https://propai.live/buildings"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">Building Intelligence</h1>
              <p className="text-sm text-slate-600 font-light">Deep insights into Mumbai's buildings</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Buildings Mapped</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-green-600" fill="currentColor" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.verified}</p>
                <p className="text-xs text-slate-500">Verified</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.withListings}</p>
                <p className="text-xs text-slate-500">With Active Listings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-purple-200 mb-8">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search buildings, locations, developers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 border-purple-200 focus-visible:ring-purple-500 h-12 rounded-xl"
              />
            </div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="h-12 px-4 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          
          {/* 🚀 Show search indicator */}
          <div className="mt-2 flex items-center justify-between text-sm">
            <p className="text-slate-500">
              {filteredBuildings.length} building{filteredBuildings.length !== 1 ? 's' : ''} found
            </p>
            {searchQuery !== debouncedSearch && (
              <p className="text-purple-600 text-xs">🔍 Searching...</p>
            )}
          </div>
        </div>

        {/* Buildings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-purple-200">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-6" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredBuildings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-purple-200">
              <Building2 className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No buildings found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedBuildings.map((building) => (
                <motion.div
                  key={building.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-purple-200 hover:border-purple-400 cursor-pointer"
                  onClick={() => navigate(createPageUrl("BuildingProfile") + `?id=${building.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight line-clamp-2">
                          {building.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                          <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <span className="line-clamp-1">{building.location}</span>
                        </div>
                      </div>
                      {building.verified && (
                        <Badge className="bg-green-500 text-white border-0 flex-shrink-0">
                          <Star className="w-3 h-3 mr-1" fill="currentColor" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {building.building_type && (
                      <Badge variant="outline" className="mb-4">
                        {building.building_type}
                      </Badge>
                    )}

                    {building.tags && building.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {building.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-purple-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-purple-600">{building.active_listings || 0}</p>
                        <p className="text-xs text-slate-500">Active</p>
                      </div>
                      <div className="bg-sky-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-sky-600">{building.total_listings || 0}</p>
                        <p className="text-xs text-slate-500">Total</p>
                      </div>
                    </div>

                    {(building.avg_rent_2bhk || building.avg_sale_2bhk) && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-3 mb-4">
                        <p className="text-xs text-slate-500 mb-1">Avg 2 BHK Price</p>
                        <p className="font-bold text-slate-900">
                          {building.avg_rent_2bhk 
                            ? `₹${building.avg_rent_2bhk}L/mo` 
                            : building.avg_sale_2bhk 
                              ? `₹${building.avg_sale_2bhk}L`
                              : 'N/A'}
                        </p>
                      </div>
                    )}

                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl">
                      View Building Profile
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <Button
                  onClick={loadMore}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-2xl px-8 h-14 shadow-lg"
                >
                  <ChevronDown className="w-5 h-5 mr-2" />
                  Load More Buildings
                  <span className="ml-2 text-xs opacity-80">
                    ({filteredBuildings.length - itemsToShow} remaining)
                  </span>
                </Button>
              </div>
            )}

            {!hasMore && filteredBuildings.length > ITEMS_PER_PAGE && (
              <div className="mt-12 text-center">
                <div className="inline-block bg-white rounded-2xl px-6 py-3 border-2 border-purple-200">
                  <p className="text-sm text-slate-600 font-medium">
                    🎯 You've viewed all {filteredBuildings.length} buildings
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}