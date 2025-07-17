// // // CORRECTED and FINAL File: src/app/shared/services/batch-upload.service.ts

// // import { Injectable } from '@angular/core';
// // import { HttpClient } from '@angular/common/http';
// // import { Observable } from 'rxjs';
// // import { environment } from '../../../environments/environment';

// // // --- INTERFACES FOR BATCH INITIATION ---
// // // These match the Pydantic models in the backend's `models/batch.py`
// // export interface IBatchFileInfo {
// //   filename: string;
// //   size: number;
// //   content_type: string;
// // }

// // export interface IFileUploadInfo {
// //   file_id: string;
// //   gdrive_upload_url: string;
// //   original_filename: string;
// // }

// // export interface IInitiateBatchResponse {
// //   batch_id: string;
// //   files: IFileUploadInfo[];
// // }

// // // --- INTERFACE FOR BATCH DOWNLOAD ---
// // // This matches the FileMetadataInDB model from the backend
// // export interface IFileMetadata {
// //   _id: string;
// //   filename: string;
// //   size_bytes: number;
// //   content_type: string;
// //   upload_date: string;
// //   storage_location: 'gdrive' | 'telegram';
// //   status: 'pending' | 'uploading_to_drive' | 'completed' | 'failed';
// //   gdrive_id?: string;
// //   batch_id?: string;
// // }


// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class BatchUploadService {
// //   public batchApiUrl = `${environment.apiUrl}/api/v1/batch`;
// //   private fileApiUrl = `${environment.apiUrl}/api/v1`; // For constructing download links

// //   constructor(private http: HttpClient) { }

// //   /**
// //    * Calls the new backend endpoint to initiate a batch upload.
// //    * @param files An array of file metadata objects.
// //    * @returns An observable with the batch_id and a list of file-specific upload details.
// //    */
// //   initiateBatch(files: IBatchFileInfo[]): Observable<IInitiateBatchResponse> {
// //     const payload = { files };
// //     return this.http.post<IInitiateBatchResponse>(`${this.batchApiUrl}/initiate`, payload);
// //   }

// //   /**
// //    * Gets the metadata for all files in a specific batch.
// //    * @param batchId The ID of the batch.
// //    */
// //   getBatchDetails(batchId: string): Observable<IFileMetadata[]> {
// //     return this.http.get<IFileMetadata[]>(`${this.batchApiUrl}/${batchId}`);
// //   }

// //   /**
// //    * Helper to construct the direct download URL for a single file.
// //    * This reuses the existing single-file download logic.
// //    * @param fileId The unique ID of the individual file.
// //    */
// //   getStreamUrl(fileId: string): string {
// //     return `${this.fileApiUrl}/download/stream/${fileId}`;
// //   }
// // }



// ////////////////////////////////////////////////////////////
// // In file: src/app/shared/services/batch-upload.service.ts

// // In file: src/app/shared/services/batch-upload.service.ts

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { environment } from '../../../environments/environment';

// // --- (Interfaces remain the same) ---
// export interface IBatchFileInfo { /* ... */ }
// export interface IFileUploadInfo { /* ... */ }
// export interface IInitiateBatchResponse { /* ... */ }
// export interface IFileMetadata { /* ... */ }

// @Injectable({
//   providedIn: 'root'
// })
// export class BatchUploadService {
//   // This correctly remains private
//   private batchApiUrl = `${environment.apiUrl}/api/v1/batch`;
//   private fileApiUrl = `${environment.apiUrl}/api/v1`;

//   constructor(private http: HttpClient) { }

//   initiateBatch(files: IBatchFileInfo[]): Observable<IInitiateBatchResponse> {
//     const payload = { files };
//     return this.http.post<IInitiateBatchResponse>(`${this.batchApiUrl}/initiate`, payload);
//   }

//   getBatchDetails(batchId: string): Observable<IFileMetadata[]> {
//     return this.http.get<IFileMetadata[]>(`${this.batchApiUrl}/${batchId}`);
//   }

//   getStreamUrl(fileId: string): string {
//     return `${this.fileApiUrl}/download/stream/${fileId}`;
//   }

//   // --- ADD THIS NEW METHOD ---
//   /**
//    * Constructs the full URL for downloading a batch as a ZIP file.
//    * @param batchId The ID of the batch.
//    * @returns The complete, ready-to-use URL string.
//    */
//   getBatchZipUrl(batchId: string): string {
//     return `${this.batchApiUrl}/download-zip/${batchId}`;
//   }
// }



// In file: src/app/shared/services/batch-upload.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// --- INTERFACES FOR BATCH INITIATION ---
export interface IBatchFileInfo {
  filename: string;
  size: number;
  content_type: string;
}

export interface IFileUploadInfo {
  file_id: string;
  gdrive_upload_url: string;
  original_filename: string;
}

// --- CORRECTED: Interface was missing its properties ---
export interface IInitiateBatchResponse {
  batch_id: string;
  files: IFileUploadInfo[];
}

// --- CORRECTED: Interface was missing its properties ---
export interface IFileMetadata {
  _id: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  upload_date: string;
  storage_location: 'gdrive';
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  gdrive_id?: string;
  batch_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BatchUploadService {
  private batchApiUrl = `${environment.apiUrl}/api/v1/batch`;
  private fileApiUrl = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) { }

  initiateBatch(files: IBatchFileInfo[]): Observable<IInitiateBatchResponse> {
    const payload = { files };
    return this.http.post<IInitiateBatchResponse>(`${this.batchApiUrl}/initiate`, payload);
  }

  getBatchDetails(batchId: string): Observable<IFileMetadata[]> {
    return this.http.get<IFileMetadata[]>(`${this.batchApiUrl}/${batchId}`);
  }

  getStreamUrl(fileId: string): string {
    return `${this.fileApiUrl}/download/stream/${fileId}`;
  }
  
  getBatchZipUrl(batchId: string): string {
    return `${this.batchApiUrl}/download-zip/${batchId}`;
  }
}