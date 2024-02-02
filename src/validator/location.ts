import Joi from "joi";

// Define and export validation schemas using Joi
interface CreateLocationSchema {
  country: string;
  state: string;
  city: string;
  postal_code?: string;
}

interface DeleteLocationSchema{ 
  location_id: string
}
const LocationValidationSchema = {
  // Schema for creating a location
  createLocation: Joi.object<CreateLocationSchema>({
    country: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    postal_code: Joi.string().optional(),
  }),

  updateLocation: Joi.object<CreateLocationSchema>({
    country: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    postal_code: Joi.string().optional(),
  }),

  deleteLocation: Joi.object<DeleteLocationSchema>({
    location_id: Joi.string().required()
  })
};

export default LocationValidationSchema;
