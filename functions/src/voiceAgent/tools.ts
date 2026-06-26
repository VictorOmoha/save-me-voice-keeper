export const VOICE_AGENT_TOOLS = [
  {
    functionDeclarations: [
      // ── App Control ────────────────────────────────────────────────────────
      {
        name: "navigateApp",
        description: "Navigate the user to a different page or section of the app.",
        parameters: {
          type: "OBJECT",
          properties: {
            route: {
              type: "STRING",
              enum: ["/dashboard", "/all-entries", "/insights", "/settings", "/brain-dump", "/subscription"],
              description: "The route to navigate to",
            },
          },
          required: ["route"],
        },
      },
      {
        name: "navigateToCategory",
        description: "Navigate to a specific category view.",
        parameters: {
          type: "OBJECT",
          properties: {
            category: {type: "STRING", description: "Category name (e.g. Health, Finance, Documents)"},
          },
          required: ["category"],
        },
      },
      {
        name: "openEntryForm",
        description: "Open the form to create a new entry.",
        parameters: {
          type: "OBJECT",
          properties: {
            category: {type: "STRING", description: "Pre-select a category (optional)"},
          },
        },
      },
      {
        name: "openEntry",
        description: "Open or view a specific entry by ID or title.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: {type: "STRING", description: "Entry ID (if known)"},
            title: {type: "STRING", description: "Entry title to find and open"},
          },
        },
      },
      {
        name: "closeEntry",
        description: "Close the current entry or modal and go back to the previous page. Use when user says 'close', 'go back', 'exit', 'back', 'close this', 'close the entry'.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: {type: "STRING", description: "Optional reason (ignored)"},
          },
        },
      },
      {
        name: "scrollPage",
        description: "Scroll the current page. Use when user says 'scroll down', 'scroll up', 'go to top', 'go to bottom', 'scroll to the bottom', 'show me more', 'keep going'.",
        parameters: {
          type: "OBJECT",
          properties: {
            direction: {type: "STRING", enum: ["down", "up", "top", "bottom"], description: "Scroll direction: down/up by one screen, or jump to top/bottom"},
          },
          required: ["direction"],
        },
      },
      {
        name: "startBrainDump",
        description: "Navigate to the Brain Dump page and start voice capture. Use when user says 'brain dump', 'start brain dump', 'open brain dump', 'capture my thoughts'.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: {type: "STRING", description: "Optional reason (ignored)"},
          },
        },
      },
      {
        name: "processBrainDump",
        description: "Process and structure the current brain dump text into notes, action items, and key points. Use when user says 'process', 'structure this', 'organize my thoughts', 'analyze'.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: {type: "STRING", description: "Optional reason (ignored)"},
          },
        },
      },
      {
        name: "saveBrainDump",
        description: "Save the processed brain dump to the vault. Use when user says 'save this', 'save the brain dump', 'save my notes'.",
        parameters: {
          type: "OBJECT",
          properties: {
            category: {type: "STRING", description: "Category to save under (optional, e.g. Work, Personal, Health)"},
          },
        },
      },
      // ── Vault Operations ───────────────────────────────────────────────────
      {
        name: "saveEntry",
        description: `Save a new entry to the user's vault.
Use 'content' for general notes, reminders, ideas, or anything that's just a block of text.
Use 'fields' (array of {key, value} pairs) for structured data: contacts, finance, medical, recipes, credentials, etc.
Examples:
- "Remember to call Mom tomorrow" → content only
- "Save John's contact: phone 555-1234, email john@gmail.com" → fields [{key:"Phone",value:"555-1234"},{key:"Email",value:"john@gmail.com"}]
- "Note: meeting at 3pm about the budget" → content only
- "Save my blood pressure: 120/80, pulse 72" → fields [{key:"Blood Pressure",value:"120/80"},{key:"Pulse",value:"72 bpm"}]`,
        parameters: {
          type: "OBJECT",
          properties: {
            title: {type: "STRING", description: "Short title or summary"},
            content: {type: "STRING", description: "Main text content — use for general notes and reminders"},
            category: {type: "STRING", description: "Category (e.g. Personal, Work, Health, Finance, Contacts, Ideas)"},
            fields: {
              type: "ARRAY",
              description: "Structured key-value pairs — use for contacts, finance, medical, etc.",
              items: {
                type: "OBJECT",
                properties: {
                  key: {type: "STRING", description: "Field name (e.g. Phone, Email, Amount)"},
                  value: {type: "STRING", description: "Field value"},
                },
                required: ["key", "value"],
              },
            },
          },
          required: ["title"],
        },
      },
      {
        name: "searchEntries",
        description: "Search the vault by keywords or topic.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {type: "STRING", description: "What to search for"},
            limit: {type: "NUMBER", description: "Max results (default 5)"},
          },
          required: ["query"],
        },
      },
      {
        name: "getRecentEntries",
        description: "Get the most recently saved entries.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: {type: "NUMBER", description: "How many to fetch (default 5)"},
            category: {type: "STRING", description: "Filter by category (optional)"},
          },
        },
      },
      {
        name: "updateEntry",
        description: "Update an existing entry by ID.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: {type: "STRING", description: "Entry ID"},
            title: {type: "STRING", description: "New title (optional)"},
            content: {type: "STRING", description: "New content (optional)"},
            category: {type: "STRING", description: "New category (optional)"},
          },
          required: ["id"],
        },
      },
      {
        name: "deleteEntry",
        description: "Delete an entry. Pass `title` with the entry's name/topic (it will be matched), or pass `id` if you have a real id from a prior searchEntries result. NEVER invent an id.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: {type: "STRING", description: "Entry id from a prior searchEntries result (optional — only if you actually have it)"},
            title: {type: "STRING", description: "The entry's title or topic to match (use this when you don't have a real id)"},
          },
          required: [],
        },
      },
      // ── Settings Operations ───────────────────────────────────────────────
      {
        name: "updateTheme",
        description: "Change the app's color theme. Use when user says 'dark mode', 'light mode', 'switch theme', etc.",
        parameters: {
          type: "OBJECT",
          properties: {
            theme: {type: "STRING", enum: ["light", "dark", "system"], description: "The theme to set"},
          },
          required: ["theme"],
        },
      },
      {
        name: "updateProfile",
        description: "Update the user's profile info (display name or phone). Use when user says 'change my name', 'update my profile', etc.",
        parameters: {
          type: "OBJECT",
          properties: {
            fullName: {type: "STRING", description: "New display name"},
            phone: {type: "STRING", description: "New phone number"},
          },
        },
      },
      {
        name: "toggleNotification",
        description: "Enable or disable a notification type. Use when user says 'turn on/off notifications', 'disable email alerts', etc.",
        parameters: {
          type: "OBJECT",
          properties: {
            type: {type: "STRING", enum: ["email_notifications", "push_notifications", "reminder_notifications", "automation_notifications"], description: "Which notification type"},
            enabled: {type: "BOOLEAN", description: "true to enable, false to disable"},
          },
          required: ["type", "enabled"],
        },
      },
      {
        name: "updateVoiceSettings",
        description: "Change voice/speech settings. Use when user says 'change language', 'set speech rate', 'switch to Google voice', etc.",
        parameters: {
          type: "OBJECT",
          properties: {
            voice_language: {type: "STRING", enum: ["en-US", "en-GB", "es-ES", "fr-FR", "de-DE", "it-IT", "pt-PT", "ja-JP", "ko-KR", "zh-CN"], description: "Speech recognition language"},
            tts_service: {type: "STRING", enum: ["elevenlabs", "google", "minimax", "browser"], description: "Text-to-speech provider"},
            voice_speech_rate: {type: "NUMBER", description: "Speech rate (0.5 to 2.0)"},
            voice_volume: {type: "NUMBER", description: "TTS volume (0 to 1)"},
            voice_continuous_listening: {type: "BOOLEAN", description: "Whether to keep listening after responses"},
            voice_auto_speak: {type: "BOOLEAN", description: "Whether to auto-speak responses"},
            voice_audio_cue_enabled: {type: "BOOLEAN", description: "Whether to play end-of-speech tone"},
          },
        },
      },
      {
        name: "exportUserData",
        description: "Export all of the user's data as a downloadable file. Use when user says 'export my data', 'download my entries', 'backup my data'.",
        parameters: {
          type: "OBJECT",
          properties: {
            format: {type: "STRING", enum: ["json", "csv"], description: "Export format (default json)"},
          },
        },
      },
      // ── Memory Operations ─────────────────────────────────────────────────
      {
        name: "rememberFact",
        description: "Store a personal fact or preference about the user for future reference. Use when user says 'remember that...', 'keep in mind...', 'note that I...', 'my X is Y'. Also use proactively when the user reveals personal information worth remembering (names of family members, preferences, important dates, recurring habits).",
        parameters: {
          type: "OBJECT",
          properties: {
            content: {
              type: "STRING",
              description: "The fact to remember, written in third person. E.g., 'Victor\\'s wife is named Sarah', 'Victor prefers dark mode', 'Victor has a dentist appointment every 6 months'",
            },
            category: {
              type: "STRING",
              enum: ["personal", "health", "finance", "work", "contacts", "preferences", "schedule"],
              description: "Category of the fact",
            },
            overrides: {
              type: "STRING",
              description: "If this corrects a previous fact, describe what it replaces. E.g., 'wife name was Sarah'",
            },
          },
          required: ["content"],
        },
      },
      {
        name: "recallMemories",
        description: "Search Nova's memory for relevant facts about the user. Use BEFORE answering questions about the user's preferences, history, or personal details. Use when the user asks 'do you remember...', 'what do you know about me', 'what\\'s my...'. Also use proactively when context would improve your response.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "What to search for in memory. E.g., 'wife name', 'health preferences', 'work schedule'",
            },
            category: {
              type: "STRING",
              enum: ["personal", "health", "finance", "work", "contacts", "preferences", "schedule"],
              description: "Optional category filter",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "forgetMemory",
        description: "Remove a specific memory about the user. Use when user says 'forget that...', 'delete that memory', 'that\\'s no longer true', 'remove what you know about...'.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "Description of what to forget. E.g., 'my wife\\'s name', 'my old address'",
            },
          },
          required: ["query"],
        },
      },
      // ── Agentic Intelligence Tools ──────────────────────────────────────────
      {
        name: "getEntityGraph",
        description: "Look up people, projects, organizations, or topics in the user's knowledge graph. Returns entities and their connected entries. Use when user asks 'who is involved in X', 'what do I know about X', 'tell me about X'.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {type: "STRING", description: "Entity name or topic to look up"},
            type: {type: "STRING", enum: ["person", "project", "organization", "topic", "location", "event"], description: "Filter by entity type (optional)"},
          },
          required: ["query"],
        },
      },
      {
        name: "getRelatedEntries",
        description: "Get entries related to a specific entry or topic. Shows connections, shared entities, and recent updates. Use proactively when user mentions a known person or project to provide context.",
        parameters: {
          type: "OBJECT",
          properties: {
            entryId: {type: "STRING", description: "Entry ID to find relations for (optional)"},
            topic: {type: "STRING", description: "Topic to find related entries for (optional)"},
            limit: {type: "NUMBER", description: "Max results (default 5)"},
          },
        },
      },
      {
        name: "prepareBriefing",
        description: "Synthesize a briefing about a person, project, or topic. Gathers all related entries, action items, and memories into a concise summary. Use when user says 'prepare me for my meeting with X', 'what's the status of Y', 'brief me on Z', 'catch me up on X'.",
        parameters: {
          type: "OBJECT",
          properties: {
            subject: {type: "STRING", description: "Who/what to brief about"},
            type: {type: "STRING", enum: ["meeting_prep", "project_status", "person_summary", "topic_review"], description: "Type of briefing (optional)"},
            timeframe: {type: "STRING", description: "Time window, e.g. 'last week', 'last month' (optional)"},
          },
          required: ["subject"],
        },
      },
      {
        name: "getActivitySummary",
        description: "Get a summary of what the user has been working on. Use when user asks 'what was I working on', 'what happened last week', 'summary of my activity', 'what have I saved recently'.",
        parameters: {
          type: "OBJECT",
          properties: {
            timeframe: {type: "STRING", enum: ["today", "yesterday", "this_week", "last_week", "this_month"], description: "Time period"},
          },
          required: ["timeframe"],
        },
      },
      {
        name: "getUpcomingDeadlines",
        description: "Get upcoming deadlines and action items. Use when user asks 'what's due', 'any deadlines', 'what do I need to do', 'my tasks', 'what's pending'.",
        parameters: {
          type: "OBJECT",
          properties: {
            timeframe: {type: "STRING", enum: ["today", "tomorrow", "this_week", "next_week"], description: "Time window (default: this_week)"},
            status: {type: "STRING", enum: ["open", "in_progress", "all"], description: "Filter by status (default: open)"},
          },
        },
      },
      {
        name: "updateActionItem",
        description: "Update the status of an action item. Use when user says 'mark X as done', 'I completed X', 'I finished X', 'cancel the task about X'.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {type: "STRING", description: "Description of the action item to update"},
            status: {type: "STRING", enum: ["open", "in_progress", "completed", "cancelled"], description: "New status"},
          },
          required: ["query", "status"],
        },
      },
      {
        name: "setReminder",
        description: "Set a reminder for the user. Use when user says 'remind me to X', 'set a reminder for X', 'don't let me forget X'.",
        parameters: {
          type: "OBJECT",
          properties: {
            text: {type: "STRING", description: "What to remind about"},
            when: {type: "STRING", description: "When to remind: 'tomorrow', 'in 2 hours', 'next Monday', 'Friday at 3pm'"},
            entryId: {type: "STRING", description: "Link to an entry (optional)"},
          },
          required: ["text", "when"],
        },
      },
      // ── Print ──────────────────────────────────────────────────────────────
      {
        name: "printEntry",
        description: "Print one or more entries. Use when user says 'print', 'print this entry', 'print my [title]', 'print entries in [category]'. Searches for the entry by title or category and opens the browser print dialog.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: {type: "STRING", description: "Entry title or partial title to find and print"},
            id: {type: "STRING", description: "Entry ID to print (if known)"},
            category: {type: "STRING", description: "Print all entries in this category"},
          },
        },
      },
    ],
  },
];
