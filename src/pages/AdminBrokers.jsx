import React, { useState } from "react";
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
  BarChart3, CheckCircle2, AlertCircle, Home, Package
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

  // Queries
  const { data: brokers = [], isLoading: brokersLoading } = useQuery({
    queryKey: ['admin-brokers'],
    queryFn: () => base44.entities.Broker.list('-last_activity'),
    initialData: [],
    refetchInterval: 15000,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => base44.entities.Property.list(),
    initialData: [],
  });

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

  // View broker details
  const viewBrokerProfile = (broker) => {
    setSelectedBroker(broker);
    setProfileModalOpen(true);
  };

  // WhatsApp broker
  const handleWhatsApp = (broker) => {
    const brokerProps = properties.filter(p => p.broker_id === broker.id);
    
    let message = `Hi ${broker.name}, this is Chariot Realty.\n\n`;
    
    if (brokerProps.length > 0) {
      message += `Regarding your ${brokerProps.length} listing${brokerProps.length > 1 ? 's' : ''}:\n\n`;
      brokerProps.slice(0, 3).forEach((prop, idx) => {
        message += `${idx + 1}. ${prop.bhk || 'Property'} in ${prop.location || 'Mumbai'}\n`;
        message += `   ${prop.building_name ? `${prop.building_name}, ` : ''}`;
        message += `₹${prop.price}${prop.price_unit === 'crores' ? ' Cr' : 'L'}\n`;
        if (prop.custom_id) message += `   ID: ${prop.custom_id}\n`;
        message += '\n';
      });
      if (brokerProps.length > 3) {
        message += `...and ${brokerProps.length - 3} more listing${brokerProps.length - 3 > 1 ? 's' : ''}\n\n`;
      }
      message += `Can we discuss these listings?`;
    } else {
      message += `Can we discuss potential property listings in ${broker.areas_covered?.join(', ') || 'your areas'}?`;
    }
    
    window.open(`https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Filtered brokers
  const filteredBrokers = brokers.filter(broker => {
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

  // Broker Profile Modal
  const BrokerProfileModal = () => {
    if (!selectedBroker) return null;

    const brokerProps = properties.filter(p => p.broker_id === selectedBroker.id);

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
                    <span className="font-bold">{brokerProps.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Active Listings</span>
                    <span className="font-bold text-green-600">{brokerProps.filter(p => p.status === 'Active').length}</span>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Toaster position="top-center" richColors closeButton />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Broker Management</h1>
                <p className="text-sm text-slate-500">{filteredBrokers.length} brokers</p>
              </div>
            </div>
            <Button
              onClick={buildAllBrokerProfiles}
              disabled={buildingAllProfiles}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${buildingAllProfiles ? 'animate-spin' : ''}`} />
              {buildingAllProfiles ? 'Building Profiles...' : 'Build All Profiles'}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search brokers by name, phone, ID, agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
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

        {/* Broker List */}
        {brokersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : filteredBrokers.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No brokers found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBrokers.map((broker) => {
              const brokerProps = properties.filter(p => p.broker_id === broker.id);
              const hasProfile = broker.ai_profile_summary;
              const hasTeam = broker.team_members && broker.team_members.length > 0;
              
              return (
                <motion.div
                  key={broker.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Broker Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>

                    {/* Broker Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-slate-900">{broker.name}</h3>
                            {broker.verified && (
                              <Badge className="bg-green-500/20 text-green-700 border-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {hasTeam && (
                              <Badge className="bg-blue-500/20 text-blue-700 border-blue-500">
                                <Users className="w-3 h-3 mr-1" />
                                Team of {broker.team_members.length + 1}
                              </Badge>
                            )}
                          </div>
                          {broker.custom_id && (
                            <p className="text-xs text-slate-500 font-mono mb-2">{broker.custom_id}</p>
                          )}
                        </div>
                        {broker.trust_score && (
                          <Badge className="bg-[#FFD300] text-black text-lg px-3 py-1">
                            <Star className="w-4 h-4 mr-1" fill="currentColor" />
                            {broker.trust_score}
                          </Badge>
                        )}
                      </div>

                      {/* Contact & Agency */}
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {broker.phone}
                        </span>
                        {broker.agency_name && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {broker.agency_name}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{brokerProps.length} listings</span>
                      </div>

                      {/* Specializations Preview */}
                      {broker.specializations && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {broker.specializations.primary_locations?.slice(0, 3).map((loc, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {loc}
                            </Badge>
                          ))}
                          {broker.specializations.listing_type_focus && (
                            <Badge variant="outline" className="text-xs">
                              <Target className="w-3 h-3 mr-1" />
                              {broker.specializations.listing_type_focus}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => viewBrokerProfile(broker)}
                          size="sm"
                          variant="outline"
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {hasProfile ? 'View Profile' : 'View'}
                        </Button>
                        <Button
                          onClick={() => handleWhatsApp(broker)}
                          size="sm"
                          className="bg-[#25D366] hover:bg-[#20BD5A] text-white gap-1"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </Button>
                        {!hasProfile && (
                          <Button
                            onClick={() => buildBrokerProfile(broker.id)}
                            disabled={buildingProfile}
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white gap-1"
                          >
                            <Sparkles className="w-4 h-4" />
                            Build Profile
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BrokerProfileModal />
    </div>
  );
}