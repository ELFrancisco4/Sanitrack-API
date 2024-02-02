import { AuthenticatedRequest } from "../../middlewares/security";
import { Response } from "express";
import customResponse from "../../helpers/response"
import Logger from "../../utils/logger";
import TaskModel from "../../models/task";
import RoomModel from "../../models/room";

const getRoomFromTask = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const role = req.auth.role_id.role_name;
      if(role !== 'Admin') {
          return customResponse.badRequestResponse('You do not have permission to get room for evidence', res);
      }
      const assigned_rooms = await TaskModel.find().populate({
        path: 'assigned_room',
        model: RoomModel, // Specify the model for population
      });
  
      const data = assigned_rooms.map((details) => ({
        task_id: details._id,
        roomName: (details.assigned_room as any)?.roomName || null,
      }));
  
      return customResponse.successResponse('Assigned rooms', data, res);
    } catch (err: any) {
      Logger.error(err);
  
      // Return server error response if an error occurs
      return customResponse.serverErrorResponse(
        'Oops... Something occurred in the get all users endpoint',
        res,
        err
      );
    }
};
  
const getImagesFromTask = async(req:AuthenticatedRequest, res:Response) => { 
    try{
      const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to view uploaded images for this room', res);
        }
        const {taskId} = req.query
        // use the taskId to populate the tasks and get their images 
        if(!taskId) return customResponse.badRequestResponse('Missing required query param <taskId>', res);
        const tasks = await TaskModel.findById(taskId).populate('tasks')
        const data = tasks?.tasks.map(images => ({
            image_url: images.image
        }))
        return customResponse.successResponse('Tasks found', data, res)
    }catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get image by task id endpoint',
            res,
            err
        );
    }
}

export default{ 
    getRoomFromTask, 
    getImagesFromTask
}