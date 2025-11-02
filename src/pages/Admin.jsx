import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Shield, Home, Users, Building2, FileText, TrendingUp,
  Search, Filter, Eye, Edit2, Trash2, AlertTriangle, Copy
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Admin() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("properties"); // properties, duplicates, brokers
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const queryClient = useQueryClient();

  // Check if user is admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
          navigate(createPageUrl("Home"));
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: properties = [] } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    initialData: [],
    enabled: isAuthorized,
  });

  const { data: duplicates = [] } = useQuery({
    queryKey: ['duplicate-properties'],
    queryFn: () => base44.entities.Property.filter({ is_duplicate: true }, '-created_date'),
    initialData: [],
    enabled: isAuthorized && viewMode === 'duplicates',
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (id) => base44.entities.Property.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-properties'] });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Property.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-properties'] });
    },
  });

  const markAsDuplicateMutation = useMutation({
    mutationFn: ({ duplicateId, originalId }) => 
      base44.entities.Property.update(duplicateId, { 
        is_duplicate: true, 
        duplicate_of: originalId 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-properties'] });
    },
  });

  const handleViewProperty = (propertyId) => {
    navigate(createPageUrl("PropertyDetails") + `?id=${propertyId}`);
  };

  const handleDeleteProperty = (propertyId) => {
    if (confirm("Are you sure you want to delete this property?")) {
      deletePropertyMutation.mutate(propertyId);
    }
  };

  const handleRestoreDuplicate = (propertyId) => {
    if (confirm("Restore this property from duplicates?")) {
      updatePropertyMutation.mutate({
        id: propertyId,
        data: { is_duplicate: false, duplicate_of: null }
      });
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = !searchQuery ||
      property.building_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.custom_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.bhk?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || property.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: properties.length,
    active: properties.filter(p => p.status === "Active" && !p.is_duplicate).length,
    duplicates: properties.filter(p => p.is_duplicate).length,
    draft: properties.filter(p => p.status === "Draft").length,
    sold: properties.filter(p => p.status === "Sold" || p.status === "Rented").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-[#FFD300] mx-auto mb-4 animate-pulse" />
          <p className="text-[#3B3B3B]">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111111] mb-2">Admin Dashboard</h1>
          <p className="text-[#3B3B3B]">Manage properties, duplicates, and system data</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Total Properties</p>
            <p className="text-2xl font-bold text-[#111111]">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7] cursor-pointer hover:border-orange-500/50" onClick={() => setViewMode('duplicates')}>
            <p className="text-xs text-[#3B3B3B] mb-1">Duplicates</p>
            <p className="text-2xl font-bold text-orange-600">{stats.duplicates}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Draft</p>
            <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Sold/Rented</p>
            <p className="text-2xl font-bold text-blue-600">{stats.sold}</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-2xl p-2 mb-6 border-2 border-[#F7F7F7] inline-flex gap-2">
          <Button
            onClick={() => setViewMode('properties')}
            variant={viewMode === 'properties' ? 'default' : 'ghost'}
            size="sm"
            className={viewMode === 'properties' ? 'bg-[#FFD300] text-black' : ''}
          >
            <Home className="w-4 h-4 mr-2" />
            Properties
          </Button>
          <Button
            onClick={() => setViewMode('duplicates')}
            variant={viewMode === 'duplicates' ? 'default' : 'ghost'}
            size="sm"
            className={viewMode === 'duplicates' ? 'bg-[#FFD300] text-black' : ''}
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicates ({stats.duplicates})
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-[#F7F7F7]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3B3B3B]" />
              <Input
                placeholder="Search by building, location, ID, or BHK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sold">Sold</SelectItem>
                <SelectItem value="Rented">Rented</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Properties View */}
        {viewMode === 'properties' && (
          <div className="space-y-4">
            {filteredProperties.filter(p => !p.is_duplicate).map((property) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border-2 border-[#F7F7F7] hover:border-[#FFD300]/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300]">
                        {property.bhk}
                      </Badge>
                      <Badge variant="outline" className={
                        property.status === "Active" ? "bg-green-500/20 text-green-700 border-green-500" :
                        property.status === "Draft" ? "bg-gray-500/20 text-gray-700 border-gray-500" :
                        "bg-blue-500/20 text-blue-700 border-blue-500"
                      }>
                        {property.status}
                      </Badge>
                      {property.custom_id && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {property.custom_id}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#111111] mb-2">
                      {property.ai_title || `${property.bhk} in ${property.location || 'Mumbai'}`}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                      <div>
                        <p className="text-xs text-[#3B3B3B]/60">Location</p>
                        <p className="text-sm font-semibold text-[#111111]">
                          {property.location || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#3B3B3B]/60">Building</p>
                        <p className="text-sm font-semibold text-[#111111]">
                          {property.building_name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#3B3B3B]/60">Price</p>
                        <p className="text-sm font-semibold text-[#111111]">
                          ₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#3B3B3B]/60">Area</p>
                        <p className="text-sm font-semibold text-[#111111]">
                          {property.carpet_area || 'N/A'} sq.ft
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[#3B3B3B]/60">
                      Added {format(new Date(property.created_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewProperty(property.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteProperty(property.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Duplicates View */}
        {viewMode === 'duplicates' && (
          <div className="space-y-4">
            {duplicates.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border-2 border-[#F7F7F7]">
                <Copy className="w-12 h-12 text-[#3B3B3B] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#111111] mb-2">No duplicates found</h3>
                <p className="text-[#3B3B3B]">All properties are unique</p>
              </div>
            ) : (
              duplicates.map((property) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-orange-500 text-white">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          DUPLICATE
                        </Badge>
                        <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300]">
                          {property.bhk}
                        </Badge>
                        {property.custom_id && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {property.custom_id}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-[#111111] mb-2">
                        {property.ai_title || `${property.bhk} in ${property.location || 'Mumbai'}`}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                        <div>
                          <p className="text-xs text-[#3B3B3B]/60">Building</p>
                          <p className="text-sm font-semibold text-[#111111]">
                            {property.building_name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#3B3B3B]/60">Price</p>
                          <p className="text-sm font-semibold text-[#111111]">
                            ₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#3B3B3B]/60">Area</p>
                          <p className="text-sm font-semibold text-[#111111]">
                            {property.carpet_area || 'N/A'} sq.ft
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#3B3B3B]/60">Floor</p>
                          <p className="text-sm font-semibold text-[#111111]">
                            {property.floor || 'N/A'}
                          </p>
                        </div>
                      </div>
                      {property.duplicate_of && (
                        <p className="text-xs text-orange-600 font-semibold">
                          Duplicate of: {property.duplicate_of}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewProperty(property.id)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleRestoreDuplicate(property.id)}
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50"
                      >
                        Restore
                      </Button>
                      <Button
                        onClick={() => handleDeleteProperty(property.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}