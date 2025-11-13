
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
  Calendar, Phone, Mail, Edit, Settings, AlertCircle, X, Loader2, Bot, Search
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import BrowserNotifications from "../components/BrowserNotifications";

export default function MyProfile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [brokerProfile, setBrokerProfile] = useState(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    agency_name: "",
    email: "",
    phone: "",
    name: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingBrokerProfile, setCreatingBrokerProfile] = useState(false);
  const [linkingBroker, setLinkingBroker] = useState(false);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState("");

  const [editingTeam, setEditingTeam] = useState(false);
  const [teamMemberPhone, setTeamMemberPhone] = useState("");
  const [addingTeamMember, setAddingTeamMember] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');

  // ✅ NEW: Preferred Areas state
  const [editingAreas, setEditingAreas] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [savingAreas, setSavingAreas] = useState(false);

  // ✅ NEW: Popular Mumbai areas
  const popularAreas = [
    "Bandra West", "Bandra East", "Juhu", "Andheri West", "Andheri East",
    "Khar West", "BKC", "Worli", "Lower Parel", "Powai",
    "Goregaon West", "Malad West", "Kandivali West", "Borivali West",
    "Santacruz West", "Versova", "Lokhandwala", "Pali Hill", "Carter Road"
  ];

  // ✅ LOAD USER AND CHECK FOR EXISTING BROKER PROFILE
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        
        setCurrentUser(user);
        setSelectedAreas(user.preferred_areas || []); // ✅ LOAD PREFERRED AREAS

        const urlParams = new URLSearchParams(window.location.search);
        const shouldCompleteProfile = urlParams.get('complete_profile') === 'true';

        // ✅ USER HAS BROKER_ID LINKED - FETCH BROKER DATA
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
        } 
        // ✅ NO BROKER_ID - SHOW LINK OR CREATE OPTIONS
        else {
          setEditingProfile(true);
          setActiveTab('overview');
          setProfileData({
            agency_name: "",
            email: user.email || "",
            phone: "",
            name: user.full_name || ""
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

  // ✅ SEARCH FOR EXISTING BROKER BY PHONE
  const handleSearchBrokerByPhone = async () => {
    if (!phoneSearchQuery.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setLinkingBroker(true);
    try {
      const normalizedPhone = phoneSearchQuery.trim().replace(/\D/g, '');
      const phoneLast10 = normalizedPhone.slice(-10);

      const allBrokers = await base44.entities.Broker.list();
      const foundBroker = allBrokers.find(b => {
        if (!b.phone) return false;
        const brokerPhoneLast10 = b.phone.replace(/\D/g, '').slice(-10);
        return brokerPhoneLast10 === phoneLast10;
      });

      if (foundBroker) {
        // ✅ LINK USER TO EXISTING BROKER
        await base44.auth.updateMe({ broker_id: foundBroker.id });
        toast.success(`✅ Linked to existing broker profile: ${foundBroker.name}`);
        window.location.reload();
      } else {
        toast.error('❌ No broker found with this phone number', {
          description: 'Create a new profile instead'
        });
      }
    } catch (error) {
      toast.error('Search failed', { description: error.message });
      console.error('Search broker by phone error:', error);
    } finally {
      setLinkingBroker(false);
    }
  };

  // ✅ SAVE OR CREATE BROKER PROFILE
  const handleSaveProfile = async () => {
    if (!brokerProfile) {
      // ✅ CREATE NEW BROKER PROFILE
      if (!profileData.phone || !profileData.name || !profileData.agency_name) {
        toast.error('Name, Phone number, and Agency Name are required');
        return;
      }

      // ✅ ENHANCED: Validate phone number format
      const cleanPhone = profileData.phone.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        toast.error('❌ Invalid Phone Number', {
          description: `Must be 10 digits (you entered ${cleanPhone.length} digits)`,
          duration: 5000,
          className: 'bg-red-600 text-white border-0'
        });
        return;
      }

      // ✅ Check if phone starts with valid Indian prefix
      if (!['6', '7', '8', '9'].includes(cleanPhone[0])) {
        toast.error('❌ Invalid Indian Mobile Number', {
          description: 'Must start with 6, 7, 8, or 9',
          duration: 5000,
          className: 'bg-red-600 text-white border-0'
        });
        return;
      }

      setCreatingBrokerProfile(true);
      
      try {
        console.log('🔵 Starting broker profile creation...');
        console.log('📱 Phone:', cleanPhone);
        console.log('👤 Name:', profileData.name.trim());
        console.log('🏢 Agency:', profileData.agency_name.trim());
        
        let normalizedPhone = '91' + cleanPhone;

        // ✅ Check if phone already exists
        console.log('🔍 Checking for existing brokers...');
        const allBrokers = await base44.entities.Broker.list();
        console.log(`✅ Found ${allBrokers.length} existing brokers`);
        
        const existingBroker = allBrokers.find(b => {
          const brokerPhoneLast10 = (b.phone || '').replace(/\D/g, '').slice(-10);
          return brokerPhoneLast10 === cleanPhone;
        });

        if (existingBroker) {
          console.log('⚠️ Phone number already exists:', existingBroker.name);
          toast.error('❌ Phone Number Already Exists', {
            description: `This number is already linked to broker: ${existingBroker.name}`,
            duration: 6000,
            className: 'bg-orange-600 text-white border-0'
          });
          setCreatingBrokerProfile(false);
          return;
        }

        const brokerData = {
          name: profileData.name.trim(),
          phone: normalizedPhone,
          agency_name: profileData.agency_name.trim(),
          email: profileData.email.trim() || currentUser.email,
          status: "Active",
          total_listings_count: 0,
          active_listings_count: 0,
          verified: false
        };
        
        console.log('📝 Creating broker with data:', brokerData);

        const newBroker = await base44.entities.Broker.create(brokerData);
        console.log('✅ Broker created successfully:', newBroker.id);

        console.log('🔗 Linking broker to user account...');
        await base44.auth.updateMe({ broker_id: newBroker.id });
        console.log('✅ User linked to broker');
        
        toast.success('✅ Broker Profile Created!', {
          description: 'Welcome to PropAI Live',
          duration: 3000,
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0'
        });
        
        console.log('🔄 Reloading page...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('❌ CREATE PROFILE ERROR:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack
        });
        
        // ✅ ENHANCED: Extract actual error message from different error formats
        let errorMessage = 'Unknown error occurred';
        let errorDescription = 'Please check browser console (F12) for details';
        
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Check for specific error patterns
        if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
          errorDescription = 'Phone number or email already exists';
        } else if (errorMessage.includes('required')) {
          errorDescription = 'Missing required fields';
        } else if (errorMessage.includes('validation')) {
          errorDescription = 'Data validation failed';
        } else if (errorMessage.includes('permission') || errorMessage.includes('authorized')) {
          errorDescription = 'Permission denied';
        }
        
        toast.error(`❌ ${errorMessage}`, {
          description: errorDescription,
          duration: 10000,
          className: 'bg-red-600 text-white border-0'
        });
      } finally {
        setCreatingBrokerProfile(false);
      }
      return;
    }
    
    // ✅ UPDATE EXISTING BROKER PROFILE
    setSavingProfile(true);
    try {
      console.log('🔵 Starting broker profile update for ID:', brokerProfile.id);
      console.log('📱 Original Phone:', brokerProfile.phone);
      console.log('📱 New Phone:', profileData.phone);
      console.log('👤 Original Name:', brokerProfile.name);
      console.log('👤 New Name:', profileData.name);
      
      // ✅ ENHANCED: Validate phone number format for updates too
      const cleanPhone = profileData.phone.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        toast.error('❌ Invalid Phone Number', {
          description: `Must be 10 digits (you entered ${cleanPhone.length} digits)`,
          duration: 5000,
          className: 'bg-red-600 text-white border-0'
        });
        setSavingProfile(false);
        return;
      }

      if (!['6', '7', '8', '9'].includes(cleanPhone[0])) {
        toast.error('❌ Invalid Indian Mobile Number', {
          description: 'Must start with 6, 7, 8, or 9',
          duration: 5000,
          className: 'bg-red-600 text-white border-0'
        });
        setSavingProfile(false);
        return;
      }

      let normalizedPhone = '91' + cleanPhone;

      const updateData = {
        name: profileData.name.trim() || brokerProfile.name,
        agency_name: profileData.agency_name.trim() || null,
        email: profileData.email.trim() || null,
        phone: normalizedPhone || brokerProfile.phone
      };

      console.log('📝 Updating broker with data:', updateData);
      
      await base44.entities.Broker.update(brokerProfile.id, updateData);
      console.log('✅ Broker updated successfully');
      
      setBrokerProfile(prev => ({
        ...prev,
        name: profileData.name.trim() || prev.name,
        agency_name: profileData.agency_name.trim() || null,
        email: profileData.email.trim() || null,
        phone: normalizedPhone || prev.phone
      }));
      
      setEditingProfile(false);
      toast.success('✅ Profile Updated!', {
        duration: 3000,
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0'
      });
    } catch (error) {
      console.error('❌ UPDATE PROFILE ERROR:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // ✅ ENHANCED: Extract actual error message from different error formats for update
      let errorMessage = 'Unknown error occurred';
      let errorDescription = 'Please check browser console (F12) for details';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for specific error patterns
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        errorDescription = 'Phone number or email already exists';
      } else if (errorMessage.includes('required')) {
        errorDescription = 'Missing required fields';
      } else if (errorMessage.includes('validation')) {
        errorDescription = 'Data validation failed';
      } else if (errorMessage.includes('permission') || errorMessage.includes('authorized')) {
        errorDescription = 'Permission denied';
      }
      
      toast.error(`❌ ${errorMessage}`, {
        description: errorDescription,
        duration: 8000,
        className: 'bg-red-600 text-white border-0'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // ✅ NEW: Save Preferred Areas
  const handleSaveAreas = async () => {
    setSavingAreas(true);
    try {
      await base44.auth.updateMe({ preferred_areas: selectedAreas });
      setCurrentUser(prev => ({ ...prev, preferred_areas: selectedAreas }));
      setEditingAreas(false);
      toast.success('✅ Preferred areas saved!', {
        description: 'SmartFeed will prioritize properties from these areas',
        duration: 3000
      });
    } catch (error) {
      toast.error('Failed to save areas', {
        description: error.message
      });
      console.error('Save areas error:', error);
    } finally {
      setSavingAreas(false);
    }
  };

  // ✅ NEW: Toggle Area Selection
  const toggleArea = (area) => {
    if (selectedAreas.includes(area)) {
      setSelectedAreas(selectedAreas.filter(a => a !== area));
    } else {
      setSelectedAreas([...selectedAreas, area]);
    }
  };

  // ✅ TEAM MEMBER MANAGEMENT
  const handleAddTeamMember = async () => {
    if (!teamMemberPhone.trim() || !brokerProfile) {
      toast.error('Please enter a phone number');
      return;
    }
    
    setAddingTeamMember(true);
    try {
      const normalizePhone = (phone) => phone.replace(/\D/g, '').slice(-10);
      const normalized = normalizePhone(teamMemberPhone);
      
      if (normalized.length !== 10) {
        toast.error('Invalid Phone - must be 10 digits');
        setAddingTeamMember(false);
        return;
      }
      
      const brokers = await base44.entities.Broker.list();
      const teamMemberBroker = brokers.find(b => normalizePhone(b.phone || '') === normalized);
      
      if (!teamMemberBroker) {
        toast.error('❌ Broker Not Found', {
          description: 'No broker with this phone number exists'
        });
        setAddingTeamMember(false);
        return;
      }
      
      if (teamMemberBroker.id === brokerProfile.id) {
        toast.error('Cannot add yourself to your team');
        setAddingTeamMember(false);
        return;
      }
      
      const currentTeam = brokerProfile.team_members || [];
      if (currentTeam.some(m => m.broker_id === teamMemberBroker.id)) {
        toast.error(`${teamMemberBroker.name} is already in your team`);
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
      
      await base44.entities.Broker.update(teamMemberBroker.id, { reports_to: brokerProfile.id });
      
      setBrokerProfile(prev => ({
        ...prev,
        team_members: updatedTeam,
        team_leader_of: updatedTeamLeaderOf,
      }));

      toast.success(`✅ ${teamMemberBroker.name} joined your team!`);
      setTeamMemberPhone('');
      setEditingTeam(false);
    } catch (error) {
      toast.error('Failed to add team member', {
        description: error.message
      });
      console.error('Add team member error:', error);
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
      toast.error('Failed to remove team member', {
        description: error.message
      });
      console.error('Remove team member error:', error);
    }
  };

  // ✅ DATA QUERIES
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

  const brokerMetrics = useMemo(() => {
    if (!brokerProfile) return null;

    const activeProps = properties.filter(p => p.status === 'Active' && !p.is_duplicate);
    const activeReqs = requirements.filter(r => r.status === 'Active');

    return {
      totalListings: properties.length,
      activeListings: activeProps.length,
      totalRequirements: requirements.length,
      activeRequirements: activeReqs.length
    };
  }, [brokerProfile, properties, requirements]);

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

  // ✅ LOADING STATE
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

  // ✅ NO BROKER PROFILE - SHOW LINK OR CREATE OPTIONS
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
                  Let's set up your broker profile. You can link to an existing profile or create a new one.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ✅ OPTION 1: LINK TO EXISTING BROKER */}
          <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Already have listings? Link your phone number
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              If your phone number is already in our system (from WhatsApp AI messages), enter it to link your account.
            </p>
            <div className="flex gap-2">
              <Input
                type="tel"
                value={phoneSearchQuery}
                onChange={(e) => setPhoneSearchQuery(e.target.value)}
                placeholder="9820056789"
                className="text-sm font-mono"
              />
              <Button
                onClick={handleSearchBrokerByPhone}
                disabled={linkingBroker || !phoneSearchQuery.trim()}
                className="bg-blue-600 text-white"
              >
                {linkingBroker ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Link Profile'
                )}
              </Button>
            </div>
          </Card>

          {/* ✅ OPTION 2: CREATE NEW BROKER PROFILE */}
          <Card className="p-6 bg-white border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Create New Broker Profile
            </h3>

            <div className="space-y-4">
              <div className="border-2 border-purple-300 rounded-xl p-4 bg-purple-50">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Your Name <span className="text-purple-600 font-bold">*REQUIRED</span>
                </label>
                <Input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="e.g., Ramesh Kumar"
                  className="text-sm border-purple-400"
                />
              </div>

              <div className="border-2 border-purple-300 rounded-xl p-4 bg-purple-50">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Phone Number (WhatsApp) <span className="text-purple-600 font-bold">*REQUIRED</span>
                </label>
                <Input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="9820056789"
                  className="text-sm font-mono border-purple-400"
                />
                <p className="text-xs text-purple-600 mt-2 font-semibold">
                  ⚠️ Required for WhatsApp AI agent and client contacts
                </p>
              </div>

              <div className="border-2 border-purple-300 rounded-xl p-4 bg-purple-50">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Agency Name <span className="text-purple-600 font-bold">*REQUIRED</span>
                </label>
                <Input
                  type="text"
                  value={profileData.agency_name}
                  onChange={(e) => setProfileData({ ...profileData, agency_name: e.target.value })}
                  placeholder="e.g., Bandra Homes"
                  className="text-sm border-purple-400"
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

  // ✅ BROKER PROFILE EXISTS - SHOW FULL PROFILE PAGE
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {(!brokerProfile.phone || !brokerProfile.agency_name) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-3xl p-6 shadow-xl border-2 border-purple-400"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">⚠️ Profile Incomplete</h3>
                <p className="text-purple-100 mb-3">
                  Please add these details to unlock full access:
                </p>
                <div className="space-y-2 text-sm text-purple-100">
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
                  className="mt-4 bg-white text-purple-600 hover:bg-purple-50 font-bold"
                >
                  Complete Profile Now
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between">
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
                  {currentUser.role === 'admin' && (
                    <>
                      <span>•</span>
                      <Badge className="bg-purple-600 text-white">Admin</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ NEW: Admin Quick Actions */}
        {currentUser.role === 'admin' && (
          <Card className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 border-0 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Shortcuts
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                onClick={() => navigate(createPageUrl("Admin"))}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("AdminDashboard"))}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("BrokerNetwork"))}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Network
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("BrokerProfile") + `?id=${brokerProfile.id}`)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                My Profile
              </Button>
            </div>
          </Card>
        )}

        {brokerMetrics && (
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
                <Target className="w-4 h-4 text-purple-600" />
                Active Requirements
              </p>
              <p className="text-3xl font-bold text-purple-600">{brokerMetrics.activeRequirements}</p>
              <p className="text-xs text-slate-500 mt-1">{brokerMetrics.totalRequirements} total</p>
            </Card>

            <Card className="p-4 bg-white border-2 border-slate-200">
              <p className="text-xs text-slate-600 mb-2 font-semibold flex items-center gap-1">
                <Users className="w-4 h-4 text-blue-600" />
                Team Members
              </p>
              <p className="text-3xl font-bold text-blue-600">{enrichedTeamMembers.length}</p>
            </Card>

            <Card className="p-4 bg-white border-2 border-slate-200">
              <p className="text-xs text-slate-600 mb-2 font-semibold flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-600" />
                Trust Score
              </p>
              <p className="text-3xl font-bold text-amber-600">{brokerProfile.trust_score || 50}</p>
            </Card>
          </div>
        )}

        {/* ✅ NEW: Browser Notifications Section */}
        <div className="mb-8">
          <BrowserNotifications user={currentUser} />
        </div>

        {/* ✅ NEW: PREFERRED AREAS CARD */}
        <Card className="p-6 bg-white border-2 border-purple-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              My Preferred Areas ({selectedAreas.length})
            </h3>
            <Button
              onClick={() => {
                setEditingAreas(!editingAreas);
                if (!editingAreas) {
                  setSelectedAreas(currentUser.preferred_areas || []);
                }
              }}
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-700"
            >
              {editingAreas ? 'Cancel' : <><Edit className="w-3 h-3 mr-1" /> Edit Areas</>}
            </Button>
          </div>

          <p className="text-sm text-slate-600 mb-4">
            {editingAreas 
              ? '✨ Select your focus areas. SmartFeed will prioritize properties from these locations.' 
              : '📍 Your preferred areas for property searches and listings'}
          </p>

          {editingAreas ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {popularAreas.map((area) => {
                  const isSelected = selectedAreas.includes(area);
                  return (
                    <Button
                      key={area}
                      onClick={() => toggleArea(area)}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`h-auto py-3 text-xs justify-start ${
                        isSelected
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md"
                          : "border-purple-200 hover:bg-purple-50 text-slate-700"
                      }`}
                    >
                      {isSelected && <Star className="w-3 h-3 mr-1" fill="currentColor" />}
                      {area}
                    </Button>
                  );
                })}
              </div>
              <Button
                onClick={handleSaveAreas}
                disabled={savingAreas}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-full h-12 font-bold"
              >
                {savingAreas ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  '✅ Save Preferred Areas'
                )}
              </Button>
            </>
          ) : (
            <div>
              {selectedAreas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedAreas.map((area) => (
                    <Badge
                      key={area}
                      className="bg-purple-100 text-purple-800 border-purple-300 text-sm px-3 py-1.5"
                    >
                      <Star className="w-3 h-3 mr-1" fill="currentColor" />
                      {area}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-purple-50 rounded-xl border-2 border-purple-200">
                  <MapPin className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 mb-3">No preferred areas set yet</p>
                  <Button
                    onClick={() => setEditingAreas(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Select Your Areas
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ✅ FIXED: PROFILE DETAILS CARD */}
        <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Profile Details
            </h3>
            <Button
              onClick={() => {
                if (editingProfile) {
                  // ✅ FIX: Reset to original data when canceling
                  setProfileData({
                    agency_name: brokerProfile.agency_name || "",
                    email: brokerProfile.email || "",
                    phone: brokerProfile.phone || "",
                    name: brokerProfile.name || currentUser.full_name || ""
                  });
                }
                setEditingProfile(!editingProfile);
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
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Name</label>
                <Input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Your full name"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Phone (WhatsApp)</label>
                <Input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="9820056789"
                  className="text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Agency</label>
                <Input
                  type="text"
                  value={profileData.agency_name}
                  onChange={(e) => setProfileData({ ...profileData, agency_name: e.target.value })}
                  placeholder="e.g., Bandra Homes"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Email</label>
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
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  '✅ Save Profile'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="text-xs text-slate-600 block">Name:</span>
                  <span className="font-semibold text-slate-900">
                    {brokerProfile.name || <span className="text-purple-600 italic">Not set</span>}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                <Phone className="w-6 h-6 text-purple-600" />
                <div>
                  <span className="text-xs text-slate-600 block">WhatsApp:</span>
                  <span className="text-lg font-bold font-mono text-purple-900">
                    {brokerProfile.phone || <span className="text-purple-600 italic text-base">Not set</span>}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Building2 className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="text-xs text-slate-600 block">Agency:</span>
                  <span className="font-semibold text-slate-900">
                    {brokerProfile.agency_name || <span className="text-purple-600 italic">Not set</span>}
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

        {/* ✅ FIXED: TEAM MEMBERS CARD */}
        <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              My Team ({enrichedTeamMembers.length})
            </h3>
            <Button
              onClick={() => {
                if (editingTeam) {
                  // ✅ FIX: Clear phone input when canceling
                  setTeamMemberPhone('');
                }
                setEditingTeam(!editingTeam);
              }}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700"
            >
              {editingTeam ? 'Cancel' : 'Manage Team'}
            </Button>
          </div>

          {/* ✅ FIX: Always render the input when editingTeam is true */}
          {editingTeam && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-3">Add Team Member by Phone</p>
              <p className="text-xs text-slate-600 mb-3">Enter the WhatsApp number of another broker to add them to your team</p>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={teamMemberPhone}
                  onChange={(e) => setTeamMemberPhone(e.target.value)}
                  placeholder="9820056789"
                  className="flex-1 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && teamMemberPhone.trim()) {
                      handleAddTeamMember();
                    }
                  }}
                />
                <Button
                  onClick={handleAddTeamMember}
                  disabled={addingTeamMember || !teamMemberPhone.trim()}
                  className="bg-blue-600 text-white"
                  size="sm"
                >
                  {addingTeamMember ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>
              <p className="text-xs text-blue-600 mt-2">💡 The broker must already exist in PropAI system</p>
            </div>
          )}

          {enrichedTeamMembers.length > 0 ? (
            <div className="space-y-3">
              {enrichedTeamMembers.map((member) => (
                <div key={member.broker_id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-600 font-mono">{member.phone}</p>
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
              <p className="text-sm text-slate-600 mb-2">No team members yet</p>
              {!editingTeam && (
                <Button
                  onClick={() => setEditingTeam(true)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Add First Member
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
