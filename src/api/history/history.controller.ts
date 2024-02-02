import { AuthenticatedRequest } from "../../middlewares/security";
import { Response } from "express";
import TaskModel from "../../models/task";
import customResponse from "../../helpers/response"
import Logger from "../../utils/logger";
import Timer from "../../models/timer";

const roomHistory = async(req:AuthenticatedRequest, res:Response) => { 
    try{
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to view room history', res);
        }
        const roomId = req.query.roomId
        // get the task_id assigned_cleaner, assigned_inspector, room_name, start_time and stop_time.
        
        const task = await TaskModel.findOne({assigned_room: roomId}).populate([
            { path: 'assigned_cleaner assigned_inspector', select: 'username' },
            { path: 'assigned_room', select: 'roomName' }
        ]);
    
        const timer = await Timer.find({roomId: roomId})
        const timeTaken = timer.map(time => ({
            start_time: time.start_time, 
            stop_time: time.stop_time
        }))

        // if the room_id is not in the taskModel, just tell them that a work order has not been created for the room hence no history 
        if(!task) return customResponse.successResponse("A work order has not been created for this room hence no history", task, res)
    
        const data = {
            rommHistoy: task, 
            time: timeTaken
        }
        return customResponse.successResponse('Room history fetched', data, res)
    }catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('Error fetching room history', res, error);
    }
    
}

const cleanerHistory = async(req:AuthenticatedRequest, res:Response) => { 
    try{ 
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to view cleaner history', res);
        }
        // display roomName and time taken to clean rooms
        const cleanerId = req.query.cleanerId
        let timeTaken
        if(!cleanerId) return customResponse.badRequestResponse('cleanerId query missing', res)

        const cleaner = await TaskModel.find({assigned_cleaner: cleanerId}).populate([
            { path: 'assigned_cleaner', select: 'username' },
            { path: 'assigned_room', select: 'roomName' }
        ]);

        if(!cleaner) return customResponse.successResponse('This cleaner has not been assigned a work order yet', cleaner, res)

        // Iterate over each task and fetch the corresponding times from TimerModel
        for (const task of cleaner) {
            const roomId = task.assigned_room._id;
            // Logger.info(`room id for this task => ${roomId}`)

            // Fetch times from TimerModel for the specific room
            const time = await Timer.find({ roomId: roomId });

            // Assign the start and stop time
            timeTaken = time.map(time => ({
                start_time: time.start_time, 
                stop_time: time.stop_time
            }))
        }

        const data = { 
            cleanerHistoy: cleaner, 
            time: timeTaken
        }

        return customResponse.successResponse('Cleaner history', data, res)

    }catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('Error fetching cleaner history', res, error);
    }
}

const inspectorHistory = async(req:AuthenticatedRequest, res:Response) => { 
    // display the rooms and the rooms they approved of 
    try{
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to view inspector history', res);
        }
        const inspectorId = req.query.inspectorId
        if(!inspectorId) return customResponse.badRequestResponse('inspectorId query missing', res)

        const inspector = await TaskModel.find({assigned_inspector: inspectorId}).populate([
            { path: 'assigned_inspector', select: 'username' },
            { path: 'assigned_room', select: 'roomName' }
        ]);
        if(!inspector) return customResponse.successResponse('This inspector has not been assigned a work order yet', inspector, res)

        return customResponse.successResponse('Inspector History', inspector, res)

    }catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('Error fetching inspector history', res, error);
    }
}

const cleanerTaskSummary = async(req:AuthenticatedRequest, res:Response) => {
    try{ 
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to view cleaner task history', res);
        }
        // match based on the citeria I want
        // Group the result by id and totalrooms cleaned. aaddToSet is used to get unique assigned_rooms ids
        // lookup is used to perform outerjoin with the users table
        const cleanertask = await TaskModel.aggregate([
            {
                $match: {'isSubmitted':true} /* consider only tasks that has been approved */

            },
            {
                $group: {
                    _id: '$assigned_cleaner', 
                    totalRoomsCleaned: { $addToSet: '$assigned_room' }
                }
            },
            {
                $lookup: {
                    from: 'users', //  collection name is 'users' for cleaners
                    localField: '_id', /* specifies the _id in Tasks */
                    foreignField: '_id', /* specifies the _id in the user table */
                    as: 'cleaner' /* join the documents as cleaner */
                }
            },
            {
                $unwind: '$cleaner'
            },
            {
                $project: { /* reshape the document output */
                    cleanerId: '$cleaner._id',
                    cleanerUsername: '$cleaner.username',
                    totalRoomsCleaned: { $size: '$totalRoomsCleaned' }
                }
            }
        ])
        return customResponse.successResponse('Cleaner summary', cleanertask, res)
    }catch (error:any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('Internal server error', res, error)
    }
}
export default { 
    roomHistory, 
    cleanerHistory, 
    inspectorHistory, 

    cleanerTaskSummary
}