import { Router } from "express";
import validate from "../../middlewares/validate";
import validator from "../../validator/task";
import task from "./task.controller"

export default () => { 
    const taskRoutes = Router();

    // Route for creating task
    taskRoutes.post("/create", task.createTask);

    // Route for getting all tasks
    taskRoutes.get("/get", task.getAllTasks);

    // Route for getting all tasks by QRCODE
    taskRoutes.get("/get-all-tasks-by-qrcode", task.getAllTasks);

    // Route for getting task by id
    taskRoutes.get("/get-single-task", task.getTask);

    // Route for updating task
    taskRoutes.put("/update-task", validate(validator.updateTask), task.updateTask);

    // Route for submitting task
    taskRoutes.post("/submit", validate(validator.submitTask), task.submitTask);

    // Route for deleting task
    taskRoutes.delete("/delete-task", validate(validator.deleteTask), task.deleteTask);

    return taskRoutes
}