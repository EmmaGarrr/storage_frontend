import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Logging service for DirectDrive frontend
 * Provides detailed logging for file operations, user actions, and performance metrics
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private readonly apiUrl = environment.apiUrl;
  private readonly isProduction = environment.production;
  private sessionId: string;
  private metrics: { [key: string]: any } = {};

  constructor(private http: HttpClient) {
    // Generate a unique session ID for this browser session
    this.sessionId = this.generateSessionId();
    
    // Initialize performance metrics tracking
    this.resetMetrics();
    
    // Log session start
    this.logEvent('session_start', { 
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      sessionId: this.sessionId
    });
  }

  /**
   * Log a file upload operation
   * @param phase Upload phase (start, progress, complete, error)
   * @param fileInfo Information about the file being uploaded
   * @param metrics Performance metrics for the upload
   */
  public logFileUpload(phase: 'start' | 'progress' | 'complete' | 'error', 
                      fileInfo: any, metrics?: any): void {
    const logData = {
      operation: 'file_upload',
      phase: phase,
      file: fileInfo,
      metrics: metrics || {},
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    // For progress updates, only log to console to avoid excessive API calls
    if (phase === 'progress') {
      this.logToConsole('UPLOAD_PROGRESS', logData);
      return;
    }

    // For other phases, log to both console and server
    this.logToConsole(`UPLOAD_${phase.toUpperCase()}`, logData);
    
    // Only send logs to server in production to avoid local development noise
    if (this.isProduction) {
      this.sendLogToServer('file_operation', logData);
    }
  }

  /**
   * Log a file download operation
   * @param phase Download phase (start, complete, error)
   * @param fileInfo Information about the file being downloaded
   * @param metrics Performance metrics for the download
   */
  public logFileDownload(phase: 'start' | 'complete' | 'error', 
                        fileInfo: any, metrics?: any): void {
    const logData = {
      operation: 'file_download',
      phase: phase,
      file: fileInfo,
      metrics: metrics || {},
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.logToConsole(`DOWNLOAD_${phase.toUpperCase()}`, logData);
    
    if (this.isProduction) {
      this.sendLogToServer('file_operation', logData);
    }
  }

  /**
   * Log a user action (button click, navigation, etc.)
   * @param action The action performed
   * @param details Additional details about the action
   */
  public logUserAction(action: string, details?: any): void {
    const logData = {
      action: action,
      details: details || {},
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.logToConsole('USER_ACTION', logData);
    
    if (this.isProduction) {
      this.sendLogToServer('user_action', logData);
    }
  }

  /**
   * Log an error that occurred in the application
   * @param error The error object or message
   * @param context Context information about where the error occurred
   */
  public logError(error: any, context?: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    const logData = {
      error: errorMessage,
      stack: stackTrace,
      context: context || {},
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.logToConsole('ERROR', logData, 'error');
    
    // Always send errors to server, even in development
    this.sendLogToServer('error', logData);
  }

  /**
   * Start timing an operation for performance tracking
   * @param operationName Name of the operation to time
   */
  public startTiming(operationName: string): void {
    this.metrics[operationName] = {
      startTime: performance.now(),
      checkpoints: []
    };
  }

  /**
   * Add a checkpoint to a timed operation
   * @param operationName Name of the operation
   * @param checkpointName Name of the checkpoint
   */
  public addTimingCheckpoint(operationName: string, checkpointName: string): void {
    if (this.metrics[operationName]) {
      this.metrics[operationName].checkpoints.push({
        name: checkpointName,
        time: performance.now(),
        elapsedSinceStart: performance.now() - this.metrics[operationName].startTime
      });
    }
  }

  /**
   * End timing an operation and get the results
   * @param operationName Name of the operation
   * @returns Timing metrics for the operation
   */
  public endTiming(operationName: string): any {
    if (this.metrics[operationName]) {
      const endTime = performance.now();
      const duration = endTime - this.metrics[operationName].startTime;
      
      const result = {
        operationName,
        duration,
        startTime: this.metrics[operationName].startTime,
        endTime,
        checkpoints: this.metrics[operationName].checkpoints
      };
      
      // Clean up
      delete this.metrics[operationName];
      
      return result;
    }
    
    return null;
  }

  /**
   * Reset all performance metrics
   */
  public resetMetrics(): void {
    this.metrics = {};
  }

  /**
   * Generate a unique session ID
   * @returns Unique session ID
   */
  private generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Log data to the browser console
   * @param level Log level
   * @param data Data to log
   * @param consoleMethod Console method to use
   */
  private logToConsole(level: string, data: any, consoleMethod: 'log' | 'info' | 'warn' | 'error' = 'info'): void {
    // Only log to console in development or if explicitly enabled in production
    if (!this.isProduction || localStorage.getItem('enableVerboseLogging') === 'true') {
      console[consoleMethod](`[DirectDrive] [${level}]`, data);
    }
  }

  /**
   * Send log data to the server
   * @param logType Type of log
   * @param logData Log data
   */
  private sendLogToServer(logType: string, logData: any): void {
    // Only send logs to server if we have an API URL configured
    if (this.apiUrl) {
      // Fire and forget - don't wait for response
      this.http.post(`${this.apiUrl}/api/v1/logs/${logType}`, logData)
        .subscribe({
          error: (err) => {
            // Just log to console if there's an error sending logs
            console.error('[DirectDrive] Error sending logs to server:', err);
          }
        });
    }
  }

  /**
   * Log a generic event
   * @param eventName Name of the event
   * @param eventData Event data
   */
  public logEvent(eventName: string, eventData: any): void {
    const logData = {
      event: eventName,
      data: eventData,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.logToConsole('EVENT', logData);
    
    if (this.isProduction) {
      this.sendLogToServer('event', logData);
    }
  }
}
