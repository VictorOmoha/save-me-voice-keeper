
export interface ValidationRule {
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  customValidator?: (value: any) => boolean;
}

export interface ValidationSchema {
  [parameter: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validatedParameters: Record<string, any>;
}

export class ParameterValidator {
  private schemas: Map<string, ValidationSchema> = new Map();

  constructor() {
    this.initializeSchemas();
  }

  private initializeSchemas() {
    this.schemas.set('create_entry', {
      title: {
        required: false,
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      category: {
        required: false,
        type: 'string',
        allowedValues: ['Personal', 'Health', 'Finance', 'Documents', 'Contacts']
      },
      description: {
        required: false,
        type: 'string',
        maxLength: 500
      }
    });

    this.schemas.set('delete_entry', {
      target: {
        required: true,
        type: 'string',
        minLength: 1
      },
      confirmation: {
        required: false,
        type: 'boolean'
      }
    });

    this.schemas.set('edit_entry', {
      target: {
        required: true,
        type: 'string',
        minLength: 1
      }
    });

    this.schemas.set('search_entries', {
      query: {
        required: true,
        type: 'string',
        minLength: 1
      },
      category: {
        required: false,
        type: 'string',
        allowedValues: ['Personal', 'Health', 'Finance', 'Documents', 'Contacts']
      },
      dateRange: {
        required: false,
        type: 'string',
        pattern: /^\d{4}-\d{2}-\d{2}\s+to\s+\d{4}-\d{2}-\d{2}$/
      }
    });

    this.schemas.set('navigate_view', {
      destination: {
        required: true,
        type: 'string',
        minLength: 1
      }
    });

    this.schemas.set('export_data', {
      format: {
        required: true,
        type: 'string',
        allowedValues: ['PDF', 'CSV', 'EXCEL', 'JSON', 'XML']
      },
      filter: {
        required: false,
        type: 'string'
      },
      category: {
        required: false,
        type: 'string',
        allowedValues: ['Personal', 'Health', 'Finance', 'Documents', 'Contacts']
      }
    });
  }

  validate(intent: string, parameters: Record<string, any>): ValidationResult {
    const schema = this.schemas.get(intent);
    
    if (!schema) {
      return {
        isValid: false,
        errors: [`No validation schema found for intent: ${intent}`],
        validatedParameters: {}
      };
    }

    const errors: string[] = [];
    const validatedParameters: Record<string, any> = {};

    // Validate each parameter in the schema
    for (const [paramName, rule] of Object.entries(schema)) {
      const value = parameters[paramName];
      
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`Required parameter '${paramName}' is missing`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        const validationResult = this.validateParameter(paramName, value, rule);
        if (validationResult.isValid) {
          validatedParameters[paramName] = validationResult.value;
        } else {
          errors.push(...validationResult.errors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedParameters
    };
  }

  private validateParameter(name: string, value: any, rule: ValidationRule): {
    isValid: boolean;
    errors: string[];
    value: any;
  } {
    const errors: string[] = [];
    let processedValue = value;

    // Type validation
    if (!this.validateType(value, rule.type)) {
      errors.push(`Parameter '${name}' must be of type ${rule.type}`);
      return { isValid: false, errors, value: processedValue };
    }

    // String-specific validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`Parameter '${name}' must be at least ${rule.minLength} characters long`);
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`Parameter '${name}' must be no more than ${rule.maxLength} characters long`);
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`Parameter '${name}' format is invalid`);
      }
      
      processedValue = value.trim();
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      errors.push(`Parameter '${name}' must be one of: ${rule.allowedValues.join(', ')}`);
    }

    // Custom validation
    if (rule.customValidator && !rule.customValidator(value)) {
      errors.push(`Parameter '${name}' failed custom validation`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      value: processedValue
    };
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  addCustomSchema(intent: string, schema: ValidationSchema) {
    this.schemas.set(intent, schema);
  }

  getSchema(intent: string): ValidationSchema | undefined {
    return this.schemas.get(intent);
  }
}
