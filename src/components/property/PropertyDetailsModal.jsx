
import React, { useEffect } from "react";
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
  useEffect(() => {
    if (property && isOpen) {
      // Inject property-specific schema
      const schema = {
        "@context": "https://schema.org",
        "@type": property.property_category === "Commercial" ? "CommercialProperty" : "Apartment",
        "name": property.ai_title || (property.bhk ? `${property.bhk} in ${property.location || 'Mumbai'}` : property.building_name || 'Property'),
        "description": property.ai_description || property.description || "",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": property.building_name || property.pocket || property.location || "",
          "addressLocality": property.location || property.location_id || "Mumbai",
          "addressRegion": "Mumbai", // Assuming Mumbai for now
          "addressCountry": "IN"
        },
        "floorSize": property.carpet_area ? {
          "@type": "QuantitativeValue",
          "value": property.carpet_area,
          "unitCode": "FTK" // Square feet
        } : undefined,
        "numberOfRooms": property.bhk ? parseInt(property.bhk.split(' ')[0]) || undefined : undefined,
        "petsAllowed": (property.veg_nonveg === "Both" || property.veg_nonveg === "Non-Veg Allowed") ? true : undefined,
        "amenityFeature": property.amenities?.map(a => ({
          "@type": "LocationFeatureSpecification",
          "name": a
        })) || [],
        "image": property.images?.length > 0 ? property.images : undefined,
        "offers": {
          "@type": "Offer",
          "price": property.price_unit === "crores" ? property.price * 10000000 : property.price * 100000,
          "priceCurrency": "INR",
          "availability": property.status === "Active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": property.price,
            "priceCurrency": "INR"
          }
        }
      };

      let script = document.querySelector('script[data-property-schema]');
      if (script) {
        script.textContent = JSON.stringify(schema);
      } else {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-property-schema', 'true');
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      }

      return () => {
        const existingScript = document.querySelector('script[data-property-schema]');
        if (existingScript) {
          existingScript.remove();
        }
      };
    }
    // Cleanup if modal closes or property becomes null while open
    return () => {
      const existingScript = document.querySelector('script[data-property-schema]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [property, isOpen]);

  if (!property) return null;

  const formatPrice = () => {
    if (property.price_unit === "crores") {
      return `₹${property.price} Cr`;
    }
    return `₹${property.price} L`;
  };

  const getAgentPhone = () => {
    // Use broker contact if available, otherwise PropAI Office
    return property.broker_contact || "919102269622278";
  };

  const getAgentName = () => {
    if (property.broker_contact && property.broker_contact !== "919102269622278") {
      return "Broker";
    }
    return "PropAI Team";
  };

  const handleWhatsApp = () => {
    const title = property.ai_title || `${property.bhk} in ${property.location || 'Mumbai'}`;
    const message = `Hi ${getAgentName()}, I'm interested in:\n\n${title}\n${formatPrice()}\n\nCan you share more details?`;
    const phone = getAgentPhone();
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getLocationDisplay = () => {
    const parts = [];
    if (property.building_name) parts.push(property.building_name);
    if (property.pocket) parts.push(property.pocket);
    if (property.location) parts.push(property.location);
    else if (property.location_id) parts.push(property.location_id);
    return parts.join(', ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-[#F7F7F7]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <Building2 className="w-5 h-5 text-[#FFD300] flex-shrink-0" />
            <span className="leading-tight font-bold text-[#111111]">
              {property.ai_title || `${property.bhk} in ${property.location || property.location_id || "Mumbai"}`}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* NO IMAGES SECTION - Removed completely */}

        {/* Price and Location */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#FFD300]" />
              <p className="text-sm text-[#3B3B3B]">
                {getLocationDisplay()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300] font-bold">
                {property.listing_type}
              </Badge>
              <Badge variant="outline" className="border-[#3B3B3B]/20 font-semibold">
                {property.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold bg-gradient-to-r from-[#FFD300] to-[#FFA500] bg-clip-text text-transparent">{formatPrice()}</p>
            <p className="text-sm text-[#3B3B3B]">{property.property_type || "Apartment"}</p>
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-[#F7F7F7] rounded-2xl">
          <div className="text-center">
            <Home className="w-5 h-5 text-[#3B3B3B] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#111111]">{property.bhk}</p>
            <p className="text-xs text-[#3B3B3B]/60">Configuration</p>
          </div>
          <div className="text-center">
            <Maximize2 className="w-5 h-5 text-[#3B3B3B] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#111111]">
              {property.carpet_area || "N/A"} sq ft
            </p>
            <p className="text-xs text-[#3B3B3B]/60">Carpet Area</p>
          </div>
          <div className="text-center">
            <Armchair className="w-5 h-5 text-[#3B3B3B] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#111111]">{property.furnishing || "N/A"}</p>
            <p className="text-xs text-[#3B3B3B]/60">Furnishing</p>
          </div>
          <div className="text-center">
            <Car className="w-5 h-5 text-[#3B3B3B] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#111111]">{property.parking || "N/A"}</p>
            <p className="text-xs text-[#3B3B3B]/60">Parking</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {property.floor && (
            <div>
              <p className="text-xs text-[#3B3B3B]/60 mb-1 uppercase tracking-wide">Floor</p>
              <p className="text-sm font-semibold text-[#111111]">
                {property.floor}
                {property.total_floors && ` of ${property.total_floors}`}
              </p>
            </div>
          )}
          {property.possession && (
            <div>
              <p className="text-xs text-[#3B3B3B]/60 mb-1 uppercase tracking-wide">Possession</p>
              <p className="text-sm font-semibold text-[#111111] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {property.possession}
              </p>
            </div>
          )}
          {property.veg_nonveg && (
            <div>
              <p className="text-xs text-[#3B3B3B]/60 mb-1 uppercase tracking-wide">Food Preference</p>
              <p className="text-sm font-semibold text-[#111111] flex items-center gap-1">
                <Utensils className="w-3 h-3" />
                {property.veg_nonveg}
              </p>
            </div>
          )}
          {property.built_up_area && (
            <div>
              <p className="text-xs text-[#3B3B3B]/60 mb-1 uppercase tracking-wide">Built-up Area</p>
              <p className="text-sm font-semibold text-[#111111]">{property.built_up_area} sq ft</p>
            </div>
          )}
        </div>

        {/* AI-Generated Description */}
        {(property.ai_description || property.description) && (
          <div className="mb-8">
            <h4 className="text-sm font-bold text-[#111111] mb-3 uppercase tracking-wide">About this Property</h4>
            <p className="text-sm text-[#3B3B3B] leading-relaxed font-light">
              {property.ai_description || property.description}
            </p>
          </div>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-bold text-[#111111] mb-4 uppercase tracking-wide">Amenities</h4>
            <div className="grid grid-cols-2 gap-3">
              {property.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-[#3B3B3B]">
                  <Check className="w-4 h-4 text-[#FFD300]" />
                  {amenity}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleWhatsApp}
          className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white gap-2 font-bold h-14 rounded-2xl shadow-lg"
          size="lg"
        >
          <MessageCircle className="w-5 h-5" />
          Contact {getAgentName()} via WhatsApp
        </Button>
      </DialogContent>
    </Dialog>
  );
}
