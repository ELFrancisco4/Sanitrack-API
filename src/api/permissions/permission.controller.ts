import { Request, Response } from "express";
import customResponse from "../../helpers/response";
import Permission from "../../models/permissions";
import RolePermissions from "../../models/rolePermission";
import { AuthenticatedRequest } from "../../middlewares/security";
import Logger from "../../utils/logger";
/**
 * Create a new user.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */

const addPermission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.auth.role_id.role_name;
    if(role !== 'Admin') {
        return customResponse.badRequestResponse('You do not have permission to add new permissions', res);
    }
    const { permission_name } = req.body;
    const existingPermission = await Permission.findOne({
      permission_name: permission_name,
    });
    if (existingPermission)
      return customResponse.badRequestResponse(
        "Permission already exists",
        res
      );

    const permission = await Permission.create({
      permission_name: permission_name,
    });
    const newPermission = {
      id: permission._id,
      permission_name: permission.permission_name,
    };

    return customResponse.successResponse(
      "Permission added successfully",
      newPermission,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the add permissions endpoint",
      res,
      error
    );
  }
};

const getPermission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.auth.role_id.role_name;
    if(role !== 'Admin') {
        return customResponse.badRequestResponse('You do not have permission to view all permissions', res);
    }
    const permissionsQuery = Permission.find().sort({ createdAt: -1 });

    const [totalPermissions, allPermissions] = await Promise.all([
      Permission.countDocuments(),
      permissionsQuery.exec(),
    ]);

    // Prepare data to send in the response
    const data = {
      totalPermissions,
      allPermissions,
    };
    return customResponse.successResponse("All permissions", data, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the get all permissions endpoint",
      res,
      error
    );
  }
};

const deletePermission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const permissionId = req.query.permissionId;
    if(!permissionId) return customResponse.badRequestResponse('Missing required query param <permissionId>', res);
    const permission = await Permission.findByIdAndDelete(permissionId);

    // if you delete a permission, delete it from the rolePermission too 
    const permissionRemoved = await RolePermissions.updateMany(
      {'permissions.permission_id': permissionId},
      { $pull: { permissions: { permission_id: permissionId } } },
    )

    if(permissionRemoved.modifiedCount == 0){ 
      return customResponse.notFoundResponse('The permission was not assigned to a role so it cannot be removed from the role permission table', res)
    }
    return customResponse.successResponse(
      "Permission deleted",
      permission,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the get all permissions endpoint",
      res,
      error
    );
  }
};
interface PermissionType {
  permission_id: string;
  permission_name: string;
}


const assignPermission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.auth.role_id.role_name;
    if(role !== 'Admin') {
        return customResponse.badRequestResponse('You do not have permission to assign a permission', res);
    }
    const { role_id, permissions } = req.body;

    // Find the existing RolePermissions document
    let rolePermissions = await RolePermissions.findOne({ role_id });

    // If no existing document, create a new one
    if (!rolePermissions) {
      rolePermissions = new RolePermissions({ role_id, permissions: [] });
    }

    // first get all new permission ids and then check if they are in the rolePermissions.permissions
    const newPermissionId = permissions.map(
      (permission: { permission_id: any }) => permission.permission_id
    );

    const intersection = rolePermissions.permissions.filter((permission) =>
      newPermissionId.includes(permission.permission_id.toString())
    );

    const alreadyExisitPermissions = intersection?.map(
      (aep) => aep.permission_name
    );

    if (alreadyExisitPermissions && alreadyExisitPermissions.length > 0) {
      return customResponse.createResponse(
        "A permission you want to add to this role already exists",
        alreadyExisitPermissions,
        res
      );
    }

    // Logger.info(`exisiting permissions => ${existingPermission}`)
    // Logger.info(`New permissions => ${newPermissionId}`)
    // Logger.info(`These permission ids alreay exists => ${alreadyExisitPermissions}, ${alreadyExisitPermissions?.length}`)
    // Add the new permissions to the existing ones
    rolePermissions.permissions = [
      ...rolePermissions.permissions,
      ...permissions,
    ];

    // // Save the updated document
    await rolePermissions.save();

    return customResponse.createResponse(
      "Permissions assigned successfully",
      rolePermissions,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the assign permission endpoint",
      res,
      error
    );
  }
};

const getPermissionByRoleId = async (req:AuthenticatedRequest, res: Response) => { 
  try{ 
    const roleId = req.query.roleId
    if(!roleId) return customResponse.badRequestResponse('Missing required query param <roleId>', res);
  
    const permission = await RolePermissions.findOne({role_id: roleId})
    if(!permission) return customResponse.successResponse('No permission has been assigned to this role', permission, res)
  
    return customResponse.successResponse("Permission fetched", permission, res)
  }catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the assign permission endpoint",
      res,
      error
    );
  }

}

const removeRolePermission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const inputData = req.body;

    if (!inputData.role_id || !inputData.permissions) {
      return customResponse.badRequestResponse('Invalid request data', res);
    }

    const result = await RolePermissions.updateOne(
      { role_id: inputData.role_id },
      {
        $pull: {
          permissions: {
            permission_id: { $in: inputData.permissions.map((p: any) => p.permission_id) },
          },
        },
      }
    );

    if (result && result.modifiedCount > 0) {
      return customResponse.successResponse('Permission removed', result, res);
    } else {
      return customResponse.badRequestResponse('Permission not found or not modified', res);
    }
  } catch (error:any) {
    Logger.error('Error removing permissions:', error);
    return customResponse.serverErrorResponse('Internal server error', res, error);
  }
};


export default {
  addPermission,
  getPermission,
  getPermissionByRoleId,
  deletePermission,
  assignPermission,
  removeRolePermission
};
