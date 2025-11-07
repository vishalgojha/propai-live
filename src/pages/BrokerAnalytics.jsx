import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  BarChart3, TrendingUp, Eye, MessageCircle, Heart, Share2, 
  MapPin, Home, Star, Calendar, ArrowUp, ArrowDown, Zap,
  Users, Package, Target, Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export default function BrokerAnalytics() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentBroker, setCurrentBroker] = useState(null);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, all

  // Auth & Broker check
  useEffect(() => {
    const loadBroker = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          navigate(createPageUrl("Home"));
          return;
        }

        // Find broker by user email/phone
        const brokers = await base44.entities.Broker.list();
        const broker = brokers.find(b => 
          b.email === user.email || b.phone === user.phone
        );

        if (!broker) {
          // Not a registered broker
          navigate(createPageUrl("Home"));
          return;
        }

        setCurrentBroker(broker);
      } catch (error) {
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    loadBroker();
  }, [navigate]);

  // Fetch broker's properties
  const { data: properties = [] } = useQuery({
    queryKey: ['broker-properties', currentBroker?.id],
    queryFn: () => base44.entities.Property.filter({ 
      broker_id: currentBroker.id 
    }, '-created_date'),
    enabled: !!currentBroker,
    initialData: []
  });

  // Fetch property interactions
  const { data: interactions = [] } = useQuery({
    queryKey: ['property-interactions', currentBroker?.id],
    queryFn: () => base44.entities.PropertyInteraction.filter({ 
      broker_id: currentBroker.id 
    }, '-created_date'),
    enabled: !!currentBroker,
    initialData: []
  });

  // Fetch all requirements for area analysis
  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    enabled: !!currentBroker,
    initialData: []
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

  // Filter interactions by date range
  const filteredInteractions = useMemo(() => {
    return interactions.filter(i => 
      new Date(i.created_date) >= dateRange.startDate
    );
  }, [interactions, dateRange]);

  // Performance Metrics
  const metrics = useMemo(() => {
    const activeProps = properties.filter(p => p.status === 'Active' && !p.is_duplicate);
    const totalViews = filteredInteractions.filter(i => i.interaction_type === 'view').length;
    const totalInquiries = filteredInteractions.filter(i => i.interaction_type === 'inquiry' || i.interaction_type === 'whatsapp' || i.interaction_type === 'call').length;
    const totalSaves = filteredInteractions.filter(i => i.interaction_type === 'save').length;
    const avgViewsPerProperty = activeProps.length > 0 ? Math.round(totalViews / activeProps.length) : 0;

    // Trust score trend (compare to previous period)
    const previousPeriodStart = subDays(dateRange.startDate, dateRange.endDate.getTime() - dateRange.startDate.getTime());
    const previousInteractions = interactions.filter(i => {
      const date = new Date(i.created_date);
      return date >= previousPeriodStart && date < dateRange.startDate;
    });
    const previousInquiries = previousInteractions.filter(i => 
      i.interaction_type === 'inquiry' || i.interaction_type === 'whatsapp'
    ).length;
    
    const inquiryGrowth = previousInquiries > 0 
      ? Math.round(((totalInquiries - previousInquiries) / previousInquiries) * 100)
      : totalInquiries > 0 ? 100 : 0;

    return {
      activeListings: activeProps.length,
      totalViews,
      totalInquiries,
      totalSaves,
      avgViewsPerProperty,
      trustScore: currentBroker?.trust_score || 50,
      inquiryGrowth,
      conversionRate: totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : 0
    };
  }, [properties, filteredInteractions, interactions, dateRange, currentBroker]);

  // Daily activity chart data
  const dailyActivityData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayInteractions = filteredInteractions.filter(i => 
        format(new Date(i.created_date), 'yyyy-MM-dd') === dayStr
      );
      
      return {
        date: format(day, 'MMM dd'),
        views: dayInteractions.filter(i => i.interaction_type === 'view').length,
        inquiries: dayInteractions.filter(i => 
          i.interaction_type === 'inquiry' || i.interaction_type === 'whatsapp' || i.interaction_type === 'call'
        ).length,
        saves: dayInteractions.filter(i => i.interaction_type === 'save').length
      };
    });
  }, [filteredInteractions, dateRange]);

  // Property performance breakdown
  const propertyPerformance = useMemo(() => {
    return properties
      .filter(p => p.status === 'Active' && !p.is_duplicate)
      .map(property => {
        const propInteractions = filteredInteractions.filter(i => i.property_id === property.id);
        const views = propInteractions.filter(i => i.interaction_type === 'view').length;
        const inquiries = propInteractions.filter(i => 
          i.interaction_type === 'inquiry' || i.interaction_type === 'whatsapp' || i.interaction_type === 'call'
        ).length;
        const saves = propInteractions.filter(i => i.interaction_type === 'save').length;
        
        return {
          id: property.id,
          title: property.ai_title || `${property.bhk} in ${property.location}`,
          location: property.location,
          bhk: property.bhk,
          price: `₹${property.price}${property.price_unit === 'crores' ? ' Cr' : 'L'}`,
          views,
          inquiries,
          saves,
          conversionRate: views > 0 ? ((inquiries / views) * 100).toFixed(1) : 0
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [properties, filteredInteractions]);

  // Area demand analytics
  const areaDemandData = useMemo(() => {
    if (!currentBroker?.areas_covered) return [];

    const brokerAreas = currentBroker.areas_covered;
    
    return brokerAreas.map(area => {
      const areaRequirements = requirements.filter(r => 
        r.status === 'Active' && 
        r.preferred_locations?.includes(area)
      );
      
      const bhkBreakdown = {};
      areaRequirements.forEach(req => {
        req.bhk_preference?.forEach(bhk => {
          bhkBreakdown[bhk] = (bhkBreakdown[bhk] || 0) + 1;
        });
      });
      
      const avgBudget = areaRequirements.reduce((sum, req) => 
        sum + (req.budget_max || 0), 0
      ) / (areaRequirements.length || 1);

      return {
        area,
        totalDemand: areaRequirements.length,
        topBhk: Object.entries(bhkBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
        avgBudget: avgBudget > 0 ? `₹${avgBudget.toFixed(1)}L` : 'N/A'
      };
    }).sort((a, b) => b.totalDemand - a.totalDemand);
  }, [currentBroker, requirements]);

  // Interaction type breakdown (for pie chart)
  const interactionTypeData = useMemo(() => {
    const types = {
      'Views': filteredInteractions.filter(i => i.interaction_type === 'view').length,
      'Inquiries': filteredInteractions.filter(i => 
        i.interaction_type === 'inquiry' || i.interaction_type === 'whatsapp' || i.interaction_type === 'call'
      ).length,
      'Saves': filteredInteractions.filter(i => i.interaction_type === 'save').length,
      'Shares': filteredInteractions.filter(i => i.interaction_type === 'share').length
    };
    
    return Object.entries(types)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredInteractions]);

  const COLORS = ['#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-medium">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Analytics</h1>
              <p className="text-slate-600">Performance insights for {currentBroker?.name}</p>
            </div>
            
            <div className="flex items-center gap-3">
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
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-5 bg-white border-2 border-slate-200 hover:border-sky-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-sky-600" />
                </div>
                <Badge className="bg-sky-100 text-sky-700 border-sky-300">Active</Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{metrics.activeListings}</p>
              <p className="text-sm text-slate-600">Active Listings</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-5 bg-white border-2 border-slate-200 hover:border-purple-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-purple-300">{metrics.avgViewsPerProperty} avg</Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{metrics.totalViews}</p>
              <p className="text-sm text-slate-600">Total Views</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-5 bg-white border-2 border-slate-200 hover:border-green-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <Badge className={`${metrics.inquiryGrowth >= 0 ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                  {metrics.inquiryGrowth >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                  {Math.abs(metrics.inquiryGrowth)}%
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{metrics.totalInquiries}</p>
              <p className="text-sm text-slate-600">Inquiries</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-5 bg-white border-2 border-slate-200 hover:border-amber-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-amber-300">{metrics.conversionRate}%</Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{metrics.trustScore}</p>
              <p className="text-sm text-slate-600">Trust Score</p>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Daily Activity */}
          <Card className="lg:col-span-2 p-6 bg-white border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-600" />
              Daily Activity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyActivityData}>
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
                <Area type="monotone" dataKey="saves" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Saves" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Interaction Breakdown */}
          <Card className="p-6 bg-white border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Engagement Mix
            </h3>
            {interactionTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={interactionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {interactionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                No interaction data yet
              </div>
            )}
          </Card>
        </div>

        {/* Property Performance Table */}
        <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Performing Properties
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Property</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Location</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Views</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Inquiries</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Saves</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {propertyPerformance.length > 0 ? (
                  propertyPerformance.map((prop, idx) => (
                    <tr key={prop.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{prop.bhk}</p>
                          <p className="text-xs text-slate-500">{prop.price}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {prop.location}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-sm">{prop.views}</td>
                      <td className="py-3 px-4 text-center text-sm">{prop.inquiries}</td>
                      <td className="py-3 px-4 text-center text-sm">{prop.saves}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={`${prop.conversionRate >= 5 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {prop.conversionRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No property performance data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Area Demand Analytics */}
        <Card className="p-6 bg-white border-2 border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-600" />
            Demand in Your Areas
          </h3>
          {areaDemandData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areaDemandData.map((area, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2">{area.area}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Active Requirements:</span>
                      <Badge className="bg-sky-100 text-sky-700">{area.totalDemand}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Most Searched:</span>
                      <Badge variant="outline">{area.topBhk}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Avg Budget:</span>
                      <span className="font-semibold text-slate-900">{area.avgBudget}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              No demand data available for your areas
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}