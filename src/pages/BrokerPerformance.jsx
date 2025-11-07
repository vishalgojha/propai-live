
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield, Users, TrendingUp, TrendingDown, ArrowLeft, Search,
  Star, Phone, MessageCircle, DollarSign, Home, BarChart3,
  Calendar, Award, AlertCircle, CheckCircle2, Package, Zap, Eye
} from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function BrokerPerformance() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("total_listings");
  const [sortOrder, setSortOrder] = useState("desc");
  const [trustFilter, setTrustFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("6months");

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
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: brokers = [], isLoading: brokersLoading } = useQuery({
    queryKey: ['brokers-performance'],
    queryFn: () => base44.entities.Broker.list('-last_activity'),
    initialData: [],
    enabled: isAuthorized,
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties-for-metrics'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    initialData: [],
    enabled: isAuthorized,
  });

  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ['requirements-for-metrics'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    initialData: [],
    enabled: isAuthorized,
  });

  // Calculate broker metrics
  const brokerMetrics = useMemo(() => {
    return brokers.map(broker => {
      const brokerProperties = properties.filter(p => p.broker_id === broker.id);
      const activeProperties = brokerProperties.filter(p => p.status === 'Active');
      const salesProperties = brokerProperties.filter(p => p.listing_type === 'Sale');
      const rentalProperties = brokerProperties.filter(p => p.listing_type === 'Rent');
      
      // NEW: Calculate AI matches generated for broker's requirements
      const brokerRequirements = requirements.filter(r => r.broker_id === broker.id);
      const totalAIMatches = brokerRequirements.reduce((sum, req) => {
        return sum + (req.ai_matched_properties?.length || 0);
      }, 0);

      // NEW: Get top 3 most viewed properties
      const top3Properties = [...brokerProperties]
        .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
        .slice(0, 3)
        .filter(p => p.views_count > 0); // Only include if they have views
      
      // Calculate average deal value (in lakhs)
      const totalValue = brokerProperties.reduce((sum, prop) => {
        const value = prop.price_unit === 'crores' ? prop.price * 100 : prop.price;
        return sum + value;
      }, 0);
      const avgDealValue = brokerProperties.length > 0 ? totalValue / brokerProperties.length : 0;

      // Calculate monthly activity (last 6 months)
      const monthlyActivity = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthProperties = brokerProperties.filter(p => {
          if (!p.created_date) return false;
          const propDate = new Date(p.created_date);
          return propDate >= monthStart && propDate <= monthEnd;
        });
        
        monthlyActivity.push({
          month: format(monthDate, 'MMM'),
          count: monthProperties.length
        });
      }

      // Calculate listing split
      const listingSplit = {
        sales: salesProperties.length,
        rentals: rentalProperties.length
      };

      return {
        ...broker,
        totalListings: brokerProperties.length,
        activeListings: activeProperties.length,
        salesCount: salesProperties.length,
        rentalsCount: rentalProperties.length,
        avgDealValue: avgDealValue.toFixed(2),
        monthlyActivity,
        listingSplit,
        lastActivityDays: broker.last_activity ? 
          Math.floor((new Date() - new Date(broker.last_activity)) / (1000 * 60 * 60 * 24)) : null,
        // NEW metrics
        totalAIMatches,
        requirementsCount: brokerRequirements.length,
        top3Properties
      };
    });
  }, [brokers, properties, requirements]);

  // Filter and sort brokers
  const filteredAndSortedBrokers = useMemo(() => {
    let filtered = brokerMetrics.filter(broker => {
      // Search filter
      const matchesSearch = !searchQuery ||
        broker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        broker.phone?.includes(searchQuery) ||
        broker.custom_id?.toLowerCase().includes(searchQuery.toLowerCase());

      // Trust score filter
      let matchesTrust = true;
      if (trustFilter === "high") matchesTrust = (broker.trust_score || 0) >= 75;
      else if (trustFilter === "medium") matchesTrust = (broker.trust_score || 0) >= 50 && (broker.trust_score || 0) < 75;
      else if (trustFilter === "low") matchesTrust = (broker.trust_score || 0) < 50;

      // Activity filter
      let matchesActivity = true;
      if (activityFilter === "active") matchesActivity = broker.status === "Active" && broker.lastActivityDays !== null && broker.lastActivityDays <= 30;
      else if (activityFilter === "dormant") matchesActivity = broker.status === "Dormant" || (broker.lastActivityDays !== null && broker.lastActivityDays > 90);

      return matchesSearch && matchesTrust && matchesActivity;
    });

    // Sort brokers
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case "total_listings":
          aVal = a.totalListings;
          bVal = b.totalListings;
          break;
        case "active_listings":
          aVal = a.activeListings;
          bVal = b.activeListings;
          break;
        case "trust_score":
          aVal = a.trust_score || 0;
          bVal = b.trust_score || 0;
          break;
        case "avg_deal_value":
          aVal = parseFloat(a.avgDealValue);
          bVal = parseFloat(b.avgDealValue);
          break;
        case "name":
          aVal = a.name?.toLowerCase() || "";
          bVal = b.name?.toLowerCase() || "";
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        default:
          aVal = a.totalListings;
          bVal = b.totalListings;
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [brokerMetrics, searchQuery, sortBy, sortOrder, trustFilter, activityFilter]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const total = brokerMetrics.length;
    const active = brokerMetrics.filter(b => b.status === "Active").length;
    const highTrust = brokerMetrics.filter(b => (b.trust_score || 0) >= 75).length;
    const totalListings = brokerMetrics.reduce((sum, b) => sum + b.totalListings, 0);
    const avgListingsPerBroker = total > 0 ? (totalListings / total).toFixed(1) : 0;

    return {
      totalBrokers: total,
      activeBrokers: active,
      highTrustBrokers: highTrust,
      totalListings,
      avgListingsPerBroker
    };
  }, [brokerMetrics]);

  // Top performers
  const topPerformers = useMemo(() => {
    return [...brokerMetrics]
      .sort((a, b) => b.totalListings - a.totalListings)
      .slice(0, 5);
  }, [brokerMetrics]);

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-medium">Loading broker performance...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(createPageUrl("Admin"))}
            variant="ghost"
            className="mb-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Broker Performance Analytics</h1>
              <p className="text-sm text-slate-600">Comprehensive metrics and insights</p>
            </div>
          </div>

          {/* Overall Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-slate-500 font-semibold uppercase">Total Brokers</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{overallStats.totalBrokers}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-xs text-slate-500 font-semibold uppercase">Active</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{overallStats.activeBrokers}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-slate-500 font-semibold uppercase">High Trust</p>
              </div>
              <p className="text-2xl font-bold text-amber-600">{overallStats.highTrustBrokers}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-slate-500 font-semibold uppercase">Total Listings</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{overallStats.totalListings}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <p className="text-xs text-slate-500 font-semibold uppercase">Avg/Broker</p>
              </div>
              <p className="text-2xl font-bold text-indigo-600">{overallStats.avgListingsPerBroker}</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search brokers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_listings">Total Listings</SelectItem>
                  <SelectItem value="active_listings">Active Listings</SelectItem>
                  <SelectItem value="trust_score">Trust Score</SelectItem>
                  <SelectItem value="avg_deal_value">Avg Deal Value</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Highest First</SelectItem>
                  <SelectItem value="asc">Lowest First</SelectItem>
                </SelectContent>
              </Select>

              <Select value={trustFilter} onValueChange={setTrustFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Trust Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trust Levels</SelectItem>
                  <SelectItem value="high">High (75+)</SelectItem>
                  <SelectItem value="medium">Medium (50-74)</SelectItem>
                  <SelectItem value="low">Low (&lt;50)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="active">Recently Active</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Showing {filteredAndSortedBrokers.length} of {brokerMetrics.length} brokers
            </div>
          </div>
        </div>

        {/* Top Performers Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Top 5 Performers (Total Listings)
            </h3>
            <div className="space-y-3">
              {topPerformers.map((broker, idx) => (
                <div key={broker.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{broker.name}</p>
                    <p className="text-xs text-slate-500">{broker.custom_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{broker.totalListings}</p>
                    <p className="text-xs text-slate-500">{broker.activeListings} active</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Broker Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: overallStats.activeBrokers },
                    { name: 'Dormant', value: overallStats.totalBrokers - overallStats.activeBrokers },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Broker Cards Grid */}
        {brokersLoading || propertiesLoading || requirementsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : filteredAndSortedBrokers.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No brokers found</h3>
            <p className="text-slate-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAndSortedBrokers.map((broker) => (
              <motion.div
                key={broker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
              >
                {/* Broker Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{broker.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {broker.custom_id}
                      </Badge>
                      <Badge className={
                        broker.status === "Active" ? "bg-green-500 text-white" :
                        broker.status === "Verified" ? "bg-blue-500 text-white" :
                        "bg-slate-500 text-white"
                      }>
                        {broker.status}
                      </Badge>
                      {broker.verified && (
                        <Badge className="bg-amber-500 text-white">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="w-3 h-3" />
                      {broker.phone}
                    </div>
                  </div>

                  {/* Trust Score */}
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      (broker.trust_score || 0) >= 75 ? 'bg-green-100' :
                      (broker.trust_score || 0) >= 50 ? 'bg-amber-100' :
                      'bg-red-100'
                    }`}>
                      <div>
                        <p className={`text-2xl font-bold ${
                          (broker.trust_score || 0) >= 75 ? 'text-green-700' :
                          (broker.trust_score || 0) >= 50 ? 'text-amber-700' :
                          'text-red-700'
                        }`}>
                          {broker.trust_score || 0}
                        </p>
                        <p className="text-xs text-slate-500">Trust</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NEW: Performance Overview Section */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 mb-4 border border-purple-200">
                  <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Performance Overview
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* 1. BrokerTrust™ Score */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-3 h-3 text-purple-600" />
                        <p className="text-xs text-slate-600 font-semibold">BrokerTrust™</p>
                      </div>
                      <p className={`text-2xl font-bold ${
                        (broker.trust_score || 0) >= 75 ? 'text-green-600' :
                        (broker.trust_score || 0) >= 50 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {broker.trust_score || 0}/100
                      </p>
                    </div>

                    {/* 2. Active Listings */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Home className="w-3 h-3 text-green-600" />
                        <p className="text-xs text-slate-600 font-semibold">Active Listings</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {broker.activeListings}
                      </p>
                    </div>
                  </div>

                  {/* 3. AI Matches Generated */}
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-600" />
                        <div>
                          <p className="text-xs text-slate-600 font-semibold">AI Matches Generated</p>
                          <p className="text-xs text-slate-500">{broker.requirementsCount} requirement{broker.requirementsCount !== 1 ? 's' : ''} posted</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-cyan-600">
                        {broker.totalAIMatches}
                      </p>
                    </div>
                  </div>

                  {/* 4. Top 3 Most Viewed Properties */}
                  {broker.top3Properties.length > 0 ? (
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-3 h-3 text-indigo-600" />
                        <p className="text-xs text-slate-600 font-semibold">Top Viewed Properties</p>
                      </div>
                      <div className="space-y-2">
                        {broker.top3Properties.map((prop, idx) => (
                          <div key={prop.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-indigo-600 font-bold">#{idx + 1}</span>
                              <span className="truncate text-slate-700">
                                {prop.ai_title || `${prop.bhk} in ${prop.location}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <Eye className="w-3 h-3" />
                              <span className="font-semibold">{prop.views_count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500">No property views yet</p>
                    </div>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700">{broker.totalListings}</p>
                    <p className="text-xs text-slate-600">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{broker.activeListings}</p>
                    <p className="text-xs text-slate-600">Active</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{broker.salesCount}</p>
                    <p className="text-xs text-slate-600">Sales</p>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-700">{broker.rentalsCount}</p>
                    <p className="text-xs text-slate-600">Rentals</p>
                  </div>
                </div>

                {/* Average Deal Value */}
                <div className="bg-slate-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-700">Avg Deal Value</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">₹{broker.avgDealValue}L</span>
                  </div>
                </div>

                {/* Activity Chart */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase">6-Month Activity</h4>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={broker.monthlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Last Activity */}
                {broker.lastActivityDays !== null && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Calendar className="w-3 h-3" />
                    Last active {broker.lastActivityDays} days ago
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`https://wa.me/${broker.phone.replace(/\D/g, '')}`, '_blank')}
                    size="sm"
                    className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={() => navigate(createPageUrl("AdminBrokers") + `?id=${broker.id}`)}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    View Details
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
