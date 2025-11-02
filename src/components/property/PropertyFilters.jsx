import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function PropertyFilters({ filters, onFilterChange, onClearFilters }) {
  const bhkOptions = ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK"];

  const hasActiveFilters = filters.bhk || filters.minPrice || filters.maxPrice || 
    filters.furnishing || filters.listingType !== "all" || filters.search;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-slate-500 hover:text-slate-900"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search location, building..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Listing Type */}
        <Select
          value={filters.listingType || "all"}
          onValueChange={(value) => onFilterChange({ ...filters, listingType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Sale">For Sale</SelectItem>
            <SelectItem value="Rent">For Rent</SelectItem>
            <SelectItem value="Lease">For Lease</SelectItem>
          </SelectContent>
        </Select>

        {/* BHK */}
        <Select
          value={filters.bhk || "all"}
          onValueChange={(value) => onFilterChange({ ...filters, bhk: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="BHK" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All BHK</SelectItem>
            {bhkOptions.map(bhk => (
              <SelectItem key={bhk} value={bhk}>{bhk}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Furnishing */}
        <Select
          value={filters.furnishing || "all"}
          onValueChange={(value) => onFilterChange({ ...filters, furnishing: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Furnishing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Unfurnished">Unfurnished</SelectItem>
            <SelectItem value="Semi-Furnished">Semi-Furnished</SelectItem>
            <SelectItem value="Fully Furnished">Fully Furnished</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Budget Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min Price (Lakhs)"
            value={filters.minPrice || ""}
            onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Max Price (Lakhs)"
            value={filters.maxPrice || ""}
            onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          {filters.bhk && filters.bhk !== "all" && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {filters.bhk}
            </Badge>
          )}
          {filters.furnishing && filters.furnishing !== "all" && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {filters.furnishing}
            </Badge>
          )}
          {filters.listingType && filters.listingType !== "all" && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {filters.listingType}
            </Badge>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              ₹{filters.minPrice || "0"}L - ₹{filters.maxPrice || "∞"}L
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}