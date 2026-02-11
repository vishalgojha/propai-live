import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Key, Copy, RefreshCw, Trash2, Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function APIKeyManager() {
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBrokerId, setSelectedBrokerId] = useState("");
  const [notes, setNotes] = useState("");
  const [generatedKey, setGeneratedKey] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch API keys
  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('apikeys/listKeys');
      return data.keys || [];
    },
    enabled: user?.role === 'admin'
  });

  // Fetch brokers for dropdown
  const { data: brokers = [] } = useQuery({
    queryKey: ['brokers-for-keys'],
    queryFn: () => base44.entities.Person.list('-created_date', 100),
    enabled: user?.role === 'admin'
  });

  const createKeyMutation = useMutation({
    mutationFn: async ({ broker_person_id, notes }) => {
      const { data } = await base44.functions.invoke('apikeys/createKey', {
        broker_person_id,
        notes
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedKey(data.key);
        setShowCreateModal(false);
        queryClient.invalidateQueries({ queryKey: ['api-keys'] });
        toast.success('API key created successfully');
      } else {
        toast.error(data.error || 'Failed to create key');
      }
    }
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (key_id) => {
      const { data } = await base44.functions.invoke('apikeys/revokeKey', { key_id });
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['api-keys'] });
        toast.success('Key revoked');
      } else {
        toast.error(data.error);
      }
    }
  });

  const rotateKeyMutation = useMutation({
    mutationFn: async (key_id) => {
      const { data } = await base44.functions.invoke('apikeys/rotateKey', { key_id });
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedKey(data.new_key);
        queryClient.invalidateQueries({ queryKey: ['api-keys'] });
        toast.success('Key rotated successfully');
      } else {
        toast.error(data.error);
      }
    }
  });

  const handleCreateKey = () => {
    if (!selectedBrokerId) {
      toast.error('Please select a broker');
      return;
    }
    createKeyMutation.mutate({ broker_person_id: selectedBrokerId, notes });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Shield className="w-16 h-16 mx-auto text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h1>
        <p className="text-slate-600">This page is only accessible to administrators.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Key className="w-8 h-8 text-blue-600" />
            API Key Manager
          </h1>
          <p className="text-slate-600 mt-2">Manage PropAI API keys for broker integrations</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Key className="w-4 h-4 mr-2" />
          Create New Key
        </Button>
      </div>

      {/* Generated Key Display */}
      {generatedKey && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <AlertTriangle className="w-5 h-5" />
              Save This Key - It Will Not Be Shown Again
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={showKey ? generatedKey : '•'.repeat(generatedKey.length)}
                readOnly
                className="font-mono text-sm bg-white"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(generatedKey)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-green-700 mt-2">
              Copy this key now. You won't be able to see it again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Keys List */}
      <div className="grid gap-4">
        {isLoading ? (
          <p className="text-slate-600">Loading keys...</p>
        ) : keys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Key className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600">No API keys created yet.</p>
            </CardContent>
          </Card>
        ) : (
          keys.map((key) => (
            <Card key={key.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">
                        {key.key_prefix}...
                      </code>
                      <Badge variant={key.status === 'active' ? 'default' : 'destructive'}>
                        {key.status}
                      </Badge>
                    </div>
                    <p className="font-semibold text-slate-900">{key.broker_name}</p>
                    {key.broker_email && (
                      <p className="text-sm text-slate-600">{key.broker_email}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>Created: {new Date(key.created_date).toLocaleDateString()}</span>
                      {key.last_used_at && (
                        <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                      )}
                      <span>Usage: {key.usage_count || 0}</span>
                    </div>
                    {key.notes && (
                      <p className="text-xs text-slate-600 mt-2 italic">{key.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {key.status === 'active' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rotateKeyMutation.mutate(key.id)}
                          disabled={rotateKeyMutation.isPending}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Rotate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => revokeKeyMutation.mutate(key.id)}
                          disabled={revokeKeyMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Revoke
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Key Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Broker</Label>
              <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select broker..." />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map(broker => (
                    <SelectItem key={broker.id} value={broker.id}>
                      {broker.name} {broker.email && `(${broker.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., For production use, testing, etc."
              />
            </div>
            <Button
              onClick={handleCreateKey}
              disabled={createKeyMutation.isPending || !selectedBrokerId}
              className="w-full"
            >
              {createKeyMutation.isPending ? 'Creating...' : 'Create API Key'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}