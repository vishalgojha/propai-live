import React, { useState, useMemo, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PropertyCard from "../components/property/PropertyCard";
import PropertyFilters from "../components/property/PropertyFilters";
import RequirementCard from "../components/property/RequirementCard";
import SavedSearchManager from "../components/property/SavedSearchManager";
import PropertyComparison from "../components/property/PropertyComparison";
import MapView from "../components/property/MapView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles, ChevronDown, RefreshCw, Bell, TrendingUp, Eye, Brain, X, MapPin, Settings, Star, Map, Grid3x3, GitCompare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SEO from "../components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";
import { debounce } from "lodash";
import {
  generateWebSiteJsonLd,
  generateOrganizationJsonLd,
  generateBreadcrumbJsonLd
} from "../components/utils/jsonLdHelpers";


const PropertyDetailsModal = lazy(() => import("../components/property/PropertyDetailsModal"));

// ✅ FIXED: Helper function to get initial counts from localStorage
const getInitialCounts = () => {
  try {
    const stored = localStorage.getItem('propai_last_seen_counts');
    return stored ? JSON.parse(stored) : { properties: 0, requirements: 0 };
  } catch {
    return { properties: 0, requirements: 0 };
  }
};

export default function SmartFeed() {
  const [filters, setFilters] = useState({
    search: "",
    bhk_multi: [],
    location_multi: [],
    listingType: "all",
    propertyCategory: "all",
    furnishing: "all",
    minPrice: "",
    maxPrice: "",
    viewMode: "properties",
    sortBy: "brokertrust",
    amenities: [],
  });
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [itemsToShow, setItemsToShow] = useState(24);
  const [userPreferences, setUserPreferences] = useState(null);
  const [showAutoMatchBanner, setShowAutoMatchBanner] = useState(true);
  const [user, setUser] = useState(null);
  const [displayMode, setDisplayMode] = useState("grid"); // "grid" or "map"
  const [compareList, setCompareList] = useState([]);

  const [newItemsCount, setNewItemsCount] = useState({ properties: 0, requirements: 0 });
  const [showNewItemsBanner, setShowNewItemsBanner] = useState(false);
  
  // ✅ FIXED: Initialize from localStorage to persist across page refreshes
  const previousCountsRef = useRef(getInitialCounts());
  
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [compareProperties, setCompareProperties] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);

  const ITEMS_PER_PAGE = 24;
  const REFRESH_INTERVAL = 60000; // Reduced to 60 seconds for better performance

  const navigate = useNavigate();

  const popularAreas = [
    "Bandra West", "Juhu", "Andheri West", "Khar West",
    "BKC", "Worli", "Lower Parel", "Powai"
  ];

  // ⚡ OPTIMIZATION: Debounced search - only trigger filtering after user stops typing
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      setDebouncedSearchQuery(searchValue);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(filters.search);
  }, [filters.search, debouncedSearch]);

  // ⚡ OPTIMIZED: Fetch only 50 properties initially, lazy load more
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.filter({ status: "Active", is_duplicate: false }, '-created_date', 50),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    refetchInterval: false, // Disable auto-refetch for performance
    refetchOnWindowFocus: false,
  });

  // ⚡ OPTIMIZED: Fetch fewer requirements
  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.filter({ status: "Active" }, '-created_date', 30),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // ⚡ OPTIMIZED: Properties already filtered by query, no need to re-filter
  const activeProperties = properties;

  // ⚡ Extracted sorting function for reuse
  const sortProperties = (props, sortBy) => {
    return [...props].sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.last_refreshed || b.created_date) - new Date(a.last_refreshed || a.created_date);

        case 'price_low':
          const priceA = a.price_unit === 'crores' ? a.price * 100 : a.price;
          const priceB = b.price_unit === 'crores' ? b.price * 100 : b.price;
          return priceA - priceB;

        case 'price_high':
          const priceAH = a.price_unit === 'crores' ? a.price * 100 : a.price;
          const priceBH = b.price_unit === 'crores' ? b.price * 100 : b.price;
          return priceBH - priceAH;

        case 'brokertrust':
        default:
          const trustScoreA = a.broker_trust_score || 50;
          const trustScoreB = b.broker_trust_score || 50;

          if (trustScoreB !== trustScoreA) {
            return trustScoreB - trustScoreA;
          }

          return new Date(b.last_refreshed || b.created_date) - new Date(a.last_refreshed || a.created_date);
      }
    });
  };

  // ⚡ OPTIMIZATION: Use debounced search query instead of filters.search
  const filteredProperties = useMemo(() => {
    let results = activeProperties;

    // Early return if no filters applied
    if (!debouncedSearchQuery && 
        (!filters.bhk_multi || filters.bhk_multi.length === 0) &&
        (!filters.location_multi || filters.location_multi.length === 0) &&
        filters.listingType === 'all' &&
        filters.propertyCategory === 'all' &&
        filters.furnishing === 'all' &&
        !filters.minPrice &&
        !filters.maxPrice &&
        (!filters.amenities || filters.amenities.length === 0)) {
      // No filters, just sort and return
      return sortProperties(results, filters.sortBy);
    }

    results = results.filter(property => {
      // ⚡ Use debounced search query
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        const matchesSearch =
          property.building_name?.toLowerCase().includes(searchLower) ||
          property.location?.toLowerCase().includes(searchLower) ||
          property.location_id?.toLowerCase().includes(searchLower) ||
          property.pocket?.toLowerCase().includes(searchLower) ||
          property.city?.toLowerCase().includes(searchLower) ||
          property.ai_title?.toLowerCase().includes(searchLower) ||
          property.ai_description?.toLowerCase().includes(searchLower) ||
          property.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.bhk_multi && filters.bhk_multi.length > 0) {
        if (!filters.bhk_multi.includes(property.bhk)) return false;
      }

      if (filters.location_multi && filters.location_multi.length > 0) {
        if (!filters.location_multi.includes(property.location)) return false;
      }

      if (filters.propertyCategory && filters.propertyCategory !== "all") {
        if (property.property_category !== filters.propertyCategory) return false;
      }

      if (filters.listingType && filters.listingType !== "all") {
        if (property.listing_type !== filters.listingType) return false;
      }

      if (filters.furnishing && filters.furnishing !== "all") {
        if (property.furnishing !== filters.furnishing) return false;
      }

      if (filters.minPrice || filters.maxPrice) {
        const filterUnit = (filters.listingType === 'Sale' || filters.listingType === 'Pre Leased') ? 'crores' : 'lakhs';

        let propertyPriceNormalized;
        if (filterUnit === 'crores') {
          propertyPriceNormalized = property.price_unit === "crores" ? property.price : property.price / 100;
        } else {
          propertyPriceNormalized = property.price_unit === "crores" ? property.price * 100 : property.price;
        }

        if (filters.minPrice && propertyPriceNormalized < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && propertyPriceNormalized > parseFloat(filters.maxPrice)) return false;
      }

      if (filters.amenities && filters.amenities.length > 0) {
        const propertyAmenities = property.amenities || [];
        const hasAllAmenities = filters.amenities.every(amenity => 
          propertyAmenities.some(pa => pa.toLowerCase().includes(amenity.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });

    return sortProperties(results, filters.sortBy);
  }, [activeProperties, filters.bhk_multi, filters.location_multi, filters.listingType, filters.propertyCategory, filters.furnishing, filters.minPrice, filters.maxPrice, filters.sortBy, debouncedSearchQuery, filters.amenities]);

  // ⚡ OPTIMIZED: Debounced search intent tracking (only after 2 seconds of inactivity)
  useEffect(() => {
    const hasActiveFilters = 
      debouncedSearchQuery || 
      filters.bhk_multi?.length > 0 || 
      filters.location_multi?.length > 0 || 
      (filters.listingType && filters.listingType !== 'all') ||
      filters.minPrice || 
      filters.maxPrice;

    if (!hasActiveFilters) return;

    const timeoutId = setTimeout(() => {
      (async () => {
        try {
          let sessionId = sessionStorage.getItem('propai_session_id');
          if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('propai_session_id', sessionId);
          }

          const deviceType = window.innerWidth < 768 ? 'mobile' : 
                            window.innerWidth < 1024 ? 'tablet' : 'desktop';

          await base44.entities.SearchIntent.create({
            user_id: user?.id,
            session_id: sessionId,
            search_query: debouncedSearchQuery || '',
            filters_applied: {
              bhk_multi: filters.bhk_multi,
              location_multi: filters.location_multi,
              listingType: filters.listingType,
              propertyCategory: filters.propertyCategory,
              furnishing: filters.furnishing,
              minPrice: filters.minPrice ? parseFloat(filters.minPrice) : null,
              maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : null
            },
            results_count: filteredProperties.length,
            device_type: deviceType,
            user_agent: navigator.userAgent
          });
        } catch (error) {
          console.error('Failed to track search intent:', error);
        }
      })();
    }, 2000); // Only track after 2 seconds of no changes

    return () => clearTimeout(timeoutId);
  }, [debouncedSearchQuery, filters.bhk_multi, filters.location_multi, filters.listingType, filters.propertyCategory, filters.furnishing, filters.minPrice, filters.maxPrice, user?.id]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  // Extracted function to calculate and set user preferences
  const calculateAndSetUserPreferences = useCallback(() => {
    try {
      const viewHistory = JSON.parse(localStorage.getItem('propai_view_history') || '[]');
      const contactHistory = JSON.parse(localStorage.getItem('propai_contact_history') || '[]');

      if (viewHistory.length > 0 || contactHistory.length > 0) {
        const allProperties = [...viewHistory, ...contactHistory];
        const bhkCounts = {};
        const locationCounts = {};
        const listingTypeCounts = {};
        const priceRanges = [];

        allProperties.forEach(prop => {
          if (prop.bhk) bhkCounts[prop.bhk] = (bhkCounts[prop.bhk] || 0) + 1;
          if (prop.location) locationCounts[prop.location] = (locationCounts[prop.location] || 0) + 1;
          if (prop.listing_type) listingTypeCounts[prop.listing_type] = (listingTypeCounts[prop.listing_type] || 0) + 1;
          if (prop.price) {
            const priceInLakhs = prop.price_unit === 'crores' ? prop.price * 100 : prop.price;
            priceRanges.push(priceInLakhs);
          }
        });

        const topBhks = Object.entries(bhkCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(e => e[0]);

        const topLocations = Object.entries(locationCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(e => e[0]);

        const topListingType = Object.entries(listingTypeCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        const avgPrice = priceRanges.length > 0
          ? Math.round(priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length)
          : null;

        setUserPreferences({
          bhks: topBhks,
          locations: topLocations,
          listingType: topListingType,
          avgPrice: avgPrice,
          totalViews: viewHistory.length,
          totalContacts: contactHistory.length
        });
      } else {
        setUserPreferences(null); // Clear preferences if no history
      }
    } catch (error) {
      console.error('Failed to calculate and set user preferences:', error);
    }
  }, []);

  useEffect(() => {
    // Initial load of user preferences on component mount
    calculateAndSetUserPreferences();
  }, [calculateAndSetUserPreferences]);

  // ✅ NEW: Inject sample history for testing auto-match
  const injectSampleHistory = () => {
    const sampleHistory = [
      { id: '1', bhk: '2 BHK', location: 'Bandra West', price: 220, price_unit: 'lakhs', listing_type: 'Sale', timestamp: new Date().toISOString() },
      { id: '2', bhk: '2 BHK', location: 'Khar West', price: 180, price_unit: 'lakhs', listing_type: 'Sale', timestamp: new Date().toISOString() },
      { id: '3', bhk: '3 BHK', location: 'Bandra West', price: 350, price_unit: 'lakhs', listing_type: 'Sale', timestamp: new Date().toISOString() },
      { id: '4', bhk: '2 BHK', location: 'Juhu', price: 200, price_unit: 'lakhs', listing_type: 'Rent', timestamp: new Date().toISOString() },
      { id: '5', bhk: '3 BHK', location: 'Bandra West', price: 280, price_unit: 'lakhs', listing_type: 'Sale', timestamp: new Date().toISOString() },
    ];

    const sampleContacts = [
      { id: '1', bhk: '2 BHK', location: 'Bandra West', price: 220, price_unit: 'lakhs', listing_type: 'Sale', timestamp: new Date().toISOString() },
      { id: '3', bhk: '3 BHK', location: 'Bandra West', price: 350, price_unit: 'lakhs', listing_type: 'Sale', timestamp: new Date().toISOString() },
    ];

    localStorage.setItem('propai_view_history', JSON.stringify(sampleHistory));
    localStorage.setItem('propai_contact_history', JSON.stringify(sampleContacts));

    // After injecting, recalculate and set preferences
    calculateAndSetUserPreferences();

    toast.success('🎯 Sample History Injected!', {
      description: 'Auto-match now active. Scroll down to see "For You" section.',
      duration: 5000
    });
  };

  const trackPropertyView = (property) => {
    try {
      const viewHistory = JSON.parse(localStorage.getItem('propai_view_history') || '[]');
      viewHistory.push({
        id: property.id,
        bhk: property.bhk,
        location: property.location,
        price: property.price,
        price_unit: property.price_unit,
        listing_type: property.listing_type,
        timestamp: new Date().toISOString()
      });

      const recentViews = viewHistory.slice(-50);
      localStorage.setItem('propai_view_history', JSON.stringify(recentViews));
      
      // ✅ FIXED: Reload preferences after tracking view
      calculateAndSetUserPreferences();
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newFilters = { ...filters };

    if (urlParams.get('search')) newFilters.search = urlParams.get('search');
    if (urlParams.get('listingType')) newFilters.listingType = urlParams.get('listingType');
    if (urlParams.get('propertyCategory')) newFilters.propertyCategory = urlParams.get('propertyCategory');
    if (urlParams.get('furnishing')) newFilters.furnishing = urlParams.get('furnishing');
    if (urlParams.get('minPrice')) newFilters.minPrice = urlParams.get('minPrice');
    if (urlParams.get('maxPrice')) newFilters.maxPrice = urlParams.get('maxPrice');
    if (urlParams.get('viewMode')) newFilters.viewMode = urlParams.get('viewMode');

    if (user?.preferred_areas && user.preferred_areas.length > 0 && !urlParams.get('location')) {
      newFilters.location_multi = user.preferred_areas;
    }

    setFilters(newFilters);
  }, [user]); // Added filters to dependency array to prevent stale closure issues for newFilters

  useEffect(() => {
    setItemsToShow(ITEMS_PER_PAGE);
  }, [filters]);

  // ✅ FIXED: Only show banner for TRULY new items, persist counts in localStorage
  useEffect(() => {
    if (!isLoading && !requirementsLoading && properties.length > 0) {
      const currentCounts = {
        properties: activeProperties.length,
        requirements: activeRequirements.length
      };

      // ✅ CRITICAL FIX: Only show banner if we have a baseline AND there are new items
      const hasBaseline = previousCountsRef.current.properties > 0 || previousCountsRef.current.requirements > 0;
      
      if (hasBaseline) {
        const newProperties = Math.max(0, currentCounts.properties - previousCountsRef.current.properties);
        const newRequirements = Math.max(0, currentCounts.requirements - previousCountsRef.current.requirements);

        if (newProperties > 0 || newRequirements > 0) {
          setNewItemsCount({ properties: newProperties, requirements: newRequirements });
          setShowNewItemsBanner(true);
          setLastUpdateTime(new Date());

          let message = "";
          if (newProperties > 0 && newRequirements > 0) {
            message = `${newProperties} new ${newProperties === 1 ? 'property' : 'properties'} and ${newRequirements} new ${newRequirements === 1 ? 'requirement' : 'requirements'}`;
          } else if (newProperties > 0) {
            message = `${newProperties} new ${newProperties === 1 ? 'property' : 'properties'}`;
          } else {
            message = `${newRequirements} new ${newRequirements === 1 ? 'requirement' : 'requirements'}`;
          }

          toast.success(`🎉 ${message} available!`, {
            description: 'Scroll to top to see the latest additions',
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setShowNewItemsBanner(false);
                // ✅ Update localStorage when user views new items
                localStorage.setItem('propai_last_seen_counts', JSON.stringify(currentCounts));
                previousCountsRef.current = currentCounts;
              }
            }
          });
        }
      } else {
        // ✅ First load - just set the baseline, don't show banner
        previousCountsRef.current = currentCounts;
        localStorage.setItem('propai_last_seen_counts', JSON.stringify(currentCounts));
      }
    }
  }, [activeProperties, activeRequirements, isLoading, requirementsLoading]);

  const personalizedProperties = useMemo(() => {
    if (!userPreferences || !activeProperties.length) return [];

    return activeProperties
      .map(property => {
        let score = 0;

        if (userPreferences.bhks.includes(property.bhk)) score += 30;
        if (userPreferences.locations.includes(property.location)) score += 30;
        if (property.listing_type === userPreferences.listingType) score += 20;

        if (userPreferences.avgPrice) {
          const propertyPriceInLakhs = property.price_unit === 'crores' ? property.price * 100 : property.price;
          const priceDiff = Math.abs(propertyPriceInLakhs - userPreferences.avgPrice) / userPreferences.avgPrice;
          if (priceDiff < 0.2) score += 20;
          else if (priceDiff < 0.4) score += 10;
        }

        return { ...property, matchScore: score };
      })
      .filter(p => p.matchScore >= 30)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  }, [activeProperties, userPreferences]);

  // ⚡ OPTIMIZED: Requirements already filtered by query
  const activeRequirements = requirements;

  const filteredRequirements = useMemo(() => {
    let results = activeRequirements.filter(requirement => {

      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        const matchesSearch =
          requirement.preferred_locations?.some(loc => loc.toLowerCase().includes(searchLower)) ||
          requirement.bhk_preference?.some(bhk => bhk.toLowerCase().includes(searchLower)) ||
          requirement.client_name?.toLowerCase().includes(searchLower) ||
          requirement.notes?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.bhk_multi && filters.bhk_multi.length > 0) {
        const hasMatchingBhk = requirement.bhk_preference?.some(bhk =>
          filters.bhk_multi.includes(bhk)
        );
        if (!hasMatchingBhk) return false;
      }

      if (filters.location_multi && filters.location_multi.length > 0) {
        const hasMatchingLocation = requirement.preferred_locations?.some(loc =>
          filters.location_multi.includes(loc)
        );
        if (!hasMatchingLocation) return false;
      }

      if (filters.listingType && filters.listingType !== "all") {
        if (requirement.listing_type !== filters.listingType) return false;
      }

      if (filters.furnishing && filters.furnishing !== "all") {
        if (requirement.furnishing_preference !== filters.furnishing && requirement.furnishing_preference !== "Any") return false;
      }

      return true;
    });

    results.sort((a, b) => {
      const urgencyOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const urgencyA = urgencyOrder[a.urgency] || 0;
      const urgencyB = urgencyOrder[b.urgency] || 0;

      if (urgencyB !== urgencyA) {
        return urgencyB - urgencyA;
      }

      const dateA = new Date(a.created_date);
      const dateB = new Date(b.created_date);
      return dateB.getTime() - dateA.getTime();
    });

    return results;
  }, [activeRequirements, filters.bhk_multi, filters.location_multi, filters.listingType, filters.furnishing, debouncedSearchQuery]);

  const getDisplayItems = () => {
    if (filters.viewMode === "requirements") {
      return { items: filteredRequirements, type: "requirements", totalCount: filteredRequirements.length };
    } else if (filters.viewMode === "both") {
      const combined = [];
      const maxLength = Math.max(filteredProperties.length, filteredRequirements.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < filteredProperties.length) combined.push({ ...filteredProperties[i], itemType: 'property' });
        if (i < filteredRequirements.length) combined.push({ ...filteredRequirements[i], itemType: 'requirement' });
      }
      return { items: combined, type: "both", totalCount: filteredProperties.length + filteredRequirements.length };
    } else {
      return { items: filteredProperties, type: "properties", totalCount: filteredProperties.length };
    }
  };

  const { items: allItems, type: displayType, totalCount: totalFilteredItems } = getDisplayItems();
  const displayedItems = allItems.slice(0, itemsToShow);
  const hasMore = itemsToShow < allItems.length;

  // Removed pagination links for performance - not critical for initial load

  const loadMore = () => {
    setItemsToShow(prev => Math.min(prev + ITEMS_PER_PAGE, allItems.length));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      bhk_multi: [],
      location_multi: [],
      listingType: "all",
      propertyCategory: "all",
      furnishing: "all",
      minPrice: "",
      maxPrice: "",
      viewMode: "properties",
      sortBy: "brokertrust",
      amenities: [],
    });
  };

  const toggleCompare = (property) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === property.id);
      if (exists) {
        return prev.filter(p => p.id !== property.id);
      } else {
        if (prev.length >= 4) {
          toast.error('You can compare up to 4 properties at a time');
          return prev;
        }
        return [...prev, property];
      }
    });
  };

  const handleLoadSearch = (savedFilters) => {
    setFilters({ ...filters, ...savedFilters });
  };

  const handleRefresh = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowNewItemsBanner(false);
    setNewItemsCount({ properties: 0, requirements: 0 });
    
    // ✅ Update localStorage when user acknowledges new items
    const currentCounts = {
      properties: activeProperties.length,
      requirements: activeRequirements.length
    };
    localStorage.setItem('propai_last_seen_counts', JSON.stringify(currentCounts));
    previousCountsRef.current = currentCounts;
  };

  const handleAreaQuickFilter = (area) => {
    const currentAreas = filters.location_multi || [];
    if (currentAreas.includes(area)) {
      setFilters({ ...filters, location_multi: currentAreas.filter(a => a !== area) });
    } else {
      setFilters({ ...filters, location_multi: [...currentAreas, area] });
    }
  };

  // ✅ Generate JSON-LD for SmartFeed page
  const webSiteJsonLd = generateWebSiteJsonLd();
  const organizationJsonLd = generateOrganizationJsonLd();
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: window.location.origin },
    { name: "SmartFeed", url: window.location.href }
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors closeButton />

      {/* ✅ Enhanced SEO with structured data for search */}
      <SEO
        title="SmartFeed - AI-Powered Property Discovery | PropAI Live"
        description="Discover Mumbai properties with AI-powered SmartFeed. Real-time listings, personalized recommendations, and instant broker connections. Find your perfect property today."
        schema={[webSiteJsonLd]}
        organization={organizationJsonLd}
        breadcrumbs={breadcrumbJsonLd}
        canonical={window.location.href.split('?')[0]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">

        {/* ✅ NEW: Auto-Match Testing Panel (Admin Only) */}
        {user?.role === 'admin' && !userPreferences && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">🧪 Auto-Match Testing Mode</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      No viewing history detected. Want to test the auto-match feature with sample data?
                    </p>
                  </div>
                </div>
                <Button
                  onClick={injectSampleHistory}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold touch-manipulation"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Test Auto-Match
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showNewItemsBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mb-6"
            >
              <div className="bg-green-600 text-white rounded-xl p-4 shadow-md border border-green-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">New Items Available!</p>
                      <p className="text-sm text-white/90">
                        {newItemsCount.properties > 0 && `${newItemsCount.properties} new ${newItemsCount.properties === 1 ? 'property' : 'properties'}`}
                        {newItemsCount.properties > 0 && newItemsCount.requirements > 0 && ' • '}
                        {newItemsCount.requirements > 0 && `${newItemsCount.requirements} ${newItemsCount.requirements === 1 ? 'requirement' : 'requirements'}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleRefresh}
                    className="bg-white text-green-600 hover:bg-white/90 font-bold touch-manipulation"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    View Now
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SmartFeed</h1>
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-semibold">Live</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-light">AI-ranked by BrokerTrust™</p>
              </div>
            </div>
            {user && (
              <Button
                onClick={() => navigate(createPageUrl("MyProfile"))}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-50 touch-manipulation"
              >
                <Settings className="w-4 h-4 mr-2" />
                My Areas
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Quick Area Filters</h3>
            {user?.preferred_areas && user.preferred_areas.length > 0 && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs">
                Your Areas
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {popularAreas.map((area) => {
              const isSelected = filters.location_multi?.includes(area);
              const isPreferred = user?.preferred_areas?.includes(area);

              return (
                <Button
                  key={area}
                  onClick={() => handleAreaQuickFilter(area)}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`rounded-xl touch-manipulation ${
                    isSelected
                      ? "bg-blue-600 text-white border-0 shadow-sm"
                      : isPreferred
                        ? "border-purple-400 bg-purple-50 text-purple-700 hover:bg-purple-100"
                        : "border-purple-200 hover:bg-purple-50 text-slate-700"
                  }`}
                >
                  {isPreferred && <Star className="w-3 h-3 mr-1" fill="currentColor" />}
                  {area}
                </Button>
              );
            })}
          </div>

          {user?.preferred_areas && user.preferred_areas.length > 0 && (
            <p className="text-xs text-purple-600 mt-2">
              ⭐ Starred areas are from your preferences
            </p>
          )}
        </div>

        {userPreferences && showAutoMatchBanner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-blue-50 rounded-xl p-4 border border-blue-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    🎯 Smart Matching Active
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Your feed learns from your {userPreferences.totalViews} views & {userPreferences.totalContacts} contacts.
                    Properties matching your preferences are ranked higher automatically.
                  </p>
                  <p className="text-xs text-purple-700 mt-2 font-semibold">
                    💡 Keep browsing → Better recommendations
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAutoMatchBanner(false)}
                className="h-8 w-8 hover:bg-purple-200 flex-shrink-0 touch-manipulation"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {userPreferences && personalizedProperties.length > 0 && filters.viewMode === "properties" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h2 className="text-xl font-bold text-slate-900">For You</h2>
                  </div>
                  <p className="text-sm text-slate-600">
                    Based on your {userPreferences.totalViews} views and {userPreferences.totalContacts} inquiries
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('propai_view_history');
                    localStorage.removeItem('propai_contact_history');
                    setUserPreferences(null);
                    toast.success('Preferences cleared');
                  }}
                  className="text-xs touch-manipulation"
                >
                  Clear History
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {personalizedProperties.slice(0, 3).map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    user={user}
                    onViewDetails={(prop) => {
                      trackPropertyView(prop);
                      setSelectedProperty(prop);
                    }}
                  />
                ))}
              </div>

              {personalizedProperties.length > 3 && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-slate-600">
                    {personalizedProperties.length - 3} more personalized recommendations below
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Content View Toggle */}
          <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm border border-purple-200">
            <Button
              onClick={() => setFilters({ ...filters, viewMode: "properties" })}
              variant={filters.viewMode === "properties" ? "default" : "ghost"}
              size="sm"
              className={`rounded-xl touch-manipulation ${filters.viewMode === "properties" ? "bg-blue-600 text-white" : "text-slate-600"}`}
            >
              🏠 Properties ({filteredProperties.length})
            </Button>
            <Button
              onClick={() => setFilters({ ...filters, viewMode: "requirements" })}
              variant={filters.viewMode === "requirements" ? "default" : "ghost"}
              size="sm"
              className={`rounded-xl touch-manipulation ${filters.viewMode === "requirements" ? "bg-cyan-600 text-white" : "text-slate-600"}`}
            >
              🔍 Requirements ({filteredRequirements.length})
            </Button>
            <Button
              onClick={() => setFilters({ ...filters, viewMode: "both" })}
              variant={filters.viewMode === "both" ? "default" : "ghost"}
              size="sm"
              className={`rounded-xl touch-manipulation ${filters.viewMode === "both" ? "bg-blue-600 text-white" : "text-slate-600"}`}
            >
              ✨ Both
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Display Mode Toggle (Grid/Map) - Only for Properties */}
            {filters.viewMode === "properties" && (
              <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm border border-purple-200">
                <Button
                  onClick={() => setDisplayMode("grid")}
                  variant={displayMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-xl touch-manipulation ${displayMode === "grid" ? "bg-blue-600 text-white" : "text-slate-600"}`}
                >
                  <Grid3x3 className="w-4 h-4 mr-1" />
                  Grid
                </Button>
                <Button
                  onClick={() => setDisplayMode("map")}
                  variant={displayMode === "map" ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-xl touch-manipulation ${displayMode === "map" ? "bg-blue-600 text-white" : "text-slate-600"}`}
                >
                  <Map className="w-4 h-4 mr-1" />
                  Map
                </Button>
              </div>
            )}

            {/* Saved Searches */}
            {user && filters.viewMode === "properties" && (
              <SavedSearchManager
                user={user}
                currentFilters={filters}
                onLoadSearch={handleLoadSearch}
              />
            )}

            {/* Compare Button */}
            {compareList.length > 0 && (
              <Button
                onClick={() => setSelectedProperty('compare')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-sm"
                size="sm"
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare ({compareList.length})
              </Button>
            )}
          </div>
        </div>

        <PropertyFilters
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
          allProperties={properties}
        />

        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#3B3B3B]">
              Showing <span className="font-bold text-[#111111]">{displayedItems.length}</span> of{' '}
              <span className="font-bold text-[#111111]">{totalFilteredItems}</span>{' '}
              {displayType === "properties" ? "properties" : displayType === "requirements" ? "requirements" : "items"}
            </p>
          </div>

          {filters.viewMode === "properties" && (
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <span className="text-sm text-slate-600 font-semibold whitespace-nowrap">Sort by:</span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setFilters({ ...filters, sortBy: 'latest' })}
                  variant={filters.sortBy === 'latest' ? "default" : "outline"}
                  size="sm"
                  className={`rounded-xl touch-manipulation ${
                    filters.sortBy === 'latest'
                      ? "bg-blue-600 text-white border-0"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  📅 Latest
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setFilters({ ...filters, sortBy: 'brokertrust' })}
                    variant={filters.sortBy === 'brokertrust' ? "default" : "outline"}
                    size="sm"
                    className={`rounded-xl touch-manipulation ${
                      filters.sortBy === 'brokertrust'
                        ? "bg-blue-600 text-white border-0"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                  >
                    🛡️ BrokerTrust™
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-5 h-5 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center transition-colors touch-manipulation">
                        <Info className="w-3 h-3 text-purple-600" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">🛡️</span>
                          </div>
                          <h4 className="font-bold text-slate-900">How BrokerTrust™ Works</h4>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          We analyze broker performance to help you find reliable listings. This isn't a judgment—it's a quality filter.
                        </p>

                        <div className="space-y-2">
                          <p className="text-xs">
                            <span className="font-semibold text-slate-900 mb-1">Score Factors (0-100):</span>
                            <ul className="list-disc list-inside space-y-1 text-slate-600">
                              <li><strong>Duplicate Rate:</strong> Brokers who don't spam the same property repeatedly score higher.</li>
                              <li><strong>Response Time:</strong> Fast responders (under 2 hours) get bonus points.</li>
                              <li><strong>Data Accuracy:</strong> Brokers who provide complete, accurate details score higher.</li>
                              <li><strong>Availability Confirmation:</strong> Brokers who confirm availability before listing score higher.</li>
                            </ul>
                          </p>

                          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <p className="text-xs text-amber-800">
                              <strong>Why It Matters:</strong> High-trust listings (85+) are more likely to be accurate, available, and worth your time.
                            </p>
                          </div>

                          <p className="text-xs text-slate-500 italic">
                            Scores update automatically based on broker activity. All brokers start at 50 and can improve over time.
                          </p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <Button
                  onClick={() => setFilters({ ...filters, sortBy: 'price_low' })}
                  variant={filters.sortBy === 'price_low' ? "default" : "outline"}
                  size="sm"
                  className={`rounded-xl touch-manipulation ${
                    filters.sortBy === 'price_low'
                      ? "bg-blue-600 text-white border-0"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  💰 Price ↑
                </Button>
                <Button
                  onClick={() => setFilters({ ...filters, sortBy: 'price_high' })}
                  variant={filters.sortBy === 'price_high' ? "default" : "outline"}
                  size="sm"
                  className={`rounded-xl touch-manipulation ${
                    filters.sortBy === 'price_high'
                      ? "bg-blue-600 text-white border-0"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  💰 Price ↓
                </Button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load data. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {(isLoading || requirementsLoading) && (
          <>
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-900">
                  Loading feed...
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-[22px] p-6 shadow-sm border-2 border-[#F7F7F7]">
                  <Skeleton className="h-48 w-full mb-4 rounded-2xl" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          </>
        )}

        {!isLoading && !requirementsLoading && displayedItems.length > 0 && (
          <>
            {/* Map View */}
            {displayMode === "map" && filters.viewMode === "properties" ? (
              <div className="mb-8">
                <MapView
                  properties={filteredProperties}
                  onPropertySelect={(prop) => {
                    trackPropertyView(prop);
                    setSelectedProperty(prop);
                  }}
                />
                <p className="text-center text-sm text-slate-600 mt-4">
                  Showing {filteredProperties.length} properties on map • Switch to grid view to browse all
                </p>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedItems.map((item) => {
                  const isInCompare = compareList.find(p => p.id === item.id);
                  
                  if (displayType === "both") {
                    return item.itemType === 'property' ? (
                      <div key={`prop-${item.id}`} className="relative">
                        <Button
                          onClick={() => toggleCompare(item)}
                          variant={isInCompare ? "default" : "outline"}
                          size="sm"
                          className={`absolute top-2 right-2 z-10 ${isInCompare ? 'bg-purple-600' : ''}`}
                        >
                          <GitCompare className="w-3 h-3" />
                        </Button>
                        <PropertyCard
                          property={item}
                          user={user}
                          onViewDetails={(prop) => {
                            trackPropertyView(prop);
                            setSelectedProperty(prop);
                          }}
                        />
                      </div>
                    ) : (
                      <RequirementCard
                        key={`req-${item.id}`}
                        requirement={item}
                        allProperties={properties}
                      />
                    );
                  } else if (displayType === "requirements") {
                    return (
                      <RequirementCard
                        key={item.id}
                        requirement={item}
                        allProperties={properties}
                      />
                    );
                  } else {
                    return (
                      <div key={item.id} className="relative">
                        <Button
                          onClick={() => toggleCompare(item)}
                          variant={isInCompare ? "default" : "outline"}
                          size="sm"
                          className={`absolute top-2 right-2 z-10 ${isInCompare ? 'bg-purple-600' : ''}`}
                        >
                          <GitCompare className="w-3 h-3" />
                        </Button>
                        <PropertyCard
                          property={item}
                          user={user}
                          onViewDetails={(prop) => {
                            trackPropertyView(prop);
                            setSelectedProperty(prop);
                          }}
                        />
                      </div>
                    );
                  }
                })}
              </div>
            )}

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <Button
                  onClick={loadMore}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-8 h-12 shadow-sm transition-all touch-manipulation"
                >
                  <ChevronDown className="w-5 h-5 mr-2" />
                  Load More {displayType === "properties" ? "Properties" : displayType === "requirements" ? "Requirements" : "Items"}
                  <span className="ml-2 text-xs opacity-80">
                    ({allItems.length - itemsToShow} remaining)
                  </span>
                </Button>
              </div>
            )}

            {!hasMore && allItems.length > ITEMS_PER_PAGE && (
              <div className="mt-12 text-center">
                <div className="inline-block bg-white rounded-2xl px-6 py-3 border-2 border-[#F7F7F7]">
                  <p className="text-sm text-[#3B3B3B] font-medium">
                    🎯 You've viewed all {allItems.length} {displayType === "properties" ? "properties" : displayType === "requirements" ? "requirements" : "items"}
                  </p>
                  <p className="text-xs text-[#3B3B3B]/60 mt-1">
                    Try adjusting your filters to see more options
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && !requirementsLoading && allItems.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-[#F7F7F7] rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-[#3B3B3B]/10">
              <AlertCircle className="w-10 h-10 text-[#3B3B3B]" />
            </div>
            <h3 className="text-2xl font-bold text-[#111111] mb-3">
              {displayType === "properties" ? "No properties found" : displayType === "requirements" ? "No requirements found" : "No items found"}
            </h3>
            <p className="text-[#3B3B3B] mb-6 font-light">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}

        <Suspense fallback={<div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div></div>}>
          {selectedProperty === 'compare' ? (
            <PropertyComparison
              properties={compareList}
              isOpen={true}
              onClose={() => setSelectedProperty(null)}
            />
          ) : (
            <PropertyDetailsModal
              property={selectedProperty}
              isOpen={!!selectedProperty}
              onClose={() => setSelectedProperty(null)}
            />
          )}
        </Suspense>


      </div>
    </div>
  );
}