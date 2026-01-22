import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Maximize2, MessageCircle,
  Armchair, Shield, Eye, Home, Calendar, Share2, Facebook, Twitter, Link as LinkIcon, Linkedin, ChevronDown, ChevronUp, Building2, RefreshCw, Sparkles, Phone, X, Zap
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
import { usePropertyAIEnrichment } from "../hooks/usePropertyAIEnrichment";
import { useAutoSlugGeneration } from "../hooks/useAutoSlugGeneration";
import { useAutoGenerateCustomId } from "../hooks/useAutoGenerateCustomId";
import LeadShareButton from "../broker/LeadShareButton";
import CoListingManager from "../broker/CoListingManager";

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

export default function PropertyCard({ property: initialProperty, onViewDetails, user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // ✅ AUTO-ENRICH: Generate AI title/description on-demand
  const { property: enrichedProperty, isEnriching } = usePropertyAIEnrichment(initialProperty);
  
  // ✅ AUTO-GENERATE CUSTOM ID: Generate ID if missing
  const propertyWithId = useAutoGenerateCustomId(enrichedProperty);
  
  // Use the fully enriched property with ID
  const property = propertyWithId;
  
  // ✅ AUTO-SLUG: Generate URL slug on-demand
  useAutoSlugGeneration(property);
  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [currentUser, setCurrentUser] = useState(user || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [developer, setDeveloper] = useState(null);

  useEffect(() => {
    if (!user) {
      const loadUser = async () => {
        try {
          const u = await base44.auth.me();
          setCurrentUser(u);
        } catch (error) {
          setCurrentUser(null);
        }
      };
      loadUser();
    }
  }, [user]);

  useEffect(() => {
    const loadDeveloper = async () => {
      if (!property?.building_id) {
        setDeveloper(null);
        return;
      }
      
      try {
        const buildings = await base44.entities.Building.list();
        const building = buildings.find(b => b.id === property.building_id);
        
        if (building?.developer_id) {
          const developers = await base44.entities.Developer.list();
          const dev = developers.find(d => d.id === building.developer_id);
          setDeveloper(dev);
        } else {
          setDeveloper(null);
        }
      } catch (error) {
        console.error('Failed to load developer:', error);
        setDeveloper(null);
      }
    };
    
    loadDeveloper();
  }, [property?.building_id]);

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

  const canRefresh = () => {
    if (!currentUser) return false;
    
    if (currentUser.role === 'admin') return true;
    
    if (currentUser.email && property.broker_contact) {
      const normalizedUserPhone = currentUser.email.replace(/\D/g, '');
      const normalizedBrokerPhone = property.broker_contact.replace(/\D/g, '');
      if (normalizedUserPhone === normalizedBrokerPhone) return true;
    }
    
    return false;
  };

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

  const trackPropertyContact = async (property, contactedVia) => {
    try {
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

      await base44.functions.invoke('trackContactInteraction', {
        property_id: property.id,
        broker_id: property.broker_id || null,
        interaction_type: 'whatsapp',
        broker_contact: property.broker_contact || null,
        contacted_via: contactedVia
      });
    } catch (error) {
      console.error('Failed to track contact:', error);
    }
  };

  const formatPrice = () => {
    const priceNum = parseFloat(property.price);
    
    if (isNaN(priceNum) || priceNum === 0) {
      return "Price on Request";
    }

    let priceInLakhs;
    if (property.price_unit === "crores") {
      priceInLakhs = priceNum * 100;
    } else {
      priceInLakhs = priceNum;
    }

    if (priceInLakhs >= 100) {
      const crores = (priceInLakhs / 100).toFixed(2);
      return `₹${crores} Cr`;
    } else if (priceInLakhs >= 1) {
      return `₹${priceInLakhs.toFixed(2)} L`;
    } else {
      const thousands = (priceInLakhs * 100).toFixed(0);
      return `₹${thousands}K`;
    }
  };

  const getPropertyUrl = () => {
    if (property.slug) {
      return `${window.location.origin}/propertydetails?slug=${property.slug}`;
    }
    return `${window.location.origin}/propertydetails?id=${property.id}`;
  };

  const handleWhatsAppContact = async (e) => {
    e.stopPropagation();
    
    const normalizeIndianPhone = (phone) => {
      if (!phone) return null;
      let cleaned = phone.replace(/\D/g, '');
      cleaned = cleaned.slice(-10);
      if (cleaned.length === 10 && cleaned[0] >= '6' && cleaned[0] <= '9') {
        return '91' + cleaned;
      }
      return null;
    };
    
    let rawBrokerContact = property.broker_contact;
    let normalizedBrokerContact = normalizeIndianPhone(rawBrokerContact);
    
    // ✅ FALLBACK: If no valid contact, try fetching from Broker entity
    if (!normalizedBrokerContact && property.broker_id) {
      try {
        toast.loading('Fetching broker contact...');
        const response = await base44.functions.invoke('getBrokerContact', { 
          property_id: property.id 
        });
        
        if (response.data?.contact) {
          rawBrokerContact = response.data.contact;
          normalizedBrokerContact = normalizeIndianPhone(rawBrokerContact);
          toast.dismiss();
          toast.success('Contact retrieved!');
        } else {
          toast.dismiss();
          toast.error('⚠️ No contact available', {
            description: 'This broker has no phone number on file.',
            duration: 5000
          });
          return;
        }
      } catch (error) {
        toast.dismiss();
        toast.error('⚠️ Failed to fetch contact', {
          description: error.message,
          duration: 5000
        });
        return;
      }
    }
    
    if (!normalizedBrokerContact) {
      toast.error('⚠️ No contact available', {
        description: 'This property has no broker contact information.',
        duration: 5000,
        className: 'bg-red-600 text-white border-0'
      });
      return;
    }
    
    const primaryContact = normalizedBrokerContact;
    const contactName = property.broker_name || 'Broker';

    await trackPropertyContact(property, 'broker');
    
    const propertyLink = getPropertyUrl();
    
    const message = `Hi${contactName !== 'Broker' ? ` ${contactName}` : ''}, I'm interested in this property:\n\n` +
      `🏠 ${property.ai_title || `${property.bhk} in ${property.location}`}\n` +
      `💰 ${formatPrice()} | ${property.listing_type}\n` +
      `📍 ${property.building_name ? `${property.building_name}, ` : ''}${property.location}\n` +
      `${property.custom_id ? `🔖 ID: ${property.custom_id}\n` : ''}` +
      `\nFound via www.propai.live\n\n` +
      `📱 View Full Details: ${propertyLink}\n\n` +
      `Please share more details.\n\n` +
      `Thank you!`;
    
    window.open(`https://wa.me/${primaryContact}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAdminWhatsApp = async (e) => {
    e.stopPropagation();
    
    const normalizeIndianPhone = (phone) => {
      if (!phone) return null;
      let cleaned = phone.replace(/\D/g, '');
      cleaned = cleaned.slice(-10);
      if (cleaned.length === 10 && cleaned[0] >= '6' && cleaned[0] <= '9') {
        return '91' + cleaned;
      }
      return null;
    };
    
    const normalizedBrokerContact = normalizeIndianPhone(property.broker_contact);
    
    if (!normalizedBrokerContact) {
      toast.error('⚠️ No contact available', {
        description: 'This property has no valid broker contact.',
        duration: 3000,
        className: 'bg-red-600 text-white border-0'
      });
      return;
    }
    
    const contactName = property.broker_name || 'there';
    const propertyLink = getPropertyUrl();
    
    const message = `Hi ${contactName}, PropAI Team here.\n\n` +
      `Quick check on this property:\n\n` +
      `🏠 ${property.ai_title || `${property.bhk} in ${property.location}`}\n` +
      `💰 ${formatPrice()} | ${property.listing_type}\n` +
      `📍 ${property.building_name ? `${property.building_name}, ` : ''}${property.location}\n` +
      `${property.custom_id ? `🔖 ID: ${property.custom_id}\n` : ''}` +
      `\n📱 Link: ${propertyLink}\n\n` +
      `Please confirm:\n` +
      `✅ Is this property still available?\n` +
      `📸 Can you share latest photos?\n\n` +
      `Thanks!`;
    
    window.open(`https://wa.me/${normalizedBrokerContact}?text=${encodeURIComponent(message)}`, '_blank');
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
      return `https://propai.live/api/socialPreview?type=property&slug=${property.slug}`;
    }
    return `https://propai.live/api/socialPreview?type=property&id=${property.id}`;
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

  const getFirstName = (fullName) => {
    if (!fullName) return 'Broker';
    return fullName.split(' ')[0];
  };
  
  const contactButtonLabel = property.broker_name 
    ? getFirstName(property.broker_name)
    : 'Broker';

  const isDescriptionLong = property.ai_description && property.ai_description.length > 120;
  const displayedDescription = isDescriptionLong && !descriptionExpanded 
    ? property.ai_description.substring(0, 120) + '...' 
    : property.ai_description;

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case "Tier 1": return "bg-amber-500 text-white border-0";
      case "Tier 2": return "bg-blue-600 text-white border-0";
      case "Tier 3": return "bg-green-600 text-white border-0";
      default: return "bg-slate-500 text-white border-0";
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-blue-600 hover:shadow-lg transition-all duration-300 cursor-pointer group"
        onClick={handleCardClick}
      >
        <div className="p-4">
          {/* ✅ NEW: Text-First Badge + Badges Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap gap-1.5">
              {property.listing_type && (
                <Badge className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs">
                  {property.listing_type}
                </Badge>
              )}
              {developer?.tier && (
                <Badge className={`${getTierBadgeClass(developer.tier)} font-bold text-xs shadow-sm`}>
                  {developer.tier}
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
                className="flex items-center text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors touch-manipulation"
                title="Share property"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              
              {canRefresh() && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`flex items-center text-xs p-1.5 rounded-lg transition-colors touch-manipulation ${
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

          <h3 className="text-base font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-700 transition-colors">
            {property.ai_title || `${property.bhk} in ${property.location}`}
            {isEnriching && <Sparkles className="w-3 h-3 inline ml-1 text-blue-400 animate-pulse" />}
          </h3>

          {property.building_name && property.building_id && (
            <button
              onClick={(e) => handleBuildingClick(e, property.building_id)}
              className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 hover:border-slate-300 transition-all group/building touch-manipulation"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-700 group-hover/building:scale-110 transition-transform" />
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold text-slate-900 group-hover/building:text-blue-700">
                  {property.building_name}
                </span>
                {developer?.name && (
                  <span className="text-xs text-slate-600">
                    by {developer.name}
                  </span>
                )}
              </div>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
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

          <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-2xl font-bold text-slate-900">
                {formatPrice()}
              </span>
            </div>
            {property.carpet_area && (
              <span className="text-sm text-slate-500">
                {property.carpet_area} sq.ft
              </span>
            )}
          </div>

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
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold mt-1 flex items-center gap-1 touch-manipulation"
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

          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-3 flex items-center gap-1.5 flex-wrap">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              {property.amenities.slice(0, 3).map((amenity, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
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
            <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-200">
              <Home className="w-4 h-4 text-slate-700 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-900 truncate">{property.bhk}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-200">
              <Maximize2 className="w-4 h-4 text-slate-700 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-900 truncate">{property.carpet_area || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-200">
              <Armchair className="w-4 h-4 text-slate-700 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-900 truncate">{property.furnishing || 'N/A'}</p>
            </div>
          </div>

          {/* ADMIN-ONLY: Collapsible Broker Info */}
          {isAdmin && property.broker_name && property.broker_contact && (
            <div className="mb-3">
              {!showAdminInfo ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAdminInfo(true);
                  }}
                  size="sm"
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 h-8 text-xs touch-manipulation"
                >
                  <Phone className="w-3 h-3 mr-2" />
                  Show Broker Info
                </Button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs text-amber-700 font-semibold">Broker (Admin View)</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAdminInfo(false);
                      }}
                      className="text-amber-700 hover:text-amber-900 touch-manipulation"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-900 font-bold truncate mb-1">{property.broker_name}</p>
                  <p className="text-xs text-slate-600 font-mono mb-2">{property.broker_contact}</p>
                  <Button
                    onClick={handleAdminWhatsApp}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-3 text-xs w-full touch-manipulation"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Quick Check
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {currentUser?.broker_id && (
              <div className="flex gap-2">
                <LeadShareButton property={property} currentBrokerId={currentUser.broker_id} />
                {property.broker_id === currentUser.broker_id && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Trigger modal or inline co-listing UI
                    }}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                  >
                    Co-List
                  </Button>
                )}
              </div>
            )}

            <Button
              onClick={handleWhatsAppContact}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg h-10 flex items-center justify-center gap-2 shadow-sm touch-manipulation"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp {contactButtonLabel}</span>
            </Button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
                <span className="font-mono text-blue-600 text-xs truncate">{property.custom_id}</span>
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
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white justify-start touch-manipulation"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              Share on WhatsApp
            </Button>
            <Button
              onClick={shareToFacebook}
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white justify-start touch-manipulation"
            >
              <Facebook className="w-5 h-5 mr-3" />
              Share on Facebook
            </Button>
            <Button
              onClick={shareToLinkedIn}
              className="w-full bg-[#0A66C2] hover:bg-[#094D92] text-white justify-start touch-manipulation"
            >
              <Linkedin className="w-5 h-5 mr-3" />
              Share on LinkedIn
            </Button>
            <Button
              onClick={shareToTwitter}
              className="w-full bg-[#1DA1F2] hover:bg-[#1A91DA] text-white justify-start touch-manipulation"
            >
              <Twitter className="w-5 h-5 mr-3" />
              Share on Twitter
            </Button>
            <Button
              onClick={copyShareLink}
              variant="outline"
              className="w-full justify-start touch-manipulation"
            >
              <LinkIcon className="w-5 h-5 mr-3" />
              {copied ? "✅ Link Copied!" : "Copy Link"}
            </Button>
          </div>
          
          <div className="bg-stone-50 rounded-lg p-3 mt-2">
            <p className="text-xs text-stone-500 mb-1">When you share this link, social platforms will automatically create a preview card with:</p>
            <ul className="text-xs text-stone-700 list-disc list-inside space-y-1 mt-2">
              <li>Property photo (if available)</li>
              <li>Title and description</li>
              <li>Price and location</li>
            </ul>
            <p className="text-xs text-stone-700 font-mono break-all mt-3 pt-3 border-t">{getShareUrl()}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}