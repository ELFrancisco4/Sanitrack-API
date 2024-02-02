import { Router } from "express"
import worker from './history.controller'
export default () => { 
    const workerHistory = Router()
    
    workerHistory.get('/rooms', worker.roomHistory )
    workerHistory.get('/cleaner', worker.cleanerHistory)
    workerHistory.get('/inspector', worker.inspectorHistory)

    workerHistory.get('/cleaner-task-summary', worker.cleanerTaskSummary)

    return workerHistory
}