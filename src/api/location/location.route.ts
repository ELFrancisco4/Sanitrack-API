import { Router } from "express"
import { UserPermissions } from "../../constant/permissions"
import location from "./location.controller"
import validator from "../../validator/location"
import validate from "../../middlewares/validate"

export default () => { 
    const locationRoutes = Router()
    const {admin} = UserPermissions

    locationRoutes.get('/', location.getLocation )
    locationRoutes.post('/add', validate(validator.createLocation), location.addLocation)
    locationRoutes.get('/single-location', location.getLocationById)
    locationRoutes.put('/update', location.updateLocation)
    locationRoutes.delete('/delete', location.deleteLocation)

    return locationRoutes
}