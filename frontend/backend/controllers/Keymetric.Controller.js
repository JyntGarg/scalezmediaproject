const userService = require("../services/userService");
const createError = require("http-errors");
const { checkPermission } = require("../helpers/role_helper");
const supabase = require('../config/supabaseClient');

module.exports = {
  // create keymetric
  create: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_workspace");
      const user = await userService.findUserById(req.payload.aud);

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: keymetric, error } = await supabase
        .from('keymetrics')
        .insert({
          name: req.body.name,
          short_name: req.body.shortName,
          description: req.body.description,
          metric_type: req.body.metricType,
          metric_time: req.body.metricTime,
          type: req.body.type,
          created_by: req.payload.aud,
          workspace_id: req.body.workspace,
          owner_id: ownerId,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: "Keymetric created successfully",
        keymetric: {
          id: keymetric.id,
          name: keymetric.name,
          shortName: keymetric.short_name,
          description: keymetric.description,
          metricType: keymetric.metric_type,
          metricTime: keymetric.metric_time,
          type: keymetric.type,
          createdBy: keymetric.created_by,
          workspace: req.body.workspace,
          owner: keymetric.owner_id,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // get all keymetrics
  read: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: keymetrics, error } = await supabase
        .from('keymetrics')
        .select('*, createdBy:users!created_by(*)')
        .eq('owner_id', ownerId);

      if (error) throw error;

      res.status(200).json({
        message: "Keymetrics retrieved successfully",
        keymetrics: keymetrics || [],
      });
    } catch (err) {
      next(err);
    }
  },

  // delete keymetric
  delete: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      const roleName = user.role?.name?.toLowerCase() || "";
      if (roleName !== "owner") {
        throw createError(401, "Unauthorized");
      }

      const { data: keymetric, error: fetchError } = await supabase
        .from('keymetrics')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (fetchError || !keymetric) throw createError(404, "Keymetric not found");

      const { error } = await supabase
        .from('keymetrics')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;

      res.status(200).json({
        message: "Keymetric deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};
