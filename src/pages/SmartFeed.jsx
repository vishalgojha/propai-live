
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
      // Search filter - UPDATED to use new location hierarchy
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

      // BHK filter
      if (filters.bhk && filters.bhk !== "all") {
        if (property.bhk !== filters.bhk) return false;
      }

      // Listing type filter
      if (filters.listingType && filters.listingType !== "all") {
        if (property.listing_type !== filters.listingType) return false;
      }

      // Furnishing filter
      if (filters.furnishing && filters.furnishing !== "all") {
        if (property.furnishing !== filters.furnishing) return false;
      }

      // Price range filter (convert to lakhs for comparison)
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
      furnishing: "all",
      minPrice: "",
      maxPrice: ""
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/20 to-teal-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">SmartFeed</h1>
              <p className="text-sm text-slate-600">AI-curated properties • Transparent pricing</p>
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
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredProperties.length}</span> {filteredProperties.length === 1 ? 'property' : 'properties'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <Skeleton className="h-44 w-full mb-4 rounded-xl" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Properties Grid */}
        {!isLoading && filteredProperties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No properties found</h3>
            <p className="text-slate-600 mb-6">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}

        {/* Property Details Modal */}
        <PropertyDetailsModal
          property={selectedProperty}
          isOpen={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      </div>
    </div>
  );
}
