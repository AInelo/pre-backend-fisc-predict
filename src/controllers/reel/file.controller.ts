// import { Request, Response } from 'express';
// import { FileService } from '../services/file.service';
// import { CONFIG } from '../../config/constants';
// import { FileResponse } from '../../types/file.types';

// export class FileController {
//   static async uploadFile(req: Request, res: Response): Promise<void> {
//     try {
//       const file = req.file;
//       const { folder_name } = req.body;
      
//       if (!file) {
//         res.status(400).json({
//           success: false,
//           message: 'No file provided'
//         } as FileResponse);
//         return;
//       }

//       const folderName = folder_name || CONFIG.DEFAULT_FOLDER;
//       const savedPath = await FileService.saveFile(file, folderName);

//       res.status(200).json({
//         success: true,
//         message: 'File uploaded successfully',
//         data: {
//           filename: file.originalname,
//           folder: folderName,
//           path: savedPath
//         }
//       } as FileResponse);
//     } catch (error) {
//       console.error('Upload file error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error'
//       } as FileResponse);
//     }
//   }

//   static async uploadFiles(req: Request, res: Response): Promise<void> {
//     try {
//       const files = req.files as Express.Multer.File[];
//       const { folder_name } = req.body;
      
//       if (!files || files.length === 0) {
//         res.status(400).json({
//           success: false,
//           message: 'No files provided'
//         } as FileResponse);
//         return;
//       }

//       const folderName = folder_name || CONFIG.DEFAULT_FOLDER;
//       const savedPaths = await FileService.saveFiles(files, folderName);

//       res.status(200).json({
//         success: true,
//         message: 'Files uploaded successfully',
//         data: {
//           count: files.length,
//           files: files.map(file => file.originalname),
//           folder: folderName,
//           paths: savedPaths
//         }
//       } as FileResponse);
//     } catch (error) {
//       console.error('Upload files error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error'
//       } as FileResponse);
//     }
//   }

//   static async findFile(req: Request, res: Response): Promise<void> {
//     try {
//       const { filename, foldername } = req.query as { filename: string; foldername?: string };
      
//       if (!filename) {
//         res.status(400).json({
//           success: false,
//           message: 'Filename is required'
//         } as FileResponse);
//         return;
//       }

//       const folderName = foldername || CONFIG.DEFAULT_FOLDER;
//       const fileBuffer = FileService.getFile(filename, folderName);

//       if (!fileBuffer) {
//         res.status(404).json({
//           success: false,
//           message: 'File not found'
//         } as FileResponse);
//         return;
//       }

//       res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//       res.setHeader('Content-Type', 'application/octet-stream');
//       res.send(fileBuffer);
//     } catch (error) {
//       console.error('Find file error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error'
//       } as FileResponse);
//     }
//   }

//   static async findFiles(req: Request, res: Response): Promise<void> {
//     try {
//       const { foldername } = req.query as { foldername?: string };
      
//       const folderName = foldername || CONFIG.DEFAULT_FOLDER;
//       const filesData = FileService.getAllFilesFromFolder(folderName);

//       if (filesData.length === 0) {
//         res.status(404).json({
//           success: false,
//           message: 'No files found in folder'
//         } as FileResponse);
//         return;
//       }

//       // Create a simple ZIP-like response or send all files info
//       // For simplicity, we'll send files info and let client download individually
//       res.status(200).json({
//         success: true,
//         message: 'Files found',
//         data: {
//           folder: folderName,
//           count: filesData.length,
//           files: filesData.map(file => ({
//             filename: file.filename,
//             size: file.buffer.length
//           }))
//         }
//       } as FileResponse);
//     } catch (error) {
//       console.error('Find files error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error'
//       } as FileResponse);
//     }
//   }
// }
