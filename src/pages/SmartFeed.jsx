import React, { useState, useMemo, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PropertyCard from "../components/property/PropertyCard";
import PropertyFilters from "../components/property/PropertyFilters";
import PropertyDetailsModal from "../components/property/PropertyDetailsModal";
import PropertyMatchmaker from "../components/property/PropertyMatchmaker";
import RequirementCard from "../components/property/RequirementCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles, ChevronDown, Zap, RefreshCw, Bell } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SEO from "../components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function SmartFeed() {
  const [filters, setFilters] = useState({
    search: "",
    bhk_multi: [],
    location_multi: [],
    listingType: "all",
    propertyCategory: "all",
    furnishing: "all",
    minPrice: "",
    maxPrice: "",
    expat_mode: false,
    viewMode: "properties",
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [itemsToShow, setItemsToShow] = useState(24);
  const [matchmakerOpen, setMatchmakerOpen] = useState(false);

  // Real-time update state
  const [newItemsCount, setNewItemsCount] = useState({ properties: 0, requirements: 0 });
  const [showNewItemsBanner, setShowNewItemsBanner] = useState(false);
  const previousCountsRef = useRef({ properties: 0, requirements: 0 });
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  const ITEMS_PER_PAGE = 24;
  const REFRESH_INTERVAL = 15000; // 15 seconds

  // Read filters from URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newFilters = { ...filters };
    
    if (urlParams.get('search')) newFilters.search = urlParams.get('search');
    if (urlParams.get('listingType')) newFilters.listingType = urlParams.get('listingType');
    if (urlParams.get('propertyCategory')) newFilters.propertyCategory = urlParams.get('propertyCategory');
    if (urlParams.get('furnishing')) newFilters.furnishing = urlParams.get('furnishing');
    if (urlParams.get('minPrice')) newFilters.minPrice = urlParams.get('minPrice');
    if (urlParams.get('maxPrice')) newFilters.maxPrice = urlParams.get('maxPrice');
    if (urlParams.get('expat_mode')) newFilters.expat_mode = urlParams.get('expat_mode') === 'true';
    if (urlParams.get('viewMode')) newFilters.viewMode = urlParams.get('viewMode');
    
    setFilters(newFilters);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setItemsToShow(ITEMS_PER_PAGE);
  }, [filters]);

  // Fetch properties with auto-refresh
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    initialData: [],
    refetchInterval: REFRESH_INTERVAL, // Auto-refresh every 15 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  // Fetch requirements with auto-refresh
  const { data: requirements, isLoading: requirementsLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    initialData: [],
    refetchInterval: REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
  });

  // Detect new items and show notification
  useEffect(() => {
    if (!isLoading && !requirementsLoading) {
      const currentCounts = {
        properties: properties.filter(p => p.status === "Active" && !p.is_duplicate).length,
        requirements: requirements.filter(r => r.status === "Active").length
      };

      // Only check if we have previous counts (not first load)
      if (previousCountsRef.current.properties > 0 || previousCountsRef.current.requirements > 0) {
        const newProperties = currentCounts.properties - previousCountsRef.current.properties;
        const newRequirements = currentCounts.requirements - previousCountsRef.current.requirements;

        if (newProperties > 0 || newRequirements > 0) {
          setNewItemsCount({ properties: newProperties, requirements: newRequirements });
          setShowNewItemsBanner(true);
          setLastUpdateTime(new Date());

          // Show toast notification
          let message = "";
          if (newProperties > 0 && newRequirements > 0) {
            message = `${newProperties} new ${newProperties === 1 ? 'property' : 'properties'} and ${newRequirements} new ${newRequirements === 1 ? 'requirement' : 'requirements'}`;
          } else if (newProperties > 0) {
            message = `${newProperties} new ${newProperties === 1 ? 'property' : 'properties'}`;
          } else {
            message = `${newRequirements} new ${newRequirements === 1 ? 'requirement' : 'requirements'}`;
          }

          toast.success(`🎉 ${message} available!`, {
            description: 'Scroll to top to see the latest additions',
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setShowNewItemsBanner(false);
              }
            }
          });
        }
      }

      // Update previous counts
      previousCountsRef.current = currentCounts;
    }
  }, [properties, requirements, isLoading, requirementsLoading]);

  const filteredProperties = useMemo(() => {
    let results = properties.filter(property => {
      // Exclude inactive and duplicate properties
      if (property.status !== "Active" || property.is_duplicate === true) {
        return false;
      }

      // Text search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          property.building_name?.toLowerCase().includes(searchLower) ||
          property.location?.toLowerCase().includes(searchLower) ||
          property.location_id?.toLowerCase().includes(searchLower) ||
          property.pocket?.toLowerCase().includes(searchLower) ||
          property.city?.toLowerCase().includes(searchLower) ||
          property.ai_title?.toLowerCase().includes(searchLower) ||
          property.ai_description?.toLowerCase().includes(searchLower) ||
          property.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Multi-select BHK
      if (filters.bhk_multi && filters.bhk_multi.length > 0) {
        if (!filters.bhk_multi.includes(property.bhk)) return false;
      }

      // Multi-select Location
      if (filters.location_multi && filters.location_multi.length > 0) {
        if (!filters.location_multi.includes(property.location)) return false;
      }

      // Property Category
      if (filters.propertyCategory && filters.propertyCategory !== "all") {
        if (property.property_category !== filters.propertyCategory) return false;
      }

      // Listing Type
      if (filters.listingType && filters.listingType !== "all") {
        if (property.listing_type !== filters.listingType) return false;
      }

      // Furnishing
      if (filters.furnishing && filters.furnishing !== "all") {
        if (property.furnishing !== filters.furnishing) return false;
      }

      // Expat Mode filter
      if (filters.expat_mode) {
        if (!property.expat_friendly) return false;
      }

      // Budget filtering with dynamic unit handling
      if (filters.minPrice || filters.maxPrice) {
        const filterUnit = (filters.listingType === 'Sale' || filters.listingType === 'Pre Leased') ? 'crores' : 'lakhs';
        
        let propertyPriceNormalized;
        if (filterUnit === 'crores') {
          propertyPriceNormalized = property.price_unit === "crores" ? property.price : property.price / 100;
        } else {
          propertyPriceNormalized = property.price_unit === "crores" ? property.price * 100 : property.price;
        }

        if (filters.minPrice && propertyPriceNormalized < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && propertyPriceNormalized > parseFloat(filters.maxPrice)) return false;
      }

      return true;
    });

    // BROKERTRUST™ RANKING
    results.sort((a, b) => {
      const trustScoreA = a.broker_trust_score || 50;
      const trustScoreB = b.broker_trust_score || 50;
      
      if (trustScoreB !== trustScoreA) {
        return trustScoreB - trustScoreA;
      }
      
      const dateA = new Date(a.created_date);
      const dateB = new Date(b.created_date);
      return dateB.getTime() - dateA.getTime();
    });

    return results;
  }, [properties, filters]);

  const filteredRequirements = useMemo(() => {
    let results = requirements.filter(requirement => {
      if (requirement.status !== "Active") return false;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          requirement.preferred_locations?.some(loc => loc.toLowerCase().includes(searchLower)) ||
          requirement.bhk_preference?.some(bhk => bhk.toLowerCase().includes(searchLower)) ||
          requirement.client_name?.toLowerCase().includes(searchLower) ||
          requirement.notes?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.bhk_multi && filters.bhk_multi.length > 0) {
        const hasMatchingBhk = requirement.bhk_preference?.some(bhk => 
          filters.bhk_multi.includes(bhk)
        );
        if (!hasMatchingBhk) return false;
      }

      if (filters.location_multi && filters.location_multi.length > 0) {
        const hasMatchingLocation = requirement.preferred_locations?.some(loc =>
          filters.location_multi.includes(loc)
        );
        if (!hasMatchingLocation) return false;
      }

      if (filters.listingType && filters.listingType !== "all") {
        if (requirement.listing_type !== filters.listingType) return false;
      }

      if (filters.furnishing && filters.furnishing !== "all") {
        if (requirement.furnishing_preference !== filters.furnishing && requirement.furnishing_preference !== "Any") return false;
      }

      return true;
    });

    // Sort by urgency and date
    results.sort((a, b) => {
      const urgencyOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const urgencyA = urgencyOrder[a.urgency] || 0;
      const urgencyB = urgencyOrder[b.urgency] || 0;
      
      if (urgencyB !== urgencyA) {
        return urgencyB - urgencyA;
      }
      
      const dateA = new Date(a.created_date);
      const dateB = new Date(b.created_date);
      return dateB.getTime() - dateA.getTime();
    });

    return results;
  }, [requirements, filters]);

  const getDisplayItems = () => {
    if (filters.viewMode === "requirements") {
      return { items: filteredRequirements, type: "requirements", totalCount: filteredRequirements.length };
    } else if (filters.viewMode === "both") {
      const combined = [];
      const maxLength = Math.max(filteredProperties.length, filteredRequirements.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < filteredProperties.length) combined.push({ ...filteredProperties[i], itemType: 'property' });
        if (i < filteredRequirements.length) combined.push({ ...filteredRequirements[i], itemType: 'requirement' });
      }
      return { items: combined, type: "both", totalCount: filteredProperties.length + filteredRequirements.length };
    } else {
      return { items: filteredProperties, type: "properties", totalCount: filteredProperties.length };
    }
  };

  const { items: allItems, type: displayType, totalCount: totalFilteredItems } = getDisplayItems();
  const displayedItems = allItems.slice(0, itemsToShow);
  const hasMore = itemsToShow < allItems.length;

  const loadMore = () => {
    setItemsToShow(prev => Math.min(prev + ITEMS_PER_PAGE, allItems.length));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      bhk_multi: [],
      location_multi: [],
      listingType: "all",
      propertyCategory: "all",
      furnishing: "all",
      minPrice: "",
      maxPrice: "",
      expat_mode: false,
      viewMode: "properties",
    });
  };

  const handleRefresh = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowNewItemsBanner(false);
    setNewItemsCount({ properties: 0, requirements: 0 });
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
        "name": "SmartFeed",
        "item": "https://chariotrealty.com/smartfeed"
      }
    ]
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="SmartFeed | AI-Curated Mumbai Properties & Requirements | Chariot Realty"
        description="Browse AI-curated properties and requirements in Bandra, Juhu, Andheri & more. Transparent pricing — no bait-and-switch, ever."
        schema={breadcrumbSchema}
        canonical="https://chariotrealty.com/smartfeed"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* New Items Banner */}
        <AnimatePresence>
          {showNewItemsBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mb-6"
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-4 shadow-lg border-2 border-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">New Items Available!</p>
                      <p className="text-sm text-white/90">
                        {newItemsCount.properties > 0 && `${newItemsCount.properties} new ${newItemsCount.properties === 1 ? 'property' : 'properties'}`}
                        {newItemsCount.properties > 0 && newItemsCount.requirements > 0 && ' • '}
                        {newItemsCount.requirements > 0 && `${newItemsCount.requirements} new ${newItemsCount.requirements === 1 ? 'requirement' : 'requirements'}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleRefresh}
                    className="bg-white text-green-600 hover:bg-white/90 font-bold"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    View Now
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">SmartFeed</h1>
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-semibold">Live</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-light">Properties & Requirements • AI-matched • Auto-refresh every 15s</p>
              </div>
            </div>
            
            {/* AI Matchmaker Button */}
            <Button
              onClick={() => setMatchmakerOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg hidden md:flex"
              size="lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              AI Matchmaker
            </Button>
          </div>

          {/* AI Matchmaker CTA Banner - Mobile/Tablet */}
          <div className="md:hidden mb-4">
            <div 
              onClick={() => setMatchmakerOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 text-white cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">AI Property Matchmaker</p>
                    <p className="text-xs text-white/80">Find your perfect property in seconds</p>
                  </div>
                </div>
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm border border-purple-200">
            <Button
              onClick={() => setFilters({ ...filters, viewMode: "properties" })}
              variant={filters.viewMode === "properties" ? "default" : "ghost"}
              size="sm"
              className={`rounded-xl ${filters.viewMode === "properties" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "text-slate-600"}`}
            >
              🏠 Properties ({filteredProperties.length})
            </Button>
            <Button
              onClick={() => setFilters({ ...filters, viewMode: "requirements" })}
              variant={filters.viewMode === "requirements" ? "default" : "ghost"}
              size="sm"
              className={`rounded-xl ${filters.viewMode === "requirements" ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white" : "text-slate-600"}`}
            >
              🔍 Requirements ({filteredRequirements.length})
            </Button>
            <Button
              onClick={() => setFilters({ ...filters, viewMode: "both" })}
              variant={filters.viewMode === "both" ? "default" : "ghost"}
              size="sm"
              className={`rounded-xl ${filters.viewMode === "both" ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white" : "text-slate-600"}`}
            >
              ✨ Both
            </Button>
          </div>
        </div>

        {/* Filters */}
        <PropertyFilters
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
          allProperties={properties}
        />

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-[#3B3B3B]">
            Showing <span className="font-bold text-[#111111]">{displayedItems.length}</span> of{' '}
            <span className="font-bold text-[#111111]">{totalFilteredItems}</span>{' '}
            {displayType === "properties" ? "properties" : displayType === "requirements" ? "requirements" : "items"}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load data. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {(isLoading || requirementsLoading) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[22px] p-6 shadow-sm border-2 border-[#F7F7F7]">
                <Skeleton className="h-48 w-full mb-4 rounded-2xl" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Display Items */}
        {!isLoading && !requirementsLoading && displayedItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedItems.map((item) => {
                if (displayType === "both") {
                  return item.itemType === 'property' ? (
                    <PropertyCard
                      key={`prop-${item.id}`}
                      property={item}
                      onViewDetails={setSelectedProperty}
                    />
                  ) : (
                    <RequirementCard
                      key={`req-${item.id}`}
                      requirement={item}
                    />
                  );
                } else if (displayType === "requirements") {
                  return (
                    <RequirementCard
                      key={item.id}
                      requirement={item}
                    />
                  );
                } else {
                  return (
                    <PropertyCard
                      key={item.id}
                      property={item}
                      onViewDetails={setSelectedProperty}
                    />
                  );
                }
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <Button
                  onClick={loadMore}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl px-8 h-14 shadow-lg hover:shadow-xl transition-all"
                >
                  <ChevronDown className="w-5 h-5 mr-2" />
                  Load More {displayType === "properties" ? "Properties" : displayType === "requirements" ? "Requirements" : "Items"}
                  <span className="ml-2 text-xs opacity-80">
                    ({allItems.length - itemsToShow} remaining)
                  </span>
                </Button>
              </div>
            )}

            {/* End of results message */}
            {!hasMore && allItems.length > ITEMS_PER_PAGE && (
              <div className="mt-12 text-center">
                <div className="inline-block bg-white rounded-2xl px-6 py-3 border-2 border-[#F7F7F7]">
                  <p className="text-sm text-[#3B3B3B] font-medium">
                    🎯 You've viewed all {allItems.length} {displayType === "properties" ? "properties" : displayType === "requirements" ? "requirements" : "items"}
                  </p>
                  <p className="text-xs text-[#3B3B3B]/60 mt-1">
                    Try adjusting your filters to see more options
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !requirementsLoading && allItems.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-[#F7F7F7] rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-[#3B3B3B]/10">
              <AlertCircle className="w-10 h-10 text-[#3B3B3B]" />
            </div>
            <h3 className="text-2xl font-bold text-[#111111] mb-3">
              {displayType === "properties" ? "No properties found" : displayType === "requirements" ? "No requirements found" : "No items found"}
            </h3>
            <p className="text-[#3B3B3B] mb-6 font-light">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}

        <PropertyDetailsModal
          property={selectedProperty}
          isOpen={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />

        <PropertyMatchmaker
          isOpen={matchmakerOpen}
          onClose={() => setMatchmakerOpen(false)}
          allProperties={properties}
        />
      </div>
    </div>
  );
}