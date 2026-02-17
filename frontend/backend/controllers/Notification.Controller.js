const userService = require("../services/userService");
const createError = require("http-errors");
const supabase = require('../config/supabaseClient');

module.exports = {
  // read notifications for a user
  readNotifications: async (req, res, next) => {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*, notification_audience!inner(*)')
        .eq('notification_audience.user_id', req.payload.aud)
        .eq('notification_audience.is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json(notifications || []);
    } catch (err) {
      next(err);
    }
  },

  // check notification as read
  markNotification: async (req, res, next) => {
    try {
      const { data: updatedNotification, error } = await supabase
        .from('notification_audience')
        .update({ is_read: true })
        .eq('notification_id', req.params.id)
        .eq('user_id', req.payload.aud)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(updatedNotification);
    } catch (err) {
      next(err);
    }
  },
};
