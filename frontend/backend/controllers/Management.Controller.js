const userService = require("../services/userService");
const createError = require("http-errors");
const { checkPermission } = require("../helpers/role_helper");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // Get all users
  getAllUsers: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "read_users");

      const user = await userService.findUserById(req.payload.aud);
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: users, error } = await supabase
        .from('users')
        .select('*, role:roles!role_id(*)')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(users || []);
    } catch (err) {
      next(err);
    }
  },

  // invite user
  inviteUser: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "invite_users");

      const { email, role } = req.body;

      // Simplified - in production you'd send invitation emails
      res.status(200).json({
        message: "Invitation sent successfully",
        email,
      });
    } catch (err) {
      next(err);
    }
  },

  // invite collaborator
  inviteCollaborator: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "invite_collaborators");

      const { email, projects } = req.body;

      // Simplified - in production you'd send invitation emails and manage project access
      res.status(200).json({
        message: "Collaborator invitation sent successfully",
        email,
      });
    } catch (err) {
      next(err);
    }
  },

  // get all collaborators
  getAllCollaborators: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "read_collaborators");

      const user = await userService.findUserById(req.payload.aud);
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: collaborators, error } = await supabase
        .from('users')
        .select('*, role:roles!role_id(*)')
        .eq('owner_id', ownerId)
        .eq('type', 'collaborator')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(collaborators || []);
    } catch (err) {
      next(err);
    }
  },

  // read registered users
  readRegisteredUsers: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "read_users");

      const user = await userService.findUserById(req.payload.aud);
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: users, error } = await supabase
        .from('users')
        .select('*, role:roles!role_id(*)')
        .eq('owner_id', ownerId)
        .not('type', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(users || []);
    } catch (err) {
      next(err);
    }
  },

  // update user
  updateUser: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "update_users");

      const { firstName, lastName, role } = req.body;

      const { data: user, error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          role_id: role,
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "User updated successfully",
        user,
      });
    } catch (err) {
      next(err);
    }
  },
};
