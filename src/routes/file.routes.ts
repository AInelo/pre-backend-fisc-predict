import { Router } from 'express';
import { FileController } from '../controllers/reel/file.controller';
import { validateSecretKey } from '../middleware/auth.middleware';
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware';

const router = Router();

// POST /upload-file
router.post('/upload-file', uploadSingle, validateSecretKey, FileController.uploadFile);

// POST /upload-files  
router.post('/upload-files', uploadMultiple, validateSecretKey, FileController.uploadFiles);

// GET /find-file
router.get('/find-file', validateSecretKey, FileController.findFile);

// GET /find-files
router.get('/find-files', validateSecretKey, FileController.findFiles);

export default router;