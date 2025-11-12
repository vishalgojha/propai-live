
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, AlertTriangle, CheckCircle2, RefreshCw, Zap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PriceValidationTool({ properties }) {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterIssueType, setFilterIssueType] = useState("all");
  
  // Modal state for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  // PRICE VALIDATION LOGIC
  const priceIssues = useMemo(() => {
    return properties.map(property => {
      const priceNum = parseFloat(property.price);
      if (isNaN(priceNum) || priceNum === 0) {
        return {
          property,
          issue: "missing_price",
          severity: "high",
          message: "Price is missing or invalid",
          suggestedFix: null
        };
      }

      // Convert to lakhs for analysis
      let priceInLakhs = property.price_unit === 'crores' ? priceNum * 100 : priceNum;

      // Detect likely data entry errors
      let issue = null;
      let severity = "none";
      let message = "";
      let suggestedFix = null;

      if (property.listing_type === 'Sale' || property.listing_type === 'Pre Leased') {
        if (property.property_category === 'Residential') {
          if (priceInLakhs > 10000) { // > 100 Cr
            issue = "extremely_high_sale";
            severity = "critical";
            message = `₹${(priceInLakhs / 100).toFixed(2)} Cr seems too high for residential sale`;
            suggestedFix = priceInLakhs > 50000 ? { price: priceInLakhs / 100, unit: 'lakhs' } : null;
          } else if (priceInLakhs < 50) { // < 50 Lakhs
            issue = "too_low_sale";
            severity = "high";
            message = `₹${priceInLakhs.toFixed(2)} L seems too low for Mumbai property`;
            suggestedFix = priceInLakhs < 1 ? { price: priceInLakhs * 100, unit: 'lakhs' } : null;
          }
        } else if (property.property_category === 'Commercial') {
          if (priceInLakhs > 20000) { // > 200 Cr
            issue = "extremely_high_commercial";
            severity = "critical";
            message = `₹${(priceInLakhs / 100).toFixed(2)} Cr seems very high for commercial`;
          }
        }
      } else if (property.listing_type === 'Rent' || property.listing_type === 'Lease') {
        if (property.property_category === 'Residential') {
          if (priceInLakhs > 20) { // > 20 Lakhs/month
            issue = "high_rent_residential";
            severity = "high";
            message = `₹${priceInLakhs.toFixed(2)} L/month seems very high for residential rent`;
            // Could be yearly rent stored as monthly, or stored in wrong unit
            suggestedFix = priceInLakhs > 100 ? { price: priceInLakhs / 100, unit: 'lakhs' } : null;
          } else if (priceInLakhs < 0.3) { // < 30k/month
            issue = "low_rent_residential";
            severity = "medium";
            message = `₹${(priceInLakhs * 100).toFixed(0)}K/month seems low for the area`;
          }
        } else if (property.property_category === 'Commercial') {
          if (priceInLakhs > 50) { // > 50 Lakhs/month
            issue = "high_rent_commercial";
            severity = "high";
            message = `₹${priceInLakhs.toFixed(2)} L/month seems very high for commercial rent`;
          }
        }
      }

      return {
        property,
        issue,
        severity,
        message,
        suggestedFix,
        priceInLakhs
      };
    }).filter(item => item.issue !== null);
  }, [properties]);

  const filteredIssues = useMemo(() => {
    if (filterIssueType === "all") return priceIssues;
    if (filterIssueType === "critical") return priceIssues.filter(i => i.severity === "critical");
    if (filterIssueType === "high") return priceIssues.filter(i => i.severity === "high");
    if (filterIssueType === "medium") return priceIssues.filter(i => i.severity === "medium");
    return priceIssues;
  }, [priceIssues, filterIssueType]);

  const severityCounts = useMemo(() => {
    return {
      critical: priceIssues.filter(i => i.severity === "critical").length,
      high: priceIssues.filter(i => i.severity === "high").length,
      medium: priceIssues.filter(i => i.severity === "medium").length,
    };
  }, [priceIssues]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-300";
      case "high": return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const applyAutoFix = async (item) => {
    if (!item.suggestedFix) return;

    try {
      await base44.entities.Property.update(item.property.id, {
        price: item.suggestedFix.price,
        price_unit: item.suggestedFix.unit
      });
      toast.success("✅ Price Fixed!", {
        description: `Updated to ₹${item.suggestedFix.price} ${item.suggestedFix.unit}`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (error) {
      toast.error("Failed to fix price", {
        description: error.message
      });
    }
  };

  // IMPROVED: Delete with modal confirmation
  const deleteProperty = async (property) => {
    try {
      await base44.entities.Property.delete(property.id);
      toast.success("🗑️ Property Deleted", {
        description: `${property.custom_id} removed from database`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    } catch (error) {
      toast.error("Failed to delete", {
        description: error.message
      });
    }
  };

  const confirmDeleteAllIssues = async () => {
    setIsDeleting(true);
    let deleted = 0;
    let errors = 0;

    toast.loading(`Deleting ${filteredIssues.length} properties...`, { id: "bulk-delete" });

    for (const item of filteredIssues) {
      try {
        await base44.entities.Property.delete(item.property.id);
        deleted++;
      } catch (error) {
        console.error(`Failed to delete ${item.property.id}:`, error);
        errors++;
      }

      if (deleted % 10 === 0) {
        toast.loading(`Deleted ${deleted}/${filteredIssues.length}...`, { id: "bulk-delete" });
      }
    }

    toast.dismiss("bulk-delete");
    toast.success("✅ Bulk Delete Complete!", {
      description: `Deleted ${deleted} properties${errors > 0 ? ` (${errors} errors)` : ''}`,
      className: 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-0',
      duration: 6000
    });
    
    queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    queryClient.invalidateQueries({ queryKey: ['duplicate-properties'] });
    
    setIsDeleting(false);
    setDeleteAllDialogOpen(false);
  };

  const runBulkAnalysis = async () => {
    setIsAnalyzing(true);
    toast.loading("🔍 Analyzing all property prices...", { id: "price-analysis" });

    // Simulate analysis (already done via useMemo)
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.dismiss("price-analysis");
    toast.success("✅ Analysis Complete!", {
      description: `Found ${priceIssues.length} potential pricing issues`,
      duration: 4000
    });
    setIsAnalyzing(false);
  };

  const applyAllAutoFixes = async () => {
    const fixableIssues = priceIssues.filter(i => i.suggestedFix !== null);

    if (fixableIssues.length === 0) {
      toast.info("No auto-fixable issues found");
      return;
    }

    if (!confirm(`Apply auto-fix to ${fixableIssues.length} properties?\n\nThis will update prices based on AI suggestions.`)) {
      return;
    }

    setIsFixing(true);
    let fixed = 0;
    let errors = 0;

    toast.loading(`Fixing ${fixableIssues.length} prices...`, { id: "bulk-fix" });

    for (const item of fixableIssues) {
      try {
        await base44.entities.Property.update(item.property.id, {
          price: item.suggestedFix.price,
          price_unit: item.suggestedFix.unit
        });
        fixed++;
      } catch (error) {
        console.error(`Failed to fix ${item.property.id}:`, error);
        errors++;
      }
    }

    toast.dismiss("bulk-fix");
    toast.success("✅ Bulk Fix Complete!", {
      description: `Fixed ${fixed} prices (${errors} errors)`,
      duration: 5000
    });
    
    queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    setIsFixing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Price Validation Tool</h3>
              <p className="text-sm text-slate-600">Detect and fix pricing data issues</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={runBulkAnalysis}
              disabled={isAnalyzing}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
            
            {filteredIssues.length > 0 && (
              <Button
                onClick={() => setDeleteAllDialogOpen(true)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Issues
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-amber-200">
            <p className="text-2xl font-bold text-amber-700">{priceIssues.length}</p>
            <p className="text-sm text-slate-600">Total Issues</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <p className="text-2xl font-bold text-red-700">{severityCounts.critical}</p>
            <p className="text-sm text-slate-600">Critical</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <p className="text-2xl font-bold text-orange-700">{severityCounts.high}</p>
            <p className="text-sm text-slate-600">High</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-700">{severityCounts.medium}</p>
            <p className="text-sm text-slate-600">Medium</p>
          </div>
        </div>

        {/* WARNING BANNER */}
        {priceIssues.length > 0 && (
          <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900 mb-1">
                  ⚠️ Danger Zone: Delete All Issues
                </p>
                <p className="text-xs text-red-800 leading-relaxed">
                  The "Delete All Issues" button will permanently remove ALL properties with pricing problems. 
                  This is useful for cleaning up bad parsing results.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <Select value={filterIssueType} onValueChange={setFilterIssueType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Issues ({priceIssues.length})</SelectItem>
            <SelectItem value="critical">Critical ({severityCounts.critical})</SelectItem>
            <SelectItem value="high">High ({severityCounts.high})</SelectItem>
            <SelectItem value="medium">Medium ({severityCounts.medium})</SelectItem>
          </SelectContent>
        </Select>

        {priceIssues.some(i => i.suggestedFix) && (
          <Button
            onClick={applyAllAutoFixes}
            disabled={isFixing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isFixing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Apply All Auto-Fixes
              </>
            )}
          </Button>
        )}
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <Card className="p-16 text-center border-2 border-green-200 bg-green-50/30">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Issues Found</h3>
          <p className="text-slate-600">All property prices look valid!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((item, idx) => (
            <Card key={idx} className="p-4 border-2 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSeverityColor(item.severity)}>
                      {item.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.property.custom_id}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-slate-900 mb-1">
                    {item.property.ai_title || `${item.property.bhk} in ${item.property.location}`}
                  </h4>

                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                    <span>{item.property.location}</span>
                    <span>•</span>
                    <span>{item.property.listing_type}</span>
                    <span>•</span>
                    <span>{item.property.property_category}</span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900 mb-1">{item.message}</p>
                        <p className="text-xs text-slate-600">
                          Current: ₹{item.property.price} {item.property.price_unit} 
                          {" "}→ ₹{item.priceInLakhs.toFixed(2)} L
                        </p>
                        {item.suggestedFix && (
                          <p className="text-xs text-green-700 font-semibold mt-1">
                            Suggested: ₹{item.suggestedFix.price} {item.suggestedFix.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {item.suggestedFix && (
                    <Button
                      onClick={() => applyAutoFix(item)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Auto-Fix
                    </Button>
                  )}
                  <Button
                    onClick={() => window.open(`/propertydetails?id=${item.property.id}`, '_blank')}
                    size="sm"
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    View Property
                  </Button>
                  {/* NEW: Delete Individual Property */}
                  <Button
                    onClick={() => {
                      setPropertyToDelete(item.property);
                      setDeleteDialogOpen(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="whitespace-nowrap text-red-600 hover:bg-red-50 border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* SINGLE DELETE DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property?</AlertDialogTitle>
            <AlertDialogDescription>
              {propertyToDelete && (
                <div className="space-y-2 mt-2">
                  <p className="font-semibold text-slate-900">
                    {propertyToDelete.ai_title || `${propertyToDelete.bhk} in ${propertyToDelete.location}`}
                  </p>
                  <p className="text-sm">
                    ID: <code className="bg-slate-100 px-2 py-1 rounded">{propertyToDelete.custom_id}</code>
                  </p>
                  <p className="text-sm text-red-600 font-semibold mt-3">
                    This action cannot be undone.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => propertyToDelete && deleteProperty(propertyToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Property
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* BULK DELETE DIALOG */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Permanently Delete {filteredIssues.length} Properties?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 mt-3">
                <p className="font-semibold text-slate-900">
                  This will PERMANENTLY delete:
                </p>
                <ul className="text-sm space-y-1">
                  <li>• {severityCounts.critical} critical issues</li>
                  <li>• {severityCounts.high} high priority issues</li>
                  <li>• {severityCounts.medium} medium issues</li>
                </ul>
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-red-800 font-bold">
                    ⚠️ THIS CANNOT BE UNDONE
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    All {filteredIssues.length} properties with pricing issues will be removed from the database.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAllIssues}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : `Delete All ${filteredIssues.length} Properties`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
