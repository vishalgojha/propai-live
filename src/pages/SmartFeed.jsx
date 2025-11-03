
import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PropertyCard from "../components/property/PropertyCard";
import PropertyFilters from "../components/property/PropertyFilters";
import PropertyDetailsModal from "../components/property/PropertyDetailsModal";
import PropertyMatchmaker from "../components/property/PropertyMatchmaker";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles, ChevronDown, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SEO from "../components/SEO";

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
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [itemsToShow, setItemsToShow] = useState(24); // Pagination state
  const [matchmakerOpen, setMatchmakerOpen] = useState(false);

  const ITEMS_PER_PAGE = 24;

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
    
    setFilters(newFilters);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setItemsToShow(ITEMS_PER_PAGE);
  }, [filters]);

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.filter({ 
      status: "Active",
      is_duplicate: false
    }, "-created_date"),
    initialData: [],
  });

  const filteredProperties = useMemo(() => {
    let results = properties.filter(property => {
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

  // Paginated properties to display
  const displayedProperties = filteredProperties.slice(0, itemsToShow);
  const hasMore = itemsToShow < filteredProperties.length;

  const loadMore = () => {
    setItemsToShow(prev => prev + ITEMS_PER_PAGE);
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
    });
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
        "name": "Properties",
        "item": "https://chariotrealty.com/properties"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <SEO
        title="Browse Properties | AI-Curated Mumbai Listings | Chariot Realty"
        description="Browse verified properties in Bandra, Juhu, Andheri & more. AI-curated listings with transparent pricing — no bait-and-switch, ever."
        schema={breadcrumbSchema}
        canonical="https://chariotrealty.com/properties"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FFD300] rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Browse Properties</h1>
                <p className="text-sm text-[#3B3B3B] font-light">AI-curated listings • Transparent pricing</p>
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
            Showing <span className="font-bold text-[#111111]">{displayedProperties.length}</span> of{' '}
            <span className="font-bold text-[#111111]">{filteredProperties.length}</span>{' '}
            {filteredProperties.length === 1 ? 'property' : 'properties'}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load properties. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
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

        {/* Properties Grid */}
        {!isLoading && displayedProperties.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={setSelectedProperty}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <Button
                  onClick={loadMore}
                  size="lg"
                  className="bg-gradient-to-r from-[#FFD300] to-[#FFC700] hover:from-[#FFC700] hover:to-[#FFB000] text-black font-bold rounded-2xl px-8 h-14 shadow-lg hover:shadow-xl transition-all"
                >
                  <ChevronDown className="w-5 h-5 mr-2" />
                  Load More Properties
                  <span className="ml-2 text-xs opacity-80">
                    ({filteredProperties.length - itemsToShow} remaining)
                  </span>
                </Button>
              </div>
            )}

            {/* End of results message */}
            {!hasMore && filteredProperties.length > ITEMS_PER_PAGE && (
              <div className="mt-12 text-center">
                <div className="inline-block bg-white rounded-2xl px-6 py-3 border-2 border-[#F7F7F7]">
                  <p className="text-sm text-[#3B3B3B] font-medium">
                    🎯 You've viewed all {filteredProperties.length} properties
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
        {!isLoading && filteredProperties.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-[#F7F7F7] rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-[#3B3B3B]/10">
              <AlertCircle className="w-10 h-10 text-[#3B3B3B]" />
            </div>
            <h3 className="text-2xl font-bold text-[#111111] mb-3">No properties found</h3>
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

        {/* AI Matchmaker Modal */}
        <PropertyMatchmaker
          isOpen={matchmakerOpen}
          onClose={() => setMatchmakerOpen(false)}
          allProperties={properties}
        />
      </div>
    </div>
  );
}
