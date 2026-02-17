const userService = require("../services/userService");
const createError = require("http-errors");
const { checkPermission, getUsersFromTags } = require("../helpers/role_helper");
const io = require("../app");
const supabase = require('../config/supabaseClient');

module.exports = {
  // read all learnings
  readAll: async (req, res, next) => {
    try {
      const { data: learnings, error } = await supabase
        .from('learnings')
        .select('*, created_by_user:users!created_by(*), goal:goals(id, name)')
        .eq('goal_id', req.params.id);

      if (error) throw error;

      res.status(200).json({
        message: "Learnings retrieved successfully",
        learnings: learnings || [],
      });
    } catch (err) {
      next(err);
    }
  },

  // view learning
  readOne: async (req, res, next) => {
    try {
      const { data: learning, error } = await supabase
        .from('learnings')
        .select('*, created_by_user:users!created_by(*), goal:goals(*), test:tests(*)')
        .eq('id', req.params.id)
        .single();

      if (error || !learning) throw createError(404, "Learning not found");

      res.status(200).json({
        message: "Learning retrieved successfully",
        learning: learning,
      });
    } catch (err) {
      next(err);
    }
  },

  // update learning
  update: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_learnings");

      const { data: learning, error } = await supabase
        .from('learnings')
        .update({
          name: req.body.name,
          description: req.body.description,
          result: req.body.result,
          conclusion: req.body.conclusion,
          tasks: req.body.tasks,
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Learning updated successfully",
        learning: learning,
      });
    } catch (err) {
      next(err);
    }
  },

  updateLearningTask: async (req, res, next) => {
    try {
      const { data: learning, error } = await supabase.from('learnings').select('*').eq('id', req.params.id).single();
      if (error || !learning) throw createError(404, "Learning not found");

      const { taskId, status } = req.body;
      const tasks = learning.tasks || [];
      const task = tasks.find(t => t._id === taskId || t.id === taskId);
      if (task) task.status = status;

      const { error: updateError } = await supabase.from('learnings').update({ tasks }).eq('id', req.params.id);
      if (updateError) throw updateError;

      res.status(200).json({
        message: "Learning task updated successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // send back to test
  sendBack: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_tests");

      const { data: learning, error } = await supabase.from('learnings').select('*').eq('id', req.params.id).single();
      if (error || !learning) throw createError(404, "Learning not found");

      const user = await userService.findUserById(req.payload.aud);
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      // Create test from learning
      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
          name: learning.name,
          description: learning.description,
          goal_id: learning.goal_id,
          project_id: learning.project_id,
          assigned_to: req.body.assignedTo,
          due_date: req.body.dueDate,
          tasks: learning.tasks || [],
          status: 'Not Started',
          owner_id: ownerId,
          created_by: req.payload.aud,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Create history entry
      await supabase.from('history').insert({
        item_id: test.id,
        item_type: 'test',
        item_name: test.name,
        action: 'sent_back_from_learning',
        performed_by: req.payload.aud,
        project_id: learning.project_id,
        goal_id: learning.goal_id,
        action_date: new Date(),
        snapshot: test,
        previous_item_id: learning.id,
        previous_item_type: 'learning',
        reason: req.body.reason,
      });

      // Delete learning
      await supabase.from('learnings').delete().eq('id', req.params.id);

      res.status(200).json({
        message: "Learning sent back to test successfully",
        test: test,
      });
    } catch (err) {
      next(err);
    }
  },

  // add comment
  addComment: async (req, res, next) => {
    try {
      const { data: learning, error } = await supabase.from('learnings').select('*').eq('id', req.params.id).single();
      if (error || !learning) throw createError(404, "Learning not found");

      const user = await userService.findUserById(req.payload.aud);
      const { comment } = req.body;

      const newComment = {
        _id: new Date().getTime().toString(),
        comment,
        createdBy: req.payload.aud,
        createdAt: new Date(),
      };

      const comments = learning.comments || [];
      comments.push(newComment);

      const { error: updateError } = await supabase.from('learnings').update({ comments }).eq('id', req.params.id);
      if (updateError) throw updateError;

      res.status(200).json({
        message: "Comment added successfully",
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

      const { data: learnings } = await supabase.from('learnings').select('*');
      const learning = learnings?.find(l => l.comments?.some(c => c._id === id));
      if (!learning) throw createError(404, "Comment not found");

      const comments = learning.comments || [];
      const commentToEdit = comments.find(c => c._id === id);
      if (commentToEdit) commentToEdit.comment = comment;

      const { error } = await supabase.from('learnings').update({ comments }).eq('id', learning.id);
      if (error) throw error;

      res.status(200).json({
        message: "Comment edited successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // delete comment from test
  deleteComment: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data: learnings } = await supabase.from('learnings').select('*');
      const learning = learnings?.find(l => l.comments?.some(c => c._id === id));
      if (!learning) throw createError(404, "Comment not found");

      const comments = (learning.comments || []).filter(c => c._id !== id);

      const { error } = await supabase.from('learnings').update({ comments }).eq('id', learning.id);
      if (error) throw error;

      res.status(200).json({
        message: "Comment deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};
