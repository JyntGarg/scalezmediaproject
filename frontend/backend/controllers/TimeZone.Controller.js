const userService = require("../services/userService");
const createError = require("http-errors");
const { checkRole } = require("../helpers/role_helper");
const supabase = require('../config/supabaseClient');

module.exports = {
  // read timezone
  read: async (req, res, next) => {
    try {
      res.status(200).json({
        message: "Timezone retrieved successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // update timezone
  update: async (req, res, next) => {
    try {
      const role = await checkRole(req.payload.aud);
      if (role.name.toLowerCase() !== "owner") throw createError(401, "Unauthorized");

      const { data: timezone, error } = await supabase
        .from('timezones')
        .update({ name: req.body.name })
        .eq('owner_id', req.payload.aud)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Timezone updated successfully",
        timezone,
      });
    } catch (err) {
      next(err);
    }
  },
};
