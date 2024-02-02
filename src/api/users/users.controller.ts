import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import customResponse from "../../helpers/response";
import User from '../../models/user';
import { AuthenticatedRequest } from '../../middlewares/security';
import crypto from 'crypto'

// Load environment variables from a .env file
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import TaskModel from '../../models/task'
import RoomModel from '../../models/room';
import UserRoles from '../../models/userRoles';
import Address from '../../models/address';
import Logger from '../../utils/logger';
import Role from '../../models/role';

dotenv.config();

const JWT_KEY: string = process.env.JWT_KEY!;
const TOKEN_VALIDATION_DURATION: string = process.env.TOKEN_VALIDATION_DURATION!;


const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { password, username, email, phone_number, role_id, role_name, address } = req.body;
        Logger.info(address.country)
        // Check if username is already in use
        const lowerCaseUsername = username.toLowerCase();
        const existingUsername = await User.findOne({ username: lowerCaseUsername });
        if (existingUsername) {
            return customResponse.badRequestResponse('Username already in use', res);
        }
        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 12);
        // create new address 
        const newAddress = await Address.create(address)
        // Create new user
        const user = await User.create({
            username: lowerCaseUsername,
            password: hashedPassword,
            email: email, 
            address_id: newAddress._id, 
            phone_number: phone_number,
            flag: 'ACTIVE'
        });

        const userRole = await UserRoles.create({
            user_id: user._id,
            user_name: user.username,
            role_id: role_id, 
            role_name: role_name
        });
        const newUser = {
            id: user._id,
            role: userRole._id,
            username: user.username,
        };

        return customResponse.createResponse('User created successfully', newUser, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the create user endpoint',
            res,
            err
        );
    }
};

const userProfile = async(req:AuthenticatedRequest, res:Response) => { 
    try{ 
        const userId = req.auth.userId; 
        Logger.info(`user profile id => ${userId}`)

        const result = await User.findById(userId).populate('address_id')
        return customResponse.successResponse('User profile', result, res)
    }catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get profile endpoint',
            res,
            err
        );
    }
}

const editProfile = async(req:AuthenticatedRequest, res:Response) => { 
    try{ 
        const userId = req.auth.userId
        const { password, username, email, phone_number, address } = req.body;

        if(!userId) return customResponse.unAuthorizedResponse('Please login', res)
        // check if there is user with the loggedin
        const userDetails = await User.findById(userId)
        if(!userDetails) return customResponse.badRequestResponse('User not found', res)

        const userAddress = await Address.findById(userDetails.address_id)
        if(!userAddress) return customResponse.badRequestResponse('User does not have an address to update', res)

        const hashedPassword = await bcrypt.hash(password, 12);

        userAddress.country = address.country
        userAddress.state = address.state
        userAddress.city = address.city
        userAddress.home_address = address.home_address

        userDetails.username = username
        userDetails.password = hashedPassword
        userDetails.email = email
        userDetails.phone_number = phone_number
    
        await userDetails.save()
        await userAddress.save()

        
        // check if the logged in id
    }catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get profile endpoint',
            res,
            err
        );
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;
        // Check if user exists
        const lowerCaseUsername = username.toLowerCase();
        const user = await User.findOne({username: lowerCaseUsername}).select('+password +role') ;
        if (!user) {
            return customResponse.badRequestResponse('Incorrect credentials', res);
        }
        // Check if password matches
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return customResponse.badRequestResponse('Incorrect credentials', res);
        }
        // Check if the user that wants to login is ACTIVE
        if(user.flag !== 'ACTIVE'){ 
            return customResponse.badRequestResponse('Cannot Login, you are fired', res)
        }
        // Get the user role from the role collections
        const userRoles = await UserRoles.find({user_id: user._id}).populate('role_id')
        if (userRoles.length === 0) { 
            return customResponse.badRequestResponse('Meet support or admin to assign a role to you', res);
        }
       
        if(userRoles.length == 1){ 
            // Generate the JWT token for person with one role. 
            const token = jwt.sign({ userId: user._id, username: user.username, role_id: userRoles[0].role_id}, JWT_KEY, {
                expiresIn: 360000,
            });
            // Logger.info(`from the user controller => ${to}`)
            const userData = {requiredRoleSelection: false, token, userId: user._id, username: user.username, role_id: userRoles[0].role_id._id };
            return customResponse.successResponse('Login successful', userData, res);
            
        }else if (userRoles.length > 1){ 
            const availableRoles = userRoles.map((role) => ({
                role_id: role.role_id._id, 
                role_name: role.role_name
            }))
            const token = jwt.sign({ userId: user._id, username: user.username, roleId: availableRoles[0].role_id, role_name: availableRoles[0].role_name}, JWT_KEY, {
                expiresIn: '60s',
            });
            const responseData = { 
                requiredRoleSelection: true, 
                assignedRoles: availableRoles, 
                userId: user._id, 
                token:token
            }

            return customResponse.successResponse('Please select a role to continue', responseData, res)
        }
       
        // Generate a QRCODE for cleaner
        let qrcode;
        // if(user.role === 'cleaner') {
        //     const userId: string = user._id;
        //     const role: string = user.role;
        //     const qrCodeData: string = JSON.stringify({ userId, role });
        //     qrcode = await TaskService.generateQRCode(qrCodeData);
        // }
        // // Serialize user data
        // const userData = {
        //     QRCode: user.role === 'cleaner' ? qrcode.data : null ,
        //     token,
        //     id: user._id,
        //     role: user.role,
        //     username: user.username
        // };

    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the login endpoint',
            res,
            err
        );
    }
};

const selectRoleLogin = async (req: AuthenticatedRequest, res: Response) => { 
    const userId = req.auth.userId
    const {selectedRoleId} = req.body

    // console.log(`userId => ${userId}`)

    const user = await User.findById(userId)
    if (!user) {
        return customResponse.badRequestResponse('Incorrect credentials', res);
    }

    // add check to see if the user passed in the correct roleID
    const userRole = await UserRoles.find({role_id: selectedRoleId})
    if(userRole.length > 0){ 
        const token = jwt.sign(
            { userId: user._id, username: user.username, roleId: userRole[0].role_id._id, role_name: userRole[0].role_name}, 
            JWT_KEY, 
            {expiresIn: 360000,}
        );
    
        const userData = {token, userId:user._id, username: user.username, role_id: selectedRoleId}
        return customResponse.successResponse('Login successful', userData, res);
    }else{ 
        return customResponse.badRequestResponse('Wrong role id passed', res)
    }

    
   
}

const getUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to view all users', res);
        }

        // Destructure userId from query parameters
        const { userId } = req.query;
        // Check if userId is undefined
        if (!userId) {
            return customResponse.badRequestResponse('User ID is required', res);
        }
        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return customResponse.badRequestResponse('User not found', res);
        }
        // Return srialized user information
        return customResponse.successResponse('User fetched successfully', user, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get user endpoint',
            res,
            err
        );
    }
};

// gets all the active cleaners in the system
const getAllCleaners = async(req:AuthenticatedRequest, res:Response): Promise<void> => { 
    try{ 
        const allCleaners = await User.aggregate([
            {
                $match: {'flag': 'ACTIVE'}
            }, 
            {
                $lookup: {
                    from: 'userroles', 
                    localField: '_id',
                    foreignField: 'user_id',
                    as: 'user_roles'
                }
            }, 
            {
                $unwind: '$user_roles'
            }, 
            {
                $match: { 'user_roles.role_name': 'Cleaner' } // Additional match for specific role
            },
            {
                $project: {
                  _id: 1,
                  username: 1,
                  email: 1,
                  address_id: 1,
                  phone_number: 1,
                  flag: 1,
                  role_name: '$user_roles.role_name'  // Extract role_name from user_roles
                }
            }
        ])
        const data = {allCleaners}
        return customResponse.successResponse('Active cleaners fetched.', data, res)
    }catch(err:any){ 
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all users endpoint',
            res,
            err
        );
    }
}

// gets all the inspectors in the system 
const getAllInspectors = async(req:AuthenticatedRequest, res:Response): Promise<void> => { 
    try{ 
        const allInspectors = await User.aggregate([
            {
                $match: {'flag': 'ACTIVE'}
            }, 
            {
                $lookup: {
                    from: 'userroles', 
                    localField: '_id',
                    foreignField: 'user_id',
                    as: 'user_roles'
                }
            }, 
            {
                $unwind: '$user_roles'
            }, 
            {
                $match: { 'user_roles.role_name': 'Inspector' } // Additional match for specific role
            },
            {
                $project: {
                  _id: 1,
                  username: 1,
                  email: 1,
                  address_id: 1,
                  phone_number: 1,
                  flag: 1,
                  role_name: '$user_roles.role_name'  // Extract role_name from user_roles
                }
            }
        ])
        const data = {allInspectors}
        return customResponse.successResponse('Active Inspector fetched.', data, res)
    }catch(err:any){ 
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all users endpoint',
            res,
            err
        );
    }
}

const getStaffByName = async(req: AuthenticatedRequest, res:Response) => { 
    try{ 

        const userName = req.query.userName
        const staff = await User.findOne({username: userName, flag: "ACTIVE"})

        if(!staff) return customResponse.badRequestResponse('Staff does not exist or fired', res)
        return customResponse.successResponse('staff fetched', staff, res)
    }catch(err:any){ 
        Logger.error(err)

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get staff by name endpoint',
            res,
            err
        );
    }
    
}


const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to view all users', res);
        }
        // Explicitly cast query parameters to numbers and handle undefined
        const page = req.query.page ? Number(req.query.page) : undefined;
        const documentCount = req.query.documentCount ? Number(req.query.documentCount) : undefined;

        // Check if page or documentCount is undefined before using them
        if (page === undefined || documentCount === undefined) {
            return customResponse.badRequestResponse('Invalid page or documentCount', res);
        }
        // Get the total count of registered users
        const totalUsers = await User.countDocuments();

        // Fetch all users from the database
        const allUsers = await User.find({ role: { $ne: 'manager' } })
            .limit(documentCount)
            .skip(documentCount * (page - 1))
            .sort({ createdAt: -1 });

        // Calculate prevPage and nextPage
        const prevPage = page > 1 ? page - 1 : null;
        const nextPage = documentCount * page < totalUsers ? page + 1 : null;

        // Prepare data to send in the response
        const data = {
            page,
            prevPage,
            nextPage,
            documentCount,
            totalUsers,
            allUsers,
        };
        // Return success response with the list of users
        return customResponse.successResponse('Users fetched successfully', data, res);
    } catch (err: any) {
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all users endpoint',
            res,
            err
        );
    }
};


const updateUsername = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Destructure username from request body and id from auth
        const { username } = req.body;
        const { userId } = req.auth;

        // Find user by ID
        const user = await User.findById(userId);

        // Check if the user is not found
        if (!user) {
            return customResponse.badRequestResponse('User not found', res);
        }
        // Check if username is already in use
        const lowerCaseUsername = username.toLowerCase();
        const existingUsername = await User.findOne({ username: lowerCaseUsername });
        if (existingUsername) {
            return customResponse.badRequestResponse('Username already in use', res);
        }

        // Update username and save changes
        user.username = lowerCaseUsername;
        await user.save();

        // Return success response with updated user information
        return customResponse.successResponse('Username updated successfully', user, res);
    } catch (err: any) {
        console.error(err);
        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the update username endpoint',
            res,
            err
        );
    }
};

const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const  userId  = req.body.staffId;

        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to Fire a user', res);
        }
        if(!mongoose.Types.ObjectId.isValid(userId)) return customResponse.badRequestResponse('Invalid Id Type', res)
        
        const deletedUser = await User.findByIdAndUpdate(
            {_id: userId}, 
            {$set: {flag: 'INACTIVE'}},
            {new: true}
        )
        
        // if(!deletedUser) return customResponse.notFoundResponse('There is no employee with such id', res )
        return customResponse.successResponse('User deleted successfully', deletedUser, res);
        
    } catch (err: any) {
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in delete endpoint',
            res,
            err
        );
    }
};

const generateCloudinarySignature = async (req: AuthenticatedRequest, res: Response) => {
    const timestamp = Math.round((new Date()).getTime() / 1000); // UNIX timestamp in seconds
    const apiSecret = process.env.CLOUDINARY_API_SECRETT; // Replace with your Cloudinary API Secret

    // Additional parameters can be added here if needed
    const signatureString = `timestamp=${timestamp}${apiSecret}`;

    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    res.json({
        signature: signature,
        timestamp: timestamp
    });
}

const updateUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => { 
    try{ 
        const  userId  = req.body.staffId;

        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to restore a user', res);
        }
        if(!mongoose.Types.ObjectId.isValid(userId)) return customResponse.badRequestResponse('Invalid Id Type', res)
        
        const updatedUser = await User.findByIdAndUpdate(
            {_id: userId}, 
            {$set: {flag: 'ACTIVE'}},
            {new: true}
        )
        
        // if(!deletedUser) return customResponse.notFoundResponse('There is no employee with such id', res )
        return customResponse.successResponse('User status updated sucessfully', updatedUser, res);
    }catch(err: any){ 
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in delete endpoint',
            res,
            err
        );
    }
}
export default {
    createUser,
    login,
    userProfile,
    editProfile,
    selectRoleLogin,
    getUser,
    getAllCleaners,
    getAllInspectors,
    getAllUsers,
    getStaffByName,
    updateUsername,
    deleteUser, 
    updateUserStatus, 
    generateCloudinarySignature
};