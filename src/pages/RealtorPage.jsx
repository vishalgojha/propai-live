import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Building2, MapPin, Star, Package, MessageCircle,
  Phone, Mail, Instagram, Facebook, Linkedin, Twitter, Youtube,
  Globe, ExternalLink, Share2, Copy, CheckCircle2, Zap, Home,
  ArrowRight, Sparkles, Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { toast, Toaster } from "sonner";
import SEO from "../components/SEO";
import PropertyCard from "../components/property/PropertyCard";

const THEME_COLORS = {
  purple: {
    bg: "from-purple-600 to-indigo-600",
    light: "from-purple-50 to-indigo-50",
    text: "text-purple-600",
    border: "border-purple-200",
    button: "from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
  },
  blue: {
    bg: "from-blue-600 to-cyan-600",
    light: "from-blue-50 to-cyan-50",
    text: "text-blue-600",
    border: "border-blue-200",
    button: "from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
  },
  green: {
    bg: "from-green-600 to-emerald-600",
    light: "from-green-50 to-emerald-50",
    text: "text-green-600",
    border: "border-green-200",
    button: "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
  },
  orange: {
    bg: "from-orange-500 to-amber-500",
    light: "from-orange-50 to-amber-50",
    text: "text-orange-600",
    border: "border-orange-200",
    button: "from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
  },
  pink: {
    bg: "from-pink-500 to-rose-500",
    light: "from-pink-50 to-rose-50",
    text: "text-pink-600",
    border: "border-pink-200",
    button: "from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
  },
  dark: {
    bg: "from-slate-800 to-slate-900",
    light: "from-slate-100 to-slate-200",
    text: "text-slate-800",
    border: "border-slate-300",
    button: "from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black"
  }
};

export default function RealtorPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const brokerSlug = urlParams.get('u') || urlParams.get('slug') || urlParams.get('id');
  
  const [copied, setCopied] = useState(false);

  const { data: broker, isLoading } = useQuery({
    queryKey: ['realtor-profile', brokerSlug],
    queryFn: async () => {
      const brokers = await base44.entities.Broker.list();
      return brokers.find(b => b.slug === brokerSlug || b.id === brokerSlug || b.custom_id === brokerSlug);
    },
    enabled: !!brokerSlug,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['realtor-properties', broker?.id],
    queryFn: async () => {
      const allProps = await base44.entities.Property.list('-created_date');
      return allProps.filter(p => p.broker_id === broker.id && p.status === 'Active' && !p.is_duplicate);
    },
    enabled: !!broker?.id,
    initialData: []
  });

  const theme = THEME_COLORS[broker?.profile_theme || 'purple'];

  const getProfileUrl = () => {
    const slug = broker?.slug || broker?.id;
    return `${window.location.origin}/r?u=${slug}`;
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(getProfileUrl());
    setCopied(true);
    toast.success('Profile link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${broker.name} - Real Estate Agent | PropAI Live`,
          text: broker.tagline || `Connect with ${broker.name} for Mumbai real estate`,
          url: getProfileUrl()
        });
      } catch (err) {
        copyProfileLink();
      }
    } else {
      copyProfileLink();
    }
  };

  const handleWhatsApp = () => {
    const message = `Hi ${broker.name}, I found your profile on PropAI Live and I'm interested in your property listings. Can you help me?`;
    window.open(`https://wa.me/${broker.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const socialIcons = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    twitter: Twitter,
    youtube: Youtube,
    website: Globe
  };

  if (!brokerSlug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Realtor not found</h2>
          <p className="text-slate-600 mb-4">This profile doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(createPageUrl("SmartFeed"))}>
            Browse Properties
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-lg mx-auto px-4 py-8">
          <Skeleton className="h-40 w-full mb-6 rounded-3xl" />
          <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto mb-8" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Realtor not found</h2>
          <Button onClick={() => navigate(createPageUrl("SmartFeed"))}>
            Browse Properties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100">
      <Toaster position="top-center" richColors />

      <SEO
        title={`${broker.name}${broker.agency_name ? ` | ${broker.agency_name}` : ''} - Mumbai Real Estate Agent | PropAI Live`}
        description={broker.bio || broker.tagline || `Connect with ${broker.name}, a trusted real estate agent in Mumbai. ${properties.length} active listings. Specializing in ${broker.specializations?.primary_locations?.join(', ') || 'Mumbai'}.`}
        canonical={getProfileUrl()}
      />

      <div className="max-w-lg mx-auto pb-12">
        {/* Cover/Header */}
        <div className={`relative h-44 bg-gradient-to-r ${theme.bg} rounded-b-[3rem] overflow-hidden`}>
          {broker.cover_photo && (
            <img 
              src={broker.cover_photo} 
              alt="Cover" 
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          
          {/* Share Button */}
          <button
            onClick={shareProfile}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* PropAI Badge */}
          <div className="absolute top-4 left-4">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Zap className="w-4 h-4 text-white" />
              <span className="text-xs text-white font-semibold">PropAI Live</span>
            </Link>
          </div>
        </div>

        {/* Profile Section */}
        <div className="px-6 -mt-16 relative z-10">
          {/* Profile Photo */}
          <div className="flex justify-center mb-4">
            <div className={`w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br ${theme.light} flex items-center justify-center overflow-hidden`}>
              {broker.profile_photo ? (
                <img src={broker.profile_photo} alt={broker.name} className="w-full h-full object-cover" />
              ) : (
                <span className={`text-5xl font-bold ${theme.text}`}>
                  {broker.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Name & Badges */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{broker.name}</h1>
              {broker.verified && (
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              )}
            </div>
            
            {broker.agency_name && (
              <p className={`text-sm ${theme.text} font-semibold mb-1`}>{broker.agency_name}</p>
            )}
            
            {broker.tagline && (
              <p className="text-slate-600 text-sm">{broker.tagline}</p>
            )}

            {/* Trust Badge */}
            {broker.trust_score && broker.trust_score >= 70 && (
              <div className="mt-3 inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold">
                <Shield className="w-3 h-3" />
                BrokerTrust™ {broker.trust_score}/100
              </div>
            )}
          </div>

          {/* Bio */}
          {broker.bio && (
            <p className="text-center text-slate-600 text-sm mb-6 leading-relaxed">
              {broker.bio}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className={`bg-gradient-to-br ${theme.light} rounded-2xl p-3 text-center border ${theme.border}`}>
              <p className={`text-2xl font-bold ${theme.text}`}>{properties.length}</p>
              <p className="text-xs text-slate-600">Listings</p>
            </div>
            <div className={`bg-gradient-to-br ${theme.light} rounded-2xl p-3 text-center border ${theme.border}`}>
              <p className={`text-2xl font-bold ${theme.text}`}>
                {broker.specializations?.primary_locations?.length || broker.areas_covered?.length || 0}
              </p>
              <p className="text-xs text-slate-600">Areas</p>
            </div>
            <div className={`bg-gradient-to-br ${theme.light} rounded-2xl p-3 text-center border ${theme.border}`}>
              <p className={`text-2xl font-bold ${theme.text}`}>
                {broker.trust_score || 50}
              </p>
              <p className="text-xs text-slate-600">Trust</p>
            </div>
          </div>

          {/* Primary CTA - WhatsApp */}
          <Button
            onClick={handleWhatsApp}
            className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-14 rounded-2xl shadow-lg mb-4`}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat on WhatsApp
          </Button>

          {/* Secondary CTAs */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {broker.phone && (
              <Button
                onClick={() => window.open(`tel:${broker.phone}`, '_self')}
                variant="outline"
                className={`h-12 rounded-xl ${theme.border}`}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            )}
            {broker.email && (
              <Button
                onClick={() => window.open(`mailto:${broker.email}`, '_self')}
                variant="outline"
                className={`h-12 rounded-xl ${theme.border}`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            )}
          </div>

          {/* WhatsApp AI Agent */}
          <div className={`bg-gradient-to-br ${theme.light} rounded-2xl p-4 border ${theme.border} mb-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${theme.bg} rounded-xl flex items-center justify-center`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">AI Property Assistant</h3>
                <p className="text-xs text-slate-600">Chat 24/7 for instant property matches</p>
              </div>
            </div>
            <a
              href={base44.agents.getWhatsAppConnectURL('chariot_master')}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full text-center bg-gradient-to-r ${theme.button} text-white font-semibold py-3 rounded-xl`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Connect AI Assistant
            </a>
          </div>

          {/* Social Links */}
          {broker.social_links && Object.keys(broker.social_links).some(k => broker.social_links[k]) && (
            <div className="flex justify-center gap-3 mb-6">
              {Object.entries(broker.social_links).map(([platform, url]) => {
                if (!url) return null;
                const Icon = socialIcons[platform] || Globe;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 bg-gradient-to-br ${theme.light} rounded-xl flex items-center justify-center ${theme.text} hover:shadow-md transition-all border ${theme.border}`}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Custom Links */}
          {broker.custom_links && broker.custom_links.length > 0 && (
            <div className="space-y-3 mb-6">
              {broker.custom_links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full bg-white rounded-2xl p-4 border ${theme.border} hover:shadow-md transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{link.title}</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Specializations */}
          {broker.specializations?.primary_locations && broker.specializations.primary_locations.length > 0 && (
            <div className={`bg-gradient-to-br ${theme.light} rounded-2xl p-4 border ${theme.border} mb-6`}>
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Areas I Cover
              </h3>
              <div className="flex flex-wrap gap-2">
                {broker.specializations.primary_locations.map((loc, idx) => (
                  <Badge key={idx} variant="outline" className={theme.border}>
                    {loc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Active Listings */}
          {properties.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Home className="w-5 h-5" />
                My Active Listings ({properties.length})
              </h3>
              <div className="space-y-4">
                {properties.slice(0, 4).map((property) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`${createPageUrl("PropertyDetails")}?slug=${property.slug || property.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <Badge className={`bg-gradient-to-r ${theme.bg} text-white border-0 text-xs mb-2`}>
                          {property.listing_type}
                        </Badge>
                        <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">
                          {property.ai_title || `${property.bhk} in ${property.location}`}
                        </h4>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {property.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${theme.text}`}>
                          ₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}
                        </p>
                        <p className="text-xs text-slate-500">{property.bhk}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {properties.length > 4 && (
                <Button
                  onClick={() => navigate(`${createPageUrl("SmartFeed")}?broker=${broker.id}`)}
                  variant="outline"
                  className={`w-full mt-4 rounded-xl ${theme.border}`}
                >
                  View All {properties.length} Listings
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}

          {/* Share Profile */}
          <div className={`bg-gradient-to-br ${theme.light} rounded-2xl p-4 border ${theme.border} mb-6`}>
            <h3 className="font-bold text-slate-900 mb-2 text-sm">Share My Profile</h3>
            <div className="flex gap-2">
              <div className="flex-1 bg-white rounded-xl px-3 py-2 text-xs text-slate-600 truncate border border-slate-200">
                {getProfileUrl()}
              </div>
              <Button
                onClick={copyProfileLink}
                size="sm"
                variant="outline"
                className={`rounded-xl ${theme.border}`}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Powered By Footer */}
          <div className="text-center pt-4 border-t border-slate-200">
            <Link 
              to={createPageUrl("Home")} 
              className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm">Powered by PropAI Live</span>
            </Link>
            <p className="text-xs text-slate-400 mt-1">Mumbai's AI-Powered Property Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}