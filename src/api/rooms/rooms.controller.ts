import { Request, Response } from 'express';
import RoomModel from '../../models/room';
import RoomDetailModel from '../../models/roomDetail';
import TaskModel from '../../models/task';
import customResponse from '../../helpers/response'
import { AuthenticatedRequest } from '../../middlewares/security';
import Logger from '../../utils/logger';
import Location from '../../models/location';
import mongoose from 'mongoose';

/**
 * Create a new room with its details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to create a room', res);
        }
        const { roomName, location_id, details } = req.body;

        // Create a new RoomDetail instance
        const roomDetail = await RoomDetailModel.create({
            detail: details
        });

        // Create a new Room instance referencing the created RoomDetail
        const room = await RoomModel.create({
            roomName,
            location_id,
            detail: roomDetail._id,
            flag: "PRESENT"
        });

        return customResponse.createResponse('Room created successfully', room, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the create room endpoint',
            res,
            err
        );
    }
};
/**
 * Get all rooms with its completed details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */

const getAllRooms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const role = req.auth.role_id.role_name;
        if (role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to view all rooms', res);
        }

        const roomQuery = RoomModel.find({ flag: 'PRESENT' })
            .populate({
                path: 'detail',
                populate: { path: 'detail' }, // Populate the nested 'detail' array
            })
            .sort({ createdAt: -1 });

        const [totalRooms, allRooms] = await Promise.all([
            RoomModel.countDocuments(),
            roomQuery.exec(),
        ]);

        const roomsWithLocations = await Promise.all(allRooms.map(async (room) => {
            let location;
            if (room.location_id) {
                // Fetch actual location from LocationModel
                location = await Location.findById(room.location_id);
            }

            // Return room data with or without location
            return {
                ...room.toObject(),
                location: location ? location.toObject() : undefined,
            };
        }));

        // Prepare data to send in the response
        const data = {
            totalRooms,
            allRooms: roomsWithLocations,
        };

        // Return success response with paginated task information
        return customResponse.successResponse('Get all rooms successful', data, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all room endpoint',
            res,
            err
        );
    }
};

/**
 * View room with its details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const getRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to get a room', res);
        }
        const roomId = req.query.roomId;

        // Check if page or documentCount is undefined before using them
        if (!roomId) {
            return customResponse.badRequestResponse('Missing required query param <roomId>', res);
        }
        
        const room = await RoomModel.findById({_id: roomId})
            .populate('detail').exec()
        
        if(!room) {
            return customResponse.badRequestResponse("Room not found or not permitted to view this task", res);
        }
        
        // Return success response with room information
        return customResponse.successResponse('Room retrieved successfully', room, res);
    } catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get room endpoint',
            res,
            err
        );
    }
};


const getRoomByLocationId = async(req: AuthenticatedRequest, res:Response) => { 
    try{
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to view a room based on the location id', res);
        }
        const {locationId} = req.query
        if(!locationId) return customResponse.badRequestResponse('Missing required query param <locationId>', res);

        const location = await Location.findById(locationId)
        if(!location) return customResponse.badRequestResponse("Lcoation not found or not permitted to view this task", res);

        // Get the room that belongs to the location entered
        const room = await RoomModel.find({location_id: locationId}).populate('detail').exec()
        if(!room)  return customResponse.badRequestResponse("There is no room for this location", res);

        return customResponse.successResponse('Room found', room, res)
    }catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get room by location endpoint',
            res,
            err
        );
    }
    
}
/**
 * Update room
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const updateRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to update a room', res);
        }
        const { roomId, roomName, locationId, details } = req.body;

        // check if the location id passed in is valid 
        const locationIdObject = new mongoose.Types.ObjectId(locationId);
        const location = await Location.findById({ _id: locationIdObject }).exec();
        if(!location) return customResponse.badRequestResponse('Location not found', res)

        // Get the room and update its details
        const room = await RoomModel.findById(roomId);
        if(!room) {
            return customResponse.badRequestResponse("Room not found", res);
        }

        // Get RoomDetail and update
        const roomDetail = await RoomDetailModel.findById(room.detail);
        if(!roomDetail) {
            return customResponse.badRequestResponse("Room details not found", res);
        }
        roomDetail.detail = details
        await roomDetail.save();

        // Update room
        room.roomName = roomName;
        room.location_id = locationId
        await room.save();
       
        return customResponse.successResponse('Room updated successfully', room, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the update room endpoint',
            res,
            err
        );
    }
};

/**
 * Delete room
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const deleteRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const  roomId  = req.query.roomId;
        // Validate the request body
        if (!roomId ) {
            return customResponse.badRequestResponse('Missing required field', res);
        }

        // check if the room they want to delete is in assigned_room of the tasks. If it is, do not allow them delete the room 
        const roomInTask = await TaskModel.findOne({assigned_room: roomId}).exec()

        if(roomInTask) return customResponse.badRequestResponse('You cannot delete this room since it has been assigned to staffs.', res)

        const updateRoom = await RoomModel.findByIdAndUpdate(
            {_id: roomId}, 
            {$set: {flag: "DELETE"}},
            {$new: true}
        )
        return customResponse.createResponse('Room deleted successfully', updateRoom, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the delete room endpoint',
            res,
            err
        );
    }
};

const getRoomsNotInTask = async(req:AuthenticatedRequest, res: Response): Promise<void> => { 
    try{ 
        // Fetch all room IDs from TaskModel
        const taskRoomIds = await TaskModel.distinct('assigned_room');

        // Find all rooms whose IDs are not in taskRoomIds
        const roomsNotInTasks = await RoomModel.find({ _id: { $nin: taskRoomIds } }, {flag: 'PRESENT'}).populate('roomName');

        const data = {roomsNotInTasks}
        return customResponse.successResponse('Rooms fetched successfully', data, res);
    }catch(err:any){ 
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all users endpoint',
            res,
            err
        );
    }
}

export default {
    createRoom,
    getRoom,
    getAllRooms,
    getRoomByLocationId,
    updateRoom,
    deleteRoom,
    getRoomsNotInTask
};
