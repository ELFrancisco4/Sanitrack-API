import { Router } from "express"
import multer from "multer"
import document from "./document.controller"
import validate from "../../middlewares/validate"
import documentValidationSchema from "../../validator/document"
import fs from "fs"

export default () =>{ 
    const documentRouter = Router()
    // Ensure the destination directory exists
    const destinationDirectory = './files';

    // Create the directory if it doesn't exist
    if (!fs.existsSync(destinationDirectory)) {
      fs.mkdirSync(destinationDirectory);
    }
    
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, "./files");
        },
        filename: function (req, file, cb) {
          const uniqueSuffix = Date.now();
          cb(null, uniqueSuffix + file.originalname);
        },
      });
    const upload = multer({ storage: storage , 
      limits: {
        fileSize: 5 * 1024 * 1024, // keep document size < 5 MB
      },
  });

    documentRouter.post('/upload',  upload.single('pdf'),validate(documentValidationSchema.createDocument), document.uploadDocument)
    documentRouter.get('/get', document.getDocument)
    documentRouter.put('/update', document.updateDocument)
    documentRouter.delete('/delete', document.deleteDocument)

    return documentRouter
}