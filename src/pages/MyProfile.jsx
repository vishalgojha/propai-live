import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  User, Shield, Star, Package, TrendingUp, Users, Building2,
  MapPin, Award, BarChart3, Eye, MessageCircle, Target,
  Calendar, Phone, Mail, Edit, Settings, AlertCircle, X, Loader2, Bot
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

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    agency_name: "",
    email: "",
    phone: "",
    name: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingBrokerProfile, setCreatingBrokerProfile] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');

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
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        
        setCurrentUser(user);
        if (user.preferred_areas) {
          setSelectedAreas(user.preferred_areas);
        }

        const urlParams = new URLSearchParams(window.location.search);
        const shouldCompleteProfile = urlParams.get('complete_profile') === 'true';

        if (user.broker_id) {
          const brokers = await base44.entities.Broker.list();
          const broker = brokers.find(b => b.id === user.broker_id);
          
          if (broker) {
            setBrokerProfile(broker);
            setProfileData({
              agency_name: broker.agency_name || "",
              email: broker.email || "",
              phone: broker.phone || "",
              name: broker.name || user.full_name || ""
            });
            
            const isProfileIncomplete = !broker.phone || !broker.agency_name;
            if (isProfileIncomplete || shouldCompleteProfile) {
              setEditingProfile(true);
              setActiveTab('overview');
              toast.info('👋 Please complete your profile to unlock all features', {
                description: 'Phone number and agency name are required',
                duration: 10000,
                className: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0'
              });
            }
          }
        } else {
          setEditingProfile(true);
          setActiveTab('overview');
          setProfileData({
            agency_name: "",
            email: user.email || "",
            phone: "",
            name: user.full_name || ""
          });
          
          toast.info('👋 Welcome! Let\'s set up your broker profile', {
            description: 'Add your phone number and agency name to get started',
            duration: 10000,
            className: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0'
          });
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        base44.auth.redirectToLogin(window.location.pathname);
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
      toast.success('✅ Preferred Areas Saved!');
    } catch (error) {
      toast.error('Failed to save areas');
    }
  };

  const handleSaveProfile = async () => {
    if (!brokerProfile) {
      if (!profileData.phone || !profileData.name || !profileData.agency_name) {
        toast.error('Name, Phone number, and Agency Name are required');
        return;
      }

      setCreatingBrokerProfile(true);
      try {
        let normalizedPhone = profileData.phone.trim().replace(/\D/g, '');
        if (normalizedPhone.length === 10) {
          normalizedPhone = '91' + normalizedPhone;
        }

        const allBrokers = await base44.entities.Broker.list();
        const customId = `CHR-BRK-${String(allBrokers.length + 1).padStart(4, '0')}`;

        const newBroker = await base44.entities.Broker.create({
          custom_id: customId,
          name: profileData.name.trim(),
          phone: normalizedPhone,
          agency_name: profileData.agency_name.trim(),
          email: profileData.email.trim() || currentUser.email,
          status: "Active",
          total_listings_count: 0,
          active_listings_count: 0,
          verified: false
        });

        await base44.auth.updateMe({ broker_id: newBroker.id });
        toast.success('✅ Broker Profile Created!');
        window.location.reload();
      } catch (error) {
        toast.error('Failed to create profile');
      } finally {
        setCreatingBrokerProfile(false);
      }
      return;
    }
    
    setSavingProfile(true);
    try {
      let normalizedPhone = profileData.phone.trim().replace(/\D/g, '');
      if (normalizedPhone.length === 10) {
        normalizedPhone = '91' + normalizedPhone;
      }
      
      await base44.entities.Broker.update(brokerProfile.id, {
        name: profileData.name.trim() || brokerProfile.name,
        agency_name: profileData.agency_name.trim() || null,
        email: profileData.email.trim() || null,
        phone: normalizedPhone || brokerProfile.phone
      });
      
      setBrokerProfile(prev => ({
        ...prev,
        name: profileData.name.trim() || prev.name,
        agency_name: profileData.agency_name.trim() || null,
        email: profileData.email.trim() || null,
        phone: normalizedPhone || prev.phone
      }));
      
      setEditingProfile(false);
      toast.success('✅ Profile Updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
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
        toast.error('Invalid Phone');
        setAddingTeamMember(false);
        return;
      }
      
      const brokers = await base44.entities.Broker.list();
      const teamMemberBroker = brokers.find(b => normalizePhone(b.phone) === normalized);
      
      if (!teamMemberBroker) {
        toast.error('❌ Broker Not Found');
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
        toast.error(`${teamMemberBroker.name} is already in team`);
        setAddingTeamMember(false);
        return;
      }
      
      const allProps = await base44.entities.Property.list();
      const memberListings = allProps.filter(p => 
        p.broker_id === teamMemberBroker.id && p.status === 'Active' && !p.is_duplicate
      );
      
      const newTeamMemberData = {
        broker_id: teamMemberBroker.id,
        name: teamMemberBroker.name,
        phone: teamMemberBroker.phone,
        role: teamMemberBroker.agency_name || 'Team Member',
        co_listing_count: memberListings.length,
        agency_name: teamMemberBroker.agency_name
      };

      const updatedTeam = [...currentTeam, newTeamMemberData];
      const updatedTeamLeaderOf = [...(brokerProfile.team_leader_of || []), teamMemberBroker.id];
      
      await base44.entities.Broker.update(brokerProfile.id, {
        team_members: updatedTeam,
        team_leader_of: updatedTeamLeaderOf
      });
      
      await base44.entities.Broker.update(teamMemberBroker.id, { reports_to: null });
      
      setBrokerProfile(prev => ({
        ...prev,
        team_members: updatedTeam,
        team_leader_of: updatedTeamLeaderOf,
      }));

      toast.success(`✅ ${teamMemberBroker.name} joined your team!`);
      setTeamMemberPhone('');
      setEditingTeam(false);
    } catch (error) {
      toast.error('Failed to add team member');
    } finally {
      setAddingTeamMember(false);
    }
  };

  const handleRemoveTeamMember = async (memberBrokerId) => {
    if (!brokerProfile || !window.confirm('Remove this team member?')) return;
    
    try {
      const updatedTeam = (brokerProfile.team_members || []).filter(m => m.broker_id !== memberBrokerId);
      const updatedTeamLeaderOf = (brokerProfile.team_leader_of || []).filter(id => id !== memberBrokerId);
      
      await base44.entities.Broker.update(brokerProfile.id, {
        team_members: updatedTeam,
        team_leader_of: updatedTeamLeaderOf
      });
      
      await base44.entities.Broker.update(memberBrokerId, { reports_to: null });

      setBrokerProfile(prev => ({
        ...prev,
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
      return allProps.filter(p => p.broker_id === brokerProfile.id);
    },
    enabled: !!brokerProfile,
    initialData: []
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['my-requirements', brokerProfile?.id],
    queryFn: async () => {
      if (!brokerProfile) return [];
      const allReqs = await base44.entities.Requirement.list('-created_date');
      return allReqs.filter(r => r.broker_id === brokerProfile.id);
    },
    enabled: !!brokerProfile,
    initialData: []
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['my-interactions', brokerProfile?.id],
    queryFn: async () => {
      if (!brokerProfile || properties.length === 0) return [];
      const allInteractions = await base44.entities.PropertyInteraction.list('-created_date');
      const myPropertyIds = properties.map(p => p.id);
      return allInteractions.filter(i => myPropertyIds.includes(i.property_id));
    },
    enabled: !!brokerProfile && properties.length > 0,
    initialData: []
  });

  const { data: allBrokers = [] } = useQuery({
    queryKey: ['all-brokers-network'],
    queryFn: () => base44.entities.Broker.list(),
    enabled: !!brokerProfile,
    initialData: []
  });

  const { data: allPropertiesNetwork = [] } = useQuery({
    queryKey: ['all-properties-network'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    enabled: !!brokerProfile,
    initialData: []
  });

  const { data: allRequirementsNetwork = [] } = useQuery({
    queryKey: ['all-requirements-network'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    enabled: !!brokerProfile,
    initialData: []
  });

  const { data: allProperties = [] } = useQuery({
    queryKey: ['admin-all-properties'],
    queryFn: () => base44.entities.Property.list(),
    enabled: currentUser?.role === 'admin',
    initialData: []
  });

  const { data: allBrokersAdmin = [] } = useQuery({
    queryKey: ['admin-all-brokers'],
    queryFn: () => base44.entities.Broker.list(),
    enabled: currentUser?.role === 'admin',
    initialData: []
  });

  const networkConnections = useMemo(() => {
    if (!brokerProfile || !currentUser?.connected_brokers) return [];
    
    return currentUser.connected_brokers
      .map(connId => {
        const broker = allBrokers.find(b => b.id === connId);
        if (!broker) return null;
        
        const brokerListings = allPropertiesNetwork.filter(p => 
          p.broker_id === connId && p.status === 'Active' && !p.is_duplicate
        );
        
        return {
          ...broker,
          activeListings: brokerListings.length,
          recentListings: brokerListings.slice(0, 5)
        };
      })
      .filter(Boolean);
  }, [brokerProfile, currentUser, allBrokers, allPropertiesNetwork]);

  const networkListings = useMemo(() => {
    if (!currentUser?.connected_brokers) return [];
    
    return allPropertiesNetwork
      .filter(p => 
        currentUser.connected_brokers.includes(p.broker_id) && 
        p.status === 'Active' && 
        !p.is_duplicate
      )
      .slice(0, 20);
  }, [currentUser, allPropertiesNetwork]);

  const myRequirementsWithMatches = useMemo(() => {
    if (!brokerProfile) return [];
    
    const myReqs = allRequirementsNetwork.filter(r => 
      r.broker_id === brokerProfile.id && r.status === 'Active'
    );
    
    return myReqs.map(req => {
      const networkMatches = allPropertiesNetwork.filter(prop => {
        if (!currentUser?.connected_brokers?.includes(prop.broker_id)) return false;
        if (prop.status !== 'Active' || prop.is_duplicate) return false;
        if (prop.listing_type !== req.listing_type) return false;
        
        if (req.bhk_preference && req.bhk_preference.length > 0) {
          if (!req.bhk_preference.includes(prop.bhk)) return false;
        }
        
        if (req.preferred_locations && req.preferred_locations.length > 0) {
          if (!req.preferred_locations.includes(prop.location)) return false;
        }
        
        const propPriceInLakhs = prop.price_unit === 'crores' ? prop.price * 100 : prop.price;
        const reqUnit = req.budget_unit === 'crores' ? 'crores' : 'lakhs';
        const reqMinInLakhs = reqUnit === 'crores' ? (req.budget_min || 0) * 100 : (req.budget_min || 0);
        const reqMaxInLakhs = reqUnit === 'crores' ? (req.budget_max || 999999) * 100 : (req.budget_max || 999999);
        
        if (propPriceInLakhs < reqMinInLakhs || propPriceInLakhs > reqMaxInLakhs) return false;
        
        return true;
      });
      
      return {
        ...req,
        networkMatches: networkMatches.slice(0, 10)
      };
    });
  }, [brokerProfile, allRequirementsNetwork, allPropertiesNetwork, currentUser]);

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
    const activeBrokers = allBrokersAdmin.filter(b => b.status === 'Active');

    return {
      totalProperties: allProperties.length,
      activeProperties: activeProps.length,
      totalBrokers: allBrokersAdmin.length,
      activeBrokers: activeBrokers.length,
      highTrustBrokers: allBrokersAdmin.filter(b => (b.trust_score || 0) >= 75).length
    };
  }, [currentUser, allProperties, allBrokersAdmin]);

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
                <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
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

          <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
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

          <Card className="p-6 bg-white border-2 border-slate-200">
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

  if (!brokerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Toaster position="top-center" richColors closeButton />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 shadow-xl border-2 border-blue-400"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">👋 Welcome to PropAI!</h2>
                <p className="text-blue-100 leading-relaxed">
                  Let's set up your broker profile so you can access all features.
                </p>
              </div>
            </div>
          </motion.div>

          <Card className="p-6 bg-white border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Create Your Broker Profile
            </h3>

            <div className="space-y-4">
              <div className="border-2 border-blue-300 rounded-xl p-4 bg-blue-50">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Your Name <span className="text-red-600 font-bold">*REQUIRED</span>
                </label>
                <Input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="e.g., Ramesh Kumar"
                  className="text-sm border-blue-400"
                />
              </div>

              <div className="border-2 border-red-300 rounded-xl p-4 bg-red-50">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Phone Number (WhatsApp) <span className="text-red-600 font-bold">*REQUIRED</span>
                </label>
                <Input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="9820056789"
                  className="text-sm font-mono border-red-400"
                />
                <p className="text-xs text-red-600 mt-2 font-semibold">
                  ⚠️ Required for WhatsApp AI agent and client contacts
                </p>
              </div>

              <div className="border-2 border-red-300 rounded-xl p-4 bg-red-50">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Agency Name <span className="text-red-600 font-bold">*REQUIRED</span>
                </label>
                <Input
                  type="text"
                  value={profileData.agency_name}
                  onChange={(e) => setProfileData({ ...profileData, agency_name: e.target.value })}
                  placeholder="e.g., Bandra Homes"
                  className="text-sm border-red-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="text-sm"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={creatingBrokerProfile || !profileData.phone || !profileData.name || !profileData.agency_name}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-full h-14 text-lg font-bold"
              >
                {creatingBrokerProfile ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  '✅ Create Broker Profile'
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const connectionCount = currentUser?.connected_brokers?.length || 0;
    
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {(!brokerProfile.phone || !brokerProfile.agency_name) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-3xl p-6 shadow-xl border-2 border-red-400"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">⚠️ Profile Incomplete</h3>
                <p className="text-red-100 mb-3">
                  Please add these details to unlock full access:
                </p>
                <div className="space-y-2 text-sm text-red-100">
                  {!brokerProfile.phone && (
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                      <Phone className="w-4 h-4" />
                      <span><strong>Phone</strong> - WhatsApp integration</span>
                    </div>
                  )}
                  {!brokerProfile.agency_name && (
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                      <Building2 className="w-4 h-4" />
                      <span><strong>Agency</strong> - Displayed on listings</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => {
                    setActiveTab('overview');
                    setEditingProfile(true);
                  }}
                  className="mt-4 bg-white text-red-600 hover:bg-red-50 font-bold"
                >
                  Complete Profile Now
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{brokerProfile.name}</h1>
              <div className="flex items-center gap-2 flex-wrap text-sm text-slate-600">
                <span>{brokerProfile.custom_id}</span>
                {brokerProfile.phone && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-purple-700">{brokerProfile.phone}</span>
                  </>
                )}
                {brokerProfile.agency_name && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-purple-700">{brokerProfile.agency_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              onClick={() => setActiveTab('overview')}
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              size="sm"
              className={activeTab === 'overview' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : ''}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Overview
            </Button>
            <Button
              onClick={() => setActiveTab('network')}
              variant={activeTab === 'network' ? 'default' : 'outline'}
              size="sm"
              className={activeTab === 'network' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : ''}
            >
              <Users className="w-4 h-4 mr-1" />
              Network ({connectionCount})
            </Button>
            <Button
              onClick={() => setActiveTab('listings')}
              variant={activeTab === 'listings' ? 'default' : 'outline'}
              size="sm"
              className={activeTab === 'listings' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : ''}
            >
              <Package className="w-4 h-4 mr-1" />
              Listings ({networkListings.length})
            </Button>
            <Button
              onClick={() => setActiveTab('requirements')}
              variant={activeTab === 'requirements' ? 'default' : 'outline'}
              size="sm"
              className={activeTab === 'requirements' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : ''}
            >
              <Target className="w-4 h-4 mr-1" />
              Requirements ({myRequirementsWithMatches.length})
            </Button>
          </div>
        </div>

        {activeTab === 'overview' && brokerMetrics && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 bg-white border-2 border-slate-200">
                <p className="text-xs text-slate-600 mb-2 font-semibold flex items-center gap-1">
                  <Package className="w-4 h-4 text-sky-600" />
                  Active Listings
                </p>
                <p className="text-3xl font-bold text-sky-600">{brokerMetrics.activeListings}</p>
                <p className="text-xs text-slate-500 mt-1">{brokerMetrics.totalListings} total</p>
              </Card>

              <Card className="p-4 bg-white border-2 border-slate-200">
                <p className="text-xs text-slate-600 mb-2 font-semibold flex items-center gap-1">
                  <Eye className="w-4 h-4 text-purple-600" />
                  Total Views
                </p>
                <p className="text-3xl font-bold text-purple-600">{brokerMetrics.totalViews}</p>
              </Card>

              <Card className="p-4 bg-white border-2 border-slate-200">
                <p className="text-xs text-slate-600 mb-2 font-semibold flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  Inquiries
                </p>
                <p className="text-3xl font-bold text-green-600">{brokerMetrics.totalInquiries}</p>
                <p className="text-xs text-slate-500 mt-1">{brokerMetrics.conversionRate}% conv.</p>
              </Card>

              <Card className="p-4 bg-white border-2 border-slate-200">
                <p className="text-xs text-slate-600 mb-2 font-semibold flex items-center gap-1">
                  <Target className="w-4 h-4 text-cyan-600" />
                  AI Matches
                </p>
                <p className="text-3xl font-bold text-cyan-600">{brokerMetrics.totalAIMatches}</p>
              </Card>
            </div>

            <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Profile Details
                  {(!brokerProfile.phone || !brokerProfile.agency_name) && (
                    <Badge className="bg-red-500 text-white animate-pulse">Required</Badge>
                  )}
                </h3>
                <Button
                  onClick={() => {
                    setEditingProfile(!editingProfile);
                    if (!editingProfile) {
                      setProfileData({
                        agency_name: brokerProfile.agency_name || "",
                        email: brokerProfile.email || "",
                        phone: brokerProfile.phone || "",
                        name: brokerProfile.name || currentUser.full_name || ""
                      });
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700"
                >
                  {editingProfile ? 'Cancel' : <><Edit className="w-3 h-3 mr-1" /> Edit</>}
                </Button>
              </div>

              {editingProfile ? (
                <div className="space-y-4">
                  <div className={!profileData.name ? 'border-2 border-red-300 rounded-xl p-4 bg-red-50' : ''}>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Name {!profileData.name && <span className="text-red-600">*REQUIRED</span>}
                    </label>
                    <Input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Your full name"
                      className="text-sm"
                    />
                  </div>

                  <div className={!profileData.phone ? 'border-2 border-red-300 rounded-xl p-4 bg-red-50' : ''}>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Phone (WhatsApp) {!profileData.phone && <span className="text-red-600">*REQUIRED</span>}
                    </label>
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="9820056789"
                      className="text-sm font-mono"
                    />
                    <p className="text-xs text-red-600 mt-2">
                      Required for WhatsApp AI agent
                    </p>
                  </div>

                  <div className={!profileData.agency_name ? 'border-2 border-red-300 rounded-xl p-4 bg-red-50' : ''}>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Agency {!profileData.agency_name && <span className="text-red-600">*REQUIRED</span>}
                    </label>
                    <Input
                      type="text"
                      value={profileData.agency_name}
                      onChange={(e) => setProfileData({ ...profileData, agency_name: e.target.value })}
                      placeholder="e.g., Bandra Homes"
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Email (Optional)
                    </label>
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="text-sm"
                    />
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-full h-12 font-bold"
                  >
                    {savingProfile ? 'Saving...' : '✅ Save Profile'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <User className="w-5 h-5 text-purple-600" />
                    <div>
                      <span className="text-xs text-slate-600 block">Name:</span>
                      <span className="font-semibold text-slate-900">
                        {brokerProfile.name || <span className="text-red-600 italic">Not set</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                    <Phone className="w-6 h-6 text-purple-600" />
                    <div>
                      <span className="text-xs text-slate-600 block">WhatsApp:</span>
                      <span className="text-lg font-bold font-mono text-purple-900">
                        {brokerProfile.phone || <span className="text-red-600 italic text-base">Not set</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <span className="text-xs text-slate-600 block">Agency:</span>
                      <span className="font-semibold text-slate-900">
                        {brokerProfile.agency_name || <span className="text-red-600 italic">Not set</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <div>
                      <span className="text-xs text-slate-600 block">Email:</span>
                      <span className="font-semibold text-slate-900">
                        {brokerProfile.email || <span className="text-slate-400 italic">Not set</span>}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  My Team ({enrichedTeamMembers.length})
                </h3>
                <Button
                  onClick={() => setEditingTeam(!editingTeam)}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700"
                >
                  {editingTeam ? 'Cancel' : 'Manage Team'}
                </Button>
              </div>

              {editingTeam && (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-3">Add Team Member by Phone</p>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      value={teamMemberPhone}
                      onChange={(e) => setTeamMemberPhone(e.target.value)}
                      placeholder="9820056789"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddTeamMember}
                      disabled={addingTeamMember || !teamMemberPhone.trim()}
                      className="bg-blue-600 text-white"
                      size="sm"
                    >
                      {addingTeamMember ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </div>
              )}

              {enrichedTeamMembers.length > 0 ? (
                <div className="space-y-3">
                  {enrichedTeamMembers.map((member) => (
                    <div key={member.broker_id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-600">{member.phone}</p>
                          {member.agency_name && (
                            <p className="text-xs text-purple-700 font-semibold">{member.agency_name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-700">{member.co_listing_count}</p>
                            <p className="text-xs text-slate-600">listings</p>
                          </div>
                          {editingTeam && (
                            <Button
                              onClick={() => handleRemoveTeamMember(member.broker_id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 h-8 w-8 p-0"
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
                  <p className="text-sm text-slate-600">No team members yet</p>
                </div>
              )}
            </Card>
          </>
        )}

        {activeTab === 'network' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">My Network</h2>
            {networkConnections.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Connections Yet</h3>
                <Button
                  onClick={() => navigate(createPageUrl("BrokerNetwork"))}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white mt-4"
                >
                  Browse Network
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {networkConnections.map(broker => (
                  <Card key={broker.id} className="p-6">
                    <h3 className="text-xl font-bold text-slate-900">{broker.name}</h3>
                    <p className="text-sm text-slate-600">{broker.phone}</p>
                    <Badge className="bg-sky-100 text-sky-800 mt-2">
                      {broker.activeListings} Active Listings
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'listings' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Network Listings</h2>
            {networkListings.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No network listings yet</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {networkListings.map(prop => (
                  <Card
                    key={prop.id}
                    className="p-5 cursor-pointer hover:shadow-lg"
                    onClick={() => navigate(createPageUrl("PropertyDetails") + `?id=${prop.id}`)}
                  >
                    <Badge className="mb-2">{prop.bhk}</Badge>
                    <h3 className="font-bold text-slate-900 mb-2">{prop.ai_title || `${prop.bhk} in ${prop.location}`}</h3>
                    <p className="text-2xl font-bold text-sky-600">
                      ₹{prop.price}{prop.price_unit === 'crores' ? ' Cr' : 'L'}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requirements' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">My Requirements</h2>
            {myRequirementsWithMatches.length === 0 ? (
              <Card className="p-8 text-center">
                <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No requirements yet</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {myRequirementsWithMatches.map(req => (
                  <Card key={req.id} className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{req.client_name || 'Requirement'}</h3>
                    <div className="flex gap-2 mb-3">
                      <Badge>{req.listing_type}</Badge>
                      {req.bhk_preference?.map((bhk, idx) => (
                        <Badge key={idx} variant="outline">{bhk}</Badge>
                      ))}
                    </div>
                    {req.networkMatches.length > 0 && (
                      <Badge className="bg-green-500 text-white">
                        {req.networkMatches.length} Matches
                      </Badge>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}