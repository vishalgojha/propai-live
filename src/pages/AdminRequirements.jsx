
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, MessageCircle, Phone, Mail, MapPin, Eye, Clock, Home as HomeIcon, IndianRupee, Shield, ArrowLeft, Bell, Zap, Send, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminRequirements() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [notifying, setNotifying] = useState(null);
  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      // ✅ CHECK PASSWORD AUTH FIRST
      const isPasswordAuthed = sessionStorage.getItem('admin_authenticated') === 'true';
      if (!isPasswordAuthed) {
        navigate(createPageUrl("AdminLogin"));
        return;
      }

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
    enabled: isAuthorized,
  });

  const handleFindMatches = (req) => {
    const searchParams = new URLSearchParams();
    if (req.bhk_preference?.[0]) searchParams.set('bhk', req.bhk_preference[0]);
    if (req.listing_type) searchParams.set('listingType', req.listing_type);
    if (req.preferred_locations?.[0]) searchParams.set('search', req.preferred_locations[0]);
    navigate(createPageUrl("SmartFeed") + "?" + searchParams.toString());
  };

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
        throw new Error('Failed to generate notifications');
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
    return null; 
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
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
        ) : requirements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-[#F7F7F7]">
            <Search className="w-12 h-12 text-[#3B3B3B] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#111111] mb-2">No requirements yet</h3>
            <p className="text-[#3B3B3B]">Client requirements will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {requirements.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-[#F7F7F7] hover:border-[#FFD300]/30"
              >
                <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-6 py-5 border-b border-stone-200/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-[#111111]">{req.client_name}</h3>
                        <Badge className={
                          req.status === "Active" ? "bg-green-500 text-white border-0" :
                          req.status === "Matched" ? "bg-blue-500 text-white border-0" :
                          req.status === "Closed" ? "bg-gray-500 text-white border-0" :
                          "bg-orange-500 text-white border-0"
                        }>
                          {req.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#3B3B3B]">
                        {req.client_phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-stone-500" />
                            {req.client_phone}
                          </span>
                        )}
                        {req.client_email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-stone-500" />
                            {req.client_email}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-stone-500">
                      {format(new Date(req.created_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#F7F7F7] rounded-2xl p-4">
                      <p className="text-xs text-[#3B3B3B]/60 mb-2 flex items-center gap-1">
                        <HomeIcon className="w-3 h-3" />
                        Type
                      </p>
                      <Badge className="bg-[#FFD300] text-black border-0 font-bold">
                        {req.listing_type}
                      </Badge>
                    </div>
                    <div className="bg-[#F7F7F7] rounded-2xl p-4">
                      <p className="text-xs text-[#3B3B3B]/60 mb-2">BHK</p>
                      <p className="text-base font-bold text-[#111111]">
                        {req.bhk_preference?.join(", ") || "Any"}
                      </p>
                    </div>
                    <div className="bg-[#F7F7F7] rounded-2xl p-4 md:col-span-2">
                      <p className="text-xs text-[#3B3B3B]/60 mb-2 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        Budget
                      </p>
                      <p className="text-base font-bold text-[#111111]">
                        ₹{req.budget_min || 0}{req.budget_unit === "crores" ? " Cr" : "L"} - 
                        ₹{req.budget_max || 0}{req.budget_unit === "crores" ? " Cr" : "L"}
                      </p>
                    </div>
                  </div>

                  {req.preferred_locations && req.preferred_locations.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                      <p className="text-xs text-blue-700 font-semibold mb-3 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Preferred Locations
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {req.preferred_locations.map((loc, idx) => (
                          <Badge key={idx} className="bg-white text-blue-700 border-blue-300 font-semibold">
                            {loc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-xs text-[#3B3B3B]/60 mb-3 font-semibold uppercase tracking-wide">Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {req.furnishing_preference && req.furnishing_preference !== "Any" && (
                        <Badge variant="outline" className="border-stone-300 text-stone-700">
                          {req.furnishing_preference}
                        </Badge>
                      )}
                      {req.veg_nonveg && (
                        <Badge variant="outline" className="border-stone-300 text-stone-700">
                          {req.veg_nonveg}
                        </Badge>
                      )}
                      {req.parking_required && (
                        <Badge variant="outline" className="border-stone-300 text-stone-700">
                          Parking Required
                        </Badge>
                      )}
                      {req.possession_timeline && (
                        <Badge variant="outline" className="border-stone-300 text-stone-700">
                          <Clock className="w-3 h-3 mr-1" />
                          {req.possession_timeline}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {req.amenities_required && req.amenities_required.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs text-[#3B3B3B]/60 mb-3 font-semibold uppercase tracking-wide">Required Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {req.amenities_required.map((amenity, idx) => (
                          <Badge key={idx} className="bg-amber-50 text-amber-900 border-amber-200">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {req.notes && (
                    <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                      <p className="text-xs text-stone-600 font-semibold mb-2">Internal Notes</p>
                      <p className="text-sm text-[#111111] leading-relaxed">{req.notes}</p>
                    </div>
                  )}

                  {req.source_text && (
                    <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <p className="text-xs text-blue-600 font-semibold mb-2">Original Message</p>
                      <p className="text-sm text-[#111111] italic leading-relaxed">{req.source_text}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleNotifyBrokers(req)}
                      disabled={notifying === req.id || req.status !== 'Active'}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                      {notifying === req.id ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 animate-pulse" />
                          Finding...
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4 mr-2" />
                          Notify Brokers
                        </>
                      )}
                    </Button>
                    {req.client_phone && (
                      <Button
                        onClick={() => {
                          const message = `Hi ${req.client_name}, this is Chariot Realty. We have some properties matching your requirement for ${req.bhk_preference?.join("/")} in ${req.preferred_locations?.join("/")}. Can we share details?`;
                          window.open(`https://wa.me/${req.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    )}
                    <Button
                      onClick={() => handleFindMatches(req)}
                      variant="outline"
                      className="border-2 border-[#FFD300] text-black hover:bg-[#FFD300] font-semibold"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Find Matches
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {notifications && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
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
                  transition={{ delay: idx * 0.05 }}
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
        </div>
      )}
    </div>
  );
}
