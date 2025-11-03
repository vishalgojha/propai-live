
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, Search, MapPin, Star, TrendingUp,
  Home, Users, AlertCircle, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

export default function Buildings() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  // FIXED: Remove verified filter to show all buildings
  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-total_listings'),
    initialData: [],
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.filter({ status: "Active" }),
    initialData: [],
  });

  // Get unique locations
  const locations = [...new Set(buildings.map(b => b.location).filter(Boolean))];

  // Filter buildings
  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = !searchQuery || 
      building.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.pocket?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.developer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = locationFilter === "all" || building.location === locationFilter;
    
    return matchesSearch && matchesLocation;
  });

  const handleBuildingClick = (building) => {
    navigate(createPageUrl("BuildingProfile") + `?id=${building.id}`);
  };

  const formatPrice = (price, unit) => {
    if (!price) return "N/A";
    return unit === "crores" ? `₹${price} Cr` : `₹${price}L`;
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://chariotrealty.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Buildings",
        "item": "https://chariotrealty.com/buildings"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <SEO
        title="Mumbai Buildings Directory | Street-Level Intelligence"
        description="Explore verified buildings in Mumbai — from Pali Hill to Carter Road. Building-level insights: pricing, amenities, broker references & street intelligence."
        schema={breadcrumbSchema}
        canonical="https://chariotrealty.com/buildings"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">Mumbai Buildings</h1>
              <p className="text-sm text-slate-600 font-light">Street-level property intelligence</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-purple-200/50">
            <p className="text-xs text-slate-600 mb-1">Total Buildings</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{buildings.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-purple-200/50">
            <p className="text-xs text-slate-600 mb-1">Verified</p>
            <p className="text-2xl font-bold text-green-600">{buildings.filter(b => b.verified).length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-purple-200/50">
            <p className="text-xs text-slate-600 mb-1">Total Listings</p>
            <p className="text-2xl font-bold text-purple-600">{buildings.reduce((sum, b) => sum + (b.total_listings || 0), 0)}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-purple-200/50">
            <p className="text-xs text-slate-600 mb-1">Active Listings</p>
            <p className="text-2xl font-bold text-indigo-600">{buildings.reduce((sum, b) => sum + (b.active_listings || 0), 0)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-purple-200/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search buildings, developers, or areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 border-purple-200 focus-visible:ring-purple-500"
              />
            </div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-11 rounded-xl border border-purple-200 px-4 font-semibold focus:ring-purple-500"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredBuildings.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-[#F7F7F7]">
            <Building2 className="w-12 h-12 text-[#3B3B3B] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#111111] mb-2">No buildings found</h3>
            <p className="text-[#3B3B3B]">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Buildings Grid */}
        {!isLoading && filteredBuildings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBuildings.map((building) => (
              <motion.div
                key={building.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleBuildingClick(building)}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-purple-200/50 hover:border-purple-400 cursor-pointer group"
              >
                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {building.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-purple-500" />
                        <span>{building.location}</span>
                        {building.pocket && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="text-xs">{building.pocket}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {building.verified && (
                        <Badge className="bg-green-500/20 text-green-700 border-green-500 text-xs">
                          Verified
                        </Badge>
                      )}
                      {!building.verified && (
                        <Badge className="bg-purple-500/20 text-purple-700 border-purple-500 text-xs">
                          Auto
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Building Type & Developer */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {building.building_type && (
                      <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                        {building.building_type}
                      </Badge>
                    )}
                    {building.management_quality && building.management_quality !== "Unknown" && (
                      <Badge className="bg-purple-500/20 text-purple-700 border-purple-500 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        {building.management_quality}
                      </Badge>
                    )}
                  </div>

                  {/* Tags */}
                  {building.tags && building.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {building.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50">
                          {tag}
                        </Badge>
                      ))}
                      {building.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{building.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-purple-50/60 rounded-2xl">
                    <div className="text-center">
                      <p className="text-xs text-slate-600 mb-1">Active Listings</p>
                      <p className="text-sm font-bold text-purple-800">{building.active_listings || 0}</p>
                    </div>
                    {building.year_built && (
                      <div className="text-center">
                        <p className="text-xs text-slate-600 mb-1">Built</p>
                        <p className="text-sm font-bold text-purple-800">{building.year_built}</p>
                      </div>
                    )}
                  </div>

                  {/* Price Range */}
                  {(building.avg_rent_2bhk || building.avg_sale_2bhk) && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200/50">
                      <p className="text-xs text-slate-600 mb-2 font-semibold">Average Pricing:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {building.avg_rent_2bhk && (
                          <div>
                            <p className="text-slate-500">2 BHK Rent</p>
                            <p className="font-bold text-purple-800">₹{building.avg_rent_2bhk}L</p>
                          </div>
                        )}
                        {building.avg_sale_2bhk && (
                          <div>
                            <p className="text-slate-500">2 BHK Sale</p>
                            <p className="font-bold text-purple-800">₹{building.avg_sale_2bhk} Cr</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
