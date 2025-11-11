import React from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home, Maximize2, Armchair, Star, Building2, Sparkles } from "lucide-react";

/**
 * SocialSharePropertyCard - Optimized for 1200x630px Open Graph images
 * Designed to look great on WhatsApp, Facebook, LinkedIn, Twitter
 */
export default function SocialSharePropertyCard({ property, building, developer }) {
  const formatPrice = () => {
    if (!property.price) return "Price on Request";
    
    if (property.price_unit === "crores") {
      if (property.price < 1) {
        const lakhs = property.price * 100;
        return `₹${lakhs} ${lakhs === 1 ? 'Lakh' : 'Lakhs'}`;
      }
      return `₹${property.price} Cr`;
    }
    
    if (property.price >= 100) {
      const crores = (property.price / 100).toFixed(2);
      return `₹${crores} Cr`;
    }
    return `₹${property.price} ${property.price === 1 ? 'Lakh' : 'Lakhs'}`;
  };

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case "Tier 1": return "bg-gradient-to-r from-amber-500 to-yellow-500 text-white";
      case "Tier 2": return "bg-gradient-to-r from-blue-500 to-indigo-500 text-white";
      case "Tier 3": return "bg-gradient-to-r from-emerald-500 to-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div 
      className="relative w-[1200px] h-[630px] bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-hidden"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>

      {/* Main Content Container */}
      <div className="relative h-full flex flex-col justify-between p-12">
        
        {/* Header with Branding */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-9 h-9 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                PropAI Live
              </h1>
              <p className="text-sm text-slate-600 font-semibold">Mumbai Real Estate Intelligence</p>
            </div>
          </div>

          {/* Top Badges */}
          <div className="flex flex-col gap-2 items-end">
            {property.listing_type && (
              <Badge className="bg-purple-600 text-white text-base px-4 py-2 font-bold shadow-md">
                {property.listing_type}
              </Badge>
            )}
            {developer?.tier && (
              <Badge className={`${getTierBadgeClass(developer.tier)} text-base px-4 py-2 font-bold shadow-md border-0`}>
                {developer.tier} Developer
              </Badge>
            )}
          </div>
        </div>

        {/* Property Details - Center Focus */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border-2 border-purple-200">
          
          {/* Property Title */}
          <h2 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
            {property.ai_title || `${property.bhk} in ${property.location}`}
          </h2>

          {/* Location & Building */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-xl text-slate-700">
              <MapPin className="w-6 h-6 text-purple-500" />
              <span className="font-semibold">
                {property.pocket ? (
                  <>
                    {property.pocket} <span className="text-slate-500">•</span> {property.location}
                  </>
                ) : (
                  property.location
                )}
              </span>
            </div>

            {(building?.name || property.building_name) && (
              <div className="flex items-center gap-3 text-lg">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <span className="font-semibold text-indigo-700">
                  {building?.name || property.building_name}
                  {developer?.name && (
                    <span className="text-slate-600 ml-2">by {developer.name}</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Price - Hero Element */}
          <div className="mb-6 pb-6 border-b-2 border-purple-200">
            <p className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {formatPrice()}
            </p>
            {property.listing_type === 'Rent' && (
              <p className="text-lg text-slate-600 mt-1">per month</p>
            )}
          </div>

          {/* Key Features Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-200">
              <Home className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{property.bhk}</p>
              <p className="text-sm text-slate-600">Configuration</p>
            </div>

            {property.carpet_area && (
              <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-200">
                <Maximize2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{property.carpet_area}</p>
                <p className="text-sm text-slate-600">sq.ft Carpet</p>
              </div>
            )}

            {property.furnishing && (
              <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-200">
                <Armchair className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-slate-900">{property.furnishing}</p>
                <p className="text-sm text-slate-600">Furnishing</p>
              </div>
            )}
          </div>

          {/* Top Amenities - If Available */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="mt-6 pt-6 border-t border-purple-200">
              <div className="flex flex-wrap gap-2">
                {property.amenities.slice(0, 4).map((amenity, idx) => (
                  <Badge key={idx} className="bg-purple-100 text-purple-800 border-purple-300 text-base px-3 py-1">
                    {amenity}
                  </Badge>
                ))}
                {property.amenities.length > 4 && (
                  <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-base px-3 py-1">
                    +{property.amenities.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-lg">
              <p className="text-2xl font-bold">📱 View on PropAI Live</p>
            </div>
            {property.custom_id && (
              <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl border-2 border-purple-200">
                <p className="text-sm text-slate-600">Property ID</p>
                <p className="text-lg font-mono font-bold text-purple-700">{property.custom_id}</p>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-lg text-slate-600 mb-1">Verified Listings</p>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <p className="text-xl font-bold text-slate-900">AI-Powered Intelligence</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}