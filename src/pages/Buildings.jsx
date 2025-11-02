
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

  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.filter({ verified: true }, '-total_listings'),
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

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <SEO
        title="Mumbai Buildings Directory | Street-Level Intelligence"
        description="Explore verified buildings in Mumbai — from Pali Hill to Carter Road. Building-level insights: pricing, amenities, broker references & street intelligence."
        canonical="https://chariotrealtors.in/buildings"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-2xl flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6 text-[#1a1816]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Mumbai Buildings</h1>
              <p className="text-sm text-[#3B3B3B] font-light">Street-level property intelligence</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Total Buildings</p>
            <p className="text-2xl font-bold text-[#111111]">{buildings.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Verified</p>
            <p className="text-2xl font-bold text-green-600">{buildings.filter(b => b.verified).length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Total Listings</p>
            <p className="text-2xl font-bold text-[#111111]">
              {buildings.reduce((sum, b) => sum + (b.total_listings || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Active Listings</p>
            <p className="text-2xl font-bold text-blue-600">
              {buildings.reduce((sum, b) => sum + (b.active_listings || 0), 0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-[#F7F7F7]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3B3B3B]" />
              <Input
                placeholder="Search buildings, developers, or areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11"
              />
            </div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-11 rounded-xl border border-[#3B3B3B]/20 px-4 font-semibold"
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
                className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-stone-200/50 cursor-pointer group"
              >
                {/* Image Section */}
                {building.images && building.images.length > 0 ? (
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={building.images[0]}
                      alt={building.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-stone-400" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[#111111] mb-2 line-clamp-2">
                        {building.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-stone-600 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-500" />
                        <span>{building.location}</span>
                        {building.pocket && (
                          <>
                            <span className="text-stone-400">•</span>
                            <span className="text-xs">{building.pocket}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {building.verified && (
                      <Badge className="bg-green-500/20 text-green-700 border-green-500 text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Building Type & Developer */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {building.building_type && (
                      <Badge variant="outline" className="text-xs border-stone-300 text-stone-700 bg-white">
                        {building.building_type}
                      </Badge>
                    )}
                    {building.management_quality && building.management_quality !== "Unknown" && (
                      <Badge className="bg-amber-500/20 text-amber-700 border-amber-500 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        {building.management_quality}
                      </Badge>
                    )}
                  </div>

                  {/* Tags */}
                  {building.tags && building.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {building.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
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
                  <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-white/60 rounded-2xl">
                    <div className="text-center">
                      <p className="text-xs text-stone-500 mb-1">Listings</p>
                      <p className="text-sm font-bold text-[#111111]">{building.active_listings || 0}</p>
                    </div>
                    {building.total_floors && (
                      <div className="text-center">
                        <p className="text-xs text-stone-500 mb-1">Floors</p>
                        <p className="text-sm font-bold text-[#111111]">{building.total_floors}</p>
                      </div>
                    )}
                    {building.year_built && (
                      <div className="text-center">
                        <p className="text-xs text-stone-500 mb-1">Built</p>
                        <p className="text-sm font-bold text-[#111111]">{building.year_built}</p>
                      </div>
                    )}
                  </div>

                  {/* Price Range */}
                  {(building.avg_rent_2bhk || building.avg_sale_2bhk) && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200/50">
                      <p className="text-xs text-stone-600 mb-2 font-semibold">Average Pricing:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {building.avg_rent_2bhk && (
                          <div>
                            <p className="text-stone-500">2 BHK Rent</p>
                            <p className="font-bold text-[#111111]">₹{building.avg_rent_2bhk}L</p>
                          </div>
                        )}
                        {building.avg_sale_2bhk && (
                          <div>
                            <p className="text-stone-500">2 BHK Sale</p>
                            <p className="font-bold text-[#111111]">₹{building.avg_sale_2bhk} Cr</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#c9a532] hover:to-[#e8c43a] text-[#1a1816] font-bold rounded-2xl shadow-sm"
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
