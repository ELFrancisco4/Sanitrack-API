import Joi from 'joi';

// Define and export validation schemas using Joi
interface CreateRoomSchema {
    roomName: string;
    location_id: string;
    details: [{ name: string}];
}

interface UpdateRoomSchema {
    roomId: string;
    roomName: string;
    locationId: string;
    details: [{ name: string}];
}

interface DeleteRoomSchema {
    roomId: string;
}


const validationSchemas = {
  // Schema for creating a room
  createRoom: Joi.object<CreateRoomSchema>({
    roomName: Joi.string().required(),
    location_id: Joi.string().required(),
    details: Joi.array().items(Joi.object({
      name: Joi.string().required(),
    })),
   }),

  // Schema for room update
    updateRoom: Joi.object<UpdateRoomSchema>({
        roomId: Joi.string().required(),
        roomName: Joi.string().required(),
        locationId: Joi.string().required(),
        details: Joi.array().items(Joi.object({
            name: Joi.string().required(),
        })),
    }),

    // Schema for deleting room by id
    deleteRoom: Joi.object<DeleteRoomSchema>({
        roomId: Joi.string().required(),
    }),

};

export default validationSchemas;
