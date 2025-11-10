
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
    name: "" // Added name field
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [creatingBrokerProfile, setCreatingBrokerProfile] = useState(false); // New state for broker creation

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
              name: broker.name || user.full_name || "" // Initialize name
            });
            
            const isProfileIncomplete = !broker.phone || !broker.agency_name;
            if (isProfileIncomplete || shouldCompleteProfile) {
              setShowOnboardingBanner(true);
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
          // User has no broker profile - prompt to create one
          setShowOnboardingBanner(true);
          setEditingProfile(true); // This will control the form visibility in the new render path
          setActiveTab('overview'); // This is a placeholder, as the new path won't use tabs initially
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

  const handleSaveProfile = async () => {
    // Handle creating new broker profile if none exists
    if (!brokerProfile) {
      if (!profileData.phone || !profileData.name || !profileData.agency_name) {
        toast.error('Name, Phone number, and Agency Name are required', {
          description: 'Please fill in all required fields'
        });
        return;
      }

      setCreatingBrokerProfile(true);
      try {
        let normalizedPhone = profileData.phone.trim();
        if (normalizedPhone) {
          normalizedPhone = normalizedPhone.replace(/\D/g, '');
          if (normalizedPhone.length === 10) {
            normalizedPhone = '91' + normalizedPhone;
          }
        } else {
          toast.error('Phone number is required');
          setCreatingBrokerProfile(false);
          return;
        }

        const allBrokers = await base44.entities.Broker.list();
        const nextSequence = allBrokers.length + 1;
        const customId = `CHR-BRK-${String(nextSequence).padStart(4, '0')}`;

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

        setBrokerProfile(newBroker);
        setCurrentUser(prev => ({ ...prev, broker_id: newBroker.id }));
        setEditingProfile(false);
        setShowOnboardingBanner(false);

        toast.success('✅ Broker Profile Created!', {
          description: 'Your profile is now active on PropAI',
          duration: 4000
        });
        navigate(createPageUrl('MyProfile'), { replace: true }); // Reload to proper broker view
      } catch (error) {
        toast.error('Failed to create profile', {
          description: error.message
        });
      } finally {
        setCreatingBrokerProfile(false);
      }
      return;
    }
    
    // Existing: Update existing broker profile
    setSavingProfile(true);
    try {
      let normalizedPhone = profileData.phone.trim();
      if (normalizedPhone) {
        normalizedPhone = normalizedPhone.replace(/\D/g, '');
        if (normalizedPhone.length === 10 && !normalizedPhone.startsWith('91')) {
          normalizedPhone = '91' + normalizedPhone;
        } else if (normalizedPhone.length === 12 && normalizedPhone.startsWith('91')) {
          // Keep as is
        } else if (normalizedPhone.length === 0) {
          normalizedPhone = null;
        }
      } else {
        normalizedPhone = null;
      }
      
      await base44.entities.Broker.update(brokerProfile.id, {
        name: profileData.name.trim() || brokerProfile.name, // Update name
        agency_name: profileData.agency_name.trim() || null,
        email: profileData.email.trim() || null,
        phone: normalizedPhone
      });
      
      setBrokerProfile(prev => ({
        ...prev,
        name: profileData.name.trim() || prev.name, // Update name in state
        agency_name: profileData.agency_name.trim() || null,
        email: profileData.email.trim() || null,
        phone: normalizedPhone || prev.phone
      }));
      
      setEditingProfile(false);
      setShowOnboardingBanner(false);
      toast.success('✅ Profile Updated!', {
        description: 'Your details have been saved',
        duration: 3000
      });
    } catch (error) {
      toast.error('Failed to update profile', {
        description: error.message
      });
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
        reports_to: null
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

  // ADMIN VIEW - unchanged
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

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-purple-200 mb-6 mt-6">
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

  // If user has NO broker profile, show profile creation form
  if (!brokerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Toaster position="top-center" richColors closeButton />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Onboarding Header */}
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

          {/* Profile Creation Form */}
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
                <p className="text-xs text-slate-500 mt-1">
                  Your name as it will appear on listings
                </p>
              </div>

              <div className="border-2 border-red-300 rounded-xl p-4 bg-red-50">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Phone Number (WhatsApp Contact) <span className="text-red-600 font-bold">*REQUIRED</span>
                </label>
                <Input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="9820056789"
                  className="text-sm font-mono border-red-400"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter 10-digit mobile number (auto-formatted with +91 prefix)
                </p>
                <p className="text-xs text-red-600 mt-2 font-semibold">
                  ⚠️ Required to receive client contacts and use team features
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
                  placeholder="e.g., Bandra Homes, PropCo Mumbai"
                  className="text-sm border-red-400"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This will be displayed next to your name on all property listings
                </p>
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
                <p className="text-xs text-slate-500 mt-1">
                  For contact purposes only
                </p>
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

          {/* Area Preferences */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-purple-200 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">My Area Preferences (Optional)</h3>
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
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAreas(selectedAreas.filter(a => a !== area));
                          } else {
                            setSelectedAreas([...selectedAreas, area]);
                          }
                        }}
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
        </div>
      </div>
    );
  }
    
  const connectionCount = currentUser?.connected_brokers?.length || 0;
    
  if (brokerProfile && brokerMetrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Toaster position="top-center" richColors closeButton />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          {(!brokerProfile.phone || !brokerProfile.agency_name) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-3xl p-6 shadow-xl border-2 border-red-400 sticky top-20 z-30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">⚠️ Profile Incomplete</h3>
                    <p className="text-red-100 mb-3 leading-relaxed">
                      Please add these details to unlock full access:
                    </p>
                    <div className="space-y-2 text-sm text-red-100">
                      {!brokerProfile.phone && (
                        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span><strong className="text-white">Phone Number</strong> - Required for WhatsApp integration</span>
                        </div>
                      )}
                      {!brokerProfile.agency_name && (
                        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span><strong className="text-white">Agency Name</strong> - Displayed on your listings</span>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setActiveTab('overview');
                        setEditingProfile(true);
                        setTimeout(() => {
                          const profileDetailsCard = document.getElementById('profile-details-card');
                          if (profileDetailsCard) {
                            profileDetailsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      className="mt-4 bg-white text-red-600 hover:bg-red-50 font-bold"
                    >
                      Complete Profile Now
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{brokerProfile?.name}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-slate-600">{brokerProfile?.custom_id}</p>
                    {brokerProfile?.phone && (
                      <>
                        <span className="text-slate-400">•</span>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-purple-600" />
                          <p className="text-sm font-mono text-purple-700">{brokerProfile.phone}</p>
                        </div>
                      </>
                    )}
                    {brokerProfile?.agency_name && (
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

              {brokerProfile?.trust_score && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-lg px-4 py-2">
                    <Star className="w-5 h-5 mr-2" fill="currentColor" />
                    BrokerTrust™: {brokerProfile.trust_score}/100
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="block md:hidden mb-3">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 bg-white text-slate-900 font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="overview">📊 Overview</option>
                <option value="network">👥 My Network ({connectionCount})</option>
                <option value="listings">📦 Listings ({networkListings.length})</option>
                <option value="requirements">🎯 Requirements ({myRequirementsWithMatches.length})</option>
              </select>
            </div>

            <div className="hidden md:flex gap-2">
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
                My Network ({connectionCount})
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
            
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent('openChatWidget'))}
              className="w-full md:w-auto mt-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg"
              size="lg"
            >
              <Bot className="w-5 h-5 mr-2" />
              Chat with AI Assistant
            </Button>
          </div>

          {activeTab === 'overview' && (
            <>
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

              <Card id="profile-details-card" className="p-6 bg-white border-2 border-slate-200 mb-6">
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
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    {editingProfile ? 'Cancel' : <><Edit className="w-3 h-3 mr-1" /> Edit Profile</>}
                  </Button>
                </div>

                {editingProfile ? (
                  <div className="space-y-4">
                    <div className={!profileData.name ? 'border-2 border-red-300 rounded-xl p-4 bg-red-50' : ''}>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Your Name {!profileData.name && <span className="text-red-600 font-bold">*REQUIRED</span>}
                      </label>
                      <Input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Your full name"
                        className={`text-sm ${!profileData.name ? 'border-red-400' : ''}`}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Your name as it will appear on listings
                      </p>
                    </div>

                    <div className={!profileData.phone ? 'border-2 border-red-300 rounded-xl p-4 bg-red-50' : ''}>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Phone Number (Your WhatsApp Contact) {!profileData.phone && <span className="text-red-600 font-bold">*REQUIRED</span>}
                      </label>
                      <Input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="9820056789"
                        className={`text-sm font-mono ${!profileData.phone ? 'border-red-400' : ''}`}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Enter 10-digit mobile number (auto-formatted with +91 prefix)
                      </p>
                      {!profileData.phone && (
                        <p className="text-xs text-red-600 mt-2 font-semibold">
                          ⚠️ You must add a phone number to use team features and receive client contacts
                        </p>
                      )}
                    </div>

                    <div className={!profileData.agency_name ? 'border-2 border-red-300 rounded-xl p-4 bg-red-50' : ''}>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Agency Name {!profileData.agency_name && <span className="text-red-600 font-bold">*REQUIRED</span>}
                      </label>
                      <Input
                        type="text"
                        value={profileData.agency_name}
                        onChange={(e) => setProfileData({ ...profileData, agency_name: e.target.value })}
                        placeholder="e.g., Bandra Homes, PropCo Mumbai"
                        className={`text-sm ${!profileData.agency_name ? 'border-red-400' : ''}`}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        This will be displayed next to your name on all property listings
                      </p>
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
                      <p className="text-xs text-slate-500 mt-1">
                        For contact purposes only
                      </p>
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-full h-14 text-lg font-bold"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Saving Profile...
                        </>
                      ) : (
                        '✅ Save & Complete Profile'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <User className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <span className="text-sm text-slate-600 block mb-1">Your Name:</span>
                        <span className="text-base font-semibold text-slate-900">
                          {brokerProfile.name || <span className="text-red-600 italic font-normal">⚠️ Not set</span>}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
                      <Phone className="w-6 h-6 text-purple-600" />
                      <div className="flex-1">
                        <span className="text-sm text-slate-600 block mb-1">Your WhatsApp Contact:</span>
                        <span className="text-xl font-bold font-mono text-purple-900">
                          {brokerProfile.phone || <span className="text-red-600 italic font-normal text-base">⚠️ Not set - Click Edit Profile</span>}
                        </span>
                      </div>
                    </div>
                    
                    {!brokerProfile.phone && (
                      <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200 animate-pulse">
                        <p className="text-sm text-red-800 font-semibold">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          <strong>ACTION REQUIRED:</strong> Add your phone number to receive client inquiries and collaborate with your team.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <span className="text-sm text-slate-600 block mb-1">Agency Name:</span>
                        <span className="text-base font-semibold text-slate-900">
                          {brokerProfile.agency_name || <span className="text-red-600 italic font-normal">⚠️ Not set</span>}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <Mail className="w-5 h-5 text-slate-500" />
                      <div className="flex-1">
                        <span className="text-sm text-slate-600 block mb-1">Email:</span>
                        <span className="text-base font-semibold text-slate-900">
                          {brokerProfile.email || <span className="text-slate-400 italic">Not set</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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

              {brokerProfile.specializations && (
                <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
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
            </>
          )}

          {activeTab === 'network' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">My Network Connections</h2>
              
              {networkConnections.length === 0 ? (
                <Card className="p-8 text-center">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Connections Yet</h3>
                  <p className="text-slate-600 mb-4">
                    Visit the Broker Network page to connect with other brokers
                  </p>
                  <Button
                    onClick={() => navigate(createPageUrl("BrokerNetwork"))}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  >
                    Browse Broker Network
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {networkConnections.map(broker => (
                    <Card key={broker.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{broker.name}</h3>
                          <p className="text-sm text-slate-600">{broker.phone}</p>
                          {broker.agency_name && (
                            <p className="text-sm text-purple-700 font-semibold">{broker.agency_name}</p>
                          )}
                        </div>
                        <Badge className="bg-sky-100 text-sky-800">
                          {broker.activeListings} Active Listings
                        </Badge>
                      </div>
                      
                      {broker.recentListings.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-2">Recent Listings:</p>
                          <div className="space-y-2">
                            {broker.recentListings.map(prop => (
                              <div
                                key={prop.id}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                                onClick={() => navigate(createPageUrl("PropertyDetails") + `?id=${prop.id}`)}
                              >
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-slate-900 truncate">
                                    {prop.ai_title || `${prop.bhk} in ${prop.location}`}
                                  </p>
                                  <p className="text-xs text-slate-500">{prop.location}</p>
                                </div>
                                <p className="text-sm font-bold text-sky-600">
                                  ₹{prop.price}{prop.price_unit === 'crores' ? ' Cr' : 'L'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => {
                            const message = `Hi ${broker.name}, this is ${brokerProfile?.name}. We're connected on PropAI Live. Let's collaborate!`;
                            window.open(`https://wa.me/${broker.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                        <Button
                          onClick={() => navigate(createPageUrl("BrokerProfile") + `?id=${broker.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          View Profile
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'listings' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Listings from My Network</h2>
              
              {networkListings.length === 0 ? (
                <Card className="p-8 text-center">
                  <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Network Listings</h3>
                  <p className="text-slate-600">
                    Your network connections haven't listed any properties yet
                  </p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {networkListings.map(prop => (
                    <Card
                      key={prop.id}
                      className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(createPageUrl("PropertyDetails") + `?id=${prop.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Badge className="mb-2 bg-purple-100 text-purple-800">
                            {prop.bhk}
                          </Badge>
                          <h3 className="font-bold text-slate-900 line-clamp-2 mb-2">
                            {prop.ai_title || `${prop.bhk} in ${prop.location}`}
                          </h3>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {prop.location}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-sky-600">
                          ₹{prop.price}{prop.price_unit === 'crores' ? ' Cr' : 'L'}
                        </p>
                        <Badge variant="outline">{prop.listing_type}</Badge>
                      </div>
                      
                      {prop.broker_name && (
                        <p className="text-xs text-slate-500 mt-2">
                          Listed by: {prop.broker_name}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requirements' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">My Requirements & Network Matches</h2>
              
              {myRequirementsWithMatches.length === 0 ? (
                <Card className="p-8 text-center">
                  <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Requirements Yet</h3>
                  <p className="text-slate-600">
                    Create requirements to get matched with properties from your network
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {myRequirementsWithMatches.map(req => (
                    <Card key={req.id} className="p-6">
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {req.client_name || 'Requirement'}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              <Badge className="bg-cyan-100 text-cyan-800">
                                {req.listing_type}
                              </Badge>
                              {req.bhk_preference?.map((bhk, idx) => (
                                <Badge key={idx} variant="outline">{bhk}</Badge>
                              ))}
                            </div>
                          </div>
                          <Badge 
                            className={
                              req.urgency === 'High' ? 'bg-red-100 text-red-800' : 
                              req.urgency === 'Medium' ? 'bg-amber-100 text-amber-800' : 
                              'bg-green-100 text-green-800'
                            }
                          >
                            {req.urgency} Urgency
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-slate-600">
                          <p>Budget: ₹{req.budget_min || '—'} - ₹{req.budget_max || '—'} {req.budget_unit}</p>
                          {req.preferred_locations && req.preferred_locations.length > 0 && (
                            <p>Locations: {req.preferred_locations.join(', ')}</p>
                          )}
                        </div>
                      </div>
                      
                      {req.networkMatches.length > 0 ? (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-green-500 text-white">
                              {req.networkMatches.length} Network Matches Found
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {req.networkMatches.map(prop => (
                              <div
                                key={prop.id}
                                className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer"
                                onClick={() => navigate(createPageUrl("PropertyDetails") + `?id=${prop.id}`)}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-slate-900 truncate">
                                    {prop.ai_title || `${prop.bhk} in ${prop.location}`}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {prop.location} • Listed by {prop.broker_name || 'Network Broker'}
                                  </p>
                                </div>
                                <p className="text-sm font-bold text-green-700">
                                  ₹{prop.price}{prop.price_unit === 'crores' ? ' Cr' : 'L'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600">No matches from your network yet</p>
                        </div>
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

  // This block is now unreachable as the !brokerProfile case is handled above
  return null;
}
