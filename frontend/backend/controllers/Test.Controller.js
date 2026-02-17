const userService = require("../services/userService");
const createError = require("http-errors");
const { checkPermission, getUsersFromTags } = require("../helpers/role_helper");
const io = require("../app");
const supabase = require('../config/supabaseClient');

module.exports = {
  // read tests
  readTests: async (req, res, next) => {
    try {
      const { data: tests, error } = await supabase
        .from('tests')
        .select('*, created_by_user:users!created_by(*), assigned_to_user:users!test_assignments(*), goal:goals(id, name)')
        .eq('goal_id', req.params.id);

      if (error) throw error;

      res.status(200).json({
        message: "Tests retrieved successfully",
        tests: tests || [],
      });
    } catch (err) {
      next(err);
    }
  },

  // read single test
  readTest: async (req, res, next) => {
    try {
      const { data: test, error } = await supabase
        .from('tests')
        .select('*, created_by_user:users!created_by(*), assigned_to_user:users!test_assignments(*), goal:goals(*), idea:ideas(*)')
        .eq('id', req.params.id)
        .single();

      if (error || !test) throw createError(404, "Test not found");

      res.status(200).json({
        message: "Test retrieved successfully",
        test: test,
      });
    } catch (err) {
      next(err);
    }
  },

  // update status
  updateStatus: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_tests");

      const { data: test, error } = await supabase
        .from('tests')
        .update({ status: req.body.status })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      // Create history entry
      await supabase.from('history').insert({
        item_id: test.id,
        item_type: 'test',
        item_name: test.name,
        action: 'status_updated',
        performed_by: req.payload.aud,
        project_id: test.project_id,
        goal_id: test.goal_id,
        action_date: new Date(),
        snapshot: test,
      });

      res.status(200).json({
        message: "Test status updated successfully",
        test: test,
      });
    } catch (err) {
      next(err);
    }
  },

  // update idea (link test to different idea)
  updateIdea: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_tests");

      const { data: test, error } = await supabase
        .from('tests')
        .update({ idea_id: req.body.ideaId })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Test idea updated successfully",
        test: test,
      });
    } catch (err) {
      next(err);
    }
  },

  // edit test
  editTest: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_tests");

      const { data: test, error } = await supabase
        .from('tests')
        .update({
          name: req.body.name,
          description: req.body.description,
          due_date: req.body.dueDate,
          tasks: req.body.tasks,
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      // Handle assignments separately if provided
      if (req.body.assignedTo) {
        // First delete existing assignments
        await supabase.from('test_assignments').delete().eq('test_id', test.id);

        // Then insert new one (assuming single assignment for now based on frontend)
        const userIds = Array.isArray(req.body.assignedTo) ? req.body.assignedTo : [req.body.assignedTo];
        if (userIds.length > 0) {
          const assignmentInserts = userIds.map(uid => ({ test_id: test.id, user_id: uid }));
          await supabase.from('test_assignments').insert(assignmentInserts);
        }
      }

      res.status(200).json({
        message: "Test updated successfully",
        test: test,
      });
    } catch (err) {
      next(err);
    }
  },

  // send test back to idea
  sendTestBack: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_tests");

      const { data: test, error } = await supabase.from('tests').select('*').eq('id', req.params.id).single();
      if (error || !test) throw createError(404, "Test not found");

      const user = await userService.findUserById(req.payload.aud);
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      // Create new idea from test
      const { data: idea, error: ideaError } = await supabase
        .from('ideas')
        .insert({
          name: test.name,
          description: test.description,
          goal_id: test.goal_id,
          project_id: test.project_id,
          impact: req.body.impact || 0,
          confidence: req.body.confidence || 0,
          ease: req.body.ease || 0,
          score: 0,
          owner_id: ownerId,
          created_by: req.payload.aud,
        })
        .select()
        .single();

      if (ideaError) throw ideaError;

      // Create history entry
      await supabase.from('history').insert({
        item_id: idea.id,
        item_type: 'idea',
        item_name: idea.name,
        action: 'sent_back_from_test',
        performed_by: req.payload.aud,
        project_id: test.project_id,
        goal_id: test.goal_id,
        action_date: new Date(),
        snapshot: idea,
        previous_item_id: test.id,
        previous_item_type: 'test',
        reason: req.body.reason,
      });

      // Delete test
      await supabase.from('tests').delete().eq('id', req.params.id);

      res.status(200).json({
        message: "Test sent back to idea successfully",
        idea: idea,
      });
    } catch (err) {
      next(err);
    }
  },

  // move to learning
  moveToLearning: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_learnings");

      const { data: test, error } = await supabase.from('tests').select('*').eq('id', req.params.id).single();
      if (error || !test) throw createError(404, "Test not found");

      const user = await userService.findUserById(req.payload.aud);
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      // Create learning from test
      const { data: learning, error: learningError } = await supabase
        .from('learnings')
        .insert({
          name: req.body.name || test.name,
          description: req.body.description || test.description,
          goal_id: test.goal_id,
          project_id: test.project_id,
          test_id: test.id,
          result: req.body.result,
          conclusion: req.body.conclusion,
          tasks: req.body.tasks || test.tasks,
          owner_id: ownerId,
          created_by: req.payload.aud,
        })
        .select()
        .single();

      if (learningError) throw learningError;

      // Create history entry
      await supabase.from('history').insert({
        item_id: learning.id,
        item_type: 'learning',
        item_name: learning.name,
        action: 'created',
        performed_by: req.payload.aud,
        project_id: test.project_id,
        goal_id: test.goal_id,
        action_date: new Date(),
        snapshot: learning,
        previous_item_id: test.id,
        previous_item_type: 'test',
      });

      res.status(201).json({
        message: "Learning created successfully",
        learning: learning,
      });
    } catch (err) {
      next(err);
    }
  },

  // add comment to test
  addComment: async (req, res, next) => {
    try {
      const { data: test, error } = await supabase.from('tests').select('*').eq('id', req.params.id).single();
      if (error || !test) throw createError(404, "Test not found");

      const user = await userService.findUserById(req.payload.aud);
      const { comment } = req.body;

      const newComment = {
        _id: new Date().getTime().toString(),
        comment,
        createdBy: req.payload.aud,
        createdAt: new Date(),
      };

      const comments = test.comments || [];
      comments.push(newComment);

      const { error: updateError } = await supabase.from('tests').update({ comments }).eq('id', req.params.id);
      if (updateError) throw updateError;

      res.status(200).json({
        message: "Comment added successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // delete comment from test
  deleteComment: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data: tests } = await supabase.from('tests').select('*').filter('comments', 'cs', `[{"_id": "${id}"}]`);
      const test = tests?.[0];
      if (!test) throw createError(404, "Comment not found");

      const comments = (test.comments || []).filter(c => c._id !== id);

      const { error } = await supabase.from('tests').update({ comments }).eq('id', test.id);
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

      const { data: tests } = await supabase.from('tests').select('*').filter('comments', 'cs', `[{"_id": "${id}"}]`);
      const test = tests?.[0];
      if (!test) throw createError(404, "Comment not found");

      const comments = test.comments || [];
      const commentToEdit = comments.find(c => c._id === id);
      if (commentToEdit) commentToEdit.comment = comment;

      const { error } = await supabase.from('tests').update({ comments }).eq('id', test.id);
      if (error) throw error;

      res.status(200).json({
        message: "Comment edited successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // update status of task in test
  updateTestStatus: async (req, res, next) => {
    try {
      const { data: test, error } = await supabase.from('tests').select('*').eq('id', req.params.id).single();
      if (error || !test) throw createError(404, "Test not found");

      const { taskId, status } = req.body;
      const tasks = test.tasks || [];
      const task = tasks.find(t => t._id === taskId || t.id === taskId);
      if (task) task.status = status;

      const { error: updateError } = await supabase.from('tests').update({ tasks }).eq('id', req.params.id);
      if (updateError) throw updateError;

      res.status(200).json({
        message: "Task status updated successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};
