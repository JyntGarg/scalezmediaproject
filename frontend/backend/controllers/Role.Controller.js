const userService = require("../services/userService");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // create role
  createRole: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);

      const roleName = user.role?.name?.toLowerCase() || "";
      if (roleName !== "owner") {
        return res.status(401).json({
          message: "You are not authorized to create a role",
        });
      }

      const { name, permissions } = req.body;

      const { data: role, error } = await supabase
        .from('roles')
        .insert({
          name,
          permissions,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: "Role created successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // read roles
  readRoles: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);

      const ownerId = user.role?.name.toLowerCase() !== "owner"
        ? (user.owner?.id || user.owner)
        : user.id;

      const { data: roles, error } = await supabase
        .from('roles')
        .select('*')
        .eq('owner_id', ownerId);

      if (error) throw error;

      res.status(200).json({
        message: "Roles List",
        roles: roles || [],
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  findRole: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);

      const roleName = user.role?.name?.toLowerCase() || "";
      if (roleName !== "owner") {
        return res.status(401).json({
          message: "You are not authorized to delete roles",
        });
      }

      // Find users with this role
      const { data: roleUsers, error } = await supabase
        .from('users')
        .select('*, roles!role_id(*)')
        .eq('role_id', req.params.id);

      if (error) throw error;

      const mappedUsers = roleUsers.map(u => ({
        ...u,
        id: u.id,
        _id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        role: u.roles
      }));

      return res.status(200).json({
        message: "Get users according to roles",
        roleUser: mappedUsers
      });

    } catch (err) {
      console.log(err);
      next(err)
    }
  },

  // update role
  updateRole: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);

      const roleName = user.role?.name?.toLowerCase() || "";
      if (roleName !== "owner") {
        return res.status(401).json({
          message: "You are not authorized to update roles",
        });
      }

      const { name, permissions } = req.body;

      const { error } = await supabase
        .from('roles')
        .update({
          name,
          permissions,
        })
        .eq('id', req.params.id);

      if (error) throw error;

      res.status(200).json({
        message: "Role updated successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  // delete role
  deleteRole: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);

      const roleName = user.role?.name?.toLowerCase() || "";
      if (roleName !== "owner") {
        return res.status(401).json({
          message: "You are not authorized to delete roles",
        });
      }

      // Check if any users have this role
      const { data: roleUsers, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('role_id', req.params.id);

      if (checkError) throw checkError;

      if (roleUsers.length === 0) {
        const { error: deleteError } = await supabase
          .from('roles')
          .delete()
          .eq('id', req.params.id);

        if (deleteError) throw deleteError;

        res.status(200).json({
          message: "Role deleted successfully",
        });
      } else {
        res.status(400).json({
          message: "Cannot delete role with assigned users",
        });
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};
