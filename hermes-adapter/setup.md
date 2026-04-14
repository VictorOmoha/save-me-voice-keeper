# Hermes Adapter Setup (Cognibrowse → SaveMe.Space)

## What this adapter does
Lets Hermes (the Cognibrowse AI agent) read from and write to the SaveMe.Space
shared memory layer. Memories written by Hermes appear in the SaveMe dashboard,
are visible to Nia (OpenClaw), and can be accessed by any future agent.

## Configuration

Set these env vars in the Cognibrowse environment:

```
SAVEME_HERMES_API_KEY=<same key as AGENT_API_KEY on Firebase Functions>
SAVEME_AGENT_USER_ID=hermes-cognibrowse-agent
SAVEME_FUNCTIONS_URL=https://us-central1-saveme-f5af0.cloudfunctions.net
```

The AGENT_API_KEY value is in:
- `save-me-voice-keeper/functions/.env` (AGENT_API_KEY)
- `save-me-voice-keeper/openclaw-adapter/.env` (SAVEME_AGENT_API_KEY)

They are the same key. Hermes uses SAVEME_HERMES_API_KEY which falls back to
SAVEME_AGENT_API_KEY if not set — so you can share the same key for now and
rotate to a separate key per agent later.

## Usage

### Basic memory write
```js
import { saveMeMemory } from './hermes-adapter/index.js';

await saveMeMemory.remember({
  title: 'Victor researched Next.js App Router patterns',
  content: 'Victor visited multiple pages about Next.js App Router caching and data fetching.',
  project: 'cognibrowse',
  type: 'fact',
});
```

### Page-derived memory
```js
await saveMeMemory.savePageMemory({
  title: 'Key insight from Next.js docs',
  content: 'Dynamic rendering is triggered by dynamic functions or uncached data requests.',
  url: 'https://nextjs.org/docs/app/building-your-application/rendering/server-components',
  pageTitle: 'Server Components — Next.js docs',
  project: 'cognibrowse',
});
```

### Decision memory
```js
await saveMeMemory.saveDecision({
  title: 'Victor chose Vercel over Railway for Cognibrowse',
  content: 'After reviewing both options, Victor decided to deploy Cognibrowse backend on Vercel.',
  project: 'cognibrowse',
});
```

### Context lookup before responding
```js
const context = await saveMeMemory.contextFor('Cognibrowse architecture decisions');
// → "Relevant context from SaveMe:\n• Victor chose Vercel..."
// inject into system prompt or response generation
```

## Agent identity
Memories written by this adapter are tagged with:
- `source: "hermes"`
- `sourceAgent: "hermes"`
- visibility: `"shared_with_agents"` (visible to Nia/OpenClaw)

They appear in the SaveMe dashboard SharedMemoryPanel under the shared memory feed.

## Notes
- The shared key `AGENT_API_KEY` can be used by multiple agents for now
- For production, generate a separate key per agent and add each to Firebase Functions env
- Hermes-written memories are visible in the SaveMe dashboard at https://saveme-f5af0.web.app
