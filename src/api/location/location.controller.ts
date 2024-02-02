import { AuthenticatedRequest } from "../../middlewares/security";
import { Request, Response } from "express";
import customResponse from "../../helpers/response";
import Logger from "../../utils/logger";
import Location from "../../models/location";
import RoomModel from "../../models/room";

const addLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.auth.role_id.role_name;
    if(role !== 'Admin') {
        return customResponse.badRequestResponse('You do not have permission to add a location', res);
    }
    const { country, state, city, postal_code } = req.body;
    // if the location is being repeated, throw an error
    const existingLocation = await Location.findOne({country, state, city, postal_code})
    if(existingLocation) return customResponse.badRequestResponse('Location already exists', res)
    // proceed to add the location to the database
    const newLocation = await Location.create({
      country,
      state,
      city,
      postal_code,
    });
    return customResponse.successResponse(
      "New Location added ",
      newLocation,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the add location endpoint",
      res,
      error
    );
  }
};

const getLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.auth.role_id.role_name;
    if(role !== 'Admin') {
        return customResponse.badRequestResponse('You do not have permission to view locations', res);
    }
    const locationQuery = Location.find().sort({ createdAt: -1 });

    const [totalLocations, allLocations] = await Promise.all([
      Location.countDocuments(),
      locationQuery.exec(),
    ]);

    // Prepare data to send in the response
    const data = {
      totalLocations,
      allLocations,
    };

    return customResponse.successResponse(
      "Get all locations successful",
      data,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the get all locations endpoint",
      res,
      error
    );
  }
};

const getLocationById = async (req: AuthenticatedRequest, res: Response) => {
    try{ 
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
          return customResponse.badRequestResponse('You do not have permission to get location by id', res);
        }
        const locationId = req.query.locationId;
        if(!locationId) return customResponse.badRequestResponse("Enter an Id", res)
      
        const location = await Location.findById({ _id: locationId }).exec();
      
        if (!location) {
          return customResponse.badRequestResponse("There is no location with the id",res);
        }
      
        return customResponse.successResponse("Location retrieved successfully",location,res);
    } catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse(
        "Oops... Something occurred in the get location by id endpoint",
        res,
        error
        );
    }
  
};

const updateLocation = async (req: AuthenticatedRequest, res: Response) => {
    try{ 
        const locationId = req.query.locationId;
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to update a location', res);
        }
        const {country, state, city, postal_code} = req.body
        // Get the room and update its details
        const location = await Location.findById(locationId);
        if(!location) {
            return customResponse.badRequestResponse("Location not found", res);
        }
        // update location 
        location.country = country, 
        location.state = state, 
        location.city = city, 
        location.postal_code = postal_code

        await location.save()

        return customResponse.successResponse('Location updated successfully', location, res)
    }catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the update location endpoint',
            res,
            err
        );
    }  
};

const deleteLocation = async (req: AuthenticatedRequest, res: Response) => {
  try{ 
    // return to this since you need to delete the rooms with the location 
    const location_id = req.query.locationId
    const role = req.auth.role_id.role_name;
    if(role !== 'Admin') {
        return customResponse.badRequestResponse('You do not have permission to delete a location', res);
    }
    if(!location_id) return customResponse.badRequestResponse("The location's id is required", res)

    // look for that location 
    const location = await Location.findById(location_id)
    if(!location) return customResponse.badRequestResponse('Location not found', res)

    // Delete all the rooms with that location
    await RoomModel.deleteMany({location_id: location_id})
    // Delete the location
    const locationDelete = await Location.deleteOne({_id: location_id})
    return customResponse.successResponse('Location deleted',locationDelete, res)
  }catch (err: any) {
    Logger.error(err)
    return customResponse.serverErrorResponse(
        'Oops... Something occurred in the delete location endpoint',
        res,
        err
    );
  }
    
};

export default {
  addLocation,
  getLocation,
  getLocationById,
  updateLocation,
  deleteLocation,
};
