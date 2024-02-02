import { Router } from "express"
import evidence from "./evidence.controller"

export default () => { 
    const evidenceRouter = Router()

    evidenceRouter.get('/room-name', evidence.getRoomFromTask)
    evidenceRouter.get('/images', evidence.getImagesFromTask)
    return evidenceRouter
}