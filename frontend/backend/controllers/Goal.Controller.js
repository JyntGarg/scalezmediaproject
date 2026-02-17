const userService = require("../services/userService");
const createError = require("http-errors");
const { checkPermission, getUsersFromTags } = require("../helpers/role_helper");

const io = require("../app");
const supabase = require('../config/supabaseClient');

module.exports = {
  // create goal
  create: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      await checkPermission(req.payload.aud, "create_goals");

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: goal, error } = await supabase
        .from('goals')
        .insert({
          name: req.body.name,
          description: req.body.description,
          start_date: req.body.startDate || null,
          end_date: req.body.endDate || null,
          project_id: req.body.projectId || req.body.project,
          keymetric: req.body.keymetric || [],
          confidence: req.body.confidence,
          owner_id: ownerId,
          created_by: req.payload.aud,
        })
        .select()
        .single();

      if (error) throw error;

      if (req.body.members && req.body.members.length > 0) {
        const memberInserts = req.body.members.map(userId => ({
          goal_id: goal.id,
          user_id: userId
        }));
        await supabase.from('goal_members').insert(memberInserts);
      }

      if (error) throw error;

      // Fetch goal with members populated
      const { data: goalWithMembers, error: membersError } = await supabase
        .from('goals')
        .select('*, members:users!goal_members(*)')
        .eq('id', goal.id)
        .single();

      res.status(201).json({
        message: "Goal created successfully",
        users: goalWithMembers?.members || [],
        goal: goal.id,
      });
    } catch (err) {
      next(err);
    }
  },

  createMultipleGoals: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      await checkPermission(req.payload.aud, "create_goals");

      const goals = req.body;
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const newGoals = goals.map((goal) => ({
        name: goal.name,
        description: goal.description,
        start_date: goal.startDate || null,
        end_date: goal.endDate || null,
        members: goal.members || [],
        project_id: goal.projectId,
        keymetric: goal.keymetric || [],
        confidence: goal.confidence,
        owner_id: ownerId,
        created_by: req.payload.aud,
      }));

      const { data: createdGoals, error } = await supabase
        .from('goals')
        .insert(newGoals)
        .select();

      if (error) throw error;

      res.status(201).json({
        message: "Goals created successfully",
        goal: createdGoals,
      });
    } catch (err) {
      next(err);
    }
  },

  // request ideas from team
  requestIdeas: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);

      const { data: goal, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error || !goal) throw createError(404, "Goal not found");

      const { members, message } = req.body;

      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          audience: members,
          message: `${user.firstName} has requested ideas for a goal in ${goal.name}`,
          project_id: goal.project_id,
          type: "Assigned",
          user_id: req.payload.aud,
        })
        .select('*, user:users!user_id(*)')
        .single();

      if (!notifError && notification && io && typeof io.emit === 'function') {
        io.emit("notification", notification);
      }

      res.status(200).json({
        message: "Ideas requested successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // get all goals
  read: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      const projectId = req.params.id;

      let query = supabase
        .from('goals')
        .select('*, members:users!goal_members(*), owner:users!owner_id(*), created_by_user:users!created_by(*)')
        .eq('project_id', projectId);

      if (user.type === "user") {
        // Filter by members using junction table
        query = query.select('*, members:users!goal_members!inner(*), owner:users!owner_id(*), created_by_user:users!created_by(*)')
          .eq('goal_members.user_id', req.payload.aud);
      }

      const { data: goals, error } = await query;
      if (error) throw error;

      // Calculate number of ideas, tests, learnings per goal
      const goalsWithCounts = await Promise.all(
        goals.map(async (goal) => {
          const { count: ideasCount } = await supabase.from('ideas').select('*', { count: 'exact', head: true }).eq('goal_id', goal.id);
          const { count: testsCount } = await supabase.from('tests').select('*', { count: 'exact', head: true }).eq('goal_id', goal.id);
          const { count: learningsCount } = await supabase.from('learnings').select('*', { count: 'exact', head: true }).eq('goal_id', goal.id);

          return {
            ...goal,
            id: goal.id,
            _id: goal.id,
            startDate: goal.start_date,
            endDate: goal.end_date,
            ideas: ideasCount || 0,
            tests: testsCount || 0,
            learnings: learningsCount || 0,
            totalItems: (ideasCount || 0) + (testsCount || 0) + (learningsCount || 0)
          };
        })
      );

      res.status(200).json({
        message: "Goals retrieved successfully",
        goals: goalsWithCounts,
      });
    } catch (err) {
      next(err);
    }
  },

  readAllGoals: async (req, res, next) => {
    try {
      const goalIds = req.body.projectId.map((g) => g._id);

      const { data: goals, error } = await supabase
        .from('goals')
        .select('*, members:users!goal_members(*), owner:users!owner_id(*), created_by_user:users!created_by(*)')
        .in('id', goalIds);

      if (error) throw error;

      const goalsWithIdeas = await Promise.all(
        goals.map(async (goal) => {
          const { count } = await supabase.from('ideas').select('*', { count: 'exact', head: true }).eq('goal_id', goal.id);
          return { ...goal, ideas: count || 0 };
        })
      );

      res.status(200).json({
        message: "Goals retrieved successfully",
        goals: goalsWithIdeas,
      });
    } catch (err) {
      next(err);
    }
  },

  // get goal by id
  readById: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      const goalId = req.params.id;

      if (!user.quickstart?.create_goal) {
        await userService.updateUser(req.payload.aud, {
          quickstart: { ...user.quickstart, create_goal: true }
        });
      }

      const { data: goal, error } = await supabase
        .from('goals')
        .select('*, members:users!goal_members(*), owner:users!owner_id(*), project:projects(*)')
        .eq('id', goalId)
        .single();

      if (error || !goal) throw createError(404, "Goal not found");

      // Check permissions
      if (user.role?.name !== "Owner") {
        const isInProjectTeam = goal.project?.team?.includes(req.payload.aud);
        const isGoalMember = goal.members?.some(m => m.id === req.payload.aud);

        if (!isInProjectTeam) throw createError(403, "You don't have access to this project");
        if (!isGoalMember) throw createError(403, "You don't have access to this goal");
      }

      // Fetch tests, ideas, learnings
      const { data: tests } = await supabase.from('tests').select('*, created_by_user:users!created_by(*), assigned_to_user:users!test_assignments(*)').eq('goal_id', goalId);
      const { data: ideas } = await supabase.from('ideas').select('*, created_by_user:users!created_by(*)').eq('goal_id', goalId);
      const { data: learnings } = await supabase.from('learnings').select('*, created_by_user:users!created_by(*)').eq('goal_id', goalId);

      const result = {
        ...goal,
        tests: tests || [],
        ideas: ideas || [],
        learnings: learnings || [],
      };

      return res.status(200).json({
        message: "Goal retrieved successfully",
        goal: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // update metric
  updateMetric: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_goals");

      const { goalId, goalName, projectName, keymetricId, keymetricName, value, date, userEmail, userId } = req.body;

      let goal;
      if (req.params.id) {
        const { data, error } = await supabase.from('goals').select('*, project:projects(*)').eq('id', req.params.id).single();
        if (error) throw error;
        goal = data;
      } else if (goalId) {
        const { data, error } = await supabase.from('goals').select('*, project:projects(*)').eq('id', goalId).single();
        if (error) throw error;
        goal = data;
      } else if (goalName && projectName) {
        const { data: project } = await supabase.from('projects').select('*').eq('name', projectName).single();
        if (!project) throw createError(404, `Project "${projectName}" not found`);

        const { data, error } = await supabase.from('goals').select('*, project:projects(*)').eq('name', goalName).eq('project_id', project.id).single();
        if (error) throw error;
        goal = data;
      } else {
        throw createError(400, "Either goalId or goalName + projectName is required");
      }

      if (!goal) throw createError(404, "Goal not found");

      // Determine user
      let updateUserId = req.payload.aud;
      if (userEmail) {
        const emailUser = await userService.findUserByEmail(userEmail.toLowerCase().trim());
        if (!emailUser) return res.status(404).json({ success: false, message: `User with email ${userEmail} not found` });
        updateUserId = emailUser.id;
      } else if (userId) {
        const idUser = await userService.findUserById(userId);
        if (!idUser) return res.status(404).json({ success: false, message: `User with ID ${userId} not found` });
        updateUserId = userId;
      }

      // Update keymetric in goal
      let keymetric = goal.keymetric || [];
      let metric = keymetricId
        ? keymetric.find(m => m._id === keymetricId)
        : keymetric.find(m => m.name?.toLowerCase().trim() === keymetricName?.toLowerCase().trim());

      if (!metric) throw createError(404, `Metric "${keymetricName || keymetricId}" not found in this goal`);

      if (!metric.metrics) metric.metrics = [];
      metric.metrics.push({
        date,
        value,
        updatedAt: new Date(),
        createdBy: updateUserId,
      });

      const { error: updateError } = await supabase
        .from('goals')
        .update({ keymetric })
        .eq('id', goal.id);

      if (updateError) throw updateError;

      res.status(200).json({
        message: "Metric updated successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // update keymetric status
  updateKeymetricStatus: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_goals");

      const { data: goal, error } = await supabase.from('goals').select('*').eq('id', req.params.id).single();
      if (error || !goal) throw createError(404, "Goal not found");

      const { keymetricId, status } = req.body;
      let keymetric = goal.keymetric || [];
      const metric = keymetric.find(m => m._id === keymetricId);
      if (metric) metric.status = status;

      const { error: updateError } = await supabase.from('goals').update({ keymetric }).eq('id', req.params.id);
      if (updateError) throw updateError;

      res.status(200).json({
        message: "Metric status updated successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // add comment
  addComment: async (req, res, next) => {
    try {
      const { data: goal, error } = await supabase.from('goals').select('*').eq('id', req.params.id).single();
      if (error || !goal) throw createError(404, "Goal not found");

      const user = await userService.findUserById(req.payload.aud);
      const { comment } = req.body;

      const newComment = {
        comment,
        createdBy: req.payload.aud,
        createdAt: new Date(),
      };

      const comments = goal.comments || [];
      comments.push(newComment);

      const { error: updateError } = await supabase.from('goals').update({ comments }).eq('id', req.params.id);
      if (updateError) throw updateError;

      res.status(200).json({
        message: "Comment added successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // delete comment
  deleteComment: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Find goal with this comment
      const { data: goals } = await supabase.from('goals').select('*').contains('comments', [{ _id: id }]);
      if (!goals || goals.length === 0) throw createError(404, "Comment not found");

      const goal = goals[0];
      const comments = (goal.comments || []).filter(c => c._id !== id);

      const { error } = await supabase.from('goals').update({ comments }).eq('id', goal.id);
      if (error) throw error;

      res.status(200).json({
        message: "Comment deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // edit comment
  editComment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;

      const { data: goals } = await supabase.from('goals').select('*').contains('comments', [{ _id: id }]);
      if (!goals || goals.length === 0) throw createError(404, "Comment not found");

      const goal = goals[0];
      const comments = goal.comments || [];
      const commentToEdit = comments.find(c => c._id === id);
      if (commentToEdit) commentToEdit.comment = comment;

      const { error } = await supabase.from('goals').update({ comments }).eq('id', goal.id);
      if (error) throw error;

      res.status(200).json({
        message: "Comment edited successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // update goal
  update: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_goals");

      const { data: goal, error } = await supabase
        .from('goals')
        .update({
          name: req.body.name,
          description: req.body.description,
          members: req.body.members,
          keymetric: req.body.keymetric,
          confidence: req.body.confidence,
          start_date: req.body.startDate,
          end_date: req.body.endDate,
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Goal updated successfully",
        goal: goal,
      });
    } catch (err) {
      next(err);
    }
  },

  // delete goal
  delete: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_goals");

      const { error } = await supabase.from('goals').delete().eq('id', req.params.id);
      if (error) throw error;

      res.status(200).json({
        message: "Goal deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // edit metric
  editMetric: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_goals");

      const { data: goal, error } = await supabase.from('goals').select('*').eq('id', req.params.id).single();
      if (error || !goal) throw createError(404, "Goal not found");

      const { keymetricId, name, shortName, metricType, targetValue, unit } = req.body;
      let keymetric = goal.keymetric || [];
      const metric = keymetric.find(m => m._id === keymetricId);

      if (metric) {
        if (name) metric.name = name;
        if (shortName) metric.shortName = shortName;
        if (metricType) metric.metricType = metricType;
        if (targetValue !== undefined) metric.targetValue = targetValue;
        if (unit) metric.unit = unit;
      }

      const { error: updateError } = await supabase.from('goals').update({ keymetric }).eq('id', req.params.id);
      if (updateError) throw updateError;

      res.status(200).json({
        message: "Metric edited successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // delete metric
  deleteMetric: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_goals");

      const { data: goal, error } = await supabase.from('goals').select('*').eq('id', req.params.id).single();
      if (error || !goal) throw createError(404, "Goal not found");

      const { keymetricId } = req.body;
      let keymetric = (goal.keymetric || []).filter(m => m._id !== keymetricId);

      const { error: updateError } = await supabase.from('goals').update({ keymetric }).eq('id', req.params.id);
      if (updateError) throw updateError;

      res.status(200).json({
        message: "Metric deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};
