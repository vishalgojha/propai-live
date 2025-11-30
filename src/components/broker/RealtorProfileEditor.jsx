import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User, Camera, Palette, Link2, Instagram, Facebook, 
  Linkedin, Twitter, Youtube, Globe, Plus, Trash2, Save, Eye
} from "lucide-react";
import { toast } from "sonner";

const THEMES = [
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
  { value: "pink", label: "Pink", color: "bg-pink-500" },
  { value: "dark", label: "Dark", color: "bg-slate-800" },
];

export default function RealtorProfileEditor({ broker, onClose, onUpdated }) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    slug: broker?.slug || '',
    tagline: broker?.tagline || '',
    bio: broker?.bio || '',
    profile_photo: broker?.profile_photo || '',
    cover_photo: broker?.cover_photo || '',
    profile_theme: broker?.profile_theme || 'purple',
    social_links: broker?.social_links || {},
    custom_links: broker?.custom_links || []
  });

  const [newLink, setNewLink] = useState({ title: '', url: '' });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Broker.update(broker.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['broker']);
      toast.success('Profile updated!');
      onUpdated?.();
      onClose?.();
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    }
  });

  const generateSlug = () => {
    if (!broker?.name) return;
    const slug = broker.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    setFormData({ ...formData, slug });
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        [type]: result.file_url
      });
      toast.success('Photo uploaded!');
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    }
  };

  const addCustomLink = () => {
    if (!newLink.title || !newLink.url) return;
    setFormData({
      ...formData,
      custom_links: [...formData.custom_links, { ...newLink }]
    });
    setNewLink({ title: '', url: '' });
  };

  const removeCustomLink = (idx) => {
    setFormData({
      ...formData,
      custom_links: formData.custom_links.filter((_, i) => i !== idx)
    });
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const getProfileUrl = () => {
    const slug = formData.slug || broker?.id;
    return `${window.location.origin}/r?u=${slug}`;
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      {/* Profile URL */}
      <div>
        <Label className="mb-2 block">Profile URL</Label>
        <div className="flex gap-2">
          <div className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-sm">
            <span className="text-slate-500">{window.location.origin}/r?u=</span>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="inline-block w-32 border-0 bg-transparent p-0 h-auto text-slate-900 font-semibold"
              placeholder="your-name"
            />
          </div>
          <Button variant="outline" size="sm" onClick={generateSlug}>
            Auto-generate
          </Button>
        </div>
      </div>

      {/* Theme */}
      <div>
        <Label className="mb-2 block">Profile Theme</Label>
        <div className="flex gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setFormData({ ...formData, profile_theme: theme.value })}
              className={`w-10 h-10 rounded-xl ${theme.color} ${
                formData.profile_theme === theme.value 
                  ? 'ring-2 ring-offset-2 ring-slate-900' 
                  : ''
              }`}
              title={theme.label}
            />
          ))}
        </div>
      </div>

      {/* Photos */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block">Profile Photo</Label>
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
              {formData.profile_photo ? (
                <img src={formData.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'profile_photo')} />
            </label>
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Cover Photo</Label>
          <div className="relative">
            <div className="w-full h-24 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
              {formData.cover_photo ? (
                <img src={formData.cover_photo} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <label className="absolute bottom-2 right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'cover_photo')} />
            </label>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div>
        <Label className="mb-2 block">Tagline</Label>
        <Input
          value={formData.tagline}
          onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
          placeholder="e.g., Your Trusted Mumbai Property Expert"
          maxLength={100}
        />
      </div>

      {/* Bio */}
      <div>
        <Label className="mb-2 block">Bio</Label>
        <Textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Tell clients about yourself..."
          rows={3}
          maxLength={300}
        />
        <p className="text-xs text-slate-500 mt-1">{formData.bio.length}/300</p>
      </div>

      {/* Social Links */}
      <div>
        <Label className="mb-2 block">Social Links</Label>
        <div className="space-y-2">
          {[
            { key: 'instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
            { key: 'facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
            { key: 'linkedin', icon: Linkedin, placeholder: 'https://linkedin.com/in/...' },
            { key: 'youtube', icon: Youtube, placeholder: 'https://youtube.com/@...' },
            { key: 'website', icon: Globe, placeholder: 'https://yourwebsite.com' },
          ].map(({ key, icon: Icon, placeholder }) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-slate-600" />
              </div>
              <Input
                value={formData.social_links?.[key] || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social_links: { ...formData.social_links, [key]: e.target.value }
                })}
                placeholder={placeholder}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Custom Links */}
      <div>
        <Label className="mb-2 block">Custom Links</Label>
        {formData.custom_links.length > 0 && (
          <div className="space-y-2 mb-3">
            {formData.custom_links.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{link.title}</p>
                  <p className="text-xs text-slate-500 truncate">{link.url}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeCustomLink(idx)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={newLink.title}
            onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
            placeholder="Link title"
            className="flex-1"
          />
          <Input
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            placeholder="URL"
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={addCustomLink} disabled={!newLink.title || !newLink.url}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open(getProfileUrl(), '_blank')}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
      </div>
    </div>
  );
}