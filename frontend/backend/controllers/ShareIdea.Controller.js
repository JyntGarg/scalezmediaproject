const createError = require("http-errors");
const supabase = require('../config/supabaseClient');

module.exports = {
  // read idea public
  readIdeaPublic: async (req, res, next) => {
    try {
      const { data: idea, error } = await supabase
        .from('ideas')
        .select('*, createdBy:users!created_by(*)')
        .eq('id', req.params.id)
        .single();

      if (error || !idea) throw createError(404, "Idea not found");

      res.json({
        message: "Idea found",
        idea,
      });
    } catch (error) {
      next(error);
    }
  },

  // read private idea
  readIdeaPrivate: async (req, res, next) => {
    try {
      const { data: idea, error } = await supabase
        .from('ideas')
        .select('*, createdBy:users!created_by(*)')
        .eq('id', req.params.id)
        .single();

      if (error || !idea) throw createError(404, "Idea not found");

      res.json({
        message: "Idea found",
        idea,
      });
    } catch (error) {
      next(error);
    }
  },
};
