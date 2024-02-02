import { Router } from "express"
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck } from "../../middlewares/security"
import permissions from "./permission.controller"
export default () => { 
    const permissionRouter = Router()

    const {admin} = UserPermissions

    permissionRouter.get('/', permissions.getPermission)
    permissionRouter.post('/add', permissionCheck(admin.addPermission), permissions.addPermission)
    permissionRouter.post('/assign', permissionCheck(admin.assignPermission), permissions.assignPermission)
    permissionRouter.post('/delete', permissions.removeRolePermission)
    permissionRouter.get('/role-id', permissions.getPermissionByRoleId)

    return permissionRouter
}