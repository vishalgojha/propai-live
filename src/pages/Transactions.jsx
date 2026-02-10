import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, Search, TrendingUp, MapPin, Calendar, 
  DollarSign, Building2, Filter, Download, BarChart3 
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import SEO from "@/components/SEO";

export default function Transactions() {
  const [filters, setFilters] = useState({
    location: "",
    transaction_type: "all",
    from_date: "",
    to_date: "",
    min_amount: "",
    max_amount: ""
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const query = {};
      if (filters.transaction_type !== 'all') query.transaction_type = filters.transaction_type;
      if (filters.location) query.location = filters.location;
      
      const data = await base44.entities.TransactionRecord.filter(query, '-transaction_date', 100);
      
      return data.filter(t => {
        if (filters.from_date && t.transaction_date < filters.from_date) return false;
        if (filters.to_date && t.transaction_date > filters.to_date) return false;
        if (filters.min_amount && t.amount < parseFloat(filters.min_amount) * 10000000) return false;
        if (filters.max_amount && t.amount > parseFloat(filters.max_amount) * 10000000) return false;
        return true;
      });
    }
  });

  const formatAmount = (amount, unit = 'crores') => {
    if (unit === 'crores') return `₹${(amount / 10000000).toFixed(2)} Cr`;
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const stats = {
    total: transactions.length,
    totalValue: transactions.reduce((sum, t) => sum + t.amount, 0),
    avgPrice: transactions.length > 0 ? 
      transactions.reduce((sum, t) => sum + (t.price_per_sqft || 0), 0) / transactions.length : 0
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO 
        title="Transaction Records - Real Estate Market Data | PropAI Live"
        description="Access verified real estate transaction records from government sources. Market trends, pricing insights, and investment analytics for Mumbai properties."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Transaction Records</h1>
              <p className="text-sm text-slate-600">Verified government data & market insights</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatAmount(stats.totalValue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Avg Price/sqft</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ₹{stats.avgPrice.toFixed(0)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Location (e.g., Bandra West)"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              />

              <Select
                value={filters.transaction_type}
                onValueChange={(val) => setFilters({ ...filters, transaction_type: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="Lease">Lease</SelectItem>
                  <SelectItem value="Mortgage">Mortgage</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                  placeholder="From Date"
                />
                <Input
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                  placeholder="To Date"
                />
              </div>

              <Input
                type="number"
                placeholder="Min Amount (Cr)"
                value={filters.min_amount}
                onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })}
              />

              <Input
                type="number"
                placeholder="Max Amount (Cr)"
                value={filters.max_amount}
                onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })}
              />

              <Button
                onClick={() => setFilters({
                  location: "", transaction_type: "all", from_date: "", 
                  to_date: "", min_amount: "", max_amount: ""
                })}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {transactions.map((txn) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-12 gap-4">
                      
                      {/* Left: Location & Property Info */}
                      <div className="md:col-span-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{txn.location}</h3>
                            <p className="text-sm text-slate-600">
                              {txn.bhk} {txn.property_type}
                            </p>
                            {txn.area_sqft && (
                              <p className="text-xs text-slate-500">{txn.area_sqft} sqft</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Transaction Details */}
                      <div className="md:col-span-5 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={
                            txn.transaction_type === 'Sale' ? 'bg-green-100 text-green-800' :
                            txn.transaction_type === 'Lease' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }>
                            {txn.transaction_type}
                          </Badge>
                          <Badge variant="outline">
                            Doc: {txn.document_number}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(txn.transaction_date), 'MMM dd, yyyy')}
                          </div>
                        </div>

                        {txn.source_attribution && (
                          <p className="text-xs text-slate-500">
                            Source: {txn.source_attribution}
                          </p>
                        )}
                      </div>

                      {/* Right: Price & Insights */}
                      <div className="md:col-span-3 text-right">
                        <div className="text-2xl font-bold text-slate-900 mb-1">
                          {formatAmount(txn.amount, txn.amount_unit)}
                        </div>
                        {txn.price_per_sqft && (
                          <div className="text-sm text-slate-600">
                            ₹{txn.price_per_sqft.toFixed(0)}/sqft
                          </div>
                        )}
                        {txn.ai_insights?.investment_score && (
                          <Badge className="mt-2 bg-purple-100 text-purple-800">
                            Investment Score: {txn.ai_insights.investment_score.toFixed(1)}/10
                          </Badge>
                        )}
                      </div>

                    </div>

                    {/* AI Insights */}
                    {txn.ai_insights && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-600 mt-1" />
                          <div className="text-sm">
                            <p className="text-slate-700">
                              <strong>Market:</strong> {txn.ai_insights.market_comparison}
                            </p>
                            <p className="text-slate-600 mt-1">
                              {txn.ai_insights.trend_analysis}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {transactions.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No transactions found. Try adjusting your filters.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      </div>
    </div>
  );
}