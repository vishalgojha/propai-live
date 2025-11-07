
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PropertyFilters({ filters, onFilterChange, onClearFilters, allProperties = [] }) {
  const [nlpInput, setNlpInput] = useState("");

  const uniqueBhks = [...new Set(allProperties.map(p => p.bhk).filter(Boolean))].sort();
  const uniqueLocations = [...new Set(allProperties.map(p => p.location).filter(Boolean))].sort();

  const toggleBhk = (bhk) => {
    const currentBhks = filters.bhk_multi || [];
    const newBhks = currentBhks.includes(bhk)
      ? currentBhks.filter(b => b !== bhk)
      : [...currentBhks, bhk];
    onFilterChange({ ...filters, bhk_multi: newBhks });
  };

  const toggleLocation = (location) => {
    const currentLocations = filters.location_multi || [];
    const newLocations = currentLocations.includes(location)
      ? currentLocations.filter(l => l !== location)
      : [...currentLocations, location];
    onFilterChange({ ...filters, location_multi: newLocations });
  };

  const toggleListingType = (type) => {
    if (filters.listingType === type) {
      onFilterChange({ ...filters, listingType: "all" });
    } else {
      onFilterChange({ ...filters, listingType: type });
    }
  };

  const handleNlpSearch = () => {
    if (!nlpInput.trim()) return;

    const input = nlpInput.toLowerCase();
    const newFilters = { ...filters, search: nlpInput };

    const bhkMatches = input.match(/(\d+)\s*bhk/gi);
    if (bhkMatches) {
      newFilters.bhk_multi = bhkMatches.map(m => m.replace(/\s*bhk/i, ' BHK').toUpperCase().trim());
    }

    const locationMatches = uniqueLocations.filter(loc =>
      input.includes(loc.toLowerCase())
    );
    if (locationMatches.length > 0) {
      newFilters.location_multi = locationMatches;
    }

    if (input.includes('rent') || input.includes('rental')) {
      newFilters.listingType = 'Rent';
    } else if (input.includes('sale') || input.includes('buy')) {
      newFilters.listingType = 'Sale';
    } else if (input.includes('pre leased') || input.includes('preleased')) {
      newFilters.listingType = 'Pre Leased';
    }

    if (input.includes('furnished')) {
      if (input.includes('fully')) {
        newFilters.furnishing = 'Fully Furnished';
      } else if (input.includes('semi')) {
        newFilters.furnishing = 'Semi-Furnished';
      } else if (input.includes('unfurnished')) {
        newFilters.furnishing = 'Unfurnished';
      }
    }

    const priceMatch = input.match(/(?:under|below|max|up to)\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|l|lakh|lakhs|k|thousand)/i);
    if (priceMatch) {
      const amount = parseFloat(priceMatch[1]);
      const unit = priceMatch[2].toLowerCase();

      if (unit.startsWith('cr')) {
        newFilters.maxPrice = amount * 100;
      } else if (unit.startsWith('l')) {
        newFilters.maxPrice = amount;
      } else if (unit === 'k') {
        newFilters.maxPrice = amount / 100;
      }
    }

    onFilterChange(newFilters);
  };

  const getPriceUnit = () => {
    if (filters.listingType === 'Rent') {
      return 'Lakhs';
    } else if (filters.listingType === 'Sale' || filters.listingType === 'Pre Leased') {
      return 'Cr';
    }
    return 'Lakhs';
  };

  const hasActiveFilters =
    (filters.bhk_multi && filters.bhk_multi.length > 0) ||
    (filters.location_multi && filters.location_multi.length > 0) ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.furnishing ||
    (filters.listingType && filters.listingType !== "all") ||
    filters.search ||
    (filters.propertyCategory && filters.propertyCategory !== "all");

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-purple-200 p-6 mb-8">

      {/* AI-Powered Search */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-slate-900 text-lg">AI-Powered Search</h3>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Try: 3 BHK in Bandra under 2 Cr, furnished, for rent..."
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNlpSearch()}
              className="pl-11 border-purple-200 focus-visible:ring-purple-500 h-12 rounded-xl"
            />
          </div>
          <Button
            onClick={handleNlpSearch}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-12 px-6 rounded-xl font-semibold shadow-md"
          >
            Search
          </Button>
        </div>

        <p className="text-xs text-slate-500 mt-2">
          💡 Just describe what you're looking for in plain English
        </p>
      </div>

      {/* Listing Type Selector with Toggle */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-slate-900 mb-3 block">Rent / Sale / Pre Leased</label>
        <div className="flex flex-wrap gap-2">
          {['Rent', 'Sale', 'Pre Leased'].map((type) => {
            const isSelected = filters.listingType === type;
            return (
              <Button
                key={type}
                onClick={() => toggleListingType(type)}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`rounded-xl font-semibold ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md"
                    : "border-purple-200 hover:bg-purple-50 text-slate-700"
                }`}
              >
                {type}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          💡 Click again to deselect
        </p>
      </div>

      {/* Multi-Select BHK */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-slate-900 mb-3 block">Select BHK (Multi-select)</label>
        <div className="flex flex-wrap gap-2">
          {uniqueBhks.map((bhk) => {
            const isSelected = filters.bhk_multi?.includes(bhk);
            return (
              <Button
                key={bhk}
                onClick={() => toggleBhk(bhk)}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`rounded-xl font-semibold ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md"
                    : "border-purple-200 hover:bg-purple-50 text-slate-700"
                }`}
              >
                {bhk}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Multi-Select Location */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-slate-900 mb-3 block">Select Locations (Multi-select)</label>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {uniqueLocations.map((location) => {
            const isSelected = filters.location_multi?.includes(location);
            return (
              <Button
                key={location}
                onClick={() => toggleLocation(location)}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`rounded-xl font-semibold ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md"
                    : "border-purple-200 hover:bg-purple-50 text-slate-700"
                }`}
              >
                {location}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Budget Range - Dynamic Unit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div>
          <label className="text-sm font-semibold text-slate-900 mb-2 block">
            Min Price ({getPriceUnit()})
          </label>
          <Input
            type="number"
            placeholder={getPriceUnit() === 'Cr' ? "e.g., 1.5" : "e.g., 50"}
            value={filters.minPrice || ""}
            onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
            className="border-sky-200 focus-visible:ring-sky-500 h-11 rounded-xl"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-900 mb-2 block">
            Max Price ({getPriceUnit()})
          </label>
          <Input
            type="number"
            placeholder={getPriceUnit() === 'Cr' ? "e.g., 5" : "e.g., 200"}
            value={filters.maxPrice || ""}
            onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
            className="border-sky-200 focus-visible:ring-sky-500 h-11 rounded-xl"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-4 border-t border-purple-100">
          <div className="flex flex-wrap gap-2">
            {filters.listingType && filters.listingType !== "all" && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold">
                {filters.listingType}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onFilterChange({ ...filters, listingType: "all" })} />
              </Badge>
            )}
            {filters.bhk_multi?.map((bhk) => (
              <Badge key={bhk} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold">
                {bhk}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => toggleBhk(bhk)} />
              </Badge>
            ))}
            {filters.location_multi?.map((location) => (
              <Badge key={location} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold">
                {location}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => toggleLocation(location)} />
              </Badge>
            ))}
            {(filters.minPrice || filters.maxPrice) && (
              <Badge variant="secondary" className="bg-sky-100 text-sky-800 border-sky-300 font-semibold">
                ₹{filters.minPrice || "0"}{getPriceUnit()} - ₹{filters.maxPrice || "∞"}{getPriceUnit()}
              </Badge>
            )}
            {filters.furnishing && (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-400 font-semibold">
                {filters.furnishing}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onFilterChange({ ...filters, furnishing: undefined })} />
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-400 font-semibold">
                Search: "{filters.search}"
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onFilterChange({ ...filters, search: undefined })} />
              </Badge>
            )}
            {filters.propertyCategory && filters.propertyCategory !== "all" && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-400 font-semibold">
                Category: {filters.propertyCategory}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onFilterChange({ ...filters, propertyCategory: "all" })} />
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-slate-600 hover:text-slate-900 hover:bg-purple-50"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
