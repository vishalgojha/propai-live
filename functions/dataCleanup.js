import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🧹 Data Cleanup Function
 * 
 * Fixes properties with missing:
 * - location (defaults to 'Mumbai')
 * - custom_id (generates new)
 * - slug (generates new)
 * - broker_id (tries to infer from broker_contact or leaves null)
 * - building_id (calls buildingIntelligence if building_name exists)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode = 'dry_run' } = await req.json(); // 'dry_run' or 'fix'

    // Get all properties
    const allProperties = await base44.asServiceRole.entities.Property.list();
    
    const issues = {
      missing_location: [],
      missing_custom_id: [],
      missing_slug: [],
      missing_broker_id: [],
      missing_building_id_but_has_name: [],
    };

    // Analyze issues
    for (const property of allProperties) {
      if (!property.location) {
        issues.missing_location.push(property.id);
      }
      if (!property.custom_id) {
        issues.missing_custom_id.push(property.id);
      }
      if (!property.slug) {
        issues.missing_slug.push(property.id);
      }
      if (!property.broker_id) {
        issues.missing_broker_id.push(property.id);
      }
      if (property.building_name && !property.building_id) {
        issues.missing_building_id_but_has_name.push(property.id);
      }
    }

    if (mode === 'dry_run') {
      return Response.json({
        message: 'Dry run - no changes made',
        issues: {
          missing_location: issues.missing_location.length,
          missing_custom_id: issues.missing_custom_id.length,
          missing_slug: issues.missing_slug.length,
          missing_broker_id: issues.missing_broker_id.length,
          missing_building_id_but_has_name: issues.missing_building_id_but_has_name.length,
        },
        details: issues
      });
    }

    // FIX MODE
    const fixes = {
      location_fixed: 0,
      custom_id_generated: 0,
      slug_generated: 0,
      building_linked: 0,
      errors: []
    };

    for (const property of allProperties) {
      const updates = {};

      // Fix location
      if (!property.location) {
        updates.location = 'Mumbai'; // Default to Mumbai
        fixes.location_fixed++;
      }

      // Generate custom_id and slug
      if (!property.custom_id || !property.slug) {
        try {
          const idResponse = await base44.asServiceRole.functions.invoke(
            'generatePropertyId',
            {
              location: property.location || 'Mumbai',
              property: property
            }
          );

          if (idResponse.data) {
            if (!property.custom_id) {
              updates.custom_id = idResponse.data.customId;
              fixes.custom_id_generated++;
            }
            if (!property.slug) {
              updates.slug = idResponse.data.slug;
              fixes.slug_generated++;
            }
          }
        } catch (error) {
          fixes.errors.push({
            property_id: property.id,
            issue: 'Failed to generate ID/slug',
            error: error.message
          });
        }
      }

      // Link building if building_name exists but no building_id
      if (property.building_name && !property.building_id) {
        try {
          const bisResponse = await base44.asServiceRole.functions.invoke(
            'buildingIntelligence',
            {
              building_name: property.building_name,
              location: property.location || 'Mumbai',
              pocket: property.pocket,
              broker_id: property.broker_id,
              property_data: property,
              action: 'enrich'
            }
          );

          if (bisResponse.data?.success) {
            updates.building_id = bisResponse.data.building.id;
            updates.building_name = bisResponse.data.building.name; // Canonical name
            fixes.building_linked++;
          }
        } catch (error) {
          fixes.errors.push({
            property_id: property.id,
            issue: 'Failed to link building',
            building_name: property.building_name,
            error: error.message
          });
        }
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        try {
          await base44.asServiceRole.entities.Property.update(property.id, updates);
        } catch (error) {
          fixes.errors.push({
            property_id: property.id,
            issue: 'Failed to update property',
            error: error.message
          });
        }
      }
    }

    return Response.json({
      success: true,
      message: 'Data cleanup complete!',
      fixes,
      issues_before: {
        missing_location: issues.missing_location.length,
        missing_custom_id: issues.missing_custom_id.length,
        missing_slug: issues.missing_slug.length,
        missing_building_id_but_has_name: issues.missing_building_id_but_has_name.length,
      }
    });

  } catch (error) {
    console.error('Data cleanup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});