// src/types/file.types.ts
export interface UploadFileRequest {
  file: Express.Multer.File;
  secret_key: string;
  folder_name?: string;
}

export interface UploadFilesRequest {
  files: Express.Multer.File[];
  secret_key: string;
  folder_name?: string;
}

export interface FileResponse {
  success: boolean;
  message: string;
  data?: any;
}
