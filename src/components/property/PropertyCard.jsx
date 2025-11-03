
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Maximize2, Car, Eye, MessageCircle,
  Armchair, Shield, Camera, Building2
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PropertyCard({ property, onViewDetails }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const formatPrice = () => {
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
    } else if (property.price < 1) {
      const thousands = (property.price * 100).toFixed(0);
      return `₹${thousands}K`;
    }
    return `₹${property.price} ${property.price === 1 ? 'Lakh' : 'Lakhs'}`;
  };

  const handleWhatsAppVishal = (e) => {
    e.stopPropagation();
    
    const message = `Hi Vishal, I'm interested in this property:\n\n` +
      `🏠 ${property.ai_title || `${property.bhk} in ${property.location}`}\n` +
      `💰 ${formatPrice()} | ${property.listing_type}\n` +
      `📍 ${property.building_name ? `${property.building_name}, ` : ''}${property.location}\n` +
      `${property.custom_id ? `🔖 ID: ${property.custom_id}\n` : ''}` +
      `\nPlease share:\n` +
      `✅ Latest photos\n` +
      `✅ Availability status\n` +
      `✅ Viewing schedule\n\n` +
      `Thank you!`;
    
    window.open(`https://wa.me/919819471310?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleWhatsAppKapil = (e) => {
    e.stopPropagation();
    
    const message = `Hi Kapil, I'm interested in this property:\n\n` +
      `🏠 ${property.ai_title || `${property.bhk} in ${property.location}`}\n` +
      `💰 ${formatPrice()} | ${property.listing_type}\n` +
      `📍 ${property.building_name ? `${property.building_name}, ` : ''}${property.location}\n` +
      `${property.custom_id ? `🔖 ID: ${property.custom_id}\n` : ''}` +
      `\nPlease share:\n` +
      `✅ Latest photos\n` +
      `✅ Availability status\n` +
      `✅ Viewing schedule\n\n` +
      `Thank you!`;
    
    window.open(`https://wa.me/919773757759?text=${encodeURIComponent(message)}`, '_blank');
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

  const showMediaIcon = (property.images && property.images.length > 0) || 
    (property.source_text && 
     (property.source_text.toLowerCase().includes('pic') || 
      property.source_text.toLowerCase().includes('photo') ||
      property.source_text.toLowerCase().includes('video') ||
      property.source_text.toLowerCase().includes('img')));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-[#F7F7F7] hover:border-[#FFD300]/30 cursor-pointer group relative"
    >
      {/* Header Section with AI Title & Description */}
      <div className="relative p-6 bg-gradient-to-br from-stone-50 via-white to-stone-50 border-b border-stone-100">
        
        {/* Camera Icon - Small, top-right corner */}
        {showMediaIcon && (
          <div className="absolute top-4 right-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-amber-500/90 backdrop-blur-sm rounded-lg p-1.5 cursor-pointer hover:bg-amber-600 transition-all shadow-sm">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Photos/Videos Available</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Badges - Top Row with Location */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className="bg-black text-white border-0 font-bold text-xs">
            {property.bhk}
          </Badge>
          {/* Location Badge */}
          <Badge className="bg-stone-200 text-stone-700 border-0 font-semibold text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {property.location}
          </Badge>
          {property.jodi_flag && (
            <Badge className="bg-purple-600 text-white border-0 font-bold text-xs">
              JODI
            </Badge>
          )}
          {property.broker_trust_score && property.broker_trust_score >= 70 && (
            <Badge className="bg-green-600 text-white border-0 flex items-center gap-1 text-xs">
              <Shield className="w-3 h-3" />
              Verified
            </Badge>
          )}
          {property.expat_friendly && (
            <Badge className="bg-blue-600 text-white border-0 text-xs">
              🌍 Expat Friendly
            </Badge>
          )}
        </div>

        {/* AI Title */}
        <h3 className="text-xl font-bold text-[#111111] mb-3 leading-tight group-hover:text-[#FFD300] transition-colors">
          {property.ai_title || `${property.bhk} in ${property.location || 'Mumbai'}`}
        </h3>
        
        {/* Price - Between Title and Description */}
        <div className="mb-3">
          <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
            {formatPrice()}
          </p>
          <p className="text-xs text-stone-500 uppercase tracking-wide font-medium">
            {property.listing_type}
          </p>
        </div>
        
        {/* AI Description */}
        {property.ai_description && (
          <p className="text-sm text-[#3B3B3B] leading-relaxed mb-4">
            {property.ai_description}
          </p>
        )}

        {/* Location Details */}
        {property.pocket && (
          <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
            <MapPin className="w-4 h-4 text-stone-500 flex-shrink-0" />
            <span>{property.pocket}</span>
          </div>
        )}

        {property.building_name && (
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Building2 className="w-4 h-4 text-stone-500 flex-shrink-0" />
            <span className="line-clamp-1">{property.building_name}</span>
          </div>
        )}
      </div>

      {/* Stats & Actions Section */}
      <div className="p-5">
        
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

        {/* Property Type Badge */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-100">
          <Badge variant="outline" className="text-xs border-stone-300">
            {property.property_type || "Apartment"}
          </Badge>
          {property.broker_trust_score && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
              <Shield className="w-3 h-3" />
              {property.broker_trust_score}% Trust
            </span>
          )}
        </div>

        {/* WhatsApp CTAs */}
        <div className="space-y-2">
          <Button
            onClick={handleWhatsAppVishal}
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-2xl h-11"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Vishal via WhatsApp
          </Button>

          <Button
            onClick={handleWhatsAppKapil}
            className="w-full bg-[#128C7E] hover:bg-[#0F7A6E] text-white font-bold rounded-2xl h-11"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Kapil via WhatsApp
          </Button>

          {user?.role === 'admin' && property.broker_contact && (
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
        </div>
      </div>
    </motion.div>
  );
}
