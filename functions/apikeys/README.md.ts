# PropAI API Key System

## Overview
Secure API key management for broker integrations with PropAI Live.

## Endpoints

### 1. Create Key
**POST** `/api/keys/create`

Creates a new API key for a broker. Returns the raw key **only once**.

**Request:**
```json
{
  "broker_person_id": "person_abc123",
  "scopes": ["read:properties", "write:properties"], // optional
  "notes": "For production use" // optional
}
```

**Response:**
```json
{
  "success": true,
  "key": "propai_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "key_id": "key_xyz789",
  "key_prefix": "propai_a1b2c3d4...",
  "broker": {
    "id": "person_abc123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "scopes": ["read:properties", "write:properties"],
  "message": "API key created successfully. Save it now - it will not be shown again."
}
```

---

### 2. Verify Key
**POST** `/api/keys/verify`

Verifies an API key and returns broker profile. Used by CLI clients.

**Request:**
```bash
curl -X POST https://propai.live/api/keys/verify \
  -H "Authorization: Bearer propai_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

**Response (Valid Key):**
```json
{
  "valid": true,
  "broker": {
    "id": "person_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "agency_name": "ABC Real Estate",
    "trust_score": 85,
    "status": "Active"
  },
  "scopes": ["read:properties", "write:properties"],
  "key_id": "key_xyz789"
}
```

**Response (Invalid Key):**
```json
{
  "valid": false,
  "error": "Invalid API key"
}
```

---

### 3. Rotate Key
**POST** `/api/keys/rotate`

Revokes old key and generates a new one.

**Request:**
```json
{
  "key_id": "key_xyz789"
}
```

**Response:**
```json
{
  "success": true,
  "new_key": "propai_q9w8e7r6t5y4u3i2o1p0a9s8d7f6g5h4",
  "new_key_id": "key_abc456",
  "old_key_id": "key_xyz789",
  "message": "Key rotated successfully. Old key revoked, new key generated."
}
```

---

### 4. Revoke Key
**POST** `/api/keys/revoke`

Revokes an API key permanently.

**Request:**
```json
{
  "key_id": "key_xyz789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

---

### 5. List Keys
**GET** `/api/keys/list`

Lists all API keys (admin only).

**Request:**
```bash
curl https://propai.live/api/keys/list?status=active
```

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "id": "key_xyz789",
      "key_prefix": "propai_a1b2c3d4...",
      "broker_person_id": "person_abc123",
      "broker_name": "John Doe",
      "broker_email": "john@example.com",
      "status": "active",
      "scopes": ["read:properties", "write:properties"],
      "created_date": "2025-01-15T10:00:00Z",
      "last_used_at": "2025-02-11T14:30:00Z",
      "usage_count": 42,
      "notes": "For production use"
    }
  ]
}
```

---

## CLI Client Usage

### Python Example
```python
import requests

API_KEY = "propai_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
BASE_URL = "https://propai.live/api"

# Verify key
response = requests.post(
    f"{BASE_URL}/keys/verify",
    headers={"Authorization": f"Bearer {API_KEY}"}
)

if response.json()["valid"]:
    broker = response.json()["broker"]
    print(f"Authenticated as: {broker['name']}")
else:
    print("Invalid API key")
```

### Node.js Example
```javascript
const axios = require('axios');

const API_KEY = 'propai_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const BASE_URL = 'https://propai.live/api';

async function verifyKey() {
  const response = await axios.post(
    `${BASE_URL}/keys/verify`,
    {},
    { headers: { 'Authorization': `Bearer ${API_KEY}` } }
  );
  
  if (response.data.valid) {
    console.log(`Authenticated as: ${response.data.broker.name}`);
  } else {
    console.log('Invalid API key');
  }
}
```

### Bash Example
```bash
#!/bin/bash
API_KEY="propai_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
BASE_URL="https://propai.live/api"

# Verify key
curl -X POST "$BASE_URL/keys/verify" \
  -H "Authorization: Bearer $API_KEY"
```

---

## Security

### Key Storage
- Raw keys are **never** stored in the database
- Only HMAC-SHA256 hashes are stored
- Keys are shown **only once** at creation

### Secret Management
Set the `API_KEY_SECRET` environment variable:
```bash
# In production
export API_KEY_SECRET="your-secure-random-secret-256-bits"
```

### Rate Limiting
- Implement rate limiting on the `/verify` endpoint
- Recommended: 100 requests/minute per key
- Log all failed verification attempts

### Best Practices
1. Rotate keys periodically (every 90 days)
2. Revoke keys immediately if compromised
3. Use HTTPS only for all API calls
4. Store keys in environment variables, not code
5. Monitor `usage_count` and `last_used_at` for anomalies

---

## Database Schema
See `entities/APIKey.json` for full schema.

Key fields:
- `key_hash`: HMAC-SHA256 hash of the API key
- `key_prefix`: First 15 chars for identification
- `broker_person_id`: Link to Person entity
- `status`: active | revoked
- `scopes`: Array of allowed permissions
- `last_used_at`: Timestamp of last verification
- `usage_count`: Number of times key was verified

---

## Admin UI
Access the admin UI at: `/APIKeyManager`

Features:
- Create new keys for brokers
- View all keys with usage stats
- Rotate keys (revoke old, generate new)
- Revoke keys permanently
- Copy newly generated keys (shown only once)