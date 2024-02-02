import { Router, Request, Response, NextFunction } from 'express';
import customResponse from '../helpers/response';
import usersRoute from '../api/users/users.route';
import roomRoutes from '../api/rooms/rooms.route'
import taskRoutes from '../api/task/task.route';
import cleanerRouter from '../api/cleaner/cleaner.route';
import inspectorRouter from '../api/inspector/inspector.route';
import roleRouter from '../api/role/role.route';
import permissionRouter from '../api/permissions/permission.route';
import locationRoute from '../api/location/location.route';
import documentRouter from '../api/documents/document.route';
import evidenceRoute from '../api/evidence/evidence.route';
import workerHistory from '../api/history/history.route'
import userroleRoute from '../api/userrole/userrole.route';

// Create an Express Router
export default () => {
    const routes = Router();

    // Use the userRoutes for the root path ("/")
    routes.use("", usersRoute());
 
    routes.use("/room", roomRoutes());
   
    routes.use("/task", taskRoutes());

    routes.use("/cleaner-dashboard", cleanerRouter())

    routes.use("/inspector", inspectorRouter())

    routes.use('/roles', roleRouter())

    routes.use('/permissions', permissionRouter())

    routes.use('/locations', locationRoute())

    routes.use('/documents', documentRouter())

    routes.use('/evidence', evidenceRoute())

    routes.use('/work-history', workerHistory())

    routes.use('/user-role', userroleRoute())
    
    // Handle requests for unknown routes
    routes.use((_, res: Response) => {
        customResponse.notFoundResponse('Route not found', res);
    }); 

    return routes

}

