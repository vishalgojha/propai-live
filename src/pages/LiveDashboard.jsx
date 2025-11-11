
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Activity, TrendingUp, Users, Home, FileText, Eye, MessageCircle,
  RefreshCw, Zap, Clock, MapPin, Star, ArrowUp, ArrowDown, Minus,
  Calendar, DollarSign, Building2, Target, Shield, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { toast, Toaster } from "sonner";
import RealtimeActivityFeed from "../components/admin/RealtimeActivityFeed";

export default function LiveDashboard() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [countdown, setCountdown] = useState(30);

  // Check authorization
  useEffect(() => {
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

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Real-time data queries (30s refresh)
  const { data: properties = [], refetch: refetchProperties } = useQuery({
    queryKey: ['live-properties'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    enabled: isAuthorized,
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const { data: brokers = [], refetch: refetchBrokers } = useQuery({
    queryKey: ['live-brokers'],
    queryFn: () => base44.entities.Broker.list('-last_activity'),
    enabled: isAuthorized,
    staleTime: 0,
    refetchInterval: 30000,
  });

  const { data: requirements = [], refetch: refetchRequirements } = useQuery({
    queryKey: ['live-requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    enabled: isAuthorized,
    staleTime: 0,
    refetchInterval: 30000,
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['live-interactions'],
    queryFn: () => base44.entities.PropertyInteraction.list('-created_date'),
    enabled: isAuthorized,
    staleTime: 0,
    refetchInterval: 30000,
  });

  // Manual refresh
  const handleManualRefresh = async () => {
    setLastUpdate(new Date());
    setCountdown(30);
    await Promise.all([
      refetchProperties(),
      refetchBrokers(),
      refetchRequirements(),
    ]);
    toast.success("Dashboard refreshed!", { duration: 2000 });
  };

  // Calculate real-time metrics
  const metrics = useMemo(() => {
    const activeProperties = properties.filter(p => p.status === "Active" && !p.is_duplicate);
    const activeBrokers = brokers.filter(b => b.status === "Active");
    const activeRequirements = requirements.filter(r => r.status === "Active");

    // Today's stats
    const today = startOfDay(new Date());
    const todayProperties = properties.filter(p => 
      new Date(p.created_date) >= today
    );
    const todayInteractions = interactions.filter(i => 
      new Date(i.created_date) >= today
    );

    // Yesterday's stats for comparison
    const yesterday = startOfDay(subDays(new Date(), 1));
    const yesterdayEnd = endOfDay(subDays(new Date(), 1));
    const yesterdayProperties = properties.filter(p => {
      const date = new Date(p.created_date);
      return date >= yesterday && date <= yesterdayEnd;
    });

    // Calculate trends
    const propertyTrend = yesterdayProperties.length > 0
      ? ((todayProperties.length - yesterdayProperties.length) / yesterdayProperties.length) * 100
      : 0;

    // Total views and inquiries
    const totalViews = properties.reduce((sum, p) => sum + (p.views_count || 0), 0);
    const totalInquiries = interactions.filter(i => i.interaction_type === 'whatsapp' || i.interaction_type === 'inquiry').length;

    // High trust brokers
    const highTrustBrokers = brokers.filter(b => (b.trust_score || 0) >= 85).length;

    // Properties with photos
    const propertiesWithPhotos = properties.filter(p => p.images && p.images.length > 0).length;
    const photoCompletionRate = properties.length > 0 ? (propertiesWithPhotos / properties.length) * 100 : 0;

    return {
      activeProperties: activeProperties.length,
      totalProperties: properties.length,
      activeBrokers: activeBrokers.length,
      totalBrokers: brokers.length,
      activeRequirements: activeRequirements.length,
      totalRequirements: requirements.length,
      todayProperties: todayProperties.length,
      todayInteractions: todayInteractions.length,
      propertyTrend,
      totalViews,
      totalInquiries,
      highTrustBrokers,
      photoCompletionRate,
    };
  }, [properties, brokers, requirements, interactions]);

  // Last 7 days activity
  const weeklyActivity = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayProperties = properties.filter(p => {
        const created = new Date(p.created_date);
        return created >= dayStart && created <= dayEnd;
      });

      const dayInteractions = interactions.filter(i => {
        const created = new Date(i.created_date);
        return created >= dayStart && created <= dayEnd;
      });

      days.push({
        date: format(date, 'EEE'),
        properties: dayProperties.length,
        interactions: dayInteractions.length,
      });
    }
    return days;
  }, [properties, interactions]);

  // Top locations
  const topLocations = useMemo(() => {
    const locationCounts = {};
    properties.forEach(p => {
      if (p.location) {
        locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
      }
    });

    return Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [properties]);

  // Listing type breakdown
  const listingTypeBreakdown = useMemo(() => {
    const types = { Sale: 0, Rent: 0, Lease: 0, 'Pre Leased': 0 };
    properties.forEach(p => {
      if (p.listing_type && types.hasOwnProperty(p.listing_type)) {
        types[p.listing_type]++;
      }
    });

    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [properties]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-32">
      <Toaster position="top-center" richColors closeButton />

      {/* Header */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Live Dashboard</h1>
                <p className="text-xs text-slate-500">Real-time platform analytics</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto-refresh countdown */}
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{countdown}s</span>
              </div>

              {/* Manual refresh */}
              <Button
                onClick={handleManualRefresh}
                size="sm"
                variant="outline"
                className="border-purple-300 hover:bg-purple-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Now
              </Button>

              {/* Back to Admin */}
              <Button
                onClick={() => navigate(createPageUrl("Admin"))}
                size="sm"
                variant="outline"
              >
                Back to Admin
              </Button>
            </div>
          </div>

          {/* Last update */}
          <p className="text-xs text-slate-500 mt-2">
            Last updated: {format(lastUpdate, "MMM dd, yyyy 'at' HH:mm:ss")}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Key Metrics - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Properties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-blue-600 text-white">
                  {metrics.todayProperties} today
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {metrics.activeProperties}
              </p>
              <p className="text-sm text-slate-600 mb-3">Active Properties</p>
              <div className="flex items-center gap-2 text-xs">
                {metrics.propertyTrend > 0 ? (
                  <>
                    <ArrowUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-semibold">
                      +{metrics.propertyTrend.toFixed(1)}%
                    </span>
                  </>
                ) : metrics.propertyTrend < 0 ? (
                  <>
                    <ArrowDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-600 font-semibold">
                      {metrics.propertyTrend.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <Minus className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-400">No change</span>
                  </>
                )}
                <span className="text-slate-500">vs yesterday</span>
              </div>
            </Card>
          </motion.div>

          {/* Active Brokers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-amber-500 text-white">
                  <Shield className="w-3 h-3 mr-1" />
                  {metrics.highTrustBrokers} trusted
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {metrics.activeBrokers}
              </p>
              <p className="text-sm text-slate-600 mb-3">Active Brokers</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Star className="w-3 h-3 text-amber-500" />
                {((metrics.highTrustBrokers / metrics.totalBrokers) * 100).toFixed(0)}% high trust
              </div>
            </Card>
          </motion.div>

          {/* Active Requirements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-emerald-600 text-white">
                  Active
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {metrics.activeRequirements}
              </p>
              <p className="text-sm text-slate-600 mb-3">Client Requirements</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileText className="w-3 h-3" />
                {metrics.totalRequirements} total
              </div>
            </Card>
          </motion.div>

          {/* Total Interactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-orange-600 text-white">
                  {metrics.todayInteractions} today
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {metrics.totalInquiries}
              </p>
              <p className="text-sm text-slate-600 mb-3">Total Inquiries</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Eye className="w-3 h-3" />
                {metrics.totalViews.toLocaleString()} views
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Activity Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              7-Day Activity Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyActivity}>
                <defs>
                  <linearGradient id="colorProperties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="properties" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorProperties)" 
                  name="Properties"
                />
                <Area 
                  type="monotone" 
                  dataKey="interactions" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorInteractions)"
                  name="Interactions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Listing Type Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Listing Type Distribution
            </h3>
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="50%" height={250}>
                <PieChart>
                  <Pie
                    data={listingTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {listingTypeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {listingTypeBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-sm text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Locations */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Top Locations
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topLocations} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Real-Time Activity Feed Component */}
          <Card className="p-6">
            <RealtimeActivityFeed />
          </Card>
        </div>

        {/* System Health Indicators */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            System Health
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-slate-600 mb-1">Data Quality</p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics.photoCompletionRate.toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Photos uploaded</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-slate-600 mb-1">Active Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {((metrics.activeProperties / metrics.totalProperties) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Properties active</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-sm text-slate-600 mb-1">Broker Quality</p>
              <p className="text-2xl font-bold text-purple-600">
                {((metrics.highTrustBrokers / metrics.totalBrokers) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">High trust score</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl">
              <p className="text-sm text-slate-600 mb-1">Engagement</p>
              <p className="text-2xl font-bold text-amber-600">
                {(metrics.totalViews / metrics.totalProperties).toFixed(1)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Avg views/property</p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
