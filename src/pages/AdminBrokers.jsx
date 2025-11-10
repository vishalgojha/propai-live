
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users, Search, Phone, MessageCircle, Star, MapPin, Building2,
  TrendingUp, RefreshCw, Eye, Sparkles, Target, Award, Clock,
  BarChart3, CheckCircle2, AlertCircle, Home, Package, Copy, Megaphone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function AdminBrokers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [buildingProfile, setBuildingProfile] = useState(false);
  const [buildingAllProfiles, setBuildingAllProfiles] = useState(false);
  const [seedingIntroModalOpen, setSeedingIntroModalOpen] = useState(false);
  const [sendingToAll, setSendingToAll] = useState(false);
  // REMOVED: otoCompleted state - no longer needed

  // REMOVED: useEffect that checks localStorage for OTO completion

  // Queries
  const { data: brokers = [], isLoading: brokersLoading } = useQuery({
    queryKey: ['admin-brokers'],
    queryFn: () => base44.entities.Broker.list('-last_activity'),
    initialData: [],
    refetchInterval: 15000,
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => base44.entities.Property.list(),
    initialData: [],
  });

  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ['admin-requirements'],
    queryFn: () => base44.entities.Requirement.list(),
    initialData: [],
  });

  // CALCULATE REAL-TIME BROKER COUNTS (matches Admin.js pattern)
  const brokersWithCounts = useMemo(() => {
    return brokers.map(broker => {
      const brokerProperties = properties.filter(p => p.broker_id === broker.id);
      const activeProperties = brokerProperties.filter(p => p.status === 'Active' && !p.is_duplicate);
      const brokerRequirements = requirements.filter(r => r.broker_id === broker.id);
      const activeRequirements = brokerRequirements.filter(r => r.status === 'Active');
      
      return {
        ...broker,
        total_listings_count: brokerProperties.length,
        active_listings_count: activeProperties.length,
        total_requirements_count: brokerRequirements.length,
        active_requirements_count: activeRequirements.length,
      };
    });
  }, [brokers, properties, requirements]);

  // Build single broker profile
  const buildBrokerProfile = async (brokerId) => {
    setBuildingProfile(true);
    const loadingToast = toast.loading('🤖 Building broker profile...', {
      description: 'Analyzing listings, team relationships, specializations...',
      className: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0',
    });

    try {
      const response = await base44.functions.invoke('buildBrokerProfile', { brokerId });
      
      toast.dismiss(loadingToast);
      toast.success('✅ Profile Built!', {
        description: `Analyzed ${response.data.results[0]?.total_listings || 0} listings, found ${response.data.results[0]?.team_size || 0} team members`,
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
        duration: 4000
      });

      queryClient.invalidateQueries({ queryKey: ['admin-brokers'] });

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Profile Build Failed', {
        description: error.message,
        className: 'bg-red-600 text-white border-0'
      });
    } finally {
      setBuildingProfile(false);
    }
  };

  // Build all broker profiles
  const buildAllBrokerProfiles = async () => {
    if (!confirm(`Build profiles for all ${brokers.length} brokers?\n\nThis will analyze team relationships, specializations, and generate AI summaries for each broker.`)) {
      return;
    }

    setBuildingAllProfiles(true);
    const loadingToast = toast.loading(`🤖 Building ${brokers.length} broker profiles...`, {
      description: 'This may take a few minutes...',
      className: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0',
    });

    try {
      const response = await base44.functions.invoke('buildBrokerProfile', { buildAllProfiles: true });
      
      toast.dismiss(loadingToast);
      toast.success('✅ All Profiles Built!', {
        description: `Successfully analyzed ${response.data.profiles_built} brokers with team relationships and specializations`,
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
        duration: 5000
      });

      queryClient.invalidateQueries({ queryKey: ['admin-brokers'] });

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Profile Build Failed', {
        description: error.message,
        className: 'bg-red-600 text-white border-0'
      });
    } finally {
      setBuildingAllProfiles(false);
    }
  };

  // UPDATED: Bulk send - now repeatable, no localStorage check
  const sendBulkOnboarding = async () => {
    const brokerCount = filteredBrokers.length;
    
    if (!confirm(`📢 Send Onboarding to ${brokerCount} Brokers\n\nThis will open WhatsApp Web for each broker with pre-filled message.\n\nIMPORTANT:\n• Keep WhatsApp Web open\n• Send each message manually\n• 3 second delay between each\n\nProceed?`)) {
      return;
    }

    setSendingToAll(true);
    toast.loading(`Opening WhatsApp for ${brokerCount} brokers...`, { id: 'bulk-onboarding' });

    for (let i = 0; i < filteredBrokers.length; i++) {
      const broker = filteredBrokers[i];
      const message = generateSeedingIntro(broker);
      const cleanPhone = broker.phone?.replace(/\D/g, '');
      
      if (cleanPhone) {
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        
        if (i < filteredBrokers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    toast.dismiss('bulk-onboarding');
    toast.success(`✅ Opened WhatsApp for ${brokerCount} brokers!`, {
      description: 'Send messages manually from each tab',
      duration: 5000
    });
    setSendingToAll(false);
  };

  // NEW: Send individual OTO message
  const sendIndividualOTO = (broker) => {
    const message = generateSeedingIntro(broker);
    const cleanPhone = broker.phone?.replace(/\D/g, '');
    
    if (!cleanPhone) {
      toast.error('No phone number available');
      return;
    }
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    toast.success(`📱 WhatsApp opened for ${broker.name}`, {
      description: 'Onboarding message pre-filled',
      duration: 3000
    });
  };

  // View broker details
  const viewBrokerProfile = (broker) => {
    setSelectedBroker(broker);
    setProfileModalOpen(true);
  };

  // WhatsApp broker (used in modal)
  const handleWhatsApp = (broker) => {
    const brokerProps = properties.filter(p => p.broker_id === broker.id && p.status === 'Active');
    const brokerRequirements = requirements.filter(r => r.broker_id === broker.id && r.status === 'Active');
    
    let message = `Hi ${broker.name}, this is PropAI Live.\n\n`;
    
    if (brokerProps.length > 0 && brokerRequirements.length > 0) {
      // Broker has both listings and client requirements
      message += `📊 Quick Update:\n`;
      message += `• Your Listings: ${brokerProps.length} active properties\n`;
      message += `• Client Requirements: ${brokerRequirements.length} active searches\n\n`;
      message += `Let's discuss availability and potential matches.\n\n`;
    } else if (brokerProps.length > 0) {
      // Only listings
      message += `📋 Regarding your ${brokerProps.length} active listing${brokerProps.length > 1 ? 's' : ''}:\n\n`;
      
      // Show top 3 properties
      const topProps = brokerProps.slice(0, 3);
      topProps.forEach((prop, idx) => {
        message += `${idx + 1}. ${prop.bhk} - ${prop.location}\n`;
        message += `   ₹${prop.price}${prop.price_unit === 'crores' ? 'Cr' : 'L'}\n`;
      });
      
      if (brokerProps.length > 3) {
        message += `...and ${brokerProps.length - 3} more\n`;
      }
      
      message += `\nCan you confirm:\n`;
      message += `• Current availability status\n`;
      message += `• Any pending photos/details\n\n`;
    } else if (brokerRequirements.length > 0) {
      // Only requirements
      message += `🔍 Regarding ${brokerRequirements.length} client requirement${brokerRequirements.length > 1 ? 's' : ''} you shared:\n\n`;
      
      // Show top 2 requirements
      const topReqs = brokerRequirements.slice(0, 2);
      topReqs.forEach((req, idx) => {
        const budgetMin = req.budget_min || 0;
        const budgetMax = req.budget_max || 0;
        const budgetUnit = req.budget_unit === 'crores' ? 'Cr' : 'L';
        const budgetDisplay = budgetMin && budgetMax 
          ? `₹${budgetMin}-${budgetMax}${budgetUnit}`
          : budgetMin 
            ? `₹${budgetMin}${budgetUnit}+`
            : budgetMax
              ? `Up to ₹${budgetMax}${budgetUnit}`
              : 'Budget flexible';
        
        message += `${idx + 1}. ${req.bhk_preference?.join('/') || 'Property'} in ${req.preferred_locations?.join('/') || 'Mumbai'}\n`;
        message += `   ${budgetDisplay}\n`;
      });
      
      if (brokerRequirements.length > 2) {
        message += `...and ${brokerRequirements.length - 2} more\n`;
      }
      
      message += `\nHave we found suitable matches for your clients?\n\n`;
    } else {
      // No active listings or requirements
      message += `Hope you're doing well!\n\n`;
      message += `Do you have any new listings or client requirements to share?\n\n`;
    }
    
    message += `Looking forward to working together.\n\n`;
    message += `Team PropAI\n📱 www.propai.live`;
    
    window.open(`https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Filtered brokers - USE brokersWithCounts instead of brokers
  const filteredBrokers = brokersWithCounts.filter(broker => {
    const matchesSearch = !searchQuery ||
      broker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.phone?.includes(searchQuery) ||
      broker.custom_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.agency_name?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "Active") {
      matchesStatus = broker.status === "Active";
    } else if (statusFilter === "Verified") {
      matchesStatus = broker.verified;
    } else if (statusFilter === "Dormant") {
      matchesStatus = broker.status === "Dormant";
    } else if (statusFilter === "HasTeam") {
      matchesStatus = broker.team_members && broker.team_members.length > 0;
    }

    return matchesSearch && matchesStatus;
  });

  // NEW: Smart WhatsApp Message Generators
  const generateWelcomeMessage = (broker, property) => {
    if (!property) return "";
    return `👋 Hi ${broker.name}! Your property is now LIVE on PropAI SmartFeed!

🏠 ${property.bhk} in ${property.location}
📍 Custom ID: ${property.custom_id}
✅ Status: Active & searchable

We're Mumbai's AI-powered property platform. Your listings get matched with verified buyer/tenant requirements automatically.

🌐 propai.live`;
  };

  const generateMatchAlertMessage = (broker, requirement) => {
    const genericRequirementMessage = `🎯 New client requirements available on PropAI!\n\nCheck SmartFeed for matches in your areas:\n${broker.areas_covered?.join(', ') || 'Mumbai'}\n\n📱 propai.live`;
    
    if (!requirement) return genericRequirementMessage;

    return `🎯 URGENT MATCH!

New client requirement:
🔍 ${requirement.bhk_preference?.join(', ') || 'Property'} in ${requirement.preferred_locations?.join(', ') || 'Mumbai'}
💰 Budget: ₹${requirement.budget_min || ''}${requirement.budget_max ? `-${requirement.budget_max}` : ''}L
⏰ Possession: ${requirement.possession_timeline || 'ASAP'}

You have properties in this area. Check SmartFeed to connect!

📱 View matches: propai.live`;
  };

  const generatePerformanceMessage = (broker) => {
    const activeLis = broker.active_listings_count || 0;
    const totalListings = broker.total_listings_count || 0;
    
    return `📊 Your PropAI Update

This month:
✅ ${activeLis} listings live on SmartFeed
💯 ${broker.trust_score || 50} BrokerTrust™ Score
${totalListings > 0 ? `📈 ${totalListings} total properties listed` : ''}

Keep sharing quality listings - more views = faster closures!

🌐 propai.live`;
  };

  const generateQualityRecognitionMessage = (broker) => {
    return `⭐ Great work, ${broker.name}!

Your listings stand out:
✅ Complete details
${broker.trust_score >= 70 ? '📸 Quality photos' : ''}
💯 ${broker.trust_score || 50} BrokerTrust™ Score

High-quality listings get 3x more views on SmartFeed. Keep it up!

🌐 propai.live`;
  };

  const handleWhatsAppMessage = (messageText, phone) => {
    const cleanPhone = phone?.replace(/\D/g, '');
    if (!cleanPhone) {
      toast.error('No phone number available');
      return;
    }
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  // NEW: Smart CTA logic - determine which CTAs to show based on broker activity
  const getSmartCTAs = (broker) => {
    // We still need to filter properties here if we need the actual objects (e.g., for mostRecentProperty)
    const brokerPropertiesForObjectAccess = properties.filter(p => p.broker_id === broker.id);
    const mostRecentProperty = brokerPropertiesForObjectAccess.length > 0 ? brokerPropertiesForObjectAccess[0] : null;
    
    const daysSinceLastActivity = broker.last_activity 
      ? Math.floor((Date.now() - new Date(broker.last_activity).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity; // Use Infinity for never active

    const daysSinceJoined = broker.created_date
      ? Math.floor((Date.now() - new Date(broker.created_date).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    const ctas = [];

    // 1. WELCOME: Only if NEW broker (1-3 total listings) AND last activity within 7 days
    if (broker.total_listings_count >= 1 && broker.total_listings_count <= 3 && daysSinceLastActivity <= 7 && mostRecentProperty) {
      ctas.push({
        id: 'welcome',
        label: '👋 Welcome',
        message: generateWelcomeMessage(broker, mostRecentProperty),
        reason: 'New broker with recent listing'
      });
    }

    // 2. STATS: Only if broker has activity in last 30 days
    if (daysSinceLastActivity <= 30 && broker.total_listings_count > 0) {
      ctas.push({
        id: 'stats',
        label: '📊 Stats',
        message: generatePerformanceMessage(broker),
        reason: 'Active in last 30 days'
      });
    }

    // 3. RECOGNITION: Only if trust_score >= 70 AND has active listings
    if ((broker.trust_score || 0) >= 70 && broker.active_listings_count > 0) {
      ctas.push({
        id: 'recognition',
        label: '⭐ Recognition',
        message: generateQualityRecognitionMessage(broker),
        reason: 'High trust score with active listings'
      });
    }

    // 4. MATCH ALERT: Only if broker has active listings AND there are requirements in system
    if (broker.active_listings_count > 0 && requirements.length > 0) { // requirements.length checks global system requirements
      ctas.push({
        id: 'match',
        label: '🎯 Match Alert',
        message: generateMatchAlertMessage(broker, null), // Passing null for requirement as we don't have a specific one here
        reason: 'Has active listings + requirements exist'
      });
    }

    // Fallback: If no other CTAs qualify, show generic stats (if broker has any listings)
    if (ctas.length === 0 && broker.total_listings_count > 0) {
      ctas.push({
        id: 'stats',
        label: '📊 Stats',
        message: generatePerformanceMessage(broker),
        reason: 'Fallback message: no specific CTA qualified'
      });
    }

    return ctas;
  };

  // UPDATED: Generate seeding intro message
  const generateSeedingIntro = (broker) => {
    return `Hey 👋 I'm PropAI Live — the world's first AI Agent for Real Estate, born right here in Mumbai 😜

We're building for brokers, not clients — a network where your listings, requirements, and contacts organize themselves ⚡

📲 Send your listings or requirements to our WhatsApp AI:
👉 wa.me/9102269622278
or directly through the WhatsApp AI on Home.


💡 What's SmartFeed?

Your personal property dashboard — updated directly from WhatsApp.
Whatever you send stays linked to your number — your data, your identity, your credit.

Why it matters:
✅ No more posting in 10 groups daily.
✅ No more lost or duplicate listings.
✅ All your properties and requirements in one place.
✅ You focus on deal-making — PropAI handles the chaos.

Example:

> "2 BHK Bandra ₹1.8L FF CP Kapil 9773757759"
→ PropAI structures it, posts it to your SmartFeed, and matches it automatically ⚡

Right now, PropAI is only for brokers as we build a network where your data truly belongs to you.

🎙 Try the voice demo: PropAI Live on ChatGPT - https://chatgpt.com/g/g-690d26698a8c8191bd5fdf09ec0c4c72-propai-live-a-pitch-by-ai
🌐 Visit: propai.live`;
  };

  const copySeedingIntro = (broker) => {
    const message = generateSeedingIntro(broker);
    navigator.clipboard.writeText(message);
    toast.success('📋 Intro message copied!', {
      description: 'Paste into WhatsApp to send to broker',
      duration: 3000
    });
  };

  // Broker Profile Modal
  const BrokerProfileModal = () => {
    if (!selectedBroker) return null;

    // selectedBroker now comes from filteredBrokers (which is brokersWithCounts), so it has counts
    // const brokerProps = properties.filter(p => p.broker_id === selectedBroker.id); // No longer needed for counts

    return (
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{selectedBroker.name}</h3>
                {selectedBroker.custom_id && (
                  <p className="text-sm text-slate-500 font-mono">{selectedBroker.custom_id}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Contact & Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Contact</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="font-mono text-sm">{selectedBroker.phone}</span>
                  </div>
                  {selectedBroker.agency_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{selectedBroker.agency_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Performance</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Trust Score</span>
                    <Badge className="bg-[#FFD300] text-black">
                      {selectedBroker.trust_score || '?'}/100
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Listings</span>
                    <span className="font-bold">{selectedBroker.total_listings_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Active Listings</span>
                    <span className="font-bold text-green-600">{selectedBroker.active_listings_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members */}
            {selectedBroker.team_members && selectedBroker.team_members.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Team Members ({selectedBroker.team_members.length})
                </h4>
                <div className="space-y-2">
                  {selectedBroker.team_members.map((member, idx) => (
                    <div key={idx} className="bg-white/80 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role || 'Partner'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-700">{member.co_listing_count} co-listings</p>
                        {member.phone && (
                          <p className="text-xs text-slate-500 font-mono">{member.phone}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specializations */}
            {selectedBroker.specializations && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" />
                  Specializations
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedBroker.specializations.primary_locations && selectedBroker.specializations.primary_locations.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Primary Locations</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedBroker.specializations.primary_locations.map((loc, idx) => (
                          <Badge key={idx} variant="outline" className="bg-white/50">
                            <MapPin className="w-3 h-3 mr-1" />
                            {loc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedBroker.specializations.preferred_bhk && selectedBroker.specializations.preferred_bhk.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Preferred Properties</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedBroker.specializations.preferred_bhk.map((bhk, idx) => (
                          <Badge key={idx} variant="outline" className="bg-white/50">
                            <Home className="w-3 h-3 mr-1" />
                            {bhk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedBroker.specializations.listing_type_focus && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Focus</p>
                      <Badge className="bg-amber-500 text-white">
                        {selectedBroker.specializations.listing_type_focus}
                      </Badge>
                    </div>
                  )}

                  {selectedBroker.specializations.price_range && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Price Range</p>
                      <p className="text-sm font-semibold">
                        ₹{selectedBroker.specializations.price_range.min}L - ₹{selectedBroker.specializations.price_range.max}L
                      </p>
                      <p className="text-xs text-slate-600">
                        Avg: ₹{selectedBroker.specializations.price_range.avg}L
                      </p>
                    </div>
                  )}
                </div>

                {selectedBroker.specializations.building_expertise && selectedBroker.specializations.building_expertise.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 mb-2">Building Expertise (3+ listings)</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBroker.specializations.building_expertise.map((building, idx) => (
                        <Badge key={idx} className="bg-amber-100 text-amber-800 border-amber-300">
                          <Building2 className="w-3 h-3 mr-1" />
                          {building}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Performance Metrics */}
            {selectedBroker.performance_metrics && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {selectedBroker.performance_metrics.avg_listings_per_month || 0}
                    </p>
                    <p className="text-xs text-slate-600">Listings/Month</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">
                      {selectedBroker.performance_metrics.consistency_score || 0}%
                    </p>
                    <p className="text-xs text-slate-600">Consistency</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {selectedBroker.performance_metrics.quality_score || 0}%
                    </p>
                    <p className="text-xs text-slate-600">Quality</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Profile Summary */}
            {selectedBroker.ai_profile_summary && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Profile Summary
                </h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedBroker.ai_profile_summary}
                  </p>
                </div>
                {selectedBroker.profile_last_updated && (
                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated: {format(new Date(selectedBroker.profile_last_updated), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => handleWhatsApp(selectedBroker)}
                className="bg-[#25D366] hover:bg-[#20BD5A] text-white flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={() => {
                  buildBrokerProfile(selectedBroker.id);
                  setProfileModalOpen(false);
                }}
                disabled={buildingProfile}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${buildingProfile ? 'animate-spin' : ''}`} />
                Rebuild Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // UPDATED: Seeding Intro Modal - removed OTO completion check
  const SeedingIntroModal = () => {
    // REMOVED: These lines were incorrectly referencing undefined 'broker' variable
    // const activeProperties = properties.filter(p => p.broker_id === broker.id);
    // const activeLocations = Array.from(new Set(activeProperties.map(p => p.location).filter(Boolean)));
    // const activeReqs = requirements.filter(r => r.status === 'Active');

    const globalIntroMessage = `Hi Parijat Menghrajani, this is PropAI.

Hope you're doing well!

We'd love to feature your properties on PropAI SmartFeed. Mumbai's smartest property platform.

Send us listings anytime - we'll handle the rest.

📲 WhatsApp: wa.me/9102269622278

Team PropAI
🌐 www.propai.live`;

    return (
      <Dialog open={seedingIntroModalOpen} onOpenChange={setSeedingIntroModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Broker Onboarding</h3>
                <p className="text-sm text-slate-500 font-normal">Send intro messages as needed</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Bulk Send Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                🚀 Bulk Send to All Brokers
              </h4>
              
              <p className="text-sm text-slate-600 mb-4">
                Opens WhatsApp Web for all <strong>{filteredBrokers.length} brokers</strong> with introduction message.
                Each tab opens with 3 second delay — just hit send on each.
              </p>
              
              <Button
                onClick={sendBulkOnboarding}
                disabled={sendingToAll}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-md"
              >
                {sendingToAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Opening WhatsApp...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send to All {filteredBrokers.length} Brokers
                  </>
                )}
              </Button>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="font-bold text-slate-900 mb-3">📋 Manual Copy Options</h4>
              
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-slate-900">📢 Generic Intro Message</h5>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(globalIntroMessage);
                      toast.success('Copied to clipboard!', {
                          description: 'Message copied, ready to paste.',
                          duration: 3000
                      });
                    }}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
                <div className="bg-white rounded-lg p-4 text-sm font-mono text-slate-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {globalIntroMessage}
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>💡 Pro Tip:</strong> Use bulk send for initial outreach, or use individual "Send Intro" button on broker cards for one-off onboarding.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 md:p-6">
      <Toaster position="top-center" richColors closeButton />
      
      <div className="max-w-7xl mx-auto">
        {/* Header - MOBILE OPTIMIZED */}
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 mb-4 md:mb-6">
          <div className="flex flex-col gap-3 mb-4">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">Broker Management</h1>
                <p className="text-xs md:text-sm text-slate-500">{filteredBrokers.length} brokers</p>
              </div>
            </div>
            
            {/* Action Buttons - STACKED ON MOBILE */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setSeedingIntroModalOpen(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md text-sm h-10 flex-1"
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Broker Onboarding
              </Button>
              <Button
                onClick={buildAllBrokerProfiles}
                disabled={buildingAllProfiles}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-md text-sm h-10 flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${buildingAllProfiles ? 'animate-spin' : ''}`} />
                {buildingAllProfiles ? 'Building...' : 'Build All Profiles'}
              </Button>
            </div>
          </div>

          {/* Filters - MOBILE OPTIMIZED */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search brokers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brokers</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="Dormant">Dormant</SelectItem>
                <SelectItem value="HasTeam">Has Team</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Broker Cards Grid - MOBILE OPTIMIZED */}
        {brokersLoading || propertiesLoading || requirementsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          </div>
        ) : filteredBrokers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 md:p-16 text-center border-2 border-slate-200">
            <Users className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">No brokers found</h3>
            <p className="text-sm md:text-base text-slate-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrokers.map((broker) => {
              // const brokerProperties = properties.filter(p => p.broker_id === broker.id); // No longer needed for counts directly
              const hasProfile = broker.ai_profile_summary;
              const hasTeam = broker.team_members && broker.team_members.length > 0;
              const smartCTAs = getSmartCTAs(broker);
              
              return (
                <motion.div
                  key={broker.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl md:rounded-3xl shadow-sm hover:shadow-xl transition-all border-2 border-slate-200 overflow-hidden"
                >
                  <div className="p-4 md:p-5">
                    {/* Broker Icon */}
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0 mb-3 md:mb-4">
                      <Users className="w-7 h-7 md:w-8 md:h-8 text-purple-600" />
                    </div>

                    {/* Broker Info - MOBILE OPTIMIZED */}
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1 mb-1">
                          <h3 className="text-base md:text-lg font-bold text-slate-900 truncate">{broker.name}</h3>
                          <div className="flex flex-wrap items-center gap-1">
                            {broker.verified && (
                              <Badge className="bg-green-500/20 text-green-700 border-green-500 text-xs">
                                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                                Verified
                              </Badge>
                            )}
                            {hasTeam && (
                              <Badge className="bg-blue-500/20 text-blue-700 border-blue-500 text-xs">
                                <Users className="w-2.5 h-2.5 mr-0.5" />
                                Team of {broker.team_members.length + 1}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {broker.custom_id && (
                          <p className="text-xs text-slate-500 font-mono mb-1 truncate">{broker.custom_id}</p>
                        )}
                      </div>
                      {broker.trust_score && (
                        <Badge className="bg-[#FFD300] text-black text-base md:text-lg px-2 md:px-3 py-1 flex-shrink-0">
                          <Star className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" fill="currentColor" />
                          {broker.trust_score}
                        </Badge>
                      )}
                    </div>

                    {/* Contact & Agency - COMPACT ON MOBILE */}
                    <div className="flex flex-col gap-1.5 text-xs md:text-sm text-slate-600 mb-3">
                      <span className="flex items-center gap-1 truncate">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{broker.phone}</span>
                      </span>
                      {broker.agency_name && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{broker.agency_name}</span>
                        </span>
                      )}
                      
                      {/* SHOW BOTH LISTINGS AND REQUIREMENTS */}
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3 flex-shrink-0 text-sky-600" />
                          <strong className="text-sky-600">{broker.active_listings_count || 0}</strong> listings
                        </span>
                        {broker.active_requirements_count > 0 && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3 flex-shrink-0 text-purple-600" />
                              <strong className="text-purple-600">{broker.active_requirements_count}</strong> reqs
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Specializations Preview - COMPACT */}
                    {broker.specializations && (
                      <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
                        {broker.specializations.primary_locations?.slice(0, 2).map((loc, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0">
                            <MapPin className="w-2.5 h-2.5 mr-0.5" />
                            <span className="truncate max-w-[80px]">{loc}</span>
                          </Badge>
                        ))}
                        {broker.specializations.listing_type_focus && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            <Target className="w-2.5 h-2.5 mr-0.5" />
                            {broker.specializations.listing_type_focus}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Contact Actions - FULL WIDTH ON MOBILE */}
                    <div className="flex flex-col gap-2 mb-3 md:mb-4">
                      <Button
                        onClick={() => window.open(`https://wa.me/${broker.phone.replace(/\D/g, '')}`, '_blank')}
                        size="lg"
                        className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm h-11 font-semibold"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedBroker(broker); // Ensure selectedBroker is set for the modal
                          setProfileModalOpen(true);
                        }}
                        size="lg"
                        variant="outline"
                        className="w-full text-sm h-11 font-semibold"
                      >
                        View Profile
                      </Button>
                    </div>

                    {/* Onboarding Actions */}
                    <div className="border-t border-slate-200 pt-3 md:pt-4 mb-3 md:mb-4">
                      <Button
                        onClick={() => sendIndividualOTO(broker)}
                        size="lg"
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-11 font-semibold"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Onboarding Intro
                      </Button>
                    </div>

                    {/* SMART WhatsApp Quick Messages */}
                    {smartCTAs.length > 0 && (
                      <div className="border-t border-slate-200 pt-3 md:pt-4">
                        <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Quick Messages</p>
                        <div className="grid grid-cols-2 gap-2">
                          {smartCTAs.map((cta) => (
                            <Button
                              key={cta.id}
                              onClick={() => handleWhatsAppMessage(cta.message, broker.phone)}
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 px-2"
                              title={cta.reason}
                            >
                              {cta.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BrokerProfileModal />
      <SeedingIntroModal />
    </div>
  );
}
