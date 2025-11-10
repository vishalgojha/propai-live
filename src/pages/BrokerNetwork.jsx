
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Users, Building2, MapPin, Star, Package, TrendingUp, Eye,
  MessageCircle, UserPlus, UserCheck, Search, Network,
  Phone, Mail, Sparkles, Award, DollarSign, ShieldCheck, Target // Added Target icon
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function BrokerNetwork() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserBroker, setCurrentUserBroker] = useState(null);

  // Load current user and their broker profile - NO REDIRECT IF NOT LOGGED IN
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // If user has broker_id, fetch their broker profile
        if (user?.broker_id) {
          const brokers = await base44.entities.Broker.list();
          const userBroker = brokers.find(b => b.id === user.broker_id);
          setCurrentUserBroker(userBroker);
        }
      } catch (error) {
        // ✅ FIXED: Don't redirect, just set user to null - page is public
        setCurrentUser(null);
        setCurrentUserBroker(null);
      }
    };
    loadUser();
  }, []);

  const { data: brokers = [], isLoading: brokersLoading } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => base44.entities.Broker.list('-last_activity'),
    initialData: [],
    refetchInterval: 30000,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list(),
    initialData: [],
  });

  // ✅ ADD: Fetch requirements
  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list(),
    initialData: [],
  });

  // Connect/Disconnect mutation
  const connectMutation = useMutation({
    mutationFn: async (brokerId) => {
      const currentConnections = currentUser?.connected_brokers || [];
      const isConnected = currentConnections.includes(brokerId);
      
      const updatedConnections = isConnected
        ? currentConnections.filter(id => id !== brokerId)
        : [...currentConnections, brokerId];
      
      await base44.auth.updateMe({ connected_brokers: updatedConnections });
      return { brokerId, isConnected: !isConnected };
    },
    onSuccess: ({ brokerId, isConnected }) => {
      const broker = brokers.find(b => b.id === brokerId);
      
      if (isConnected) {
        toast.success(`✅ Connected with ${broker?.name}!`, {
          description: 'Contact details are now unlocked',
          duration: 3000,
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0'
        });
      } else {
        toast.info(`Disconnected from ${broker?.name}`, {
          duration: 2000
        });
      }
      
      // Update local user state
      setCurrentUser(prev => ({
        ...prev,
        connected_brokers: isConnected 
          ? [...(prev?.connected_brokers || []), brokerId]
          : (prev?.connected_brokers || []).filter(id => id !== brokerId)
      }));
    },
    onError: (error) => {
      toast.error('Connection failed', {
        description: error.message
      });
    }
  });

  const handleConnect = (brokerId) => {
    if (!currentUser) {
      // ✅ FIXED: Prompt login instead of navigating away
      toast.info('Login required to connect with brokers', {
        description: 'Click login to unlock contact details',
        duration: 4000,
        action: {
          label: 'Login',
          onClick: () => base44.auth.redirectToLogin(window.location.pathname)
        }
      });
      return;
    }
    connectMutation.mutate(brokerId);
  };

  // Calculate network intelligence
  const networkData = useMemo(() => {
    // If currentUser is null, we can still show brokers, but networkScore will be 0 and isConnected will be false.
    // The previous check `if (!currentUser || !currentUserBroker)` would return an empty array if not logged in.
    // Now, it should proceed, but handle null currentUser/currentUserBroker gracefully for calculations.
    const currentBrokerId = currentUserBroker?.id;

    return brokers.map(broker => {
      if (broker.id === currentBrokerId) return null; // Don't show self if logged in

      let score = 0;
      const insights = [];
      const isConnected = currentUser?.connected_brokers?.includes(broker.id) || false;

      // ✅ CALCULATE COUNTS
      const brokerProperties = properties.filter(p => p.broker_id === broker.id);
      const activeProperties = brokerProperties.filter(p => p.status === 'Active' && !p.is_duplicate);
      const brokerRequirements = requirements.filter(r => r.broker_id === broker.id);
      const activeRequirements = brokerRequirements.filter(r => r.status === 'Active');

      // Team relationship check (40 points) - only if current user is logged in and has a broker profile
      if (currentUserBroker) {
        const isTeamMember = currentUserBroker.team_members?.some(m => m.broker_id === broker.id);
        const isTeamLeader = broker.team_members?.some(m => m.broker_id === currentUserBroker.id);
        const sameTeamLeader = currentUserBroker.reports_to && currentUserBroker.reports_to === broker.reports_to;
        
        if (isTeamMember) {
          score += 40;
          insights.push({
            type: 'team',
            icon: '👥',
            label: 'Your Team Member',
            description: `${broker.name} is in your team`,
            color: 'bg-blue-100 text-blue-700 border-blue-300'
          });
        } else if (isTeamLeader) {
          score += 40;
          insights.push({
            type: 'team',
            icon: '⭐',
            label: 'Your Team Leader',
            description: `${broker.name} leads your team`,
            color: 'bg-indigo-100 text-indigo-700 border-indigo-300'
          });
        } else if (sameTeamLeader) {
          score += 35;
          insights.push({
            type: 'team',
            icon: '🤝',
            label: 'Same Team',
            description: 'You work under the same team leader',
            color: 'bg-purple-100 text-purple-700 border-purple-300'
          });
        }

        // Calculate price range complementarity (30 points)
        const myProps = properties.filter(p => p.broker_id === currentUserBroker.id && p.status === 'Active' && !p.is_duplicate);
        const theirProps = properties.filter(p => p.broker_id === broker.id && p.status === 'Active' && !p.is_duplicate);

        if (myProps.length > 0 && theirProps.length > 0) {
          const myPrices = myProps.map(p => p.price_unit === 'crores' ? p.price * 100 : p.price);
          const theirPrices = theirProps.map(p => p.price_unit === 'crores' ? p.price * 100 : p.price);

          const myAvg = myPrices.reduce((a, b) => a + b, 0) / myPrices.length;
          const theirAvg = theirPrices.reduce((a, b) => a + b, 0) / theirPrices.length;

          const priceDiff = Math.abs(myAvg - theirAvg);
          const percentDiff = priceDiff / Math.max(myAvg, theirAvg);

          // Complementary if price ranges differ by 30%+ (different market segments)
          if (percentDiff > 0.3) {
            score += 30;
            const higherBroker = theirAvg > myAvg ? broker.name : 'You';
            const lowerBroker = theirAvg > myAvg ? 'You' : broker.name;
            
            insights.push({
              type: 'price',
              icon: '💰',
              label: 'Complementary Price Range',
              description: `${higherBroker} handle${higherBroker === 'You' ? '' : 's'} premium segment, ${lowerBroker} handle${lowerBroker === 'You' ? '' : 's'} mid-range`,
              color: 'bg-emerald-100 text-emerald-700 border-emerald-300'
            });
          } 
          // Similar price range (15 points - potential competition but also collaboration)
          else if (percentDiff < 0.15) {
            score += 15;
            insights.push({
              type: 'price',
              icon: '🎯',
              label: 'Similar Price Range',
              description: 'You both serve the same market segment',
              color: 'bg-amber-100 text-amber-700 border-amber-300'
            });
          }
        }

        // Shared locations (20 points)
        const myAreas = currentUserBroker.specializations?.primary_locations || currentUserBroker.areas_covered || [];
        const theirAreas = broker.specializations?.primary_locations || broker.areas_covered || [];
        const sharedAreas = myAreas.filter(area => theirAreas.includes(area));

        if (sharedAreas.length > 0) {
          score += Math.min(20, sharedAreas.length * 7);
          insights.push({
            type: 'location',
            icon: '📍',
            label: `${sharedAreas.length} Shared Area${sharedAreas.length > 1 ? 's' : ''}`,
            description: sharedAreas.slice(0, 2).join(', ') + (sharedAreas.length > 2 ? '...' : ''),
            color: 'bg-cyan-100 text-cyan-700 border-cyan-300'
          });
        }

        // Shared buildings (15 points)
        const myBuildings = [...new Set(myProps.map(p => p.building_id).filter(Boolean))];
        const theirBuildings = [...new Set(theirProps.map(p => p.building_id).filter(Boolean))];
        const sharedBuildings = myBuildings.filter(b => theirBuildings.includes(b));

        if (sharedBuildings.length > 0) {
          score += Math.min(15, sharedBuildings.length * 5);
          insights.push({
            type: 'building',
            icon: '🏢',
            label: `${sharedBuildings.length} Shared Building${sharedBuildings.length > 1 ? 's' : ''}`,
            description: 'You list properties in the same buildings',
            color: 'bg-violet-100 text-violet-700 border-violet-300'
          });
        }
      } // End of currentUserBroker specific insights

      // High trust score (10 points) - applies even if not logged in
      if (broker.trust_score >= 85) {
        score += 10;
        insights.push({
          type: 'trust',
          icon: '🛡️',
          label: 'High Trust Score',
          description: `${broker.trust_score}/100 - Reliable broker`,
          color: 'bg-green-100 text-green-700 border-green-300'
        });
      }

      return {
        ...broker,
        networkScore: Math.min(100, score),
        connectionInsights: insights,
        isConnected,
        sharedAreas: [], // These were used for calculations above, not directly displayed now.
        sharedBuildings: 0, // Same here.
        // ✅ ADD CALCULATED COUNTS
        active_listings_count: activeProperties.length,
        active_requirements_count: activeRequirements.length,
      };
    }).filter(Boolean); // Remove null (self)
  }, [brokers, properties, requirements, currentUser, currentUserBroker]); // Added requirements to dependencies

  // Filter and sort network
  const filteredNetwork = useMemo(() => {
    let filtered = networkData;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(broker => 
        broker.name?.toLowerCase().includes(query) ||
        broker.phone?.includes(query) ||
        broker.agency_name?.toLowerCase().includes(query) ||
        broker.areas_covered?.some(area => area.toLowerCase().includes(query)) ||
        broker.specializations?.primary_locations?.some(loc => loc.toLowerCase().includes(query))
      );
    }

    // Sort by network score (highest first)
    return filtered.sort((a, b) => b.networkScore - a.networkScore);
  }, [networkData, searchQuery]);

  const connectedCount = currentUser?.connected_brokers?.length || 0;
  const strongConnections = filteredNetwork.filter(b => b.networkScore >= 50).length;

  // ✅ REMOVED: Login required screen - page is now public

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
                  Broker Network
                </h1>
                <p className="text-sm text-slate-600 font-light">Connect, collaborate, and grow together</p>
              </div>
            </div>
            {/* ✅ FIXED: Only show connection count if user is logged in */}
            {currentUser && connectedCount > 0 && (
              <Badge className="bg-green-100 text-green-700 border-green-300 text-lg px-4 py-2">
                <UserCheck className="w-5 h-5 mr-2" />
                {connectedCount} Connection{connectedCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* ✅ NEW: Login prompt banner for non-logged-in users */}
        {!currentUser && (
          <div className="mb-6 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl p-5 border-2 border-purple-300">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">🔓 Login to Connect</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Browse brokers publicly, but login to unlock contact details and build your network.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold"
              >
                Login
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-white border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <p className="text-xs text-slate-600 font-semibold">Network Size</p>
            </div>
            <p className="text-3xl font-bold text-purple-600">{filteredNetwork.length}</p>
            <p className="text-xs text-slate-500 mt-1">Active brokers</p>
          </Card>

          <Card className="p-4 bg-white border-2 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-xs text-slate-600 font-semibold">Strong Matches</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{strongConnections}</p>
            <p className="text-xs text-slate-500 mt-1">50%+ compatibility</p>
          </Card>

          <Card className="p-4 bg-white border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-slate-600 font-semibold">Your Connections</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{connectedCount}</p>
            <p className="text-xs text-slate-500 mt-1">{currentUser ? 'Unlocked contacts' : 'Login to connect'}</p>
          </Card>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-purple-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search brokers by name, phone, area, agency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 border-purple-200 focus-visible:ring-purple-500"
            />
          </div>
        </div>

        {/* Network Grid */}
        {brokersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-96 rounded-2xl" />)}
          </div>
        ) : filteredNetwork.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-purple-200">
            <Network className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No brokers found</h3>
            <p className="text-slate-500">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNetwork.map((broker) => (
              <motion.div
                key={broker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-purple-200 overflow-hidden"
              >
                <div className="p-4">
                  {/* Broker Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">{broker.name}</h3>
                      {broker.agency_name && (
                        <p className="text-xs text-purple-600 font-semibold truncate flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {broker.agency_name}
                        </p>
                      )}
                      {broker.custom_id && (
                        <p className="text-xs text-slate-500 font-mono truncate">{broker.custom_id}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {broker.trust_score && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs px-1.5 py-0">
                            <Star className="w-2.5 h-2.5 mr-0.5" fill="currentColor" />
                            {broker.trust_score}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {broker.total_listings_count || 0} listings
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Connection Insights - INTELLIGENT REASONS */}
                  {broker.connectionInsights && broker.connectionInsights.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {broker.connectionInsights.slice(0, 3).map((insight, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 p-2 rounded-lg border ${insight.color}`}
                        >
                          <span className="text-base">{insight.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{insight.label}</p>
                            <p className="text-xs opacity-80 truncate">{insight.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Network Score */}
                  {broker.networkScore > 0 && (
                    <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700">Network Match</span>
                        <span className="text-xs font-bold text-purple-700">{broker.networkScore}%</span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            broker.networkScore >= 70 ? 'bg-green-500' :
                            broker.networkScore >= 40 ? 'bg-blue-500' :
                            'bg-purple-500'
                          }`}
                          style={{ width: `${broker.networkScore}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ✅ SHOW LISTINGS + REQUIREMENTS */}
                  <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Package className="w-3 h-3 text-sky-600" />
                        Active Listings
                      </span>
                      <span className="font-bold text-sky-600">{broker.active_listings_count || 0}</span>
                    </div>
                    
                    {broker.active_requirements_count > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Target className="w-3 h-3 text-purple-600" />
                          Requirements
                        </span>
                        <span className="font-bold text-purple-600">{broker.active_requirements_count}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info - Show if connected */}
                  {broker.isConnected && currentUser ? ( // Only show if connected AND user is logged in
                    <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200 space-y-1">
                      <p className="text-xs font-semibold text-green-700 mb-1.5">🔓 Unlocked Contact</p>
                      {broker.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-green-600" />
                          <p className="text-xs font-mono text-slate-900">{broker.phone}</p>
                        </div>
                      )}
                      {broker.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-green-600" />
                          <p className="text-xs text-slate-900 truncate">{broker.email}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-600 text-center">
                        🔒 Connect to unlock contact details
                      </p>
                    </div>
                  )}

                  {/* Specializations */}
                  {broker.specializations?.primary_locations && broker.specializations.primary_locations.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-600 mb-1.5 font-semibold">Primary Areas:</p>
                      <div className="flex flex-wrap gap-1">
                        {broker.specializations.primary_locations.slice(0, 3).map((loc, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <MapPin className="w-2.5 h-2.5 mr-0.5" />
                            {loc}
                          </Badge>
                        ))}
                        {broker.specializations.primary_locations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{broker.specializations.primary_locations.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions - SMART CONNECT BUTTON */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-purple-200">
                    <Button
                      onClick={() => handleConnect(broker.id)}
                      disabled={connectMutation.isPending}
                      className={`h-9 text-xs font-semibold ${
                        broker.isConnected
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : broker.networkScore >= 50
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                            : 'bg-slate-600 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {broker.isConnected ? (
                        <>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Connected
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-1" />
                          {broker.networkScore >= 50 ? 'Smart Match' : 'Connect'}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => navigate(createPageUrl("BrokerProfile") + `?id=${broker.id}`)}
                      variant="outline"
                      className="h-9 text-xs font-semibold border-purple-200"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
