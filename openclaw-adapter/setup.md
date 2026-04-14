# OpenClaw Adapter Setup

## 1. Generate a strong API key

Run this in PowerShell or any terminal:

```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Or use any random 32+ char string.

## 2. Set env vars on Firebase Functions

```bash
# From the functions/ directory:
npx firebase functions:config:set saveme.agent_api_key="YOUR_KEY_HERE" saveme.agent_user_id="nia-openclaw-agent"
```

OR (preferred — the current setup uses .env):

Add to `functions/.env`:
```
AGENT_API_KEY=YOUR_KEY_HERE
AGENT_USER_ID=nia-openclaw-agent
```

Then redeploy functions:
```bash
npx firebase deploy --only functions --project saveme-f5af0
```

## 3. Set env var for OpenClaw

Add to your OpenClaw environment (`.env`, `openclaw.config.json`, or system env):

```
SAVEME_AGENT_API_KEY=YOUR_KEY_HERE
SAVEME_AGENT_USER_ID=nia-openclaw-agent
SAVEME_FUNCTIONS_URL=https://us-central1-saveme-f5af0.cloudfunctions.net
```

## 4. Test the adapter

```bash
cd openclaw-adapter
SAVEME_AGENT_API_KEY=YOUR_KEY_HERE node test.js
```

Expected output:
```
✅ remember(): <memory-id>
✅ get(): OpenClaw adapter test ...
✅ search(): 1 result(s)
✅ list(): N result(s)
✅ contextFor(): Relevant context from SaveMe: ...
✅ update(): Updated by smoke test
✅ batchRemember(): 2 created
✅ All tests passed.
```

## 5. Use in Nia's session

Import and use in any OpenClaw skill or tool:

```js
import { saveMeMemory } from '/path/to/openclaw-adapter/index.js';

// Remember something Victor told you
await saveMeMemory.remember({
  title: "Victor's preferred deploy target is Vercel",
  content: "Victor prefers Vercel for frontend deploys. Firebase Hosting for SaveMe.",
  project: 'omoha-solutions',
  type: 'preference',
  tags: ['deploy', 'preference'],
});

// Recall context before responding
const context = await saveMeMemory.contextFor('SaveMe deploy process');
// → inject into system prompt or tool context
```

## Notes

- The API key auth path is only active when `AGENT_API_KEY` is set on Firebase Functions
- If not set, the functions require Firebase ID tokens (normal user auth)
- The agent writes under the user ID defined by `AGENT_USER_ID` (defaults to `"nia-openclaw-agent"`)
- All writes are visible in the SharedMemoryPanel on the SaveMe dashboard
