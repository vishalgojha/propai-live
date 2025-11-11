import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, X, MapPin, Home, Sliders } from "lucide-react";

export default function PropertyFilters({ filters, onFilterChange, onClearFilters, allProperties = [] }) {
  // ⚡ OPTIMIZATION: Memoize unique values extraction
  const uniqueLocations = useMemo(() => {
    return [...new Set(allProperties.map(p => p.location).filter(Boolean))].sort();
  }, [allProperties]);

  const uniqueBhks = useMemo(() => {
    return [...new Set(allProperties.map(p => p.bhk).filter(Boolean))].sort();
  }, [allProperties]);

  const hasActiveFilters = 
    filters.search ||
    (filters.bhk_multi && filters.bhk_multi.length > 0) ||
    (filters.location_multi && filters.location_multi.length > 0) ||
    (filters.listingType && filters.listingType !== "all") ||
    (filters.propertyCategory && filters.propertyCategory !== "all") ||
    (filters.furnishing && filters.furnishing !== "all") ||
    filters.minPrice ||
    filters.maxPrice;

  const toggleBhk = (bhk) => {
    const current = filters.bhk_multi || [];
    if (current.includes(bhk)) {
      onFilterChange({ ...filters, bhk_multi: current.filter(b => b !== bhk) });
    } else {
      onFilterChange({ ...filters, bhk_multi: [...current, bhk] });
    }
  };

  const toggleLocation = (location) => {
    const current = filters.location_multi || [];
    if (current.includes(location)) {
      onFilterChange({ ...filters, location_multi: current.filter(l => l !== location) });
    } else {
      onFilterChange({ ...filters, location_multi: [...current, location] });
    }
  };

  return (
    // ✅ FIXED: Sticky positioning with proper z-index
    <div className="sticky top-[64px] z-30 bg-white/95 backdrop-blur-xl rounded-2xl p-4 md:p-6 mb-6 border border-purple-200 shadow-md">
      <div className="space-y-3 md:space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by location, building, or keywords..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-11 border-purple-200 focus-visible:ring-purple-500 h-11 md:h-12 rounded-2xl"
          />
          {/* ⚡ OPTIMIZATION INDICATOR: Show debouncing hint */}
          {filters.search && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              Searching...
            </span>
          )}
        </div>

        {/* ✅ FIXED: Compact Combo Filter Bar - Type & Area together */}
        <div className="flex flex-wrap gap-2 md:gap-3">
          {/* Type Multi-Select (was BHK) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-200 hover:bg-purple-50 h-10 md:h-11 rounded-xl font-semibold touch-manipulation"
              >
                <Home className="w-4 h-4 text-purple-600 mr-2" />
                Type {filters.bhk_multi && filters.bhk_multi.length > 0 && `(${filters.bhk_multi.length})`}
                <Sliders className="w-3 h-3 text-slate-400 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm mb-3">Select Property Type</h4>
                <div className="flex flex-wrap gap-2">
                  {uniqueBhks.map((bhk) => {
                    const isSelected = filters.bhk_multi?.includes(bhk);
                    return (
                      <Button
                        key={bhk}
                        onClick={() => toggleBhk(bhk)}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`rounded-xl touch-manipulation ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                            : "border-purple-200 hover:bg-purple-50"
                        }`}
                      >
                        {bhk}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Area Multi-Select (was Location) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-200 hover:bg-purple-50 h-10 md:h-11 rounded-xl font-semibold touch-manipulation"
              >
                <MapPin className="w-4 h-4 text-purple-600 mr-2" />
                Area {filters.location_multi && filters.location_multi.length > 0 && `(${filters.location_multi.length})`}
                <Sliders className="w-3 h-3 text-slate-400 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm mb-3">Select Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {uniqueLocations.map((location) => {
                    const isSelected = filters.location_multi?.includes(location);
                    return (
                      <Button
                        key={location}
                        onClick={() => toggleLocation(location)}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`rounded-xl touch-manipulation ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                            : "border-purple-200 hover:bg-purple-50"
                        }`}
                      >
                        {location}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Listing Type Dropdown */}
          <Select
            value={filters.listingType || "all"}
            onValueChange={(value) => onFilterChange({ ...filters, listingType: value })}
          >
            <SelectTrigger className="border-purple-200 h-10 md:h-11 rounded-xl font-semibold w-auto min-w-[120px]">
              <SelectValue placeholder="Listing Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Rent">Rent</SelectItem>
              <SelectItem value="Sale">Sale</SelectItem>
              <SelectItem value="Lease">Lease</SelectItem>
              <SelectItem value="Pre Leased">Pre Leased</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Dropdown */}
          <Select
            value={filters.propertyCategory || "all"}
            onValueChange={(value) => onFilterChange({ ...filters, propertyCategory: value })}
          >
            <SelectTrigger className="border-purple-200 h-10 md:h-11 rounded-xl font-semibold w-auto min-w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>

          {/* Furnishing Dropdown */}
          <Select
            value={filters.furnishing || "all"}
            onValueChange={(value) => onFilterChange({ ...filters, furnishing: value })}
          >
            <SelectTrigger className="border-purple-200 h-10 md:h-11 rounded-xl font-semibold w-auto min-w-[140px]">
              <SelectValue placeholder="Furnishing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Furnishing</SelectItem>
              <SelectItem value="Unfurnished">Unfurnished</SelectItem>
              <SelectItem value="Semi-Furnished">Semi-Furnished</SelectItem>
              <SelectItem value="Fully Furnished">Fully Furnished</SelectItem>
              <SelectItem value="Bare Shell">Bare Shell</SelectItem>
              <SelectItem value="Warm Shell">Warm Shell</SelectItem>
            </SelectContent>
          </Select>

          {/* Budget Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-200 hover:bg-purple-50 h-10 md:h-11 rounded-xl font-semibold touch-manipulation"
              >
                💰 Budget
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Price Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ""}
                    onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
                    className="border-purple-200"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ""}
                    onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
                    className="border-purple-200"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {filters.listingType === 'Sale' || filters.listingType === 'Pre Leased' ? '(in Crores)' : '(in Lakhs)'}
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-purple-100">
            <span className="text-xs text-slate-600 font-semibold">Active:</span>
            {filters.listingType && filters.listingType !== "all" && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1 text-xs">
                {filters.listingType}
                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => onFilterChange({ ...filters, listingType: "all" })} />
              </Badge>
            )}
            {filters.bhk_multi && filters.bhk_multi.map(bhk => (
              <Badge key={bhk} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1 text-xs">
                {bhk}
                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => toggleBhk(bhk)} />
              </Badge>
            ))}
            {filters.location_multi && filters.location_multi.map(loc => (
              <Badge key={loc} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1 text-xs">
                {loc}
                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => toggleLocation(loc)} />
              </Badge>
            ))}
            {(filters.minPrice || filters.maxPrice) && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1 text-xs">
                ₹{filters.minPrice || "0"}{filters.listingType === 'Sale' || filters.listingType === 'Pre Leased' ? 'Cr' : 'L'} - ₹{filters.maxPrice || "∞"}{filters.listingType === 'Sale' || filters.listingType === 'Pre Leased' ? 'Cr' : 'L'}
                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => onFilterChange({ ...filters, minPrice: "", maxPrice: "" })} />
              </Badge>
            )}
            {filters.furnishing && filters.furnishing !== "all" && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1 text-xs">
                {filters.furnishing}
                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => onFilterChange({ ...filters, furnishing: "all" })} />
              </Badge>
            )}
            {filters.propertyCategory && filters.propertyCategory !== "all" && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1 text-xs">
                {filters.propertyCategory}
                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => onFilterChange({ ...filters, propertyCategory: "all" })} />
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1 text-xs">
                Search: "{filters.search.substring(0, 20)}{filters.search.length > 20 ? '...' : ''}"
                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => onFilterChange({ ...filters, search: "" })} />
              </Badge>
            )}

            <Button
              onClick={onClearFilters}
              variant="ghost"
              size="sm"
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 touch-manipulation"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}