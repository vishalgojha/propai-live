import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Building2, MapPin, Star, TrendingUp, Eye,
  Search, Network, Target, Zap, Home, Mail
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function BrokerNetwork() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Auth check - accessible to all logged-in users
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          navigate(createPageUrl("Home"));
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: brokers = [], isLoading: brokersLoading } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => base44.entities.Broker.list('-total_listings_count'),
    initialData: [],
    enabled: isAuthorized,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list(),
    initialData: [],
    enabled: isAuthorized,
  });

  // Calculate network connections for all brokers
  const brokerNetwork = useMemo(() => {
    if (!brokers.length || !properties.length) return [];

    const network = brokers.map(broker => {
      const brokerProps = properties.filter(p => p.broker_id === broker.id);

      const brokerAreas = new Set(broker.specializations?.primary_locations || broker.areas_covered || []);
      const brokerBuildings = new Set(brokerProps.map(p => p.building_name).filter(Boolean));
      const brokerBHKs = new Set(brokerProps.map(p => p.bhk).filter(Boolean));
      const brokerPrices = brokerProps
        .map(p => p.price_unit === 'crores' ? p.price * 100 : p.price)
        .filter(Boolean);
      const avgPrice = brokerPrices.length > 0
        ? brokerPrices.reduce((a, b) => a + b, 0) / brokerPrices.length
        : 0;

      const connections = brokers
        .filter(otherBroker => otherBroker.id !== broker.id)
        .map(otherBroker => {
          const otherProps = properties.filter(p => p.broker_id === otherBroker.id);
          const otherAreas = new Set(otherBroker.specializations?.primary_locations || otherBroker.areas_covered || []);
          const otherBuildings = new Set(otherProps.map(p => p.building_name).filter(Boolean));
          const otherBHKs = new Set(otherProps.map(p => p.bhk).filter(Boolean));
          const otherPrices = otherProps
            .map(p => p.price_unit === 'crores' ? p.price * 100 : p.price)
            .filter(Boolean);
          const otherAvgPrice = otherPrices.length > 0
            ? otherPrices.reduce((a, b) => a + b, 0) / otherPrices.length
            : 0;

          let score = 0;
          const reasons = [];

          const sharedAreas = [...brokerAreas].filter(area => otherAreas.has(area));
          if (sharedAreas.length > 0) {
            score += Math.min(40, sharedAreas.length * 15);
            reasons.push(`${sharedAreas.length} shared area${sharedAreas.length > 1 ? 's' : ''}`);
          }

          const sharedBuildings = [...brokerBuildings].filter(building => otherBuildings.has(building));
          if (sharedBuildings.length > 0) {
            score += Math.min(30, sharedBuildings.length * 10);
            reasons.push(`${sharedBuildings.length} shared building${sharedBuildings.length > 1 ? 's' : ''}`);
          }

          const isTeamMember = broker.team_members?.some(tm => tm.broker_id === otherBroker.id);
          const isInOtherTeam = otherBroker.team_members?.some(tm => tm.broker_id === broker.id);
          if (isTeamMember || isInOtherTeam) {
            score += 50;
            reasons.push('Known team member');
          }

          const sharedBHKs = [...brokerBHKs].filter(bhk => otherBHKs.has(bhk));
          if (sharedBHKs.length > 0) {
            score += 10;
            reasons.push('Shared BHK types');
          }

          if (avgPrice && otherAvgPrice) {
            const priceDiff = Math.abs(avgPrice - otherAvgPrice) / Math.max(avgPrice, otherAvgPrice);
            if (priceDiff < 0.3) {
              score += 15;
              reasons.push('Similar price range');
            } else if (priceDiff > 0.5 && priceDiff < 1.5) {
              score += 10;
              reasons.push('Complementary price segments');
            }
          }

          if (broker.specializations?.listing_type_focus === otherBroker.specializations?.listing_type_focus && broker.specializations?.listing_type_focus) {
            score += 10;
            reasons.push('Similar listing focus');
          }

          return {
            broker: otherBroker,
            score: Math.round(score),
            reasons,
            sharedAreas,
            sharedBuildings,
            isTeamMember: isTeamMember || isInOtherTeam
          };
        })
        .filter(conn => conn.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      return {
        ...broker,
        connections,
        connectionCount: connections.length,
        strongConnections: connections.filter(c => c.score >= 50).length
      };
    });

    return network.sort((a, b) => b.strongConnections - a.strongConnections);
  }, [brokers, properties]);

  const filteredNetwork = useMemo(() => {
    if (!searchQuery) return brokerNetwork;
    
    const query = searchQuery.toLowerCase();
    return brokerNetwork.filter(broker => 
      broker.name?.toLowerCase().includes(query) ||
      broker.phone?.includes(query) ||
      broker.custom_id?.toLowerCase().includes(query) ||
      broker.areas_covered?.some(area => area.toLowerCase().includes(query)) ||
      broker.specializations?.primary_locations?.some(area => area.toLowerCase().includes(query))
    );
  }, [brokerNetwork, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Network className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 font-medium">Loading network...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-center" richColors closeButton />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Broker Network</h1>
              <p className="text-sm text-slate-600">Discover connections • View profiles • Network stays in-platform</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{brokerNetwork.length}</p>
                <p className="text-xs text-slate-500">Active Brokers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {brokerNetwork.reduce((sum, b) => sum + b.strongConnections, 0)}
                </p>
                <p className="text-xs text-slate-500">Strong Connections</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(properties.map(p => p.building_name).filter(Boolean)).size}
                </p>
                <p className="text-xs text-slate-500">Shared Buildings</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(brokers.flatMap(b => b.areas_covered || [])).size}
                </p>
                <p className="text-xs text-slate-500">Coverage Areas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-slate-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search brokers by name, phone, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
          </div>
        </div>

        {/* Network Grid */}
        {brokersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : filteredNetwork.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-slate-200">
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
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-slate-200 overflow-hidden"
              >
                <div className="p-4">
                  {/* Broker Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">{broker.name}</h3>
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

                  {/* Contact Info - In-Platform Display */}
                  {broker.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-3 p-2 bg-slate-50 rounded-lg">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{broker.email}</span>
                    </div>
                  )}

                  {/* Specializations */}
                  {broker.specializations?.primary_locations && broker.specializations.primary_locations.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {broker.specializations.primary_locations.slice(0, 2).map((loc, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs px-2 py-0">
                            <MapPin className="w-2.5 h-2.5 mr-0.5" />
                            {loc}
                          </Badge>
                        ))}
                        {broker.specializations.primary_locations.length > 2 && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            +{broker.specializations.primary_locations.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Network Stats */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-3 mb-3">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                        <p className="text-xl font-bold text-purple-700">{broker.connectionCount}</p>
                        <p className="text-xs text-slate-600">Connections</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-green-700">{broker.strongConnections}</p>
                        <p className="text-xs text-slate-600">Strong</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Connections (Show only 2) */}
                  {broker.connections.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Top Matches:
                      </p>
                      {broker.connections.slice(0, 2).map((conn, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 rounded-lg p-2 border border-slate-200"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 text-xs truncate">{conn.broker.name}</p>
                              {conn.isTeamMember && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs px-1 py-0">
                                  Team
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <TrendingUp className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-bold text-green-700">{conn.score}%</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 truncate">
                            {conn.reasons[0] || 'Similar market focus'}
                          </p>
                        </div>
                      ))}
                      {broker.connections.length > 2 && (
                        <p className="text-xs text-slate-500 text-center">
                          +{broker.connections.length - 2} more
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions - IN-PLATFORM ONLY */}
                  <div className="flex gap-2 pt-3 border-t border-slate-200">
                    <Button
                      onClick={() => navigate(createPageUrl("BrokerPerformance") + `?id=${broker.id}`)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-9 text-xs font-semibold"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Profile
                    </Button>
                    <Button
                      onClick={() => {
                        toast.info('In-platform messaging coming soon!', {
                          description: 'For now, view their profile to see contact details',
                          duration: 3000
                        });
                      }}
                      variant="outline"
                      className="flex-1 h-9 text-xs font-semibold"
                    >
                      <Mail className="w-3 h-3 mr-1" />
                      Message
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