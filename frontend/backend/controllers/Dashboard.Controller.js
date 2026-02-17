const userService = require("../services/userService");
const createError = require("http-errors");
const supabase = require('../config/supabaseClient');

module.exports = {
  // read all tasks assigned to user
  readAll: async (req, res, next) => {
    try {
      const userId = req.payload.aud;

      const { data: tests, error } = await supabase
        .from('tests')
        .select('*, project:projects(*), test_assignments!inner(user_id)')
        .eq('test_assignments.user_id', userId);

      if (error && error.code !== 'PGRST116') throw error; // Handle "no rows found" if it returns error

      let tasks = [];
      (tests || []).forEach(test => {
        tasks = tasks.concat(test.tasks || []);
      });

      const tasksAssigned = tasks.filter(task => task.status === false);
      const tasksCompleted = tasks.filter(task => task.status === true);

      res.status(200).json({
        message: "Tests fetched successfully",
        tasksAssigned,
        tasksCompleted,
      });
    } catch (err) {
      next(err);
    }
  },

  // read all goals assigned to user
  readKeymetrics: async (req, res, next) => {
    try {
      const userId = req.payload.aud;

      const { data: goals, error } = await supabase
        .from('goals')
        .select('*, goal_members!inner(user_id)')
        .eq('goal_members.user_id', userId);

      if (error && error.code !== 'PGRST116') throw error;

      let keymetrics = [];
      (goals || []).forEach(goal => {
        keymetrics = keymetrics.concat(goal.keymetric || []);
      });

      res.status(200).json({
        Checkins: keymetrics,
      });
    } catch (err) {
      next(err);
    }
  },

  // read all goals
  readGoals: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      if (!user) throw createError(404, "User not found");

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: goals, error } = await supabase
        .from('goals')
        .select('*, project:projects(*), members:users!goal_members(*)')
        .eq('owner_id', ownerId);

      if (error) throw error;

      const filteredGoals = (goals || []).filter(goal => goal.project?.is_archived === false);

      res.status(200).json({
        goals: filteredGoals,
      });
    } catch (err) {
      next(err);
    }
  },

  // read all tests assigned to user
  readAllTests: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      if (!user) throw createError(404, "User not found");

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: tests, error } = await supabase
        .from('tests')
        .select('*, project:projects(*), assigned_to_user:users!test_assignments(*)')
        .eq('owner_id', ownerId);

      if (error) throw error;

      const filteredTests = (tests || []).filter(test => test.project?.is_archived === false);

      res.status(200).json({
        message: "Tests fetched successfully",
        tests: filteredTests,
      });
    } catch (err) {
      next(err);
    }
  },

  // read ideas
  readAllIdeas: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      if (!user) throw createError(404, "User not found");

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: ideas, error } = await supabase
        .from('ideas')
        .select('*, project:projects(*), created_by_user:users!created_by(*)')
        .eq('owner_id', ownerId);

      if (error) throw error;

      const filteredIdeas = (ideas || []).filter(idea => idea.project?.is_archived === false);

      res.status(200).json({
        message: "Ideas fetched successfully",
        ideas: filteredIdeas,
      });
    } catch (err) {
      next(err);
    }
  },

  // read all learnings assigned to user
  readAllLearnings: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      if (!user) throw createError(404, "User not found");

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: learnings, error } = await supabase
        .from('learnings')
        .select('*, project:projects(*)')
        .eq('owner_id', ownerId);

      if (error) throw error;

      const filteredLearnings = (learnings || []).filter(learning => learning.project?.is_archived === false);

      res.status(200).json({
        message: "Learnings fetched successfully",
        learnings: filteredLearnings,
      });
    } catch (err) {
      next(err);
    }
  },

  // enable or disable widgets
  updateWidgets: async (req, res, next) => {
    try {
      const userId = req.payload.aud;

      await userService.updateUser(userId, {
        widgets: req.body.widgets
      });

      const user = await userService.findUserById(userId);

      res.status(200).json({
        message: "Widgets updated successfully",
        user,
      });
    } catch (err) {
      next(err);
    }
  },
};
