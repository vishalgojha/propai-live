
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Maximize2, MessageCircle,
  Armchair, Shield, Eye, Home, Camera, Calendar, ChevronDown, ChevronUp, Share2, X, Facebook, Twitter, Link as LinkIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PropertyCard({ property, onViewDetails }) {
  const navigate = useNavigate();
  const [broker, setBroker] = useState(null);
  const [brokerLoading, setBrokerLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
    
    if (!phone) {
      alert(`⚠️ Broker contact not available.\n\nPlease update broker contact info in Admin → Brokers.`);
      return;
    }
    
    const message = `Hi, I'm interested in this property:\n\n` +
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
    } else if (property.id) {
      navigate(createPageUrl("PropertyDetails") + `?id=${property.id}`);
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
        // User cancelled or error - open modal instead
      }
    }
    setShareModalOpen(true);
  };

  const copyShareLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
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

  const shareToWhatsApp = (e) => {
    e.stopPropagation();
    const text = encodeURIComponent(`${getShareText()}\n\n${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const getBrokerContacts = () => {
    if (!broker) return [];
    
    const contacts = [{
      name: broker.name,
      phone: broker.phone
    }];
    
    if (broker.team_members && broker.team_members.length > 0) {
      const teamMember = broker.team_members[0];
      if (teamMember.phone) {
        contacts.push({
          name: teamMember.name,
          phone: teamMember.phone
        });
      }
    }
    
    return contacts.slice(0, 2);
  };

  const hasImages = property.images && property.images.length > 0;
  const brokerContacts = getBrokerContacts();
  
  const isLongDescription = property.ai_description && property.ai_description.length > 150;
  const displayDescription = showFullDescription || !isLongDescription 
    ? property.ai_description 
    : `${property.ai_description.substring(0, 150)}...`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-purple-200/50 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
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
            
            {/* Camera Icon & Share Button */}
            <div className="flex items-center gap-2">
              {hasImages && (
                <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                  <Camera className="w-3 h-3" />
                  <span className="font-medium">{property.images.length}</span>
                </div>
              )}
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 px-2 py-1 rounded-lg transition-colors"
              >
                <Share2 className="w-3 h-3" />
              </button>
            </div>
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

          {/* AI Description */}
          {property.ai_description && (
            <div className="mb-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                {displayDescription}
              </p>
              {isLongDescription && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullDescription(!showFullDescription);
                  }}
                  className="text-xs text-purple-600 hover:text-purple-700 font-semibold mt-1 flex items-center gap-1"
                >
                  {showFullDescription ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show More
                    </>
                  )}
                </button>
              )}
            </div>
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

          {/* Broker WhatsApp Contact Buttons */}
          {brokerLoading ? (
            <div className="space-y-2">
              <div className="h-11 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
          ) : brokerContacts.length > 0 ? (
            <div className="space-y-2">
              {brokerContacts.map((contact, idx) => (
                <Button
                  key={idx}
                  onClick={(e) => handleWhatsAppContact(e, contact.phone, contact.name)}
                  className={`w-full ${
                    idx === 0 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                      : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
                  } text-white font-bold rounded-2xl h-11 flex items-center justify-center gap-2 shadow-md`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">WhatsApp{brokerContacts.length > 1 ? ` ${idx + 1}` : ''}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-xs text-amber-800">Broker contact not available</p>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="mt-3 pt-3 border-t border-purple-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              {property.created_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Posted {format(new Date(property.created_date), "MMM dd, yyyy")}
                </span>
              )}
              {property.views_count > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {property.views_count}
                </span>
              )}
            </div>
            {property.custom_id && (
              <div className="flex items-center justify-between">
                <span className="font-mono text-purple-600 text-xs">{property.custom_id}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Share Modal */}
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
