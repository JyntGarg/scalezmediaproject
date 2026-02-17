const userService = require("../services/userService");
const createError = require("http-errors");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  readAllIntegrations: async (req, res, next) => {
    try {
      const { data: allIntegrations, error } = await supabase
        .from('integrations')
        .select('*, project:projects(*), goal:goals(*), keymetric:keymetrics(*), createdBy:users!created_by(*)')
        .eq('project_id', req.query.projectId);

      if (error) throw error;

      const data = await Promise.all(
        (allIntegrations || []).map(async (singleIntegration) => {
          const { data: goal } = await supabase
            .from('goals')
            .select('*, keymetrics:keymetrics(*)')
            .eq('id', singleIntegration.goal_id)
            .single();

          if (goal) {
            singleIntegration.aaa = (goal.keymetrics || []).find(k => k.id === singleIntegration.keymetric_id);
          }
          return singleIntegration;
        })
      );

      return res.status(200).json({ allIntegrations: data });
    } catch (err) {
      next(err);
    }
  },

  createIntegration: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);

      const { data: targetGoal } = await supabase
        .from('goals')
        .select('*, keymetrics:keymetrics(*)')
        .eq('id', req.body.goalId)
        .single();

      const targetKeyMetric = (targetGoal?.keymetrics || []).find(k => k.id === req.body.keymetricId);

      const { data: newIntegration, error } = await supabase
        .from('integrations')
        .insert({
          project_id: req.body.projectId,
          goal_id: req.body.goalId,
          keymetric_id: targetKeyMetric?.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ newIntegration });
    } catch (err) {
      next(err);
    }
  },

  deleteIntegration: async (req, res, next) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;

      return res.status(200).json();
    } catch (err) {
      next(err);
    }
  },
};
