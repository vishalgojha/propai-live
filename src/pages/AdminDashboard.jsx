
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3, TrendingUp, Users, Package, MessageCircle, Eye,
  Star, Zap, Target, Activity, ArrowUp, ArrowDown, Trophy,
  MapPin, Home, Calendar, Clock, Building2, AlertCircle, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

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
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch all data
  const { data: properties = [] } = useQuery({
    queryKey: ['admin-analytics-properties'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    enabled: isAuthorized,
    initialData: []
  });

  const { data: brokers = [] } = useQuery({
    queryKey: ['admin-analytics-brokers'],
    queryFn: () => base44.entities.Broker.list('-last_activity'),
    enabled: isAuthorized,
    initialData: []
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['admin-analytics-requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    enabled: isAuthorized,
    initialData: []
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['admin-analytics-interactions'],
    queryFn: () => base44.entities.PropertyInteraction.list('-created_date'),
    enabled: isAuthorized,
    initialData: []
  });

  // ✅ NEW: Fetch developers
  const { data: developers = [] } = useQuery({
    queryKey: ['developers'],
    queryFn: () => base44.entities.Developer.list(),
    initialData: [],
    enabled: isAuthorized,
  });

  // ✅ NEW: Fetch buildings
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(),
    initialData: [],
    enabled: isAuthorized,
  });

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate;

    switch(timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      default:
        startDate = subDays(now, 365);
    }

    return { startDate, endDate: now };
  }, [timeRange]);

  // Platform metrics
  const platformMetrics = useMemo(() => {
    const activeProps = properties.filter(p => p.status === 'Active' && !p.is_duplicate);
    const activeBrokers = brokers.filter(b => b.status === 'Active');
    const activeReqs = requirements.filter(r => r.status === 'Active');

    const filteredInteractions = interactions.filter(i =>
      new Date(i.created_date) >= dateRange.startDate
    );

    const totalViews = filteredInteractions.filter(i => i.interaction_type === 'view').length;
    const totalInquiries = filteredInteractions.filter(i =>
      i.interaction_type === 'inquiry' || i.interaction_type === 'whatsapp' || i.interaction_type === 'call'
    ).length;

    // Previous period comparison
    const previousPeriodStart = subDays(dateRange.startDate, dateRange.endDate.getTime() - dateRange.startDate.getTime());
    const previousInteractions = interactions.filter(i => {
      const date = new Date(i.created_date);
      return date >= previousPeriodStart && date < dateRange.startDate;
    });

    const previousViews = previousInteractions.filter(i => i.interaction_type === 'view').length;
    const viewsGrowth = previousViews > 0
      ? Math.round(((totalViews - previousViews) / previousViews) * 100)
      : totalViews > 0 ? 100 : 0;

    return {
      activeListings: activeProps.length,
      activeBrokers: activeBrokers.length,
      activeRequirements: activeReqs.length,
      totalViews,
      totalInquiries,
      viewsGrowth,
      conversionRate: totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : 0,
      avgViewsPerListing: activeProps.length > 0 ? Math.round(totalViews / activeProps.length) : 0
    };
  }, [properties, brokers, requirements, interactions, dateRange]);

  // Daily platform activity
  const dailyPlatformActivity = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayInteractions = interactions.filter(i =>
        format(new Date(i.created_date), 'yyyy-MM-dd') === dayStr
      );

      const dayProps = properties.filter(p =>
        format(new Date(p.created_date), 'yyyy-MM-dd') === dayStr
      );

      return {
        date: format(day, 'MMM dd'),
        views: dayInteractions.filter(i => i.interaction_type === 'view').length,
        inquiries: dayInteractions.filter(i =>
          i.interaction_type === 'inquiry' || i.interaction_type === 'whatsapp' || i.interaction_type === 'call'
        ).length,
        newListings: dayProps.length
      };
    });
  }, [interactions, properties, dateRange]);

  // Top performing brokers
  const topBrokers = useMemo(() => {
    const filteredInteractions = interactions.filter(i =>
      new Date(i.created_date) >= dateRange.startDate
    );

    return brokers
      .filter(b => b.status === 'Active')
      .map(broker => {
        const brokerProps = properties.filter(p =>
          p.broker_id === broker.id && p.status === 'Active' && !p.is_duplicate
        );
        const brokerInteractions = filteredInteractions.filter(i => i.broker_id === broker.id);
        const views = brokerInteractions.filter(i => i.interaction_type === 'view').length;
        const inquiries = brokerInteractions.filter(i =>
          i.interaction_type === 'inquiry' || i.interaction_type === 'whatsapp' || i.interaction_type === 'call'
        ).length;

        return {
          id: broker.id,
          name: broker.name,
          trustScore: broker.trust_score || 50,
          activeListings: brokerProps.length,
          views,
          inquiries,
          conversionRate: views > 0 ? ((inquiries / views) * 100).toFixed(1) : 0
        };
      })
      .filter(b => b.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [brokers, properties, interactions, dateRange]);

  // Top performing properties
  const topProperties = useMemo(() => {
    const filteredInteractions = interactions.filter(i =>
      new Date(i.created_date) >= dateRange.startDate
    );

    return properties
      .filter(p => p.status === 'Active' && !p.is_duplicate)
      .map(property => {
        const propInteractions = filteredInteractions.filter(i => i.property_id === property.id);
        const views = propInteractions.filter(i => i.interaction_type === 'view').length;
        const inquiries = propInteractions.filter(i =>
          i.interaction_type === 'inquiry' || i.interaction_type === 'whatsapp' || i.interaction_type === 'call'
        ).length;

        return {
          id: property.id,
          title: property.ai_title || `${property.bhk} in ${property.location}`,
          location: property.location,
          bhk: property.bhk,
          price: `₹${property.price}${property.price_unit === 'crores' ? ' Cr' : 'L'}`,
          views,
          inquiries,
          conversionRate: views > 0 ? ((inquiries / views) * 100).toFixed(1) : 0
        };
      })
      .filter(p => p.views > 0)
      .sort((a, b) => b.inquiries - a.inquiries)
      .slice(0, 10);
  }, [properties, interactions, dateRange]);

  // Location popularity
  const locationStats = useMemo(() => {
    const locationMap = {};

    properties.forEach(prop => {
      if (prop.location && prop.status === 'Active' && !prop.is_duplicate) {
        if (!locationMap[prop.location]) {
          locationMap[prop.location] = {
            location: prop.location,
            listings: 0,
            views: 0,
            inquiries: 0
          };
        }
        locationMap[prop.location].listings++;
      }
    });

    interactions
      .filter(i => new Date(i.created_date) >= dateRange.startDate)
      .forEach(interaction => {
        const property = properties.find(p => p.id === interaction.property_id);
        if (property && property.location && locationMap[property.location]) {
          if (interaction.interaction_type === 'view') {
            locationMap[property.location].views++;
          } else if (['inquiry', 'whatsapp', 'call'].includes(interaction.interaction_type)) {
            locationMap[property.location].inquiries++;
          }
        }
      });

    return Object.values(locationMap)
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [properties, interactions, dateRange]);

  // Lead sources breakdown
  const leadSourceData = useMemo(() => {
    const sources = {
      'SmartFeed': interactions.filter(i => i.source === 'smartfeed').length,
      'Direct': interactions.filter(i => i.source === 'direct').length,
      'Search': interactions.filter(i => i.source === 'search').length,
      'Featured': interactions.filter(i => i.source === 'featured').length
    };

    return Object.entries(sources)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [interactions]);

  // ✅ NEW: Developer Analytics
  const developerMetrics = useMemo(() => {
    if (developers.length === 0 && buildings.length === 0) return null;

    // Top developers by buildings tracked
    const developerBuildingCounts = developers.map(dev => ({
      developer: dev,
      buildingCount: buildings.filter(b => b.developer_id === dev.id).length,
      activeListings: buildings
        .filter(b => b.developer_id === dev.id)
        .reduce((sum, b) => sum + (b.active_listings || 0), 0)
    })).filter(d => d.buildingCount > 0)
      .sort((a, b) => b.buildingCount - a.buildingCount);

    // Market share by tier
    const tierDistribution = {
      tier1: developers.filter(d => d.tier === 'Tier 1').length,
      tier2: developers.filter(d => d.tier === 'Tier 2').length,
      tier3: developers.filter(d => d.tier === 'Tier 3').length,
    };

    // Sustainable developers
    const sustainableDevelopers = developers.filter(d => d.sustainability_focus).length;

    return {
      totalDevelopers: developers.length,
      topDevelopers: developerBuildingCounts.slice(0, 5),
      tierDistribution,
      sustainableDevelopers,
      avgReputation: developers.reduce((sum, d) => sum + (d.reputation_score || 0), 0) / developers.length || 0,
      buildingsLinked: buildings.filter(b => b.developer_id).length,
      buildingsUnlinked: buildings.filter(b => !b.developer_id && b.developer_name).length
    };
  }, [developers, buildings]);

  const COLORS = ['#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Platform Analytics</h1>
              <p className="text-slate-600">Complete overview of PropAI Live performance</p>
            </div>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Platform Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-5 bg-white border-2 border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-sky-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{platformMetrics.activeListings}</p>
              <p className="text-sm text-slate-600">Active Listings</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-5 bg-white border-2 border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <Badge className={`${platformMetrics.viewsGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {platformMetrics.viewsGrowth >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                  {Math.abs(platformMetrics.viewsGrowth)}%
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{platformMetrics.totalViews.toLocaleString()}</p>
              <p className="text-sm text-slate-600">Total Views</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-5 bg-white border-2 border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <Badge className="bg-green-100 text-green-700">{platformMetrics.conversionRate}%</Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{platformMetrics.totalInquiries.toLocaleString()}</p>
              <p className="text-sm text-slate-600">Total Inquiries</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-5 bg-white border-2 border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{platformMetrics.activeBrokers}</p>
              <p className="text-sm text-slate-600">Active Brokers</p>
            </Card>
          </motion.div>
        </div>

        {/* ✅ NEW: Developer Intelligence Section */}
        {developerMetrics && (
          <div className="mb-8 bg-white rounded-3xl p-6 border-2 border-purple-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-purple-600" />
                Developer Intelligence
              </h2>
              <Button
                onClick={() => navigate(createPageUrl("DeveloperDirectory"))}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700"
              >
                View Directory
              </Button>
            </div>

            {/* Developer Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-4 bg-purple-50 rounded-2xl">
                <p className="text-2xl font-bold text-purple-700">{developerMetrics.totalDevelopers}</p>
                <p className="text-xs text-slate-600 mt-1">Total Developers</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-2xl">
                <p className="text-2xl font-bold text-amber-700">{developerMetrics.tierDistribution.tier1}</p>
                <p className="text-xs text-slate-600 mt-1">Tier 1 (Mega)</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-2xl">
                <p className="text-2xl font-bold text-blue-700">{developerMetrics.tierDistribution.tier2}</p>
                <p className="text-xs text-slate-600 mt-1">Tier 2 (Regional)</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-2xl">
                <p className="text-2xl font-bold text-emerald-700">{developerMetrics.tierDistribution.tier3}</p>
                <p className="text-xs text-slate-600 mt-1">Tier 3 (Emerging)</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-2xl">
                <p className="text-2xl font-bold text-green-700">{developerMetrics.sustainableDevelopers}</p>
                <p className="text-xs text-slate-600 mt-1">Green Certified</p>
              </div>
            </div>

            {/* Building Linkage Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">Buildings Linked</p>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-700">{developerMetrics.buildingsLinked}</p>
                <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full"
                    style={{ width: `${(developerMetrics.buildingsLinked / (buildings.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
              {developerMetrics.buildingsUnlinked > 0 && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700">Needs Linking</p>
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-orange-700">{developerMetrics.buildingsUnlinked}</p>
                  <Button
                    onClick={() => navigate(createPageUrl("Admin"))}
                    size="sm"
                    className="mt-2 w-full bg-orange-600 text-white text-xs"
                  >
                    Run Backfill
                  </Button>
                </div>
              )}
            </div>

            {/* Top Developers Table */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">
                Top Developers by Activity
              </h3>
              <div className="space-y-2">
                {developerMetrics.topDevelopers.map((item, idx) => (
                  <div key={item.developer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl("DeveloperProfile") + `?id=${item.developer.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-700">#{idx + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.developer.name}</p>
                        <p className="text-xs text-slate-500">{item.developer.tier} • {item.developer.market_segment}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-700">{item.buildingCount}</p>
                      <p className="text-xs text-slate-500">{item.activeListings} active listings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Platform Activity Chart */}
        <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            Platform Activity
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={dailyPlatformActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="views" stackId="1" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.6} name="Views" />
              <Area type="monotone" dataKey="inquiries" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Inquiries" />
              <Area type="monotone" dataKey="newListings" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="New Listings" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Performers Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Brokers */}
          <Card className="p-6 bg-white border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-600" />
              Top Performing Brokers
            </h3>
            <div className="space-y-3">
              {topBrokers.slice(0, 5).map((broker, idx) => (
                <div key={broker.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl flex items-center justify-center font-bold text-white text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{broker.name}</p>
                    <p className="text-xs text-slate-500">{broker.activeListings} listings • {broker.views} views</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                    <Star className="w-3 h-3 mr-1" fill="currentColor" />
                    {broker.trustScore}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Location Popularity */}
          <Card className="p-6 bg-white border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-600" />
              Popular Locations
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={locationStats} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" style={{ fontSize: '11px' }} />
                <YAxis dataKey="location" type="category" width={100} stroke="#64748b" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey="views" fill="#0EA5E9" name="Views" />
                <Bar dataKey="inquiries" fill="#10B981" name="Inquiries" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Properties Table */}
        <Card className="p-6 bg-white border-2 border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Converting Properties
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Property</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Location</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Views</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Inquiries</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {topProperties.map((prop, idx) => (
                  <tr key={prop.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{prop.title}</p>
                        <p className="text-xs text-slate-500">{prop.price}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {prop.location}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center text-sm">{prop.views}</td>
                    <td className="py-3 px-4 text-center text-sm font-semibold text-green-600">{prop.inquiries}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge className="bg-green-100 text-green-700">
                        {prop.conversionRate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
