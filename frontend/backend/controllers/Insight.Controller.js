const userService = require("../services/userService");
const createError = require("http-errors");
const moment = require("moment");
const supabase = require('../config/supabaseClient');

module.exports = {
  // get ideas and tests for a project by project id for specific time period
  getIdeasAndTests: async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { startDate, endDate } = req.query;

      let ideasQuery = supabase.from('ideas').select('*').eq('project_id', projectId);
      let testsQuery = supabase.from('tests').select('*').eq('project_id', projectId);

      if (startDate && endDate) {
        ideasQuery = ideasQuery.gte('created_at', startDate).lte('created_at', endDate);
        testsQuery = testsQuery.gte('created_at', startDate).lte('created_at', endDate);
      }

      const { data: ideas, error: ideasError } = await ideasQuery;
      const { data: tests, error: testsError } = await testsQuery;

      if (ideasError) throw ideasError;
      if (testsError) throw testsError;

      res.status(200).json({
        ideas: ideas || [],
        tests: tests || [],
      });
    } catch (err) {
      next(err);
    }
  },

  // get all learnings for a project
  getAllLearnings: async (req, res, next) => {
    try {
      const { projectId } = req.params;

      const { data: learnings, error } = await supabase
        .from('learnings')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(learnings || []);
    } catch (err) {
      next(err);
    }
  },

  // read learnings by growth lever
  getLearningsByGrowthLever: async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { lever } = req.query;

      let query = supabase.from('learnings').select('*').eq('project_id', projectId);

      if (lever) {
        query = query.eq('growth_lever', lever);
      }

      const { data: learnings, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(learnings || []);
    } catch (err) {
      next(err);
    }
  },

  // weekly team participation
  getTeamParticipation: async (req, res, next) => {
    try {
      const { projectId } = req.params;

      const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (!project) throw createError(404, "Project not found");

      // Get team members
      const teamIds = project.team || [];

      // Get activity counts for each team member
      const participation = await Promise.all(
        teamIds.map(async (userId) => {
          const { count: ideasCount } = await supabase.from('ideas').select('*', { count: 'exact', head: true }).eq('created_by', userId).eq('project_id', projectId);
          const { count: testsCount } = await supabase.from('tests').select('*', { count: 'exact', head: true }).eq('created_by', userId).eq('project_id', projectId);
          const { count: learningsCount } = await supabase.from('learnings').select('*', { count: 'exact', head: true }).eq('created_by', userId).eq('project_id', projectId);

          const { data: user } = await supabase.from('users').select('id, first_name, last_name, email').eq('id', userId).single();

          return {
            user,
            counts: {
              ideas: ideasCount || 0,
              tests: testsCount || 0,
              learnings: learningsCount || 0,
            },
          };
        })
      );

      res.status(200).json(participation);
    } catch (err) {
      next(err);
    }
  },

  // get Growth Health
  getGrowthHealth: async (req, res, next) => {
    try {
      const { projectId } = req.params;

      const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (!project) throw createError(404, "Project not found");

      // Get counts for different stages
      const { count: ideasCount } = await supabase.from('ideas').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
      const { count: testsCount } = await supabase.from('tests').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
      const { count: learningsCount } = await supabase.from('learnings').select('*', { count: 'exact', head: true }).eq('project_id', projectId);

      res.status(200).json({
        projectId,
        health: {
          ideas: ideasCount || 0,
          tests: testsCount || 0,
          learnings: learningsCount || 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // Get activity history - shows all movements between stages
  getActivityHistory: async (req, res, next) => {
    try {
      const { projectId } = req.params;

      const { data: history, error } = await supabase
        .from('history')
        .select('*, user:users!user_id(*)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      res.status(200).json(history || []);
    } catch (err) {
      next(err);
    }
  },
};
