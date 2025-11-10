
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Home, DollarSign, Calendar, User, Phone, Mail,
  MessageCircle, Target, ArrowLeft, Building2, Armchair,
  AlertCircle, TrendingUp, Package, Eye
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import PropertyCard from "../components/property/PropertyCard";
import SEO from "../components/SEO";

// Import JSON-LD generators directly from src/utils
import {
  generateRequirementJsonLd,
  generateOrganizationJsonLd,
  generateBreadcrumbJsonLd
} from "../utils/jsonLdGenerators";

export default function RequirementDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const requirementId = urlParams.get('id');
  const requirementSlug = urlParams.get('slug');

  const [currentUser, setCurrentUser] = useState(null);

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

  const { data: requirement, isLoading } = useQuery({
    queryKey: ['requirement-details', requirementId, requirementSlug],
    queryFn: async () => {
      const requirements = await base44.entities.Requirement.list();
      if (requirementSlug) {
        return requirements.find(r => r.slug === requirementSlug);
      }
      return requirements.find(r => r.id === requirementId);
    },
    enabled: !!(requirementId || requirementSlug),
  });

  const { data: allProperties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list(),
    initialData: [],
  });

  // Get matched properties
  const matchedProperties = requirement?.ai_matched_properties
    ?.map(match => {
      const property = allProperties.find(p => p.id === match.property_id);
      return property ? { ...property, match_score: match.match_score, match_reasons: match.match_reasons } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.match_score - a.match_score) || [];

  // Generate JSON-LD
  const requirementJsonLd = requirement ? generateRequirementJsonLd(requirement) : null;
  const organizationJsonLd = generateOrganizationJsonLd();
  const breadcrumbJsonLd = requirement ? generateBreadcrumbJsonLd([
    { name: "Home", url: window.location.origin },
    { name: "Requirements", url: `${window.location.origin}/smartfeed` },
    { name: requirement.client_name || "Client Requirement", url: window.location.href }
  ]) : null;

  const getCanonicalUrl = () => {
    if (requirement?.slug) {
      return `${window.location.origin}/requirementdetails?slug=${requirement.slug}`;
    }
    return `${window.location.origin}/requirementdetails?id=${requirement?.id}`;
  };

  const formatBudget = () => {
    if (!requirement) return '';
    const unit = requirement.budget_unit === 'crores' ? 'Cr' : 'L';
    if (requirement.budget_min && requirement.budget_max) {
      return `₹${requirement.budget_min}${unit} - ₹${requirement.budget_max}${unit}`;
    } else if (requirement.budget_min) {
      return `₹${requirement.budget_min}${unit}+`;
    } else if (requirement.budget_max) {
      return `Up to ₹${requirement.budget_max}${unit}`;
    }
    return 'Budget flexible';
  };

  const handleWhatsAppContact = () => {
    if (!requirement?.broker_contact) {
      toast.error('No contact available');
      return;
    }

    const message = `Hi${requirement.broker_name ? ` ${requirement.broker_name}` : ''}, I saw your requirement on PropAI Live:\n\n` +
      `${requirement.bhk_preference?.join(', ') || 'Any BHK'} in ${requirement.preferred_locations?.join(', ') || 'Mumbai'}\n` +
      `Budget: ${formatBudget()}\n\n` +
      `I may have matching properties. Let's connect!\n\n` +
      `View requirement: ${getCanonicalUrl()}`;

    window.open(`https://wa.me/${requirement.broker_contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!requirementId && !requirementSlug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Requirement not found</h2>
          <Button onClick={() => navigate(createPageUrl("SmartFeed"))}>
            Back to SmartFeed
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !requirement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-64 w-full mb-6 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-96 rounded-3xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const urgencyColor = requirement.urgency === 'High' ? 'bg-red-100 text-red-700 border-red-300' :
    requirement.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
    'bg-blue-100 text-blue-700 border-blue-300';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      <SEO
        title={`${requirement.client_name || 'Client'} looking for ${requirement.bhk_preference?.join(', ') || 'Property'} | PropAI Live`}
        description={`Property requirement: ${requirement.bhk_preference?.join(', ') || 'Any BHK'} in ${requirement.preferred_locations?.join(', ') || 'Mumbai'}. Budget: ${formatBudget()}. ${requirement.furnishing_preference ? requirement.furnishing_preference + '.' : ''}`}
        schema={[requirementJsonLd]}
        organization={organizationJsonLd}
        breadcrumbs={breadcrumbJsonLd}
        canonical={getCanonicalUrl()}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        <Button
          onClick={() => navigate(createPageUrl("SmartFeed"))}
          variant="ghost"
          className="mb-6 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-2xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to SmartFeed
        </Button>

        {/* Requirement Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border-2 border-purple-200 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-sm px-3 py-1">
                  {requirement.listing_type}
                </Badge>
                <Badge className={`${urgencyColor} text-sm px-3 py-1`}>
                  {requirement.urgency || 'Medium'} Urgency
                </Badge>
                {requirement.status && (
                  <Badge className={requirement.status === 'Active' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-slate-100 text-slate-700 border-slate-300'}>
                    {requirement.status}
                  </Badge>
                )}
                {requirement.custom_id && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {requirement.custom_id}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {requirement.client_name ? `${requirement.client_name}'s Requirement` : 'Property Requirement'}
              </h1>
              <p className="text-lg text-slate-600">
                Looking for {requirement.bhk_preference?.join(', ') || 'property'} in {requirement.preferred_locations?.join(', ') || 'Mumbai'}
              </p>
            </div>
          </div>

          <Button
            onClick={handleWhatsAppContact}
            className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl h-12 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Contact via WhatsApp
          </Button>
        </motion.div>

        {/* Requirement Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 bg-white border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Requirements
            </h3>
            <div className="space-y-3">
              {requirement.bhk_preference && requirement.bhk_preference.length > 0 && (
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">BHK:</span>
                  <span className="text-sm font-semibold text-slate-900">{requirement.bhk_preference.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Budget:</span>
                <span className="text-sm font-semibold text-slate-900">{formatBudget()}</span>
              </div>
              {requirement.furnishing_preference && requirement.furnishing_preference !== 'Any' && (
                <div className="flex items-center gap-3">
                  <Armchair className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Furnishing:</span>
                  <span className="text-sm font-semibold text-slate-900">{requirement.furnishing_preference}</span>
                </div>
              )}
              {requirement.parking_required && (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Parking Required</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-white border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Preferred Locations
            </h3>
            {requirement.preferred_locations && requirement.preferred_locations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {requirement.preferred_locations.map((loc, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    {loc}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Any location in Mumbai</p>
            )}

            {requirement.pocket && (
              <div className="mt-4">
                <p className="text-xs text-slate-600 mb-2">Specific Area:</p>
                <Badge variant="outline">{requirement.pocket}</Badge>
              </div>
            )}
          </Card>
        </div>

        {/* Additional Details */}
        {(requirement.amenities_required?.length > 0 || requirement.notes) && (
          <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Additional Details</h3>
            {requirement.amenities_required && requirement.amenities_required.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-slate-600 mb-2">Required Amenities:</p>
                <div className="flex flex-wrap gap-2">
                  {requirement.amenities_required.map((amenity, idx) => (
                    <Badge key={idx} className="bg-purple-100 text-purple-700 border-purple-300">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {requirement.notes && (
              <div>
                <p className="text-sm text-slate-600 mb-2">Notes:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{requirement.notes}</p>
              </div>
            )}
          </Card>
        )}

        {/* AI Matched Properties */}
        {matchedProperties.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                AI Matched Properties ({matchedProperties.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {matchedProperties.slice(0, 6).map(property => (
                <div key={property.id} className="relative">
                  {property.match_score && (
                    <Badge className="absolute top-2 right-2 z-10 bg-green-600 text-white">
                      {property.match_score}% Match
                    </Badge>
                  )}
                  <PropertyCard
                    property={property}
                    onViewDetails={(prop) => {
                      navigate(createPageUrl("PropertyDetails") + `?id=${prop.id}`);
                    }}
                  />
                </div>
              ))}
            </div>
            {matchedProperties.length > 6 && (
              <div className="mt-6 text-center">
                <Button
                  onClick={() => navigate(createPageUrl("SmartFeed"))}
                  variant="outline"
                >
                  View All Matches
                </Button>
              </div>
            )}
          </div>
        )}

        {/* No Matches */}
        {matchedProperties.length === 0 && (
          <Card className="p-12 bg-white border-2 border-slate-200 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No matches yet</h3>
            <p className="text-slate-600 mb-6">
              We're actively searching for properties that match this requirement.
            </p>
            <Button
              onClick={handleWhatsAppContact}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              I Have a Match
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
