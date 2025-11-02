import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Building2, MapPin, Maximize2, Car, Eye, Home, MessageCircle,
  Armchair, Calendar, Star, TrendingUp, Shield, Sparkles, Phone
} from "lucide-react";
import { motion } from "framer-motion";

export default function PropertyCard({ property, onViewDetails }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const formatPrice = () => {
    if (property.price_unit === "crores") {
      if (property.price < 1) {
        return `₹${property.price * 100}L`;
      }
      return `₹${property.price} Cr`;
    }
    
    if (property.price >= 100) {
      return `₹${(property.price / 100).toFixed(2)} Cr`;
    } else if (property.price < 1) {
      return `₹${(property.price * 100).toFixed(0)}K`;
    }
    return `₹${property.price}L`;
  };

  const getAgentPhone = () => {
    if (property.assigned_agent_name?.toLowerCase().includes('kapil') || 
        property.assigned_agent?.toLowerCase().includes('kapil')) {
      return "919773757759";
    }
    return "919819471310"; // Vishal
  };

  const getAgentName = () => {
    return property.assigned_agent_name || property.assigned_agent || "Vishal";
  };

  const handleWhatsAppInquiry = (e) => {
    e.stopPropagation();
    
    const message = `Hi ${getAgentName()}, I'm interested in this property:\n\n` +
      `🏠 ${property.ai_title || `${property.bhk} in ${property.location}`}\n` +
      `💰 ${formatPrice()} | ${property.listing_type}\n` +
      `📍 ${property.building_name ? `${property.building_name}, ` : ''}${property.location}\n` +
      `${property.custom_id ? `🔖 ID: ${property.custom_id}\n` : ''}` +
      `\nPlease share:\n` +
      `✅ Latest photos\n` +
      `✅ Availability status\n` +
      `✅ Viewing schedule\n\n` +
      `Thank you!`;
    
    window.open(`https://wa.me/${getAgentPhone()}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBrokerWhatsApp = (e) => {
    e.stopPropagation();
    
    if (!property.broker_contact) {
      alert('Broker contact not available');
      return;
    }

    const message = `Hi, I saw your listing on Chariot Realty:\n\n` +
      `🏠 ${property.ai_title || `${property.bhk} in ${property.location}`}\n` +
      `💰 ${formatPrice()}\n` +
      `📍 ${property.building_name ? `${property.building_name}, ` : ''}${property.location}\n` +
      `${property.custom_id ? `🔖 Ref: ${property.custom_id}\n` : ''}` +
      `\nIs this property still available?\n` +
      `Can you share photos and arrange a viewing?\n\n` +
      `Thank you!`;
    
    window.open(`https://wa.me/${property.broker_contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCardClick = () => {
    navigate(createPageUrl("PropertyDetails") + `?id=${property.id}`);
  };

  const getLocationDisplay = () => {
    const parts = [];
    if (property.pocket) parts.push(property.pocket);
    if (property.location) parts.push(property.location);
    return parts.join(', ') || property.location_id || 'Mumbai';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-[#F7F7F7] hover:border-[#FFD300]/30 cursor-pointer group"
    >
      {/* Image Section */}
      <div className="relative h-56 bg-stone-100 overflow-hidden">
        {property.images && property.images.length > 0 && !imageError ? (
          <img
            src={property.images[0]}
            alt={property.ai_title || property.building_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <Building2 className="w-16 h-16 text-stone-300" />
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge className="bg-black/90 text-white border-0 font-bold backdrop-blur-sm">
            {property.bhk}
          </Badge>
          {property.jodi_flag && (
            <Badge className="bg-purple-600/90 text-white border-0 font-bold backdrop-blur-sm">
              JODI
            </Badge>
          )}
        </div>

        {/* Trust Score Badge */}
        {property.broker_trust_score && property.broker_trust_score >= 70 && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-600/90 text-white border-0 backdrop-blur-sm flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Verified
            </Badge>
          </div>
        )}

        {/* Expat Friendly Badge */}
        {property.expat_friendly && (
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-blue-600/90 text-white border-0 backdrop-blur-sm">
              🌍 Expat Friendly
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title & Location */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-[#111111] mb-2 line-clamp-2 leading-tight group-hover:text-[#FFD300] transition-colors">
            {property.ai_title || `${property.bhk} in ${property.location || 'Mumbai'}`}
          </h3>
          
          <div className="flex items-start gap-2 text-sm text-[#3B3B3B] mb-1">
            <MapPin className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{getLocationDisplay()}</span>
          </div>

          {property.building_name && (
            <div className="flex items-center gap-2 text-sm text-[#3B3B3B]">
              <Building2 className="w-4 h-4 text-stone-500 flex-shrink-0" />
              <span className="line-clamp-1">{property.building_name}</span>
            </div>
          )}
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-stone-50 rounded-xl">
            <Maximize2 className="w-4 h-4 text-stone-600 mx-auto mb-1" />
            <p className="text-sm font-bold text-[#111111]">{property.carpet_area || 'N/A'}</p>
            <p className="text-xs text-stone-500">sq ft</p>
          </div>
          <div className="text-center p-2 bg-stone-50 rounded-xl">
            <Armchair className="w-4 h-4 text-stone-600 mx-auto mb-1" />
            <p className="text-sm font-bold text-[#111111] truncate">{property.furnishing || 'N/A'}</p>
            <p className="text-xs text-stone-500">Furnishing</p>
          </div>
          <div className="text-center p-2 bg-stone-50 rounded-xl">
            <Car className="w-4 h-4 text-stone-600 mx-auto mb-1" />
            <p className="text-sm font-bold text-[#111111] truncate">{property.parking || 'N/A'}</p>
            <p className="text-xs text-stone-500">Parking</p>
          </div>
        </div>

        {/* Price & Listing Type */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-100">
          <div>
            <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
              {formatPrice()}
            </p>
            <p className="text-xs text-stone-500 uppercase tracking-wide font-medium">
              {property.listing_type}
            </p>
          </div>
          <Badge variant="outline" className="text-xs border-stone-300">
            {property.property_type || "Apartment"}
          </Badge>
        </div>

        {/* AI Description Preview */}
        {property.ai_description && (
          <p className="text-sm text-[#3B3B3B] mb-4 line-clamp-2 leading-relaxed">
            {property.ai_description}
          </p>
        )}

        {/* WhatsApp CTAs */}
        <div className="space-y-2">
          <Button
            onClick={handleWhatsAppInquiry}
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-2xl h-11"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact {getAgentName()} via WhatsApp
          </Button>

          {property.broker_contact && (
            <Button
              onClick={handleBrokerWhatsApp}
              variant="outline"
              className="w-full border-2 border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold rounded-2xl h-11"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Check Availability with Broker
            </Button>
          )}
        </div>

        {/* Footer Meta */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {property.views_count || 0}
            </span>
            {property.custom_id && (
              <span className="font-mono">{property.custom_id}</span>
            )}
          </div>
          {property.broker_trust_score && (
            <span className="flex items-center gap-1 text-green-600 font-semibold">
              <Shield className="w-3 h-3" />
              {property.broker_trust_score}% Trust
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}