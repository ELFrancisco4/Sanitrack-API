import { Router } from "express";
import validate from "../../middlewares/validate";
import room from './rooms.controller'
import validator from "../../validator/room";

export default () => { 
    const roomRoutes = Router();

    // Route for creating room
    roomRoutes.post("/create-room", validate(validator.createRoom), room.createRoom);

    // Route for getting all rooms
    roomRoutes.get("/get", room.getAllRooms);

    // Route for getting room by id
    roomRoutes.get("/get-single", room.getRoom);

    // Route for updating room
    roomRoutes.put("/update", validate(validator.updateRoom), room.updateRoom);

    // Route for deleting room
    roomRoutes.delete("/delete", room.deleteRoom);

    // Route for unassigned rooms
    roomRoutes.get('/unassigned-rooms', room.getRoomsNotInTask)

    // Route to get rooms based on location 
    roomRoutes.get("/location", room.getRoomByLocationId)

    return roomRoutes
}