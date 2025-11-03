import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PropertyFilters({ filters, onFilterChange, onClearFilters, allProperties = [] }) {
  const [nlpInput, setNlpInput] = useState("");
  const [expatMode, setExpatMode] = useState(false);

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

  const toggleExpatMode = () => {
    const newExpatMode = !expatMode;
    setExpatMode(newExpatMode);

    if (newExpatMode) {
      onFilterChange({
        ...filters,
        furnishing: 'Fully Furnished',
        expat_mode: true
      });
    } else {
      const { expat_mode, ...restFilters } = filters;
      onFilterChange(restFilters);
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

  // Determine price unit based on listing type
  const getPriceUnit = () => {
    if (filters.listingType === 'Rent') {
      return 'Lakhs';
    } else if (filters.listingType === 'Sale' || filters.listingType === 'Pre Leased') {
      return 'Cr';
    }
    return 'Lakhs'; // default
  };

  const hasActiveFilters =
    (filters.bhk_multi && filters.bhk_multi.length > 0) ||
    (filters.location_multi && filters.location_multi.length > 0) ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.furnishing ||
    (filters.listingType && filters.listingType !== "all") ||
    filters.search ||
    (filters.propertyCategory && filters.propertyCategory !== "all") ||
    filters.expat_mode;

  return (
    <div className="bg-white rounded-[22px] shadow-sm border-2 border-[#F7F7F7] p-6 mb-8">

      {/* Expat Mode Toggle */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🌍</span>
            </div>
            <div>
              <h3 className="font-bold text-[#111111] text-sm">Expat Mode</h3>
              <p className="text-xs text-[#3B3B3B]">Fully furnished • Great amenities • Expat-friendly buildings</p>
            </div>
          </div>
          <button
            onClick={toggleExpatMode}
            className={`relative w-14 h-8 rounded-full transition-all ${
              expatMode ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
              expatMode ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* AI-Powered Search */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#FFD300]" />
          <h3 className="font-bold text-[#111111] text-lg">AI-Powered Search</h3>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3B3B3B]" />
            <Input
              placeholder="Try: 3 BHK in Bandra under 2 Cr, furnished, for rent..."
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNlpSearch()}
              className="pl-11 border-[#3B3B3B]/20 focus-visible:ring-[#FFD300] h-12 rounded-xl"
            />
          </div>
          <Button
            onClick={handleNlpSearch}
            className="bg-[#FFD300] hover:bg-[#FFC700] text-black h-12 px-6 rounded-xl font-semibold"
          >
            Search
          </Button>
        </div>

        <p className="text-xs text-[#3B3B3B]/60 mt-2">
          💡 Just describe what you're looking for in plain English
        </p>
      </div>

      {/* NEW: Listing Type Selector */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-[#111111] mb-3 block">Rent / Sale / Pre Leased</label>
        <div className="flex flex-wrap gap-2">
          {['Rent', 'Sale', 'Pre Leased'].map((type) => {
            const isSelected = filters.listingType === type;
            return (
              <Button
                key={type}
                onClick={() => onFilterChange({ ...filters, listingType: type })}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`rounded-xl font-semibold ${
                  isSelected
                    ? "bg-[#FFD300] text-black border-0"
                    : "border-[#3B3B3B]/20 hover:bg-[#F7F7F7] text-[#3B3B3B]"
                }`}
              >
                {type}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Multi-Select BHK */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-[#111111] mb-3 block">Select BHK (Multi-select)</label>
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
                    ? "bg-[#FFD300] text-black border-0"
                    : "border-[#3B3B3B]/20 hover:bg-[#F7F7F7] text-[#3B3B3B]"
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
        <label className="text-sm font-semibold text-[#111111] mb-3 block">Select Locations (Multi-select)</label>
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
                    ? "bg-[#FFD300] text-black border-0"
                    : "border-[#3B3B3B]/20 hover:bg-[#F7F7F7] text-[#3B3B3B]"
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
          <label className="text-sm font-semibold text-[#111111] mb-2 block">
            Min Price ({getPriceUnit()})
          </label>
          <Input
            type="number"
            placeholder={getPriceUnit() === 'Cr' ? "e.g., 1.5" : "e.g., 50"}
            value={filters.minPrice || ""}
            onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
            className="border-[#3B3B3B]/20 focus-visible:ring-[#FFD300] h-11 rounded-xl"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-[#111111] mb-2 block">
            Max Price ({getPriceUnit()})
          </label>
          <Input
            type="number"
            placeholder={getPriceUnit() === 'Cr' ? "e.g., 5" : "e.g., 200"}
            value={filters.maxPrice || ""}
            onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
            className="border-[#3B3B3B]/20 focus-visible:ring-[#FFD300] h-11 rounded-xl"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-4 border-t border-[#F7F7F7]">
          <div className="flex flex-wrap gap-2">
            {filters.listingType && filters.listingType !== "all" && (
              <Badge variant="secondary" className="bg-[#FFD300]/20 text-black border-[#FFD300] font-semibold">
                {filters.listingType}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onFilterChange({ ...filters, listingType: "all" })} />
              </Badge>
            )}
            {filters.bhk_multi?.map((bhk) => (
              <Badge key={bhk} variant="secondary" className="bg-[#FFD300]/20 text-black border-[#FFD300] font-semibold">
                {bhk}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => toggleBhk(bhk)} />
              </Badge>
            ))}
            {filters.location_multi?.map((location) => (
              <Badge key={location} variant="secondary" className="bg-[#FFD300]/20 text-black border-[#FFD300] font-semibold">
                {location}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => toggleLocation(location)} />
              </Badge>
            ))}
            {(filters.minPrice || filters.maxPrice) && (
              <Badge variant="secondary" className="bg-[#FFD300]/20 text-black border-[#FFD300] font-semibold">
                ₹{filters.minPrice || "0"}{getPriceUnit()} - ₹{filters.maxPrice || "∞"}{getPriceUnit()}
              </Badge>
            )}
            {filters.expat_mode && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-400 font-semibold">
                Expat Mode
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => toggleExpatMode()} />
              </Badge>
            )}
            {filters.furnishing && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-400 font-semibold">
                {filters.furnishing}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onFilterChange({ ...filters, furnishing: undefined })} />
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-400 font-semibold">
                Search: "{filters.search}"
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onFilterChange({ ...filters, search: undefined })} />
              </Badge>
            )}
            {filters.propertyCategory && filters.propertyCategory !== "all" && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-400 font-semibold">
                Category: {filters.propertyCategory}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onFilterChange({ ...filters, propertyCategory: "all" })} />
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-[#3B3B3B] hover:text-[#111111] hover:bg-[#F7F7F7]"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}