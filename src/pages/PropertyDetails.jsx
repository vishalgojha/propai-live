
import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, MapPin, Home, Maximize2, Car, MessageCircle,
  Calendar, Armchair, Check, Utensils, ArrowLeft, Share2,
  Eye, Sparkles, Phone, Instagram, Facebook, Twitter,
  Link as LinkIcon, Layers, Download, X, Linkedin,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "sonner";

// Import JSON-LD generators directly from src/utils
import {
  generatePropertyJsonLd,
  generateOrganizationJsonLd,
  generateBreadcrumbJsonLd
} from "../utils/jsonLdGenerators";


export default function PropertyDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Read from URL query params instead of route params
  const urlParams = new URLSearchParams(window.location.search);
  const propertySlug = urlParams.get('slug') || urlParams.get('id');

  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  // REMOVED: const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertySlug],
    queryFn: async () => {
      const properties = await base44.entities.Property.list();
      // Look up by slug first, then fallback to ID
      return properties.find(p => p.slug === propertySlug || p.id === propertySlug);
    },
    enabled: !!propertySlug,
  });

  const incrementViewsMutation = useMutation({
    mutationFn: (propId) => base44.entities.Property.update(propId, {
      views_count: (property?.views_count || 0) + 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertySlug] });
    },
  });

  useEffect(() => {
    if (property && !sessionStorage.getItem(`viewed-property-${property.id}`)) {
      incrementViewsMutation.mutate(property.id);
      sessionStorage.setItem(`viewed-property-${property.id}`, 'true');
    }
  }, [property?.id]);

  const formatPrice = () => {
    if (!property) return "";
    if (property.price_unit === "crores") {
      return `₹${property.price} Cr`;
    }
    return `₹${property.price} ${property.price === 1 ? 'Lakh' : 'Lakhs'}`;
  };

  const getContactInfo = () => {
    // Determine phone and contact name based on broker info
    const hasRealBroker = property?.broker_contact &&
                         property.broker_contact !== '9102269622278' &&
                         property.broker_contact !== '919819471310';

    if (hasRealBroker) {
      return {
        phone: property.broker_contact,
        name: property.broker_name || 'Broker'
      };
    }

    // Default to PropAI Office
    return {
      phone: '9102269622278',
      name: 'PropAI Team'
    };
  };

  const getPropertyUrl = () => {
    if (property?.slug) {
      return `${window.location.origin}/propertydetails?slug=${property.slug}`;
    }
    return window.location.href;
  };

  const getFullPropertyDetails = () => {
    if (!property) return '';

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
      details.push(`✨ Amenities: ${property.amenities.join(', ')}`);
    }

    // Reference ID
    if (property.custom_id) details.push(`🔖 Ref ID: ${property.custom_id}`);

    // Branding link
    details.push(`\n📱 View on PropAI Live: ${getPropertyUrl()}`);

    return details.join('\n');
  };

  const handleWhatsApp = async () => {
    // Track WhatsApp contact
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
        broker_contact: property.broker_contact,
        timestamp: new Date().toISOString()
      });

      const recentContacts = contactHistory.slice(-50);
      localStorage.setItem('propai_contact_history', JSON.stringify(recentContacts));

      // Server-side tracking (for analytics)
      const contact = getContactInfo();
      const contactedVia = contact.phone === '9102269622278' ? 'propai_office' : 'broker';

      await base44.functions.invoke('trackContactInteraction', {
        property_id: property.id,
        broker_id: property.broker_id || null,
        interaction_type: 'whatsapp',
        broker_contact: property.broker_contact || null,
        contacted_via: contactedVia
      });
    } catch (error) {
      console.error('Failed to track contact:', error);
      // Don't block user flow if tracking fails
    }

    const contact = getContactInfo();
    const message = `Hi${contact.name !== 'Broker' && contact.name !== 'PropAI Team' ? ` ${contact.name}` : ''}, I'm interested in this property:\n\n${getFullPropertyDetails()}\n\n${property.ai_description ? `📝 ${property.ai_description}\n\n` : ''}Please share:\n✅ Latest photos\n✅ Availability status\n✅ Viewing schedule\n\nFound via www.propai.live\n\nThank you!`;

    window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getShareUrl = () => {
    if (property?.slug) {
      return `${window.location.origin}/propertydetails?slug=${property.slug}`;
    }
    // Fallback to current URL if slug is not available (e.g., old links) or property is not loaded
    return window.location.href;
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
    if (property.floor) details.push(`🏗️ Floor ${property.floor}`);

    details.push('\n📱 View full details on PropAI Live');
    details.push('✨ Verified listings | Transparent pricing | No spam');

    return details.join('\n');
  };

  const handleShare = async () => {
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

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
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

  const getLocationDisplay = () => {
    if (!property) return "";
    const parts = [];
    if (property.building_name) parts.push(property.building_name);
    if (property.pocket) parts.push(property.pocket);
    if (property.location) parts.push(property.location);
    else if (property.location_id) parts.push(property.location_id);
    return parts.join(', ');
  };

  // ✅ Generate JSON-LD structured data
  const propertyJsonLd = property ? generatePropertyJsonLd(property) : null;
  const organizationJsonLd = generateOrganizationJsonLd();
  const breadcrumbJsonLd = property ? generateBreadcrumbJsonLd([
    { name: "Home", url: window.location.origin },
    { name: "Properties", url: `${window.location.origin}/smartfeed` },
    { name: property.location, url: `${window.location.origin}/smartfeed?location=${encodeURIComponent(property.location)}` },
    { name: property.ai_title || `${property.bhk} in ${property.location}`, url: window.location.href }
  ]) : null;

  // REMOVED: handlePrevImage and handleNextImage functions

  // ✅ Updated schema generation for SEO - now using utility function
  const generatePropertySchema = () => {
    if (!property) return null;

    // Use the utility function to generate the complete JSON-LD
    return propertyJsonLd;
  };

  if (!propertySlug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Property not found</h2>
          <Button onClick={() => navigate(createPageUrl("SmartFeed"))}>
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96 w-full mb-8 rounded-3xl" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      {/* ✅ Enhanced SEO with JSON-LD structured data */}
      {property && (
        <SEO
          title={`${property.ai_title || `${property.bhk} in ${property.location}`} | PropAI Live`}
          description={property.ai_description || `${property.bhk} property for ${property.listing_type} in ${property.location}. ${property.furnishing ? property.furnishing + '.' : ''} ${property.carpet_area ? property.carpet_area + ' sq.ft.' : ''} View details and contact broker on PropAI Live.`}
          ogImage={property.images?.[0]}
          schema={propertyJsonLd ? [propertyJsonLd] : []}
          organization={organizationJsonLd}
          breadcrumbs={breadcrumbJsonLd}
          canonical={getShareUrl()}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">

        {/* Back Button */}
        <Button
          onClick={() => navigate(createPageUrl("SmartFeed"))}
          variant="ghost"
          className="mb-6 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-2xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Button>

        {/* NO HERO IMAGE SECTION - Removed completely */}

        {/* Main Content Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-purple-200/50 overflow-hidden mb-8">

          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 md:px-8 py-6 border-b border-purple-100">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs px-3 py-1 rounded-full border-0">
                    {property.bhk}
                  </Badge>
                  {property.jodi_flag && (
                    <Badge className="bg-purple-500/20 text-purple-900 border-purple-500 font-bold text-xs px-3 py-1 rounded-full">
                      JODI
                    </Badge>
                  )}
                  <Badge className={
                    property.status === "Active" ? "bg-green-500/20 text-green-700 border-green-500 text-xs px-3 py-1 rounded-full" :
                    "bg-gray-500/20 text-gray-700 border-gray-500 text-xs px-3 py-1 rounded-full"
                  }>
                    {property.status}
                  </Badge>
                </div>

                {property.ai_title && (
                  <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3 leading-tight">
                    {property.ai_title}
                  </h1>
                )}

                <div className="flex items-center gap-2 text-slate-600 mb-3">
                  <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <p className="text-sm md:text-base">{getLocationDisplay()}</p>
                </div>

                <div className="flex items-center flex-wrap gap-3 text-xs md:text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {property.views_count || 0} views
                  </span>
                  {property.custom_id && (
                    <span className="font-mono text-purple-600">{property.custom_id}</span>
                  )}
                </div>
              </div>

              <div className="text-left md:text-right">
                <p className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {formatPrice()}
                </p>
                <p className="text-xs md:text-sm text-slate-500 uppercase tracking-wide font-medium">
                  {property.listing_type} • {property.property_type || "Apartment"}
                </p>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="border-purple-300 hover:bg-purple-50 text-purple-700 font-semibold rounded-xl text-xs md:text-sm"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Share
              </Button>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-8">

            {/* AI Description */}
            {property.ai_description && (
              <div className="mb-8 p-4 md:p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                    {property.ai_description}
                  </p>
                </div>
              </div>
            )}

            {/* Key Details Grid - Responsive */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
              <div className="text-center p-4 md:p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                <Home className="w-5 h-5 md:w-6 md:h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-base md:text-lg font-bold text-slate-900">{property.bhk}</p>
                <p className="text-xs text-slate-500 mt-1">Config</p>
              </div>
              <div className="text-center p-4 md:p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                <Maximize2 className="w-5 h-5 md:w-6 md:h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-base md:text-lg font-bold text-slate-900 truncate">
                  {property.carpet_area || "N/A"}
                </p>
                <p className="text-xs text-slate-500 mt-1">sq ft</p>
              </div>
              <div className="text-center p-4 md:p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                <Armchair className="w-5 h-5 md:w-6 md:h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-base md:text-lg font-bold text-slate-900 truncate">{property.furnishing || "N/A"}</p>
                <p className="text-xs text-slate-500 mt-1">Furnish</p>
              </div>
              <div className="text-center p-4 md:p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                <Car className="w-5 h-5 md:w-6 md:h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-base md:text-lg font-bold text-slate-900 truncate">{property.parking || "N/A"}</p>
                <p className="text-xs text-slate-500 mt-1">Parking</p>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
              {property.floor && (
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Floor</p>
                  </div>
                  <p className="text-sm md:text-base font-bold text-slate-900">
                    {property.floor}
                    {property.total_floors && ` of ${property.total_floors}`}
                  </p>
                </div>
              )}
              {property.possession && (
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Possession</p>
                  </div>
                  <p className="text-sm md:text-base font-bold text-slate-900">{property.possession}</p>
                </div>
              )}
              {property.veg_nonveg && (
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Utensils className="w-4 h-4 text-purple-500" />
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Food Preference</p>
                  </div>
                  <p className="text-sm md:text-base font-bold text-slate-900">{property.veg_nonveg}</p>
                </div>
              )}
              {property.built_up_area && (
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Maximize2 className="w-4 h-4 text-purple-500" />
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Built-up Area</p>
                  </div>
                  <p className="text-sm md:text-base font-bold text-slate-900">{property.built_up_area} sq ft</p>
                </div>
              )}
            </div>

            {/* Full Description */}
            {property.description && property.description !== property.ai_description && (
              <div className="mb-8">
                <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide">Description</h3>
                <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="mb-8">
                <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4 uppercase tracking-wide">Amenities</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-slate-700 bg-purple-50 p-3 rounded-xl border border-purple-100">
                      <Check className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span className="line-clamp-1">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Section - Single WhatsApp Button Only */}
            <div className="space-y-3 md:space-y-4">
              <Button
                onClick={handleWhatsApp}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-12 md:h-14 rounded-2xl shadow-lg text-sm md:text-base"
                size="lg"
              >
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                WhatsApp {getContactInfo().name}
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full border-2 border-purple-300 hover:bg-purple-50 text-purple-700 font-semibold rounded-xl text-xs md:text-sm"
              >
                <Share2 className="w-3 h-3 md:w-4 h-4 mr-2" />
                Share Property
              </Button>
            </div>
          </div>

          {/* Footer - Branding */}
          <div className="px-6 md:px-8 py-4 md:py-5 bg-purple-50 border-t border-purple-100">
            <div className="text-center text-xs md:text-sm text-slate-500">
              Listed by <a href="https://propai.live" target="_blank" rel="noopener" className="font-semibold text-purple-700 hover:text-purple-800 transition-colors">PropAI Live</a>
              {property.created_date && (
                <span className="ml-2">• {format(new Date(property.created_date), "MMM dd, yyyy")}</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Property
            </DialogTitle>
          </DialogHeader>

          {/* Share Buttons */}
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

          {/* Share URL Preview */}
          <div className="bg-stone-50 rounded-lg p-3 mt-2">
            <p className="text-xs text-stone-500 mb-1">Share link:</p>
            <p className="text-xs text-stone-700 font-mono break-all">{getShareUrl()}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
