const createError = require("http-errors");
const { checkPermission } = require("../helpers/role_helper");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // create content
  create: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_actionPlans");

      const { name, plan, category } = req.body;

      const { data: content, error } = await supabase
        .from('contents')
        .insert({ name, plan_id: plan, category_id: category })
        .select()
        .single();

      if (error) throw error;

      // Update plan
      const { data: planData } = await supabase.from('plans').select('*').eq('id', plan).single();
      if (planData) {
        const contents = planData.content || [];
        contents.push(content.id);
        await supabase.from('plans').update({ content: contents }).eq('id', plan);
      }

      // Update category
      const { data: categoryData } = await supabase.from('categories').select('*').eq('id', category).single();
      if (categoryData) {
        const contents = categoryData.content || [];
        contents.push(content.id);
        await supabase.from('categories').update({ content: contents }).eq('id', category);
      }

      return res.status(200).json({
        message: "Content created successfully",
        content,
      });
    } catch (error) {
      next(error);
    }
  },

  // read content
  read: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data: content, error } = await supabase
        .from('contents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: "Content fetched successfully",
        content,
      });
    } catch (error) {
      next(error);
    }
  },

  // update content
  update: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_actionPlans");

      const { id } = req.params;
      const { name, data, isOpened } = req.body;

      let reqData = { name, data };
      if (isOpened !== null && isOpened !== undefined) {
        reqData.is_opened = isOpened;
      }

      const { data: content, error } = await supabase
        .from('contents')
        .update(reqData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: "Content updated successfully",
        content,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete content
  delete: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_actionPlans");

      const { id } = req.params;

      const { data: content, error: fetchError } = await supabase.from('contents').select('*').eq('id', id).single();
      if (fetchError || !content) throw createError(404, "Content not found");

      // Delete content from plan
      const { data: plan } = await supabase.from('plans').select('*').eq('id', content.plan_id).single();
      if (plan) {
        const contents = (plan.content || []).filter(c => c !== id);
        await supabase.from('plans').update({ content: contents }).eq('id', content.plan_id);
      }

      // Delete content from category
      const { data: category } = await supabase.from('categories').select('*').eq('id', content.category_id).single();
      if (category) {
        const contents = (category.content || []).filter(c => c !== id);
        await supabase.from('categories').update({ content: contents }).eq('id', content.category_id);
      }

      const { error } = await supabase.from('contents').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({
        message: "Content deleted successfully",
        content,
      });
    } catch (error) {
      next(error);
    }
  },

  // mark
  markChecked: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { checked } = req.body;

      const { data: content, error } = await supabase
        .from('contents')
        .update({ checked })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: "Content updated successfully",
        content,
      });
    } catch (error) {
      next(error);
    }
  },
};
