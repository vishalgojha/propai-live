
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Maximize2, MessageCircle,
  Armchair, Shield, Eye, Home, Calendar, Share2, Facebook, Twitter, Link as LinkIcon, Linkedin, ChevronDown, ChevronUp, Building2, RefreshCw, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
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
      return "/propertydetails";
    case "BuildingProfile":
      return "/buildingprofile";
    default:
      return "/";
  }
};

export default function PropertyCard({ property, onViewDetails }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    loadUser();
  }, []);

  // Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async (propertyId) => {
      const now = new Date().toISOString();
      return base44.entities.Property.update(propertyId, {
        created_date: now,
        last_refreshed: now,
        refresh_count: (property.refresh_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('🔄 Property Refreshed!', {
        description: 'Listing moved to top of feed',
        duration: 3000
      });
    },
    onError: (error) => {
      toast.error('Failed to refresh', {
        description: error.message
      });
    }
  });

  // Check if user can refresh this property
  const canRefresh = () => {
    if (!currentUser) return false;
    
    // Admin can refresh any property
    if (currentUser.role === 'admin') return true;
    
    // Broker can refresh their own properties
    // Check if user's email matches broker contact (for registered brokers)
    if (currentUser.email && property.broker_contact) {
      // Normalize phone numbers for comparison
      const normalizedUserPhone = currentUser.email.replace(/\D/g, '');
      const normalizedBrokerPhone = property.broker_contact.replace(/\D/g, '');
      if (normalizedUserPhone === normalizedBrokerPhone) return true;
    }
    
    return false;
  };

  // Check if property can be refreshed (24 hour cooldown)
  const canRefreshNow = () => {
    if (!property.last_refreshed) return true;
    
    const lastRefresh = new Date(property.last_refreshed);
    const now = new Date();
    const hoursSinceRefresh = (now - lastRefresh) / (1000 * 60 * 60);
    
    return hoursSinceRefresh >= 24;
  };

  const handleRefresh = async (e) => {
    e.stopPropagation();
    
    if (!canRefreshNow()) {
      const lastRefresh = new Date(property.last_refreshed);
      const now = new Date();
      const hoursSinceRefresh = Math.floor((now - lastRefresh) / (1000 * 60 * 60));
      const hoursRemaining = 24 - hoursSinceRefresh;
      
      toast.warning('⏰ Refresh Cooldown', {
        description: `You can refresh again in ${hoursRemaining} hours`,
        duration: 3000
      });
      return;
    }
    
    setIsRefreshing(true);
    await refreshMutation.mutateAsync(property.id);
    setIsRefreshing(false);
  };

  // Track property contact when WhatsApp is clicked
  const trackPropertyContact = async (property, contactedVia) => {
    try {
      // Local storage tracking (for user preferences)
      const contactHistory = JSON.parse(localStorage.getItem('propai_contact_history') || '[]');
      contactHistory.push({
        id: property.id,
        bhk: property.bhk,
        location: property.location,
        price: property.price,
        price_unit: property.price_unit,
        listing_type: property.listing_type,
        timestamp: new Date().toISOString()
      });
      
      const recentContacts = contactHistory.slice(-50);
      localStorage.setItem('propai_contact_history', JSON.stringify(recentContacts));

      // Server-side tracking (for analytics)
      await base44.functions.invoke('trackContactInteraction', {
        property_id: property.id,
        broker_id: property.broker_id || null,
        interaction_type: 'whatsapp',
        broker_contact: property.broker_contact || null,
        contacted_via: contactedVia // 'broker' or 'propai_office'
      });
    } catch (error) {
      console.error('Failed to track contact:', error);
      // Don't block the user flow if tracking fails
    }
  };

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

  const getPropertyUrl = () => {
    if (property.slug) {
      return `${window.location.origin}/propertydetails?slug=${property.slug}`;
    }
    return `${window.location.origin}/propertydetails?id=${property.id}`;
  };

  const handleWhatsAppContact = async (e) => {
    e.stopPropagation();
    
    // Determine phone and contact name
    const primaryContact = (property.broker_contact && 
                           property.broker_contact !== '919819471310' && 
                           property.broker_contact !== '9102269622278') 
      ? property.broker_contact 
      : '9102269622278';
    
    const hasRealBroker = property.broker_contact && 
                         property.broker_contact !== '9102269622278' && 
                         property.broker_contact !== '919819471310';
    
    // Use cached broker_name if available, otherwise use generic name
    const contactName = hasRealBroker 
      ? (property.broker_name || 'Broker')
      : 'PropAI Team';
    
    if (!primaryContact) {
      alert(`⚠️ Contact not available.\n\nPlease update contact info in Admin.`);
      return;
    }

    // Track the contact
    const contactedVia = hasRealBroker ? 'broker' : 'propai_office';
    await trackPropertyContact(property, contactedVia);
    
    const propertyLink = getPropertyUrl();
    
    const message = `Hi${contactName !== 'Broker' && contactName !== 'PropAI Team' ? ` ${contactName}` : ''}, I'm interested in this property:\n\n` +
      `🏠 ${property.ai_title || `${property.bhk} in ${property.location}`}\n` +
      `💰 ${formatPrice()} | ${property.listing_type}\n` +
      `📍 ${property.building_name ? `${property.building_name}, ` : ''}${property.location}\n` +
      `${property.custom_id ? `🔖 ID: ${property.custom_id}\n` : ''}` +
      `\nFound via www.propai.live\n\n` +
      `📱 View Full Details: ${propertyLink}\n\n` +
      `Please share more details.\n\n` +
      `Thank you!`;
    
    window.open(`https://wa.me/${primaryContact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
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

  const handleBuildingClick = (e, buildingId) => {
    e.stopPropagation();
    navigate(`${createPageUrl("BuildingProfile")}?id=${buildingId}`);
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

  // Determine contact button label with ONLY first name
  const hasRealBroker = property.broker_contact && 
                       property.broker_contact !== '9102269622278' && 
                       property.broker_contact !== '919819471310';
  
  // Extract first name only (before first space)
  const getFirstName = (fullName) => {
    if (!fullName) return 'Broker';
    return fullName.split(' ')[0];
  };
  
  const contactButtonLabel = hasRealBroker 
    ? getFirstName(property.broker_name)
    : 'PropAI Team';

  // Check if description is long (more than 120 characters)
  const isDescriptionLong = property.ai_description && property.ai_description.length > 120;
  const displayedDescription = isDescriptionLong && !descriptionExpanded 
    ? property.ai_description.substring(0, 120) + '...' 
    : property.ai_description;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-purple-200/50 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
        onClick={handleCardClick}
      >
        {/* Main Content Section */}
        <div className="p-4">
          {/* Badges, Share and Refresh at top */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap gap-1.5">
              {property.listing_type && (
                <Badge className="bg-purple-100 border border-purple-300 text-purple-700 font-semibold text-xs">
                  {property.listing_type}
                </Badge>
              )}
              {property.broker_trust_score >= 85 && (
                <Badge className="bg-green-100 text-green-700 border-green-300 font-semibold text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  BROKERTRUST
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="flex items-center text-xs text-slate-600 hover:text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              
              {/* Refresh Button - Only for owner/admin */}
              {canRefresh() && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`flex items-center text-xs p-1.5 rounded-lg transition-colors ${
                    canRefreshNow()
                      ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                  title={canRefreshNow() ? 'Refresh listing (brings to top)' : 'Can refresh in 24 hours'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-2 leading-tight group-hover:text-purple-700 transition-colors">
            {property.ai_title || `${property.bhk} in ${property.location}`}
          </h3>

          {/* Building Name as Clickable Chip */}
          {property.building_name && property.building_id && (
            <button
              onClick={(e) => handleBuildingClick(e, property.building_id)}
              className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-xl border border-indigo-200 hover:border-indigo-300 transition-all group/building"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600 group-hover/building:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-indigo-700 group-hover/building:text-indigo-800">
                {property.building_name}
              </span>
            </button>
          )}

          {/* Location with Pocket */}
          <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
            <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <span className="truncate">
              {property.pocket ? (
                <>
                  <span className="font-semibold text-slate-800">{property.pocket}</span>
                  <span className="text-slate-500 mx-1">•</span>
                  <span>{property.location}</span>
                </>
              ) : (
                property.location
              )}
            </span>
          </div>

          {/* PRICE */}
          <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-purple-100">
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {formatPrice()}
              </span>
            </div>
            {property.carpet_area && (
              <span className="text-sm text-slate-500">
                {property.carpet_area} sq.ft
              </span>
            )}
          </div>

          {/* AI DESCRIPTION */}
          {property.ai_description && (
            <div className="mb-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {displayedDescription}
              </p>
              {isDescriptionLong && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDescriptionExpanded(!descriptionExpanded);
                  }}
                  className="text-xs text-purple-600 hover:text-purple-700 font-semibold mt-1 flex items-center gap-1"
                >
                  {descriptionExpanded ? (
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

          {/* AMENITIES - Show top 3 - PURPLE THEME */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-3 flex items-center gap-1.5 flex-wrap">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              {property.amenities.slice(0, 3).map((amenity, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                  {amenity}
                </Badge>
              ))}
              {property.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-600">
                  +{property.amenities.length - 3} more
                </Badge>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-2 text-center border border-purple-100">
              <Home className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-900 truncate">{property.bhk}</p>
            </div>
            <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-2 text-center border border-purple-100">
              <Maximize2 className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-900 truncate">{property.carpet_area || 'N/A'}</p>
            </div>
            <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-2 text-center border border-purple-100">
              <Armchair className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-900 truncate">{property.furnishing || 'N/A'}</p>
            </div>
          </div>

          {/* WhatsApp Contact Button - ONLY BUTTON, with FIRST NAME only */}
          <Button
            onClick={handleWhatsAppContact}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl h-10 flex items-center justify-center gap-2 shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp {contactButtonLabel}</span>
          </Button>

          <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
            {property.created_date && (
              <span className="flex items-center gap-1 truncate">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{format(new Date(property.created_date), "MMM dd")}</span>
                {property.refresh_count > 0 && (
                  <span className="text-blue-600 font-semibold ml-1">↻{property.refresh_count}</span>
                )}
              </span>
            )}
            <div className="flex items-center gap-2">
              {property.views_count > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
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
