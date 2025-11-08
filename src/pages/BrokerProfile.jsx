import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Building2, MapPin, Star, Package, TrendingUp, Eye,
  MessageCircle, Target, Calendar, Phone, Mail, Award, Home,
  ArrowLeft, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import PropertyCard from "../components/property/PropertyCard";

export default function BrokerProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const brokerId = urlParams.get('id');

  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load current user and check connection status
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user?.connected_brokers && brokerId) {
          setIsConnected(user.connected_brokers.includes(brokerId));
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, [brokerId]);

  const { data: broker, isLoading } = useQuery({
    queryKey: ['broker-profile', brokerId],
    queryFn: async () => {
      const brokers = await base44.entities.Broker.list();
      return brokers.find(b => b.id === brokerId);
    },
    enabled: !!brokerId,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['broker-properties', brokerId],
    queryFn: async () => {
      const allProps = await base44.entities.Property.list('-created_date');
      return allProps.filter(p => p.broker_id === brokerId);
    },
    enabled: !!brokerId,
    initialData: []
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['broker-requirements', brokerId],
    queryFn: async () => {
      const allReqs = await base44.entities.Requirement.list('-created_date');
      return allReqs.filter(r => r.broker_id === brokerId);
    },
    enabled: !!brokerId,
    initialData: []
  });

  const brokerMetrics = useMemo(() => {
    if (!broker) return null;

    const activeProps = properties.filter(p => p.status === 'Active' && !p.is_duplicate);
    const activeReqs = requirements.filter(r => r.status === 'Active');

    return {
      totalListings: properties.length,
      activeListings: activeProps.length,
      totalRequirements: requirements.length,
      activeRequirements: activeReqs.length,
    };
  }, [broker, properties, requirements]);

  if (!brokerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Broker not found</h2>
          <Button onClick={() => navigate(createPageUrl("BrokerNetwork"))}>
            Back to Network
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !broker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-32 w-full mb-6 rounded-3xl" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* Back Button */}
        <Button
          onClick={() => navigate(createPageUrl("BrokerNetwork"))}
          variant="ghost"
          className="mb-6 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-2xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Network
        </Button>

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-purple-200 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{broker.name}</h1>
                <p className="text-slate-600">{broker.custom_id}</p>
                {broker.agency_name && (
                  <p className="text-sm text-slate-500 mt-1">{broker.agency_name}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {broker.trust_score && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-lg px-4 py-2">
                  <Star className="w-5 h-5 mr-2" fill="currentColor" />
                  {broker.trust_score}/100
                </Badge>
              )}
              {broker.status && (
                <Badge className={
                  broker.status === 'Active' ? 'bg-green-100 text-green-700 border-green-300' :
                  broker.status === 'Verified' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                  'bg-slate-100 text-slate-700 border-slate-300'
                }>
                  {broker.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        {brokerMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-white border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-sky-600" />
                <p className="text-xs text-slate-600 font-semibold">Active Listings</p>
              </div>
              <p className="text-3xl font-bold text-sky-600">{brokerMetrics.activeListings}</p>
              <p className="text-xs text-slate-500 mt-1">{brokerMetrics.totalListings} total</p>
            </Card>

            <Card className="p-4 bg-white border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-slate-600 font-semibold">Requirements</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">{brokerMetrics.activeRequirements}</p>
              <p className="text-xs text-slate-500 mt-1">{brokerMetrics.totalRequirements} total</p>
            </Card>

            <Card className="p-4 bg-white border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <p className="text-xs text-slate-600 font-semibold">Areas Covered</p>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {broker.specializations?.primary_locations?.length || broker.areas_covered?.length || 0}
              </p>
            </Card>

            <Card className="p-4 bg-white border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-slate-600 font-semibold">Team Size</p>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {(broker.team_members?.length || 0) + 1}
              </p>
            </Card>
          </div>
        )}

        {/* Contact Info - Show if connected */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 bg-white border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-600" />
              Contact Information
            </h3>
            
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Phone:</span>
                  <span className="text-sm font-semibold text-slate-900">{broker.phone}</span>
                </div>
                {broker.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Email:</span>
                    <span className="text-sm font-semibold text-slate-900">{broker.email}</span>
                  </div>
                )}
                {broker.agency_name && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Agency:</span>
                    <span className="text-sm font-semibold text-slate-900">{broker.agency_name}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  🔒 Connect with {broker.name} to unlock contact details
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("BrokerNetwork"))}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                >
                  Go to Network
                </Button>
              </div>
            )}
          </Card>

          {/* Specializations */}
          {broker.specializations && (
            <Card className="p-6 bg-white border-2 border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Specializations</h3>
              {broker.specializations.primary_locations && broker.specializations.primary_locations.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-600 mb-2">Primary Areas:</p>
                  <div className="flex flex-wrap gap-2">
                    {broker.specializations.primary_locations.map((loc, idx) => (
                      <Badge key={idx} variant="outline">
                        <MapPin className="w-3 h-3 mr-1" />
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {broker.specializations.listing_type_focus && (
                <div>
                  <p className="text-xs text-slate-600 mb-2">Focus:</p>
                  <Badge className="bg-amber-500 text-white">
                    {broker.specializations.listing_type_focus}
                  </Badge>
                </div>
              )}
              {broker.specializations.preferred_bhk && broker.specializations.preferred_bhk.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-600 mb-2">BHK Types:</p>
                  <div className="flex flex-wrap gap-2">
                    {broker.specializations.preferred_bhk.map((bhk, idx) => (
                      <Badge key={idx} variant="outline">
                        <Home className="w-3 h-3 mr-1" />
                        {bhk}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Team Members */}
        {broker.team_members && broker.team_members.length > 0 && (
          <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Team ({broker.team_members.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {broker.team_members.map((member, idx) => (
                <div key={member.broker_id || idx} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{member.name}</p>
                      {isConnected && member.phone && (
                        <p className="text-xs text-slate-600">{member.phone}</p>
                      )}
                      <p className="text-xs text-blue-600 mt-1">{member.role || 'Team Member'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-700">{member.co_listing_count || 0}</p>
                      <p className="text-xs text-slate-600">listings</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* AI Profile Summary */}
        {broker.ai_profile_summary && (
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Profile Summary
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {broker.ai_profile_summary}
            </p>
            {broker.profile_last_updated && (
              <p className="text-xs text-slate-500 mt-3">
                Updated: {format(new Date(broker.profile_last_updated), 'MMMM dd, yyyy')}
              </p>
            )}
          </Card>
        )}

        {/* Active Properties */}
        {properties.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-600" />
                Active Listings ({properties.filter(p => p.status === 'Active' && !p.is_duplicate).length})
              </h3>
              {currentUser?.role === 'admin' && (
                <Button
                  onClick={() => navigate(createPageUrl("BrokerPerformance") + `?id=${brokerId}`)}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {properties
                .filter(p => p.status === 'Active' && !p.is_duplicate)
                .slice(0, 6)
                .map(property => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onViewDetails={(prop) => {
                      navigate(createPageUrl("PropertyDetails") + `?id=${prop.id}`);
                    }}
                  />
                ))}
            </div>
            
            {properties.filter(p => p.status === 'Active' && !p.is_duplicate).length > 6 && (
              <div className="mt-4 text-center">
                <Button
                  onClick={() => navigate(createPageUrl("SmartFeed") + `?broker=${brokerId}`)}
                  variant="outline"
                >
                  View All {properties.filter(p => p.status === 'Active' && !p.is_duplicate).length} Properties
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Active Requirements */}
        {requirements.filter(r => r.status === 'Active').length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-600" />
              Active Requirements ({requirements.filter(r => r.status === 'Active').length})
            </h3>
            
            <div className="space-y-3">
              {requirements
                .filter(r => r.status === 'Active')
                .slice(0, 5)
                .map(req => (
                  <Card key={req.id} className="p-4 bg-white border border-slate-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-2">{req.client_name || 'Client Requirement'}</h4>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {req.bhk_preference && req.bhk_preference.length > 0 && (
                            <Badge variant="outline">
                              {req.bhk_preference.join(', ')}
                            </Badge>
                          )}
                          {req.preferred_locations && req.preferred_locations.length > 0 && (
                            <Badge variant="outline">
                              <MapPin className="w-3 h-3 mr-1" />
                              {req.preferred_locations[0]}
                              {req.preferred_locations.length > 1 && ` +${req.preferred_locations.length - 1}`}
                            </Badge>
                          )}
                          {(req.budget_min || req.budget_max) && (
                            <Badge variant="outline">
                              ₹{req.budget_min || 0}-{req.budget_max || 0}{req.budget_unit === 'crores' ? 'Cr' : 'L'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge className={
                        req.urgency === 'High' ? 'bg-red-100 text-red-700 border-red-300' :
                        req.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                        'bg-blue-100 text-blue-700 border-blue-300'
                      }>
                        {req.urgency || 'Medium'}
                      </Badge>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}