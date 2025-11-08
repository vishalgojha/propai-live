
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
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-purple-200">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by location, building, or keywords..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-11 border-purple-200 focus-visible:ring-purple-500 h-12 rounded-2xl"
          />
          {/* ⚡ OPTIMIZATION INDICATOR: Show debouncing hint */}
          {filters.search && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              Searching...
            </span>
          )}
        </div>

        {/* Multi-Select Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BHK Multi-Select */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between border-purple-200 hover:bg-purple-50 h-12 rounded-2xl font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-purple-600" />
                  BHK {filters.bhk_multi && filters.bhk_multi.length > 0 && `(${filters.bhk_multi.length})`}
                </span>
                <Sliders className="w-4 h-4 text-slate-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm mb-3">Select BHK Types</h4>
                <div className="flex flex-wrap gap-2">
                  {uniqueBhks.map((bhk) => {
                    const isSelected = filters.bhk_multi?.includes(bhk);
                    return (
                      <Button
                        key={bhk}
                        onClick={() => toggleBhk(bhk)}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`rounded-xl ${
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

          {/* Location Multi-Select */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between border-purple-200 hover:bg-purple-50 h-12 rounded-2xl font-semibold"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  Location {filters.location_multi && filters.location_multi.length > 0 && `(${filters.location_multi.length})`}
                </span>
                <Sliders className="w-4 h-4 text-slate-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm mb-3">Select Locations</h4>
                <div className="flex flex-wrap gap-2">
                  {uniqueLocations.map((location) => {
                    const isSelected = filters.location_multi?.includes(location);
                    return (
                      <Button
                        key={location}
                        onClick={() => toggleLocation(location)}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`rounded-xl ${
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
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Select
            value={filters.listingType || "all"}
            onValueChange={(value) => onFilterChange({ ...filters, listingType: value })}
          >
            <SelectTrigger className="border-purple-200 h-12 rounded-2xl font-semibold">
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

          <Select
            value={filters.propertyCategory || "all"}
            onValueChange={(value) => onFilterChange({ ...filters, propertyCategory: value })}
          >
            <SelectTrigger className="border-purple-200 h-12 rounded-2xl font-semibold">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.furnishing || "all"}
            onValueChange={(value) => onFilterChange({ ...filters, furnishing: value })}
          >
            <SelectTrigger className="border-purple-200 h-12 rounded-2xl font-semibold">
              <SelectValue placeholder="Furnishing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Furnishing</SelectItem>
              <SelectItem value="Unfurnished">Unfurnished</SelectItem>
              <SelectItem value="Semi-Furnished">Semi-Furnished</SelectItem>
              <SelectItem value="Fully Furnished">Fully Furnished</SelectItem>
              <SelectItem value="Bare Shell">Bare Shell</SelectItem> {/* Added from previous implementation */}
              <SelectItem value="Warm Shell">Warm Shell</SelectItem> {/* Added from previous implementation */}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="border-purple-200 hover:bg-purple-50 h-12 rounded-2xl font-semibold"
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
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-xs text-slate-600 font-semibold">Active filters:</span>
            {filters.listingType && filters.listingType !== "all" && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1">
                {filters.listingType}
                <X className="w-3 h-3 cursor-pointer" onClick={() => onFilterChange({ ...filters, listingType: "all" })} />
              </Badge>
            )}
            {filters.bhk_multi && filters.bhk_multi.map(bhk => (
              <Badge key={bhk} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1">
                {bhk}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleBhk(bhk)} />
              </Badge>
            ))}
            {filters.location_multi && filters.location_multi.map(loc => (
              <Badge key={loc} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1">
                {loc}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleLocation(loc)} />
              </Badge>
            ))}
            {(filters.minPrice || filters.maxPrice) && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1">
                ₹{filters.minPrice || "0"}{filters.listingType === 'Sale' || filters.listingType === 'Pre Leased' ? 'Cr' : 'Lakhs'} - ₹{filters.maxPrice || "∞"}{filters.listingType === 'Sale' || filters.listingType === 'Pre Leased' ? 'Cr' : 'Lakhs'}
                <X className="w-3 h-3 cursor-pointer" onClick={() => onFilterChange({ ...filters, minPrice: "", maxPrice: "" })} />
              </Badge>
            )}
            {filters.furnishing && filters.furnishing !== "all" && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1">
                {filters.furnishing}
                <X className="w-3 h-3 cursor-pointer" onClick={() => onFilterChange({ ...filters, furnishing: "all" })} />
              </Badge>
            )}
            {filters.propertyCategory && filters.propertyCategory !== "all" && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1">
                {filters.propertyCategory}
                <X className="w-3 h-3 cursor-pointer" onClick={() => onFilterChange({ ...filters, propertyCategory: "all" })} />
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1">
                Search: "{filters.search}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => onFilterChange({ ...filters, search: "" })} />
              </Badge>
            )}

            <Button
              onClick={onClearFilters}
              variant="ghost"
              size="sm"
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
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
