import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Home, Maximize2, Car, MessageCircle, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function PropertyCard({ property, onViewDetails }) {
  const formatPrice = () => {
    if (property.price_unit === "crores") {
      return `₹${property.price} Cr`;
    }
    return `₹${property.price} L`;
  };

  const handleWhatsApp = () => {
    const message = `Hi, I'm interested in the ${property.bhk} property at ${property.building_name || 'your listing'} listed for ${formatPrice()}`;
    const phone = property.broker_contact || "919876543210";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100"
    >
      {/* Image Section */}
      {property.images && property.images.length > 0 ? (
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          <img
            src={property.images[0]}
            alt={property.building_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 border-0 shadow-lg">
              {property.listing_type}
            </Badge>
          </div>
          {property.featured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-blue-500 text-white border-0 shadow-lg">
                Featured
              </Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-48 bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 flex items-center justify-center">
          <Home className="w-16 h-16 text-slate-300" />
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 border-0 shadow-lg">
              {property.listing_type}
            </Badge>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-5">
        {/* Location */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {property.building_name || "Premium Building"}
            </p>
            <p className="text-xs text-slate-500">
              {property.location_id || "Mumbai"}
            </p>
          </div>
        </div>

        {/* BHK and Price */}
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{property.bhk}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{property.property_type || "Apartment"}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">{formatPrice()}</p>
          </div>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-t border-b border-slate-100">
          <div className="text-center">
            <Maximize2 className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <p className="text-xs text-slate-900 font-medium">
              {property.carpet_area || "N/A"}
            </p>
            <p className="text-xs text-slate-500">sq ft</p>
          </div>
          <div className="text-center">
            <Home className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <p className="text-xs text-slate-900 font-medium truncate">
              {property.furnishing || "N/A"}
            </p>
            <p className="text-xs text-slate-500">Furnishing</p>
          </div>
          <div className="text-center">
            <Car className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <p className="text-xs text-slate-900 font-medium">
              {property.parking || "N/A"}
            </p>
            <p className="text-xs text-slate-500">Parking</p>
          </div>
        </div>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {property.amenities.slice(0, 3).map((amenity, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs bg-slate-50 text-slate-600">
                {amenity}
              </Badge>
            ))}
            {property.amenities.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-slate-50 text-slate-600">
                +{property.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleWhatsApp}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
          <Button
            onClick={() => onViewDetails(property)}
            variant="outline"
            className="px-4"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}