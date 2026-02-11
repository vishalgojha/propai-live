import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHmac } from 'node:crypto';

/**
 * POST /api/licenses/verify
 * Public endpoint to verify a license key
 * 
 * Body: { key, device_id?, app_id?, version? }
 * Response: { valid, status, license_id, plan, expires_at, device_id, device_count, max_devices, message }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { key, device_id, app_id, version } = await req.json();

    if (!key) {
      return Response.json({
        valid: false,
        error: 'License key is required'
      }, { status: 400 });
    }

    // Hash the incoming key
    const keyHash = createHmac('sha256', 'propai-license-secret')
      .update(key)
      .digest('hex');

    // Look up license in database
    const licenses = await base44.asServiceRole.entities.License.filter({
      key_hash: keyHash
    });

    if (licenses.length === 0) {
      console.warn('Invalid license key attempt:', key.substring(0, 15));
      return Response.json({
        valid: false,
        error: 'Invalid license key'
      }, { status: 401 });
    }

    const license = licenses[0];

    // Check if revoked
    if (license.status === 'revoked') {
      return Response.json({
        valid: false,
        status: 'revoked',
        error: 'This license has been revoked'
      }, { status: 401 });
    }

    // Check if expired
    if (license.expires_at) {
      const expiryDate = new Date(license.expires_at);
      if (expiryDate < new Date()) {
        // Auto-update status to expired
        await base44.asServiceRole.entities.License.update(license.id, {
          status: 'expired'
        });

        return Response.json({
          valid: false,
          status: 'expired',
          error: 'This license has expired',
          expires_at: license.expires_at
        }, { status: 401 });
      }
    }

    // Handle device activation
    let devices = license.devices || [];
    let deviceAdded = false;

    if (device_id) {
      if (!devices.includes(device_id)) {
        if (devices.length >= license.max_devices) {
          return Response.json({
            valid: false,
            error: `Device limit reached. Maximum ${license.max_devices} device(s) allowed.`,
            device_count: devices.length,
            max_devices: license.max_devices
          }, { status: 403 });
        }

        // Add new device
        devices.push(device_id);
        deviceAdded = true;
      }
    }

    // Update last_validated_at and devices if needed
    const updateData = {
      last_validated_at: new Date().toISOString()
    };

    if (deviceAdded) {
      updateData.devices = devices;
    }

    await base44.asServiceRole.entities.License.update(license.id, updateData);

    return Response.json({
      valid: true,
      status: license.status,
      license_id: license.id,
      plan: license.plan || null,
      expires_at: license.expires_at || null,
      device_id: device_id || null,
      device_count: devices.length,
      max_devices: license.max_devices,
      message: deviceAdded ? 'Device activated successfully' : 'License verified'
    });

  } catch (error) {
    console.error('Error verifying license:', error);
    return Response.json({
      valid: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});