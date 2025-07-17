// In file: Frontend/src/app/shared/services/upload.service.ts

import { HttpClient, HttpEvent, HttpEventType, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoggingService } from './logging.service';

/**
 * Event emitted during the upload process
 */
export interface UploadEvent {
  type: 'progress' | 'success' | 'error';
  value: any; // progress percentage, download URL, or error message
}

/**
 * Response from the upload endpoint
 */
interface UploadResponse {
  file_id: string;
  share_url: string;
}

/**
 * Service for handling file uploads to the DirectDrive backend
 */
@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = environment.apiUrl;
  private downloadBaseUrl = environment.downloadBaseUrl;

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) { }

  /**
   * Upload a file using HTTP multipart/form-data
   * 
   * @param file The file to upload
   * @returns Observable that emits progress, success, or error events
   */
  public upload(file: File): Observable<UploadEvent> {
    // Start timing the upload operation
    this.loggingService.startTiming('file_upload');
    
    // Log upload start with file metadata
    this.loggingService.logFileUpload('start', {
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // Create the HTTP request using the File object directly as body (no FormData)
    const headers = new HttpHeaders({
      'X-File-Name': file.name,
      'X-File-Type': file.type || 'application/octet-stream',
      'Content-Type': file.type || 'application/octet-stream'
    });

    const req = new HttpRequest<any>('POST', `${this.apiUrl}/api/v1/upload`, file, {
      reportProgress: true,
      responseType: 'json',
      headers
    });

    // Send the request and map the events
    return this.http.request(req).pipe(
      tap((event: HttpEvent<any>) => {
        // Log progress events
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
          
          // Add checkpoints at 25%, 50%, 75%, and 100%
          if (progress === 25 || progress === 50 || progress === 75 || progress === 100) {
            this.loggingService.addTimingCheckpoint('file_upload', `upload_${progress}pct`);
          }
          
          // Log progress every 10%
          if (progress % 10 === 0) {
            this.loggingService.logFileUpload('progress', {
              filename: file.name,
              fileSize: file.size,
              progress: progress,
              loaded: event.loaded,
              total: event.total
            }, {
              uploadSpeed: this.calculateUploadSpeed(event.loaded, this.loggingService.endTiming('file_upload')?.duration || 0)
            });
            
            // Restart timing for next progress segment
            this.loggingService.startTiming('file_upload');
          }
        }
        
        // Log response
        if (event.type === HttpEventType.Response) {
          const body = event.body as UploadResponse;
          const timingData = this.loggingService.endTiming('file_upload');
          
          this.loggingService.logFileUpload('complete', {
            filename: file.name,
            fileSize: file.size,
            fileType: file.type,
            shareUrl: body.share_url,
            fileId: body.file_id
          }, {
            totalDuration: timingData?.duration,
            checkpoints: timingData?.checkpoints
          });
        }
      }),
      map((event: HttpEvent<any>) => this.getEventFromResponse(event)),
      catchError(error => {
        // Log the error
        this.loggingService.logFileUpload('error', {
          filename: file.name,
          fileSize: file.size,
          fileType: file.type
        }, {
          error: error.message || 'Unknown error',
          status: error.status,
          statusText: error.statusText
        });
        
        this.loggingService.logError(error, {
          operation: 'file_upload',
          filename: file.name,
          fileSize: file.size
        });
        
        const errorMsg = error.error?.detail || 'File upload failed. Please try again.';
        return throwError(() => ({ type: 'error', value: errorMsg }));
      })
    );
  }

  /**
   * Convert HTTP events to UploadEvent objects
   * 
   * @param event HTTP event from the request
   * @returns Mapped UploadEvent
   */
  private getEventFromResponse(event: HttpEvent<any>): UploadEvent {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        // Calculate and return the upload progress percentage
        const progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
        return { type: 'progress', value: progress };

      case HttpEventType.Response:
        // Return the success event with the share URL
        const body = event.body as UploadResponse;
        return { 
          type: 'success', 
          value: body.share_url 
        };

      default:
        // Ignore other event types
        return { type: 'progress', value: 0 };
    }
  }

  /**
   * Get the download URL for a file
   * 
   * @param remotePath The remote path of the file
   * @returns The full download URL
   */
  public getDownloadUrl(remotePath: string): string {
    return `${this.downloadBaseUrl}/${remotePath}`;
  }
  
  /**
   * Calculate the upload speed in KB/s
   * 
   * @param bytesUploaded Number of bytes uploaded
   * @param milliseconds Time elapsed in milliseconds
   * @returns Upload speed in KB/s
   */
  private calculateUploadSpeed(bytesUploaded: number, milliseconds: number): number {
    if (!milliseconds) return 0;
    const seconds = milliseconds / 1000;
    const kilobytes = bytesUploaded / 1024;
    return Math.round((kilobytes / seconds) * 100) / 100; // KB/s with 2 decimal places
  }
}