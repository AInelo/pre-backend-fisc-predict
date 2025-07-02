import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/constants';

export class FileUtils {
  private static getBasePath(): string {
    return path.join('/home', CONFIG.USER_NAME, CONFIG.FOLDER_BASE_NAME);
  }

  static ensureDirectoryExists(folderName: string): string {
    const basePath = this.getBasePath();
    const fullPath = path.join(basePath, folderName);
    
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    return fullPath;
  }

  static getFilePath(folderName: string, filename: string): string {
    const folderPath = this.ensureDirectoryExists(folderName);
    return path.join(folderPath, filename);
  }

  static getFolderPath(folderName: string): string {
    return this.ensureDirectoryExists(folderName);
  }

  static fileExists(folderName: string, filename: string): boolean {
    const filePath = this.getFilePath(folderName, filename);
    return fs.existsSync(filePath);
  }

  static getAllFilesInFolder(folderName: string): string[] {
    const folderPath = this.getFolderPath(folderName);
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    return fs.readdirSync(folderPath).filter(file => {
      const filePath = path.join(folderPath, file);
      return fs.statSync(filePath).isFile();
    });
  }
}