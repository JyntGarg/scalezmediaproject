const userService = require("../services/userService");
const createError = require("http-errors");
const { checkPermission } = require("../helpers/role_helper");

const io = require("../app");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

module.exports = {
  // create project
  create: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      await checkPermission(req.payload.aud, "create_project");

      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: req.body.name,
          description: req.body.description,
          owner_id: ownerId,
          created_by: req.payload.aud,
        })
        .select()
        .single();

      if (error) throw error;

      // Handle team members separately or via junction table if needed
      if (req.body.team && req.body.team.length > 0) {
        const teamInserts = req.body.team.map(userId => ({
          project_id: project.id,
          user_id: userId
        }));
        await supabase.from('project_teams').insert(teamInserts);
      }

      if (error) throw error;

      // Create notification
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          audience_id: ownerId,
          project_id: project.id,
          message: `${user.firstName} has created a new project ${project.name}`,
          type: "Created",
          user_id: req.payload.aud,
        })
        .select('*, user:users!user_id(id, first_name, last_name, email, avatar)')
        .single();

      if (!notifError && notification) {
        // Emit notification (wrapped in try-catch to prevent socket errors from breaking the API)
        try {
          if (io && typeof io.emit === 'function') {
            io.emit("notification", {
              ...notification,
              user: notification.user ? {
                id: notification.user.id,
                firstName: notification.user.first_name,
                lastName: notification.user.last_name,
                email: notification.user.email,
                avatar: notification.user.avatar
              } : null
            });
          }
        } catch (socketError) {
          console.error('Socket emit failed:', socketError);
        }
      }

      res.status(201).json({
        message: "Project created successfully",
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          owner: project.owner_id,
          team: project.team,
          createdBy: project.created_by,
        },
      });

    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  //create multiple projects 
  createMultipleProjects: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      await checkPermission(req.payload.aud, "create_project");

      const projects = req.body;
      const roleName = user.role?.name?.toLowerCase() || "";
      const ownerId = roleName === "owner" ? req.payload.aud : (user.owner?.id || user.owner || req.payload.aud);

      const newProjects = projects.map((proj) => ({
        name: proj.name,
        description: proj.description,
        owner_id: ownerId,
        team: proj.selectedTeamMembers || proj.team || [],
        created_by: req.payload.aud,
        data_type: proj.dataType
      }));

      const { data: createdProjects, error } = await supabase
        .from('projects')
        .insert(newProjects)
        .select();

      if (error) throw error;

      // Create notifications for each created project
      const notifications = createdProjects.map((project) => ({
        audience_id: project.owner_id,
        project_id: project.id,
        message: `${user.firstName} has created a new project ${project.name}`,
        type: "Created",
        user_id: req.payload.aud,
      }));

      const { data: createdNotifications, error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      // Emit notifications (wrapped in try-catch to prevent socket errors from breaking the API)
      if (!notifError && createdNotifications) {
        try {
          if (io && typeof io.emit === 'function') {
            createdNotifications.forEach(notification => {
              io.emit("notification", notification);
            });
          }
        } catch (socketError) {
          console.error('Socket emit failed:', socketError);
        }
      }

      res.status(201).json({
        message: "Projects created successfully",
        projects: createdProjects.map(p => ({
          ...p,
          owner: p.owner_id,
          createdBy: p.created_by,
          dataType: p.data_type
        }))
      });

    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // get all projects
  getAll: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      console.log("user --", user)

      const status = req.query.status || "All";
      const search = req.query.search || "";

      let query = supabase.from('projects').select(`
        *,
        team_members:users!project_teams(id, first_name, last_name, email, avatar),
        created_by_user:users!created_by(id, first_name, last_name, email, avatar)
      `);

      if (status !== "All") {
        query = query.eq('status', status);
      }
      if (search !== "") {
        query = query.ilike('name', `%${search}%`);
      }

      const roleName = user.role?.name?.toLowerCase() || "";
      if (roleName === "owner") {
        query = query.eq('owner_id', req.payload.aud);
      } else {
        const ownerId = user.owner?.id || user.owner;
        if (ownerId && ownerId !== "null") {
          query = query.eq('owner_id', ownerId);
        } else {
          // If no owner, default to their own projects
          query = query.eq('owner_id', req.payload.aud);
        }
        // Filter by team membership or created by user
        // Note: This requires a more complex query in Supabase
      }

      const { data: projects, error } = await query;
      if (error) throw error;

      // Calculate number of goals per project
      const projectsWithGoals = await Promise.all(
        projects.map(async (project) => {
          const { count, error: countError } = await supabase
            .from('goals')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          return {
            ...project,
            id: project.id,
            _id: project.id,
            owner: project.owner_id,
            createdBy: project.created_by,
            team: project.team_members ? project.team_members.map(tm => ({
              id: tm.id,
              firstName: tm.first_name,
              lastName: tm.last_name,
              email: tm.email,
              avatar: tm.avatar
            })) : [],
            goals: count || 0
          };
        })
      );

      res.status(200).json({
        message: "Projects retrieved successfully",
        projects: projectsWithGoals,
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // update status
  updateStatus: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_project");

      const { data: project, error } = await supabase
        .from('projects')
        .update({ status: req.body.status })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      if (!project) throw createError(404, "Project not found");

      res.status(200).json({
        message: "Project status updated successfully",
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          owner: project.owner_id,
          team: project.team,
          status: project.status,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // project delete
  delete: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "delete_project");

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;

      res.status(200).json({
        message: "Project deleted successfully",
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // project archive
  archive: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "delete_project");

      const { data: project, error } = await supabase
        .from('projects')
        .update({ is_archived: true })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      if (!project) throw createError(404, "Project not found");

      res.status(200).json({
        message: "Project archived successfully",
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          owner: project.owner_id,
          team: project.team,
          status: project.status,
          isArchived: project.is_archived,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // unarchive project
  unarchive: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "delete_project");

      const { data: project, error } = await supabase
        .from('projects')
        .update({ is_archived: false })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      if (!project) throw createError(404, "Project not found");

      res.status(200).json({
        message: "Project unarchived successfully",
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          owner: project.owner_id,
          team: project.team,
          status: project.status,
          isArchived: project.is_archived,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // read archived projects
  getArchived: async (req, res, next) => {
    try {
      const user = await userService.findUserById(req.payload.aud);
      await checkPermission(req.payload.aud, "delete_project");

      const search = req.query.search || "";

      let query = supabase
        .from('projects')
        .select(`
          *,
          team_members:users!project_teams(id, first_name, last_name, email),
          owner_user:users!owner_id(id, first_name, last_name, email)
        `)
        .eq('is_archived', true);

      if (search !== "") {
        query = query.ilike('name', `%${search}%`);
      }

      const roleName = user.role?.name?.toLowerCase() || "";
      if (roleName !== "owner") {
        query = query.eq('owner_id', user.owner?.id || user.owner);
      }

      const { data: projects, error } = await query;
      if (error) throw error;

      res.status(200).json({
        message: "Projects retrieved successfully",
        projects: projects.map(p => ({
          ...p,
          id: p.id,
          _id: p.id,
          owner: p.owner_user,
          team: p.team_members
        })),
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // update project
  update: async (req, res, next) => {
    try {
      await checkPermission(req.payload.aud, "create_project");

      const { data: project, error } = await supabase
        .from('projects')
        .update({
          name: req.body.name,
          description: req.body.description,
          team: req.body.team,
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      if (!project) throw createError(404, "Project not found");

      res.status(200).json({
        message: "Project updated successfully",
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          owner: project.owner_id,
          team: project.team,
          status: project.status,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // read project users
  getUsers: async (req, res, next) => {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select(`
          *,
          team_members:users!project_teams(*),
          owner_user:users!owner_id(*)
        `)
        .eq('id', req.params.id)
        .single();

      if (error) throw error;
      if (!project) throw createError(404, "Project not found");

      var users = [];
      if (project.owner_user) {
        users.push({
          ...project.owner_user,
          id: project.owner_user.id,
          firstName: project.owner_user.first_name,
          lastName: project.owner_user.last_name
        });
      }
      if (project.team_members) {
        users = users.concat(project.team_members.map(tm => ({
          ...tm,
          id: tm.id,
          firstName: tm.first_name,
          lastName: tm.last_name
        })));
      }

      res.status(200).json({
        message: "Project users retrieved successfully",
        users,
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // get collaborators
  getCollaborators: async (req, res, next) => {
    try {
      const { data: collaborators, error } = await supabase
        .from('users')
        .select('*, roles!role_id(*)')
        .eq('project_id', req.params.id)
        .eq('type', 'collaborator');

      if (error) throw error;

      res.status(200).json({
        message: "Collaborators retrieved successfully",
        collaborators: collaborators.map(c => ({
          ...c,
          id: c.id,
          firstName: c.first_name,
          lastName: c.last_name,
          role: c.roles
        })),
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // user delete
  deleteUserId: async (req, res, next) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;

      res.status(200).json({
        message: "User deleted successfully",
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // project delete multiple
  deleteMultipleProjects: async (req, res, next) => {
    try {
      const { projectIds } = req.body;

      const { error } = await supabase
        .from('projects')
        .delete()
        .in('id', projectIds);

      if (error) throw error;

      res.status(200).json({ message: 'Data deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get all project activities for calendar
  getProjectActivities: async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const activities = [];

      // Fetch Goals
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*, created_by_user:users!created_by(id, first_name, last_name, email), owner_user:users!owner_id(id, first_name, last_name, email)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (!goalsError && goals) {
        goals.forEach((goal) => {
          activities.push({
            id: goal.id,
            _id: goal.id,
            type: "goals",
            name: goal.name,
            description: goal.description,
            date: goal.created_at,
            createdBy: goal.created_by_user ? {
              id: goal.created_by_user.id,
              firstName: goal.created_by_user.first_name,
              lastName: goal.created_by_user.last_name,
              email: goal.created_by_user.email
            } : null,
            owner: goal.owner_user ? {
              id: goal.owner_user.id,
              firstName: goal.owner_user.first_name,
              lastName: goal.owner_user.last_name,
              email: goal.owner_user.email
            } : null,
            goalId: goal.id,
            goalName: goal.name,
            action: "created",
          });
        });
      }

      // Fetch Ideas
      const { data: ideas, error: ideasError } = await supabase
        .from('ideas')
        .select('*, created_by_user:users!created_by(id, first_name, last_name, email), owner_user:users!owner_id(id, first_name, last_name, email), goal:goals(id, name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (!ideasError && ideas) {
        ideas.forEach((idea) => {
          activities.push({
            id: idea.id,
            _id: idea.id,
            type: "ideas",
            name: idea.name,
            description: idea.description,
            date: idea.created_at,
            createdBy: idea.created_by_user ? {
              id: idea.created_by_user.id,
              firstName: idea.created_by_user.first_name,
              lastName: idea.created_by_user.last_name,
              email: idea.created_by_user.email
            } : null,
            owner: idea.owner_user ? {
              id: idea.owner_user.id,
              firstName: idea.owner_user.first_name,
              lastName: idea.owner_user.last_name,
              email: idea.owner_user.email
            } : null,
            goalId: idea.goal?.id,
            goalName: idea.goal?.name,
            score: idea.score,
            impact: idea.impact,
            confidence: idea.confidence,
            ease: idea.ease,
            nominations: idea.nominations,
            action: "created",
          });
        });
      }

      // Fetch Tests
      const { data: tests, error: testsError } = await supabase
        .from('tests')
        .select('*, created_by_user:users!created_by(id, first_name, last_name, email), owner_user:users!owner_id(id, first_name, last_name, email), assigned_to_user:users!test_assignments(id, first_name, last_name, email), goal:goals(id, name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (!testsError && tests) {
        tests.forEach((test) => {
          activities.push({
            id: test.id,
            _id: test.id,
            type: "tests",
            name: test.name,
            description: test.description,
            date: test.created_at,
            createdBy: test.created_by_user ? {
              id: test.created_by_user.id,
              firstName: test.created_by_user.first_name,
              lastName: test.created_by_user.last_name,
              email: test.created_by_user.email
            } : null,
            owner: test.owner_user ? {
              id: test.owner_user.id,
              firstName: test.owner_user.first_name,
              lastName: test.owner_user.last_name,
              email: test.owner_user.email
            } : null,
            goalId: test.goal?.id,
            goalName: test.goal?.name,
            status: test.status,
            assignedTo: test.assigned_to_user && test.assigned_to_user.length > 0 ? {
              id: test.assigned_to_user[0].id,
              firstName: test.assigned_to_user[0].first_name,
              lastName: test.assigned_to_user[0].last_name,
              email: test.assigned_to_user[0].email
            } : null,
            tasks: test.tasks,
            dueDate: test.due_date,
            action: "created",
          });
        });
      }

      // Fetch Learnings
      const { data: learnings, error: learningsError } = await supabase
        .from('learnings')
        .select('*, created_by_user:users!created_by(id, first_name, last_name, email), owner_user:users!owner_id(id, first_name, last_name, email), goal:goals(id, name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (!learningsError && learnings) {
        learnings.forEach((learning) => {
          activities.push({
            id: learning.id,
            _id: learning.id,
            type: "learnings",
            name: learning.name,
            description: learning.description,
            date: learning.created_at,
            createdBy: learning.created_by_user ? {
              id: learning.created_by_user.id,
              firstName: learning.created_by_user.first_name,
              lastName: learning.created_by_user.last_name,
              email: learning.created_by_user.email
            } : null,
            owner: learning.owner_user ? {
              id: learning.owner_user.id,
              firstName: learning.owner_user.first_name,
              lastName: learning.owner_user.last_name,
              email: learning.owner_user.email
            } : null,
            goalId: learning.goal?.id,
            goalName: learning.goal?.name,
            result: learning.result,
            conclusion: learning.conclusion,
            action: "created",
          });
        });
      }

      // Fetch North Star Metrics
      const { data: northStarMetrics, error: nsError } = await supabase
        .from('northstarmetrics')
        .select('*, created_by_user:users!created_by(id, first_name, last_name, email)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (!nsError && northStarMetrics) {
        northStarMetrics.forEach((metric) => {
          activities.push({
            type: "northStar",
            name: metric.name,
            description: metric.description,
            date: metric.created_at,
            createdBy: metric.created_by_user ? {
              id: metric.created_by_user.id,
              firstName: metric.created_by_user.first_name,
              lastName: metric.created_by_user.last_name,
              email: metric.created_by_user.email
            } : null,
            currentValue: metric.current_value,
            targetValue: metric.target_value,
            unit: metric.unit,
            action: "created",
          });

          // Each value update in history
          if (metric.value_history && metric.value_history.length > 0) {
            metric.value_history.forEach((history) => {
              activities.push({
                type: "northStarUpdate",
                name: `${metric.name} Updated`,
                description: `Metric value updated to ${history.value} ${metric.unit}`,
                date: history.date,
                createdBy: history.updated_by,
                currentValue: history.value,
                targetValue: metric.target_value,
                unit: metric.unit,
                metricName: metric.name,
                action: "updated",
              });
            });
          }
        });
      }

      // Fetch History entries
      const { data: historyEntries, error: historyError } = await supabase
        .from('history')
        .select('*, performed_by_user:users!performed_by(id, first_name, last_name, email)')
        .eq('project_id', projectId)
        .order('action_date', { ascending: true });

      if (!historyError && historyEntries) {
        console.log(`\n=== TOTAL HISTORY ENTRIES: ${historyEntries.length} ===`);

        // Create a map of all history entries by itemId for quick lookup
        const historyByItemId = new Map();
        historyEntries.forEach((h) => {
          const key = h.item_id;
          if (!historyByItemId.has(key)) {
            historyByItemId.set(key, []);
          }
          historyByItemId.get(key).push(h);
        });

        // Process ALL history entries and add them as activities
        console.log('\n=== PROCESSING ALL HISTORY ENTRIES ===');

        historyEntries.forEach((h) => {
          if (h.action === 'created') {
            console.log(`Processing: ${h.item_type} - ${h.item_name} - ${new Date(h.action_date).toLocaleString()}`);

            const activityType = h.item_type + 's';
            const currentHistories = historyByItemId.get(h.item_id) || [];
            const transitionEntry = currentHistories.find(entry =>
              entry.action.includes('moved_to') || entry.action.includes('sent_back')
            );

            const historyActivity = {
              id: `hist-${h.item_type}-${h.item_id}-${new Date(h.action_date).getTime()}`,
              _id: `hist-${h.item_type}-${h.item_id}-${new Date(h.action_date).getTime()}`,
              type: activityType,
              name: h.item_name,
              description: '',
              date: h.action_date,
              createdBy: h.performed_by_user ? {
                id: h.performed_by_user.id,
                firstName: h.performed_by_user.first_name,
                lastName: h.performed_by_user.last_name,
                email: h.performed_by_user.email
              } : null,
              owner: h.performed_by_user,
              goalId: h.goal_id,
              goalName: '',
              action: h.action,
              transitionAction: transitionEntry ? transitionEntry.action : null,
              hasTransition: !!transitionEntry,
              ...(h.snapshot || {}),
              historyEntry: {
                action: h.action,
                transitionAction: transitionEntry ? transitionEntry.action : null,
                actionDate: h.action_date,
                performedBy: h.performed_by_user,
                snapshot: h.snapshot,
                reason: h.reason,
                nextItemId: h.next_item_id,
                nextItemType: h.next_item_type,
                previousItemId: h.previous_item_id,
                previousItemType: h.previous_item_type,
              },
            };

            const itemIdStr = h.item_id;
            const existingIndex = activities.findIndex(a => {
              if (a._id) {
                const aIdStr = a._id.toString();
                if (aIdStr === itemIdStr || aIdStr.includes(itemIdStr)) return true;
              }
              if (a.id) {
                const aIdStr = a.id.toString();
                if (aIdStr === itemIdStr || aIdStr.includes(itemIdStr)) return true;
              }
              return false;
            });

            if (existingIndex === -1) {
              activities.push(historyActivity);
              console.log(`  ✓ Added from history: ${h.item_type} - ${h.item_name} (with snapshot data)`);
            } else {
              activities[existingIndex] = historyActivity;
              console.log(`  ✓ Replaced current DB item with history snapshot: ${h.item_type} - ${h.item_name}`);
            }
          }
        });

        // Attach history to activities
        const historyByItem = {};
        historyEntries.forEach((h) => {
          const dateKey = new Date(h.action_date).toDateString();
          const key = `${h.item_name}-${dateKey}`;
          if (!historyByItem[key]) {
            historyByItem[key] = [];
          }
          historyByItem[key].push(h);
        });

        activities.forEach((activity) => {
          const activityDate = new Date(activity.date);
          const dateKey = activityDate.toDateString();
          const key = `${activity.name}-${dateKey}`;

          const matchingHistory = historyByItem[key] || [];
          const sameDayHistory = historyEntries.filter((h) => {
            const historyDate = new Date(h.action_date);
            const sameDay = historyDate.toDateString() === dateKey;
            return (h.item_name === activity.name && sameDay) ||
              (activity.id && h.item_id && h.item_id === activity.id);
          });

          const allMatchingHistory = [...new Set([...matchingHistory, ...sameDayHistory].map(h => h.id))]
            .map(id => historyEntries.find(h => h.id === id))
            .filter(Boolean);

          if (allMatchingHistory.length > 0) {
            activity.history = allMatchingHistory.map((h) => ({
              action: h.action,
              actionDate: h.action_date,
              performedBy: h.performed_by_user,
              snapshot: h.snapshot,
              previousState: h.previous_state,
              reason: h.reason,
              nextItemId: h.next_item_id,
              nextItemType: h.next_item_type,
              previousItemId: h.previous_item_id,
              previousItemType: h.previous_item_type,
            }));
          }
        });
      }

      // Sort all activities by date
      activities.sort((a, b) => new Date(a.date) - new Date(b.date));

      res.status(200).json({
        message: "Activities fetched successfully",
        activities: activities,
        history: historyEntries || [],
      });
    } catch (error) {
      console.error("Error fetching project activities:", error);
      next(error);
    }
  }
};
