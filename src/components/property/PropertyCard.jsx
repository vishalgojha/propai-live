import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Maximize2, Car, MessageCircle, Eye, MoreVertical, Share2, Camera, Sparkles, Home as HomeIcon, Clock, Instagram } from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PropertyCard({ property, onViewDetails, isAdmin = false }) {
  const [copied, setCopied] = useState(false);

  const formatPrice = () => {
    if (property.price_unit === "crores") {
      return `₹${property.price} Cr`;
    }
    return `₹${property.price}L`;
  };

  const getAgentPhone = () => {
    if (property.assigned_agent === "Kapil") {
      return "919773757759";
    }
    return "919819471310";
  };

  const getAgentName = () => {
    return property.assigned_agent || "Vishal";
  };

  const getFreshnessTag = () => {
    const daysOld = Math.floor((Date.now() - new Date(property.created_date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysOld === 0) return { text: "Just In", color: "bg-green-500", icon: "🟢" };
    if (daysOld <= 2) return { text: `${daysOld}d ago`, color: "bg-green-500", icon: "🟢" };
    if (daysOld <= 7) return { text: `${daysOld}d ago`, color: "bg-orange-500", icon: "🟠" };
    return { text: "Older Listing", color: "bg-gray-400", icon: "⚪" };
  };

  const getAISummary = () => {
    if (property.ai_description) {
      // Extract first sentence or create short summary
      const sentences = property.ai_description.split('.');
      return sentences[0] + '.';
    }
    return `${property.bhk} with modern amenities in ${property.location}`;
  };

  const handleWhatsApp = () => {
    const locationText = property.location || property.location_id || "Mumbai";
    const message = `Hi ${getAgentName()}, I saw this property on Chariot Realty SmartFeed.\n\n${property.ai_title || property.bhk + ' in ' + locationText}\n${formatPrice()}\n\nCan you share more details and photos?`;
    const phone = getAgentPhone();
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBrokerWhatsApp = () => {
    const locationText = property.location || property.location_id || "Mumbai";
    const message = `Hi, Chariot Realty here. Please confirm availability and share photos for:\n\n${property.bhk} in ${locationText}\n${property.building_name || ''}\nRef: ${property.custom_id || property.id}`;
    const phone = property.broker_contact?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleShare = async () => {
    const title = property.ai_title || `${property.bhk} in ${property.location || ''}`;
    const shareData = {
      title: title,
      text: `Check out this property: ${title}\n${formatPrice()}\n\nView on Chariot Realty`,
      url: `${window.location.origin}/property/${property.slug || property.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyShareLink();
      }
    } else {
      copyShareLink();
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/property/${property.slug || property.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstagram = () => {
    window.open('https://instagram.com/chariotrealtors', '_blank');
  };

  const statusColors = {
    Active: "bg-[#FFD300]/20 text-black border-[#FFD300]",
    Draft: "bg-orange-500/20 text-orange-900 border-orange-300",
    "On Hold": "bg-gray-500/20 text-gray-900 border-gray-300",
    Sold: "bg-red-500/20 text-red-900 border-red-300",
    Rented: "bg-green-500/20 text-green-900 border-green-300"
  };

  const freshnessTag = getFreshnessTag();
  const imageCount = property.images?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-gradient-to-br from-stone-50 to-stone-100 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-stone-200/50"
    >
      {/* Header Section - Property Type & Location */}
      <div className="relative bg-gradient-to-r from-stone-100 to-stone-50 px-5 pt-5 pb-3 border-b border-stone-200/30">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-black text-white font-bold text-xs px-3 py-1 rounded-full border-0">
                {property.bhk}
              </Badge>
              {property.jodi_flag && (
                <Badge className="bg-purple-500/20 text-purple-900 border-purple-500 font-bold text-xs px-3 py-1 rounded-full">
                  JODI
                </Badge>
              )}
              {freshnessTag && (
                <Badge className={`${freshnessTag.color} text-white font-semibold text-xs px-2 py-0.5 rounded-full border-0`}>
                  {freshnessTag.icon} {freshnessTag.text}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-stone-600">
              <MapPin className="w-3.5 h-3.5 text-[#FFD300]" />
              <span className="font-medium">{property.location || property.location_id?.split(',')[0] || "Mumbai"}</span>
              {property.pocket && (
                <>
                  <span className="text-stone-400">•</span>
                  <span className="text-xs">{property.pocket}</span>
                </>
              )}
            </div>
          </div>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 hover:bg-white/50 rounded-xl transition-colors">
                  <MoreVertical className="w-4 h-4 text-stone-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(property)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {property.broker_contact && (
                  <DropdownMenuItem onClick={handleBrokerWhatsApp}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Broker
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Image Section - Smart Display */}
      {property.images && property.images.length > 0 ? (
        <div className="relative h-56 bg-gradient-to-br from-stone-200 to-stone-300">
          <img
            src={property.images[0]}
            alt={property.building_name || property.bhk}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Image Count Badge */}
          {imageCount > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              {imageCount}
            </div>
          )}

          {/* Featured Badge */}
          {property.featured && (
            <div className="absolute top-3 left-3 bg-[#FFD300] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Featured
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-56 bg-gradient-to-br from-stone-200 to-stone-300 flex flex-col items-center justify-center border-y border-stone-200/50">
          <div className="w-20 h-20 bg-white/80 rounded-3xl flex items-center justify-center mb-3 shadow-sm">
            <Camera className="w-10 h-10 text-stone-400" />
          </div>
          <p className="text-xs text-stone-500 font-semibold">📸 Photos Available on WhatsApp</p>
          {property.broker_contact && (
            <p className="text-xs text-stone-400 mt-1">Request from broker</p>
          )}
        </div>
      )}

      {/* Core Info Section */}
      <div className="p-5">
        {/* Price - Bold Display */}
        <div className="mb-4">
          <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-1">
            {formatPrice()}
          </p>
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">
            {property.listing_type} • {property.property_type || "Apartment"}
          </p>
        </div>

        {/* AI Summary Line */}
        {property.ai_description && (
          <div className="mb-4 p-3 bg-white/60 rounded-2xl border border-stone-200/50">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-stone-700 leading-relaxed line-clamp-2">
                {getAISummary()}
              </p>
            </div>
          </div>
        )}

        {/* Details Grid - Clean Chips */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/70 rounded-xl p-3 text-center border border-stone-200/50">
            <div className="flex items-center justify-center mb-1">
              <Maximize2 className="w-4 h-4 text-stone-600" />
            </div>
            <p className="text-sm font-bold text-stone-900">{property.carpet_area || "N/A"}</p>
            <p className="text-xs text-stone-500">sq.ft</p>
          </div>
          
          <div className="bg-white/70 rounded-xl p-3 text-center border border-stone-200/50">
            <div className="flex items-center justify-center mb-1">
              <Car className="w-4 h-4 text-stone-600" />
            </div>
            <p className="text-sm font-bold text-stone-900">{property.parking?.split(' ')[0] || "N/A"}</p>
            <p className="text-xs text-stone-500">Parking</p>
          </div>
          
          <div className="bg-white/70 rounded-xl p-3 text-center border border-stone-200/50">
            <div className="flex items-center justify-center mb-1">
              <HomeIcon className="w-4 h-4 text-stone-600" />
            </div>
            <p className="text-sm font-bold text-stone-900 truncate">
              {property.furnishing ? property.furnishing.split(' ')[0].split('-')[0] : "N/A"}
            </p>
            <p className="text-xs text-stone-500">Furnish</p>
          </div>
        </div>

        {/* Highlights Chips */}
        {(property.view || property.floor || property.amenities?.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {property.view && (
              <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50 rounded-full">
                {property.view}
              </Badge>
            )}
            {property.floor && (
              <Badge variant="outline" className="text-xs border-stone-300 text-stone-700 bg-white rounded-full">
                Floor {property.floor}
              </Badge>
            )}
            {property.amenities?.slice(0, 2).map((amenity, idx) => (
              <Badge key={idx} variant="outline" className="text-xs border-stone-300 text-stone-700 bg-white rounded-full">
                {amenity}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer Metadata */}
        <div className="flex items-center justify-between text-xs text-stone-500 mb-4 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {property.views_count || 0}
            </span>
            {property.custom_id && (
              <span className="font-mono text-stone-400">ID: {property.custom_id}</span>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(property.created_date), "MMM dd")}
          </span>
        </div>

        {/* CTA Section - Bottom Bar */}
        <div className="space-y-2">
          {/* Primary CTA - WhatsApp */}
          <Button
            onClick={handleWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white gap-2 shadow-lg shadow-[#25D366]/20 font-bold h-12 rounded-2xl"
          >
            <MessageCircle className="w-4 h-4" />
            Contact {getAgentName()}
          </Button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="border-stone-300 hover:bg-white text-stone-700 font-semibold rounded-xl"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              {copied ? "Copied!" : "Share"}
            </Button>
            <Button
              onClick={handleInstagram}
              variant="outline"
              size="sm"
              className="border-stone-300 hover:bg-white text-stone-700 font-semibold rounded-xl"
            >
              <Instagram className="w-3.5 h-3.5 mr-1.5" />
              Instagram
            </Button>
          </div>
        </div>

        {/* Expat Friendly Tag (if applicable) */}
        {property.veg_nonveg === "Both" && (
          <div className="mt-3 text-center">
            <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-xs rounded-full">
              🌍 Expat Friendly
            </Badge>
          </div>
        )}
      </div>

      {/* Broker Reference Panel (Admin Only) */}
      {isAdmin && property.broker_contact && (
        <div className="px-5 pb-5">
          <div className="bg-stone-100/80 rounded-2xl p-3 border border-stone-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500 mb-1">Ref Broker</p>
                <p className="text-sm font-bold text-stone-900">
                  {property.broker_id ? `Broker #${property.broker_id.slice(0, 8)}` : 'Unknown'}
                </p>
                <p className="text-xs text-stone-600 mt-1">{property.broker_contact}</p>
              </div>
              <Button
                onClick={handleBrokerWhatsApp}
                size="sm"
                variant="outline"
                className="text-xs border-stone-300 rounded-xl"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Contact
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Branding Footer (Subtle) */}
      <div className="px-5 pb-4">
        <div className="text-center text-xs text-stone-400 font-light">
          Powered by <span className="font-semibold text-stone-600">Chariot Realty</span> • PropAI
        </div>
      </div>
    </motion.div>
  );
}