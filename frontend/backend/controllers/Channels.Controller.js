const userService = require("../services/userService");
const createError = require("http-errors");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  createChannel: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      if (!req.body.name) throw createError(400, "name is required");

      const { data: channel, error } = await supabase
        .from('channels')
        .insert({
          name: req.body.name,
          description: req.body.description,
          threads: req.body.threads || [],
          created_by: req.payload.aud,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: "Channel created successfully",
        channel: {
          id: channel.id,
          name: channel.name,
          description: channel.description,
          threads: channel.threads,
          createdBy: channel.created_by,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  getAllChannels: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      if (!user) throw createError(401, "Invalid token");

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? user.id : (user.owner?.id || user.owner || user.id);

      // Get team members
      const { data: team } = await supabase.from('users').select('id').eq('owner_id', ownerId);
      const teamIds = (team || []).map(t => t.id);
      if (roleName !== "owner") {
        teamIds.push(ownerId);
      } else {
        teamIds.push(user.id);
      }

      const { data: channels, error } = await supabase
        .from('channels')
        .select('*, threads:threads(*)')
        .in('created_by', teamIds);

      if (error) throw error;

      res.status(200).json(channels || []);
    } catch (err) {
      next(err);
    }
  },

  getChannel: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      if (!user) throw createError(401, "Invalid token");

      const { data: channel, error } = await supabase
        .from('channels')
        .select('*, threads:threads(*)')
        .eq('id', req.params.id)
        .single();

      if (error) throw error;

      res.status(200).json(channel);
    } catch (err) {
      next(err);
    }
  },

  updateChannel: async (req, res, next) => {
    try {
      const { data: channel, error: fetchError } = await supabase.from('channels').select('*').eq('id', req.params.id).single();
      if (fetchError || !channel) throw createError(404, "Channel not found");

      const { data: newChannel, error } = await supabase
        .from('channels')
        .update({
          name: req.body.name,
          description: req.body.description,
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Channel updated successfully",
        channel: {
          id: newChannel.id,
          name: newChannel.name,
          description: newChannel.description,
          createdBy: newChannel.created_by,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  deleteChannel: async (req, res, next) => {
    try {
      const { data: channel, error: fetchError } = await supabase.from('channels').select('*').eq('id', req.params.id).single();
      if (fetchError || !channel) throw createError(404, "Channel not found");

      const { error } = await supabase.from('channels').delete().eq('id', req.params.id);
      if (error) throw error;

      res.status(200).json({ message: "Channel deleted successfully" });
    } catch (err) {
      next(err);
    }
  },
};
