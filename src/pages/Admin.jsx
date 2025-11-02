import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Users, Building2, MessageCircle, Phone, Mail,
  Star, TrendingUp, Search, Filter, Eye,
  AlertCircle, CheckCircle2, XCircle, Edit2,
  Download, MapPin, BarChart3, BookOpen, Sparkles, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("brokers");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch brokers
  const { data: brokers = [], isLoading: brokersLoading } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => base44.entities.Broker.list('-last_activity'),
    initialData: [],
  });

  // Fetch properties to calculate broker stats
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list(),
    initialData: [],
  });

  // Fetch requirements
  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    initialData: [],
  });

  // Update broker mutation
  const updateBrokerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Broker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      setEditModalOpen(false);
      setSelectedBroker(null);
    },
  });

  // Filter brokers
  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = !searchQuery || 
      broker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.phone?.includes(searchQuery) ||
      broker.agency_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.areas_covered?.some(area => area.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || broker.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: brokers.length,
    active: brokers.filter(b => b.status === "Active").length,
    verified: brokers.filter(b => b.verified).length,
    blacklisted: brokers.filter(b => b.status === "Blacklisted").length,
    totalListings: brokers.reduce((sum, b) => sum + (b.total_listings_count || 0), 0),
    activeListings: brokers.reduce((sum, b) => sum + (b.active_listings_count || 0), 0),
  };

  // Top brokers by volume
  const topBrokers = [...brokers]
    .sort((a, b) => (b.total_listings_count || 0) - (a.total_listings_count || 0))
    .slice(0, 10);

  // Brokers by area
  const brokersByArea = brokers.reduce((acc, broker) => {
    broker.areas_covered?.forEach(area => {
      acc[area] = (acc[area] || 0) + 1;
    });
    return acc;
  }, {});

  const topAreas = Object.entries(brokersByArea)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const handleWhatsApp = (broker) => {
    const message = `Hi ${broker.name}, this is Chariot Realty. Can we discuss current property listings?`;
    window.open(`https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleViewListings = (broker) => {
    window.location.href = `/admin/properties?broker=${broker.id}`;
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

  // Render different tab content
  const renderTabContent = () => {
    switch(activeTab) {
      case "brokers":
        return <BrokersTab />;
      case "requirements":
        return <RequirementsTab />;
      case "analytics":
        return <AnalyticsTab />;
      case "content":
        return <ContentTab />;
      default:
        return <BrokersTab />;
    }
  };

  // Brokers Tab Component
  const BrokersTab = () => (
    <div>
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
  );

  // Requirements Tab Component
  const RequirementsTab = () => (
    <div>
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
        <div className="space-y-4">
          {requirements.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border-2 border-[#F7F7F7] hover:border-[#FFD300]/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-[#111111]">{req.client_name}</h3>
                    <Badge className={
                      req.status === "Active" ? "bg-green-500/20 text-green-700 border-green-500" :
                      req.status === "Matched" ? "bg-blue-500/20 text-blue-700 border-blue-500" :
                      req.status === "Closed" ? "bg-gray-500/20 text-gray-700 border-gray-500" :
                      "bg-orange-500/20 text-orange-700 border-orange-500"
                    }>
                      {req.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#3B3B3B]">
                    {req.client_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {req.client_phone}
                      </span>
                    )}
                    {req.client_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {req.client_email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-[#3B3B3B]/60 mb-1">Type</p>
                  <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300]">
                    {req.listing_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-[#3B3B3B]/60 mb-1">BHK Preference</p>
                  <p className="text-sm font-bold text-[#111111]">
                    {req.bhk_preference?.join(", ") || "Any"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#3B3B3B]/60 mb-1">Budget</p>
                  <p className="text-sm font-bold text-[#111111]">
                    ₹{req.budget_min || 0}{req.budget_unit === "crores" ? " Cr" : "L"} - 
                    ₹{req.budget_max || 0}{req.budget_unit === "crores" ? " Cr" : "L"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#3B3B3B]/60 mb-1">Created</p>
                  <p className="text-sm text-[#111111]">
                    {format(new Date(req.created_date), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>

              {req.preferred_locations && req.preferred_locations.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-[#3B3B3B]/60 mb-2">Preferred Locations</p>
                  <div className="flex flex-wrap gap-2">
                    {req.preferred_locations.map((loc, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4 p-3 bg-[#F7F7F7] rounded-xl">
                <p className="text-xs text-[#3B3B3B]/60 mb-2">Preferences</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {req.furnishing_preference && req.furnishing_preference !== "Any" && (
                    <Badge variant="outline">{req.furnishing_preference}</Badge>
                  )}
                  {req.veg_nonveg && (
                    <Badge variant="outline">{req.veg_nonveg}</Badge>
                  )}
                  {req.parking_required && (
                    <Badge variant="outline">Parking Required</Badge>
                  )}
                  {req.possession_timeline && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {req.possession_timeline}
                    </Badge>
                  )}
                </div>
              </div>

              {req.amenities_required && req.amenities_required.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-[#3B3B3B]/60 mb-2">Required Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {req.amenities_required.map((amenity, idx) => (
                      <Badge key={idx} className="bg-amber-500/20 text-amber-900 border-amber-500 text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {req.notes && (
                <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Notes</p>
                  <p className="text-sm text-[#111111]">{req.notes}</p>
                </div>
              )}

              {req.source_text && (
                <div className="mb-4 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">Original Message</p>
                  <p className="text-sm text-[#111111] italic">{req.source_text}</p>
                </div>
              )}

              <div className="flex gap-2">
                {req.client_phone && (
                  <Button
                    onClick={() => {
                      const message = `Hi ${req.client_name}, this is Chariot Realty. We have some properties matching your requirement for ${req.bhk_preference?.join("/")} in ${req.preferred_locations?.join("/")}. Can we share details?`;
                      window.open(`https://wa.me/${req.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp Client
                  </Button>
                )}
                <Button
                  onClick={() => {
                    const searchParams = new URLSearchParams();
                    if (req.bhk_preference?.[0]) searchParams.set('bhk', req.bhk_preference[0]);
                    if (req.listing_type) searchParams.set('listingType', req.listing_type);
                    if (req.preferred_locations?.[0]) searchParams.set('search', req.preferred_locations[0]);
                    window.location.href = createPageUrl("SmartFeed") + "?" + searchParams.toString();
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Find Matches
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // Analytics Tab Component
  const AnalyticsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white rounded-2xl p-6 border-2 border-[#F7F7F7]">
        <h3 className="text-lg font-bold text-[#111111] mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#FFD300]" />
          Top 10 Brokers by Volume
        </h3>
        <div className="space-y-3">
          {topBrokers.map((broker, idx) => (
            <div key={broker.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FFD300]/20 rounded-lg flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">{broker.name}</p>
                  {broker.agency_name && (
                    <p className="text-xs text-[#3B3B3B]/60">{broker.agency_name}</p>
                  )}
                </div>
              </div>
              <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300]">
                {broker.total_listings_count || 0} listings
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border-2 border-[#F7F7F7]">
        <h3 className="text-lg font-bold text-[#111111] mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#FFD300]" />
          Top 5 Areas by Broker Activity
        </h3>
        <div className="space-y-4">
          {topAreas.map(([area, count]) => (
            <div key={area}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#111111]">{area}</p>
                <p className="text-sm text-[#3B3B3B]">{count} brokers</p>
              </div>
              <div className="w-full bg-[#F7F7F7] rounded-full h-2">
                <div
                  className="bg-[#FFD300] h-2 rounded-full"
                  style={{ width: `${(count / topAreas[0][1]) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Content Tab Component
  const ContentTab = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl p-8 border-2 border-[#F7F7F7] mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#1a1816]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#111111]">AI Blog Generator</h2>
            <p className="text-sm text-[#3B3B3B]">Create SEO-optimized content for Mumbai real estate</p>
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 mb-6 border border-amber-200">
          <p className="text-sm text-amber-900 font-medium mb-2">📱 Generate via WhatsApp</p>
          <p className="text-sm text-amber-800 mb-4">
            Message the Blog Generator agent on WhatsApp to create content automatically.
          </p>
          <a 
            href={`https://wa.me/919819471310?text=${encodeURIComponent("Hi! I want to generate a blog post")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-[#25D366] hover:bg-[#20BD5A] text-white w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              Open WhatsApp Blog Generator
            </Button>
          </a>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#111111] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Content Categories
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Neighborhood Guide",
                description: "Deep dive into specific Mumbai localities",
                example: "Living in Pali Hill: The Quiet Heart of Bandra",
                prompt: "Write neighborhood guide for [Area Name]"
              },
              {
                title: "Expat Series",
                description: "Practical guides for newcomers",
                example: "Understanding Leave & License Agreements",
                prompt: "Write expat guide about [Topic]"
              },
              {
                title: "Market Insights",
                description: "Data-driven Mumbai real estate trends",
                example: "3BHK Rentals in Bandra See 12% Spike",
                prompt: "Generate market insights for [Area/Trend]"
              },
              {
                title: "Rental & Legal",
                description: "Simplified legal explanations",
                example: "Security Deposits: How Much & When?",
                prompt: "Explain [Legal Topic] in simple terms"
              }
            ].map((category, idx) => (
              <div key={idx} className="bg-stone-50 rounded-2xl p-5 border border-stone-200">
                <h4 className="font-bold text-[#111111] mb-2">{category.title}</h4>
                <p className="text-sm text-[#3B3B3B] mb-3">{category.description}</p>
                <p className="text-xs text-stone-500 mb-3 italic">Example: "{category.example}"</p>
                <div className="bg-white rounded-xl p-3 border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">WhatsApp Prompt:</p>
                  <code className="text-xs font-mono text-[#111111]">{category.prompt}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl border border-stone-200">
          <h3 className="text-lg font-bold text-[#111111] mb-4">How It Works</h3>
          <ol className="space-y-3 text-sm text-[#3B3B3B]">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#d4af37] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">1</span>
              <span>Message the WhatsApp agent with your request (e.g., "Write neighborhood guide for Juhu")</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#d4af37] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">2</span>
              <span>AI researches current data and generates authentic, SEO-optimized content</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#d4af37] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">3</span>
              <span>Blog post is created with Draft status - review before publishing</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#d4af37] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">4</span>
              <span>Go to Insights page to review, edit, and publish the content</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111111] mb-2">Admin Dashboard</h1>
          <p className="text-[#3B3B3B]">Broker intelligence & property management</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Vertical Tabs Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border-2 border-[#F7F7F7] p-2 lg:sticky lg:top-24">
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("brokers")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-left ${
                    activeTab === "brokers"
                      ? "bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#1a1816] shadow-sm"
                      : "text-[#3B3B3B] hover:bg-[#F7F7F7]"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Brokers</span>
                </button>
                
                <button
                  onClick={() => setActiveTab("requirements")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-left ${
                    activeTab === "requirements"
                      ? "bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#1a1816] shadow-sm"
                      : "text-[#3B3B3B] hover:bg-[#F7F7F7]"
                  }`}
                >
                  <Search className="w-5 h-5" />
                  <span>Requirements</span>
                </button>
                
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-left ${
                    activeTab === "analytics"
                      ? "bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#1a1816] shadow-sm"
                      : "text-[#3B3B3B] hover:bg-[#F7F7F7]"
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Analytics</span>
                </button>
                
                <button
                  onClick={() => setActiveTab("content")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-left ${
                    activeTab === "content"
                      ? "bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#1a1816] shadow-sm"
                      : "text-[#3B3B3B] hover:bg-[#F7F7F7]"
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Blog Generator</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>

      <BrokerEditModal />
    </div>
  );
}