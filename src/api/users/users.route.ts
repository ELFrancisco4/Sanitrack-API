import { Router } from "express"
import validate from "../../middlewares/validate";
import validator from "../../validator/user";
import { UserPermissions } from "../../constant/permissions";
import { permissionCheck } from "../../middlewares/security";
import user from "./users.controller";


export default () => { 
    const userRoutes = Router()
    const {admin} = UserPermissions

    // Route for creating a user account
    userRoutes.post("/create-user",validate(validator.createUser), user.createUser);

    // Route for user login
    userRoutes.post("/login", validate(validator.login), user.login);
    userRoutes.post("/select-role", user.selectRoleLogin)

    userRoutes.get('/user-profile', user.userProfile)
    userRoutes.put("/edit-profile", user.editProfile)
    // Route for getting user details
    userRoutes.get("/get-user",user.getUser);

    userRoutes.get("/get-all-cleaner",  user.getAllCleaners)
    userRoutes.get("/get-all-inspector",  user.getAllInspectors)
    userRoutes.get("/get-all-users", user.getAllUsers);
    userRoutes.get('/staff', user.getStaffByName)
    // Route for getting all users


    // Route for getting all users
    userRoutes.patch("/update-username",validate(validator.updateUsername),user.updateUsername);

    // Route for deleting user account
    userRoutes.put("/delete-user/",user.deleteUser);
    userRoutes.put("/update-user-status/", user.updateUserStatus)

    userRoutes.get("/get-cloudinary-signature", user.generateCloudinarySignature)

    return userRoutes
}