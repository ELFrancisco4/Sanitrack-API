import { AuthenticatedRequest } from "../../middlewares/security";
import { Response } from "express";
import Logger from "../../utils/logger";
import customResponse from "../../helpers/response"
import DocumentModel from "../../models/files";
import cloudinary from "../../config/cloudinary";

const uploadDocument =async (req:AuthenticatedRequest, res:Response) => {
    try{ 
      const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to upload document', res);
        }
        const file = req.file as Express.Multer.File
        const {locationId, title} = req.body

        // check if the location id already exists
        const existingDocument = await DocumentModel.findOne({ location_id: locationId });

        // Logger.info(`existingDocument => ${existingDocument}`);
    
        if (existingDocument) {
          return customResponse.badRequestResponse('An instruction manual already exists for this location', res);
        }
        // do validation in joi
        const document = await DocumentModel.create({ 
            location_id: locationId, 
            title: title, 
            pdf: file.filename
        })

        return customResponse.successResponse('Document successfully uploaded',document, res)
    }catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the upload document endpoint',
            res,
            err
        );
    }
}

const updateDocument = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const role = req.auth.role_id.role_name;
      if(role !== 'Admin') {
          return customResponse.badRequestResponse('You do not have permission to update the document for this location', res);
      }
      const { locationId } = req.query; // Assuming locationId is a parameter in the URL
      const { title } = req.body;
  
      // Check if the document for the specified location exists
      const existingDocument = await DocumentModel.findOne({ location_id: locationId });
  
      if (!existingDocument) {
        return customResponse.notFoundResponse('Document not found for the specified location', res);
      }
  
      // Handle file update (if a new file is attached in the request)
      if (req.file) {
        const newFile = req.file as Express.Multer.File;
        existingDocument.pdf = newFile.filename;
      }
  
      // Update other fields as needed
      existingDocument.title = title;
      
      // Save the updated document
      await existingDocument.save();
  
      return customResponse.successResponse('Document successfully updated', existingDocument, res);
    } catch (err: any) {
      Logger.error(err);
      return customResponse.serverErrorResponse(
        'Oops... Something occurred in the update document endpoint',
        res,
        err
      );
    }
  };
  

  
const getDocument =async (req:AuthenticatedRequest, res:Response) => {
    try{ 
      const role = req.auth.role_id.role_name;
      if(role !== 'Admin') {
          return customResponse.badRequestResponse('You do not have permission to view document for this location', res);
      }
        const {locationId} = req.query
        if(!locationId) return customResponse.badRequestResponse('Missing required query param <locationId>', res);

        const document = await DocumentModel.find({location_id: locationId})
        if(!document) return customResponse.badRequestResponse('There no manual for this location', res)

        return customResponse.successResponse("Cleaning manual found", document, res)
    }catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get room by location id endpoint',
            res,
            err
        );
    }
    
}

const deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { locationId } = req.params; // Assuming locationId is a parameter in the URL
  
      // Check if the document for the specified location exists
      const existingDocument = await DocumentModel.findOne({ location_id: locationId });
  
      if (!existingDocument) {
        return customResponse.notFoundResponse('Document not found for the specified location', res);
      }
  
      // Delete the document
      await DocumentModel.deleteOne({ location_id: locationId });
  
      return customResponse.successResponse('Document successfully deleted', {}, res);
    } catch (err: any) {
      Logger.error(err);
      return customResponse.serverErrorResponse(
        'Oops... Something occurred in the delete document endpoint',
        res,
        err
      );
    }
  };
  
export default{ 
    uploadDocument, 
    getDocument, 
    updateDocument,
    deleteDocument
}