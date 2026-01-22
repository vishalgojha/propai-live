import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bookmark, Bell, BellOff, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";

export default function SavedSearchManager({ user, currentFilters, onLoadSearch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertFrequency, setAlertFrequency] = useState("daily");

  const queryClient = useQueryClient();

  const { data: savedSearches, isLoading } = useQuery({
    queryKey: ['savedSearches', user?.id],
    queryFn: () => base44.entities.SavedSearch.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: []
  });

  const createSearchMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedSearch.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Search saved successfully!');
      setSaveDialogOpen(false);
      setSearchName("");
    },
    onError: () => {
      toast.error('Failed to save search');
    }
  });

  const deleteSearchMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedSearch.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Search deleted');
    }
  });

  const updateSearchMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavedSearch.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Alert settings updated');
    }
  });

  const handleSaveCurrentSearch = () => {
    if (!searchName.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }

    createSearchMutation.mutate({
      user_id: user.id,
      name: searchName,
      filters: currentFilters,
      alert_enabled: alertEnabled,
      alert_frequency: alertFrequency
    });
  };

  const handleLoadSearch = (search) => {
    onLoadSearch(search.filters);
    setIsOpen(false);
    toast.success(`Loaded search: ${search.name}`);
  };

  const toggleAlert = (search) => {
    updateSearchMutation.mutate({
      id: search.id,
      data: { alert_enabled: !search.alert_enabled }
    });
  };

  const getFilterSummary = (filters) => {
    const parts = [];
    if (filters.bhk_multi?.length > 0) parts.push(filters.bhk_multi.join(', '));
    if (filters.location_multi?.length > 0) parts.push(filters.location_multi.join(', '));
    if (filters.listingType && filters.listingType !== 'all') parts.push(filters.listingType);
    if (filters.minPrice || filters.maxPrice) {
      parts.push(`₹${filters.minPrice || '0'}-${filters.maxPrice || '∞'}`);
    }
    return parts.join(' • ') || 'All properties';
  };

  if (!user) return null;

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => setSaveDialogOpen(true)}
          variant="outline"
          size="sm"
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <Bookmark className="w-4 h-4 mr-2" />
          Save Search
        </Button>

        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <Search className="w-4 h-4 mr-2" />
          My Searches ({savedSearches.length})
        </Button>
      </div>

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Search</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Search Name
              </label>
              <Input
                placeholder="e.g., 2 BHK in Bandra"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Get Alerts for New Matches
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={alertEnabled}
                  onChange={(e) => setAlertEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-600">
                  Notify me when new properties match this search
                </span>
              </div>

              {alertEnabled && (
                <Select value={alertFrequency} onValueChange={setAlertFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant (as they arrive)</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-semibold text-slate-700 mb-1">Current Filters:</p>
              <p className="text-sm text-slate-600">{getFilterSummary(currentFilters)}</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveCurrentSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={createSearchMutation.isPending}
              >
                {createSearchMutation.isPending ? 'Saving...' : 'Save Search'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Searches List Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>My Saved Searches</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <p className="text-center py-8 text-slate-500">Loading...</p>
          ) : savedSearches.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No saved searches yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Save your current search to get notified about new matches
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{search.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {getFilterSummary(search.filters)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAlert(search)}
                        className={search.alert_enabled ? "text-blue-600" : "text-slate-400"}
                      >
                        {search.alert_enabled ? (
                          <Bell className="w-4 h-4" />
                        ) : (
                          <BellOff className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSearchMutation.mutate(search.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {search.alert_enabled && (
                    <Badge variant="outline" className="text-xs mb-2">
                      {search.alert_frequency} alerts
                    </Badge>
                  )}

                  <Button
                    onClick={() => handleLoadSearch(search)}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Load This Search
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}