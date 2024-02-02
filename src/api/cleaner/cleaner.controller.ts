import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";
import customResponse from "../../helpers/response";
import TaskModel from "../../models/task";
import { CleanerRoomDetails, TaskWithRoomDetails } from "../../validator/cleaner";
import RoomDetailModel from "../../models/roomDetail";
import Timer from "../../models/timer";
import Logger from "../../utils/logger";
import Location from "../../models/location";

const getRoomLocation = async(req:AuthenticatedRequest, res:Response) => {
  const cleanerId = req.auth.userId; // Assuming req.auth.userId represents the ID of the logged-in cleaner
  Logger.info(JSON.stringify(req.auth))
  const formattedLocationData = [];
  try {
      // Find the cleaner's task(s) that isSubmitted is set to false
      const uniqueLocationIds = await TaskModel.distinct('assigned_location', {
        assigned_cleaner: cleanerId,
        isSubmitted: false
      }).exec();
      
      for (const uniqueLocation of uniqueLocationIds) {
        try {
          const locationDetails = await Location.findById(uniqueLocation).exec();
      
          if (locationDetails) {
            // Access the country, state, city, or any other information in your Location model
            const { country, state, city, postal_code } = locationDetails;
      
            const locationData = {
              id: uniqueLocation,
              country,
              state,
              city,
              postal_code
            };

            // Push the formatted data to the array
            formattedLocationData.push(locationData);
          } else {
            console.log(`Location with ID ${uniqueLocation} not found`);
          }
        } catch (error) {
          console.error(`Error fetching location details for ID ${uniqueLocation}:`, error);
        }
      }


     return customResponse.successResponse('fetched', formattedLocationData, res)

  } catch (error) {
      console.error("Error fetching cleaner's tasks or locations:", error);
      // Handle the error
  }


}

const getAllRooms = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  // get all the rooms that the logged in cleaner is assigned to clean
  try {
    const cleanerId = req.auth.userId;
    // const role = req.auth.role_id.role_name;

    const locationId = req.query.locationId
    // Check role of the user
    // if(role !== 'Cleaner') {
    //   return customResponse.badRequestResponse('You do not have permission to get all rooms', res);
    // }

    if(!locationId) return customResponse.badRequestResponse('Missing required query param <locationId>', res);

    const taskWithRoomDetails = (await TaskModel.find({
      assigned_cleaner: cleanerId, assigned_location: locationId,  isSubmitted: false 
    }).populate(
      "assigned_room",
      " roomName"
    )) as Array<TaskWithRoomDetails>;

    if (taskWithRoomDetails.length > 0) {
      const cleanerRooms = taskWithRoomDetails.map((task) => {
        // console.log(task)
        const roomDetails = task.assigned_room;

        return {
          taskId: task.id,
          roomId: roomDetails._id,
          roomName: roomDetails.roomName,
        };
      });
      const data = { cleanerRooms };
      return customResponse.successResponse("Get room for cleaner", data, res);
    } else {
      return customResponse.createResponse(
        "There is no room currently.",
        null,
        res
      );
    }
  } catch (err: any) {
    console.error(err);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the get all rooms for cleaner endpoint",
      res,
      err
    );
  }
};

const getRoomDetailsById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const cleanerId = req.auth.userId;
    const roomId = req.query.roomId;
    // const role = req.auth.role_id.role_name;

    // Check role of the user
    // if(role !== 'Cleaner') {
    //   return customResponse.badRequestResponse('You do not have permission to assigned rooms', res);
    // }
    // Get the details of the room id
    const roomDetails = await TaskModel.find(
      { assigned_room: roomId, isSubmitted: false },
      { assigned_cleaner: cleanerId },
      { "tasks.isDone": false } // Add this condition to filter only tasks where isDone is false
    ).populate("tasks");
    const filteredTasks = roomDetails?.flatMap((doc) =>
      doc.tasks.filter((task) => !task.isDone)
    );

    return customResponse.successResponse(
      "Details fetched",
      filteredTasks,
      res
    );
  } catch (error: any) {
    console.log(error);
    return customResponse.serverErrorResponse(
      "Oops.. something occured in the get room by id for cleaners endpoint",
      res,
      error
    );
  }
};

const uploadDetailImages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const inputs = req.body;
    // const role = req.auth.role_id.role_name;

    // Check role of the user
    // if(role !== 'Cleaner') {
    //   return customResponse.badRequestResponse('You do not have permission to assigned rooms', res);
    // }
    const updateImagePath = await Promise.all(
      inputs.map(async (detailsData: any) => {
        const { detail_id, image_path} = detailsData;

        Logger.info(detailsData)
        // Update the Database (detail table and Task Table)

        const updatedDetail = await RoomDetailModel.findOneAndUpdate(

          { "detail._id": detail_id },
          { $set: { "detail.$.image": image_path } },
          { new: true }
        );

        const updateTask = await TaskModel.findOneAndUpdate(
          {"tasks._id": detail_id}, 
          { $set: { 'tasks.$.image': image_path } },
          {new: true}
        )

        if (!updatedDetail) {
          console.log(`Detail with _id ${detail_id} not found.`);
        }

        if (!updateTask) {
          console.log(`Detail with _id ${image_path} not found.`);
        }

      })
    );
    const data = {updateImagePath}
    return customResponse.successResponse("Image Uploaded",data, res)
  } catch (error: any) {
    console.error("Upload error:", error);
    return customResponse.serverErrorResponse(
      "Oops.. something occured in the update image for cleaners endpoint",
      res,
      error
    );
  }

};

export default {
  getRoomLocation,
  getAllRooms,
  getRoomDetailsById,
  uploadDetailImages,
};
