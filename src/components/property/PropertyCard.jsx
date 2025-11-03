
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Maximize2, Car, Eye, MessageCircle,
  Armchair, Shield, Camera, Building2, Phone
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

  const getLocationDisplay = () => {
    const parts = [];
    if (property.pocket) parts.push(property.pocket);
    if (property.location) parts.push(property.location);
    return parts.join(', ') || property.location_id || 'Mumbai';
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
      {/* Image Section with Fallback */}
      <div className="relative h-48 bg-gradient-to-br from-stone-100 to-stone-200 overflow-hidden">
        {hasImages ? (
          <>
            <img 
              src={property.images[0]} 
              alt={property.ai_title || property.bhk}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-stone-400">
            <Building2 className="w-16 h-16 mb-2" />
            <span className="text-sm">No photos yet</span>
          </div>
        )}
        
        {/* Top Badges Row */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-black/90 backdrop-blur text-white border-0 font-bold text-xs px-2 py-1">
              {property.bhk}
            </Badge>
            {property.jodi_flag && (
              <Badge className="bg-purple-600/90 backdrop-blur text-white border-0 font-bold text-xs px-2 py-1">
                JODI
              </Badge>
            )}
            {property.broker_trust_score && property.broker_trust_score >= 70 && (
              <Badge className="bg-green-600/90 backdrop-blur text-white border-0 flex items-center gap-1 text-xs px-2 py-1">
                <Shield className="w-3 h-3" />
                Verified
              </Badge>
            )}
          </div>
          {hasImages && (
            <Badge className="bg-white/90 backdrop-blur text-stone-700 border-0 text-xs px-2 py-1 flex items-center gap-1">
              <Camera className="w-3 h-3" />
              {property.images.length}
            </Badge>
          )}
        </div>

        {/* Status & ID Bottom Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pb-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-green-500 text-white border-0 text-xs px-2 py-1">
              Active
            </Badge>
            {property.custom_id && (
              <span className="text-xs font-mono text-white/90 bg-black/40 backdrop-blur px-2 py-1 rounded">
                {property.custom_id}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
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

        {/* Location Details */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <MapPin className="w-4 h-4 text-stone-500 flex-shrink-0" />
            <span className="line-clamp-1">{getLocationDisplay()}</span>
          </div>
          {property.building_name && (
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Building2 className="w-4 h-4 text-stone-500 flex-shrink-0" />
              <span className="line-clamp-1">{property.building_name}</span>
            </div>
          )}
        </div>

        {/* Key Stats Grid - Compact */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-stone-50 rounded-xl">
            <Maximize2 className="w-4 h-4 text-stone-600 mx-auto mb-1" />
            <p className="text-sm font-bold text-[#111111]">{property.carpet_area || 'N/A'}</p>
            <p className="text-xs text-stone-500">sq ft</p>
          </div>
          <div className="text-center p-2 bg-stone-50 rounded-xl">
            <Armchair className="w-4 h-4 text-stone-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-[#111111] truncate px-1">{property.furnishing || 'N/A'}</p>
            <p className="text-xs text-stone-500">Furnish</p>
          </div>
          <div className="text-center p-2 bg-stone-50 rounded-xl">
            <Car className="w-4 h-4 text-stone-600 mx-auto mb-1" />
            <p className="text-sm font-bold text-[#111111]">{property.parking || '0'}</p>
            <p className="text-xs text-stone-500">Parking</p>
          </div>
        </div>

        {/* WhatsApp Contact Buttons - Stacked on Mobile */}
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
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{property.views_count || 0} views</span>
          </div>
          {property.expat_friendly && (
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
              🌍 Expat Friendly
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}
