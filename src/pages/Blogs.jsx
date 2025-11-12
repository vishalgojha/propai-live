import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, Search, TrendingUp, Home as HomeIcon,
  Globe, FileText, Clock, ArrowRight, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import SEO from "../components/SEO";
import AIBlogCreator from "../components/admin/AIBlogCreator";

export default function Blogs() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);

  // Check if user is admin
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    loadUser();
  }, []);

  // Read category from URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []);

  // ⚡ OPTIMIZATION: Aggressive caching for blogs (10 min stale time)
  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => base44.entities.Blog.filter({ status: "Published" }, "-created_date"),
    initialData: [],
    staleTime: 10 * 60 * 1000, // ⚡ 10 minutes - blogs are mostly static
    cacheTime: 20 * 60 * 1000, // ⚡ 20 minutes in cache
    refetchOnWindowFocus: false,
  });

  const categories = [
    { name: "All Posts", value: "all", icon: BookOpen },
    { name: "Neighborhood Guides", value: "Neighborhood Guide", icon: HomeIcon },
    { name: "Expat Series", value: "Expat Series", icon: Globe },
    { name: "Market Insights", value: "Market Insights", icon: TrendingUp },
    { name: "Rental & Legal", value: "Rental & Legal", icon: FileText },
  ];

  // ⚡ OPTIMIZATION: Memoize filtered blogs to avoid recalculation on every render
  const filteredBlogs = useMemo(() => {
    return blogs.filter(blog => {
      const matchesCategory = selectedCategory === "all" || blog.category === selectedCategory;
      const matchesSearch = !searchQuery ||
        blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [blogs, selectedCategory, searchQuery]);

  const featuredBlog = blogs.find(b => b.featured) || blogs[0];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://propai.live"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Insights",
        "item": "https://propai.live/insights"
      }
    ]
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <SEO
        title="PropAI Insights | Mumbai Real Estate Guides & Market Data"
        description="Neighborhood guides, expat survival tips, rental laws & market trends — written for people who want honest Mumbai real estate advice, not sales pitches."
        schema={breadcrumbSchema}
        canonical="https://propai.live/insights"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">

        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">PropAI Insights</h1>
                <p className="text-sm text-slate-600 font-light">Mumbai real estate knowledge, simplified</p>
              </div>
            </div>
            
            {/* ✅ AI Blog Creator (Admin Only) */}
            {isAdmin && <AIBlogCreator />}
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 border-purple-200 focus-visible:ring-purple-500 h-12 rounded-2xl"
            />
          </div>
        </div>

        {/* Featured Post */}
        {featuredBlog && !searchQuery && selectedCategory === "all" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl border border-purple-200 cursor-pointer hover:shadow-2xl transition-all"
            onClick={() => navigate(createPageUrl("BlogPost") + `?slug=${featuredBlog.slug}`)}
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-64 md:h-auto bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                {featuredBlog.featured_image ? (
                  <img
                    src={featuredBlog.featured_image}
                    alt={featuredBlog.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles className="w-20 h-20 text-purple-500" />
                )}
              </div>
              <div className="p-8 flex flex-col justify-center">
                <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 w-fit font-bold shadow-md">
                  ⭐ Featured
                </Badge>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3 leading-tight">
                  {featuredBlog.title}
                </h2>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  {featuredBlog.excerpt}
                </p>
                <div className="flex items-center flex-wrap gap-3 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredBlog.read_time || 5} min read
                  </span>
                  <span>{format(new Date(featuredBlog.created_date), "MMM dd, yyyy")}</span>
                </div>
                <Button className="w-fit bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-md">
                  Read Article
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.value;
            return (
              <Button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                variant={isSelected ? "default" : "outline"}
                className={`flex items-center justify-start gap-2 rounded-2xl font-semibold h-12 w-full transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md"
                    : "border-purple-200 hover:bg-purple-50 text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </Button>
            );
          })}
        </div>

        {/* Blog Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-purple-200/50">
                <Skeleton className="h-48 w-full mb-4 rounded-2xl" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No articles found</h3>
            <p className="text-slate-600">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-purple-200/50 hover:border-purple-400 cursor-pointer"
                onClick={() => navigate(createPageUrl("BlogPost") + `?slug=${blog.slug}`)}
              >
                <div className="h-48 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                  {blog.featured_image ? (
                    <img
                      src={blog.featured_image}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-purple-500" />
                  )}
                </div>

                <div className="p-6">
                  <Badge className="mb-3 bg-purple-100 text-purple-800 border-purple-300 font-semibold text-xs">
                    {blog.category}
                  </Badge>

                  <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight line-clamp-2">
                    {blog.title}
                  </h3>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    {blog.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {blog.read_time || 5} min
                    </span>
                    <span>{format(new Date(blog.created_date), "MMM dd")}</span>
                  </div>

                  {blog.ai_generated && (
                    <Badge variant="outline" className="mt-3 text-xs border-purple-200 text-purple-700">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Verified
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}