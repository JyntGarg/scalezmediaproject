const userService = require("../services/userService");
const createError = require("http-errors");
const _ = require("lodash");

module.exports = {
  // check user role
  checkRole: async (id) => {
    const user = await userService.findUserById(id);
    if (!user) {
      throw createError(401, "Invalid user");
    }
    return user.role; // userService already maps role
  },

  // check user permission
  checkPermission: async (id, permission) => {
    // Check if user is a super owner first
    const superOwner = await userService.findSuperOwnerById(id);
    if (superOwner) return; // Super owners have all permissions

    const user = await userService.findUserById(id);
    if (!user) {
      throw createError(401, "Invalid user");
    }

    // Role is already included and mapped in findUserById (using roles!role_id(*))
    const role = user.role;

    if (!role) {
      // If user designation includes "Owner", they get all permissions even without a role record
      if (user.designation?.toLowerCase().includes("owner")) {
        return;
      }
      throw createError(401, "Invalid role");
    }

    const { permissions } = role;
    if (!permissions) {
      throw createError(401, "No permissions defined for role");
    }

    // Check if the permission key exists and is true
    if (permissions[permission] !== true) {
      console.log(`❌ Permission "${permission}" not granted. Permissions:`, JSON.stringify(permissions));
      throw createError(403, "You are not authorized to perform this action");
    }
    console.log(`✅ Permission "${permission}" granted.`);
  },

  getUsersFromTags: (text) => {
    let displayText = _.clone(text);
    const tags = text.match(/@\{\{[^\}]+\}\}/gi) || [];
    const allUserIds = tags.map((myTag) => {
      const tagData = myTag.slice(3, -2);
      const tagDataArray = tagData.split("||");
      return { _id: tagDataArray[1], name: tagDataArray[2] };
    });
    return _.uniqBy(allUserIds, (myUser) => myUser._id);
  },
};
