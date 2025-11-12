import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap, Target, Copy, Building2, Star, TrendingUp, 
  Shield, Play, Check, AlertTriangle, Clock, Sparkles,
  DollarSign, Lightbulb, Mail, MessageCircle, Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { toast, Toaster } from "sonner";
import SEO from "../components/SEO";

export default function AutomationHub() {
  const [runningAgents, setRunningAgents] = useState({});
  const [runningFunctions, setRunningFunctions] = useState({});
  const [results, setResults] = useState({});

  const runAgent = async (agentName, params = {}) => {
    setRunningAgents(prev => ({ ...prev, [agentName]: true }));
    const toastId = toast.loading(`🤖 Running ${agentName}...`);

    try {
      const response = await base44.agents.invoke(agentName, params);
      
      toast.dismiss(toastId);
      toast.success(`✅ ${agentName} Complete!`, {
        duration: 5000
      });

      setResults(prev => ({
        ...prev,
        [agentName]: {
          success: true,
          data: response,
          timestamp: new Date().toISOString()
        }
      }));

    } catch (error) {
      toast.dismiss(toastId);
      toast.error(`❌ ${agentName} Failed`, {
        description: error.message,
        duration: 5000
      });

      setResults(prev => ({
        ...prev,
        [agentName]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setRunningAgents(prev => ({ ...prev, [agentName]: false }));
    }
  };

  const runFunction = async (functionName, displayName, params = {}) => {
    setRunningFunctions(prev => ({ ...prev, [functionName]: true }));
    const toastId = toast.loading(`⚡ Running ${displayName}...`);

    try {
      const response = await base44.functions.invoke(functionName, params);
      
      toast.dismiss(toastId);
      
      if (response.data?.success) {
        toast.success(`✅ ${displayName} Complete!`, {
          description: getSuccessMessage(functionName, response.data),
          duration: 5000
        });
      } else {
        throw new Error(response.data?.error || 'Function failed');
      }

      setResults(prev => ({
        ...prev,
        [functionName]: {
          success: true,
          data: response.data,
          timestamp: new Date().toISOString()
        }
      }));

    } catch (error) {
      toast.dismiss(toastId);
      toast.error(`❌ ${displayName} Failed`, {
        description: error.message,
        duration: 5000
      });

      setResults(prev => ({
        ...prev,
        [functionName]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setRunningFunctions(prev => ({ ...prev, [functionName]: false }));
    }
  };

  const getSuccessMessage = (functionName, data) => {
    switch (functionName) {
      case 'autoMatchRequirements':
        return `${data.matches_found || 0} matches, ${data.processed || 0} requirements`;
      case 'detectMarketAnomalies':
        return `${data.total_anomalies || 0} anomalies (${data.by_type?.underpriced || 0} deals)`;
      case 'sendDailyInsightsEmail':
        return `Sent to ${data.emails_sent || 0} admins`;
      case 'generateMarketInsights':
        return data.summary || 'Insights generated';
      case 'priceNegotiationAI':
        return `${data.negotiation_advice?.success_probability || '?'}% success probability`;
      case 'optimizePropertyListing':
        return `Score: ${data.current_performance?.optimization_score || '?'}/100`;
      default:
        return 'Completed';
    }
  };

  const agents = [
    {
      name: "property_matcher",
      title: "Smart Property Matcher",
      description: "Auto-match requirements to available properties using intelligent scoring",
      icon: Target,
      color: "from-purple-600 to-indigo-600",
      tasks: [
        "Score properties against requirements (BHK, location, price, amenities)",
        "Update requirements with matched_property_ids",
        "Calculate match confidence (60-100%)",
        "Return top 5 matches per requirement"
      ],
      defaultParams: {},
      sampleInvocation: "Match all active requirements to current inventory"
    },
    {
      name: "building_analyst",
      title: "Building Intelligence Calculator",
      description: "Calculate and update building-level market statistics and trends",
      icon: Building2,
      color: "from-blue-600 to-cyan-600",
      tasks: [
        "Calculate avg prices per BHK type",
        "Track listing velocity and market activity",
        "Update broker references and listing counts",
        "Detect price trends (Rising/Stable/Falling)",
        "Calculate ₹/sq.ft averages"
      ],
      defaultParams: {},
      sampleInvocation: "Analyze all buildings or provide building_id for single building"
    },
    {
      name: "broker_scorer",
      title: "BrokerTrust™ Calculator",
      description: "Calculate trust scores (0-100) based on duplicate rate and data quality",
      icon: Star,
      color: "from-amber-600 to-orange-600",
      tasks: [
        "Calculate duplicate rate per broker",
        "Score data completeness (images, details, descriptions)",
        "Analyze listing activity and consistency",
        "Update broker.trust_score (0-100)",
        "Generate performance metrics"
      ],
      defaultParams: {},
      sampleInvocation: "Recalculate all broker trust scores"
    },
    {
      name: "duplicate_detector",
      title: "Duplicate Detection Engine",
      description: "Find and flag duplicate properties, brokers, and buildings",
      icon: Copy,
      color: "from-orange-600 to-red-600",
      tasks: [
        "Detect property duplicates (fingerprint matching)",
        "Find broker duplicates (phone + name similarity)",
        "Identify building duplicates (name + location)",
        "Mark duplicates with duplicate_of references",
        "Preserve oldest record as primary"
      ],
      defaultParams: { entity_type: "property" },
      sampleInvocation: "Run with entity_type: property/broker/building"
    },
    {
      name: "market_analyzer",
      title: "Market Intelligence Engine",
      description: "Generate market insights and trends from property database",
      icon: TrendingUp,
      color: "from-green-600 to-emerald-600",
      tasks: [
        "Calculate location-wise pricing trends",
        "Identify hottest micro-markets",
        "Rank buildings by activity and value",
        "Generate broker leaderboards",
        "Track inventory levels and velocity"
      ],
      defaultParams: { analysis_type: "full_report" },
      sampleInvocation: "Analysis types: location_trends, price_analysis, broker_leaderboard, full_report"
    },
    {
      name: "data_validator",
      title: "Data Quality Validator",
      description: "Scan all entities for missing fields, broken relationships, and inconsistencies",
      icon: Shield,
      color: "from-red-600 to-rose-600",
      tasks: [
        "Validate required fields across all entities",
        "Detect orphaned relationships (invalid IDs)",
        "Find price anomalies and data errors",
        "Check team member consistency",
        "Report issues by severity (critical/high/medium/low)"
      ],
      defaultParams: {},
      sampleInvocation: "Validate all entities or specify entity_type"
    },
    {
      name: "relationship_mapper",
      title: "Relationship Mapper",
      description: "Auto-link properties to buildings, buildings to developers, and detect broker teams",
      icon: Sparkles,
      color: "from-indigo-600 to-purple-600",
      tasks: [
        "Link properties to buildings (fuzzy name matching)",
        "Create missing buildings from property data",
        "Link buildings to developers",
        "Detect broker teams from co-listing patterns",
        "Fix orphaned relationships"
      ],
      defaultParams: { task: "full_mapping" },
      sampleInvocation: "Tasks: link_properties_to_buildings, link_buildings_to_developers, detect_broker_teams, full_mapping"
    },
    {
      name: "notification_engine",
      title: "Smart Notification Engine",
      description: "Match new properties to broker requirements and prepare notification data",
      icon: Zap,
      color: "from-cyan-600 to-blue-600",
      tasks: [
        "Match new properties to active requirements",
        "Calculate match scores (70%+ threshold)",
        "Group notifications by broker",
        "Track notification history (prevent spam)",
        "Generate WhatsApp-ready notification data"
      ],
      defaultParams: {},
      sampleInvocation: "Run daily or after new properties added"
    }
  ];

  const aiiFunctions = [
    {
      functionName: "autoMatchRequirements",
      displayName: "AI Property Matcher",
      description: "Uses LLM to intelligently score property matches against requirements",
      icon: Target,
      color: "from-purple-600 to-pink-600",
      usesLLM: true,
      defaultParams: {}
    },
    {
      functionName: "generateMarketInsights",
      displayName: "Market Insights Generator",
      description: "Creates natural language market summaries and trend analysis",
      icon: TrendingUp,
      color: "from-blue-600 to-indigo-600",
      usesLLM: true,
      defaultParams: { timeframe: '7d' }
    },
    {
      functionName: "detectMarketAnomalies",
      displayName: "Anomaly Detector + AI Analysis",
      description: "Statistical outlier detection with AI reasoning for deals and errors",
      icon: AlertTriangle,
      color: "from-orange-600 to-red-600",
      usesLLM: true,
      defaultParams: {}
    },
    {
      functionName: "priceNegotiationAI",
      displayName: "Price Negotiation Advisor",
      description: "AI-powered negotiation strategies based on market data and leverage factors",
      icon: DollarSign,
      color: "from-emerald-600 to-green-600",
      usesLLM: true,
      defaultParams: {}
    },
    {
      functionName: "optimizePropertyListing",
      displayName: "Listing Optimization AI",
      description: "Analyzes listings and suggests improvements for better engagement",
      icon: Lightbulb,
      color: "from-yellow-600 to-amber-600",
      usesLLM: true,
      defaultParams: {}
    },
    {
      functionName: "sendDailyInsightsEmail",
      displayName: "Daily Insights Email",
      description: "Aggregates metrics, deals, and sends formatted email to admins",
      icon: Mail,
      color: "from-blue-600 to-cyan-600",
      usesLLM: false,
      defaultParams: {}
    },
    {
      functionName: "sendBrokerMatchAlert",
      displayName: "Broker Match Alerts",
      description: "Prepares WhatsApp notifications for brokers when matches are found",
      icon: MessageCircle,
      color: "from-green-600 to-teal-600",
      usesLLM: false,
      defaultParams: {}
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-center" richColors closeButton />

      <SEO
        title="Automation Hub | PropAI Admin"
        description="Run AI agents and automated workflows for property intelligence"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Automation Hub</h1>
                <p className="text-sm text-slate-600">AI Agents & Automated Workflows</p>
              </div>
            </div>
            
            <Button
              onClick={() => window.location.href = '/cronscheduler'}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Jobs
            </Button>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border-2 border-purple-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">
                  💡 Two Types of Automation
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong>Agents:</strong> Pure database logic—no API costs. Perfect for data processing and scoring.<br/>
                  <strong>AI Functions:</strong> Use LLM for natural language, analysis, and intelligent reasoning.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="agents" className="text-base">
              🤖 Database Agents (No LLM)
            </TabsTrigger>
            <TabsTrigger value="functions" className="text-base">
              🧠 AI Functions (Uses LLM)
            </TabsTrigger>
          </TabsList>

          {/* Agents Tab */}
          <TabsContent value="agents">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent) => {
                const Icon = agent.icon;
                const isRunning = runningAgents[agent.name];
                const result = results[agent.name];

                return (
                  <motion.div
                    key={agent.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-all border-2 border-slate-200 hover:border-purple-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${agent.color} rounded-xl flex items-center justify-center shadow-md`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">{agent.title}</h3>
                            <p className="text-xs text-slate-500">{agent.name}</p>
                          </div>
                        </div>
                        
                        {result && (
                          <Badge className={result.success ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"}>
                            {result.success ? <Check className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                            {result.success ? "Done" : "Error"}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                        {agent.description}
                      </p>

                      <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-semibold text-slate-700 mb-2">What it does:</p>
                        <ul className="space-y-1">
                          {agent.tasks.map((task, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-purple-500 mt-0.5">•</span>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        onClick={() => runAgent(agent.name, agent.defaultParams)}
                        disabled={isRunning}
                        className={`w-full bg-gradient-to-r ${agent.color} hover:shadow-md text-white font-bold`}
                      >
                        {isRunning ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Run Agent
                          </>
                        )}
                      </Button>

                      {result && (
                        <div className={`mt-4 p-3 rounded-xl border-2 ${
                          result.success 
                            ? "bg-green-50 border-green-200" 
                            : "bg-red-50 border-red-200"
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <p className="text-xs text-slate-600">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <pre className="text-xs text-slate-700 whitespace-pre-wrap max-h-32 overflow-auto">
                            {JSON.stringify(result.data || result.error, null, 2)}
                          </pre>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* AI Functions Tab */}
          <TabsContent value="functions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiiFunctions.map((func) => {
                const Icon = func.icon;
                const isRunning = runningFunctions[func.functionName];
                const result = results[func.functionName];

                return (
                  <motion.div
                    key={func.functionName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-all border-2 border-slate-200 hover:border-blue-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${func.color} rounded-xl flex items-center justify-center shadow-md`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">{func.displayName}</h3>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-slate-500">{func.functionName}</p>
                              {func.usesLLM && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                                  Uses LLM
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {result && (
                          <Badge className={result.success ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"}>
                            {result.success ? <Check className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                            {result.success ? "Done" : "Error"}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                        {func.description}
                      </p>

                      <Button
                        onClick={() => runFunction(func.functionName, func.displayName, func.defaultParams)}
                        disabled={isRunning}
                        className={`w-full bg-gradient-to-r ${func.color} hover:shadow-md text-white font-bold`}
                      >
                        {isRunning ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Run Function
                          </>
                        )}
                      </Button>

                      {result && (
                        <div className={`mt-4 p-3 rounded-xl border-2 ${
                          result.success 
                            ? "bg-green-50 border-green-200" 
                            : "bg-red-50 border-red-200"
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <p className="text-xs text-slate-600">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <pre className="text-xs text-slate-700 whitespace-pre-wrap max-h-32 overflow-auto">
                            {JSON.stringify(result.data || result.error, null, 2)}
                          </pre>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Scheduling Info */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 mb-2">💡 Recommended Automation Schedule</h3>
              <div className="grid md:grid-cols-3 gap-4 mt-3">
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xs font-bold text-purple-700 mb-2">🌙 Nightly (2-6 AM):</p>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li>• broker_scorer</li>
                    <li>• building_analyst</li>
                    <li>• relationship_mapper</li>
                  </ul>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-700 mb-2">☀️ Daily (9 AM - 6 PM):</p>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li>• autoMatchRequirements (9 AM, 3 PM)</li>
                    <li>• detectMarketAnomalies (6 PM)</li>
                    <li>• sendDailyInsightsEmail (9 AM)</li>
                  </ul>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-700 mb-2">📅 Weekly:</p>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li>• duplicate_detector (Sunday)</li>
                    <li>• data_validator (Saturday)</li>
                    <li>• market_analyzer (Monday)</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-indigo-700 mt-4">
                👉 Go to <a href="/cronscheduler" className="font-bold underline">Cron Scheduler</a> to set up automation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}