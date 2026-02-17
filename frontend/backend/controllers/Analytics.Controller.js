const userService = require("../services/userService");
const createError = require("http-errors");
const moment = require("moment");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // read analytics
  read: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      if (!user) throw createError(404, "User not found");

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      // Get all projects for the owner
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('is_archived', false);

      // Get counts for each entity type
      const { count: goalsCount } = await supabase.from('goals').select('*', { count: 'exact', head: true }).eq('owner_id', ownerId);
      const { count: ideasCount } = await supabase.from('ideas').select('*', { count: 'exact', head: true }).eq('owner_id', ownerId);
      const { count: testsCount } = await supabase.from('tests').select('*', { count: 'exact', head: true }).eq('owner_id', ownerId);
      const { count: learningsCount } = await supabase.from('learnings').select('*', { count: 'exact', head: true }).eq('owner_id', ownerId);

      // Get recent activity
      const { data: recentIdeas } = await supabase
        .from('ideas')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: recentTests } = await supabase
        .from('tests')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: recentLearnings } = await supabase
        .from('learnings')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(10);

      res.status(200).json({
        projects: projects || [],
        counts: {
          goals: goalsCount || 0,
          ideas: ideasCount || 0,
          tests: testsCount || 0,
          learnings: learningsCount || 0,
        },
        recentActivity: {
          ideas: recentIdeas || [],
          tests: recentTests || [],
          learnings: recentLearnings || [],
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // read admin analytics
  readAdminAnalytics: async (req, res, next) => {
    try {
      const { data: superOwner } = await supabase.from('super_owners').select('*').eq('id', req.payload.aud).single();
      if (!superOwner) throw createError(401, "Unauthorized");

      // Get all users
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
      const { count: goalsCount } = await supabase.from('goals').select('*', { count: 'exact', head: true });
      const { count: ideasCount } = await supabase.from('ideas').select('*', { count: 'exact', head: true });
      const { count: testsCount } = await supabase.from('tests').select('*', { count: 'exact', head: true });
      const { count: learningsCount } = await supabase.from('learnings').select('*', { count: 'exact', head: true });

      // Get recent users
      const { data: recentUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      res.status(200).json({
        counts: {
          users: usersCount || 0,
          projects: projectsCount || 0,
          goals: goalsCount || 0,
          ideas: ideasCount || 0,
          tests: testsCount || 0,
          learnings: learningsCount || 0,
        },
        recentUsers: recentUsers || [],
      });
    } catch (err) {
      next(err);
    }
  },
};
