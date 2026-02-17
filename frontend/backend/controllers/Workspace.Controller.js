const userService = require("../services/userService");
const createError = require("http-errors");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // create a new workspace
  create: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);

      const roleName = user.role?.name?.toLowerCase() || "";
      if (roleName !== "owner") {
        throw createError(403, "You are not authorized to create a workspace");
      }

      // Check if workspace already exists
      const { data: existingWorkspace, error: checkError } = await supabase
        .from('workspaces')
        .select('*')
        .or(`name.eq.${req.body.name},owner_id.eq.${req.payload.aud}`)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingWorkspace) {
        throw createError(403, "You already have a workspace");
      }

      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({
          name: req.body.name,
          owner_id: req.payload.aud,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: "Workspace created successfully",
        workspace: {
          id: workspace.id,
          name: workspace.name,
          owner: workspace.owner_id,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },
};
