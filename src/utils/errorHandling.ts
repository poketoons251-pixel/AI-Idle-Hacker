import { toast } from 'sonner';

// Error types for different system components
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  INTEGRATION = 'INTEGRATION',
  AI_DECISION = 'AI_DECISION',
  INVESTIGATION = 'INVESTIGATION',
  HACKING = 'HACKING',
  CAMPAIGN = 'CAMPAIGN',
  PERSONALITY = 'PERSONALITY'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Custom error class with enhanced context
export class GameError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: Record<string, any>;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;
  public readonly userMessage: string;
  public readonly technicalDetails: string;

  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Record<string, any> = {},
    recoverable: boolean = true,
    userMessage?: string,
    technicalDetails?: string
  ) {
    super(message);
    this.name = 'GameError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();
    this.recoverable = recoverable;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.technicalDetails = technicalDetails || message;
  }

  private getDefaultUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        return 'Connection issue detected. Please check your internet connection.';
      case ErrorType.AUTHENTICATION:
        return 'Authentication failed. Please log in again.';
      case ErrorType.PERMISSION:
        return 'You do not have permission to perform this action.';
      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please wait a moment before trying again.';
      case ErrorType.AI_DECISION:
        return 'AI decision system encountered an issue. Switching to manual mode.';
      case ErrorType.INVESTIGATION:
        return 'Investigation system error. Some features may be temporarily unavailable.';
      case ErrorType.HACKING:
        return 'Hacking operation failed. Please try again or check your skills.';
      case ErrorType.CAMPAIGN:
        return 'Campaign system error. Progress may be temporarily delayed.';
      case ErrorType.PERSONALITY:
        return 'AI personality system error. Relationships may not update correctly.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

// Error recovery strategies
export interface RecoveryStrategy {
  name: string;
  description: string;
  execute: (error: GameError) => Promise<boolean>;
  maxRetries: number;
  retryDelay: number; // milliseconds
}

// Built-in recovery strategies
export const recoveryStrategies: Record<string, RecoveryStrategy> = {
  networkRetry: {
    name: 'Network Retry',
    description: 'Retry network request with exponential backoff',
    execute: async (error: GameError) => {
      const { url, options } = error.context;
      if (!url) return false;
      
      try {
        const response = await fetch(url, options);
        return response.ok;
      } catch {
        return false;
      }
    },
    maxRetries: 3,
    retryDelay: 1000
  },
  
  authRefresh: {
    name: 'Authentication Refresh',
    description: 'Refresh authentication token and retry',
    execute: async (error: GameError) => {
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include'
        });
        
        if (refreshResponse.ok) {
          // Retry original request
          const { url, options } = error.context;
          if (url) {
            const retryResponse = await fetch(url, options);
            return retryResponse.ok;
          }
        }
        return false;
      } catch {
        return false;
      }
    },
    maxRetries: 1,
    retryDelay: 500
  },
  
  aiDecisionFallback: {
    name: 'AI Decision Fallback',
    description: 'Switch to manual mode when AI decisions fail',
    execute: async (error: GameError) => {
      try {
        // Disable AI automation temporarily
        localStorage.setItem('ai_automation_disabled', 'true');
        localStorage.setItem('ai_automation_disabled_until', 
          (Date.now() + 5 * 60 * 1000).toString()); // 5 minutes
        
        // Notify user
        toast.warning('AI automation temporarily disabled. Switching to manual mode.');
        return true;
      } catch {
        return false;
      }
    },
    maxRetries: 1,
    retryDelay: 0
  },
  
  investigationReset: {
    name: 'Investigation Reset',
    description: 'Reset investigation state and retry',
    execute: async (error: GameError) => {
      try {
        const { targetId } = error.context;
        if (targetId) {
          await fetch(`/api/investigation/reset/${targetId}`, {
            method: 'POST'
          });
        }
        return true;
      } catch {
        return false;
      }
    },
    maxRetries: 1,
    retryDelay: 2000
  },
  
  hackingCooldown: {
    name: 'Hacking Cooldown',
    description: 'Apply cooldown period before retrying hacking operations',
    execute: async (error: GameError) => {
      try {
        const { technique, target } = error.context;
        const cooldownKey = `hacking_cooldown_${technique}_${target}`;
        const cooldownUntil = Date.now() + 30000; // 30 seconds
        
        localStorage.setItem(cooldownKey, cooldownUntil.toString());
        return true;
      } catch {
        return false;
      }
    },
    maxRetries: 1,
    retryDelay: 30000
  }
};

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: GameError[] = [];
  private recoveryAttempts: Map<string, number> = new Map();
  private suppressedErrors: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle error with automatic recovery attempts
  public async handleError(error: GameError): Promise<boolean> {
    // Log error
    this.logError(error);
    
    // Check if error should be suppressed
    const errorKey = this.getErrorKey(error);
    if (this.suppressedErrors.has(errorKey)) {
      return false;
    }
    
    // Show user notification based on severity
    this.showUserNotification(error);
    
    // Attempt recovery if error is recoverable
    if (error.recoverable) {
      const recovered = await this.attemptRecovery(error);
      if (recovered) {
        toast.success('Issue resolved automatically.');
        return true;
      }
    }
    
    // If critical error and not recoverable, take emergency actions
    if (error.severity === ErrorSeverity.CRITICAL && !error.recoverable) {
      await this.handleCriticalError(error);
    }
    
    return false;
  }

  // Log error for debugging and analytics
  private logError(error: GameError): void {
    this.errorLog.push(error);
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${error.type} Error - ${error.severity}`);
      console.error('Message:', error.message);
      console.error('Context:', error.context);
      console.error('Stack:', error.stack);
      console.error('Technical Details:', error.technicalDetails);
      console.groupEnd();
    }
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorAnalytics(error);
    }
  }

  // Show appropriate user notification
  private showUserNotification(error: GameError): void {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        // Don't show notification for low severity errors
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(error.userMessage);
        break;
      case ErrorSeverity.HIGH:
        toast.error(error.userMessage);
        break;
      case ErrorSeverity.CRITICAL:
        toast.error(error.userMessage, {
          duration: 10000,
          action: {
            label: 'Report Issue',
            onClick: () => this.reportError(error)
          }
        });
        break;
    }
  }

  // Attempt error recovery
  private async attemptRecovery(error: GameError): Promise<boolean> {
    const strategy = this.getRecoveryStrategy(error);
    if (!strategy) return false;
    
    const errorKey = this.getErrorKey(error);
    const attempts = this.recoveryAttempts.get(errorKey) || 0;
    
    if (attempts >= strategy.maxRetries) {
      return false;
    }
    
    // Wait for retry delay
    if (strategy.retryDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, strategy.retryDelay * Math.pow(2, attempts)));
    }
    
    try {
      const success = await strategy.execute(error);
      
      if (success) {
        this.recoveryAttempts.delete(errorKey);
        return true;
      } else {
        this.recoveryAttempts.set(errorKey, attempts + 1);
        return false;
      }
    } catch (recoveryError) {
      console.error('Recovery strategy failed:', recoveryError);
      this.recoveryAttempts.set(errorKey, attempts + 1);
      return false;
    }
  }

  // Get appropriate recovery strategy for error type
  private getRecoveryStrategy(error: GameError): RecoveryStrategy | null {
    switch (error.type) {
      case ErrorType.NETWORK:
        return recoveryStrategies.networkRetry;
      case ErrorType.AUTHENTICATION:
        return recoveryStrategies.authRefresh;
      case ErrorType.AI_DECISION:
        return recoveryStrategies.aiDecisionFallback;
      case ErrorType.INVESTIGATION:
        return recoveryStrategies.investigationReset;
      case ErrorType.HACKING:
        return recoveryStrategies.hackingCooldown;
      default:
        return null;
    }
  }

  // Handle critical errors
  private async handleCriticalError(error: GameError): Promise<void> {
    // Save current game state
    try {
      const gameState = this.captureGameState();
      localStorage.setItem('emergency_save', JSON.stringify({
        state: gameState,
        timestamp: new Date().toISOString(),
        error: {
          type: error.type,
          message: error.message,
          context: error.context
        }
      }));
    } catch (saveError) {
      console.error('Failed to save emergency state:', saveError);
    }
    
    // Disable problematic systems
    if (error.type === ErrorType.AI_DECISION) {
      localStorage.setItem('ai_systems_disabled', 'true');
    }
    
    if (error.type === ErrorType.INVESTIGATION) {
      localStorage.setItem('investigation_disabled', 'true');
    }
  }

  // Capture current game state for emergency save
  private captureGameState(): any {
    try {
      return {
        player: JSON.parse(localStorage.getItem('player_data') || '{}'),
        progress: JSON.parse(localStorage.getItem('game_progress') || '{}'),
        settings: JSON.parse(localStorage.getItem('game_settings') || '{}')
      };
    } catch {
      return {};
    }
  }

  // Generate unique key for error tracking
  private getErrorKey(error: GameError): string {
    return `${error.type}_${error.message}_${JSON.stringify(error.context)}`;
  }

  // Send error analytics (placeholder for production implementation)
  private sendErrorAnalytics(error: GameError): void {
    // In production, this would send to analytics service
    // For now, just store locally for debugging
    const analytics = JSON.parse(localStorage.getItem('error_analytics') || '[]');
    analytics.push({
      type: error.type,
      severity: error.severity,
      message: error.message,
      timestamp: error.timestamp.toISOString(),
      context: error.context,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Keep only last 50 analytics entries
    if (analytics.length > 50) {
      analytics.splice(0, analytics.length - 50);
    }
    
    localStorage.setItem('error_analytics', JSON.stringify(analytics));
  }

  // Report error to support (placeholder)
  private reportError(error: GameError): void {
    // In production, this would open a support ticket or feedback form
    console.log('Error reported:', error);
    toast.info('Error report submitted. Thank you for helping us improve!');
  }

  // Suppress specific error types temporarily
  public suppressError(errorType: ErrorType, duration: number = 60000): void {
    const errorKey = errorType.toString();
    this.suppressedErrors.add(errorKey);
    
    setTimeout(() => {
      this.suppressedErrors.delete(errorKey);
    }, duration);
  }

  // Get error statistics
  public getErrorStats(): any {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      recent: this.errorLog.filter(e => 
        Date.now() - e.timestamp.getTime() < 60000 // Last minute
      ).length
    };
    
    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });
    
    return stats;
  }

  // Clear error log
  public clearErrorLog(): void {
    this.errorLog = [];
    this.recoveryAttempts.clear();
  }
}

// Utility functions for common error scenarios
export const createNetworkError = (url: string, status?: number, options?: any): GameError => {
  return new GameError(
    `Network request failed: ${url}`,
    ErrorType.NETWORK,
    status && status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
    { url, status, options },
    true,
    status === 429 ? 'Too many requests. Please wait before trying again.' : undefined
  );
};

export const createValidationError = (field: string, value: any, rule: string): GameError => {
  return new GameError(
    `Validation failed for ${field}: ${rule}`,
    ErrorType.VALIDATION,
    ErrorSeverity.LOW,
    { field, value, rule },
    true,
    `Invalid ${field}. Please check your input.`
  );
};

export const createAIDecisionError = (context: any, reason: string): GameError => {
  return new GameError(
    `AI decision system error: ${reason}`,
    ErrorType.AI_DECISION,
    ErrorSeverity.MEDIUM,
    context,
    true
  );
};

export const createInvestigationError = (targetId: string, operation: string, reason: string): GameError => {
  return new GameError(
    `Investigation operation '${operation}' failed: ${reason}`,
    ErrorType.INVESTIGATION,
    ErrorSeverity.MEDIUM,
    { targetId, operation },
    true
  );
};

export const createHackingError = (technique: string, target: string, reason: string): GameError => {
  return new GameError(
    `Hacking attempt failed: ${reason}`,
    ErrorType.HACKING,
    ErrorSeverity.MEDIUM,
    { technique, target },
    true,
    `Hacking operation failed. ${reason}`
  );
};

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Global error boundary for React components
export const handleComponentError = (error: Error, errorInfo: any): void => {
  const gameError = new GameError(
    error.message,
    ErrorType.CLIENT,
    ErrorSeverity.HIGH,
    { stack: error.stack, errorInfo },
    false,
    'A component error occurred. Please refresh the page.'
  );
  
  errorHandler.handleError(gameError);
};

// Async error wrapper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorType: ErrorType = ErrorType.CLIENT
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      const gameError = new GameError(
        error instanceof Error ? error.message : 'Unknown error',
        errorType,
        ErrorSeverity.MEDIUM,
        { args, originalError: error },
        true
      );
      
      await errorHandler.handleError(gameError);
      return null;
    }
  };
};

// Network request wrapper with error handling
export const fetchWithErrorHandling = async (
  url: string, 
  options?: RequestInit
): Promise<Response | null> => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = createNetworkError(url, response.status, options);
      await errorHandler.handleError(error);
      return null;
    }
    
    return response;
  } catch (error) {
    const gameError = createNetworkError(url, undefined, options);
    await errorHandler.handleError(gameError);
    return null;
  }
};

export default errorHandler;