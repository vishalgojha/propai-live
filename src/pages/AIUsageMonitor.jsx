import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  RefreshCw, BarChart3, Activity, Cpu, Database, Shield, ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function AIUsageMonitor() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - in production, this would come from Base44 analytics API
  const mockUsageData = {
    current_hour: {
      requests: 127,
      tokens: 45230,
      errors: 3,
      rate_limit_errors: 2,
      avg_response_time: 2.4
    },
    today: {
      requests: 1834,
      tokens: 623400,
      errors: 12,
      rate_limit_errors: 8,
      avg_response_time: 2.1
    },
    limits: {
      requests_per_minute: 300,
      tokens_per_minute: 40000,
      requests_per_day: 50000,
      tokens_per_day: 2000000
    },
    health_status: "healthy", // healthy, warning, critical
    last_rate_limit: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    popular_operations: [
      { operation: "Property Creation", count: 523, avg_tokens: 850 },
      { operation: "Requirement Matching", count: 412, avg_tokens: 1200 },
      { operation: "Building Intelligence", count: 289, avg_tokens: 950 },
      { operation: "Broker Analysis", count: 156, avg_tokens: 720 }
    ]
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
          toast.error('Admin access required');
          navigate(createPageUrl("Home"));
          return;
        }
        setCurrentUser(user);
        setUsageData(mockUsageData); // In production, fetch real data here
      } catch (error) {
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUsageData({ ...mockUsageData }); // Refresh with new data
    setRefreshing(false);
    toast.success('Usage data refreshed');
  };

  // Calculate usage percentages
  const usageMetrics = useMemo(() => {
    if (!usageData) return null;

    const hourlyRPM = (usageData.current_hour.requests / 60).toFixed(1);
    const hourlyTPM = (usageData.current_hour.tokens / 60).toFixed(0);
    
    const rpmPercent = ((hourlyRPM / usageData.limits.requests_per_minute) * 100).toFixed(1);
    const tpmPercent = ((hourlyTPM / usageData.limits.tokens_per_minute) * 100).toFixed(1);
    const dailyRequestPercent = ((usageData.today.requests / usageData.limits.requests_per_day) * 100).toFixed(1);
    const dailyTokenPercent = ((usageData.today.tokens / usageData.limits.tokens_per_day) * 100).toFixed(1);

    const getHealthStatus = () => {
      const maxPercent = Math.max(rpmPercent, tpmPercent, dailyRequestPercent, dailyTokenPercent);
      if (maxPercent >= 90) return { status: 'critical', color: 'red' };
      if (maxPercent >= 70) return { status: 'warning', color: 'orange' };
      return { status: 'healthy', color: 'green' };
    };

    return {
      hourlyRPM,
      hourlyTPM,
      rpmPercent,
      tpmPercent,
      dailyRequestPercent,
      dailyTokenPercent,
      health: getHealthStatus(),
      errorRate: ((usageData.current_hour.errors / usageData.current_hour.requests) * 100).toFixed(2)
    };
  }, [usageData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 font-medium">Loading usage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(createPageUrl("AdminDashboard"))}
              variant="outline"
              size="icon"
              className="touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
                AI Usage Monitor
              </h1>
              <p className="text-sm text-slate-600 font-light">Real-time rate limit & quota tracking</p>
            </div>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Health Status Banner */}
        {usageMetrics && (
          <Card className={`p-4 mb-6 border-2 ${
            usageMetrics.health.status === 'critical' 
              ? 'bg-red-50 border-red-300'
              : usageMetrics.health.status === 'warning'
                ? 'bg-orange-50 border-orange-300'
                : 'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {usageMetrics.health.status === 'critical' ? (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                ) : usageMetrics.health.status === 'warning' ? (
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                )}
                <div>
                  <h3 className="text-lg font-bold">
                    {usageMetrics.health.status === 'critical' 
                      ? '🚨 Critical Usage'
                      : usageMetrics.health.status === 'warning'
                        ? '⚠️ High Usage Warning'
                        : '✅ System Healthy'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {usageMetrics.health.status === 'critical' 
                      ? 'You\'re at 90%+ capacity. Rate limiting likely.'
                      : usageMetrics.health.status === 'warning'
                        ? 'You\'re at 70%+ capacity. Monitor closely.'
                        : 'All systems operating normally.'}
                  </p>
                </div>
              </div>
              {usageData.last_rate_limit && (
                <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                  Last rate limit: {new Date(usageData.last_rate_limit).toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </Card>
        )}

        {/* Current Hour Usage */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <p className="text-xs text-slate-600 font-semibold">Requests/Min</p>
            </div>
            <p className="text-3xl font-bold text-purple-600">{usageMetrics?.hourlyRPM}</p>
            <div className="mt-2">
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    usageMetrics?.rpmPercent >= 90 ? 'bg-red-500' :
                    usageMetrics?.rpmPercent >= 70 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usageMetrics?.rpmPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {usageMetrics?.rpmPercent}% of {usageData?.limits.requests_per_minute} limit
              </p>
            </div>
          </Card>

          <Card className="p-4 bg-white border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-slate-600 font-semibold">Tokens/Min</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{usageMetrics?.hourlyTPM}</p>
            <div className="mt-2">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    usageMetrics?.tpmPercent >= 90 ? 'bg-red-500' :
                    usageMetrics?.tpmPercent >= 70 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usageMetrics?.tpmPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {usageMetrics?.tpmPercent}% of {usageData?.limits.tokens_per_minute.toLocaleString()} limit
              </p>
            </div>
          </Card>

          <Card className="p-4 bg-white border-2 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-xs text-slate-600 font-semibold">Success Rate</p>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {(100 - parseFloat(usageMetrics?.errorRate || 0)).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {usageData?.current_hour.errors} errors this hour
            </p>
          </Card>

          <Card className="p-4 bg-white border-2 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <p className="text-xs text-slate-600 font-semibold">Avg Response</p>
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {usageData?.current_hour.avg_response_time}s
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {usageData?.current_hour.rate_limit_errors} rate limit errors
            </p>
          </Card>
        </div>

        {/* Daily Usage */}
        <Card className="p-6 mb-6 bg-white border-2 border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Today's Usage
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Daily Requests</span>
                <span className="text-sm text-slate-600">
                  {usageData?.today.requests.toLocaleString()} / {usageData?.limits.requests_per_day.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    usageMetrics?.dailyRequestPercent >= 90 ? 'bg-red-500' :
                    usageMetrics?.dailyRequestPercent >= 70 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usageMetrics?.dailyRequestPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{usageMetrics?.dailyRequestPercent}% of daily limit</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Daily Tokens</span>
                <span className="text-sm text-slate-600">
                  {usageData?.today.tokens.toLocaleString()} / {usageData?.limits.tokens_per_day.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    usageMetrics?.dailyTokenPercent >= 90 ? 'bg-red-500' :
                    usageMetrics?.dailyTokenPercent >= 70 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usageMetrics?.dailyTokenPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{usageMetrics?.dailyTokenPercent}% of daily limit</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-600 mb-1">Total Errors</p>
                <p className="text-2xl font-bold text-red-600">{usageData?.today.errors}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Rate Limit Errors</p>
                <p className="text-2xl font-bold text-orange-600">{usageData?.today.rate_limit_errors}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Avg Response Time</p>
                <p className="text-2xl font-bold text-blue-600">{usageData?.today.avg_response_time}s</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Popular Operations */}
        <Card className="p-6 bg-white border-2 border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Popular AI Operations
          </h3>
          
          <div className="space-y-3">
            {usageData?.popular_operations.map((op, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{op.operation}</p>
                  <p className="text-xs text-slate-600">{op.count} requests • Avg {op.avg_tokens} tokens</p>
                </div>
                <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                  {op.count}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recommendations */}
        <Card className="p-6 mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Recommendations
          </h3>
          
          <div className="space-y-2 text-sm text-slate-700">
            {usageMetrics?.health.status === 'critical' && (
              <>
                <div className="flex items-start gap-2 bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">Critical: Contact Google Cloud to increase quota immediately</p>
                    <p className="text-xs text-red-700 mt-1">You're hitting rate limits frequently. Users are experiencing errors.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Implement request queuing</strong> to smooth out traffic spikes</p>
                </div>
              </>
            )}
            
            {usageMetrics?.health.status === 'warning' && (
              <>
                <div className="flex items-start gap-2 bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Monitor closely:</strong> You're approaching rate limits. Consider scaling soon.</p>
                </div>
                <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Optimize prompts:</strong> Reduce token usage where possible</p>
                </div>
              </>
            )}
            
            {usageMetrics?.health.status === 'healthy' && (
              <>
                <div className="flex items-start gap-2 bg-green-50 p-3 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p><strong>All good!</strong> System is running smoothly with plenty of headroom.</p>
                </div>
                <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Database className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Best practice:</strong> Continue monitoring usage patterns for future scaling needs</p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}