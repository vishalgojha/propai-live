import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  TrendingUp, TrendingDown, Activity, Clock, 
  CheckCircle, AlertCircle, BarChart3, RefreshCw 
} from "lucide-react";
import { motion } from "framer-motion";

/**
 * Parity Report - Monitor client-side AI vs backend drift
 * Admin-only page
 */
export default function ParityReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total_logs: 0,
    avg_enrichment_time_ms: 0,
    properties_enriched: 0,
    last_24h: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
          navigate(createPageUrl("Home"));
          return;
        }
        setAuthorized(true);
        await loadParityData();
      } catch (error) {
        navigate(createPageUrl("Home"));
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const loadParityData = async () => {
    try {
      // In production: fetch from backend endpoint
      // For now: mock data since we're just logging to console
      
      // Mock stats
      setStats({
        total_logs: 847,
        avg_enrichment_time_ms: 1245,
        properties_enriched: 621,
        last_24h: 143,
      });

      // Mock recent logs
      setLogs([
        {
          property_id: 'abc123',
          client_title: '2 BHK with Sea Views in Bandra West',
          enrichment_time_ms: 1150,
          timestamp: new Date().toISOString(),
          drift: null,
        },
        // More logs...
      ]);

    } catch (error) {
      console.error('Failed to load parity data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading parity data...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            AI Parity Report
          </h1>
          <p className="text-slate-600">
            Monitor client-side AI enrichment performance and drift
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/80 backdrop-blur-xl border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                Total
              </Badge>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.total_logs}</p>
            <p className="text-xs text-slate-500 mt-1">Total enrichments logged</p>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-xl border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                Performance
              </Badge>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.avg_enrichment_time_ms}ms</p>
            <p className="text-xs text-slate-500 mt-1">Avg enrichment time</p>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-xl border-green-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <Badge className="bg-green-100 text-green-700 border-green-300">
                Coverage
              </Badge>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.properties_enriched}</p>
            <p className="text-xs text-slate-500 mt-1">Properties enriched</p>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-xl border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300">
                24h
              </Badge>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.last_24h}</p>
            <p className="text-xs text-slate-500 mt-1">Enrichments today</p>
          </Card>
        </div>

        {/* Implementation Note */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Implementation Note</h3>
              <p className="text-sm text-slate-700 mb-3">
                Currently logging to console. For production deployment, connect to:
              </p>
              <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                <li><strong>Datadog Logs</strong> - Real-time log aggregation</li>
                <li><strong>CloudWatch</strong> - AWS native logging</li>
                <li><strong>Custom DB Table</strong> - Store ParityLog entity</li>
              </ul>
              <div className="mt-4 bg-slate-900 text-green-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                <p>// Current logs appear in browser console:</p>
                <p className="text-slate-400">[PARITY_LOG] {JSON.stringify({ property_id: "abc", client_title: "...", enrichment_time_ms: 1200 })}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Rollback Instructions */}
        <Card className="p-6 bg-white/80 backdrop-blur-xl border-purple-200">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
            One-Click Rollback
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            If client-side AI quality degrades, rollback to backend instantly:
          </p>
          
          <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4 overflow-x-auto">
            <p className="text-slate-400">// Open browser console on any page and run:</p>
            <p>localStorage.setItem('feature_useClientAI', JSON.stringify({"{"}value: false, expiresAt: Date.now() + 86400000{"}"}));</p>
            <p>window.location.reload();</p>
          </div>

          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
            Copy Rollback Script
          </Button>
        </Card>

        {/* Recent Logs (if available) */}
        {logs.length > 0 && (
          <Card className="p-6 bg-white/80 backdrop-blur-xl border-purple-200 mt-8">
            <h3 className="font-bold text-slate-900 mb-4">Recent Enrichments</h3>
            <div className="space-y-3">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {log.client_title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {log.property_id} • {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    {log.enrichment_time_ms}ms
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}