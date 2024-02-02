const UserPermissions = { 
    admin: { 
        getRole: 'admin:GET_ROLE',
        addRole: 'admin:ADD_ROLE', 
        updateRole: 'admin:UPDATE_ROLE', 
        deleteRole: 'admin:DELETE:ROLE',
        assignRole: 'admin:ASSIGN_ROLE', 

        addPermission: 'admin:ADD_PERMISSION', 
        getPermissions: 'admin:GET_PERMISSION',
        getPermissionByRoleId: 'admin:GET_PERMISSION_BY_ROLEID',
        updatePermission: 'admin:UPDATE_PERMISSION',
        deletePermission: 'admin:DELETE_PERMISSION', 
        assignPermission: 'admin:ASSIGN_PERMISSION',

        getStaffRole: 'admin:GET_STAFF_ROLE',

        getStaffs: 'admin:GET_STAFF', 
        addLocation: 'admin:ADD_LOCATION', 
        editLocation: 'admin:EDIT_LOCATION', 
        deleteLocation: 'admin:DELETE_LOCATION', 
        viewLocation:'admin:VIEW_LOCATION', 
        viewLocationBId: 'admin:VIEW_LOCATION_ID'
        
    }, 
    cleanerPermission: {
        getRoom: 'cleaner:GET_ROOM', 
        getLocation: 'cleaner:GET_LOCATION', 
        uploadImage: 'cleaner:UPLOAD_IMAGE',
        getRoomDetail: 'cleaner:GET_ROOM_DETAIL'
    }
}
export {UserPermissions}