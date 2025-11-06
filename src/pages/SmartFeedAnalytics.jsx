import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Home, Search, Zap, MapPin, Calendar,
  Users, Target, Activity, DollarSign, Eye, Award
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "../components/SEO";
import { format, subDays, isAfter, isBefore, startOfDay } from "date-fns";

export default function SmartFeedAnalytics() {
  const [dateRange, setDateRange] = useState(30); // Last 30 days

  // Fetch all data
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    initialData: [],
  });

  const { data: requirements, isLoading: requirementsLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    initialData: [],
  });

  const { data: brokers, isLoading: brokersLoading } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => base44.entities.Broker.list(),
    initialData: [],
  });

  const isLoading = propertiesLoading || requirementsLoading || brokersLoading;

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!properties.length && !requirements.length) return null;

    const now = new Date();
    const startDate = subDays(now, dateRange);

    // Filter by date range
    const recentProperties = properties.filter(p => 
      p.created_date && isAfter(new Date(p.created_date), startDate)
    );
    const recentRequirements = requirements.filter(r => 
      r.created_date && isAfter(new Date(r.created_date), startDate)
    );

    // 1. KEY METRICS
    const totalProperties = properties.length;
    const activeProperties = properties.filter(p => p.status === 'Active').length;
    const totalRequirements = requirements.length;
    const activeRequirements = requirements.filter(r => r.status === 'Active').length;
    
    // Count AI matches
    const totalAIMatches = requirements.reduce((sum, req) => 
      sum + (req.ai_matched_properties?.length || 0), 0
    );
    const avgMatchesPerRequirement = totalRequirements > 0 
      ? (totalAIMatches / totalRequirements).toFixed(1) 
      : 0;

    // Views/engagement
    const totalPropertyViews = properties.reduce((sum, p) => sum + (p.views_count || 0), 0);
    const totalRequirementViews = requirements.reduce((sum, r) => sum + (r.views_count || 0), 0);
    const avgViewsPerProperty = totalProperties > 0 
      ? Math.round(totalPropertyViews / totalProperties) 
      : 0;

    // Conversion rate (properties with views that got matched)
    const propertiesWithViews = properties.filter(p => p.views_count > 0).length;
    const matchedProperties = properties.filter(p => 
      requirements.some(r => 
        r.ai_matched_properties?.some(m => m.property_id === p.id)
      )
    ).length;
    const conversionRate = propertiesWithViews > 0 
      ? ((matchedProperties / propertiesWithViews) * 100).toFixed(1) 
      : 0;

    // 2. LOCATION BREAKDOWN
    const locationStats = {};
    properties.forEach(p => {
      const loc = p.location || 'Unknown';
      if (!locationStats[loc]) {
        locationStats[loc] = { 
          name: loc, 
          properties: 0, 
          activeProperties: 0,
          avgPrice: [],
          views: 0 
        };
      }
      locationStats[loc].properties++;
      if (p.status === 'Active') locationStats[loc].activeProperties++;
      if (p.price) {
        const priceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
        locationStats[loc].avgPrice.push(priceInLakhs);
      }
      locationStats[loc].views += (p.views_count || 0);
    });

    // Calculate average prices and sort
    const topLocations = Object.values(locationStats)
      .map(loc => ({
        ...loc,
        avgPrice: loc.avgPrice.length > 0 
          ? Math.round(loc.avgPrice.reduce((a, b) => a + b, 0) / loc.avgPrice.length)
          : 0
      }))
      .sort((a, b) => b.properties - a.properties)
      .slice(0, 10);

    // 3. BHK BREAKDOWN
    const bhkStats = {};
    properties.forEach(p => {
      const bhk = p.bhk || 'Unknown';
      if (!bhkStats[bhk]) {
        bhkStats[bhk] = { name: bhk, count: 0, rent: 0, sale: 0 };
      }
      bhkStats[bhk].count++;
      if (p.listing_type === 'Rent') bhkStats[bhk].rent++;
      if (p.listing_type === 'Sale') bhkStats[bhk].sale++;
    });

    const bhkDistribution = Object.values(bhkStats)
      .sort((a, b) => b.count - a.count);

    // 4. LISTING TYPE DISTRIBUTION
    const listingTypeStats = {
      Rent: properties.filter(p => p.listing_type === 'Rent').length,
      Sale: properties.filter(p => p.listing_type === 'Sale').length,
      Lease: properties.filter(p => p.listing_type === 'Lease').length,
      'Pre Leased': properties.filter(p => p.listing_type === 'Pre Leased').length,
    };

    const listingTypePie = Object.entries(listingTypeStats)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));

    // 5. PROPERTY STATUS DISTRIBUTION
    const statusStats = {
      Active: properties.filter(p => p.status === 'Active').length,
      Sold: properties.filter(p => p.status === 'Sold').length,
      Rented: properties.filter(p => p.status === 'Rented').length,
      'On Hold': properties.filter(p => p.status === 'On Hold').length,
      Draft: properties.filter(p => p.status === 'Draft').length,
    };

    const statusPie = Object.entries(statusStats)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));

    // 6. TIMELINE DATA (Last 30 days)
    const timelineData = [];
    for (let i = dateRange - 1; i >= 0; i--) {
      const date = startOfDay(subDays(now, i));
      const dateStr = format(date, 'MMM dd');
      
      const propsOnDate = properties.filter(p => 
        p.created_date && 
        format(startOfDay(new Date(p.created_date)), 'MMM dd') === dateStr
      ).length;
      
      const reqsOnDate = requirements.filter(r => 
        r.created_date && 
        format(startOfDay(new Date(r.created_date)), 'MMM dd') === dateStr
      ).length;

      timelineData.push({
        date: dateStr,
        properties: propsOnDate,
        requirements: reqsOnDate
      });
    }

    // 7. TOP BROKERS (by active listings)
    const topBrokers = brokers
      .filter(b => b.active_listings_count > 0)
      .sort((a, b) => (b.active_listings_count || 0) - (a.active_listings_count || 0))
      .slice(0, 10)
      .map(b => ({
        name: b.name,
        activeListings: b.active_listings_count || 0,
        totalListings: b.total_listings_count || 0,
        trustScore: b.trust_score || 50
      }));

    // 8. AI MATCH SUCCESS RATE
    const requirementsWithMatches = requirements.filter(r => 
      r.ai_matched_properties && r.ai_matched_properties.length > 0
    ).length;
    const aiMatchSuccessRate = totalRequirements > 0 
      ? ((requirementsWithMatches / totalRequirements) * 100).toFixed(1) 
      : 0;

    // 9. PRICE DISTRIBUTION (for rent)
    const rentPriceRanges = {
      'Under ₹1L': 0,
      '₹1L - ₹2L': 0,
      '₹2L - ₹3L': 0,
      '₹3L - ₹5L': 0,
      '₹5L+': 0
    };

    properties.filter(p => p.listing_type === 'Rent' && p.price).forEach(p => {
      const priceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
      if (priceInLakhs < 1) rentPriceRanges['Under ₹1L']++;
      else if (priceInLakhs < 2) rentPriceRanges['₹1L - ₹2L']++;
      else if (priceInLakhs < 3) rentPriceRanges['₹2L - ₹3L']++;
      else if (priceInLakhs < 5) rentPriceRanges['₹3L - ₹5L']++;
      else rentPriceRanges['₹5L+']++;
    });

    const rentPriceData = Object.entries(rentPriceRanges)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));

    return {
      // Key metrics
      totalProperties,
      activeProperties,
      totalRequirements,
      activeRequirements,
      totalAIMatches,
      avgMatchesPerRequirement,
      totalPropertyViews,
      totalRequirementViews,
      avgViewsPerProperty,
      conversionRate,
      aiMatchSuccessRate,
      requirementsWithMatches,
      
      // Growth (recent)
      recentPropertiesCount: recentProperties.length,
      recentRequirementsCount: recentRequirements.length,
      
      // Breakdowns
      topLocations,
      bhkDistribution,
      listingTypePie,
      statusPie,
      timelineData,
      topBrokers,
      rentPriceData
    };
  }, [properties, requirements, brokers, dateRange]);

  const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SEO
        title="SmartFeed Analytics | PropAI Live Admin Dashboard"
        description="Comprehensive analytics dashboard for SmartFeed - track properties, requirements, AI matches, and market trends."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">SmartFeed Analytics</h1>
              <p className="text-slate-600 mt-1">Insights into app usage and market trends</p>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(parseInt(e.target.value))}
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-20 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analytics ? (
          <>
            {/* KEY METRICS - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Total Properties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.totalProperties}</div>
                  <p className="text-xs text-white/80 mt-1">
                    {analytics.activeProperties} active
                  </p>
                  <Badge className="mt-2 bg-white/20 text-white border-0">
                    +{analytics.recentPropertiesCount} in last {dateRange} days
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Total Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.totalRequirements}</div>
                  <p className="text-xs text-white/80 mt-1">
                    {analytics.activeRequirements} active
                  </p>
                  <Badge className="mt-2 bg-white/20 text-white border-0">
                    +{analytics.recentRequirementsCount} in last {dateRange} days
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    AI Matches Generated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.totalAIMatches}</div>
                  <p className="text-xs text-white/80 mt-1">
                    {analytics.avgMatchesPerRequirement} avg per requirement
                  </p>
                  <Badge className="mt-2 bg-white/20 text-white border-0">
                    {analytics.aiMatchSuccessRate}% success rate
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.conversionRate}%</div>
                  <p className="text-xs text-white/80 mt-1">
                    Views to matches
                  </p>
                  <Badge className="mt-2 bg-white/20 text-white border-0">
                    {analytics.totalPropertyViews} total views
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* KEY METRICS - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-700">
                    <Eye className="w-4 h-4 text-slate-500" />
                    Avg Views/Property
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{analytics.avgViewsPerProperty}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Engagement metric
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-700">
                    <Users className="w-4 h-4 text-slate-500" />
                    Active Brokers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {brokers.filter(b => b.status === 'Active').length}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Total: {brokers.length} brokers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-700">
                    <Activity className="w-4 h-4 text-slate-500" />
                    Requirements Matched
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{analytics.requirementsWithMatches}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Out of {analytics.totalRequirements} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-700">
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                    Requirement Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{analytics.totalRequirementViews}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Total engagement
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* TIMELINE CHART */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Activity Timeline (Last {dateRange} Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="properties" 
                      stroke="#7c3aed" 
                      strokeWidth={2}
                      name="Properties Added"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="requirements" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      name="Requirements Posted"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* TOP LOCATIONS & BHK DISTRIBUTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    Top Performing Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={analytics.topLocations.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748b" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="properties" fill="#7c3aed" name="Total Properties" />
                      <Bar dataKey="activeProperties" fill="#06b6d4" name="Active" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-purple-600" />
                    BHK Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={analytics.bhkDistribution.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="rent" fill="#10b981" name="Rent" stackId="a" />
                      <Bar dataKey="sale" fill="#f59e0b" name="Sale" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* PIE CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Listing Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.listingTypePie}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.listingTypePie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Property Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.statusPie}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.statusPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rent Price Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.rentPriceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.rentPriceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* TOP BROKERS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Top Performing Brokers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topBrokers.map((broker, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{broker.name}</p>
                          <p className="text-xs text-slate-500">
                            {broker.activeListings} active • {broker.totalListings} total listings
                          </p>
                        </div>
                      </div>
                      <Badge 
                        className={`${
                          broker.trustScore >= 70 
                            ? 'bg-green-500/20 text-green-700 border-green-500' 
                            : 'bg-amber-500/20 text-amber-700 border-amber-500'
                        }`}
                      >
                        Trust: {broker.trustScore}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-20">
            <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}