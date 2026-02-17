const userService = require("../services/userService");
const createError = require("http-errors");
const { checkRole } = require("../helpers/role_helper");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // create plan
  create: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      const { name } = req.body;

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: plan, error } = await supabase
        .from('plans')
        .insert({ name, owner_id: ownerId })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: "Plan created successfully",
        plan,
      });
    } catch (err) {
      return res.status(400).json({
        message: err.message,
      });
    }
  },

  // get all plans
  getAll: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: plans, error } = await supabase
        .from('plans')
        .select('*, categories:categories(*, contents:contents(*)), users:users!plan_users(*)')
        .eq('owner_id', ownerId);

      if (error) throw error;

      return res.status(200).json({
        message: "Plans fetched successfully",
        plans: plans || [],
      });
    } catch (error) {
      next(error);
    }
  },

  // update plan by id
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, isOpened } = req.body;

      let data = { name };
      if (isOpened !== null && isOpened !== undefined) {
        data.is_opened = isOpened;
      }

      const { data: plan, error } = await supabase
        .from('plans')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: "Plan updated successfully",
        plan,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete plan
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data: plan, error: fetchError } = await supabase.from('plans').select('*').eq('id', id).single();
      if (fetchError || !plan) throw createError(404, "Plan not found");

      // Delete categories and contents
      await supabase.from('contents').delete().in('category_id', plan.category || []);
      await supabase.from('categories').delete().in('id', plan.category || []);

      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({
        message: "Plan deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // add user to plan
  addUsers: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { users } = req.body;

      const { data: plan, error: fetchError } = await supabase.from('plans').select('*').eq('id', id).single();
      if (fetchError || !plan) throw createError(404, "Plan not found");

      const usersInPlan = plan.users || [];
      const usersToAdd = users.filter(user => !usersInPlan.includes(user));
      const updatedUsers = [...usersInPlan, ...usersToAdd];

      const { data: updatedPlan, error } = await supabase
        .from('plans')
        .update({ users: updatedUsers })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: "Users added successfully",
        plan: updatedPlan,
      });
    } catch (error) {
      next(error);
    }
  },

  // read users of a plan
  readUsers: async (req, res, next) => {
    try {
      const role = await checkRole(req.payload.aud);
      if (role.name.toLowerCase() !== "owner") throw createError(401, "You are not authorized");

      const { id } = req.params;

      const { data: plan, error } = await supabase
        .from('plans')
        .select('*, users:users!plan_users(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: "Users fetched successfully",
        users: plan.users || [],
      });
    } catch (error) {
      next(error);
    }
  },

  // delete user from plan
  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { user } = req.body;

      const { data: plan, error: fetchError } = await supabase.from('plans').select('*').eq('id', id).single();
      if (fetchError || !plan) throw createError(404, "Plan not found");

      if (!plan.users?.includes(user)) {
        return res.status(400).json({
          message: "User does not exist in plan",
        });
      }

      const updatedUsers = (plan.users || []).filter(u => u !== user);

      const { error } = await supabase.from('plans').update({ users: updatedUsers }).eq('id', id);
      if (error) throw error;

      return res.status(200).json({
        message: "User deleted from plan successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // create admin plan
  createAdminPlan: async (req, res, next) => {
    try {
      const { data: superOwner, error: soError } = await supabase
        .from('super_owners')
        .select('*')
        .eq('id', req.payload.aud)
        .single();

      if (soError || !superOwner) throw createError(401, "Unauthorized");

      const { name } = req.body;

      const { data: plan, error } = await supabase
        .from('plans')
        .insert({ name, owner_id: req.payload.aud, type: "external" })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: "Plan created successfully",
        plan,
      });
    } catch (err) {
      next(err);
    }
  },

  // read external plans
  readExternalPlans: async (req, res, next) => {
    try {
      const { data: plans, error } = await supabase
        .from('plans')
        .select('*, categories:categories(*, contents:contents(*))')
        .eq('type', 'external');

      if (error) throw error;

      return res.status(200).json({
        message: "Plans fetched successfully",
        plans: plans || [],
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

      const { data: plan, error } = await supabase
        .from('plans')
        .update({ checked })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: "Plan updated successfully",
        plan,
      });
    } catch (error) {
      next(error);
    }
  },
};
