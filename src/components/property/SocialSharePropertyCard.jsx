import React from "react";
import { MapPin, Home, Maximize2, Armchair } from "lucide-react";

/**
 * SocialSharePropertyCard - Optimized for social media sharing (1200x630px)
 * This component is designed to be screenshotted by Browserless
 * Features: PropAI Live branding, no broker name, compelling property details
 */
export default function SocialSharePropertyCard({ property }) {
  const formatPrice = () => {
    if (!property) return "";
    if (property.price_unit === "crores") {
      return `₹${property.price} Cr`;
    }
    return `₹${property.price} ${property.price === 1 ? 'Lakh' : 'Lakhs'}`;
  };

  return (
    <div 
      className="w-[1200px] h-[630px] bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-12"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Left Side - Property Image or Placeholder */}
        <div className="w-1/2 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center relative">
          {property.images && property.images[0] ? (
            <img 
              src={property.images[0]} 
              alt="Property"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <Home className="w-32 h-32 text-purple-300 mx-auto mb-4" />
              <p className="text-2xl text-purple-400 font-semibold">Premium Property</p>
            </div>
          )}
          
          {/* PropAI Live Watermark on Image */}
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">PropAI Live</p>
                <p className="text-xs text-slate-600">Mumbai Real Estate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Property Details */}
        <div className="w-1/2 p-10 flex flex-col justify-between">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-bold">
                {property.listing_type}
              </div>
              <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-xl text-sm font-bold border-2 border-purple-300">
                {property.bhk}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-3 leading-tight line-clamp-2">
              {property.ai_title || `${property.bhk} in ${property.location}`}
            </h1>

            <div className="flex items-center gap-2 text-lg text-slate-600 mb-6">
              <MapPin className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">{property.location}</span>
              {property.pocket && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-base">{property.pocket}</span>
                </>
              )}
            </div>

            {/* AI Description Snippet */}
            {property.ai_description && (
              <p className="text-base text-slate-700 leading-relaxed mb-6 line-clamp-3">
                {property.ai_description}
              </p>
            )}

            {/* Key Features Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
                <Home className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-slate-900">{property.bhk}</p>
                <p className="text-xs text-slate-600">Config</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
                <Maximize2 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-slate-900">{property.carpet_area || 'N/A'}</p>
                <p className="text-xs text-slate-600">sq ft</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
                <Armchair className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-slate-900 text-xs">{property.furnishing || 'N/A'}</p>
                <p className="text-xs text-slate-600">Furnish</p>
              </div>
            </div>
          </div>

          {/* Footer - Price & CTA */}
          <div>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6 border-2 border-purple-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Price</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {formatPrice()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600 mb-2">View Full Details</p>
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm">
                    Login to PropAI Live →
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Branding */}
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">
                🔒 Verified Property • Real-time Data • AI-Powered Intelligence
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}