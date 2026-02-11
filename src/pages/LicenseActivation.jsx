import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, CheckCircle, XCircle, Loader2, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LicenseActivation() {
  const [licenseKey, setLicenseKey] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setResult({ valid: false, error: "Please enter a license key" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data } = await base44.functions.invoke('licenses/verify', {
        key: licenseKey.trim(),
        device_id: deviceId.trim() || undefined
      });

      setResult(data);
    } catch (error) {
      setResult({
        valid: false,
        error: error.response?.data?.error || "Failed to verify license"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">PropAI License</h1>
          <p className="text-slate-600">Activate your PropAI software license</p>
        </div>

        {/* Activation Form */}
        <Card className="shadow-xl border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-slate-700" />
              License Activation
            </CardTitle>
            <CardDescription>
              Enter your license key to verify and activate your PropAI software
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                License Key *
              </label>
              <Input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="propai_lic_..."
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Device ID (Optional)
              </label>
              <Input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="my-laptop-001"
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Used to track device activations. Leave blank if not needed.
              </p>
            </div>

            <Button
              onClick={handleActivate}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Activate License
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Display */}
        {result && (
          <div className="mt-6">
            {result.valid ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-semibold">✓ License Verified Successfully</p>
                    <div className="text-sm space-y-1 text-green-700">
                      <p>Status: <span className="font-medium">{result.status}</span></p>
                      {result.plan && (
                        <p>Plan: <span className="font-medium">{result.plan}</span></p>
                      )}
                      {result.expires_at ? (
                        <p>Expires: <span className="font-medium">
                          {new Date(result.expires_at).toLocaleDateString()}
                        </span></p>
                      ) : (
                        <p>Expires: <span className="font-medium">Never</span></p>
                      )}
                      <p>Devices: <span className="font-medium">
                        {result.device_count} / {result.max_devices}
                      </span></p>
                      {result.message && (
                        <p className="italic">{result.message}</p>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="w-5 h-5 text-red-600" />
                <AlertDescription className="text-red-800">
                  <p className="font-semibold">✗ License Verification Failed</p>
                  <p className="text-sm text-red-700 mt-1">{result.error}</p>
                  {result.status && (
                    <p className="text-sm text-red-700 mt-1">Status: {result.status}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Need help? Contact support at{" "}
            <a href="mailto:hello@propai.live" className="text-blue-600 hover:underline">
              hello@propai.live
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}