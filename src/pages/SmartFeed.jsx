
import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PropertyCard from "../components/property/PropertyCard";
import PropertyFilters from "../components/property/PropertyFilters";
import PropertyDetailsModal from "../components/property/PropertyDetailsModal";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Sparkles } from "lucide-react";
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
    expat_mode: false, // Initialize expat_mode filter
  });
  const [selectedProperty, setSelectedProperty] = useState(null);

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
    if (urlParams.get('expat_mode')) newFilters.expat_mode = urlParams.get('expat_mode') === 'true'; // Parse as boolean
    
    setFilters(newFilters);
  }, []);

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.filter({ 
      status: "Active",
      is_duplicate: false  // Exclude duplicate properties
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

      // Budget - Dynamic based on listing type
      if (filters.minPrice || filters.maxPrice) {
        let priceInFilterUnit = property.price;
        
        // Convert property.price to the unit expected by the filter
        if (filters.listingType === "Rent") {
          // Filter is expected to be in Lakhs (e.g., rent of 50k is 0.5 lakhs)
          // Convert property price to lakhs
          priceInFilterUnit = property.price_unit === "crores" ? property.price * 100 : property.price;
        } else if (filters.listingType === "Sale" || filters.listingType === "Pre Leased") {
          // Filter is expected to be in Crores
          // Convert property price to crores
          priceInFilterUnit = property.price_unit === "lakhs" ? property.price / 100 : property.price;
        } else {
          // Default or "all" listingType: treat prices as Lakhs
          priceInFilterUnit = property.price_unit === "crores" ? property.price * 100 : property.price;
        }

        if (filters.minPrice && priceInFilterUnit < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && priceInFilterUnit > parseFloat(filters.maxPrice)) return false;
      }

      return true;
    });

    // BROKERTRUST™ RANKING - Quietly prioritize properties from trusted brokers
    results.sort((a, b) => {
      const trustScoreA = a.broker_trust_score || 50; // Default neutral score
      const trustScoreB = b.broker_trust_score || 50;
      
      // Higher trust score = higher in feed
      if (trustScoreB !== trustScoreA) {
        return trustScoreB - trustScoreA;
      }
      
      // Secondary sort: most recent (descending created_date)
      // Ensure created_date is parsed as a Date object for comparison
      const dateA = new Date(a.created_date);
      const dateB = new Date(b.created_date);
      return dateB.getTime() - dateA.getTime();
    });

    return results;
  }, [properties, filters]);

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
      expat_mode: false, // Reset expat_mode
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
        "item": "https://chariotrealtors.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Properties",
        "item": "https://chariotrealtors.in/properties"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <SEO
        title="SmartFeed | AI-Curated Mumbai Properties | Chariot Realty"
        description="Browse verified properties in Bandra, Juhu, Andheri & more. SmartFeed delivers AI-curated listings with transparent pricing — no bait-and-switch, ever."
        schema={breadcrumbSchema}
        canonical="https://chariotrealtors.in/properties"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-[#FFD300] rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#111111] tracking-tight">SmartFeed</h1>
              <p className="text-sm text-[#3B3B3B] font-light">AI-curated properties • Transparent pricing</p>
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
            Showing <span className="font-bold text-[#111111]">{filteredProperties.length}</span> {filteredProperties.length === 1 ? 'property' : 'properties'}
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
        {!isLoading && filteredProperties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onViewDetails={setSelectedProperty}
              />
            ))}
          </div>
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
      </div>
    </div>
  );
}
