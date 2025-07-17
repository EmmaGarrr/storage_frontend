// // CORRECTED File: src/app/componet/batch-upload.component.ts

// import { Component, OnDestroy } from '@angular/core';
// import { MatSnackBar } from '@angular/material/snack-bar';
// import { Subscription, forkJoin, Observable, Observer } from 'rxjs';
// import { catchError, tap } from 'rxjs/operators';
// import { BatchUploadService, IBatchFileInfo } from '../shared/services/batch-upload.service';
// import { UploadEvent } from '../shared/services/upload.service';
// import { environment } from '../../environments/environment';

// interface IFileState {
//   file: File;
//   state: 'pending' | 'uploading' | 'success' | 'error';
//   progress: number;
//   error?: string;
// }
// type BatchUploadState = 'idle' | 'processing' | 'success' | 'error';

// @Component({
//   selector: 'app-batch-upload',
//   templateUrl: './batch-upload.component.html',
//   styleUrls: ['./batch-upload.component.css']
// })
// export class BatchUploadComponent implements OnDestroy {
//   public files: IFileState[] = [];
//   public batchState: BatchUploadState = 'idle';
//   public finalBatchLink: string | null = null;
//   private subscriptions: Subscription[] = [];
//   private wsUrl = environment.wsUrl;

//   // --- V V V --- ADD THIS GETTER --- V V V ---
//   /**
//    * A helper property to check if all files have finished uploading (or failed).
//    * This keeps complex logic out of the HTML template.
//    */
//   public get isUploadFinished(): boolean {
//     if (this.files.length === 0) return true;
//     return this.files.every(f => f.state !== 'uploading');
//   }
//   // --- ^ ^ ^ --- END OF ADDITION --- ^ ^ ^ ---

//   constructor(
//     private batchUploadService: BatchUploadService,
//     private snackBar: MatSnackBar
//   ) {}

//   onFilesSelected(event: any): void {
//     const selectedFiles = (event.target as HTMLInputElement).files;
//     if (selectedFiles && selectedFiles.length > 0) {
//       this.reset();
//       this.files = Array.from(selectedFiles).map(file => ({
//         file, state: 'pending', progress: 0
//       }));
//     }
//   }

//   onUploadBatch(): void {
//     if (this.files.length === 0) return;
//     this.batchState = 'processing';
//     const batchFileInfos: IBatchFileInfo[] = this.files.map(fs => ({
//       filename: fs.file.name,
//       size: fs.file.size,
//       content_type: fs.file.type || 'application/octet-stream'
//     }));

//     const sub = this.batchUploadService.initiateBatch(batchFileInfos).subscribe({
//       next: (response) => {
//         const uploadObservables = response.files.map(fileInfo => {
//           const fileState = this.files.find(fs => fs.file.name === fileInfo.original_filename);
//           if (!fileState) return new Observable<null>(sub => sub.complete());

//           fileState.state = 'uploading';
//           // Replicate the WebSocket logic from UploadService here, using pre-fetched details
//           return this.createIndividualUploadObservable(fileState, fileInfo.file_id, fileInfo.gdrive_upload_url);
//         });

//         const uploadSub = forkJoin(uploadObservables).subscribe(() => {
//           this.checkBatchCompletion(response.batch_id);
//         });
//         this.subscriptions.push(uploadSub);
//       },
//       error: (err) => {
//         this.batchState = 'error';
//         this.snackBar.open(err.error?.detail || 'Failed to initiate batch upload.', 'Close', { duration: 5000 });
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   private createIndividualUploadObservable(fileState: IFileState, fileId: string, gdriveUploadUrl: string): Observable<UploadEvent | null> {
//     return new Observable((observer: Observer<UploadEvent | null>) => {
//       const finalWsUrl = `${this.wsUrl}/upload/${fileId}?gdrive_url=${encodeURIComponent(gdriveUploadUrl)}`;
//       const ws = new WebSocket(finalWsUrl);

//       ws.onopen = () => this.sliceAndSend(fileState.file, ws);
//       ws.onmessage = (event) => {
//         const message: UploadEvent = JSON.parse(event.data);
//         if (message.type === 'progress') {
//           fileState.progress = message.value;
//         } else if (message.type === 'success') {
//           fileState.state = 'success';
//           fileState.progress = 100;
//           observer.next(message);
//           observer.complete();
//         }
//       };
//       ws.onerror = () => {
//         fileState.state = 'error';
//         fileState.error = 'Connection to server failed.';
//         observer.next(null);
//         observer.complete();
//       };
//       ws.onclose = (event) => {
//         if (!event.wasClean && fileState.state !== 'success') {
//           fileState.state = 'error';
//           fileState.error = 'Lost connection to server.';
//         }
//         observer.next(null);
//         observer.complete();
//       };

//       return () => {
//         if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
//           ws.close();
//         }
//       };
//     });
//   }

//   private sliceAndSend(file: File, ws: WebSocket, start: number = 0): void {
//     const CHUNK_SIZE = 4 * 1024 * 1024;
//     if (start >= file.size) {
//       ws.send('DONE');
//       return;
//     }
//     const end = Math.min(start + CHUNK_SIZE, file.size);
//     const chunk = file.slice(start, end);
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       if (ws.readyState === WebSocket.OPEN) {
//         ws.send(e.target?.result as ArrayBuffer);
//         this.sliceAndSend(file, ws, end);
//       }
//     };
//     reader.readAsArrayBuffer(chunk);
//   }

//   private checkBatchCompletion(batchId: string): void {
//     const allFinished = this.files.every(fs => fs.state === 'success' || fs.state === 'error');
//     if (!allFinished) return;

//     const anyFailed = this.files.some(fs => fs.state === 'error');
//     if (anyFailed) {
//         this.batchState = 'error';
//         this.snackBar.open('Some files failed to upload.', 'Close', { duration: 5000 });
//     } else {
//         this.batchState = 'success';
//         this.finalBatchLink = `${window.location.origin}/batch-download/${batchId}`;
//         this.snackBar.open('Batch upload complete!', 'Close', { duration: 3000 });
//     }
//   }

//   reset(): void {
//     this.files = [];
//     this.batchState = 'idle';
//     this.finalBatchLink = null;
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//     this.subscriptions = [];
//   }

//   copyLink(link: string): void {
//     navigator.clipboard.writeText(link).then(() => {
//       this.snackBar.open('Batch link copied to clipboard!', 'Close', { duration: 2000 });
//     });
//   }

//   onDragOver(event: DragEvent) { event.preventDefault(); }
//   onDragLeave(event: DragEvent) { event.preventDefault(); }
//   onDrop(event: DragEvent) {
//       event.preventDefault();
//       if (this.batchState === 'idle' && event.dataTransfer?.files.length) {
//           this.reset();
//           this.files = Array.from(event.dataTransfer.files).map(file => ({
//             file, state: 'pending', progress: 0
//           }));
//       }
//   }

//   ngOnDestroy(): void {
//     this.reset();
//   }
// }

//////////////////////////////////////////////////////

// In file: src/app/componet/batch-upload.component.ts

import { Component, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { BatchUploadService, IBatchFileInfo } from '../shared/services/batch-upload.service';
// --- FIX: Import the simplified UploadService for the verify step ---
import { UploadService } from '../shared/services/upload.service'; 

// --- This interface remains as it's used for UI state ---
interface IFileState {
  file: File;
  state: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}
type BatchUploadState = 'idle' | 'processing' | 'success' | 'error';

@Component({
  selector: 'app-batch-upload',
  templateUrl: './batch-upload.component.html',
  styleUrls: ['./batch-upload.component.css']
})
export class BatchUploadComponent implements OnDestroy {
  public files: IFileState[] = [];
  public batchState: BatchUploadState = 'idle';
  public finalBatchLink: string | null = null;
  private subscriptions: Subscription = new Subscription();

  public get isUploadFinished(): boolean {
    if (this.files.length === 0) return true;
    return this.files.every(f => f.state !== 'uploading');
  }

  constructor(
    private batchUploadService: BatchUploadService,
    private snackBar: MatSnackBar,
    // --- FIX: Inject HttpClient and the simplified UploadService ---
    private http: HttpClient,
    private uploadService: UploadService 
  ) {}

  onFilesSelected(event: any): void {
    const selectedFiles = (event.target as HTMLInputElement).files;
    if (selectedFiles && selectedFiles.length > 0) {
      this.reset();
      this.files = Array.from(selectedFiles).map(file => ({
        file, state: 'pending', progress: 0
      }));
    }
  }

  // --- MODIFIED: This now uses the new stateless upload logic ---
  onUploadBatch(): void {
    if (this.files.length === 0) return;
    this.batchState = 'processing';
    const batchFileInfos: IBatchFileInfo[] = this.files.map(fs => ({
      filename: fs.file.name,
      size: fs.file.size,
      content_type: fs.file.type || 'application/octet-stream'
    }));

    const sub = this.batchUploadService.initiateBatch(batchFileInfos).subscribe({
      next: (response) => {
        const uploadPromises = response.files.map(fileInfo => {
          const fileState = this.files.find(fs => fs.file.name === fileInfo.original_filename);
          if (!fileState) return Promise.resolve();

          fileState.state = 'uploading';
          
          return new Promise<void>(async (resolve) => {
            try {
              const gdriveId = await this.uploadFileDirectly(
                fileInfo.file_id,
                fileInfo.gdrive_upload_url,
                fileState.file,
                (progress) => { fileState.progress = progress; }
              );
              await lastValueFrom(this.uploadService.verifyUpload(fileInfo.file_id, gdriveId));
              fileState.state = 'success';
            } catch (error: any) {
              fileState.state = 'error';
              fileState.error = error.message || 'Upload failed';
            } finally {
              resolve(); // Resolve promise whether it succeeded or failed
            }
          });
        });

        // Wait for all individual file uploads to complete (or fail)
        Promise.all(uploadPromises).then(() => {
          this.checkBatchCompletion(response.batch_id);
        });
      },
      error: (err) => {
        this.batchState = 'error';
        this.snackBar.open(err.error?.detail || 'Failed to initiate batch upload.', 'Close', { duration: 5000 });
      }
    });
    this.subscriptions.add(sub);
  }

  // --- REMOVED: The old WebSocket methods `createIndividualUploadObservable` and `sliceAndSend` are gone. ---
  
  // --- NEW: The core stateless upload logic is added here. ---
  private async uploadFileDirectly(fileId: string, gdriveUrl: string, file: File, onProgress: (percent: number) => void): Promise<string> {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    let bytesSent = 0;

    for (let i = 0; i < Math.ceil(file.size / CHUNK_SIZE); i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const headers = new HttpHeaders({
        'X-Gdrive-Url': gdriveUrl,
        'X-Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
        'X-Content-Length': `${chunk.size}`,
      });

      try {
        const response: any = await lastValueFrom(
          this.http.put('/api/proxy-chunk', chunk, { headers })
        );
        bytesSent = end;
        onProgress(Math.round((bytesSent / file.size) * 100));

        if (response?.final) {
          return response.data.id;
        }
      } catch (error: any) {
        console.error(`Chunk upload failed for fileId ${fileId}:`, error);
        throw new Error(error.error?.error || 'A chunk failed to upload.');
      }
    }
    throw new Error('Upload loop finished without a final response from Google Drive.');
  }

  private checkBatchCompletion(batchId: string): void {
    const anyFailed = this.files.some(fs => fs.state === 'error');
    if (anyFailed) {
      this.batchState = 'error';
      this.snackBar.open('Some files failed to upload. Please review status.', 'Close', { duration: 7000 });
    } else {
      this.batchState = 'success';
      this.finalBatchLink = `${window.location.origin}/batch-download/${batchId}`;
      this.snackBar.open('Batch upload complete!', 'Close', { duration: 3000 });
    }
  }

  reset(): void {
    this.files = [];
    this.batchState = 'idle';
    this.finalBatchLink = null;
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  copyLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Batch link copied to clipboard!', 'Close', { duration: 2000 });
    });
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }
  onDragLeave(event: DragEvent) { event.preventDefault(); }
  onDrop(event: DragEvent) {
      event.preventDefault();
      if (this.batchState === 'idle' && event.dataTransfer?.files.length) {
          this.reset();
          this.files = Array.from(event.dataTransfer.files).map(file => ({
            file, state: 'pending', progress: 0
          }));
      }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}