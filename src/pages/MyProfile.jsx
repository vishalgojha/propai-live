
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  User, Shield, Star, Package, TrendingUp, Users, Building2,
  MapPin, Home, Award, BarChart3, Eye, MessageCircle, Target,
  Calendar, Phone, Mail, Edit, Settings, AlertCircle, X, Loader2
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

  const [editingAreas, setEditingAreas] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);

  const [editingTeam, setEditingTeam] = useState(false);
  const [teamMemberPhone, setTeamMemberPhone] = useState("");
  const [addingTeamMember, setAddingTeamMember] = useState(false);

  const popularAreas = [
    "Bandra West", "Juhu", "Andheri West", "Khar West",
    "BKC", "Worli", "Lower Parel", "Powai",
    "Santacruz West", "Versova", "Malad West", "Goregaon West"
  ];

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          navigate(createPageUrl("Home"));
          return;
        }
        
        setCurrentUser(user);
        if (user.preferred_areas) {
          setSelectedAreas(user.preferred_areas);
        }

        if (user.broker_id) {
          const brokers = await base44.entities.Broker.list();
          const broker = brokers.find(b => b.id === user.broker_id);
          
          if (broker) {
            setBrokerProfile(broker);
          }
        } else if (user.email) {
          const brokers = await base44.entities.Broker.list();
          
          const matchingBroker = brokers.find(b => {
            const normalizePhone = (phone) => phone?.replace(/\D/g, '').slice(-10);
            const userEmailAsPhone = normalizePhone(user.email);
            const brokerPhone = normalizePhone(b.phone);
            
            const emailMatch = b.email?.toLowerCase() === user.email.toLowerCase();
            const phoneMatch = userEmailAsPhone && brokerPhone && userEmailAsPhone === brokerPhone;
            
            return emailMatch || phoneMatch;
          });
          
          if (matchingBroker) {
            setBrokerProfile(matchingBroker);
            try {
              await base44.auth.updateMe({ broker_id: matchingBroker.id });
            } catch (error) {
              console.error('Failed to auto-link broker:', error);
            }
          }
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

  const handleSaveAreas = async () => {
    try {
      await base44.auth.updateMe({ preferred_areas: selectedAreas });
      setEditingAreas(false);
      setCurrentUser(prevUser => ({
        ...prevUser,
        preferred_areas: selectedAreas,
      }));
      toast.success('✅ Preferred Areas Saved!', {
        description: 'Your SmartFeed will prioritize these areas',
        duration: 3000
      });
    } catch (error) {
      toast.error('Failed to save areas', {
        description: error.message
      });
    }
  };

  const toggleArea = (area) => {
    if (selectedAreas.includes(area)) {
      setSelectedAreas(selectedAreas.filter(a => a !== area));
    } else {
      setSelectedAreas([...selectedAreas, area]);
    }
  };

  const handleAddTeamMember = async () => {
    if (!teamMemberPhone.trim() || !brokerProfile) return;
    
    setAddingTeamMember(true);
    try {
      const normalizePhone = (phone) => phone.replace(/\D/g, '').slice(-10);
      const normalized = normalizePhone(teamMemberPhone);
      
      if (normalized.length !== 10) {
        toast.error('Invalid Phone', {
          description: 'Please enter a valid 10-digit phone number'
        });
        setAddingTeamMember(false);
        return;
      }
      
      const brokers = await base44.entities.Broker.list();
      const teamMemberBroker = brokers.find(b => {
        const brokerPhone = normalizePhone(b.phone);
        return brokerPhone === normalized;
      });
      
      if (!teamMemberBroker) {
        toast.error('❌ Broker Not Found', {
          description: (
            <div className="space-y-2">
              <p>No broker with phone {teamMemberPhone} exists in PropAI system.</p>
              <p className="text-xs opacity-90">💡 They need to list at least one property first, then you can add them to your team.</p>
            </div>
          ),
          duration: 6000
        });
        setAddingTeamMember(false);
        return;
      }
      
      if (teamMemberBroker.id === brokerProfile.id) {
        toast.error('Cannot add yourself');
        setAddingTeamMember(false);
        return;
      }
      
      const currentTeam = brokerProfile.team_members || [];
      if (currentTeam.some(m => m.broker_id === teamMemberBroker.id)) {
        toast.error('Already in team', {
          description: `${teamMemberBroker.name} is already a team member`
        });
        setAddingTeamMember(false);
        return;
      }
      
      const allProps = await base44.entities.Property.list();
      const memberListings = allProps.filter(p => 
        p.broker_id === teamMemberBroker.id && 
        p.status === 'Active' && 
        !p.is_duplicate
      );
      
      const newTeamMemberData = {
        broker_id: teamMemberBroker.id,
        name: teamMemberBroker.name,
        phone: teamMemberBroker.phone,
        role: teamMemberBroker.agency_name || 'Team Member',
        co_listing_count: memberListings.length,
        agency_name: teamMemberBroker.agency_name
      };

      const updatedTeam = [
        ...currentTeam,
        newTeamMemberData
      ];

      const updatedTeamLeaderOf = [...(brokerProfile.team_leader_of || []), teamMemberBroker.id];
      
      await base44.entities.Broker.update(brokerProfile.id, {
        team_members: updatedTeam,
        team_leader_of: updatedTeamLeaderOf
      });
      
      await base44.entities.Broker.update(teamMemberBroker.id, {
        reports_to: brokerProfile.id
      });
      
      setBrokerProfile(prevBrokerProfile => ({
        ...prevBrokerProfile,
        team_members: updatedTeam,
        team_leader_of: updatedTeamLeaderOf,
      }));

      toast.success('✅ Team Member Added!', {
        description: `${teamMemberBroker.name} joined your team • ${memberListings.length} active listings`,
        duration: 4000
      });
      
      setTeamMemberPhone('');
      setEditingTeam(false);
    } catch (error) {
      toast.error('Failed to add team member', {
        description: error.message
      });
    } finally {
      setAddingTeamMember(false);
    }
  };

  const handleRemoveTeamMember = async (memberBrokerId) => {
    if (!brokerProfile || !window.confirm('Remove this team member?')) return;
    
    try {
      const updatedTeam = (brokerProfile.team_members || []).filter(
        m => m.broker_id !== memberBrokerId
      );
      const updatedTeamLeaderOf = (brokerProfile.team_leader_of || []).filter(id => id !== memberBrokerId);
      
      await base44.entities.Broker.update(brokerProfile.id, {
        team_members: updatedTeam,
        team_leader_of: updatedTeamLeaderOf
      });
      
      await base44.entities.Broker.update(memberBrokerId, {
        reports_to: null
      });

      setBrokerProfile(prevBrokerProfile => ({
        ...prevBrokerProfile,
        team_members: updatedTeam,
        team_leader_of: updatedTeamLeaderOf,
      }));
      
      toast.success('Team member removed');
    } catch (error) {
      toast.error('Failed to remove team member');
    }
  };

  const { data: properties = [] } = useQuery({
    queryKey: ['my-properties', brokerProfile?.id],
    queryFn: async () => {
      if (!brokerProfile) return [];
      const allProps = await base44.entities.Property.list('-created_date');
      const myProps = allProps.filter(p => p.broker_id === brokerProfile.id);
      return myProps;
    },
    enabled: !!brokerProfile,
    initialData: []
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['my-requirements', brokerProfile?.id],
    queryFn: async () => {
      if (!brokerProfile) return [];
      const allReqs = await base44.entities.Requirement.list('-created_date');
      const myReqs = allReqs.filter(r => r.broker_id === brokerProfile.id);
      return myReqs;
    },
    enabled: !!brokerProfile,
    initialData: []
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['my-interactions', brokerProfile?.id, properties.length],
    queryFn: async () => {
      if (!brokerProfile || properties.length === 0) return [];
      const allInteractions = await base44.entities.PropertyInteraction.list('-created_date');
      const myPropertyIds = properties.map(p => p.id);
      const myInteractions = allInteractions.filter(i => myPropertyIds.includes(i.property_id));
      return myInteractions;
    },
    enabled: !!brokerProfile && properties.length > 0,
    initialData: []
  });

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

  const enrichedTeamMembers = useMemo(() => {
    if (!brokerProfile?.team_members || properties.length === 0) {
      return brokerProfile?.team_members || [];
    }

    return brokerProfile.team_members.map(member => {
      const memberActiveListings = properties.filter(p => 
        p.broker_id === member.broker_id && 
        p.status === 'Active' && 
        !p.is_duplicate
      ).length;

      return {
        ...member,
        co_listing_count: memberActiveListings,
        hasData: memberActiveListings > 0
      };
    });
  }, [brokerProfile, properties]);

  const brokerMetrics = useMemo(() => {
    if (!brokerProfile) return null;

    const myProps = properties.filter(p => p.broker_id === brokerProfile.id);
    const activeProps = myProps.filter(p => p.status === 'Active' && !p.is_duplicate);
    const myReqs = requirements.filter(r => r.broker_id === brokerProfile.id);
    const activeReqs = myReqs.filter(r => r.status === 'Active');

    const totalAIMatches = myReqs.reduce((sum, req) => {
      return sum + (req.ai_matched_properties?.length || 0);
    }, 0);

    const myInteractions = interactions.filter(i =>
      myProps.some(p => p.id === i.property_id)
    );
    const views = myInteractions.filter(i => i.interaction_type === 'view').length;
    const inquiries = myInteractions.filter(i =>
      ['inquiry', 'whatsapp', 'call'].includes(i.interaction_type)
    ).length;

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Toaster position="top-center" richColors closeButton />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{currentUser.full_name || 'Admin'}</h1>
                <p className="text-slate-600">Administrator • {currentUser.email}</p>
              </div>
            </div>
          </div>

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

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-purple-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">My Area Preferences</h3>
              </div>
              <Button
                onClick={() => setEditingAreas(!editingAreas)}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {editingAreas ? 'Cancel' : 'Edit Areas'}
              </Button>
            </div>

            {editingAreas ? (
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  Select areas you want to focus on:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {popularAreas.map((area) => {
                    const isSelected = selectedAreas.includes(area);
                    return (
                      <Button
                        key={area}
                        onClick={() => toggleArea(area)}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`rounded-xl ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                            : "border-purple-200 hover:bg-purple-50"
                        }`}
                      >
                        {area}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  onClick={handleSaveAreas}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                >
                  Save Preferred Areas
                </Button>
              </div>
            ) : (
              <div>
                {currentUser.preferred_areas && currentUser.preferred_areas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentUser.preferred_areas.map((area) => (
                      <Badge key={area} className="bg-purple-100 text-purple-800 border-purple-300">
                        <MapPin className="w-3 h-3 mr-1" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No preferred areas set. Click "Edit Areas" to customize your feed.
                  </p>
                )}
              </div>
            )}
          </div>

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

  // BROKER VIEW
  if (brokerProfile && brokerMetrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Toaster position="top-center" richColors closeButton />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{brokerProfile.name}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-slate-600">{brokerProfile.custom_id}</p>
                    {brokerProfile.agency_name && (
                      <>
                        <span className="text-slate-400">•</span>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-purple-600" />
                          <p className="text-sm font-semibold text-purple-700">{brokerProfile.agency_name}</p>
                        </div>
                      </>
                    )}
                  </div>
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

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-purple-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">My Area Preferences</h3>
              </div>
              <Button
                onClick={() => setEditingAreas(!editingAreas)}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {editingAreas ? 'Cancel' : 'Edit Areas'}
              </Button>
            </div>

            {editingAreas ? (
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  Select areas you want to focus on in SmartFeed:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {popularAreas.map((area) => {
                    const isSelected = selectedAreas.includes(area);
                    return (
                      <Button
                        key={area}
                        onClick={() => toggleArea(area)}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`rounded-xl ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                            : "border-purple-200 hover:bg-purple-50"
                        }`}
                      >
                        {area}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  onClick={handleSaveAreas}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                >
                  Save Preferred Areas
                </Button>
              </div>
            ) : (
              <div>
                {currentUser.preferred_areas && currentUser.preferred_areas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentUser.preferred_areas.map((area) => (
                      <Badge key={area} className="bg-purple-100 text-purple-800 border-purple-300">
                        <MapPin className="w-3 h-3 mr-1" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No preferred areas set. Click "Edit Areas" to personalize your SmartFeed.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-slate-600">Agency:</span>
                    <span className="text-sm font-semibold text-purple-900">{brokerProfile.agency_name}</span>
                  </div>
                )}
              </div>
            </Card>

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

          <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                My Team ({enrichedTeamMembers.length})
              </h3>
              <Button
                onClick={() => {
                  setEditingTeam(!editingTeam);
                  setTeamMemberPhone('');
                  setAddingTeamMember(false);
                }}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {editingTeam ? 'Cancel' : 'Manage Team'}
              </Button>
            </div>

            {editingTeam && (
              <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Add Team Member by Phone</p>
                <p className="text-xs text-blue-700 mb-3">
                  Enter the 10-digit phone number of a broker already in the PropAI system
                </p>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={teamMemberPhone}
                    onChange={(e) => setTeamMemberPhone(e.target.value)}
                    placeholder="e.g., 9820056789"
                    className="flex-1 text-sm"
                    disabled={addingTeamMember}
                  />
                  <Button
                    onClick={handleAddTeamMember}
                    disabled={addingTeamMember || !teamMemberPhone.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    {addingTeamMember ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {enrichedTeamMembers.length > 0 ? (
              <div className="space-y-3">
                {enrichedTeamMembers.map((member, idx) => (
                  <div key={member.broker_id || idx} className="p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          {!member.hasData && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              No listings yet
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mb-1">{member.phone}</p>
                        {member.agency_name && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3 text-purple-600" />
                            <p className="text-xs font-semibold text-purple-700">{member.agency_name}</p>
                          </div>
                        )}
                        <p className="text-xs text-blue-600 mt-1">{member.role || 'Team Member'}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-700">{member.co_listing_count}</p>
                          <p className="text-xs text-slate-600">listings</p>
                        </div>
                        {editingTeam && (
                          <Button
                            onClick={() => handleRemoveTeamMember(member.broker_id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-2">No team members yet</p>
                <p className="text-xs text-slate-500">
                  Add team members to collaborate on listings and track co-listing performance
                </p>
                {editingTeam && (
                  <p className="text-xs text-blue-600 mt-3 font-semibold">
                    👆 Enter their phone number above to add them
                  </p>
                )}
              </div>
            )}
          </Card>

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

  // REGULAR USER
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{currentUser.full_name || 'User Profile'}</h1>
          <p className="text-slate-600">{currentUser.email}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-purple-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-slate-900">My Area Preferences</h3>
            </div>
            <Button
              onClick={() => setEditingAreas(!editingAreas)}
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              {editingAreas ? 'Cancel' : 'Edit Areas'}
            </Button>
          </div>

          {editingAreas ? (
            <div>
              <p className="text-sm text-slate-600 mb-3">
                Select areas you're interested in for personalized SmartFeed:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {popularAreas.map((area) => {
                  const isSelected = selectedAreas.includes(area);
                  return (
                    <Button
                      key={area}
                      onClick={() => toggleArea(area)}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`rounded-xl ${
                        isSelected
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          : "border-purple-200 hover:bg-purple-50"
                      }`}
                    >
                      {area}
                    </Button>
                  );
                })}
              </div>
              <Button
                onClick={handleSaveAreas}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                Save Preferred Areas
              </Button>
            </div>
          ) : (
            <div>
              {currentUser.preferred_areas && currentUser.preferred_areas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentUser.preferred_areas.map((area) => (
                    <Badge key={area} className="bg-purple-100 text-purple-800 border-purple-300">
                      <MapPin className="w-3 h-3 mr-1" />
                      {area}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No preferred areas set. Click "Edit Areas" to personalize your SmartFeed.
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-purple-600 mt-3">
            💡 SmartFeed will highlight properties in your preferred areas
          </p>
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

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 text-center">
          <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Explore Mumbai Real Estate</h3>
          <p className="text-sm text-slate-600 mb-4">
            Browse AI-powered property listings and get personalized recommendations
          </p>
          <Button
            onClick={() => navigate(createPageUrl("SmartFeed"))}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          >
            Browse Properties
          </Button>
        </Card>
      </div>
    </div>
  );
}
