import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Maximize2, MessageCircle,
  Armchair, Shield, Eye, Home, Camera
} from "lucide-react";
import { motion } from "framer-motion";

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

  const handleWhatsAppContact = (e, phone, name) => {
    e.stopPropagation();
    
    const message = `Hi ${name}, I'm interested in this property:\n\n` +
      `🏠 ${property.ai_title || `${property.bhk} in ${property.location}`}\n` +
      `💰 ${formatPrice()} | ${property.listing_type}\n` +
      `📍 ${property.building_name ? `${property.building_name}, ` : ''}${property.location}\n` +
      `${property.custom_id ? `🔖 ID: ${property.custom_id}\n` : ''}` +
      `\nPlease share more details and availability.\n\n` +
      `Thank you!`;
    
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCardClick = () => {
    if (property.slug) {
      navigate(createPageUrl("PropertyDetails") + `?slug=${property.slug}`);
    } else {
      navigate(createPageUrl("PropertyDetails") + `?id=${property.id}`);
    }
  };

  const hasImages = property.images && property.images.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-purple-200/50 hover:border-purple-400 hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Content Section */}
      <div className="p-5">
        {/* Header with Badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap gap-2">
            {property.listing_type && (
              <Badge className="bg-white border-2 border-purple-200 text-purple-700 font-semibold text-xs">
                {property.listing_type}
              </Badge>
            )}
            {property.broker_trust_score >= 85 && (
              <Badge className="bg-green-500/20 text-green-700 border-green-500 font-semibold text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          
          {/* Camera Icon - Show if images available */}
          {hasImages && (
            <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
              <Camera className="w-3 h-3" />
              <span className="font-medium">{property.images.length}</span>
            </div>
          )}
        </div>

        {/* Price - Most Prominent */}
        <div className="mb-3">
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
            {formatPrice()}
          </p>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
            {property.listing_type}
          </p>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors">
          {property.ai_title || `${property.bhk} in ${property.location || 'Mumbai'}`}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-4">
          <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <span className="line-clamp-1">
            {[property.building_name, property.pocket, property.location].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-2 text-center border border-purple-100">
            <Home className="w-4 h-4 text-purple-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-900">{property.bhk}</p>
          </div>
          <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-2 text-center border border-purple-100">
            <Maximize2 className="w-4 h-4 text-purple-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-900">{property.carpet_area || 'N/A'}</p>
          </div>
          <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-2 text-center border border-purple-100">
            <Armchair className="w-4 h-4 text-purple-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-900 truncate">{property.furnishing || 'N/A'}</p>
          </div>
        </div>

        {/* WhatsApp Contact Buttons */}
        <div className="space-y-2">
          <Button
            onClick={(e) => handleWhatsAppContact(e, '919819471310', 'Vishal')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl h-11 flex items-center justify-center gap-2 shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">WhatsApp Vishal</span>
          </Button>

          <Button
            onClick={(e) => handleWhatsAppContact(e, '919773757759', 'Kapil')}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-2xl h-11 flex items-center justify-center gap-2 shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">WhatsApp Kapil</span>
          </Button>
        </div>

        {/* Footer Metadata */}
        {property.custom_id && (
          <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-purple-600">{property.custom_id}</span>
            {property.views_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {property.views_count}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}