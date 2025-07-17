// // // // ENHANCED File: src/app/componet/home/home.component.ts

// // // import { Component, OnDestroy } from '@angular/core';
// // // import { UploadService, UploadEvent } from '../../shared/services/upload.service';
// // // import { Subscription, forkJoin, Observable, Observer } from 'rxjs';
// // // import { MatSnackBar } from '@angular/material/snack-bar';

// // // // --- NEW IMPORTS for Batch Upload ---
// // // import { BatchUploadService, IBatchFileInfo } from '../../shared/services/batch-upload.service';
// // // import { environment } from '../../../environments/environment';

// // // // --- NEW INTERFACE for tracking individual file states in a batch ---
// // // interface IFileState {
// // //   file: File;
// // //   state: 'pending' | 'uploading' | 'success' | 'error';
// // //   progress: number;
// // //   error?: string;
// // // }

// // // // --- MODIFIED: State can now be for single or batch uploads ---
// // // type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';
// // // type BatchUploadState = 'idle' | 'processing' | 'success' | 'error';


// // // @Component({
// // //   selector: 'app-home',
// // //   templateUrl: './home.component.html',
// // //   styleUrls: ['./home.component.css'] // Added styleUrls
// // // })
// // // export class HomeComponent implements OnDestroy {

// // //   // --- STATE FOR SINGLE FILE UPLOAD (Original) ---
// // //   public currentState: UploadState = 'idle';
// // //   public selectedFile: File | null = null;
// // //   public uploadProgress = 0;
// // //   public finalDownloadLink: string | null = null;
// // //   public errorMessage: string | null = null;
// // //   private uploadSubscription?: Subscription;

// // //   // --- NEW STATE FOR BATCH FILE UPLOAD ---
// // //   public isBatchMode = false; // The new toggle state, defaults to single file mode
// // //   public batchFiles: IFileState[] = [];
// // //   public batchState: BatchUploadState = 'idle';
// // //   public finalBatchLink: string | null = null;
// // //   private batchSubscriptions: Subscription[] = [];
// // //   private wsUrl = environment.wsUrl;

// // //   // --- V V V --- ADD THIS NEW GETTER --- V V V ---
// // //   /**
// // //    * Helper property for the template to check if all batch uploads are done.
// // //    */
// // //   public get isBatchUploadFinished(): boolean {
// // //     if (this.batchFiles.length === 0) return true;
// // //     return this.batchFiles.every(f => f.state !== 'uploading');
// // //   }
// // //   // --- ^ ^ ^ --- END OF GETTER ADDITION --- ^ ^ ^ ---


// // //   constructor(
// // //     private uploadService: UploadService,
// // //     private snackBar: MatSnackBar,
// // //     private batchUploadService: BatchUploadService // --- NEW: Injected Batch Service ---
// // //   ) {}

// // //   // --- NEW: Method to toggle between single and batch mode ---
// // //   toggleMode(event: Event): void {
// // //   // Safely cast the event target to an HTMLInputElement to access its 'checked' property
// // //   const target = event.target as HTMLInputElement;
// // //   this.isBatchMode = target.checked;
// // //   this.resetState();
// // //   }

// // //   // --- MODIFIED: This now handles both single and multiple file selection ---
// // //   onFileSelected(event: any): void {
// // //     const selected = (event.target as HTMLInputElement).files;
// // //     if (!selected || selected.length === 0) return;

// // //     this.resetState();

// // //     if (this.isBatchMode) {
// // //       // Logic for Batch Mode
// // //       this.batchState = 'idle';
// // //       this.batchFiles = Array.from(selected).map(file => ({
// // //         file, state: 'pending', progress: 0
// // //       }));
// // //     } else {
// // //       // Logic for Single File Mode (Original)
// // //       this.selectedFile = selected[0];
// // //       this.currentState = 'selected';
// // //     }
// // //   }

// // //   // --- TRIGGER METHOD FOR UPLOAD BUTTON ---
// // //   // The main upload button will call this method.
// // //   // It checks the mode and calls the appropriate upload handler.
// // //   startUpload(): void {
// // //     if (this.isBatchMode) {
// // //       this.onUploadBatch();
// // //     } else {
// // //       this.onUpload();
// // //     }
// // //   }


// // //   // --- SINGLE FILE UPLOAD LOGIC (Original - Unchanged) ---
// // //   onUpload(): void {
// // //     if (!this.selectedFile) return;
// // //     this.currentState = 'uploading';
// // //     this.uploadSubscription = this.uploadService.upload(this.selectedFile).subscribe({
// // //       next: (event: UploadEvent) => {
// // //         if (event.type === 'progress') {
// // //           this.uploadProgress = event.value;
// // //         } else if (event.type === 'success') {
// // //           this.currentState = 'success';
// // //           const backendPath = event.value as string;
// // //           const fileId = backendPath.split('/').pop();
// // //           this.finalDownloadLink = `${window.location.origin}/download/${fileId}`;
// // //           this.snackBar.open('Upload complete!', 'Close', { duration: 3000 });
// // //         }
// // //       },
// // //       error: (err) => {
// // //         this.currentState = 'error';
// // //         this.errorMessage = err.value || 'An unknown error occurred.';
// // //       }
// // //     });
// // //   }


// // //   // --- BATCH FILE UPLOAD LOGIC (New - Copied from BatchUploadComponent) ---
// // //   onUploadBatch(): void {
// // //     if (this.batchFiles.length === 0) return;
// // //     this.batchState = 'processing';
// // //     const batchFileInfos: IBatchFileInfo[] = this.batchFiles.map(fs => ({
// // //       filename: fs.file.name,
// // //       size: fs.file.size,
// // //       content_type: fs.file.type || 'application/octet-stream'
// // //     }));

// // //     const sub = this.batchUploadService.initiateBatch(batchFileInfos).subscribe({
// // //       next: (response) => {
// // //         const uploadObservables = response.files.map(fileInfo => {
// // //           const fileState = this.batchFiles.find(fs => fs.file.name === fileInfo.original_filename);
// // //           if (!fileState) return new Observable<null>(s => s.complete());

// // //           fileState.state = 'uploading';
// // //           return this.createIndividualUploadObservable(fileState, fileInfo.file_id, fileInfo.gdrive_upload_url);
// // //         });

// // //         const uploadSub = forkJoin(uploadObservables).subscribe(() => {
// // //           this.checkBatchCompletion(response.batch_id);
// // //         });
// // //         this.batchSubscriptions.push(uploadSub);
// // //       },
// // //       error: (err) => {
// // //         this.batchState = 'error';
// // //         this.snackBar.open(err.error?.detail || 'Failed to initiate batch upload.', 'Close', { duration: 5000 });
// // //       }
// // //     });
// // //     this.batchSubscriptions.push(sub);
// // //   }

// // //   private createIndividualUploadObservable(fileState: IFileState, fileId: string, gdriveUploadUrl: string): Observable<UploadEvent | null> {
// // //     return new Observable((observer: Observer<UploadEvent | null>) => {
// // //       const finalWsUrl = `${this.wsUrl}/upload/${fileId}?gdrive_url=${encodeURIComponent(gdriveUploadUrl)}`;
// // //       const ws = new WebSocket(finalWsUrl);

// // //       ws.onopen = () => this.sliceAndSend(fileState.file, ws);
// // //       ws.onmessage = (event) => {
// // //         const message: UploadEvent = JSON.parse(event.data);
// // //         if (message.type === 'progress') {
// // //           fileState.progress = message.value;
// // //         } else if (message.type === 'success') {
// // //           fileState.state = 'success';
// // //           fileState.progress = 100;
// // //           observer.next(message);
// // //           observer.complete();
// // //         }
// // //       };
// // //       ws.onerror = () => {
// // //         fileState.state = 'error'; fileState.error = 'Connection to server failed.';
// // //         observer.next(null); observer.complete();
// // //       };
// // //       ws.onclose = (event) => {
// // //         if (!event.wasClean && fileState.state !== 'success') {
// // //           fileState.state = 'error'; fileState.error = 'Lost connection to server.';
// // //         }
// // //         observer.next(null); observer.complete();
// // //       };
// // //       return () => {
// // //         if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
// // //       };
// // //     });
// // //   }

// // //   private sliceAndSend(file: File, ws: WebSocket, start: number = 0): void {
// // //     const CHUNK_SIZE = 4 * 1024 * 1024;
// // //     if (start >= file.size) { ws.send('DONE'); return; }
// // //     const end = Math.min(start + CHUNK_SIZE, file.size);
// // //     const chunk = file.slice(start, end);
// // //     const reader = new FileReader();
// // //     reader.onload = (e) => {
// // //       if (ws.readyState === WebSocket.OPEN) {
// // //         ws.send(e.target?.result as ArrayBuffer);
// // //         this.sliceAndSend(file, ws, end);
// // //       }
// // //     };
// // //     reader.readAsArrayBuffer(chunk);
// // //   }

// // //   private checkBatchCompletion(batchId: string): void {
// // //     const anyFailed = this.batchFiles.some(fs => fs.state === 'error');
// // //     if (anyFailed) {
// // //       this.batchState = 'error';
// // //       this.snackBar.open('Some files failed to upload.', 'Close', { duration: 5000 });
// // //     } else {
// // //       this.batchState = 'success';
// // //       this.finalBatchLink = `${window.location.origin}/batch-download/${batchId}`;
// // //       this.snackBar.open('Batch upload complete!', 'Close', { duration: 3000 });
// // //     }
// // //   }

// // //   // --- MODIFIED: Reset now clears state for both modes ---
// // //   resetState(): void {
// // //     // Single file state
// // //     this.uploadSubscription?.unsubscribe();
// // //     this.selectedFile = null;
// // //     this.uploadProgress = 0;
// // //     this.finalDownloadLink = null;
// // //     this.errorMessage = null;
// // //     this.currentState = 'idle';

// // //     // Batch file state
// // //     this.batchSubscriptions.forEach(sub => sub.unsubscribe());
// // //     this.batchFiles = [];
// // //     this.finalBatchLink = null;
// // //     this.batchState = 'idle';
// // //   }

// // //   // For the "Upload Another" button
// // //   startNewUpload(): void {
// // //     this.resetState();
// // //   }

// // //   copyLink(link: string): void {
// // //     navigator.clipboard.writeText(link).then(() => {
// // //       this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
// // //     });
// // //   }

// // //   // --- MODIFIED: Drag and Drop now checks the mode ---
// // //   onDragOver(event: DragEvent) { event.preventDefault(); }
// // //   onDragLeave(event: DragEvent) { event.preventDefault(); }
// // //   onDrop(event: DragEvent) {
// // //     event.preventDefault();
// // //     if (this.currentState === 'uploading' || this.batchState === 'processing') return;

// // //     const droppedFiles = event.dataTransfer?.files;
// // //     if (!droppedFiles || droppedFiles.length === 0) return;

// // //     this.resetState();

// // //     if (this.isBatchMode) {
// // //       this.batchFiles = Array.from(droppedFiles).map(file => ({
// // //         file, state: 'pending', progress: 0
// // //       }));
// // //     } else {
// // //       this.selectedFile = droppedFiles[0];
// // //       this.currentState = 'selected';
// // //     }
// // //   }

// // //   ngOnDestroy(): void {
// // //     this.uploadSubscription?.unsubscribe();
// // //     this.batchSubscriptions.forEach(sub => sub.unsubscribe());
// // //   }
// // // }



// // // REFACTORED File: src/app/componet/home/home.component.ts

// // import { Component, OnDestroy } from '@angular/core';
// // import { UploadService, UploadEvent } from '../../shared/services/upload.service';
// // import { Subscription, forkJoin, Observable, Observer } from 'rxjs';
// // import { MatSnackBar } from '@angular/material/snack-bar';
// // import { BatchUploadService, IBatchFileInfo } from '../../shared/services/batch-upload.service';
// // import { environment } from '../../../environments/environment';

// // interface IFileState {
// //   file: File;
// //   state: 'pending' | 'uploading' | 'success' | 'error';
// //   progress: number;
// //   error?: string;
// // }

// // type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';
// // type BatchUploadState = 'idle' | 'selected' | 'processing' | 'success' | 'error'; // Added 'selected' for batch

// // @Component({
// //   selector: 'app-home',
// //   templateUrl: './home.component.html',
// //   styleUrls: ['./home.component.css']
// // })
// // export class HomeComponent implements OnDestroy {

// //   // State for Single File Upload
// //   public currentState: UploadState = 'idle';
// //   public selectedFile: File | null = null;
// //   public uploadProgress = 0;
// //   public finalDownloadLink: string | null = null;
// //   public errorMessage: string | null = null;
// //   private uploadSubscription?: Subscription;

// //   // State for Batch File Upload
// //   public batchFiles: IFileState[] = [];
// //   public batchState: BatchUploadState = 'idle';
// //   public finalBatchLink: string | null = null;
// //   private batchSubscriptions: Subscription[] = [];
// //   private wsUrl = environment.wsUrl;

// //   constructor(
// //     private uploadService: UploadService,
// //     private snackBar: MatSnackBar,
// //     private batchUploadService: BatchUploadService
// //   ) {}

// //   // This is now the single point of entry for file selection
  
// //   handleFiles(files: FileList | null): void {  if (!files || files.length === 0) return;

// //     this.resetState();

// //     if (files.length === 1) {
// //       // --- SINGLE FILE WORKFLOW ---
// //       this.selectedFile = files[0];
// //       this.currentState = 'selected';
// //     } else {
// //       // --- BATCH FILE WORKFLOW ---
// //       this.batchFiles = Array.from(files).map(file => ({
// //         file, state: 'pending', progress: 0
// //       }));
// //       this.batchState = 'selected'; // New state to show the list before uploading
// //     }
// //   }

// //   // --- SINGLE FILE UPLOAD LOGIC (Original - Unchanged) ---
// //   onUploadSingle(): void {
// //     if (!this.selectedFile) return;
// //     this.currentState = 'uploading';
// //     this.uploadSubscription = this.uploadService.upload(this.selectedFile).subscribe({
// //       next: (event: UploadEvent) => {
// //         if (event.type === 'progress') {
// //           this.uploadProgress = event.value;
// //         } else if (event.type === 'success') {
// //           this.currentState = 'success';
// //           const backendPath = event.value as string;
// //           const fileId = backendPath.split('/').pop();
// //           this.finalDownloadLink = `${window.location.origin}/download/${fileId}`;
// //           this.snackBar.open('Upload complete!', 'Close', { duration: 3000 });
// //         }
// //       },
// //       error: (err) => {
// //         this.currentState = 'error';
// //         this.errorMessage = err.value || 'An unknown error occurred.';
// //       }
// //     });
// //   }

// //   // --- BATCH FILE UPLOAD LOGIC (Original logic, now triggered differently) ---
// //   onUploadBatch(): void {
// //     if (this.batchFiles.length === 0) return;
// //     this.batchState = 'processing';
// //     const batchFileInfos: IBatchFileInfo[] = this.batchFiles.map(fs => ({
// //       filename: fs.file.name,
// //       size: fs.file.size,
// //       content_type: fs.file.type || 'application/octet-stream'
// //     }));

// //     const sub = this.batchUploadService.initiateBatch(batchFileInfos).subscribe({
// //       next: (response) => {
// //         const uploadObservables = response.files.map(fileInfo => {
// //           const fileState = this.batchFiles.find(fs => fs.file.name === fileInfo.original_filename);
// //           if (!fileState) return new Observable<null>(s => s.complete());
// //           fileState.state = 'uploading';
// //           return this.createIndividualUploadObservable(fileState, fileInfo.file_id, fileInfo.gdrive_upload_url);
// //         });
// //         const uploadSub = forkJoin(uploadObservables).subscribe({
// //           complete: () => this.checkBatchCompletion(response.batch_id)
// //         });
// //         this.batchSubscriptions.push(uploadSub);
// //       },
// //       error: (err) => {
// //         this.batchState = 'error';
// //         this.snackBar.open(err.error?.detail || 'Failed to initiate batch upload.', 'Close', { duration: 5000 });
// //       }
// //     });
// //     this.batchSubscriptions.push(sub);
// //   }

// //   // --- Helper methods for batch upload (unchanged) ---
// //   private createIndividualUploadObservable(fileState: IFileState, fileId: string, gdriveUploadUrl: string): Observable<UploadEvent | null> {
// //     return new Observable((observer: Observer<UploadEvent | null>) => {
// //       const finalWsUrl = `${this.wsUrl}/upload/${fileId}?gdrive_url=${encodeURIComponent(gdriveUploadUrl)}`;
// //       const ws = new WebSocket(finalWsUrl);
// //       ws.onopen = () => this.sliceAndSend(fileState.file, ws);
// //       ws.onmessage = (event) => {
// //         const message: UploadEvent = JSON.parse(event.data);
// //         if (message.type === 'progress') {
// //           fileState.progress = message.value;
// //         } else if (message.type === 'success') {
// //           fileState.state = 'success';
// //           fileState.progress = 100;
// //           observer.next(message);
// //           observer.complete();
// //         }
// //       };
// //       ws.onerror = () => {
// //         fileState.state = 'error'; fileState.error = 'Connection to server failed.';
// //         observer.next(null); observer.complete();
// //       };
// //       ws.onclose = (event) => {
// //         if (!event.wasClean && fileState.state !== 'success') {
// //           fileState.state = 'error'; fileState.error = 'Lost connection to server.';
// //         }
// //         observer.next(null); observer.complete();
// //       };
// //       return () => { if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close(); };
// //     });
// //   }

// //   private sliceAndSend(file: File, ws: WebSocket, start: number = 0): void {
// //     const CHUNK_SIZE = 4 * 1024 * 1024;
// //     if (start >= file.size) { ws.send('DONE'); return; }
// //     const end = Math.min(start + CHUNK_SIZE, file.size);
// //     const chunk = file.slice(start, end);
// //     const reader = new FileReader();
// //     reader.onload = (e) => {
// //       if (ws.readyState === WebSocket.OPEN) {
// //         ws.send(e.target?.result as ArrayBuffer);
// //         this.sliceAndSend(file, ws, end);
// //       }
// //     };
// //     reader.readAsArrayBuffer(chunk);
// //   }

// //   private checkBatchCompletion(batchId: string): void {
// //     const anyFailed = this.batchFiles.some(fs => fs.state === 'error');
// //     if (anyFailed) {
// //       this.batchState = 'error';
// //       this.snackBar.open('Some files failed to upload.', 'Close', { duration: 5000 });
// //     } else {
// //       this.batchState = 'success';
// //       this.finalBatchLink = `${window.location.origin}/batch-download/${batchId}`;
// //       this.snackBar.open('Batch upload complete!', 'Close', { duration: 3000 });
// //     }
// //   }

// //   // Unified reset method
// //   resetState(): void {
// //     this.uploadSubscription?.unsubscribe();
// //     this.selectedFile = null;
// //     this.uploadProgress = 0;
// //     this.finalDownloadLink = null;
// //     this.errorMessage = null;
// //     this.currentState = 'idle';

// //     this.batchSubscriptions.forEach(sub => sub.unsubscribe());
// //     this.batchFiles = [];
// //     this.finalBatchLink = null;
// //     this.batchState = 'idle';
// //   }

// //   startNewUpload(): void {
// //     this.resetState();
// //   }

// //   copyLink(link: string): void {
// //     navigator.clipboard.writeText(link).then(() => {
// //       this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
// //     });
// //   }

// //   // Drag and Drop handlers
// //   onDragOver(event: DragEvent) { event.preventDefault(); }
// //   onDragLeave(event: DragEvent) { event.preventDefault(); }
// //   onDrop(event: DragEvent) {
// //     event.preventDefault();
// //     if (this.currentState === 'uploading' || this.batchState === 'processing') return;
// //     this.handleFiles(event.dataTransfer?.files ?? null);
// //   }

// //   ngOnDestroy(): void {
// //     this.uploadSubscription?.unsubscribe();
// //     this.batchSubscriptions.forEach(sub => sub.unsubscribe());
// //   }
// // }

// // FINAL CORRECTED File: src/app/componet/home/home.component.ts

// import { Component, OnDestroy } from '@angular/core';
// import { UploadService, UploadEvent } from '../../shared/services/upload.service';
// import { Subscription, forkJoin, Observable, Observer } from 'rxjs';
// import { MatSnackBar } from '@angular/material/snack-bar';
// import { BatchUploadService, IBatchFileInfo } from '../../shared/services/batch-upload.service';
// import { environment } from '../../../environments/environment';

// interface IFileState {
//   file: File;
//   state: 'pending' | 'uploading' | 'success' | 'error';
//   progress: number;
//   error?: string;
// }

// type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';
// type BatchUploadState = 'idle' | 'selected' | 'processing' | 'success' | 'error';

// @Component({
//   selector: 'app-home',
//   templateUrl: './home.component.html',
//   styleUrls: ['./home.component.css']
// })
// export class HomeComponent implements OnDestroy {

//   // State for Single File Upload
//   public currentState: UploadState = 'idle';
//   public selectedFile: File | null = null;
//   public uploadProgress = 0;
//   public finalDownloadLink: string | null = null;
//   public errorMessage: string | null = null;
//   private uploadSubscription?: Subscription;

//   // State for Batch File Upload
//   public batchFiles: IFileState[] = [];
//   public batchState: BatchUploadState = 'idle';
//   public finalBatchLink: string | null = null;
//   private batchSubscriptions: Subscription[] = [];
//   private wsUrl = environment.wsUrl;

//   constructor(
//     private uploadService: UploadService,
//     private snackBar: MatSnackBar,
//     private batchUploadService: BatchUploadService
//   ) {}

//   // --- NEW: Event handler specifically for the file input's (change) event ---
//   onFileSelect(event: Event): void {
//     const target = event.target as HTMLInputElement;
//     this._processFileList(target.files);
//   }

//   // --- MODIFIED: The onDrop handler now calls the private processor ---
//   onDrop(event: DragEvent): void {
//     event.preventDefault();
//     if (this.currentState === 'uploading' || this.batchState === 'processing') return;
//     this._processFileList(event.dataTransfer?.files ?? null);
//   }

//   // --- NEW: A private method to contain the core file processing logic ---
//   private _processFileList(files: FileList | null): void {
//     if (!files || files.length === 0) return;

//     this.resetState();

//     if (files.length === 1) {
//       // Single file workflow
//       this.selectedFile = files[0];
//       this.currentState = 'selected';
//     } else {
//       // Batch file workflow
//       this.batchFiles = Array.from(files).map(file => ({
//         file, state: 'pending', progress: 0
//       }));
//       this.batchState = 'selected';
//     }
//   }

//   // --- SINGLE FILE UPLOAD LOGIC (Unchanged) ---
//   onUploadSingle(): void {
//     if (!this.selectedFile) return;
//     this.currentState = 'uploading';
//     this.uploadSubscription = this.uploadService.upload(this.selectedFile).subscribe({
//       next: (event: UploadEvent) => {
//         if (event.type === 'progress') this.uploadProgress = event.value;
//         else if (event.type === 'success') {
//           this.currentState = 'success';
//           const fileId = (event.value as string).split('/').pop();
//           this.finalDownloadLink = `${window.location.origin}/download/${fileId}`;
//           this.snackBar.open('Upload complete!', 'Close', { duration: 3000 });
//         }
//       },
//       error: (err) => {
//         this.currentState = 'error';
//         this.errorMessage = err.value || 'An unknown error occurred.';
//       }
//     });
//   }

//   // --- BATCH FILE UPLOAD LOGIC (Unchanged) ---
//   onUploadBatch(): void {
//     if (this.batchFiles.length === 0) return;
//     this.batchState = 'processing';
//     const batchFileInfos: IBatchFileInfo[] = this.batchFiles.map(fs => ({
//       filename: fs.file.name,
//       size: fs.file.size,
//       content_type: fs.file.type || 'application/octet-stream'
//     }));

//     const sub = this.batchUploadService.initiateBatch(batchFileInfos).subscribe({
//       next: (response) => {
//         const uploadObservables = response.files.map(fileInfo => {
//           const fileState = this.batchFiles.find(fs => fs.file.name === fileInfo.original_filename);
//           if (!fileState) return new Observable<null>(s => s.complete());
//           fileState.state = 'uploading';
//           return this.createIndividualUploadObservable(fileState, fileInfo.file_id, fileInfo.gdrive_upload_url);
//         });
//         const uploadSub = forkJoin(uploadObservables).subscribe({
//           complete: () => this.checkBatchCompletion(response.batch_id)
//         });
//         this.batchSubscriptions.push(uploadSub);
//       },
//       error: (err) => {
//         this.batchState = 'error';
//         this.snackBar.open(err.error?.detail || 'Failed to initiate batch upload.', 'Close', { duration: 5000 });
//       }
//     });
//     this.batchSubscriptions.push(sub);
//   }
  
//   // --- All other private helpers, reset, copy, and lifecycle methods are unchanged ---

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
//         fileState.state = 'error'; fileState.error = 'Connection to server failed.';
//         observer.next(null); observer.complete();
//       };
//       ws.onclose = (event) => {
//         if (!event.wasClean && fileState.state !== 'success') {
//           fileState.state = 'error'; fileState.error = 'Lost connection to server.';
//         }
//         observer.next(null); observer.complete();
//       };
//       return () => { if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close(); };
//     });
//   }

//   private sliceAndSend(file: File, ws: WebSocket, start: number = 0): void {
//     const CHUNK_SIZE = 4 * 1024 * 1024;
//     if (start >= file.size) { ws.send('DONE'); return; }
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
//     const anyFailed = this.batchFiles.some(fs => fs.state === 'error');
//     if (anyFailed) {
//       this.batchState = 'error';
//       this.snackBar.open('Some files failed to upload.', 'Close', { duration: 5000 });
//     } else {
//       this.batchState = 'success';
//       this.finalBatchLink = `${window.location.origin}/batch-download/${batchId}`;
//       this.snackBar.open('Batch upload complete!', 'Close', { duration: 3000 });
//     }
//   }

//   resetState(): void {
//     this.uploadSubscription?.unsubscribe();
//     this.selectedFile = null;
//     this.uploadProgress = 0;
//     this.finalDownloadLink = null;
//     this.errorMessage = null;
//     this.currentState = 'idle';

//     this.batchSubscriptions.forEach(sub => sub.unsubscribe());
//     this.batchFiles = [];
//     this.finalBatchLink = null;
//     this.batchState = 'idle';
//   }

//   startNewUpload(): void {
//     this.resetState();
//   }

//   copyLink(link: string): void {
//     navigator.clipboard.writeText(link).then(() => {
//       this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
//     });
//   }

//   onDragOver(event: DragEvent) { event.preventDefault(); }
//   onDragLeave(event: DragEvent) { event.preventDefault(); }
  
//   ngOnDestroy(): void {
//     this.uploadSubscription?.unsubscribe();
//     this.batchSubscriptions.forEach(sub => sub.unsubscribe());
//   }
// }



///////////////////////////////////////////////////////////////
// In file: src/app/componet/home/home.component.ts

import { Component, OnDestroy } from '@angular/core';
import { forkJoin, lastValueFrom, of, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { UploadService, InitiateUploadResponse } from '../../shared/services/upload.service';
import { BatchUploadService, IBatchFileInfo } from '../../shared/services/batch-upload.service';

interface IFileState {
  file: File;
  state: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';
type BatchUploadState = 'idle' | 'selected' | 'processing' | 'success' | 'error';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnDestroy {

  // --- States for Single and Batch Uploads ---
  public currentState: UploadState = 'idle';
  public selectedFile: File | null = null;
  public uploadProgress = 0;
  public finalDownloadLink: string | null = null;
  public errorMessage: string | null = null;
  
  public batchFiles: IFileState[] = [];
  public batchState: BatchUploadState = 'idle';
  public finalBatchLink: string | null = null;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private uploadService: UploadService,
    private batchUploadService: BatchUploadService,
    private snackBar: MatSnackBar,
    private http: HttpClient // Inject HttpClient for direct use in the proxy
  ) {}

  onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._processFileList(target.files);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.currentState === 'uploading' || this.batchState === 'processing') return;
    this._processFileList(event.dataTransfer?.files ?? null);
  }

  private _processFileList(files: FileList | null): void {
    if (!files || files.length === 0) return;
    this.resetState();
    if (files.length === 1) {
      this.selectedFile = files[0];
      this.currentState = 'selected';
    } else {
      this.batchFiles = Array.from(files).map(file => ({ file, state: 'pending', progress: 0 }));
      this.batchState = 'selected';
    }
  }

  onUploadSingle(): void {
    if (!this.selectedFile) return;
    this.currentState = 'uploading';
    this.uploadProgress = 0;

    const sub = this.uploadService.initiateUpload({
      filename: this.selectedFile.name,
      size: this.selectedFile.size,
      content_type: this.selectedFile.type || 'application/octet-stream',
    }).subscribe({
      next: async (initResponse) => {
        try {
          const gdriveId = await this.uploadFileDirectly(
            initResponse.file_id,
            initResponse.gdrive_upload_url,
            this.selectedFile!,
            (progress) => { this.uploadProgress = progress; } // Progress callback
          );
          await lastValueFrom(this.uploadService.verifyUpload(initResponse.file_id, gdriveId));
          this.currentState = 'success';
          const fileId = initResponse.file_id;
          this.finalDownloadLink = `${window.location.origin}/download/${fileId}`;
          this.snackBar.open('Upload complete!', 'Close', { duration: 3000 });
        } catch (error: any) {
          this.currentState = 'error';
          this.errorMessage = error.message || 'An unknown upload error occurred.';
          // --- FIX 1: Provide a default value if errorMessage is null ---
          this.snackBar.open(this.errorMessage || 'Upload failed', 'Close', { duration: 5000 });
        }
      },
      error: (err) => {
        this.currentState = 'error';
        this.errorMessage = err.error?.detail || 'Could not initiate upload.';
        // --- FIX 2: Provide a default value if errorMessage is null ---
        this.snackBar.open(this.errorMessage || 'Initiation failed', 'Close', { duration: 5000 });
      }
    });
    this.subscriptions.add(sub);
  }

  onUploadBatch(): void {
    if (this.batchFiles.length === 0) return;
    this.batchState = 'processing';
    const batchFileInfos: IBatchFileInfo[] = this.batchFiles.map(fs => ({
      filename: fs.file.name,
      size: fs.file.size,
      content_type: fs.file.type || 'application/octet-stream'
    }));

    const sub = this.batchUploadService.initiateBatch(batchFileInfos).subscribe({
      next: (response) => {
        const uploadPromises = response.files.map(fileInfo => {
          const fileState = this.batchFiles.find(fs => fs.file.name === fileInfo.original_filename);
          if (!fileState) return Promise.resolve(null);
          
          fileState.state = 'uploading';
          
          return new Promise(async (resolve) => {
            try {
              const gdriveId = await this.uploadFileDirectly(
                fileInfo.file_id,
                fileInfo.gdrive_upload_url,
                fileState.file,
                (progress) => { fileState.progress = progress; }
              );
              await lastValueFrom(this.uploadService.verifyUpload(fileInfo.file_id, gdriveId));
              fileState.state = 'success';
              resolve(null);
            } catch (error: any) {
              fileState.state = 'error';
              fileState.error = error.message || 'Upload failed';
              resolve(null); // Resolve even on error to not break Promise.all
            }
          });
        });

        // Use Promise.all to wait for all uploads to finish
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

  private async uploadFileDirectly(fileId: string, gdriveUrl: string, file: File, onProgress: (percent: number) => void): Promise<string> {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let bytesSent = 0;

    for (let i = 0; i < totalChunks; i++) {
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
        console.error('Chunk upload failed:', error);
        throw new Error(error.error?.error || 'A chunk failed to upload.');
      }
    }
    throw new Error('Upload finished without a final response from Google Drive.');
  }
  
  private checkBatchCompletion(batchId: string): void {
    const anyFailed = this.batchFiles.some(fs => fs.state === 'error');
    if (anyFailed) {
      this.batchState = 'error';
      this.snackBar.open('Some files failed to upload. Please review status.', 'Close', { duration: 7000 });
    } else {
      this.batchState = 'success';
      this.finalBatchLink = `${window.location.origin}/batch-download/${batchId}`;
      this.snackBar.open('Batch upload complete!', 'Close', { duration: 3000 });
    }
  }

  resetState(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.finalDownloadLink = null;
    this.errorMessage = null;
    this.currentState = 'idle';

    this.batchFiles = [];
    this.finalBatchLink = null;
    this.batchState = 'idle';
  }

  startNewUpload(): void { this.resetState(); }
  copyLink(link: string): void { navigator.clipboard.writeText(link).then(() => this.snackBar.open('Link copied!', 'Close', { duration: 2000 })); }
  onDragOver(event: DragEvent) { event.preventDefault(); }
  onDragLeave(event: DragEvent) { event.preventDefault(); }
  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }
}