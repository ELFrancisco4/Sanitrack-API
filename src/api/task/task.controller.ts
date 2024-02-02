import { Request, Response } from 'express';
import TaskModel from '../../models/task';
import customResponse from '../../helpers/response';
import { AuthenticatedRequest } from '../../middlewares/security';
import RoomService from '../../services/room';
import TaskService from '../../services/task';
import User from '../../models/user';
import Timer from '../../models/timer';
import Location from '../../models/location';
import RoomModel from '../../models/room';
import Logger from '../../utils/logger';

/**
 * Create a new task with its details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const managerId = req.auth.userId;
        const role = req.auth.role_id.role_name; // access the actual role name from req.aut

        const { roomId, inspectorId, cleanerId, locationId } = req.body;

        Logger.info(`cleaner id =>${req.body.cleanerId}`)
        // Check role of the user
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to create task', res);
        }

        // check if the cleaner and inspector are active 
        const cleanerStatus = await User.findById(cleanerId, 'flag');
Logger.info(`cleaner status => ${cleanerStatus ? cleanerStatus.flag : 'User not found'}`);
        const inspectorStatus = await User.findById(inspectorId, 'flag')

        // Check if the roomId entered belongs to the locationId entered
        const room = await RoomModel.findOne({_id: roomId, location_id: locationId})
        if(!room) return customResponse.badRequestResponse("The selected room does belong to the location choosen", res)

        // Check if a task has been created for the same room and location before
        const existingTask = await TaskModel.findOne({ assigned_room: roomId, assigned_location: locationId });
        if(existingTask) {
            return customResponse.badRequestResponse("A task for this room in the specified location already exists", res);
        }
        
        // Get the room details and create task with it
        if(cleanerStatus?.flag == 'ACTIVE' && inspectorStatus?.flag == 'ACTIVE'){ 
            const { data: room, status, message} = await RoomService.getRoom(roomId);
   
            if(!status) {
                return customResponse.badRequestResponse(`${message}`, res);
            }

            // Check if room details is empty
            if (!room.detail || room.detail.length === 0) {
                return customResponse.badRequestResponse("Room details are empty. Cannot create a task.", res);
            }
    
            // Create the task
            const task = await TaskModel.create({
                assigned_inspector: inspectorId, 
                assigned_manager: managerId,
                assigned_cleaner: cleanerId,
                assigned_location: locationId,
                assigned_room: roomId,
                tasks: room.detail
            })
    
            if(!task) {
                return customResponse.badRequestResponse('Failed to create task.', res);
            }
    
            return customResponse.createResponse('Task created successfully', task, res);
        }else{ 
            return customResponse.badRequestResponse('Attempted to assign a room to a fired employee', res)
        }
        
        
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the create task endpoint',
            res,
            err
        );
    }
};

/**
 * Submit task with its completed details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const submitTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const role = req.auth.role_id.role_name;
        // receive the start_time, stop_time and room_id
        const taskId = req.query.taskId
        const { start_time, stop_time, roomId } = req.body;

        if(!taskId) return customResponse.badRequestResponse('Missing required query param <taskId>', res);
       
        if(role !== 'Cleaner') {
            return customResponse.badRequestResponse('You do not have permission to submit a task', res);
        }
        // update the timer
        const updateTime = await Timer.create({ 
            taskId: taskId, 
            roomId: roomId, 
            start_time: start_time, 
            stop_time: stop_time
        })

        return customResponse.successResponse('Task submitted', updateTime, res)
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the submit task endpoint',
            res,
            err
        );
    }
};

/**
 * Get all tasks with its completed details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const getAllTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to create task', res);
        }
        // let urole;
        // let uid;
        
        // if (req.query.qrcode) {
        //     // Extract the QR code parameter from the request
        //     const qrcode = req.query.qrcode;
        //     // Decode the QR code data
        //     const {data: decodedData, status} = await TaskService.decodeQRCode(qrcode);
        //     if(status === false) {
        //         return customResponse.badRequestResponse(decodedData.message, res);
        //     }
        //     // Extract user ID or other relevant data from the decoded QR code
        //     const obj = JSON.parse(decodedData)
        //     urole = obj.role;
        //     uid = obj.userId;
            
        // } else if (req.auth) {
        //     // Destructure role and userId from req.auth
        //     const { userId, role} = req.auth;
        //     urole = role;
        //     uid = userId;
        // } else {
        //     return customResponse.badRequestResponse('Missing params.', res);
        // }
        // let query = {};

        // switch (urole) {
        //     case 'cleaner':
        //         query = { assigned_cleaner: uid, isSubmitted: false };
        //         break;
        //     case 'inspector':
        //         query = { assigned_inspector: uid };
        //         break;
        //     case 'manager':
        //         query = { assigned_manager: uid };
        //         break;
        // }

        const taskQuery = TaskModel.find()
            .populate({
                path: 'assigned_inspector assigned_manager assigned_cleaner',
                select: 'username',
            })
            .populate('assigned_room')
            .sort({ createdAt: -1 });

        const [totalTasks, allTasks] = await Promise.all([
            TaskModel.countDocuments(),
            taskQuery.exec(),
        ]);


        // Prepare data to send in the response
        const data = {
            totalTasks,
            allTasks: allTasks.map(task => ({
                taskId: task._id,
                cleanerUsername: task.assigned_cleaner,
                inspectorUsername: task.assigned_inspector,
                roomName: task.assigned_room,
                isSubmitted: task.isSubmitted
                // Add other task details as needed
            })),
        };

        // Return success response with paginated task information
        return customResponse.successResponse('Get all tasks successful', data, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all task endpoint',
            res,
            err
        );
    }
};

/**
 * View task with its details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const getTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const taskId = req.query.taskId;
        
        if (!taskId) {
            return customResponse.badRequestResponse('Missing required query param <taskId>', res);
        }
        // const query = {
        //     _id: taskId,
        //     ...(role === 'cleaner' && { assigned_cleaner: userId }),
        //     ...(role === 'inspector' && { assigned_inspector: userId }),
        //     ...(role === 'manager' && { assigned_manager: userId }),
        // };
        
        const task = await TaskModel.findOne()
            .populate('assigned_inspector assigned_manager assigned_cleaner assigned_room')
            .exec();
        
        if(!task) {
            return customResponse.badRequestResponse("Task not found or not permitted to view this task", res);
        }
        
        // Return success response with task information
        return customResponse.successResponse('Task retrieved successfully', task, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get task endpoint',
            res,
            err
        );
    }
};

/**
 * Update task
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
       
        const { roomId, inspectorId, cleanerId, taskId } = req.body;
        // Validate the request body
        if (!roomId || !inspectorId || !cleanerId || !taskId) {
            return customResponse.badRequestResponse('Missing required fields', res);
        }
       
        // Get the task and update its details
        const task = await TaskModel.findById(taskId);
        if(!task) {
            return customResponse.badRequestResponse("Task not found", res);
        }
        // Update task
        task.assigned_inspector = inspectorId;
        task.assigned_cleaner = cleanerId;
        await task.save();
       
        return customResponse.createResponse('Task updated successfully', task, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the update task endpoint',
            res,
            err
        );
    }
};

/**
 * Delete task
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { taskId } = req.body;
        // Validate the request body
        if (!taskId ) {
            return customResponse.badRequestResponse('Missing required field', res);
        }

        // Get the task and update its details
        const task = await TaskModel.findByIdAndDelete(taskId);
        return customResponse.createResponse('Task deleted successfully', task, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the delete task endpoint',
            res,
            err
        );
    }
};


export default {
    createTask,
    submitTask,
    getAllTasks,
    getTask,
    updateTask,
    deleteTask,
};
