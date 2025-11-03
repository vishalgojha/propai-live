
import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PropertyCard from "../components/property/PropertyCard";
import { 
  ArrowLeft, Clock, Share2, Eye, Sparkles,
  MessageCircle, Calendar
} from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import SEO from "../components/SEO";

export default function BlogPost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const { data: blogs = [] } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => base44.entities.Blog.filter({ status: "Published" }),
    initialData: [],
  });

  const blog = blogs.find(b => b.slug === slug);

  const { data: relatedProperties = [] } = useQuery({
    queryKey: ['related-properties', blog?.related_locations],
    queryFn: async () => {
      if (!blog?.related_locations || blog.related_locations.length === 0) return [];
      const props = await base44.entities.Property.filter({ status: "Active" });
      return props.filter(p => 
        blog.related_locations.some(loc => 
          p.location?.toLowerCase().includes(loc.toLowerCase()) ||
          p.pocket?.toLowerCase().includes(loc.toLowerCase())
        )
      ).slice(0, 3);
    },
    enabled: !!blog?.related_locations,
    initialData: [],
  });

  const incrementViewsMutation = useMutation({
    mutationFn: (blogId) => base44.entities.Blog.update(blogId, { 
      views_count: (blog.views_count || 0) + 1 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });

  useEffect(() => {
    if (blog && !sessionStorage.getItem(`viewed-blog-${blog.id}`)) {
      incrementViewsMutation.mutate(blog.id);
      sessionStorage.setItem(`viewed-blog-${blog.id}`, 'true');
    }
  }, [blog?.id]);

  const handleShare = async () => {
    const shareData = {
      title: blog.title,
      text: blog.excerpt,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleWhatsApp = () => {
    const message = `Check out this article from Chariot Realty:\n\n${blog.title}\n\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const articleSchema = blog ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": blog.title,
        "description": blog.excerpt,
        "image": blog.featured_image || "https://chariotrealty.com/og-default.jpg",
        "datePublished": blog.created_date,
        "dateModified": blog.updated_date || blog.created_date,
        "author": {
          "@type": blog.author === "Chariot AI" ? "Organization" : "Person",
          "name": blog.author || "Chariot Realty"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Chariot Realty",
          "logo": {
            "@type": "ImageObject",
            "url": "https://chariotrealty.com/logo.png"
          }
        },
        "articleSection": blog.category,
        "keywords": blog.tags?.join(", "),
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://chariotrealty.com/insights/${blog.slug}`
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://chariotrealty.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Insights",
            "item": "https://chariotrealty.com/insights"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": blog.title,
            "item": `https://chariotrealty.com/insights/${blog.slug}`
          }
        ]
      }
    ]
  } : null;

  if (!slug) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#111111] mb-4">Blog post not found</h2>
          <Button onClick={() => navigate(createPageUrl("Blogs"))}>
            Back to Blogs
          </Button>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96 w-full mb-8 rounded-3xl" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {blog && (
        <SEO
          title={`${blog.title} | Chariot Insights`}
          description={blog.excerpt || blog.title}
          ogImage={blog.featured_image}
          schema={articleSchema}
          canonical={`https://chariotrealty.com/insights/${blog.slug}`}
        />
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <Button
          onClick={() => navigate(createPageUrl("Blogs"))}
          variant="ghost"
          className="mb-6 text-[#3B3B3B] hover:text-[#111111] hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Insights
        </Button>

        {/* Hero Image */}
        {blog.featured_image ? (
          <div className="h-96 rounded-3xl overflow-hidden mb-8 shadow-xl">
            <img 
              src={blog.featured_image} 
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-96 rounded-3xl bg-gradient-to-br from-[#FFD300]/20 to-[#FFC700]/20 flex items-center justify-center mb-8 border-2 border-[#FFD300]/30">
            <Sparkles className="w-32 h-32 text-[#FFD300]" />
          </div>
        )}

        {/* Article Header */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border-2 border-[#F7F7F7]">
          <Badge className="mb-4 bg-[#FFD300] text-black border-0 font-bold">
            {blog.category}
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold text-[#111111] mb-6 leading-tight">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[#3B3B3B]/60 mb-6 pb-6 border-b border-gray-100">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(blog.created_date), "MMMM dd, yyyy")}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {blog.read_time || 5} min read
            </span>
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {blog.views_count || 0} views
            </span>
            {blog.ai_generated && (
              <Badge variant="outline" className="border-[#3B3B3B]/20">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Verified Data
              </Badge>
            )}
          </div>

          {/* Share Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-[#3B3B3B]/20 hover:bg-[#F7F7F7] font-semibold rounded-2xl"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleWhatsApp}
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-2xl"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border-2 border-[#F7F7F7]">
          <ReactMarkdown 
            className="prose prose-lg max-w-none
              prose-headings:text-[#111111] prose-headings:font-bold
              prose-p:text-[#3B3B3B] prose-p:leading-relaxed
              prose-a:text-[#FFD300] prose-a:font-semibold hover:prose-a:text-[#FFC700]
              prose-strong:text-[#111111]
              prose-ul:text-[#3B3B3B]
              prose-ol:text-[#3B3B3B]
              prose-blockquote:border-l-[#FFD300] prose-blockquote:bg-[#FFD300]/10 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-2xl
              prose-code:bg-[#F7F7F7] prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:text-[#111111]"
          >
            {blog.content}
          </ReactMarkdown>
        </div>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="bg-white rounded-3xl p-6 mb-8 shadow-sm border-2 border-[#F7F7F7]">
            <h3 className="text-sm font-bold text-[#3B3B3B] mb-3 uppercase tracking-wide">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, idx) => (
                <Badge 
                  key={idx}
                  variant="outline"
                  className="border-[#FFD300] text-[#111111] font-semibold"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Related Properties */}
        {relatedProperties.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#111111]">Related Properties</h2>
              <Button
                onClick={() => navigate(createPageUrl("SmartFeed"))}
                variant="outline"
                className="border-[#3B3B3B]/20 hover:bg-[#FFD300] hover:text-black hover:border-[#FFD300] font-semibold"
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-br from-[#FFD300] to-[#FFC700] rounded-3xl p-8 text-center shadow-xl">
          <h3 className="text-2xl font-bold text-black mb-3">
            Looking for Properties in Mumbai?
          </h3>
          <p className="text-black/70 mb-6 font-medium">
            Connect with Chariot Realty for personalized property recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate(createPageUrl("SmartFeed"))}
              className="bg-white text-black hover:bg-gray-100 font-bold rounded-2xl"
            >
              Browse Properties
            </Button>
            <Button
              onClick={() => window.open('https://wa.me/919819471310', '_blank')}
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-2xl"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
