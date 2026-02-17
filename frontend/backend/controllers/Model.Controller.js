const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // create
  create: async (req, res, next) => {
    try {
      const userId = req.payload.aud;
      const { name, values } = req.body;

      const { data: model, error } = await supabase
        .from('models')
        .insert({
          name,
          creator_id: userId,
          data: values,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: "Model created successfully",
        model,
      });
    } catch (error) {
      next(error);
    }
  },

  // read
  read: async (req, res, next) => {
    try {
      const userId = req.payload.aud;

      const { data: models, error } = await supabase
        .from('models')
        .select('*, creator:users!creator_id(*)')
        .eq('creator_id', userId);

      if (error) throw error;

      res.status(200).json({
        message: "Models fetched successfully",
        models: models || [],
      });
    } catch (error) {
      next(error);
    }
  },

  // read single model
  readSingle: async (req, res, next) => {
    try {
      const userId = req.payload.aud;
      const { id } = req.params;

      const { data: model, error } = await supabase
        .from('models')
        .select('*, creator:users!creator_id(*)')
        .eq('id', id)
        .eq('creator_id', userId)
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Model fetched successfully",
        model,
      });
    } catch (error) {
      next(error);
    }
  },

  // update model
  update: async (req, res, next) => {
    try {
      const userId = req.payload.aud;
      const { id } = req.params;
      const { name, values } = req.body;

      const { data: model, error } = await supabase
        .from('models')
        .update({ name, data: values })
        .eq('id', id)
        .eq('creator_id', userId)
        .select('*, creator:users!creator_id(*)')
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Model updated successfully",
        model,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete model
  delete: async (req, res, next) => {
    try {
      const userId = req.payload.aud;
      const { id } = req.params;

      const { data: model, error } = await supabase
        .from('models')
        .delete()
        .eq('id', id)
        .eq('creator_id', userId)
        .select('*, creator:users!creator_id(*)')
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Model deleted successfully",
        model,
      });
    } catch (error) {
      next(error);
    }
  },
};
