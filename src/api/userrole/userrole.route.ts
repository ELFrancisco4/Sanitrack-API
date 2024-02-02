import { Router } from "express"
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck } from "../../middlewares/security"
import userRole from './userrole.controller'

export default () => { 
    const userRoleRouter = Router()

    const {admin} = UserPermissions

    userRoleRouter.get("/", userRole.getUserRole)
    userRoleRouter.post("/delete", userRole.deleteUserRole)
    
    return userRoleRouter
}