import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Play, Zap, Mail, MessageCircle, TrendingUp,
  AlertTriangle, Target, RefreshCw, Calendar, Bell, Check
} from "lucide-react";
import { motion } from "framer-motion";
import { toast, Toaster } from "sonner";
import SEO from "../components/SEO";

export default function CronScheduler() {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [runningJobs, setRunningJobs] = useState({});
  const [lastRun, setLastRun] = useState({});
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoadingUser(true);
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
        base44.auth.redirectToLogin();
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, []);
  
  useEffect(() => {
    const stored = localStorage.getItem('propai_cron_last_run');
    if (stored) {
      setLastRun(JSON.parse(stored));
    }
  }, []);
  
  const saveLastRun = (jobName) => {
    const updated = {
      ...lastRun,
      [jobName]: new Date().toISOString()
    };
    setLastRun(updated);
    localStorage.setItem('propai_cron_last_run', JSON.stringify(updated));
  };
  
  const runJob = async (jobName, functionName, params = {}) => {
    setRunningJobs(prev => ({ ...prev, [jobName]: true }));
    const toastId = toast.loading(`🤖 Running ${jobName}...`);
    
    try {
      const response = await base44.functions.invoke(functionName, params);
      
      toast.dismiss(toastId);
      
      if (response.data?.success) {
        toast.success(`✅ ${jobName} Complete!`, {
          description: getSuccessMessage(functionName, response.data),
          duration: 5000
        });
        saveLastRun(jobName);
      } else {
        throw new Error(response.data?.error || 'Job failed');
      }
      
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(`❌ ${jobName} Failed`, {
        description: error.message,
        duration: 5000
      });
    } finally {
      setRunningJobs(prev => ({ ...prev, [jobName]: false }));
    }
  };
  
  const getSuccessMessage = (functionName, data) => {
    switch (functionName) {
      case 'autoMatchRequirements':
        return `${data.matches_found || 0} matches found, ${data.processed || 0} requirements processed`;
      case 'detectMarketAnomalies':
        return `${data.total_anomalies || 0} anomalies detected (${data.by_type?.underpriced || 0} deals)`;
      case 'sendDailyInsightsEmail':
        return `Sent to ${data.emails_sent || 0} admins`;
      case 'generateMarketInsights':
        return `Insights generated for ${data.location || 'all Mumbai'}`;
      default:
        return 'Job completed successfully';
    }
  };
  
  const getTimeSince = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };
  
  const scheduledJobs = [
    {
      name: "Property Auto-Matching",
      description: "Match active requirements to new properties using AI scoring",
      functionName: "autoMatchRequirements",
      icon: Target,
      color: "from-purple-600 to-indigo-600",
      schedule: "Every 6 hours",
      cronExpression: "0 */6 * * *",
      params: {},
      category: "Matching"
    },
    {
      name: "Market Anomaly Detection",
      description: "Find underpriced deals, overpriced listings, and broker spam",
      functionName: "detectMarketAnomalies",
      icon: AlertTriangle,
      color: "from-orange-600 to-red-600",
      schedule: "Daily at 6 PM",
      cronExpression: "0 18 * * *",
      params: {},
      category: "Quality"
    },
    {
      name: "Daily Insights Email",
      description: "Send market summary, deals, and metrics to admins",
      functionName: "sendDailyInsightsEmail",
      icon: Mail,
      color: "from-blue-600 to-cyan-600",
      schedule: "Daily at 9 AM",
      cronExpression: "0 9 * * *",
      params: {},
      category: "Notifications"
    },
    {
      name: "Market Insights Generation",
      description: "Generate weekly market trend reports for all locations",
      functionName: "generateMarketInsights",
      icon: TrendingUp,
      color: "from-green-600 to-emerald-600",
      schedule: "Weekly on Monday",
      cronExpression: "0 10 * * 1",
      params: { timeframe: '7d' },
      category: "Analytics"
    },
    {
      name: "Broker Match Alerts",
      description: "Notify brokers via WhatsApp when properties match their requirements",
      functionName: "sendBrokerMatchAlert",
      icon: MessageCircle,
      color: "from-green-600 to-teal-600",
      schedule: "Every 12 hours",
      cronExpression: "0 */12 * * *",
      params: {},
      category: "Notifications"
    },
    {
      name: "Building Stats Refresh",
      description: "Recalculate all building statistics and market intelligence",
      functionName: "recalculateBuildingStats",
      icon: RefreshCw,
      color: "from-indigo-600 to-purple-600",
      schedule: "Daily at 2 AM",
      cronExpression: "0 2 * * *",
      params: {},
      category: "Maintenance"
    }
  ];
  
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h2>
          <p className="text-slate-600 mb-4">This page is only accessible to administrators.</p>
          <Button onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }
  
  const categories = [...new Set(scheduledJobs.map(j => j.category))];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-center" richColors closeButton />
      
      <SEO
        title="Automation Scheduler | PropAI Admin"
        description="Schedule and manage automated tasks for PropAI Live"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Automation Scheduler</h1>
              <p className="text-sm text-slate-600">Manage scheduled tasks and automated workflows</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">
                  💡 Cron Schedule Setup Instructions
                </p>
                <p className="text-xs text-slate-700 leading-relaxed mb-2">
                  To run these jobs automatically, set up external cron triggers using:
                </p>
                <div className="space-y-1 text-xs">
                  <div className="bg-white/60 rounded px-3 py-2 font-mono text-slate-800">
                    <strong>URL Pattern:</strong> https://propai.live/api/[functionName]
                  </div>
                  <div className="bg-white/60 rounded px-3 py-2 font-mono text-slate-800">
                    <strong>Method:</strong> POST with JSON payload
                  </div>
                  <div className="bg-white/60 rounded px-3 py-2">
                    <strong>Services:</strong> <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">cron-job.org</a>, 
                    <a href="https://easycron.com" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline ml-1">EasyCron</a>, or Deno Deploy cron
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {categories.map(category => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              {category === 'Matching' && <Target className="w-5 h-5 text-purple-600" />}
              {category === 'Quality' && <AlertTriangle className="w-5 h-5 text-orange-600" />}
              {category === 'Notifications' && <Bell className="w-5 h-5 text-blue-600" />}
              {category === 'Analytics' && <TrendingUp className="w-5 h-5 text-green-600" />}
              {category === 'Maintenance' && <RefreshCw className="w-5 h-5 text-indigo-600" />}
              {category}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledJobs.filter(j => j.category === category).map((job) => {
                const Icon = job.icon;
                const isRunning = runningJobs[job.name];
                const lastRunTime = lastRun[job.name];
                
                return (
                  <motion.div
                    key={job.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="p-5 hover:shadow-lg transition-all border-2 border-slate-200 hover:border-purple-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${job.color} rounded-xl flex items-center justify-center shadow-md`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{job.name}</h3>
                            <p className="text-xs text-slate-500">{job.functionName}</p>
                          </div>
                        </div>
                        
                        {lastRunTime && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {getTimeSince(lastRunTime)}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                        {job.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-4 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-xs text-slate-600 font-semibold">{job.schedule}</span>
                        <code className="text-xs text-purple-700 font-mono ml-auto">{job.cronExpression}</code>
                      </div>
                      
                      <Button
                        onClick={() => runJob(job.name, job.functionName, job.params)}
                        disabled={isRunning}
                        className={`w-full bg-gradient-to-r ${job.color} hover:shadow-md text-white font-bold`}
                      >
                        {isRunning ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Run Now
                          </>
                        )}
                      </Button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            How to Set Up Automated Scheduling
          </h3>
          
          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <p className="font-semibold mb-2">Option 1: External Cron Service (Easiest)</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">cron-job.org</a> (free)</li>
                <li>Create account and add new cron job</li>
                <li>Use URL: <code className="bg-white px-2 py-1 rounded">https://propai.live/api/functionName</code></li>
                <li>Set schedule using the cron expression shown above</li>
                <li>Method: POST, Content-Type: application/json</li>
              </ol>
            </div>
            
            <div>
              <p className="font-semibold mb-2">Option 2: Deno Deploy Cron (Recommended)</p>
              <div className="bg-white rounded-lg p-3 font-mono text-xs overflow-x-auto border border-slate-200">
{`// In your function file:
Deno.cron("job-name", "0 */6 * * *", async () => {
  const base44 = createServiceClient();
  await base44.functions.invoke('autoMatchRequirements', {});
});`}
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-900">
                <strong>⚡ Pro Tip:</strong> Start by testing jobs manually here. Once stable, set up automated scheduling.
                Most jobs should run during low-traffic hours (2-6 AM IST).
              </p>
            </div>
          </div>
        </Card>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Recommended Daily
            </h4>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• Property Auto-Matching (morning)</li>
              <li>• Market Anomaly Detection (evening)</li>
              <li>• Daily Insights Email (9 AM)</li>
            </ul>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Recommended Weekly
            </h4>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• Market Insights (Monday)</li>
              <li>• Building Stats Refresh (Sunday)</li>
              <li>• Broker Reports (Friday)</li>
            </ul>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              On-Demand Only
            </h4>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• Listing Optimization (per property)</li>
              <li>• Price Negotiation AI (per inquiry)</li>
              <li>• Demand Prediction (as needed)</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}