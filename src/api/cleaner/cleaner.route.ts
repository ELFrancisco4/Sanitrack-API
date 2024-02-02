import { Router } from "express"
import cleaner from './cleaner.controller'
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck } from "../../middlewares/security"

export default () => { 
    const {cleanerPermission} = UserPermissions
    const cleanerRouter = Router()

    cleanerRouter.get('/', cleaner.getRoomLocation)
    cleanerRouter.get('/rooms', permissionCheck(cleanerPermission.getRoom), cleaner.getAllRooms)
    cleanerRouter.get('/room-task', cleaner.getRoomDetailsById)

    cleanerRouter.post('/room-details',cleaner.uploadDetailImages)

    return cleanerRouter
}