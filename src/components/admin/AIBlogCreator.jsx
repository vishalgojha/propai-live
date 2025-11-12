import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, CheckCircle2, BookOpen, Wand2, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

export default function AIBlogCreator() {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Form inputs
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("Neighborhood Guide");
  const [customPrompt, setCustomPrompt] = useState("");
  
  // Generated content
  const [generatedContent, setGeneratedContent] = useState(null);

  const categories = [
    "Neighborhood Guide",
    "Rental & Legal",
    "Expat Series",
    "Market Insights",
    "Real Stories"
  ];

  const exampleTopics = [
    "Living in Pali Hill: What ₹3L/month gets you",
    "Khar West vs Bandra West: The real difference",
    "Expat guide: First week in Mumbai",
    "11-month leases explained (no BS)",
    "Why BKC rents are dropping in 2025"
  ];

  const generateBlog = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const prompt = customPrompt || `Write a blog post about: "${topic}"

Category: ${category}

Follow these rules:
- Sharp, witty tone (like texting a smart friend)
- Call out real estate BS (no "luxury", "premium" fluff)
- Include real data/numbers where relevant
- Short paragraphs (2-4 sentences max)
- Use tables for comparisons
- Start with a truth bomb or question
- Have strong opinions (backed by data)
- Make it sharable

Structure:
1. Hook opening (1 paragraph)
2. Main content with subheadings
3. Myth-busting section (if relevant)
4. Actionable closing

Provide JSON output with:
- title (catchy, includes year if relevant)
- excerpt (150-160 chars, with personality)
- content (full markdown blog post)
- tags (mix of serious + casual)
- read_time (estimate in minutes)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            excerpt: { type: "string" },
            content: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            read_time: { type: "number" }
          },
          required: ["title", "excerpt", "content"]
        }
      });

      setGeneratedContent(response);
      
      toast.success("✨ Blog Generated!", {
        description: "Review and publish when ready",
        duration: 3000
      });

    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate blog", {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const publishBlog = async () => {
    if (!generatedContent) return;

    setIsPublishing(true);

    try {
      const slug = generatedContent.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      await base44.entities.Blog.create({
        title: generatedContent.title,
        slug,
        category,
        excerpt: generatedContent.excerpt,
        content: generatedContent.content,
        tags: generatedContent.tags || [],
        read_time: generatedContent.read_time || 5,
        status: "Published",
        author: "Chariot AI",
        ai_generated: true,
        featured: false
      });

      toast.success("🎉 Blog Published!", {
        description: "Live on PropAI Insights",
        duration: 5000
      });

      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      
      // Reset form
      setTopic("");
      setCustomPrompt("");
      setGeneratedContent(null);
      setIsExpanded(false);

    } catch (error) {
      console.error("Publishing failed:", error);
      toast.error("Failed to publish", {
        description: error.message
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        AI Blog Creator
      </Button>
    );
  }

  return (
    <Card className="p-6 mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">AI Blog Creator</h3>
            <p className="text-sm text-slate-600">Generate sassy, data-driven Mumbai real estate content</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setIsExpanded(false);
            setGeneratedContent(null);
          }}
          variant="ghost"
          size="icon"
          className="hover:bg-purple-100"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Input Form */}
      {!generatedContent ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-900 mb-2 block">
              Topic / Title Idea
            </label>
            <Input
              placeholder="e.g., Living in Pali Hill: What ₹3L/month gets you"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="border-purple-200 focus-visible:ring-purple-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              💡 Example topics:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {exampleTopics.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setTopic(example)}
                  className="text-xs bg-white border border-purple-200 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900 mb-2 block">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-purple-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900 mb-2 block">
              Custom Prompt (Optional)
            </label>
            <Textarea
              placeholder="Add specific instructions, data points, or angle..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="border-purple-200 focus-visible:ring-purple-500 h-24"
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave empty to use default prompt (witty, data-driven, BS-free)
            </p>
          </div>

          <Button
            onClick={generateBlog}
            disabled={isGenerating || !topic.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12 rounded-xl shadow-md"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Blog Post
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Generated Content Preview */}
          <div className="bg-white rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-purple-600 text-white border-0">
                {category}
              </Badge>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(generatedContent.title)}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy Title
                </button>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3 leading-tight">
              {generatedContent.title}
            </h2>

            <p className="text-slate-600 mb-4 italic">
              {generatedContent.excerpt}
            </p>

            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4 pb-4 border-b border-slate-200">
              <span>📖 {generatedContent.read_time || 5} min read</span>
              <span>🤖 AI Generated</span>
              <span>✨ PropAI Voice</span>
            </div>

            {generatedContent.tags && generatedContent.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {generatedContent.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto prose prose-sm max-w-none">
              <ReactMarkdown>{generatedContent.content}</ReactMarkdown>
            </div>

            <button
              onClick={() => copyToClipboard(generatedContent.content)}
              className="w-full mt-4 text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center justify-center gap-2 py-2 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Full Content
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={publishBlog}
              disabled={isPublishing}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-12 rounded-xl shadow-md"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Publish to PropAI Insights
                </>
              )}
            </Button>

            <Button
              onClick={() => {
                setGeneratedContent(null);
                setTopic("");
                setCustomPrompt("");
              }}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Start Over
            </Button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              ⚠️ Review AI content before publishing. Check facts, pricing, and ensure the tone matches PropAI's voice.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}