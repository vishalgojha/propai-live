
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Maximize2, Car, MessageCircle, Eye, MoreVertical, Share2, Sparkles, Home as HomeIcon, Clock, Instagram, Facebook, Twitter, Link as LinkIcon, Camera, Building2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom"; // Assuming react-router-dom for useNavigate

// Placeholder for createPageUrl function. In a real app, this would likely be imported from a utility file.
// Adjust the return value based on your actual routing structure.
const createPageUrl = (pageName) => {
  switch (pageName) {
    case "PropertyDetails":
      return "/property-details";
    default:
      return "/";
  }
};

export default function PropertyCard({ property, onViewDetails }) {
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const navigate = useNavigate();

  const formatPrice = () => {
    if (!property.price) return "N/A";

    // All prices are stored in lakhs, so we just need to display them correctly
    const priceInLakhs = property.price;

    if (priceInLakhs >= 100) {
      // Display as Crores if 100 lakhs or more
      return `₹${(priceInLakhs / 100).toFixed(2)} Cr`;
    } else if (priceInLakhs < 1) {
      // Display as Thousands (K) if less than 1 lakh
      return `₹${(priceInLakhs * 100).toFixed(0)}K`;
    } else {
      // Display as Lakhs
      return `₹${priceInLakhs.toFixed(2)}L`;
    }
  };

  const getFullPropertyDetails = () => {
    const details = [];
    
    // Basic info
    details.push(`📍 Property: ${property.ai_title || `${property.bhk} in ${property.location}`}`);
    details.push(`💰 Price: ${formatPrice()}`);
    details.push(`🏠 Type: ${property.listing_type} | ${property.property_type || 'Apartment'}`);
    
    // Location details
    if (property.building_name) details.push(`🏢 Building: ${property.building_name}`);
    if (property.location) details.push(`📌 Location: ${property.location}`);
    if (property.pocket) details.push(`📍 Area: ${property.pocket}`);
    
    // Property specs
    if (property.carpet_area) details.push(`📐 Carpet Area: ${property.carpet_area} sq.ft`);
    if (property.built_up_area) details.push(`📏 Built-up: ${property.built_up_area} sq.ft`);
    if (property.furnishing) details.push(`🪑 Furnishing: ${property.furnishing}`);
    if (property.parking) details.push(`🚗 Parking: ${property.parking}`);
    if (property.floor) details.push(`🏗️ Floor: ${property.floor}${property.total_floors ? ` of ${property.total_floors}` : ''}`);
    if (property.possession) details.push(`📅 Possession: ${property.possession}`);
    if (property.view) details.push(`🌅 View: ${property.view}`);
    
    // Additional info
    if (property.veg_nonveg && property.veg_nonveg !== 'N/A') details.push(`🍽️ Food: ${property.veg_nonveg}`);
    if (property.amenities && property.amenities.length > 0) {
      details.push(`✨ Amenities: ${property.amenities.slice(0, 5).join(', ')}${property.amenities.length > 5 ? '...' : ''}`);
    }
    
    // Reference ID
    if (property.custom_id) details.push(`🔖 Ref ID: ${property.custom_id}`);
    
    return details.join('\n');
  };

  const handleWhatsApp = (agentName) => {
    const phone = agentName === "Kapil" ? "919773757759" : "919819471310";
    
    const message = `Hi ${agentName}, I'm interested in this property from Chariot Realty SmartFeed:\n\n${getFullPropertyDetails()}\n\n${property.ai_description ? `📝 ${property.ai_description}\n\n` : ''}Please share:\n✅ Latest photos\n✅ Availability status\n✅ Viewing schedule\n\nThank you!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBrokerWhatsApp = () => {
    const message = `Hi, this is Chariot Realty.\n\nPlease confirm details for:\n\n${getFullPropertyDetails()}\n\nNeed:\n✅ Current availability status\n✅ Latest photos (if not shared)\n✅ Any price/terms changes\n✅ Best viewing times\n\nPlease reply at your earliest. Thanks!`;
    
    const phone = property.broker_contact?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleViewDetails = () => {
    // Navigate to dedicated property details page
    navigate(createPageUrl("PropertyDetails") + `?id=${property.id}`);
  };

  const getShareUrl = () => {
    return `${window.location.origin}${createPageUrl("PropertyDetails")}?id=${property.id}`;
  };

  const getShareText = () => {
    const details = [];
    details.push(`🏠 ${property.ai_title || `${property.bhk} in ${property.location}`}`);
    details.push(`💰 ${formatPrice()} | ${property.listing_type}`);
    if (property.building_name) details.push(`🏢 ${property.building_name}`);
    details.push(`📍 ${property.location}${property.pocket ? `, ${property.pocket}` : ''}`);
    if (property.carpet_area) details.push(`📐 ${property.carpet_area} sq.ft`);
    if (property.furnishing) details.push(`🪑 ${property.furnishing}`);
    if (property.parking) details.push(`🚗 ${property.parking}`);
    
    details.push('\n📱 View full details on Chariot Realty');
    details.push('✨ Verified listings | Transparent pricing | No spam');
    
    return details.join('\n');
  };

  const handleShare = async () => {
    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.ai_title || `${property.bhk} in ${property.location}`,
          text: getShareText(),
          url: getShareUrl()
        });
        return;
      } catch (err) {
        // User cancelled or error, fall through to modal
      }
    }
    // Open share modal
    setShareModalOpen(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShareModalOpen(false);
    }, 2000);
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()}\n\n${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleInstagram = () => {
    window.open('https://instagram.com/chariotrealty.in', '_blank');
  };

  const statusColors = {
    Active: "bg-[#FFD300]/20 text-black border-[#FFD300]",
    Draft: "bg-orange-500/20 text-orange-900 border-orange-300",
    "On Hold": "bg-gray-500/20 text-gray-900 border-gray-300",
    Sold: "bg-red-500/20 text-red-900 border-red-300",
    Rented: "bg-green-500/20 text-green-900 border-green-300"
  };

  const getFreshnessTag = () => {
    const daysOld = Math.floor((Date.now() - new Date(property.created_date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysOld === 0) return { text: "Just In", color: "bg-green-500", icon: "🟢" };
    if (daysOld <= 2) return { text: `${daysOld}d ago`, color: "bg-green-500", icon: "🟢" };
    if (daysOld <= 7) return { text: `${daysOld}d ago`, color: "bg-orange-500", icon: "🟠" };
    return { text: "Older Listing", color: "bg-gray-400", icon: "⚪" };
  };

  const freshnessTag = getFreshnessTag();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleViewDetails}
        className="bg-white rounded-[22px] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-[#F7F7F7] hover:border-[#FFD300]/50 group"
      >
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-stone-100 to-stone-50 px-6 pt-6 pb-4 border-b border-stone-200/30">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
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
                {property.images && property.images.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="flex items-center gap-1 cursor-help border-stone-300">
                          <Camera className="w-3 h-3" />
                          {property.images.length}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{property.images.length} photo{property.images.length > 1 ? 's' : ''} available</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              {/* Building Name */}
              {property.building_name && (
                <div className="flex items-center gap-1.5 text-sm font-bold text-stone-800 mb-2">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{property.building_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1.5 text-sm text-stone-600">
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                <span className="font-medium">{property.location || property.location_id?.split(',')[0] || "Mumbai"}</span>
                {property.pocket && (
                  <>
                    <span className="text-stone-400">•</span>
                    <span className="text-xs">{property.pocket}</span>
                  </>
                )}
              </div>
            </div>

            {/* Admin actions (removed from UI as isAdmin prop is no longer passed) */}
          </div>
        </div>

        {/* Core Info Section */}
        <div className="p-6">
          {/* AI Title - NO TRUNCATION */}
          {property.ai_title && (
            <h3 className="text-lg font-bold text-stone-900 mb-3 leading-tight">
              {property.ai_title}
            </h3>
          )}

          {/* AI Description - NO TRUNCATION (4 lines max) */}
          {property.ai_description && (
            <div className="mb-5 p-3 bg-white/60 rounded-2xl border border-stone-200/50">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-stone-700 leading-relaxed line-clamp-4">
                  {property.ai_description}
                </p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-3 gap-2 mb-5">
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
            <div className="flex flex-wrap gap-2 mb-5">
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
          <div className="flex items-center justify-between text-xs text-stone-500 mb-5 pb-5 border-b border-stone-200">
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

          {/* Price & Action Button */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#F7F7F7]">
            <div>
              <p className="text-xs text-[#3B3B3B]/60 mb-1 uppercase tracking-wide">
                {property.listing_type === "Rent" ? "Rent/Month" : "Price"}
              </p>
              <p className="text-2xl font-black text-[#111111] tracking-tight">
                {formatPrice()}
              </p>
            </div>
            <Button
              onClick={handleViewDetails}
              className="bg-[#FFD300] hover:bg-[#FFC700] text-black font-bold h-11 px-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105"
            >
              View Details
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="px-6 pb-5">
          <div className="text-center text-xs text-stone-400 font-light">
            Powered by <span className="font-semibold text-stone-600">Chariot Realty</span>
          </div>
        </div>
      </motion.div>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FFD300] rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              Share Property
            </DialogTitle>
          </DialogHeader>
          
          {/* Property Preview in Share Modal */}
          <div className="bg-[#F7F7F7] rounded-2xl p-4 mb-4">
            <h4 className="font-bold text-sm text-[#111111] mb-2">
              {property.ai_title || `${property.bhk} in ${property.location}`}
            </h4>
            <div className="space-y-1 text-xs text-[#3B3B3B]">
              <p className="font-bold text-amber-600">{formatPrice()} • {property.listing_type}</p>
              {property.building_name && <p>🏢 {property.building_name}</p>}
              <p>📍 {property.location}{property.pocket ? `, ${property.pocket}` : ''}</p>
              {property.carpet_area && <p>📐 {property.carpet_area} sq.ft</p>}
              {property.furnishing && <p>🪑 {property.furnishing}</p>}
            </div>
            
            {/* Chariot Branding */}
            <div className="mt-3 pt-3 border-t border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-black" />
                </div>
                <p className="text-xs font-semibold text-[#111111]">Chariot Realty</p>
              </div>
              <p className="text-xs text-[#3B3B3B] mt-1">Verified listings • Transparent pricing</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={shareToWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white justify-start"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              Share on WhatsApp
            </Button>
            <Button
              onClick={shareToFacebook}
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white justify-start"
            >
              <Facebook className="w-5 h-5 mr-3" />
              Share on Facebook
            </Button>
            <Button
              onClick={shareToTwitter}
              className="w-full bg-[#1DA1F2] hover:bg-[#1A91DA] text-white justify-start"
            >
              <Twitter className="w-5 h-5 mr-3" />
              Share on Twitter
            </Button>
            <Button
              onClick={copyShareLink}
              variant="outline"
              className="w-full justify-start"
            >
              <LinkIcon className="w-5 h-5 mr-3" />
              {copied ? "✅ Link Copied!" : "Copy Link"}
            </Button>
          </div>
          
          {/* Share URL Preview */}
          <div className="bg-stone-50 rounded-lg p-3 mt-2">
            <p className="text-xs text-stone-500 mb-1">Share link:</p>
            <p className="text-xs text-stone-700 font-mono break-all">{getShareUrl()}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
