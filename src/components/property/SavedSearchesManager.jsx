import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Bell, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function SavedSearchesManager({ currentFilters, onApplySearch }) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertFrequency, setAlertFrequency] = useState("instant");
  const queryClient = useQueryClient();

  const { data: savedSearches, isLoading } = useQuery({
    queryKey: ['savedSearches'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.SavedSearch.filter({ user_id: user.id }, '-created_date');
    },
    initialData: [],
  });

  const createSearchMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      if (!user) throw new Error("Please login to save searches");
      
      return base44.entities.SavedSearch.create({
        user_id: user.id,
        name: data.name,
        search_filters: data.filters,
        alert_enabled: data.alertEnabled,
        alert_frequency: data.alertFrequency,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Search saved successfully!');
      setShowSaveDialog(false);
      setSearchName("");
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save search');
    }
  });

  const deleteSearchMutation = useMutation({
    mutationFn: (searchId) => base44.entities.SavedSearch.delete(searchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Search deleted');
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, alertEnabled }) => 
      base44.entities.SavedSearch.update(id, { alert_enabled: alertEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
    },
  });

  const handleSaveCurrentSearch = () => {
    if (!searchName.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }

    createSearchMutation.mutate({
      name: searchName,
      filters: currentFilters,
      alertEnabled,
      alertFrequency,
    });
  };

  const getFilterSummary = (filters) => {
    const parts = [];
    if (filters.bhk_multi?.length) parts.push(`${filters.bhk_multi.length} BHK types`);
    if (filters.location_multi?.length) parts.push(`${filters.location_multi.length} locations`);
    if (filters.listingType && filters.listingType !== 'all') parts.push(filters.listingType);
    if (filters.propertyCategory && filters.propertyCategory !== 'all') parts.push(filters.propertyCategory);
    return parts.length > 0 ? parts.join(' • ') : 'All properties';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Saved Searches</h3>
        <Button
          onClick={() => setShowSaveDialog(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 touch-manipulation"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Current Search
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : savedSearches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedSearches.map(search => (
            <Card key={search.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{search.name}</h4>
                  <p className="text-xs text-slate-600">{getFilterSummary(search.search_filters)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={search.alert_enabled}
                    onCheckedChange={(checked) => 
                      updateAlertMutation.mutate({ id: search.id, alertEnabled: checked })
                    }
                  />
                  <Bell className={`w-4 h-4 ${search.alert_enabled ? 'text-green-600' : 'text-slate-300'}`} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onApplySearch(search.search_filters)}
                  size="sm"
                  variant="outline"
                  className="flex-1 touch-manipulation"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Apply
                </Button>
                <Button
                  onClick={() => deleteSearchMutation.mutate(search.id)}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 touch-manipulation"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {search.alert_enabled && (
                <div className="mt-2 text-xs text-slate-500">
                  Alerts: {search.alert_frequency}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Save className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-2">No saved searches yet</p>
          <p className="text-sm text-slate-500">Save your search filters to get instant alerts for new matching properties</p>
        </Card>
      )}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                placeholder="e.g., 2 BHK in Bandra West"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="alerts">Enable Alerts</Label>
              <Switch
                id="alerts"
                checked={alertEnabled}
                onCheckedChange={setAlertEnabled}
              />
            </div>

            {alertEnabled && (
              <div>
                <Label htmlFor="frequency">Alert Frequency</Label>
                <Select value={alertFrequency} onValueChange={setAlertFrequency}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-600 mb-2">Current filters:</p>
              <p className="text-sm text-slate-900">{getFilterSummary(currentFilters)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCurrentSearch} disabled={createSearchMutation.isPending}>
              {createSearchMutation.isPending ? 'Saving...' : 'Save Search'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}