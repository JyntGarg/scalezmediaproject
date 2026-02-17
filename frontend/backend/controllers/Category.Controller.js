const userService = require("../services/userService");
const createError = require("http-errors");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // create category
  create: async (req, res, next) => {
    try {
      const { name, plan } = req.body;

      // Find plan
      const { data: planFound, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', plan)
        .single();

      if (planError || !planFound) throw createError(404, "Plan not found");

      const { data: category, error } = await supabase
        .from('categories')
        .insert({ name, plan_id: plan })
        .select()
        .single();

      if (error) throw error;

      // Update plan categories array
      const categories = planFound.category || [];
      categories.push(category.id);
      await supabase.from('plans').update({ category: categories }).eq('id', plan);

      return res.status(200).json({
        message: "Category created successfully",
        category,
      });
    } catch (error) {
      next(error);
    }
  },

  // update category
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, isOpened } = req.body;

      let data = { name };
      if (isOpened !== null && isOpened !== undefined) {
        data.is_opened = isOpened;
      }

      const { data: category, error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: "Category updated successfully",
        category,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete category
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data: category, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !category) throw createError(404, "Category not found");

      // Delete contents
      await supabase.from('contents').delete().eq('category_id', id);

      // Remove category from plan
      const { data: plan } = await supabase.from('plans').select('*').eq('id', category.plan_id).single();
      if (plan) {
        const categories = (plan.category || []).filter(catId => catId !== id);
        await supabase.from('plans').update({ category: categories }).eq('id', category.plan_id);
      }

      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({
        message: "Category deleted successfully",
        category,
      });
    } catch (error) {
      next(error);
    }
  },

  // mark category
  markChecked: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { checked } = req.body;

      const { data: category, error } = await supabase
        .from('categories')
        .update({ checked })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: "Category updated successfully",
        category,
      });
    } catch (error) {
      next(error);
    }
  },
};
