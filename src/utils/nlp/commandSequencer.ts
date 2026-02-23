import { ParsedIntent } from './multiIntentParser';

export interface SequencedCommand {
  intent: ParsedIntent;
  executionOrder: number;
  dependencies: number[];
  delay?: number;
  retryCount: number;
  maxRetries: number;
}

export interface ExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
}

export interface SequenceExecutionResult {
  overallSuccess: boolean;
  results: Array<{
    command: SequencedCommand;
    result: ExecutionResult;
  }>;
  totalExecutionTime: number;
  failedCommands: number;
}

export class CommandSequencer {
  private executionQueue: SequencedCommand[] = [];
  private isExecuting = false;
  
  constructor(
    private executeCommand: (intent: ParsedIntent) => Promise<unknown>
  ) {}

  sequenceCommands(intents: ParsedIntent[]): SequencedCommand[] {
    console.log('🔄 CommandSequencer: Sequencing commands:', intents);

    const commands: SequencedCommand[] = intents.map((intent, index) => ({
      intent,
      executionOrder: index,
      dependencies: this.calculateDependencies(intent, intents, index),
      delay: this.calculateDelay(intent, index),
      retryCount: 0,
      maxRetries: 3
    }));

    // Sort commands by execution order and dependencies
    const sortedCommands = this.sortByDependencies(commands);
    
    console.log('📋 CommandSequencer: Sequenced commands:', sortedCommands);
    return sortedCommands;
  }

  async executeSequence(commands: SequencedCommand[]): Promise<SequenceExecutionResult> {
    if (this.isExecuting) {
      throw new Error('Another command sequence is already executing');
    }

    this.isExecuting = true;
    const startTime = Date.now();
    const results: Array<{ command: SequencedCommand; result: ExecutionResult }> = [];
    let failedCommands = 0;

    console.log('🚀 CommandSequencer: Starting execution sequence...');

    try {
      for (const command of commands) {
        console.log(`⚡ CommandSequencer: Executing command ${command.executionOrder + 1}/${commands.length}:`, command.intent.type);

        // Wait for dependencies
        await this.waitForDependencies(command, results);
        
        // Add delay if specified
        if (command.delay && command.delay > 0) {
          console.log(`⏳ CommandSequencer: Waiting ${command.delay}ms before execution...`);
          await this.sleep(command.delay);
        }

        const result = await this.executeWithRetry(command);
        results.push({ command, result });

        if (!result.success) {
          failedCommands++;
          console.error(`❌ CommandSequencer: Command failed:`, result.error);
          
          // Decide whether to continue or abort based on command type
          if (this.shouldAbortOnFailure(command)) {
            console.log('🛑 CommandSequencer: Aborting sequence due to critical failure');
            break;
          }
        } else {
          console.log(`✅ CommandSequencer: Command completed successfully in ${result.executionTime}ms`);
        }
      }
    } finally {
      this.isExecuting = false;
    }

    const totalExecutionTime = Date.now() - startTime;
    const overallSuccess = failedCommands === 0;

    const sequenceResult: SequenceExecutionResult = {
      overallSuccess,
      results,
      totalExecutionTime,
      failedCommands
    };

    console.log('🏁 CommandSequencer: Sequence execution completed:', sequenceResult);
    return sequenceResult;
  }

  private calculateDependencies(intent: ParsedIntent, allIntents: ParsedIntent[], currentIndex: number): number[] {
    const dependencies: number[] = [];

    // Simple dependency rules
    for (let i = 0; i < currentIndex; i++) {
      const previousIntent = allIntents[i];
      
      // If current command operates on something that previous command created
      if (this.hasDependency(intent, previousIntent)) {
        dependencies.push(i);
      }
    }

    return dependencies;
  }

  private hasDependency(current: ParsedIntent, previous: ParsedIntent): boolean {
    // Create -> Open dependency
    if (previous.type === 'create_entry' && current.type === 'open_entry') {
      return this.targetsMatch(current.parameters.entryTitle, previous.parameters.entryTitle);
    }

    // Create -> Save dependency
    if (previous.type === 'create_entry' && current.type === 'save_entry') {
      return this.targetsMatch(current.parameters.entryTitle, previous.parameters.entryTitle);
    }

    // Open -> Close dependency
    if (previous.type === 'open_entry' && current.type === 'cancel') {
      return true; // Cancel always depends on what was opened
    }

    return false;
  }

  private targetsMatch(target1: string, target2: string): boolean {
    if (!target1 || !target2) return false;
    
    const normalized1 = target1.toLowerCase().trim();
    const normalized2 = target2.toLowerCase().trim();
    
    return normalized1.includes(normalized2) || normalized2.includes(normalized1);
  }

  private calculateDelay(intent: ParsedIntent, index: number): number {
    // Add small delays between commands for better UX
    const baseDelay = index > 0 ? 500 : 0; // 500ms between commands
    
    // Special delays for certain command types
    switch (intent.type) {
      case 'create_entry':
        return baseDelay + 200; // Extra time for form initialization
      case 'save_entry':
        return baseDelay + 300; // Extra time for save operation
      case 'delete_entry':
        return baseDelay + 100; // Brief pause before destructive action
      default:
        return baseDelay;
    }
  }

  private sortByDependencies(commands: SequencedCommand[]): SequencedCommand[] {
    // Topological sort to respect dependencies
    const sorted: SequencedCommand[] = [];
    const visited = new Set<number>();
    const visiting = new Set<number>();

    const visit = (commandIndex: number) => {
      if (visiting.has(commandIndex)) {
        console.warn('⚠️ CommandSequencer: Circular dependency detected, breaking cycle');
        return;
      }
      
      if (visited.has(commandIndex)) {
        return;
      }

      visiting.add(commandIndex);
      
      const command = commands[commandIndex];
      for (const depIndex of command.dependencies) {
        if (depIndex < commands.length) {
          visit(depIndex);
        }
      }
      
      visiting.delete(commandIndex);
      visited.add(commandIndex);
      sorted.push(command);
    };

    for (let i = 0; i < commands.length; i++) {
      visit(i);
    }

    return sorted;
  }

  private async waitForDependencies(
    command: SequencedCommand, 
    completedResults: Array<{ command: SequencedCommand; result: ExecutionResult }>
  ): Promise<void> {
    for (const depIndex of command.dependencies) {
      const depResult = completedResults.find(r => r.command.executionOrder === depIndex);
      
      if (!depResult || !depResult.result.success) {
        console.log(`⏳ CommandSequencer: Dependency ${depIndex} not satisfied, waiting...`);
        // In a real implementation, you might want to wait or handle this differently
        throw new Error(`Dependency command ${depIndex} failed or not completed`);
      }
    }
  }

  private async executeWithRetry(command: SequencedCommand): Promise<ExecutionResult> {
    let lastError: string = '';
    
    for (let attempt = 0; attempt <= command.maxRetries; attempt++) {
      const startTime = Date.now();
      
      try {
        console.log(`🔄 CommandSequencer: Attempt ${attempt + 1}/${command.maxRetries + 1} for command:`, command.intent.type);
        
        const result = await this.executeCommand(command.intent);
        const executionTime = Date.now() - startTime;
        
        return {
          success: true,
          result,
          executionTime
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        command.retryCount++;
        
        console.log(`❌ CommandSequencer: Attempt ${attempt + 1} failed:`, lastError);
        
        if (attempt < command.maxRetries) {
          const retryDelay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff
          console.log(`⏳ CommandSequencer: Retrying in ${retryDelay}ms...`);
          await this.sleep(retryDelay);
        }
      }
    }

    return {
      success: false,
      error: `Failed after ${command.maxRetries + 1} attempts: ${lastError}`,
      executionTime: 0
    };
  }

  private shouldAbortOnFailure(command: SequencedCommand): boolean {
    // Don't abort sequence for non-critical commands
    const nonCriticalCommands = ['search_entries', 'navigate_view'];
    return !nonCriticalCommands.includes(command.intent.type);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for external control
  isSequenceExecuting(): boolean {
    return this.isExecuting;
  }

  abortSequence(): void {
    if (this.isExecuting) {
      console.log('🛑 CommandSequencer: Sequence aborted by user');
      this.isExecuting = false;
    }
  }

  getExecutionQueue(): SequencedCommand[] {
    return [...this.executionQueue];
  }
}