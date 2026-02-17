const userService = require("../services/userService");
const createError = require("http-errors");
const supabase = require('../config/supabaseClient');

module.exports = {
  getAllProjects: async (req, res) => {
    try {
      const userId = req.payload.aud;
      const user = await userService.findUserById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? userId : (user.owner?.id || user.owner || userId);

      const { data: projects, error } = await supabase
        .from('funnel_projects')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({ success: true, data: projects || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getSingleProject: async (req, res) => {
    try {
      const { id } = req.params;

      const { data: project, error } = await supabase
        .from('funnel_projects')
        .select('*, products:products(*), expenses:expenses(*), versions:versions(*)')
        .eq('id', id)
        .single();

      if (error || !project) throw createError(404, "Project not found");

      res.status(200).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createProject: async (req, res) => {
    try {
      const userId = req.payload.aud;
      const user = await userService.findUserById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? userId : (user.owner?.id || user.owner || userId);

      const { name, description, nodes, edges } = req.body;

      const { data: project, error } = await supabase
        .from('funnel_projects')
        .insert({
          name,
          description,
          nodes: nodes || [],
          edges: edges || [],
          owner_id: ownerId,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createBlueprintProject: async (req, res) => {
    try {
      const userId = req.payload.aud;
      const user = await userService.findUserById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? userId : (user.owner?.id || user.owner || userId);

      const { name, description, blueprint } = req.body;

      const { data: project, error } = await supabase
        .from('funnel_projects')
        .insert({
          name,
          description,
          blueprint,
          owner_id: ownerId,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateProject: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const { data: project, error } = await supabase
        .from('funnel_projects')
        .update({ name, description })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteProject: async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase.from('funnel_projects').delete().eq('id', id);
      if (error) throw error;

      res.status(200).json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateNodes: async (req, res) => {
    try {
      const { id } = req.params;
      const { nodes } = req.body;

      const { data: project, error } = await supabase
        .from('funnel_projects')
        .update({ nodes })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateEdges: async (req, res) => {
    try {
      const { id } = req.params;
      const { edges } = req.body;

      const { data: project, error } = await supabase
        .from('funnel_projects')
        .update({ edges })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  addExpense: async (req, res) => {
    try {
      const { projectId } = req.params;
      const { name, amount, category } = req.body;

      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          name,
          amount,
          category,
          project_id: projectId,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, amount, category } = req.body;

      const { data: expense, error } = await supabase
        .from('expenses')
        .update({ name, amount, category })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ success: true, data: expense });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteExpense: async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;

      res.status(200).json({ success: true, message: "Expense deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  addProducts: async (req, res) => {
    try {
      const { projectId } = req.params;
      const { name, price, description } = req.body;

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name,
          price,
          description,
          project_id: projectId,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, description } = req.body;

      const { data: product, error } = await supabase
        .from('products')
        .update({ name, price, description })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createScenario: async (req, res) => {
    try {
      const { projectId } = req.params;
      const { name, data } = req.body;

      const { data: scenario, error } = await supabase
        .from('scenarios')
        .insert({
          name,
          data,
          project_id: projectId,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data: scenario });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteScenario: async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase.from('scenarios').delete().eq('id', id);
      if (error) throw error;

      res.status(200).json({ success: true, message: "Scenario deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createVersion: async (req, res) => {
    try {
      const { projectId } = req.params;
      const { name, data } = req.body;

      const { data: version, error } = await supabase
        .from('versions')
        .insert({
          name,
          data,
          project_id: projectId,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data: version });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  useThisVersion: async (req, res) => {
    try {
      const { id } = req.params;

      const { data: version } = await supabase.from('versions').select('*').eq('id', id).single();
      if (!version) throw createError(404, "Version not found");

      const { data: project, error } = await supabase
        .from('funnel_projects')
        .update({ active_version_id: id })
        .eq('id', version.project_id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
