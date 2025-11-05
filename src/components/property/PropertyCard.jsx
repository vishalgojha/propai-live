
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Maximize2, MessageCircle,
  Armchair, Shield, Eye, Home, Camera, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

export default function PropertyCard({ property, onViewDetails }) {
  const navigate = useNavigate(); // This navigate will now be unused unless onViewDetails uses it
  const [user, setUser] = useState(null);
  const [broker, setBroker] = useState(null);
  const [brokerLoading, setBrokerLoading] = useState(true);

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

  useEffect(() => {
    const loadBroker = async () => {
      if (property.broker_id) {
        try {
          setBrokerLoading(true);
          const brokers = await base44.entities.Broker.list();
          const foundBroker = brokers.find(b => b.id === property.broker_id);
          setBroker(foundBroker);
          
          if (!foundBroker) {
            console.warn(`Broker with ID ${property.broker_id} not found for property ${property.custom_id}`);
          }
        } catch (error) {
          console.error("Failed to load broker:", error);
        } finally {
          setBrokerLoading(false);
        }
      } else {
        setBrokerLoading(false);
      }
    };
    loadBroker();
  }, [property.broker_id, property.custom_id]);

  // This function is no longer used for displaying the main price due to outline changes,
  // but kept as it's part of the original file and not explicitly removed by the outline.
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

  const handleCheckAvailability = (e) => {
    e.stopPropagation();
    
    // Check if broker data is still loading
    if (brokerLoading) {
      alert('Loading broker information...');
      return;
    }
    
    // Check if broker exists and has phone
    if (!broker) {
      alert(`⚠️ Broker not found in database.\n\nProperty ID: ${property.custom_id}\nBroker ID: ${property.broker_id || 'Not set'}\n\nPlease contact admin to fix broker mapping.`);
      return;
    }
    
    if (!broker.phone) {
      alert(`⚠️ Broker "${broker.name}" has no phone number.\n\nBroker ID: ${broker.id}\n\nPlease update broker contact info in Admin → Brokers.`);
      return;
    }

    const message = `Hi ${broker.name}, checking availability for:\n\n` +
      `🏠 ${property.ai_title || `${property.bhk} in ${property.location}`}\n` +
      `💰 ${formatPrice()} | ${property.listing_type}\n` +
      `📍 ${property.building_name ? `${property.building_name}, ` : ''}${property.location}\n` +
      `${property.custom_id ? `🔖 ID: ${property.custom_id}\n` : ''}` +
      `\n✅ Is this property still available?\n` +
      `📸 Can you share latest photos?\n\n` +
      `- Chariot Realty Team`;
    
    window.open(`https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // This function is no longer called due to outline changes,
  // but kept as it's part of the original file and not explicitly removed by the outline.
  const handleCardClick = () => {
    if (property.slug) {
      navigate(createPageUrl("PropertyDetails") + `?slug=${property.slug}`);
    } else {
      navigate(createPageUrl("PropertyDetails") + `?id=${property.id}`);
    }
  };

  const hasImages = property.images && property.images.length > 0;
  const isAdmin = user?.role === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-purple-200/50 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
      onClick={() => onViewDetails(property)}
    >
      {/* Content Section */}
      <div className="p-5">
        {/* Header with Badges (retained from original structure, prior to outline's 'Content' section) */}
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

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-purple-700 transition-colors">
          {property.ai_title || `${property.bhk} in ${property.location}`}
        </h3>

        {/* Location & Building */}
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
          <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <span className="truncate">
            {property.building_name ? `${property.building_name}, ` : ''}
            {property.location}
            {property.pocket ? ` (${property.pocket})` : ''}
          </span>
        </div>

        {/* AI Description - NEW: Always show below price */}
        {property.ai_description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-3 leading-relaxed">
            {property.ai_description}
          </p>
        )}

        {/* Price & Key Details */}
        <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-purple-100">
          <div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              ₹{property.price}
            </span>
            <span className="text-lg text-slate-600 ml-1">
              {property.price_unit === 'crores' ? 'Cr' : 'L'}
            </span>
            {property.carpet_area && (
              <span className="text-xs text-slate-500 ml-2">
                • {property.carpet_area} sq.ft
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid (retained from original code) */}
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

        {/* Admin Check Availability Button (retained from original code) */}
        {isAdmin && (
          <Button
            onClick={handleCheckAvailability}
            disabled={brokerLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl h-11 flex items-center justify-center gap-2 shadow-md mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">
              {brokerLoading ? 'Loading...' : broker ? 'Check Availability' : 'Broker Missing'}
            </span>
          </Button>
        )}

        {/* WhatsApp Contact Buttons (retained from original code) */}
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

        {/* Footer Metadata (retained from original code) */}
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
