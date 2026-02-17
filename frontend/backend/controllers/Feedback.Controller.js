const createError = require("http-errors");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // create feedback
  create: async (req, res, next) => {
    try {
      const { data: feedback, error } = await supabase
        .from('feedbacks')
        .insert({
          category: req.body.category,
          description: req.body.description,
          title: req.body.title,
          user_id: req.payload.aud,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Feedback submitted, Our team will get in touch with you via email",
      });
    } catch (err) {
      next(err);
    }
  },

  // get all feedbacks
  getAll: async (req, res, next) => {
    try {
      const { data: superOwner, error: soError } = await supabase
        .from('super_owners')
        .select('*')
        .eq('id', req.payload.aud)
        .single();

      if (soError || !superOwner) throw createError(401, "Invalid token");

      const { data: feedbacks, error } = await supabase
        .from('feedbacks')
        .select('*, user:users(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(feedbacks || []);
    } catch (err) {
      next(err);
    }
  },

  // resolve feedback
  resolve: async (req, res, next) => {
    try {
      const { data: superOwner, error: soError } = await supabase
        .from('super_owners')
        .select('*')
        .eq('id', req.payload.aud)
        .single();

      if (soError || !superOwner) throw createError(401, "Invalid token");

      const { data: feedback, error: fetchError } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (fetchError || !feedback) throw createError(404, "Feedback not found");

      const { data: result, error } = await supabase
        .from('feedbacks')
        .update({ status: "resolved" })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
