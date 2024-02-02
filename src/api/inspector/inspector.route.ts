import { Router } from "express"
import inspector from "./inspector.controller"

export default () => { 
    const inspectorRouter = Router()

    inspectorRouter.get('/', inspector.getRoomLocation)
    inspectorRouter.get("/rooms", inspector.getInspectorRoom)
    inspectorRouter.get("/room-task", inspector.getRoomTask)
    inspectorRouter.put("/approve-task", inspector.updateTaskItem)

    return inspectorRouter
}