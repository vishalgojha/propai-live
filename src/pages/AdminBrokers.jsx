
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users, MessageCircle, Phone, Star, Search, Filter,
  Eye, CheckCircle2, Edit2, Download, MapPin, Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AdminBrokers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const queryClient = useQueryClient();

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
        console.error("Authorization check failed:", error); // Log the error for debugging
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: brokers = [], isLoading: brokersLoading } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => base44.entities.Broker.list('-last_activity'),
    initialData: [],
    enabled: isAuthorized,
  });

  const updateBrokerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Broker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      setEditModalOpen(false);
      setSelectedBroker(null);
    },
  });

  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = !searchQuery ||
      broker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.phone?.includes(searchQuery) ||
      broker.agency_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.areas_covered?.some(area => area.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || broker.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: brokers.length,
    active: brokers.filter(b => b.status === "Active").length,
    verified: brokers.filter(b => b.verified).length,
    blacklisted: brokers.filter(b => b.status === "Blacklisted").length,
    totalListings: brokers.reduce((sum, b) => sum + (b.total_listings_count || 0), 0),
    activeListings: brokers.reduce((sum, b) => sum + (b.active_listings_count || 0), 0),
  };

  const handleWhatsApp = (broker) => {
    const message = `Hi ${broker.name}, this is Chariot Realty. Can we discuss current property listings?`;
    window.open(`https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleViewListings = (broker) => {
    window.location.href = createPageUrl("SmartFeed") + `?broker=${broker.id}`;
  };

  const handleExportCSV = () => {
    const csv = [
      ['ID', 'Name', 'Phone', 'Agency', 'Total Listings', 'Active Listings', 'Status', 'Rating', 'Areas'].join(','),
      ...filteredBrokers.map(b => [
        b.custom_id || b.id,
        b.name,
        b.phone,
        b.agency_name || '',
        b.total_listings_count || 0,
        b.active_listings_count || 0,
        b.status,
        b.reliability_rating || '',
        (b.areas_covered || []).join('; ')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chariot-brokers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const BrokerEditModal = () => {
    if (!selectedBroker) return null;

    const [formData, setFormData] = useState({
      reliability_rating: selectedBroker.reliability_rating || 0,
      notes: selectedBroker.notes || '',
      status: selectedBroker.status || 'Active',
      verified: selectedBroker.verified || false,
      response_time: selectedBroker.response_time || 'Unknown',
    });

    return (
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Broker: {selectedBroker.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#111111] mb-2 block">Status</label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Dormant">Dormant</SelectItem>
                  <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#111111] mb-2 block">Reliability Rating (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setFormData({...formData, reliability_rating: rating})}
                    className={`p-2 rounded-xl transition-all ${
                      formData.reliability_rating >= rating
                        ? 'bg-[#FFD300] text-black'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Star className="w-5 h-5" fill={formData.reliability_rating >= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#111111] mb-2 block">Response Time</label>
              <Select value={formData.response_time} onValueChange={(val) => setFormData({...formData, response_time: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fast">Fast</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Slow">Slow</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.verified}
                onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                className="w-4 h-4"
              />
              <label className="text-sm font-semibold text-[#111111]">Verified Broker</label>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#111111] mb-2 block">Internal Notes</label>
              <Textarea
                placeholder="e.g., 'reliable, only Juhu flats, fast response'"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateBrokerMutation.mutate({ id: selectedBroker.id, data: formData })}
                className="bg-[#FFD300] text-black hover:bg-[#FFC700]"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
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
          <h1 className="text-3xl font-bold text-[#111111] mb-2">Brokers</h1>
          <p className="text-[#3B3B3B]">Manage broker relationships & intelligence</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Total Brokers</p>
            <p className="text-2xl font-bold text-[#111111]">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Verified</p>
            <p className="text-2xl font-bold text-[#FFD300]">{stats.verified}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Blacklisted</p>
            <p className="text-2xl font-bold text-red-600">{stats.blacklisted}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Total Listings</p>
            <p className="text-2xl font-bold text-[#111111]">{stats.totalListings}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Active Listings</p>
            <p className="text-2xl font-bold text-blue-600">{stats.activeListings}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-[#F7F7F7]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3B3B3B]" />
              <Input
                placeholder="Search brokers by name, phone, agency, or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Dormant">Dormant</SelectItem>
                <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportCSV} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {brokersLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredBrokers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-[#F7F7F7]">
            <Users className="w-12 h-12 text-[#3B3B3B] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#111111] mb-2">No brokers found</h3>
            <p className="text-[#3B3B3B]">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBrokers.map((broker) => (
              <motion.div
                key={broker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border-2 border-[#F7F7F7] hover:border-[#FFD300]/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#FFD300]/20 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#FFD300]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-[#111111]">{broker.name}</h3>
                        {broker.verified && (
                          <Badge className="bg-green-500/20 text-green-700 border-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {broker.custom_id && (
                        <p className="text-xs text-[#3B3B3B]/60 font-mono mb-2">{broker.custom_id}</p>
                      )}
                      {broker.agency_name && (
                        <p className="text-sm text-[#3B3B3B] mb-2">{broker.agency_name}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {broker.status}
                        </Badge>
                        {broker.response_time && broker.response_time !== "Unknown" && (
                          <Badge variant="outline" className="text-xs">
                            {broker.response_time} Response
                          </Badge>
                        )}
                        {broker.reliability_rating && (
                          <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300] text-xs">
                            <Star className="w-3 h-3 mr-1" fill="currentColor" />
                            {broker.reliability_rating}/5
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedBroker(broker);
                      setEditModalOpen(true);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-[#3B3B3B]/60 mb-1">Contact</p>
                    <div className="flex items-center gap-1 text-sm text-[#111111]">
                      <Phone className="w-3 h-3" />
                      {broker.phone}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#3B3B3B]/60 mb-1">Total Listings</p>
                    <p className="text-sm font-bold text-[#111111]">{broker.total_listings_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#3B3B3B]/60 mb-1">Active Listings</p>
                    <p className="text-sm font-bold text-green-600">{broker.active_listings_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#3B3B3B]/60 mb-1">Last Activity</p>
                    <p className="text-sm text-[#111111]">
                      {broker.last_activity ? format(new Date(broker.last_activity), "MMM dd, yyyy") : "Never"}
                    </p>
                  </div>
                </div>

                {broker.areas_covered && broker.areas_covered.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-[#3B3B3B]/60 mb-2">Areas Covered</p>
                    <div className="flex flex-wrap gap-2">
                      {broker.areas_covered.map((area, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {broker.notes && (
                  <div className="mb-4 p-3 bg-[#F7F7F7] rounded-xl">
                    <p className="text-xs text-[#3B3B3B]/60 mb-1">Notes</p>
                    <p className="text-sm text-[#111111]">{broker.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleWhatsApp(broker)}
                    className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  {(broker.total_listings_count || 0) > 0 && (
                    <Button
                      onClick={() => handleViewListings(broker)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View {broker.active_listings_count || broker.total_listings_count} Listings
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BrokerEditModal />
    </div>
  );
}
