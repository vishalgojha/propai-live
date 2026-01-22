import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, AlertCircle, TrendingDown, Copy, CheckCircle2,
  Lightbulb, Target, BarChart3, Loader2, RefreshCw, ArrowRight,
  TrendingUp, Search, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function BrokerAssistant() {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [marketDemand, setMarketDemand] = useState(null);
  const [loadingDemand, setLoadingDemand] = useState(false);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setIsLoading(true);
        const response = await base44.functions.invoke('analyzeBrokerListings');
        setInsights(response.data);
      } catch (error) {
        toast.error('Failed to load insights', {
          description: error.message
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInsights();
  }, []);

  useEffect(() => {
    const loadMarketDemand = async () => {
      try {
        setLoadingDemand(true);
        const response = await base44.functions.invoke('getMarketDemand');
        setMarketDemand(response.data);
      } catch (error) {
        console.error('Failed to load market demand:', error);
      } finally {
        setLoadingDemand(false);
      }
    };

    loadMarketDemand();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('analyzeBrokerListings');
      setInsights(response.data);
      toast.success('Insights refreshed!');
    } catch (error) {
      toast.error('Failed to refresh insights');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Toaster position="top-center" richColors closeButton />
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-medium">Analyzing your listings...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors closeButton />
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Data Available</h2>
          <p className="text-slate-600 mb-4">Complete your broker profile to get AI-powered insights</p>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            Complete Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">AI Broker Assistant</h1>
                <p className="text-slate-600">Proactive insights for {insights.broker.name}</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-purple-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-2 border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Total Listings</p>
              <p className="text-2xl font-bold text-slate-900">{insights.broker.total_listings}</p>
            </Card>
            <Card className="p-4 bg-white border-2 border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Matching Requirements</p>
              <p className="text-2xl font-bold text-green-600">{insights.insights.matched_requirements.length}</p>
            </Card>
            <Card className="p-4 bg-white border-2 border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Slow-Moving</p>
              <p className="text-2xl font-bold text-amber-600">{insights.insights.slow_moving_listings.length}</p>
            </Card>
            <Card className="p-4 bg-white border-2 border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Duplicates Found</p>
              <p className="text-2xl font-bold text-red-600">{insights.insights.potential_duplicates.length}</p>
            </Card>
          </div>
        </motion.div>

        {/* Market Demand Insights */}
        {marketDemand && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Market Demand Intelligence</h3>
                  <p className="text-sm text-slate-600">
                    Based on {marketDemand.summary.total_searches} searches in last {marketDemand.summary.period_days} days + Google Trends
                  </p>
                </div>
              </div>

              {/* Top Locations */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  High-Demand Locations
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {marketDemand.top_locations.slice(0, 5).map((loc, idx) => {
                    const trendData = marketDemand.google_trends.find(t => t.location === loc.location);
                    return (
                      <div key={idx} className="bg-white rounded-xl p-3 border border-purple-200">
                        <p className="font-semibold text-slate-900 text-sm mb-1">{loc.location}</p>
                        <p className="text-xs text-slate-600">{loc.searches} searches</p>
                        {trendData && (
                          <div className="mt-2">
                            <Badge className={
                              trendData.trend === 'rising' ? 'bg-green-600 text-white' :
                              trendData.trend === 'falling' ? 'bg-red-600 text-white' :
                              'bg-slate-600 text-white'
                            }>
                              {trendData.trend === 'rising' ? '📈' : trendData.trend === 'falling' ? '📉' : '➡️'} {trendData.trend}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Market Insights */}
              {marketDemand.ai_insights?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    AI Market Analysis
                  </h4>
                  <div className="space-y-2">
                    {marketDemand.ai_insights.map((insight, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-purple-200">
                        <div className="flex items-start gap-3">
                          <Badge className={
                            insight.priority === 'high' ? 'bg-red-600 text-white' :
                            insight.priority === 'medium' ? 'bg-amber-600 text-white' :
                            'bg-blue-600 text-white'
                          }>
                            {insight.priority}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 text-sm">{insight.title}</p>
                            <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* AI Suggestions */}
        {insights.insights.ai_suggestions?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">AI Recommendations</h3>
                  <div className="space-y-3">
                    {insights.insights.ai_suggestions.map((suggestion, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3 bg-white rounded-xl border border-blue-200"
                      >
                        <div className="flex items-start gap-3">
                          <Badge className="bg-blue-600 text-white flex-shrink-0 mt-1">
                            {suggestion.priority || 'Standard'}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{suggestion.title}</p>
                            <p className="text-sm text-slate-600 mt-1">{suggestion.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Matched Requirements */}
        {insights.insights.matched_requirements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Matching Requirements ({insights.insights.matched_requirements.length})
            </h2>
            <div className="grid gap-4">
              {insights.insights.matched_requirements.map((req, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-5 bg-white border-2 border-green-200 hover:border-green-400 transition-all">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{req.client_name}</h3>
                        <p className="text-sm text-slate-600">
                          {req.bhk} • {req.location}
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        {req.matched_properties} matches
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {req.properties.map((prop, pidx) => (
                        <div key={pidx} className="flex items-center justify-between p-2 bg-green-50 rounded-lg text-sm">
                          <span className="text-slate-700">{prop.title}</span>
                          <span className="font-semibold text-green-700">{prop.price}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Slow-Moving Listings */}
        {insights.insights.slow_moving_listings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-600" />
              Slow-Moving Listings ({insights.insights.slow_moving_listings.length})
            </h2>
            <div className="grid gap-4">
              {insights.insights.slow_moving_listings.map((listing, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-5 bg-white border-2 border-amber-200 hover:border-amber-400 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{listing.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Listed {listing.days_old} days ago • {listing.views} views
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-600">{listing.price}</p>
                        <p className="text-xs text-slate-600">⚠️ Needs refresh</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Potential Duplicates */}
        {insights.insights.potential_duplicates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Copy className="w-5 h-5 text-red-600" />
              Potential Duplicates ({insights.insights.potential_duplicates.length})
            </h2>
            <div className="grid gap-4">
              {insights.insights.potential_duplicates.map((dup, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-5 bg-white border-2 border-red-200 hover:border-red-400 transition-all">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-slate-600 mb-1">Listing 1 (Original)</p>
                        <p className="font-semibold text-slate-900">{dup.property_1.title}</p>
                        <p className="text-xs text-slate-500 mt-1">Listed: {dup.property_1.created}</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-slate-600 mb-1">Listing 2 (Duplicate)</p>
                        <p className="font-semibold text-slate-900">{dup.property_2.title}</p>
                        <p className="text-xs text-slate-500 mt-1">Listed: {dup.property_2.created}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}