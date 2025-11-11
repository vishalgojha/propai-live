import React, { useMemo, useState, useRef, useEffect } from "react";
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
import { Search, X, MapPin, Home, Sliders } from "lucide-react";

export default function PropertyFilters({ filters, onFilterChange, onClearFilters, allProperties = [] }) {
  const [bhkSearchQuery, setBhkSearchQuery] = useState("");
  const [areaSearchQuery, setAreaSearchQuery] = useState("");
  const [showBhkSuggestions, setShowBhkSuggestions] = useState(false);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  
  const bhkInputRef = useRef(null);
  const areaInputRef = useRef(null);

  // ⚡ OPTIMIZATION: Memoize unique values extraction
  const uniqueLocations = useMemo(() => {
    return [...new Set(allProperties.map(p => p.location).filter(Boolean))].sort();
  }, [allProperties]);

  const uniqueBhks = useMemo(() => {
    return [...new Set(allProperties.map(p => p.bhk).filter(Boolean))].sort();
  }, [allProperties]);

  // Filter suggestions based on search query
  const filteredBhkSuggestions = useMemo(() => {
    if (!bhkSearchQuery) return uniqueBhks.slice(0, 10);
    return uniqueBhks.filter(bhk => 
      bhk.toLowerCase().includes(bhkSearchQuery.toLowerCase())
    ).slice(0, 10);
  }, [bhkSearchQuery, uniqueBhks]);

  const filteredAreaSuggestions = useMemo(() => {
    if (!areaSearchQuery) return uniqueLocations.slice(0, 10);
    return uniqueLocations.filter(loc => 
      loc.toLowerCase().includes(areaSearchQuery.toLowerCase())
    ).slice(0, 10);
  }, [areaSearchQuery, uniqueLocations]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bhkInputRef.current && !bhkInputRef.current.contains(event.target)) {
        setShowBhkSuggestions(false);
      }
      if (areaInputRef.current && !areaInputRef.current.contains(event.target)) {
        setShowAreaSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setBhkSearchQuery("");
  };

  const toggleLocation = (location) => {
    const current = filters.location_multi || [];
    if (current.includes(location)) {
      onFilterChange({ ...filters, location_multi: current.filter(l => l !== location) });
    } else {
      onFilterChange({ ...filters, location_multi: [...current, location] });
    }
    setAreaSearchQuery("");
  };

  const removeBhk = (bhk) => {
    const current = filters.bhk_multi || [];
    onFilterChange({ ...filters, bhk_multi: current.filter(b => b !== bhk) });
  };

  const removeLocation = (location) => {
    const current = filters.location_multi || [];
    onFilterChange({ ...filters, location_multi: current.filter(l => l !== location) });
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
        </div>

        {/* ✅ NEW: Searchable Type & Area Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Searchable Type (BHK) Input */}
          <div className="relative" ref={bhkInputRef}>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600 z-10" />
              <Input
                placeholder="Search property type (2 BHK, 3 BHK, Office...)"
                value={bhkSearchQuery}
                onChange={(e) => {
                  setBhkSearchQuery(e.target.value);
                  setShowBhkSuggestions(true);
                }}
                onFocus={() => setShowBhkSuggestions(true)}
                className="pl-10 border-purple-200 focus-visible:ring-purple-500 h-11 rounded-xl"
              />
            </div>

            {/* BHK Suggestions Dropdown */}
            {showBhkSuggestions && filteredBhkSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-50">
                {filteredBhkSuggestions.map((bhk) => {
                  const isSelected = filters.bhk_multi?.includes(bhk);
                  return (
                    <button
                      key={bhk}
                      onClick={() => toggleBhk(bhk)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-purple-50' : ''
                      }`}
                    >
                      <span className={`text-sm ${isSelected ? 'font-semibold text-purple-700' : 'text-slate-700'}`}>
                        {bhk}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Searchable Area (Location) Input */}
          <div className="relative" ref={areaInputRef}>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600 z-10" />
              <Input
                placeholder="Search area (Bandra, Khar, Worli...)"
                value={areaSearchQuery}
                onChange={(e) => {
                  setAreaSearchQuery(e.target.value);
                  setShowAreaSuggestions(true);
                }}
                onFocus={() => setShowAreaSuggestions(true)}
                className="pl-10 border-purple-200 focus-visible:ring-purple-500 h-11 rounded-xl"
              />
            </div>

            {/* Area Suggestions Dropdown */}
            {showAreaSuggestions && filteredAreaSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-50">
                {filteredAreaSuggestions.map((location) => {
                  const isSelected = filters.location_multi?.includes(location);
                  return (
                    <button
                      key={location}
                      onClick={() => toggleLocation(location)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-purple-50' : ''
                      }`}
                    >
                      <span className={`text-sm ${isSelected ? 'font-semibold text-purple-700' : 'text-slate-700'}`}>
                        {location}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Secondary Filters Row */}
        <div className="flex flex-wrap gap-2 md:gap-3">
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

          {/* Budget Inputs */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ""}
              onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
              className="w-24 h-10 md:h-11 border-purple-200 rounded-xl"
            />
            <span className="text-slate-400">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ""}
              onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
              className="w-24 h-10 md:h-11 border-purple-200 rounded-xl"
            />
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {filters.listingType === 'Sale' || filters.listingType === 'Pre Leased' ? 'Cr' : 'L'}
            </span>
          </div>
        </div>

        {/* ✅ NEW: Selected Filters Display with Remove Option */}
        {(filters.bhk_multi?.length > 0 || filters.location_multi?.length > 0) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-purple-100">
            {filters.bhk_multi?.map(bhk => (
              <Badge 
                key={bhk} 
                variant="secondary" 
                className="bg-purple-100 text-purple-800 border-purple-300 font-semibold gap-1.5 text-xs px-3 py-1 cursor-pointer hover:bg-purple-200 transition-colors"
                onClick={() => removeBhk(bhk)}
              >
                <Home className="w-3 h-3" />
                {bhk}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
            {filters.location_multi?.map(loc => (
              <Badge 
                key={loc} 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 border-blue-300 font-semibold gap-1.5 text-xs px-3 py-1 cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => removeLocation(loc)}
              >
                <MapPin className="w-3 h-3" />
                {loc}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}

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