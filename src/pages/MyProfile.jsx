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
  User, Shield, Star, Package, TrendingUp, Users, Building2,
  MapPin, Home, Award, BarChart3, Eye, MessageCircle, Target,
  Calendar, Phone, Mail, Edit, Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function MyProfile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [brokerProfile, setBrokerProfile] = useState(null);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          navigate(createPageUrl("Home"));
          return;
        }
        setCurrentUser(user);

        // If user has email, try to find matching broker
        if (user.email) {
          const brokers = await base44.entities.Broker.list();
          const matchingBroker = brokers.find(b => 
            b.email?.toLowerCase() === user.email.toLowerCase() ||
            b.phone === user.email // Some users might have phone as email
          );
          setBrokerProfile(matchingBroker);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  // Fetch broker's properties (if broker)
  const { data: properties = [] } = useQuery({
    queryKey: ['my-properties', brokerProfile?.id],
    queryFn: () => base44.entities.Property.list(),
    enabled: !!brokerProfile,
    initialData: []
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['my-requirements', brokerProfile?.id],
    queryFn: () => base44.entities.Requirement.list(),
    enabled: !!brokerProfile,
    initialData: []
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['my-interactions', brokerProfile?.id],
    queryFn: () => base44.entities.PropertyInteraction.list('-created_date'),
    enabled: !!brokerProfile,
    initialData: []
  });

  // For admins - system-wide stats
  const { data: allProperties = [] } = useQuery({
    queryKey: ['admin-all-properties'],
    queryFn: () => base44.entities.Property.list(),
    enabled: currentUser?.role === 'admin',
    initialData: []
  });

  const { data: allBrokers = [] } = useQuery({
    queryKey: ['admin-all-brokers'],
    queryFn: () => base44.entities.Broker.list(),
    enabled: currentUser?.role === 'admin',
    initialData: []
  });

  // Calculate broker metrics
  const brokerMetrics = useMemo(() => {
    if (!brokerProfile) return null;

    const myProps = properties.filter(p => p.broker_id === brokerProfile.id);
    const activeProps = myProps.filter(p => p.status === 'Active' && !p.is_duplicate);
    const myReqs = requirements.filter(r => r.broker_id === brokerProfile.id);
    const activeReqs = myReqs.filter(r => r.status === 'Active');

    // Calculate total AI matches generated
    const totalAIMatches = myReqs.reduce((sum, req) => {
      return sum + (req.ai_matched_properties?.length || 0);
    }, 0);

    // Get interactions for broker's properties
    const myInteractions = interactions.filter(i => 
      myProps.some(p => p.id === i.property_id)
    );
    const views = myInteractions.filter(i => i.interaction_type === 'view').length;
    const inquiries = myInteractions.filter(i => 
      ['inquiry', 'whatsapp', 'call'].includes(i.interaction_type)
    ).length;

    // Top 3 most viewed properties
    const propertyViewCounts = myProps.map(prop => {
      const propViews = myInteractions.filter(i => 
        i.property_id === prop.id && i.interaction_type === 'view'
      ).length;
      return { ...prop, viewCount: propViews };
    });
    const top3Props = propertyViewCounts
      .filter(p => p.viewCount > 0)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 3);

    return {
      totalListings: myProps.length,
      activeListings: activeProps.length,
      totalRequirements: myReqs.length,
      activeRequirements: activeReqs.length,
      totalViews: views,
      totalInquiries: inquiries,
      conversionRate: views > 0 ? ((inquiries / views) * 100).toFixed(1) : 0,
      totalAIMatches,
      top3Properties: top3Props
    };
  }, [brokerProfile, properties, requirements, interactions]);

  // Admin metrics
  const adminMetrics = useMemo(() => {
    if (currentUser?.role !== 'admin') return null;

    const activeProps = allProperties.filter(p => p.status === 'Active' && !p.is_duplicate);
    const activeBrokers = allBrokers.filter(b => b.status === 'Active');

    return {
      totalProperties: allProperties.length,
      activeProperties: activeProps.length,
      totalBrokers: allBrokers.length,
      activeBrokers: activeBrokers.length,
      highTrustBrokers: allBrokers.filter(b => (b.trust_score || 0) >= 75).length
    };
  }, [currentUser, allProperties, allBrokers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  // ADMIN VIEW
  if (currentUser.role === 'admin' && !brokerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
        <Toaster position="top-center" richColors closeButton />
        
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{currentUser.full_name || 'Admin'}</h1>
                <p className="text-slate-600">Administrator • {currentUser.email}</p>
              </div>
            </div>
          </div>

          {/* Admin Stats */}
          {adminMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-5 bg-white border-2 border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{adminMetrics.activeProperties}</p>
                    <p className="text-sm text-slate-600">Active Properties</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-white border-2 border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{adminMetrics.activeBrokers}</p>
                    <p className="text-sm text-slate-600">Active Brokers</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-white border-2 border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{adminMetrics.highTrustBrokers}</p>
                    <p className="text-sm text-slate-600">High Trust Brokers</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <Card className="p-6 bg-white border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                onClick={() => navigate(createPageUrl("Admin"))}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
              >
                <Settings className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-semibold">Admin Panel</span>
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("AdminDashboard"))}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
              >
                <BarChart3 className="w-6 h-6 text-sky-600" />
                <span className="text-sm font-semibold">Analytics</span>
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("AdminBrokers"))}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
              >
                <Users className="w-6 h-6 text-indigo-600" />
                <span className="text-sm font-semibold">Brokers</span>
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("AdminRequirements"))}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
              >
                <Target className="w-6 h-6 text-green-600" />
                <span className="text-sm font-semibold">Requirements</span>
              </Button>
            </div>
          </Card>

          {/* User Info */}
          <Card className="p-6 bg-white border-2 border-slate-200 mt-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Name:</span>
                <span className="text-sm font-semibold text-slate-900">{currentUser.full_name || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Email:</span>
                <span className="text-sm font-semibold text-slate-900">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Role:</span>
                <Badge className="bg-purple-100 text-purple-800">Administrator</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Member since:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {format(new Date(currentUser.created_date), 'MMMM yyyy')}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // BROKER VIEW (or admin who also has broker profile)
  if (brokerProfile && brokerMetrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
        <Toaster position="top-center" richColors closeButton />
        
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{brokerProfile.name}</h1>
                  <p className="text-slate-600">{brokerProfile.custom_id}</p>
                </div>
              </div>
              
              {brokerProfile.trust_score && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-lg px-4 py-2">
                    <Star className="w-5 h-5 mr-2" fill="currentColor" />
                    BrokerTrust™: {brokerProfile.trust_score}/100
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics */}
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
                <Eye className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-slate-600 font-semibold">Total Views</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">{brokerMetrics.totalViews}</p>
            </Card>

            <Card className="p-4 bg-white border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs text-slate-600 font-semibold">Inquiries</p>
              </div>
              <p className="text-3xl font-bold text-green-600">{brokerMetrics.totalInquiries}</p>
              <p className="text-xs text-slate-500 mt-1">{brokerMetrics.conversionRate}% conv.</p>
            </Card>

            <Card className="p-4 bg-white border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-cyan-600" />
                <p className="text-xs text-slate-600 font-semibold">AI Matches</p>
              </div>
              <p className="text-3xl font-bold text-cyan-600">{brokerMetrics.totalAIMatches}</p>
              <p className="text-xs text-slate-500 mt-1">{brokerMetrics.activeRequirements} active reqs</p>
            </Card>
          </div>

          {/* Top Performing Properties */}
          {brokerMetrics.top3Properties.length > 0 && (
            <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Your Top Viewed Properties
              </h3>
              <div className="space-y-3">
                {brokerMetrics.top3Properties.map((prop, idx) => (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl("PropertyDetails") + `?id=${prop.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {prop.ai_title || `${prop.bhk} in ${prop.location}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          ₹{prop.price}{prop.price_unit === 'crores' ? ' Cr' : 'L'} • {prop.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Eye className="w-4 h-4" />
                      <span className="font-bold">{prop.viewCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Profile Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contact & Agency */}
            <Card className="p-6 bg-white border-2 border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Phone:</span>
                  <span className="text-sm font-semibold text-slate-900">{brokerProfile.phone}</span>
                </div>
                {brokerProfile.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Email:</span>
                    <span className="text-sm font-semibold text-slate-900">{brokerProfile.email}</span>
                  </div>
                )}
                {brokerProfile.agency_name && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Agency:</span>
                    <span className="text-sm font-semibold text-slate-900">{brokerProfile.agency_name}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Specializations */}
            {brokerProfile.specializations && (
              <Card className="p-6 bg-white border-2 border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Specializations</h3>
                {brokerProfile.specializations.primary_locations && brokerProfile.specializations.primary_locations.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-600 mb-2">Primary Areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {brokerProfile.specializations.primary_locations.map((loc, idx) => (
                        <Badge key={idx} variant="outline">
                          <MapPin className="w-3 h-3 mr-1" />
                          {loc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {brokerProfile.specializations.listing_type_focus && (
                  <div>
                    <p className="text-xs text-slate-600 mb-2">Focus:</p>
                    <Badge className="bg-amber-500 text-white">
                      {brokerProfile.specializations.listing_type_focus}
                    </Badge>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Team Members */}
          {brokerProfile.team_members && brokerProfile.team_members.length > 0 && (
            <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Team Members ({brokerProfile.team_members.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {brokerProfile.team_members.map((member, idx) => (
                  <div key={idx} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-600">{member.role || 'Partner'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-700">{member.co_listing_count}</p>
                        <p className="text-xs text-slate-600">co-listings</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Profile Summary */}
          {brokerProfile.ai_profile_summary && (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Profile Summary
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {brokerProfile.ai_profile_summary}
              </p>
              {brokerProfile.profile_last_updated && (
                <p className="text-xs text-slate-500 mt-3">
                  Updated: {format(new Date(brokerProfile.profile_last_updated), 'MMMM dd, yyyy')}
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    );
  }

  // REGULAR USER (not admin, no broker profile found)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <Toaster position="top-center" richColors closeButton />
      
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{currentUser.full_name || 'User Profile'}</h1>
          <p className="text-slate-600">{currentUser.email}</p>
        </div>

        <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Name:</span>
              <span className="text-sm font-semibold text-slate-900">{currentUser.full_name || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Email:</span>
              <span className="text-sm font-semibold text-slate-900">{currentUser.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Member since:</span>
              <span className="text-sm font-semibold text-slate-900">
                {format(new Date(currentUser.created_date), 'MMMM yyyy')}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-sky-50 to-cyan-50 border-2 border-sky-200 text-center">
          <Users className="w-12 h-12 text-sky-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Explore Mumbai Real Estate</h3>
          <p className="text-sm text-slate-600 mb-4">
            Browse AI-powered property listings and get personalized recommendations
          </p>
          <Button
            onClick={() => navigate(createPageUrl("SmartFeed"))}
            className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white"
          >
            Browse Properties
          </Button>
        </Card>
      </div>
    </div>
  );
}