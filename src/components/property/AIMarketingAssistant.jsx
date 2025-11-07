import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, RefreshCw, Check, Copy, FileText, Package, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AIMarketingAssistant({ 
  property, 
  isOpen, 
  onClose, 
  onApplyTitle, 
  onApplyDescription 
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [contentTypes, setContentTypes] = useState(['all']);
  const [style, setStyle] = useState('professional');

  const handleGenerate = async () => {
    if (!property) return;

    setLoading(true);
    setResults(null);

    try {
      toast.loading('🤖 AI generating marketing content...', { id: 'ai-assistant' });

      const response = await base44.functions.invoke('propertyAIAssistant', {
        property_id: property.id,
        content_types: contentTypes,
        style: style
      });

      toast.dismiss('ai-assistant');

      if (response.data.success) {
        setResults(response.data.content);
        toast.success('✅ AI Marketing Content Generated!', {
          description: 'Review and apply the suggestions below',
          duration: 5000,
          className: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0'
        });
      } else {
        throw new Error(response.data.error || 'Generation failed');
      }
    } catch (error) {
      toast.dismiss('ai-assistant');
      toast.error('❌ AI Generation Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Marketing Assistant
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            {property.custom_id} • {property.bhk} in {property.location}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Type Selection */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              What would you like to generate?
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: '✨ Everything' },
                { value: 'titles', label: '📝 Titles' },
                { value: 'descriptions', label: '📄 Descriptions' },
                { value: 'tags', label: '🏷️ Tags' },
                { value: 'video_scripts', label: '🎬 Video Scripts' },
                { value: 'social_media', label: '📱 Social Media' },
              ].map((type) => (
                <Button
                  key={type.value}
                  onClick={() => {
                    if (type.value === 'all') {
                      setContentTypes(['all']);
                    } else {
                      setContentTypes(prev => {
                        const filtered = prev.filter(t => t !== 'all');
                        if (filtered.includes(type.value)) {
                          return filtered.filter(t => t !== type.value);
                        }
                        return [...filtered, type.value];
                      });
                    }
                  }}
                  size="sm"
                  variant={contentTypes.includes(type.value) || contentTypes.includes('all') ? "default" : "outline"}
                  className={contentTypes.includes(type.value) || contentTypes.includes('all') ? "bg-purple-600 text-white" : ""}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              Content Style:
            </label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="casual">Casual/Friendly</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white h-12 font-semibold"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Marketing Content
              </>
            )}
          </Button>

          {/* Results Display */}
          {results && (
            <div className="space-y-6 border-t border-slate-200 pt-6">
              {/* Titles */}
              {results.titles && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Title Options
                  </h4>
                  <div className="space-y-2">
                    {results.titles.map((titleObj, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-3 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Badge className="mb-2 text-xs">{titleObj.style}</Badge>
                          <p className="text-sm text-slate-700">{titleObj.title}</p>
                        </div>
                        <Button
                          onClick={() => onApplyTitle(titleObj.title)}
                          size="sm"
                          variant="outline"
                          className="flex-shrink-0"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Descriptions */}
              {results.descriptions && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Description Options
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(results.descriptions).map(([styleKey, description]) => (
                      <div key={styleKey} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="text-xs capitalize">{styleKey}</Badge>
                          <Button
                            onClick={() => onApplyDescription(description)}
                            size="sm"
                            variant="outline"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {results.tags && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    Suggested Tags
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(results.tags).map(([category, tags]) => (
                      <div key={category} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-600 mb-2 capitalize">
                          {category.replace(/_/g, ' ')}:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Scripts */}
              {results.video_scripts && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                    Property Tour Video Scripts
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(results.video_scripts).map(([duration, script]) => (
                      <div key={duration} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <Badge className="text-xs mb-1">{duration.replace('_', ' ')}</Badge>
                            <p className="text-sm font-semibold text-slate-900">{script.title}</p>
                          </div>
                          <Button
                            onClick={() => {
                              const fullScript = `${script.hook}\n\n${script.script}\n\n${script.cta}`;
                              navigator.clipboard.writeText(fullScript);
                              toast.success('Script copied!');
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="space-y-2 text-sm text-slate-700">
                          <div>
                            <p className="text-xs font-semibold text-purple-600 mb-1">HOOK:</p>
                            <p className="italic">{script.hook}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-purple-600 mb-1">SCRIPT:</p>
                            <p className="whitespace-pre-line">{script.script}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-purple-600 mb-1">CALL-TO-ACTION:</p>
                            <p>{script.cta}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media Captions */}
              {results.social_media && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-purple-600" />
                    Social Media Captions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(results.social_media).map(([platform, content]) => (
                      <div key={platform} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="text-xs capitalize">{platform}</Badge>
                          <Button
                            onClick={() => {
                              const fullCaption = `${content.caption}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`;
                              navigator.clipboard.writeText(fullCaption);
                              toast.success(`${platform} caption copied!`);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{content.caption}</p>
                        <div className="flex flex-wrap gap-1">
                          {content.hashtags.slice(0, 5).map((tag, idx) => (
                            <span key={idx} className="text-xs text-purple-600">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}