
import { IntentRecognizer, Intent } from './intentRecognizer';
import { ParameterValidator, ValidationResult } from './parameterValidator';
import { CommandRouter, RoutingContext, RoutingResult } from './commandRouter';

export interface NLPProcessingResult {
  intent: Intent;
  validation: ValidationResult;
  routing: RoutingResult;
  confidence: number;
  originalText: string;
  processingTime: number;
}

export interface NLPEngineConfig {
  confidenceThreshold: number;
  enableLogging: boolean;
  maxProcessingTime: number;
}

export class NLPEngine {
  private intentRecognizer: IntentRecognizer;
  private parameterValidator: ParameterValidator;
  private commandRouter: CommandRouter;
  private config: NLPEngineConfig;

  constructor(config: Partial<NLPEngineConfig> = {}) {
    this.config = {
      confidenceThreshold: 0.3,
      enableLogging: true,
      maxProcessingTime: 5000,
      ...config
    };

    this.intentRecognizer = new IntentRecognizer();
    this.parameterValidator = new ParameterValidator();
    this.commandRouter = new CommandRouter();

    this.setupMiddlewares();
  }

  private setupMiddlewares() {
    // Add confidence check middleware
    this.commandRouter.addMiddleware(async (intent, context) => {
      if (intent.confidence < this.config.confidenceThreshold) {
        if (this.config.enableLogging) {
          console.warn(`Intent confidence ${intent.confidence} below threshold ${this.config.confidenceThreshold}`);
        }
        return false;
      }
      return true;
    });

    // Add context validation middleware
    this.commandRouter.addMiddleware(async (intent, context) => {
      // Check if destructive actions need confirmation
      if (['delete_entry'].includes(intent.name)) {
        if (!intent.parameters.confirmation && !context.permissions?.includes('auto_confirm')) {
          if (this.config.enableLogging) {
            console.log(`Destructive action ${intent.name} requires confirmation`);
          }
          return true; // Let it proceed but mark as needs confirmation
        }
      }
      return true;
    });
  }

  async processText(
    text: string,
    context: RoutingContext = {}
  ): Promise<NLPProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (this.config.enableLogging) {
        console.log(`🧠 NLP Engine processing: "${text}"`);
      }

      // Step 1: Intent Recognition
      const intent = this.intentRecognizer.recognizeIntent(text);
      
      if (this.config.enableLogging) {
        console.log(`🎯 Recognized intent: ${intent.name} (confidence: ${intent.confidence})`);
      }

      // Step 2: Parameter Validation
      const validation = this.parameterValidator.validate(intent.name, intent.parameters);
      
      if (this.config.enableLogging) {
        console.log(`✅ Validation result: ${validation.isValid}`, validation.errors);
      }

      // Step 3: Command Routing
      const routing = await this.commandRouter.route(intent, validation, context);
      
      if (this.config.enableLogging) {
        console.log(`🚀 Routing result: ${routing.success}`, routing.result);
      }

      const processingTime = Date.now() - startTime;

      // Check processing time
      if (processingTime > this.config.maxProcessingTime) {
        console.warn(`NLP processing took ${processingTime}ms, exceeding threshold of ${this.config.maxProcessingTime}ms`);
      }

      return {
        intent,
        validation,
        routing,
        confidence: intent.confidence,
        originalText: text,
        processingTime
      };

    } catch (error) {
      console.error('NLP Engine processing error:', error);
      
      return {
        intent: {
          name: 'error',
          confidence: 0,
          parameters: {},
          requiredParameters: [],
          optionalParameters: []
        },
        validation: {
          isValid: false,
          errors: ['Processing error occurred'],
          validatedParameters: {}
        },
        routing: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown processing error'
        },
        confidence: 0,
        originalText: text,
        processingTime: Date.now() - startTime
      };
    }
  }

  // Helper methods for external use
  getAvailableIntents(): string[] {
    return this.intentRecognizer.getAvailableIntents();
  }

  getExamplesForIntent(intent: string): string[] {
    return this.intentRecognizer.getExamplesForIntent(intent);
  }

  getAvailableActions() {
    return this.commandRouter.getAvailableActions();
  }

  getActionsByCategory() {
    return this.commandRouter.getActionsByCategory();
  }

  updateConfig(newConfig: Partial<NLPEngineConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Method to add custom intents and actions
  registerCustomAction(action: any) {
    this.commandRouter.registerAction(action);
  }

  // Analytics and monitoring
  getEngineStats() {
    return {
      availableIntents: this.getAvailableIntents().length,
      availableActions: this.getAvailableActions().length,
      config: this.config
    };
  }
}

// Export singleton instance
export const nlpEngine = new NLPEngine();
