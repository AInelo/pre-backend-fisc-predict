import multer from 'multer';
import { CONFIG } from '../config/constants';

const storage = multer.memoryStorage();

export const uploadSingle = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
}).single('file');

export const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit per file
  }
}).array('files', 10); // Maximum 10 files
