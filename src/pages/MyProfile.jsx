
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  User, Shield, Star, Package, TrendingUp, Users, Building2,
  MapPin, Award, BarChart3, Eye, MessageCircle, Target,
  Calendar, Phone, Mail, Edit, Settings, AlertCircle, X, Loader2, Bot, Search,
  Edit2, Save, Plus, Trash2, CheckCircle2, Home, Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import BrowserNotificationManager from "@/components/notifications/BrowserNotificationManager";
import { useNavigate } from "react-router-dom"; // Added back for navigation in Admin Shortcuts
import { createPageUrl } from "@/utils"; // Added back for navigation in Admin Shortcuts


export default function MyProfile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Kept for navigation in Admin Shortcuts

  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [brokerProfile, setBrokerProfile] = useState(null);
  const [isLoadingBroker, setIsLoadingBroker] = useState(true);

  // Profile setup states
  const [setupMode, setSetupMode] = useState(null); // null, 'create', 'link'
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Edit mode states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});

  // Preferred areas state
  const [isEditingAreas, setIsEditingAreas] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [preferredAreas, setPreferredAreas] = useState([]);

  // Team management states
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [newTeamMemberPhone, setNewTeamMemberPhone] = useState("");

  // Popular Mumbai areas (kept from original code)
  const popularAreas = [
    "Bandra West", "Bandra East", "Juhu", "Andheri West", "Andheri East",
    "Khar West", "BKC", "Worli", "Lower Parel", "Powai",
    "Goregaon West", "Malad West", "Kandivali West", "Borivali West",
    "Santacruz West", "Versova", "Lokhandwala", "Pali Hill", "Carter Road"
  ];

  // 1. Load User
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoadingUser(true);
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load user:", error);
        base44.auth.redirectToLogin(window.location.pathname);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  // 2. Load Broker Profile based on User
  useEffect(() => {
    if (!user) return;

    const loadBrokerProfile = async () => {
      try {
        setIsLoadingBroker(true);
        // Try to find broker by user's email
        let brokers = await base44.entities.Broker.filter({
          email: user.email
        });

        let foundBroker = brokers.length > 0 ? brokers[0] : null;

        // If no broker found by email, try by user's primary phone (if available)
        if (!foundBroker && user.phone_number) {
            const normalizedUserPhone = user.phone_number.replace(/\D/g, '').slice(-10);
            const allBrokers = await base44.entities.Broker.list(); // Fetch all to match last 10 digits
            foundBroker = allBrokers.find(b => {
                if (!b.phone) return false;
                const brokerPhoneLast10 = b.phone.replace(/\D/g, '').slice(-10);
                return brokerPhoneLast10 === normalizedUserPhone;
            });
        }
        
        // If still no broker found, check if user has a broker_id
        if (!foundBroker && user.broker_id) {
            const allBrokers = await base44.entities.Broker.list();
            foundBroker = allBrokers.find(b => b.id === user.broker_id);
        }

        if (foundBroker) {
          setBrokerProfile(foundBroker);
          setPreferredAreas(foundBroker.areas_covered || []);
          // Check for incomplete profile immediately after loading if necessary
          if (!foundBroker.phone || !foundBroker.agency_name) {
            toast.info('👋 Please complete your profile to unlock all features', {
              description: 'Phone number and agency name are required',
              duration: 10000,
              className: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0'
            });
            setIsEditingProfile(true); // Automatically open edit mode
          }
        } else {
            // If no broker profile found at all, suggest creating or linking
            setSetupMode(null); // Ensure setup mode is not 'link' or 'create' from previous attempt
        }
      } catch (error) {
        console.error("Failed to load broker profile:", error);
        toast.error("Failed to load broker profile", {
            description: error.message
        });
      } finally {
        setIsLoadingBroker(false);
      }
    };

    loadBrokerProfile();
  }, [user]);

  // Utility to validate phone numbers
  const validatePhoneNumber = (phone) => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return { isValid: false, message: `Must be 10 digits (you entered ${cleanPhone.length} digits)` };
    }
    if (!['6', '7', '8', '9'].includes(cleanPhone[0])) {
      return { isValid: false, message: 'Must start with 6, 7, 8, or 9 for Indian numbers' };
    }
    return { isValid: true, cleaned: cleanPhone, normalized: '91' + cleanPhone };
  };

  const searchBrokerByPhone = async () => {
    if (!searchPhone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    const phoneValidation = validatePhoneNumber(searchPhone);
    if (!phoneValidation.isValid) {
        toast.error('❌ Invalid Phone Number', { description: phoneValidation.message });
        return;
    }

    setIsSearching(true);
    try {
      const phoneLast10 = phoneValidation.cleaned;

      const allBrokers = await base44.entities.Broker.list();
      const matches = allBrokers.filter(b => {
        if (!b.phone) return false;
        const brokerPhoneLast10 = b.phone.replace(/\D/g, '').slice(-10);
        return brokerPhoneLast10 === phoneLast10;
      });

      setSearchResults(matches);

      if (matches.length === 0) {
        toast.info("No broker found", {
          description: "You can create a new profile instead"
        });
      }
    } catch (error) {
      toast.error("Search failed", {
        description: error.message
      });
      console.error('Search broker by phone error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const linkToBroker = async (broker) => {
    if (!user) {
        toast.error("User not logged in.");
        return;
    }
    try {
      // Update the broker profile to include the user's email if it's not already there
      const updateData = {};
      if (!broker.email && user.email) {
          updateData.email = user.email;
      }
      // Ensure the broker_id is set on the user's account
      await base44.auth.updateMe({ broker_id: broker.id });
      
      // Update broker with email if needed
      if (Object.keys(updateData).length > 0) {
          await base44.entities.Broker.update(broker.id, updateData);
      }

      setBrokerProfile({ ...broker, ...updateData }); // Update local state
      setPreferredAreas(broker.areas_covered || []);
      setSetupMode(null);
      setSearchPhone("");
      setSearchResults([]);

      toast.success("Profile linked!", {
        description: `Connected to broker profile: ${broker.name}`
      });
      queryClient.invalidateQueries(['broker-profile']);
      window.location.reload(); // Reload to refresh all related data
    } catch (error) {
      toast.error("Failed to link profile", {
        description: error.message
      });
      console.error('Link to broker error:', error);
    }
  };

  const createNewBrokerProfile = async () => {
    if (!user) {
        toast.error("User not logged in.");
        return;
    }
    try {
      const allBrokers = await base44.entities.Broker.list();
      const brokerCount = allBrokers.length;
      const customId = `CHR-BRK-${String(brokerCount + 1).padStart(4, '0')}`;
      
      // Use user's full_name as initial name, email as email, and phone_number if available for phone
      let initialName = user.full_name || user.email.split('@')[0];
      let initialEmail = user.email;
      let initialPhone = user.phone_number ? validatePhoneNumber(user.phone_number).normalized : null;

      if (!initialPhone) {
        toast.error('❌ Missing Phone Number', {
            description: 'Please set your phone number in user settings or link an existing broker profile',
            duration: 8000,
            className: 'bg-red-600 text-white border-0'
        });
        return;
      }
      
      // Check for existing phone number before creating
      const existingBrokerWithPhone = allBrokers.find(b => {
          if (!b.phone) return false;
          const brokerPhoneLast10 = b.phone.replace(/\D/g, '').slice(-10);
          return brokerPhoneLast10 === validatePhoneNumber(user.phone_number).cleaned;
      });

      if (existingBrokerWithPhone) {
          toast.error('❌ Phone Number Already Exists', {
              description: `This phone number is already linked to broker: ${existingBrokerWithPhone.name}. Please link your profile instead.`,
              duration: 8000,
              className: 'bg-red-600 text-white border-0'
          });
          return;
      }

      const newBrokerData = {
        custom_id: customId,
        name: initialName,
        phone: initialPhone,
        email: initialEmail,
        status: "Active",
        total_listings_count: 0,
        active_listings_count: 0,
        verified: false,
        areas_covered: []
      };

      const newBroker = await base44.entities.Broker.create(newBrokerData);
      
      await base44.auth.updateMe({ broker_id: newBroker.id });

      setBrokerProfile(newBroker);
      setPreferredAreas(newBroker.areas_covered || []);
      setSetupMode(null);

      toast.success("Profile created!", {
        description: "Your broker profile is now active"
      });
      queryClient.invalidateQueries(['broker-profile']);
      window.location.reload(); // Reload to refresh all related data
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      let errorDescription = 'Please check browser console (F12) for details';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(`❌ ${errorMessage}`, {
        description: errorDescription,
        duration: 8000,
        className: 'bg-red-600 text-white border-0'
      });
      console.error('Create new broker profile error:', error);
    }
  };

  const saveProfileEdits = async () => {
    if (!brokerProfile) return;

    let updatedPhone = editedProfile.phone;
    if (updatedPhone) {
      const phoneValidation = validatePhoneNumber(updatedPhone);
      if (!phoneValidation.isValid) {
          toast.error('❌ Invalid Phone Number', { description: phoneValidation.message });
          return;
      }
      updatedPhone = phoneValidation.normalized;
    }

    try {
      const dataToUpdate = {
        name: editedProfile.name,
        phone: updatedPhone,
        email: editedProfile.email,
        agency_name: editedProfile.agency_name,
        notes: editedProfile.notes
      };

      await base44.entities.Broker.update(brokerProfile.id, dataToUpdate);
      
      setBrokerProfile(prev => ({ ...prev, ...dataToUpdate }));
      setIsEditingProfile(false);
      setEditedProfile({});

      toast.success("Profile updated!");
      queryClient.invalidateQueries(['broker-profile']);
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      let errorDescription = 'Please check browser console (F12) for details';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        errorDescription = 'Phone number or email might already exist for another broker.';
      }

      toast.error(`❌ ${errorMessage}`, {
        description: errorDescription,
        duration: 8000,
        className: 'bg-red-600 text-white border-0'
      });
      console.error('Save profile edits error:', error);
    }
  };

  const addPreferredArea = async () => {
    if (!newArea.trim()) {
        toast.error("Please enter an area.");
        return;
    }
    const areaToAdd = newArea.trim();
    if (preferredAreas.includes(areaToAdd)) {
        toast.info("Area already added.");
        setNewArea("");
        return;
    }

    const updatedAreas = [...preferredAreas, areaToAdd];
    setPreferredAreas(updatedAreas);
    setNewArea("");

    try {
      await base44.entities.Broker.update(brokerProfile.id, {
        areas_covered: updatedAreas
      });
      toast.success("Area added!");
    } catch (error) {
      toast.error("Failed to add area");
      setPreferredAreas(preferredAreas); // Revert on error
      console.error('Add preferred area error:', error);
    }
  };

  const removePreferredArea = async (areaToRemove) => {
    const updatedAreas = preferredAreas.filter(a => a !== areaToRemove);
    setPreferredAreas(updatedAreas);

    try {
      await base44.entities.Broker.update(brokerProfile.id, {
        areas_covered: updatedAreas
      });
      toast.success("Area removed!");
    } catch (error) {
      toast.error("Failed to remove area");
      setPreferredAreas(preferredAreas); // Revert on error
      console.error('Remove preferred area error:', error);
    }
  };

  const savePreferredAreas = async () => {
    try {
      await base44.entities.Broker.update(brokerProfile.id, {
        areas_covered: preferredAreas
      });
      setIsEditingAreas(false);
      toast.success("Preferred areas saved!");
    } catch (error) {
      toast.error("Failed to save areas");
      console.error('Save preferred areas error:', error);
    }
  };

  const addTeamMember = async () => {
    if (!newTeamMemberPhone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    const phoneValidation = validatePhoneNumber(newTeamMemberPhone);
    if (!phoneValidation.isValid) {
        toast.error('❌ Invalid Phone Number', { description: phoneValidation.message });
        return;
    }

    try {
      const phoneLast10 = phoneValidation.cleaned;

      const allBrokers = await base44.entities.Broker.list();
      const teamMember = allBrokers.find(b => {
        if (!b.phone) return false;
        const brokerPhoneLast10 = b.phone.replace(/\D/g, '').slice(-10);
        return brokerPhoneLast10 === phoneLast10;
      });

      if (!teamMember) {
        toast.error("Broker not found", {
          description: "No broker with this phone number exists in PropAI. Ask them to create a profile first."
        });
        return;
      }
      if (teamMember.id === brokerProfile.id) {
        toast.error("Cannot add yourself to your team.");
        return;
      }

      const currentTeamMembers = brokerProfile.team_members || [];
      const alreadyInTeam = currentTeamMembers.some(m => m.broker_id === teamMember.id);

      if (alreadyInTeam) {
        toast.info(`${teamMember.name} is already in your team!`);
        return;
      }
      
      const memberListingCount = await base44.entities.Property.filter({
        broker_id: teamMember.id,
        status: 'Active',
        is_duplicate: false
      }).then(res => res.length);


      const newTeamMemberData = {
        broker_id: teamMember.id,
        name: teamMember.name,
        phone: teamMember.phone,
        role: teamMember.agency_name || 'Team Member', // Default role
        co_listing_count: memberListingCount // Dynamically get listings count
      };

      const updatedTeam = [...currentTeamMembers, newTeamMemberData];
      const updatedTeamLeaderOf = [...(brokerProfile.team_leader_of || []), teamMember.id];
      
      await base44.entities.Broker.update(brokerProfile.id, {
        team_members: updatedTeam,
        team_leader_of: updatedTeamLeaderOf
      });
      
      await base44.entities.Broker.update(teamMember.id, { reports_to: brokerProfile.id });

      setBrokerProfile(prev => ({
        ...prev,
        team_members: updatedTeam,
        team_leader_of: updatedTeamLeaderOf,
      }));
      setIsAddingTeamMember(false);
      setNewTeamMemberPhone("");

      toast.success(`Added ${teamMember.name} to team!`);
      queryClient.invalidateQueries(['broker-profile']);
    } catch (error) {
      toast.error("Failed to add team member", {
        description: error.message
      });
      console.error('Add team member error:', error);
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


  // Fetch properties and requirements
  const { data: properties = [] } = useQuery({
    queryKey: ['broker-properties', brokerProfile?.id],
    queryFn: () => base44.entities.Property.filter({ broker_id: brokerProfile.id }, '-created_date'),
    enabled: !!brokerProfile
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['broker-requirements', brokerProfile?.id],
    queryFn: () => base44.entities.Requirement.filter({ broker_id: brokerProfile.id }, '-created_date'),
    enabled: !!brokerProfile
  });

  // Calculate metrics
  const activeProperties = properties.filter(p => p.status === 'Active' && !p.is_duplicate).length;
  const totalProperties = properties.length;
  const activeRequirements = requirements.filter(r => r.status === 'Active').length;
  const totalRequirements = requirements.length;
  const totalListings = totalProperties + totalRequirements;


  if (isLoadingUser || isLoadingBroker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors closeButton />
        <Card className="p-8 text-center">
          <p className="text-slate-700 mb-4">Please log in to view your profile</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Log In
          </Button>
        </Card>
      </div>
    );
  }

  // Initial setup: No broker profile, offer to link or create
  if (!brokerProfile && !setupMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Toaster position="top-center" richColors closeButton />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="p-8 text-center bg-white border-2 border-slate-200">
            <User className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to PropAI Live!</h2>
            <p className="text-slate-600 mb-6">
              Let's set up your broker profile to get started
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setSetupMode('link')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 text-lg font-bold"
              >
                Link Existing Profile
              </Button>
              <Button
                onClick={() => setSetupMode('create')}
                variant="outline"
                className="h-12 text-lg font-bold"
              >
                Create New Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Setup mode: Link existing profile
  if (setupMode === 'link') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Toaster position="top-center" richColors closeButton />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="p-8 bg-white border-2 border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Link Existing Profile</h2>
            <p className="text-slate-600 mb-6">
              Enter your phone number to find your existing broker profile (e.g., from WhatsApp AI messages).
            </p>

            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter 10-digit phone number (e.g., 9820012345)"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="flex-1"
                type="tel"
              />
              <Button onClick={searchBrokerByPhone} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-slate-700 font-semibold mb-2">Found Profiles:</p>
                {searchResults.map(broker => (
                  <Card key={broker.id} className="p-4 flex items-center justify-between border-2 border-purple-200 bg-purple-50">
                    <div>
                      <p className="font-semibold text-slate-900">{broker.name}</p>
                      <p className="text-sm text-slate-600 font-mono">{broker.phone}</p>
                      {broker.agency_name && (
                        <p className="text-xs text-purple-700">{broker.agency_name}</p>
                      )}
                    </div>
                    <Button onClick={() => linkToBroker(broker)} size="sm" className="bg-purple-600 text-white">
                      Link This Profile
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            <Button onClick={() => setSetupMode(null)} variant="outline" className="w-full mt-4">
              Cancel
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Setup mode: Create new profile
  if (setupMode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Toaster position="top-center" richColors closeButton />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="p-8 bg-white border-2 border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Create New Broker Profile</h2>
            <p className="text-slate-600 mb-6">
              We'll create a new broker profile for you using your account information.
            </p>

            <div className="bg-purple-50 rounded-lg p-4 mb-6 border-2 border-purple-200">
              <p className="text-sm text-slate-700 mb-2"><strong>Name:</strong> {user.full_name || user.email.split('@')[0]}</p>
              <p className="text-sm text-slate-700 mb-2"><strong>Email:</strong> {user.email}</p>
              <p className="text-sm text-slate-700"><strong>Phone:</strong> {user.phone_number || <span className="text-red-500">Not set in user profile</span>}</p>
              {!user.phone_number && (
                <p className="text-xs text-red-600 mt-2">
                    ⚠️ Your user profile does not have a phone number. Please update your user profile's phone number or use the "Link Existing Profile" option.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={createNewBrokerProfile} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 h-12 text-lg font-bold" disabled={!user.phone_number}>
                Create Profile
              </Button>
              <Button onClick={() => setSetupMode(null)} variant="outline" className="h-12 text-lg font-bold">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main Profile View
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
        {/* Header */}
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
                    {user.role === 'admin' && (
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

        {/* Admin Actions */}
        {user.role === 'admin' && (
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

        {/* Profile Incomplete Banner (re-added from original if conditions met) */}
        {(!brokerProfile.phone || !brokerProfile.agency_name) && (
          <div className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-3xl p-6 shadow-xl border-2 border-purple-400">
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
                    setIsEditingProfile(true);
                    setEditedProfile({
                        name: brokerProfile.name,
                        phone: brokerProfile.phone,
                        email: brokerProfile.email,
                        agency_name: brokerProfile.agency_name,
                        notes: brokerProfile.notes
                    });
                  }}
                  className="mt-4 bg-white text-purple-600 hover:bg-purple-50 font-bold"
                >
                  Complete Profile Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between mb-2">
                <Home className="w-8 h-8 text-purple-600" />
                <Badge className="bg-purple-600 text-white">{activeProperties} active</Badge>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalProperties}</p>
            <p className="text-sm text-slate-600">Total Properties</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-8 h-8 text-blue-600" />
                <Badge className="bg-blue-600 text-white">{activeRequirements} active</Badge>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalRequirements}</p>
            <p className="text-sm text-slate-600">Total Requirements</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <Badge className="bg-green-600 text-white">Combined</Badge>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalListings}</p>
            <p className="text-sm text-slate-600">Total Listings & Req.</p>
            </Card>
        </div>

        {/* Browser Notifications Section */}
        <div className="mb-8">
          <BrowserNotificationManager user={user} />
        </div>

        {/* Preferred Areas */}
        <Card className="p-6 bg-white border-2 border-purple-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900">Preferred Areas ({preferredAreas.length})</h3>
            </div>
            {!isEditingAreas ? (
              <Button onClick={() => setIsEditingAreas(true)} size="sm" variant="outline" className="border-purple-300 text-purple-700">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={savePreferredAreas} size="sm" className="bg-purple-600 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={() => setIsEditingAreas(false)} size="sm" variant="outline" className="border-purple-300 text-purple-700">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-600 mb-4">
            {isEditingAreas 
              ? '✨ Select your focus areas or add custom ones. SmartFeed will prioritize properties from these locations.' 
              : '📍 Your preferred areas for property searches and listings'}
          </p>

          {isEditingAreas && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                {popularAreas.map((area) => {
                  const isSelected = preferredAreas.includes(area);
                  return (
                    <Button
                      key={area}
                      onClick={() => {
                        if (isSelected) {
                            removePreferredArea(area);
                        } else {
                            setPreferredAreas([...preferredAreas, area]); // Optimistic update
                        }
                      }}
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
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add custom area (e.g., Colaba)"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPreferredArea()}
                  className="flex-1"
                />
                <Button onClick={addPreferredArea}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            {preferredAreas.length === 0 ? (
              <div className="text-center py-8 bg-purple-50 rounded-xl border-2 border-purple-200 w-full">
                <MapPin className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-3">No preferred areas set yet</p>
                <Button
                  onClick={() => setIsEditingAreas(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Select Your Areas
                </Button>
              </div>
            ) : (
              preferredAreas.map((area, idx) => (
                <Badge
                  key={idx}
                  className="bg-purple-100 text-purple-800 border-purple-300 text-sm px-3 py-1.5 flex items-center gap-1"
                >
                  <Star className="w-3 h-3" fill="currentColor" />
                  {area}
                  {isEditingAreas && (
                    <button
                      onClick={() => removePreferredArea(area)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))
            )}
          </div>
        </Card>

        {/* Profile Details */}
        <Card className="p-6 bg-white border-2 border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900">Profile Details</h3>
            </div>
            {!isEditingProfile ? (
              <Button onClick={() => {
                setIsEditingProfile(true);
                setEditedProfile({
                  name: brokerProfile.name,
                  phone: brokerProfile.phone ? brokerProfile.phone.replace('91', '') : '', // Pre-fill with 10 digits
                  email: brokerProfile.email,
                  agency_name: brokerProfile.agency_name,
                  notes: brokerProfile.notes
                });
              }} size="sm" variant="outline" className="border-purple-300 text-purple-700">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={saveProfileEdits} size="sm" className="bg-purple-600 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={() => {
                  setIsEditingProfile(false);
                  setEditedProfile({});
                }} size="sm" variant="outline" className="border-purple-300 text-purple-700">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Name</label>
              {isEditingProfile ? (
                <Input
                  value={editedProfile.name || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                  placeholder="Your full name"
                />
              ) : (
                <p className="text-slate-900">{brokerProfile.name || <span className="text-slate-400 italic">Not set</span>}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Phone (WhatsApp)</label>
              {isEditingProfile ? (
                <Input
                  type="tel"
                  value={editedProfile.phone || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                  placeholder="9820012345"
                  className="font-mono"
                />
              ) : (
                <p className="text-slate-900 font-mono">{brokerProfile.phone || <span className="text-slate-400 italic">Not set</span>}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Email</label>
              {isEditingProfile ? (
                <Input
                  type="email"
                  value={editedProfile.email || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                  placeholder="your.email@example.com"
                />
              ) : (
                <p className="text-slate-900">{brokerProfile.email || <span className="text-slate-400 italic">Not set</span>}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Agency Name</label>
              {isEditingProfile ? (
                <Input
                  value={editedProfile.agency_name || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, agency_name: e.target.value})}
                  placeholder="e.g., Bandra Homes"
                />
              ) : (
                <p className="text-slate-900">{brokerProfile.agency_name || <span className="text-slate-400 italic">Not set</span>}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Notes</label>
              {isEditingProfile ? (
                <Textarea
                  value={editedProfile.notes || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, notes: e.target.value})}
                  rows={3}
                  placeholder="Any internal notes about this broker..."
                />
              ) : (
                <p className="text-slate-900 whitespace-pre-wrap">{brokerProfile.notes || <span className="text-slate-400 italic">No notes</span>}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Team Management */}
        <Card className="p-6 bg-white border-2 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900">Team Members ({brokerProfile.team_members?.length || 0})</h3>
            </div>
            {!isAddingTeamMember ? (
                <Button onClick={() => setIsAddingTeamMember(true)} size="sm" variant="outline" className="border-blue-300 text-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                </Button>
            ) : (
                <Button onClick={() => {
                    setIsAddingTeamMember(false);
                    setNewTeamMemberPhone('');
                }} size="sm" variant="outline" className="border-blue-300 text-blue-700">
                    <X className="w-4 h-4" />
                    Cancel
                </Button>
            )}
          </div>

          {isAddingTeamMember && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-3">Add Team Member by Phone</p>
              <p className="text-xs text-slate-600 mb-3">Enter the WhatsApp number of another broker to add them to your team</p>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="Enter 10-digit phone number (e.g., 9820012345)"
                  value={newTeamMemberPhone}
                  onChange={(e) => setNewTeamMemberPhone(e.target.value)}
                  className="flex-1 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTeamMemberPhone.trim()) {
                      addTeamMember();
                    }
                  }}
                />
                <Button onClick={addTeamMember} className="bg-blue-600 text-white" size="sm">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
              <p className="text-xs text-blue-600 mt-2">💡 The broker must already exist in PropAI system</p>
            </div>
          )}

          {(brokerProfile.team_members && brokerProfile.team_members.length > 0) ? (
            <div className="space-y-3">
              {brokerProfile.team_members.map((member) => (
                <Card key={member.broker_id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{member.name}</p>
                      <p className="text-sm text-slate-600 font-mono">{member.phone}</p>
                      {member.agency_name && (
                        <p className="text-xs text-purple-700 font-semibold">{member.agency_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-700">{member.co_listing_count || 0}</p>
                        <p className="text-xs text-slate-600">listings</p>
                      </div>
                      <Button
                        onClick={() => handleRemoveTeamMember(member.broker_id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-2">No team members yet</p>
              {!isAddingTeamMember && (
                <Button
                  onClick={() => setIsAddingTeamMember(true)}
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
