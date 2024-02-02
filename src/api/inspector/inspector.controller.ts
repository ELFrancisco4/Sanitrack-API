import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";
import TaskModel from "../../models/task";
import customResponse from '../../helpers/response'
import { TaskWithRoomDetails } from "../../validator/cleaner";
import Logger from "../../utils/logger";
import Location from '../../models/location'

const getRoomLocation = async(req:AuthenticatedRequest, res:Response) => {
    const inspectorId = req.auth.userId; // Assuming req.auth.userId represents the ID of the logged-in cleaner
    // const role = req.auth.role_id.role_name;
    const formattedLocationData = [];
    try {
        // if(role !== 'Inspector') { // I CHANGED THIS YOO
        //   return customResponse.badRequestResponse('You do not have permission to get room location', res);
        // }
        // Find the cleaner's task(s) that isSubmitted is set to false
        const uniqueLocationIds = await TaskModel.distinct('assigned_location', {
          assigned_inspector: inspectorId,
          isSubmitted: false
        }).exec();
        
        for (const uniqueLocation of uniqueLocationIds) {
          try {
            const locationDetails = await Location.findById(uniqueLocation).exec();
        
            if (locationDetails) {
              // Access the country, state, city, or any other information in your Location model
              const { country, state, city, postal_code } = locationDetails;
        
              const locationData = {
                id: uniqueLocation,
                country,
                state,
                city,
                postal_code
              };
  
              // Push the formatted data to the array
              formattedLocationData.push(locationData);
            } else {
              console.log(`Location with ID ${uniqueLocation} not found`);
            }
          } catch (error) {
            console.error(`Error fetching location details for ID ${uniqueLocation}:`, error);
          }
        }
  
  
       return customResponse.successResponse('fetched', formattedLocationData, res)
  
    } catch (error) {
        console.error("Error fetching cleaner's tasks or locations:", error);
        // Handle the error
    }
  
  
}

const getInspectorRoom = async(req: AuthenticatedRequest, res: Response): Promise<void>=> {
    try{ 
        const inspectorId = req.auth.userId
        const role = req.auth.role_id.role_name;

        if(role !== 'Inspector') {
            return customResponse.badRequestResponse('You do not have permission to get room ', res);
        }
        const locationId = req.query.locationId
        if(!locationId) return customResponse.badRequestResponse('Missing required query param <locationId>', res);

        const taskWithRoomDetails = await TaskModel.find(
            { assigned_inspector: inspectorId, assigned_location: locationId, isSubmitted: false }
        ).populate('assigned_room', 'roomName location') as Array<TaskWithRoomDetails>;
        
        if (taskWithRoomDetails.length > 0) {
            const inspectorRooms = taskWithRoomDetails.map(task => {
                const roomDetails = task.assigned_room;
        
                return {
                    roomId: roomDetails._id,
                    roomName: roomDetails.roomName,
                    location: roomDetails.location
                };
            });
        
            const data = { inspectorRooms };
            return customResponse.successResponse('Get room for inspector', data, res);
        } else {
            return customResponse.createResponse('There is no room to supervise currently.', null, res);
        }
        
    }catch(err: any){ 
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all rooms for inspector endpoint',
            res,
            err
        );
    }
}

const getRoomTask = async(req:AuthenticatedRequest, res: Response): Promise<void> => { 
    const roomId = req.query.roomId
    const inspectorId = req.auth.userId
    // const role = req.auth.role_id.role_name; // I CHANGED THIS

    // if(role !== 'Inspector') {
    //     return customResponse.badRequestResponse('You do not have permission to get room location', res);
    // }

    if(!roomId) return customResponse.badRequestResponse('Missing required query param <roomId>', res);
    // Get the image and send 
    const roomDetails = await TaskModel.findOne(
        {"assigned_room": roomId}, 
        {"assigned_inspector": inspectorId},
        {"tasks.isDone": false} 
    ).populate('tasks')
    const taskDetails = roomDetails?.tasks.filter(task => !task.isDone).map(task =>  ({
        task_id: task._id,
        name: task.name,
        image_url: task.image
    }));
    
    // Now taskDetails will contain an array of objects with only name and image fields
    const data = { taskId: roomDetails?._id, tasks: taskDetails };
    return customResponse.successResponse('Task fetched sucessfully', data, res)
}

const updateTaskItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const inspectorId = req.auth.userId;
    const roomId = req.query.roomId;
    const passedTasks = req.body.passedTasks;
    let updateIsDone

    const role = req.auth.role_id.role_name;
    if(role !== 'Inspector') {
        return customResponse.badRequestResponse('You do not have permission to get room location', res);
    }


    try {
        // Update tasks in a single query
        for (const task of passedTasks) {
            const taskId = task.taskId;
            // Update the isDone property for each task
            updateIsDone = await TaskModel.updateOne(
                { "tasks._id": taskId, "assigned_inspector": inspectorId },
                { $set: { "tasks.$.isDone": true } }
            );
        }

        // Check if all tasks are done
        const roomDetails = await TaskModel.findOne(
            { "assigned_room": roomId, "assigned_inspector": inspectorId }
        ).populate('tasks');

        if (roomDetails) {
            const allTaskDone = roomDetails.tasks.every(task => task.isDone);

            if (allTaskDone) {
                // Update the isSubmitted field
                await TaskModel.findOneAndUpdate(
                    { "assigned_room": roomId, "assigned_inspector": inspectorId },
                    { $set: { "isSubmitted": true } },
                    { new: true }
                );
                
                return customResponse.successResponse("All tasks have been approved", {}, res);
            } else {
                console.log("Not all tasks are done");
            }
        } else {
            return customResponse.createResponse("You passed in the wrong roomId", {}, res);
        }

        return customResponse.successResponse("Approved", updateIsDone, res);
    } catch (error: any) {
        console.error(error);
        return customResponse.serverErrorResponse('Error updating tasks', res, error);
    }
};

export default { 
    getRoomLocation,
    getInspectorRoom, 
    getRoomTask, 
    updateTaskItem
}