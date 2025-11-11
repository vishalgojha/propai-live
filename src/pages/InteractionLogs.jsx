import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle, Eye, ArrowLeft, Search, Filter, Download,
  Phone, Share2, Smartphone, Monitor, Tablet, Calendar,
  User, MapPin, Home, ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function InteractionLogs() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Check admin authorization
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
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
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch interactions
  const { data: interactions = [], isLoading: dataLoading } = useQuery({
    queryKey: ['interaction-logs'],
    queryFn: () => base44.entities.PropertyInteraction.list('-created_date'),
    enabled: isAuthorized,
    staleTime: 30000,
  });

  // Fetch properties for linking
  const { data: properties = [] } = useQuery({
    queryKey: ['properties-for-logs'],
    queryFn: () => base44.entities.Property.list(),
    enabled: isAuthorized,
    staleTime: 60000,
  });

  // Create property lookup
  const propertyMap = useMemo(() => {
    const map = {};
    properties.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [properties]);

  // Filter interactions
  const filteredInteractions = useMemo(() => {
    return interactions.filter(interaction => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const property = propertyMap[interaction.property_id];
        const matchesProperty = property?.building_name?.toLowerCase().includes(query) ||
                               property?.location?.toLowerCase().includes(query) ||
                               property?.custom_id?.toLowerCase().includes(query);
        const matchesUser = interaction.user_name?.toLowerCase().includes(query) ||
                           interaction.user_email?.toLowerCase().includes(query);
        
        if (!matchesProperty && !matchesUser) return false;
      }

      // Type filter
      if (typeFilter !== "all" && interaction.interaction_type !== typeFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== "all" && interaction.source !== sourceFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== "all") {
        const interactionDate = new Date(interaction.created_date);
        const today = new Date();
        const daysDiff = Math.floor((today - interactionDate) / (1000 * 60 * 60 * 24));

        if (dateFilter === "today" && daysDiff !== 0) return false;
        if (dateFilter === "week" && daysDiff > 7) return false;
        if (dateFilter === "month" && daysDiff > 30) return false;
      }

      return true;
    });
  }, [interactions, searchQuery, typeFilter, sourceFilter, dateFilter, propertyMap]);

  // Statistics
  const stats = useMemo(() => {
    const whatsappCount = interactions.filter(i => i.interaction_type === 'whatsapp').length;
    const viewCount = interactions.filter(i => i.interaction_type === 'view').length;
    const uniqueUsers = new Set(interactions.map(i => i.user_email || i.session_id)).size;
    const mobileCount = interactions.filter(i => i.device_type === 'mobile').length;

    return {
      whatsappCount,
      viewCount,
      uniqueUsers,
      mobilePercent: interactions.length > 0 ? (mobileCount / interactions.length) * 100 : 0
    };
  }, [interactions]);

  // Export to CSV
  const handleExport = () => {
    const csvData = filteredInteractions.map(interaction => {
      const property = propertyMap[interaction.property_id];
      return {
        Date: format(new Date(interaction.created_date), 'yyyy-MM-dd HH:mm:ss'),
        Type: interaction.interaction_type,
        User: interaction.user_name || 'Anonymous',
        Email: interaction.user_email || 'N/A',
        Property: property?.custom_id || interaction.property_id,
        Location: property?.location || 'N/A',
        Building: property?.building_name || 'N/A',
        Price: property ? `₹${property.price}${property.price_unit === 'crores' ? 'Cr' : 'L'}` : 'N/A',
        Device: interaction.device_type,
        Source: interaction.source,
        BrokerContact: interaction.metadata?.broker_contact || 'N/A',
        ContactedVia: interaction.metadata?.contacted_via || 'N/A'
      };
    });

    const csvHeaders = Object.keys(csvData[0] || {}).join(',');
    const csvRows = csvData.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csvContent = [csvHeaders, ...csvRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interaction-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'view': return <Eye className="w-4 h-4" />;
      case 'share': return <Share2 className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-medium">Loading interaction logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(createPageUrl("Admin"))}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Interaction Logs</h1>
                <p className="text-sm text-slate-500">WhatsApp contacts & property views</p>
              </div>
            </div>

            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.whatsappCount}</p>
                  <p className="text-xs text-slate-600">WhatsApp Contacts</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.viewCount}</p>
                  <p className="text-xs text-slate-600">Property Views</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.uniqueUsers}</p>
                  <p className="text-xs text-slate-600">Unique Users</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.mobilePercent.toFixed(0)}%</p>
                  <p className="text-xs text-slate-600">Mobile Traffic</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by property, user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="view">Views</SelectItem>
                <SelectItem value="call">Calls</SelectItem>
                <SelectItem value="share">Shares</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="smartfeed">SmartFeed</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="search">Search</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-slate-600 mb-4">
          Showing {filteredInteractions.length} of {interactions.length} interactions
        </p>

        {dataLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : filteredInteractions.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No interactions found</h3>
            <p className="text-slate-600">Try adjusting your filters</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredInteractions.map((interaction) => {
              const property = propertyMap[interaction.property_id];
              
              return (
                <Card key={interaction.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        interaction.interaction_type === 'whatsapp' ? 'bg-green-100 text-green-600' :
                        interaction.interaction_type === 'view' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {getInteractionIcon(interaction.interaction_type)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={
                            interaction.interaction_type === 'whatsapp' ? 'bg-green-600 text-white' :
                            interaction.interaction_type === 'view' ? 'bg-blue-600 text-white' :
                            'bg-slate-600 text-white'
                          }>
                            {interaction.interaction_type}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(interaction.created_date), { addSuffix: true })}
                          </span>
                        </div>

                        <h4 className="font-semibold text-slate-900 mb-1">
                          {interaction.user_name || 'Anonymous User'}
                          {interaction.user_email && (
                            <span className="text-sm text-slate-500 font-normal ml-2">
                              ({interaction.user_email})
                            </span>
                          )}
                        </h4>

                        {property && (
                          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Home className="w-3 h-3" />
                              {property.custom_id}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {property.location}
                            </span>
                            {property.building_name && (
                              <>
                                <span>•</span>
                                <span>{property.building_name}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>₹{property.price}{property.price_unit === 'crores' ? 'Cr' : 'L'}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            {getDeviceIcon(interaction.device_type)}
                            {interaction.device_type}
                          </span>
                          <span>•</span>
                          <span>Source: {interaction.source}</span>
                          {interaction.metadata?.contacted_via && (
                            <>
                              <span>•</span>
                              <span>Via: {interaction.metadata.contacted_via}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {property && (
                        <Button
                          onClick={() => navigate(createPageUrl("PropertyDetails") + `?id=${property.id}`)}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}