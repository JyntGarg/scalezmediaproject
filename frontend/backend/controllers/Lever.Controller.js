const userService = require("../services/userService");
const { checkPermission } = require("../helpers/role_helper");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // create lever
  create: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_workspace");
      const user = await userService.findUserById(req.payload.aud);

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: lever, error } = await supabase
        .from('levers')
        .insert({
          name: req.body.name,
          color: req.body.color,
          created_by: req.payload.aud,
          workspace_id: req.body.workspace,
          owner_id: ownerId,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Lever created successfully",
        data: lever,
      });
    } catch (err) {
      next(err);
    }
  },

  // read all levers
  readAll: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: levers, error } = await supabase
        .from('levers')
        .select('*, createdBy:users!created_by(*)')
        .eq('owner_id', ownerId);

      if (error) throw error;

      // Default levers
      let leversData = [
        { name: "Acquisition", color: "Blue", type: "default" },
        { name: "Activation", color: "Orange", type: "default" },
        { name: "Referral", color: "Green", type: "default" },
        { name: "Retention", color: "Red", type: "default" },
        { name: "Revenue", color: "Yellow", type: "default" },
      ];

      let data = [...leversData, ...(levers || [])];

      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },

  // update lever
  update: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_workspace");

      const { error } = await supabase
        .from('levers')
        .update({
          name: req.body.name,
          color: req.body.color,
          workspace_id: req.body.workspace,
        })
        .eq('id', req.params.id);

      if (error) throw error;

      res.status(200).json({
        message: "Lever updated successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // delete lever
  delete: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_workspace");

      const { error } = await supabase
        .from('levers')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;

      res.status(200).json({
        message: "Lever deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};
