import Joi from "joi";

interface createDocumentSchema{ 
    locationId: String; 
    title: String; 
    pdf: Express.Multer.File
}

const documentValidationSchema = {
    // Schema for creating a room
    createDocument: Joi.object<createDocumentSchema>({
      locationId: Joi.string().required(),
      title: Joi.string().required(),
      pdf: Joi.any()
    }),
  
};
export default documentValidationSchema
  