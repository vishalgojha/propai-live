import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHmac } from 'node:crypto';

/**
 * POST /api/ingest
 * Authenticated webhook endpoint for OpenClaw instances
 * Ingests raw property/requirement text and creates canonical records
 * 
 * Authorization: Bearer <api_key>
 * Body: { raw_text: string, source: string, metadata?: object }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Extract and validate API key
    const authHeader = req.headers.get('Authorization') || req.headers.get('api_key');
    if (!authHeader) {
      return Response.json({ 
        success: false, 
        error: 'Missing Authorization header' 
      }, { status: 401 });
    }

    const rawKey = authHeader.replace('Bearer ', '').trim();
    
    // Hash and verify API key
    const secret = Deno.env.get('API_KEY_SECRET') || 'propai-default-secret-change-in-production';
    const keyHash = createHmac('sha256', secret).update(rawKey).digest('hex');

    const apiKeys = await base44.asServiceRole.entities.APIKey.filter({ key_hash: keyHash });
    const apiKey = apiKeys[0];

    if (!apiKey || apiKey.status !== 'active') {
      return Response.json({ 
        success: false, 
        error: 'Invalid or revoked API key' 
      }, { status: 401 });
    }

    // Update API key usage
    await base44.asServiceRole.entities.APIKey.update(apiKey.id, {
      last_used_at: new Date().toISOString(),
      usage_count: (apiKey.usage_count || 0) + 1
    });

    // Parse request body
    const { raw_text, source = 'webhook', metadata = {} } = await req.json();

    if (!raw_text) {
      return Response.json({ 
        success: false, 
        error: 'raw_text is required' 
      }, { status: 400 });
    }

    // Get broker person
    const broker = await base44.asServiceRole.entities.Person.get(apiKey.broker_person_id);
    if (!broker) {
      return Response.json({ 
        success: false, 
        error: 'Broker not found' 
      }, { status: 404 });
    }

    // Determine entity type and parse
    let entityType = 'property';
    let parsedData = null;
    
    // Try parsing as property first
    try {
      const propertyResult = await base44.asServiceRole.functions.invoke('parsePropertyFromMessage', {
        message: raw_text,
        broker_id: broker.id
      });
      
      if (propertyResult.data?.success && propertyResult.data?.property) {
        entityType = 'property';
        parsedData = propertyResult.data.property;
      }
    } catch (error) {
      console.log('Not a property, trying requirement:', error.message);
    }

    // If not property, try requirement
    if (!parsedData) {
      try {
        const requirementResult = await base44.asServiceRole.functions.invoke('parseRequirementFromMessage', {
          message: raw_text,
          broker_id: broker.id
        });
        
        if (requirementResult.data?.success && requirementResult.data?.requirement) {
          entityType = 'requirement';
          parsedData = requirementResult.data.requirement;
        }
      } catch (error) {
        console.log('Not a requirement either:', error.message);
      }
    }

    // If parsing failed, return success with error details (200 for valid API key)
    if (!parsedData) {
      return Response.json({
        success: true,
        parsed: false,
        message: 'Could not parse as property or requirement',
        raw_text
      });
    }

    // Enrich with ingestion metadata
    const recordData = {
      ...parsedData,
      raw_text,
      source,
      ingestion_timestamp: new Date().toISOString(),
      broker_person_id: broker.id,
      broker_name: broker.name,
      broker_email: broker.email
    };

    let entityId;

    // Create or update based on entity type
    if (entityType === 'property') {
      // Check for existing canonical record
      if (recordData.canonical_property_id) {
        const existing = await base44.asServiceRole.entities.Property.filter({
          canonical_property_id: recordData.canonical_property_id
        });

        if (existing.length > 0) {
          // Update existing
          await base44.asServiceRole.entities.Property.update(existing[0].id, recordData);
          entityId = existing[0].id;
        } else {
          // Create new
          const created = await base44.asServiceRole.entities.Property.create(recordData);
          entityId = created.id;
        }
      } else {
        // No canonical ID, create new
        const created = await base44.asServiceRole.entities.Property.create(recordData);
        entityId = created.id;
      }
    } else {
      // Requirement
      if (recordData.canonical_requirement_id) {
        const existing = await base44.asServiceRole.entities.Requirement.filter({
          canonical_requirement_id: recordData.canonical_requirement_id
        });

        if (existing.length > 0) {
          await base44.asServiceRole.entities.Requirement.update(existing[0].id, recordData);
          entityId = existing[0].id;
        } else {
          const created = await base44.asServiceRole.entities.Requirement.create(recordData);
          entityId = created.id;
        }
      } else {
        const created = await base44.asServiceRole.entities.Requirement.create(recordData);
        entityId = created.id;
      }
    }

    return Response.json({
      success: true,
      parsed: true,
      entity_type: entityType,
      entity_id: entityId,
      canonical_id: entityType === 'property' ? recordData.canonical_property_id : recordData.canonical_requirement_id
    });

  } catch (error) {
    console.error('Ingestion error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});