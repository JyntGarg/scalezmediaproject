const userService = require("../services/userService");
const createError = require("http-errors");
const { checkPermission, getUsersFromTags } = require("../helpers/role_helper");

const io = require("../app");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // create idea
  createIdea: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      await checkPermission(req.payload.aud, "create_ideas");

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: idea, error } = await supabase
        .from('ideas')
        .insert({
          name: req.body.name,
          description: req.body.description,
          goal_id: req.body.goalId,
          project_id: req.body.projectId,
          impact: req.body.impact,
          confidence: req.body.confidence,
          ease: req.body.ease,
          score: req.body.score || 0,
          owner_id: ownerId,
          created_by: req.payload.aud,
        })
        .select()
        .single();

      if (error) throw error;

      // Create history entry
      await supabase.from('history').insert({
        item_id: idea.id,
        item_type: 'idea',
        item_name: idea.name,
        action: 'created',
        performed_by: req.payload.aud,
        project_id: req.body.projectId,
        goal_id: req.body.goalId,
        action_date: new Date(),
        snapshot: idea,
      });

      res.status(201).json({
        message: "Idea created successfully",
        idea: { ...idea, id: idea.id, _id: idea.id },
      });
    } catch (err) {
      next(err);
    }
  },

  createMultipleIdeas: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      await checkPermission(req.payload.aud, "create_ideas");

      const ideas = req.body;
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const newIdeas = ideas.map(idea => ({
        name: idea.name,
        description: idea.description,
        goal_id: idea.goalId,
        project_id: idea.projectId,
        impact: idea.impact,
        confidence: idea.confidence,
        ease: idea.ease,
        score: idea.score || 0,
        owner_id: ownerId,
        created_by: req.payload.aud,
      }));

      const { data: createdIdeas, error } = await supabase.from('ideas').insert(newIdeas).select();
      if (error) throw error;

      res.status(201).json({
        message: "Ideas created successfully",
        ideas: createdIdeas,
      });
    } catch (err) {
      next(err);
    }
  },

  // get all ideas
  getAllIdeas: async (req, res, next) => {
    try {
      const { data: ideas, error } = await supabase
        .from('ideas')
        .select('*, created_by_user:users!created_by(*), goal:goals(id, name)')
        .eq('goal_id', req.params.id);

      if (error) throw error;

      res.status(200).json({
        message: "Ideas retrieved successfully",
        ideas: ideas || [],
      });
    } catch (err) {
      next(err);
    }
  },

  getMultipleIdeas: async (req, res, next) => {
    try {
      const ideaIds = req.body.ideaIds;

      const { data: ideas, error } = await supabase
        .from('ideas')
        .select('*, created_by_user:users!created_by(*)')
        .in('id', ideaIds);

      if (error) throw error;

      res.status(200).json({
        message: "Ideas retrieved successfully",
        ideas: ideas || [],
      });
    } catch (err) {
      next(err);
    }
  },

  // nominate idea
  nominateIdea: async (req, res, next) => {
    try {
      const { data: idea, error } = await supabase.from('ideas').select('*').eq('id', req.params.id).single();
      if (error || !idea) throw createError(404, "Idea not found");

      await supabase.from('ideas_nominations').insert({
        idea_id: req.params.id,
        user_id: req.payload.aud
      });

      res.status(200).json({
        message: "Idea nominated successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // unnominate idea
  unnominateIdea: async (req, res, next) => {
    try {
      const { data: idea, error } = await supabase.from('ideas').select('*').eq('id', req.params.id).single();
      if (error || !idea) throw createError(404, "Idea not found");

      await supabase.from('ideas_nominations')
        .delete()
        .eq('idea_id', req.params.id)
        .eq('user_id', req.payload.aud);

      res.status(200).json({
        message: "Idea unnominated successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // test idea (move to test)
  testIdea: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_tests");

      const { data: idea, error } = await supabase.from('ideas').select('*').eq('id', req.params.id).single();
      if (error || !idea) throw createError(404, "Idea not found");

      const user = await userService.findUserById(req.payload.aud);
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      // Create test from idea
      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
          name: req.body.name || idea.name,
          description: req.body.description || idea.description,
          goal_id: idea.goal_id,
          project_id: idea.project_id,
          idea_id: idea.id,
          due_date: req.body.dueDate,
          tasks: req.body.tasks || [],
          status: 'Not Started',
          owner_id: ownerId,
          created_by: req.payload.aud,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Handle assignment
      if (req.body.assignedTo) {
        const userIds = Array.isArray(req.body.assignedTo) ? req.body.assignedTo : [req.body.assignedTo];
        if (userIds.length > 0) {
          const assignmentInserts = userIds.map(uid => ({ test_id: test.id, user_id: uid }));
          await supabase.from('test_assignments').insert(assignmentInserts);
        }
      }

      // Create history entry
      await supabase.from('history').insert({
        item_id: test.id,
        item_type: 'test',
        item_name: test.name,
        action: 'created',
        performed_by: req.payload.aud,
        project_id: idea.project_id,
        goal_id: idea.goal_id,
        action_date: new Date(),
        snapshot: test,
        previous_item_id: idea.id,
        previous_item_type: 'idea',
      });

      res.status(201).json({
        message: "Test created successfully",
        test: test,
      });
    } catch (err) {
      next(err);
    }
  },

  // read single idea
  readIdea: async (req, res, next) => {
    try {
      const { data: idea, error } = await supabase
        .from('ideas')
        .select('*, created_by_user:users!created_by(*), goal:goals(*), nominations_users:users!ideas_nominations(*)')
        .eq('id', req.params.id)
        .single();

      if (error || !idea) throw createError(404, "Idea not found");

      res.status(200).json({
        message: "Idea retrieved successfully",
        idea: idea,
      });
    } catch (err) {
      next(err);
    }
  },

  // add comment to idea
  addComment: async (req, res, next) => {
    try {
      const { data: idea, error } = await supabase.from('ideas').select('*').eq('id', req.params.id).single();
      if (error || !idea) throw createError(404, "Idea not found");

      const user = await userService.findUserById(req.payload.aud);
      const { comment } = req.body;

      const newComment = {
        _id: new Date().getTime().toString(),
        comment,
        createdBy: req.payload.aud,
        createdAt: new Date(),
      };

      const comments = idea.comments || [];
      comments.push(newComment);

      const { error: updateError } = await supabase.from('ideas').update({ comments }).eq('id', req.params.id);
      if (updateError) throw updateError;

      res.status(200).json({
        message: "Comment added successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // edit comment to idea
  editComment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;

      const { data: ideas } = await supabase.from('ideas').select('*').filter('comments', 'cs', `[{"_id": "${id}"}]`);
      const idea = ideas?.[0];
      if (!idea) throw createError(404, "Comment not found");

      const comments = idea.comments || [];
      const commentToEdit = comments.find(c => c._id === id);
      if (commentToEdit) commentToEdit.comment = comment;

      const { error } = await supabase.from('ideas').update({ comments }).eq('id', idea.id);
      if (error) throw error;

      res.status(200).json({
        message: "Comment edited successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // delete comment to idea
  deleteComment: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data: ideas } = await supabase.from('ideas').select('*').filter('comments', 'cs', `[{"_id": "${id}"}]`);
      const idea = ideas?.[0];
      if (!idea) throw createError(404, "Comment not found");

      const comments = (idea.comments || []).filter(c => c._id !== id);

      const { error } = await supabase.from('ideas').update({ comments }).eq('id', idea.id);
      if (error) throw error;

      res.status(200).json({
        message: "Comment deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // update idea
  updateIdea: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_ideas");

      const { data: idea, error } = await supabase
        .from('ideas')
        .update({
          name: req.body.name,
          description: req.body.description,
          impact: req.body.impact,
          confidence: req.body.confidence,
          ease: req.body.ease,
          score: req.body.score,
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Idea updated successfully",
        idea: idea,
      });
    } catch (err) {
      next(err);
    }
  },

  // delete idea
  deleteIdea: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_ideas");

      const { data: idea, error: fetchError } = await supabase.from('ideas').select('*').eq('id', req.params.id).single();
      if (fetchError || !idea) throw createError(404, "Idea not found");

      // Create history entry before deletion
      await supabase.from('history').insert({
        item_id: idea.id,
        item_type: 'idea',
        item_name: idea.name,
        action: 'deleted',
        performed_by: req.payload.aud,
        project_id: idea.project_id,
        goal_id: idea.goal_id,
        action_date: new Date(),
        snapshot: idea,
      });

      const { error } = await supabase.from('ideas').delete().eq('id', req.params.id);
      if (error) throw error;

      res.status(200).json({
        message: "Idea deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  // read all goals based ideas
  readAllGoalsBasedIdeas: async (req, res, next) => {
    try {
      const goalIds = req.body.goalIds;

      const { data: ideas, error } = await supabase
        .from('ideas')
        .select('*, created_by_user:users!created_by(*)')
        .in('goal_id', goalIds);

      if (error) throw error;

      res.status(200).json({
        message: "Ideas retrieved successfully",
        ideas: ideas || [],
      });
    } catch (err) {
      next(err);
    }
  },
};
