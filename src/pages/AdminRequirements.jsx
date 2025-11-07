
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import {
  Search, MessageCircle, Phone, Mail, MapPin, Eye, Clock, Home, IndianRupee, Shield, ArrowLeft,
  Plus, Calendar, DollarSign, User, AlertCircle, CheckCircle2, TrendingUp, Edit, Trash2, Filter, X, Zap, Bell, Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function AdminRequirements() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [notifying, setNotifying] = useState(null); // Track which requirement is being notified
  const [notifications, setNotifications] = useState(null);

  // Check if user is admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
          navigate(createPageUrl("Home"));
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    initialData: [],
    enabled: isAuthorized, // Only run the query if authorized
  });

  // For the purpose of the outline, assume filteredRequirements is just requirements
  // In a real app, this would be derived from user applied filters.
  const filteredRequirements = requirements;

  const handleFindMatches = (req) => {
    const searchParams = new URLSearchParams();
    if (req.bhk_preference?.[0]) searchParams.set('bhk', req.bhk_preference[0]);
    if (req.listing_type) searchParams.set('listingType', req.listing_type);
    if (req.preferred_locations?.[0]) searchParams.set('search', req.preferred_locations[0]);
    navigate(createPageUrl("SmartFeed") + "?" + searchParams.toString());
  };

  // NEW: Notify Brokers of Match
  const handleNotifyBrokers = async (requirement) => {
    setNotifying(requirement.id);
    const loadingToast = toast.loading('🤖 Finding matching brokers...', {
      description: 'AI is analyzing properties and generating notifications'
    });

    try {
      const response = await base44.functions.invoke('notifyBrokersOfMatch', {
        requirementId: requirement.id,
        autoSend: false
      });

      toast.dismiss(loadingToast);

      if (response.data.success) {
        setNotifications(response.data);
        toast.success(`✅ Found ${response.data.notifications.length} brokers with matching properties!`, {
          description: `Average match score: ${response.data.summary.avg_match_score}%`,
          duration: 5000
        });
      } else {
        throw new Error(response.data.message || 'Failed to generate notifications');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Notification generation failed', {
        description: error.message
      });
    } finally {
      setNotifying(null);
    }
  };

  // Placeholder for Edit and Delete functionality - not in outline, but needed for buttons
  const handleEdit = (req) => {
    console.log("Edit requirement:", req.id);
    toast.info("Edit functionality not yet implemented.");
  };

  const handleDelete = (reqId) => {
    console.log("Delete requirement:", reqId);
    toast.info("Delete functionality not yet implemented.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-[#FFD300] mx-auto mb-4 animate-pulse" />
          <p className="text-[#3B3B3B]">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // If not authorized after loading, return null or an unauthorized message
    // Navigation already happened in useEffect if not authorized
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">

        {/* Back Button + Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(createPageUrl("Admin"))}
            variant="ghost"
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-[#111111] mb-2">Requirements</h1>
          <p className="text-[#3B3B3B]">Client requirements & matching</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Total Requirements</p>
            <p className="text-2xl font-bold text-[#111111]">{requirements.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {requirements.filter(r => r.status === "Active").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Matched</p>
            <p className="text-2xl font-bold text-blue-600">
              {requirements.filter(r => r.status === "Matched").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Closed</p>
            <p className="text-2xl font-bold text-[#3B3B3B]">
              {requirements.filter(r => r.status === "Closed").length}
            </p>
          </div>
        </div>

        {requirementsLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Requirement
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRequirements.map((req) => {
                    const budget = req.budget_min && req.budget_max
                      ? `₹${req.budget_min}-${req.budget_max}${req.budget_unit === 'crores' ? 'Cr' : 'L'}`
                      : req.budget_max
                      ? `Up to ₹${req.budget_max}${req.budget_unit === 'crores' ? 'Cr' : 'L'}`
                      : 'Not specified';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">
                              {req.bhk_preference?.join(', ') || 'Property'}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="w-3 h-3" />
                              {req.preferred_locations?.join(', ') || 'Flexible'}
                            </div>
                            {req.custom_id && (
                              <p className="text-xs text-slate-400 mt-1 font-mono">{req.custom_id}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{req.client_name}</p>
                            {req.client_phone && (
                              <a
                                href={`tel:${req.client_phone}`}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                              >
                                <Phone className="w-3 h-3" />
                                {req.client_phone}
                              </a>
                            )}
                            {req.is_direct_client ? (
                              <Badge className="mt-2 bg-purple-500/20 text-purple-700 border-purple-500 text-xs">
                                Direct Client
                              </Badge>
                            ) : (
                              <Badge className="mt-2 bg-blue-500/20 text-blue-700 border-blue-500 text-xs">
                                Broker Referral
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Home className="w-3 h-3" />
                              {req.listing_type}
                            </div>
                            {req.furnishing_preference && (
                              <div className="text-xs text-slate-500">
                                🪑 {req.furnishing_preference}
                              </div>
                            )}
                            {req.urgency && (
                              <Badge className={`text-xs ${
                                req.urgency === 'High' ? 'bg-red-500/20 text-red-700 border-red-500' :
                                req.urgency === 'Medium' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500' :
                                'bg-green-500/20 text-green-700 border-green-500'
                              }`}>
                                {req.urgency === 'High' && '🔥 '}
                                {req.urgency}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{budget}</p>
                          {req.possession_timeline && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {req.possession_timeline}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${
                            req.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500' :
                            req.status === 'Matched' ? 'bg-blue-500/20 text-blue-700 border-blue-500' :
                            req.status === 'Closed' ? 'bg-slate-500/20 text-slate-700 border-slate-500' :
                            'bg-yellow-500/20 text-yellow-700 border-yellow-500'
                          }`}>
                            {req.status}
                          </Badge>
                          {req.ai_matched_properties && req.ai_matched_properties.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                              <TrendingUp className="w-3 h-3" />
                              {req.ai_matched_properties.length} AI matches
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleNotifyBrokers(req)}
                              disabled={notifying === req.id || req.status !== 'Active'}
                              size="sm"
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                            >
                              {notifying === req.id ? (
                                <>
                                  <Zap className="w-3 h-3 mr-1 animate-pulse" />
                                  Finding...
                                </>
                              ) : (
                                <>
                                  <Bell className="w-3 h-3 mr-1" />
                                  Notify
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleEdit(req)}
                              variant="ghost"
                              size="icon"
                              className="hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(req.id)}
                              variant="ghost"
                              size="icon"
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRequirements.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No requirements found matching your filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* NEW: Broker Notifications Modal */}
      <AnimatePresence>
        {notifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      🎯 Broker Match Notifications
                    </h2>
                    <p className="text-sm text-slate-600">
                      {notifications.notifications.length} brokers with {notifications.summary.total_matches} matching properties
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <Badge className="bg-green-500/20 text-green-700 border-green-500">
                        Avg Match: {notifications.summary.avg_match_score}%
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-700 border-blue-500">
                        Requirement: {notifications.requirement.custom_id}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => setNotifications(null)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {notifications.notifications.map((notification, idx) => (
                  <motion.div
                    key={notification.broker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }} {/* Reduced delay for snappier animation */}
                    className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{notification.broker.name}</h3>
                        <p className="text-sm text-slate-600">{notification.broker.phone}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-purple-500/20 text-purple-700 border-purple-500 text-xs">
                            {notification.matchCount} {notification.matchCount === 1 ? 'Match' : 'Matches'}
                          </Badge>
                          <Badge className="bg-green-500/20 text-green-700 border-green-500 text-xs">
                            Top Score: {notification.topMatch.score}%
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => window.open(notification.whatsappUrl, '_blank')}
                        className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send WhatsApp
                      </Button>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-2 font-semibold">Message Preview:</p>
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">
                        {notification.message}
                      </pre>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    💡 Click "Send WhatsApp" to open pre-filled messages for each broker
                  </p>
                  <Button
                    onClick={() => setNotifications(null)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
