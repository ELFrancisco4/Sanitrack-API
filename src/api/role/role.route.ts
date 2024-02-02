import { Router } from "express"
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck } from "../../middlewares/security"
import role from './role.controller'

export default () => { 
    const roleRouter = Router()

    const {admin} = UserPermissions

    roleRouter.get('/',  role.getRole)
    roleRouter.post('/add', permissionCheck(admin.addRole), role.addRole)
    roleRouter.post('/assign', permissionCheck(admin.assignRole), role.assignRole)
    roleRouter.delete('/delete',permissionCheck(admin.deleteRole) ,role.deleteRole)
    roleRouter.get("/staff", role.getStaffRole)

    return roleRouter
}