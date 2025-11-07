
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Maximize2, MessageCircle,
  Armchair, Shield, Eye, Home, Camera, Calendar, ChevronDown, ChevronUp, Share2, Facebook, Twitter, Link as LinkIcon, Linkedin
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper function to create page URLs.
const createPageUrl = (pageName) => {
  switch (pageName) {
    case "PropertyDetails":
      return "/propertydetails"; // Changed from "/p/"
    default:
      return "/";
  }
};

export default function PropertyCard({ property, onViewDetails }) {
  const navigate = useNavigate();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleWhatsAppContact = (e, phone, contactName = '') => {
    e.stopPropagation();
    
    if (!phone) {
      alert(`⚠️ Broker contact not available.\n\nPlease update broker contact info in Admin → Brokers.`);
      return;
    }
    
    const message = `Hi${contactName ? ` ${contactName}` : ''}, I'm interested in this property:\n\n` +
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
      navigate(`${createPageUrl("PropertyDetails")}?slug=${property.slug}`);
    } else if (property.id) {
      navigate(`${createPageUrl("PropertyDetails")}?id=${property.id}`);
    } else {
      onViewDetails(property);
    }
  };

  const getShareUrl = () => {
    if (property.slug) {
      return `${window.location.origin}${createPageUrl("PropertyDetails")}?slug=${property.slug}`;
    }
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
    
    details.push('\n📱 View on PropAI Live');
    details.push('✨ Verified listings | Transparent pricing');
    
    return details.join('\n');
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.ai_title || `${property.bhk} in ${property.location}`,
          text: getShareText(),
          url: getShareUrl()
        });
        return;
      } catch (err) {
        // User cancelled or error
      }
    }
    setShareModalOpen(true);
  };

  const copyShareLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToFacebook = (e) => {
    e.stopPropagation();
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = (e) => {
    e.stopPropagation();
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = (e) => {
    e.stopPropagation();
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = (e) => {
    e.stopPropagation();
    const text = encodeURIComponent(`${getShareText()}\n\n${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Use cached broker contact from property instead of loading full broker entity
  const primaryContact = property.broker_contact || property.assigned_agent_phone || '919819471310';
  const hasContact = !!property.broker_contact;

  const hasImages = property.images && property.images.length > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden border-2 border-purple-200/50 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
        onClick={handleCardClick}
      >
        <div className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-wrap gap-1">
              {property.listing_type && (
                <Badge className="bg-white border border-purple-200 text-purple-700 font-semibold text-xs px-1.5 py-0.5">
                  {property.listing_type}
                </Badge>
              )}
              {property.broker_trust_score >= 85 && (
                <Badge className="bg-green-500/20 text-green-700 border-green-500 font-semibold text-xs px-1.5 py-0.5">
                  <Shield className="w-2.5 h-2.5 mr-0.5" />
                  ✓
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {hasImages && (
                <div className="flex items-center gap-0.5 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                  <Camera className="w-2.5 h-2.5" />
                  <span className="font-medium text-xs">{property.images.length}</span>
                </div>
              )}
              <button
                onClick={handleShare}
                className="flex items-center text-xs text-slate-600 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 p-1 rounded transition-colors"
              >
                <Share2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-2 leading-tight group-hover:text-purple-700 transition-colors">
            {property.ai_title || `${property.bhk} in ${property.location}`}
          </h3>

          <div className="flex items-center gap-1 text-xs text-slate-600 mb-1.5">
            <MapPin className="w-3 h-3 text-purple-500 flex-shrink-0" />
            <span className="truncate text-xs">
              {property.building_name ? `${property.building_name}, ` : ''}
              {property.location}
            </span>
          </div>

          {property.ai_description && (
            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              {property.ai_description}
            </p>
          )}

          <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-purple-100">
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {formatPrice()}
              </span>
            </div>
            {property.carpet_area && (
              <span className="text-xs text-slate-500">
                {property.carpet_area} sq.ft
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1 mb-2">
            <div className="bg-purple-50/80 backdrop-blur-sm rounded-lg p-1 text-center border border-purple-100">
              <Home className="w-3 h-3 text-purple-600 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-slate-900 truncate">{property.bhk}</p>
            </div>
            <div className="bg-purple-50/80 backdrop-blur-sm rounded-lg p-1 text-center border border-purple-100">
              <Maximize2 className="w-3 h-3 text-purple-600 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-slate-900 truncate">{property.carpet_area || 'N/A'}</p>
            </div>
            <div className="bg-purple-50/80 backdrop-blur-sm rounded-lg p-1 text-center border border-purple-100">
              <Armchair className="w-3 h-3 text-purple-600 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-slate-900 truncate">{property.furnishing || 'N/A'}</p>
            </div>
          </div>

          {/* Contact Buttons - Always show using cached contact */}
          {hasContact ? (
            <div className="space-y-1">
              <Button
                onClick={(e) => handleWhatsAppContact(e, primaryContact)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl h-8 flex items-center justify-center gap-1.5 shadow-md text-xs"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp Broker</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <Button
                onClick={(e) => handleWhatsAppContact(e, '919819471310', 'Vishal')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl h-8 flex items-center justify-center gap-1.5 shadow-md text-xs"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Contact Vishal</span>
              </Button>
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
            {property.created_date && (
              <span className="flex items-center gap-0.5 truncate">
                <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{format(new Date(property.created_date), "MMM dd")}</span>
              </span>
            )}
            <div className="flex items-center gap-2">
              {property.views_count > 0 && (
                <span className="flex items-center gap-0.5">
                  <Eye className="w-2.5 h-2.5" />
                  {property.views_count}
                </span>
              )}
              {property.custom_id && (
                <span className="font-mono text-purple-600 text-xs truncate">{property.custom_id}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Property
            </DialogTitle>
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
              onClick={shareToLinkedIn}
              className="w-full bg-[#0A66C2] hover:bg-[#094D92] text-white justify-start"
            >
              <Linkedin className="w-5 h-5 mr-3" />
              Share on LinkedIn
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
          
          <div className="bg-stone-50 rounded-lg p-3 mt-2">
            <p className="text-xs text-stone-500 mb-1">Share link:</p>
            <p className="text-xs text-stone-700 font-mono break-all">{getShareUrl()}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
