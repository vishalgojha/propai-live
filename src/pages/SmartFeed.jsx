
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PropertyCard from "../components/property/PropertyCard";
import PropertyFilters from "../components/property/PropertyFilters";
import PropertyDetailsModal from "../components/property/PropertyDetailsModal";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SmartFeed() {
  const [filters, setFilters] = useState({
    search: "",
    bhk: "all",
    listingType: "all",
    propertyCategory: "all", // Added propertyCategory filter
    furnishing: "all",
    minPrice: "",
    maxPrice: ""
  });
  const [selectedProperty, setSelectedProperty] = useState(null);

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.filter({ status: "Active" }, "-created_date"),
    initialData: [],
  });

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          property.building_name?.toLowerCase().includes(searchLower) ||
          property.location?.toLowerCase().includes(searchLower) ||
          property.location_id?.toLowerCase().includes(searchLower) ||
          property.pocket?.toLowerCase().includes(searchLower) ||
          property.city?.toLowerCase().includes(searchLower) ||
          property.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // New filter condition for propertyCategory
      if (filters.propertyCategory && filters.propertyCategory !== "all") {
        if (property.property_category !== filters.propertyCategory) return false;
      }

      if (filters.bhk && filters.bhk !== "all") {
        if (property.bhk !== filters.bhk) return false;
      }

      if (filters.listingType && filters.listingType !== "all") {
        if (property.listing_type !== filters.listingType) return false;
      }

      if (filters.furnishing && filters.furnishing !== "all") {
        if (property.furnishing !== filters.furnishing) return false;
      }

      if (filters.minPrice || filters.maxPrice) {
        const priceInLakhs = property.price_unit === "crores" 
          ? property.price * 100 
          : property.price;

        if (filters.minPrice && priceInLakhs < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && priceInLakhs > parseFloat(filters.maxPrice)) return false;
      }

      return true;
    });
  }, [properties, filters]);

  const clearFilters = () => {
    setFilters({
      search: "",
      bhk: "all",
      listingType: "all",
      propertyCategory: "all", // Added propertyCategory to clearFilters
      furnishing: "all",
      minPrice: "",
      maxPrice: ""
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
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
