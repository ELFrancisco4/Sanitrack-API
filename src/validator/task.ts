import Joi from 'joi';

// Define and export validation schemas using Joi
interface CreateTaskSchema {
    inspectorId: string; 
    cleanerId: string; 
    locationId: string;
    roomId: string; 
}

interface UpdateTaskSchema {
    taskId: string;
    inspectorId: string; 
    cleanerId: string; 
    roomId: string; 
}

interface SubmitTaskSchema {
    start_time: string; 
    stop_time: string; 
    roomId: string
}

interface DeleteTaskSchema {
    taskId: string;
}


const validationSchemas = {
    // Schema for creating a task
    createTask: Joi.object<CreateTaskSchema>({
        inspectorId: Joi.string().required(),
        cleanerId: Joi.string().required(),
        locationId: Joi.string().required(), 
        roomId: Joi.string().required(),
    }),

    // Schema for task update
    updateTask: Joi.object<UpdateTaskSchema>({
        taskId: Joi.string().required(),
        inspectorId: Joi.string().required(),
        cleanerId: Joi.string().required(),
        roomId: Joi.string().required(),
    }),

    // Schema for task submission
    submitTask: Joi.object<SubmitTaskSchema>({
        start_time: Joi.string().required(), 
        stop_time: Joi.string().required(),
        roomId: Joi.string().required()
    }),

    // Schema for deleting task by id
    deleteTask: Joi.object<DeleteTaskSchema>({
        taskId: Joi.string().required(),
    }),

};

export default validationSchemas;
