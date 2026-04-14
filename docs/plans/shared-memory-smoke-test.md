# Shared Memory Smoke Test

Base URL:
- `https://us-central1-saveme-f5af0.cloudfunctions.net`

Auth:
- Firebase ID token required in `Authorization: Bearer <token>`
- All endpoints are `POST` only

## Recommended validation flow

### 1. Create a memory
Function:
- `sharedMemoryCreate`

Body:
```json
{
  "title": "Victor met Daniel at Best Barber Shop",
  "content": "Victor visited Best Barber Shop in Durham, met Daniel, showed a live demo, and Daniel asked for the demo by email.",
  "summary": "Warm local lead conversation with Daniel at Best Barber Shop.",
  "tags": ["lead", "best-barber-shop", "durham"],
  "people": ["Daniel"],
  "project": "omoha-solutions",
  "type": "business_context",
  "source": "human",
  "visibility": "shared",
  "verification": "verified",
  "confidence": 0.95,
  "metadata": {
    "channel": "manual-smoke-test"
  }
}
```

Expected:
- `200 OK`
- `ok: true`
- response includes `memory.id`

### 2. Fetch the memory
Function:
- `sharedMemoryGet`

Body:
```json
{
  "id": "<memory-id>"
}
```

Expected:
- same memory returned

### 3. Update the memory
Function:
- `sharedMemoryUpdate`

Body:
```json
{
  "id": "<memory-id>",
  "patch": {
    "summary": "Warm local lead interaction and emailed demo follow-up.",
    "tags": ["lead", "best-barber-shop", "durham", "follow-up"]
  }
}
```

Expected:
- updated fields returned

### 4. List memories
Function:
- `sharedMemoryList`

Body:
```json
{
  "limit": 10,
  "project": "omoha-solutions",
  "visibility": "shared"
}
```

Expected:
- includes the created memory in recent results

### 5. Search memories
Function:
- `sharedMemorySearch`

Body:
```json
{
  "query": "Daniel Best Barber Shop demo email",
  "limit": 10,
  "project": "omoha-solutions"
}
```

Expected:
- includes the created memory in search results

### 6. Batch create
Function:
- `sharedMemoryBatchCreate`

Body:
```json
{
  "memories": [
    {
      "title": "SaveMe shared memory backend deployed",
      "content": "Shared memory CRUD and search functions are now deployed to Firebase Functions.",
      "project": "save-me",
      "type": "system_event",
      "source": "agent",
      "visibility": "shared",
      "verification": "verified"
    },
    {
      "title": "Billing blocked functions deploy earlier",
      "content": "Cloud Functions deployment initially failed because project billing needed to be corrected.",
      "project": "save-me",
      "type": "incident_note",
      "source": "agent",
      "visibility": "shared",
      "verification": "verified"
    }
  ]
}
```

Expected:
- `200 OK`
- `ok: true`
- returns two created memories

## Frontend client added
A typed browser client now exists at:
- `src/utils/sharedMemoryClient.ts`

It exposes:
- `sharedMemoryClient.create()`
- `sharedMemoryClient.batchCreate()`
- `sharedMemoryClient.search()`
- `sharedMemoryClient.get()`
- `sharedMemoryClient.list()`
- `sharedMemoryClient.update()`

## Next suggested UI wiring
- Add a lightweight internal dev panel or console-triggered test call behind auth
- Start with list + search before building full memory management UI
- Use this client for OpenClaw/Hermes adapters too
