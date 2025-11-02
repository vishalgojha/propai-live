import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Home, Maximize2, Car, MessageCircle, Building2, 
  Calendar, Armchair, Check, Utensils 
} from "lucide-react";

export default function PropertyDetailsModal({ property, isOpen, onClose }) {
  if (!property) return null;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            {property.bhk} - {property.building_name || "Premium Property"}
          </DialogTitle>
        </DialogHeader>

        {/* Images */}
        {property.images && property.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 -mx-6 -mt-2 mb-4">
            {property.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Property ${idx + 1}`}
                className="w-full h-48 object-cover first:col-span-2 first:h-64"
              />
            ))}
          </div>
        )}

        {/* Price and Location */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <p className="text-sm text-slate-600">
                {property.building_name && `${property.building_name}, `}
                {property.location_id || "Mumbai"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-50 text-blue-700 border-0">
                {property.listing_type}
              </Badge>
              <Badge variant="outline">
                {property.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{formatPrice()}</p>
            <p className="text-sm text-slate-500">{property.property_type || "Apartment"}</p>
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
          <div className="text-center">
            <Home className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">{property.bhk}</p>
            <p className="text-xs text-slate-500">Configuration</p>
          </div>
          <div className="text-center">
            <Maximize2 className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">
              {property.carpet_area || "N/A"} sq ft
            </p>
            <p className="text-xs text-slate-500">Carpet Area</p>
          </div>
          <div className="text-center">
            <Armchair className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">{property.furnishing || "N/A"}</p>
            <p className="text-xs text-slate-500">Furnishing</p>
          </div>
          <div className="text-center">
            <Car className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">{property.parking || "N/A"}</p>
            <p className="text-xs text-slate-500">Parking</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {property.floor && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Floor</p>
              <p className="text-sm font-medium text-slate-900">
                {property.floor}
                {property.total_floors && ` of ${property.total_floors}`}
              </p>
            </div>
          )}
          {property.possession && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Possession</p>
              <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {property.possession}
              </p>
            </div>
          )}
          {property.veg_nonveg && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Food Preference</p>
              <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                <Utensils className="w-3 h-3" />
                {property.veg_nonveg}
              </p>
            </div>
          )}
          {property.built_up_area && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Built-up Area</p>
              <p className="text-sm font-medium text-slate-900">{property.built_up_area} sq ft</p>
            </div>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Description</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{property.description}</p>
          </div>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Amenities</h4>
            <div className="grid grid-cols-2 gap-2">
              {property.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-green-500" />
                  {amenity}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleWhatsApp}
          className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
          size="lg"
        >
          <MessageCircle className="w-5 h-5" />
          Connect via WhatsApp
        </Button>
      </DialogContent>
    </Dialog>
  );
}