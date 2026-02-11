import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  AlertTriangle,
  Lock,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

export default function LicenseAdmin() {
  const [adminSecret, setAdminSecret] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [generatedKey, setGeneratedKey] = useState(null);
  const [showKey, setShowKey] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    plan: "",
    expires_at: "",
    max_devices: 1,
    notes: ""
  });

  const queryClient = useQueryClient();

  // Fetch licenses
  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['licenses', statusFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const { data } = await base44.functions.invoke('licenses/list', {}, {
        headers: { 'x-admin-secret': adminSecret }
      });

      if (!data.ok) throw new Error(data.error);
      return data.licenses || [];
    },
    enabled: isAuthenticated
  });

  const createLicenseMutation = useMutation({
    mutationFn: async (licenseData) => {
      const { data } = await base44.functions.invoke('licenses/create', licenseData, {
        headers: { 'x-admin-secret': adminSecret }
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.ok) {
        setGeneratedKey(data.key);
        setShowCreateModal(false);
        queryClient.invalidateQueries({ queryKey: ['licenses'] });
        toast.success('License created successfully');
        setFormData({
          customer_name: "",
          customer_email: "",
          plan: "",
          expires_at: "",
          max_devices: 1,
          notes: ""
        });
      } else {
        toast.error(data.error || 'Failed to create license');
      }
    }
  });

  const revokeLicenseMutation = useMutation({
    mutationFn: async (license_id) => {
      const { data } = await base44.functions.invoke('licenses/revoke', { license_id }, {
        headers: { 'x-admin-secret': adminSecret }
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.ok) {
        queryClient.invalidateQueries({ queryKey: ['licenses'] });
        toast.success('License revoked');
      } else {
        toast.error(data.error);
      }
    }
  });

  const handleLogin = () => {
    if (!adminSecret) {
      toast.error('Please enter admin secret');
      return;
    }
    setIsAuthenticated(true);
  };

  const handleCreateLicense = () => {
    createLicenseMutation.mutate(formData);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Admin gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-9 h-9 text-white" />
            </div>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>Enter the admin secret to manage licenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Admin Secret</Label>
              <Input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Enter admin secret"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full bg-slate-900 hover:bg-slate-800">
              <Shield className="w-4 h-4 mr-2" />
              Authenticate
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-slate-900" />
              License Management
            </h1>
            <p className="text-slate-600 mt-2">Create and manage PropAI licenses</p>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" />
                Create License
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New License</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Customer Email</Label>
                  <Input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Plan</Label>
                  <Input
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    placeholder="Pro, Enterprise, Trial..."
                  />
                </div>
                <div>
                  <Label>Expires At (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Max Devices</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_devices}
                    onChange={(e) => setFormData({ ...formData, max_devices: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes..."
                  />
                </div>
                <Button
                  onClick={handleCreateLicense}
                  disabled={createLicenseMutation.isPending}
                  className="w-full"
                >
                  {createLicenseMutation.isPending ? 'Creating...' : 'Create License'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Generated Key Display */}
        {generatedKey && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertTriangle className="w-5 h-5 text-green-800" />
            <AlertDescription className="text-green-800">
              <p className="font-semibold mb-2">Save This License Key - It Will Not Be Shown Again</p>
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
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, key prefix..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Licenses List */}
        <div className="grid gap-4">
          {isLoading ? (
            <p className="text-slate-600">Loading licenses...</p>
          ) : licenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-600">No licenses found.</p>
              </CardContent>
            </Card>
          ) : (
            licenses.map((license) => (
              <Card key={license.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">
                          {license.key_prefix}...
                        </code>
                        <Badge
                          variant={
                            license.status === 'active' ? 'default' :
                            license.status === 'revoked' ? 'destructive' : 'secondary'
                          }
                        >
                          {license.status}
                        </Badge>
                        {license.plan && (
                          <Badge variant="outline">{license.plan}</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {license.customer_name && (
                          <p><span className="text-slate-500">Customer:</span> <span className="font-medium">{license.customer_name}</span></p>
                        )}
                        {license.customer_email && (
                          <p><span className="text-slate-500">Email:</span> <span className="font-medium">{license.customer_email}</span></p>
                        )}
                        <p><span className="text-slate-500">Devices:</span> <span className="font-medium">{license.device_count} / {license.max_devices}</span></p>
                        {license.expires_at ? (
                          <p><span className="text-slate-500">Expires:</span> <span className="font-medium">{new Date(license.expires_at).toLocaleDateString()}</span></p>
                        ) : (
                          <p><span className="text-slate-500">Expires:</span> <span className="font-medium">Never</span></p>
                        )}
                        <p><span className="text-slate-500">Created:</span> <span className="font-medium">{new Date(license.created_date).toLocaleDateString()}</span></p>
                        {license.last_validated_at && (
                          <p><span className="text-slate-500">Last Used:</span> <span className="font-medium">{new Date(license.last_validated_at).toLocaleDateString()}</span></p>
                        )}
                      </div>
                      {license.notes && (
                        <p className="text-xs text-slate-600 mt-2 italic">{license.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {license.status === 'active' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => revokeLicenseMutation.mutate(license.id)}
                          disabled={revokeLicenseMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}