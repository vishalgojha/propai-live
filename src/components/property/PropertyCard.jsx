import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Maximize2, Car, MessageCircle, Eye, MoreVertical, Share2, Sparkles, Home as HomeIcon, Clock, Instagram, Facebook, Twitter, Link as LinkIcon } from "lucide-react";
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

export default function PropertyCard({ property, onViewDetails, isAdmin = false }) {
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const formatPrice = () => {
    if (property.price_unit === "crores") {
      return `₹${property.price} Cr`;
    }
    return `₹${property.price}L`;
  };

  const handleWhatsApp = (agentName) => {
    const phone = agentName === "Kapil" ? "919773757759" : "919819471310";
    const locationText = property.location || property.location_id || "Mumbai";
    const message = `Hi ${agentName}, I saw this property on Chariot Realty SmartFeed.\n\n${property.ai_title || property.bhk + ' in ' + locationText}\n${formatPrice()}\n\nCan you share more details and photos?`;
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

  const getShareUrl = () => {
    return `${window.location.origin}/property/${property.slug || property.id}`;
  };

  const getShareText = () => {
    const title = property.ai_title || `${property.bhk} in ${property.location || ''}`;
    return `Check out this property: ${title}\n${formatPrice()}\n\nView on Chariot Realty`;
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
        className="group bg-gradient-to-br from-stone-50 to-stone-100 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-stone-200/50"
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
              </div>
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

        {/* Core Info Section - No Images, More Space for Content */}
        <div className="p-6">
          {/* AI Title */}
          {property.ai_title && (
            <h3 className="text-lg font-bold text-stone-900 mb-3 leading-tight line-clamp-2">
              {property.ai_title}
            </h3>
          )}

          {/* Price */}
          <div className="mb-5">
            <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-2">
              {formatPrice()}
            </p>
            <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">
              {property.listing_type} • {property.property_type || "Apartment"}
            </p>
          </div>

          {/* AI Description */}
          {property.ai_description && (
            <div className="mb-5 p-3 bg-white/60 rounded-2xl border border-stone-200/50">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-stone-700 leading-relaxed line-clamp-3">
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

          {/* CTA Section */}
          <div className="space-y-3">
            {/* Primary CTAs - Both Agents */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleWhatsApp("Vishal")}
                className="bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-sm font-bold h-11 rounded-2xl flex flex-col items-center justify-center py-1 gap-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">Vishal</span>
              </Button>
              <Button
                onClick={() => handleWhatsApp("Kapil")}
                className="bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-sm font-bold h-11 rounded-2xl flex flex-col items-center justify-center py-1 gap-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">Kapil</span>
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="border-stone-300 hover:bg-white text-stone-700 font-semibold rounded-xl"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Share
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

          {/* Expat Friendly Tag */}
          {property.veg_nonveg === "Both" && (
            <div className="mt-4 text-center">
              <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-xs rounded-full">
                🌍 Expat Friendly
              </Badge>
            </div>
          )}
        </div>

        {/* Broker Reference Panel (Admin Only) */}
        {isAdmin && property.broker_contact && (
          <div className="px-6 pb-6">
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
            <DialogTitle>Share Property</DialogTitle>
          </DialogHeader>
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
              {copied ? "Link Copied!" : "Copy Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}