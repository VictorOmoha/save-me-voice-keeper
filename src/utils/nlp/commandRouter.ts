
import { Intent } from './intentRecognizer';
import { ValidationResult } from './parameterValidator';

export interface CommandAction {
  intent: string;
  handler: (parameters: Record<string, unknown>) => Promise<unknown> | unknown;
  description: string;
  examples: string[];
}

export interface RoutingContext {
  userId?: string;
  currentView?: string;
  availableEntries?: Array<{ id: string; title: string; category: string }>;
  permissions?: string[];
}

export interface RoutingResult {
  success: boolean;
  result?: unknown;
  error?: string;
  needsConfirmation?: boolean;
  confirmationMessage?: string;
  suggestions?: string[];
}

export class CommandRouter {
  private actions: Map<string, CommandAction> = new Map();
  private middlewares: Array<(intent: Intent, context: RoutingContext) => Promise<boolean>> = [];

  constructor() {
    this.initializeDefaultActions();
  }

  private initializeDefaultActions() {
    // Create entry action
    this.registerAction({
      intent: 'create_entry',
      handler: async (params) => {
        return {
          action: 'create_entry',
          title: params.title || `New Entry - ${new Date().toLocaleDateString()}`,
          category: params.category || 'Personal',
          description: params.description || '',
          expectsFollowUp: !params.title && !params.description
        };
      },
      description: 'Create a new entry with optional title, category, and description',
      examples: ['create new entry', 'add medical record', 'new document called invoice']
    });

    // Delete entry action
    this.registerAction({
      intent: 'delete_entry',
      handler: async (params) => {
        return {
          action: 'delete_entry',
          target: params.target,
          needsConfirmation: !params.confirmation,
          destructive: true
        };
      },
      description: 'Delete an existing entry by name or search term',
      examples: ['delete medical record', 'remove old invoice', 'trash document']
    });

    // Edit entry action
    this.registerAction({
      intent: 'edit_entry',
      handler: async (params) => {
        return {
          action: 'edit_entry',
          target: params.target
        };
      },
      description: 'Open an entry for editing',
      examples: ['edit medical record', 'modify contact info', 'update document']
    });

    // Search entries action
    this.registerAction({
      intent: 'search_entries',
      handler: async (params) => {
        return {
          action: 'search_entries',
          query: params.query,
          category: params.category,
          dateRange: params.dateRange
        };
      },
      description: 'Search for entries by text, category, or date range',
      examples: ['search medical records', 'find invoice', 'show documents from last month']
    });

    // Navigate view action
    this.registerAction({
      intent: 'navigate_view',
      handler: async (params) => {
        return {
          action: 'navigate_view',
          destination: params.destination
        };
      },
      description: 'Navigate to a specific view or category',
      examples: ['go to health category', 'show documents', 'navigate to contacts']
    });

    // Export data action
    this.registerAction({
      intent: 'export_data',
      handler: async (params) => {
        return {
          action: 'export_data',
          format: params.format,
          filter: params.filter,
          category: params.category
        };
      },
      description: 'Export data in various formats with optional filtering',
      examples: ['export to PDF', 'download CSV of health records', 'save all documents as Excel']
    });

    // Help action
    this.registerAction({
      intent: 'help',
      handler: async (params) => {
        const availableCommands = Array.from(this.actions.values())
          .map(action => `• ${action.description}`)
          .join('\n');
        
        return {
          action: 'help',
          message: `Available voice commands:\n${availableCommands}`,
          topic: params.topic
        };
      },
      description: 'Get help with available voice commands',
      examples: ['help', 'what can you do', 'show me commands']
    });
  }

  registerAction(action: CommandAction) {
    this.actions.set(action.intent, action);
  }

  addMiddleware(middleware: (intent: Intent, context: RoutingContext) => Promise<boolean>) {
    this.middlewares.push(middleware);
  }

  async route(
    intent: Intent,
    validationResult: ValidationResult,
    context: RoutingContext = {}
  ): Promise<RoutingResult> {
    try {
      // Check if validation passed
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          suggestions: this.getSuggestions(intent.name)
        };
      }

      // Run middlewares
      for (const middleware of this.middlewares) {
        const shouldContinue = await middleware(intent, context);
        if (!shouldContinue) {
          return {
            success: false,
            error: 'Command execution blocked by middleware',
            suggestions: ['Please check your permissions or try a different command']
          };
        }
      }

      // Find and execute action
      const action = this.actions.get(intent.name);
      if (!action) {
        return {
          success: false,
          error: `No handler found for intent: ${intent.name}`,
          suggestions: this.getSuggestions(intent.name)
        };
      }

      const result = await action.handler(validationResult.validatedParameters);
      
      return {
        success: true,
        result,
        needsConfirmation: result?.needsConfirmation,
        confirmationMessage: result?.confirmationMessage
      };

    } catch (error) {
      console.error('Command routing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestions: ['Please try rephrasing your command or contact support']
      };
    }
  }

  private getSuggestions(intentName: string): string[] {
    const action = this.actions.get(intentName);
    if (action) {
      return action.examples;
    }

    // Return general suggestions if intent not found
    return [
      'Try "create new entry"',
      'Say "search for documents"',
      'Use "help" to see all commands'
    ];
  }

  getAvailableActions(): CommandAction[] {
    return Array.from(this.actions.values());
  }

  getActionsByCategory(): Record<string, CommandAction[]> {
    const categories: Record<string, CommandAction[]> = {
      'Content Management': [],
      'Navigation': [],
      'Data Export': [],
      'System': []
    };

    for (const action of this.actions.values()) {
      switch (action.intent) {
        case 'create_entry':
        case 'delete_entry':
        case 'edit_entry':
        case 'search_entries':
          categories['Content Management'].push(action);
          break;
        case 'navigate_view':
          categories['Navigation'].push(action);
          break;
        case 'export_data':
          categories['Data Export'].push(action);
          break;
        case 'help':
          categories['System'].push(action);
          break;
        default:
          categories['System'].push(action);
      }
    }

    return categories;
  }
}
