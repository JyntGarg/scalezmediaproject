import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../../utils/axios";
import { supabase, getOwnerId } from "../../utils/supabaseClient";
import { updateMe } from "./generalSlice";

const initialState = {
  tasksAssigned: [],
  tasksCompleted: [],
  checkins: [],
  keymetricsData: [],
  learningsData: [],
  goalsData: [],
  testsData: [],
  ideasData: [],

  notifications: [],

  popupMessage: null,
};



// Widgets
export const updateWidgets = createAsyncThunk("dashboard/updateWidgets", async (payload, thunkAPI) => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return;

  const { data: user, error } = await supabase
    .from('users')
    .update({
      widgets: {
        activeGoals: payload.active_goals,
        recentIdeas: payload.recent_ideas,
        activeTests: payload.active_tests,
        keyMetrics: payload.key_metrics,
        recentLearnings: payload.recent_learnings,
        activity: payload.activity,
      }
    })
    .eq('id', authUser.id)
    .select('*, roles!role_id(*)')
    .single();

  if (!error && user) {
    // Map to legacy model
    const mappedUser = {
      ...user,
      role: user.roles ? { ...user.roles, _id: user.roles.id } : user.role_id,
      firstName: user.first_name,
      lastName: user.last_name,
    };
    localStorage.setItem("user", JSON.stringify(mappedUser));
    thunkAPI.dispatch(updateMe(mappedUser));
  }
});

// Dashboards
export const readTasks = createAsyncThunk("dashboard/readTasks", async (_, thunkAPI) => {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: tests, error } = await supabase
      .from('tests')
      .select('*, project:projects(*), test_assignments!inner(user_id)')
      .eq('test_assignments.user_id', authUser.id);

    if (error) throw error;

    let tasks = [];
    (tests || []).forEach(test => {
      tasks = tasks.concat(test.tasks || []);
    });

    const tasksAssigned = tasks.filter(task => task.status === false);
    const tasksCompleted = tasks.filter(task => task.status === true);

    thunkAPI.dispatch(updatetasksAssigned(tasksAssigned));
    thunkAPI.dispatch(updatetasksCompleted(tasksCompleted));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const readCheckins = createAsyncThunk("dashboard/readCheckins", async (_, thunkAPI) => {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: goals, error } = await supabase
      .from('goals')
      .select('*, goal_members!inner(user_id)')
      .eq('goal_members.user_id', authUser.id);

    if (error) throw error;

    let keymetrics = [];
    (goals || []).forEach(goal => {
      keymetrics = keymetrics.concat(goal.keymetric || []);
    });

    thunkAPI.dispatch(updatecheckins(keymetrics));
  } catch (error) {
    console.error("Error fetching checkins:", error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const readLearnings = createAsyncThunk("dashboard/readLearnings", async (_, thunkAPI) => {
  try {
    const ownerId = await getOwnerId();
    if (!ownerId) return;

    const { data: learnings, error } = await supabase
      .from('learnings')
      .select('*, project:projects(*)')
      .eq('owner_id', ownerId);

    if (error) throw error;

    const filteredLearnings = (learnings || []).filter(learning => learning.project?.is_archived === false);
    thunkAPI.dispatch(updatelearningsData(filteredLearnings));
  } catch (error) {
    console.error("Error fetching learnings:", error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const readIdeas = createAsyncThunk("dashboard/readIdeas", async (_, thunkAPI) => {
  try {
    const ownerId = await getOwnerId();
    if (!ownerId) return;

    const { data: ideas, error } = await supabase
      .from('ideas')
      .select('*, project:projects(*), created_by_user:users!created_by(*)')
      .eq('owner_id', ownerId);

    if (error) throw error;

    const filteredIdeas = (ideas || []).filter(idea => idea.project?.is_archived === false);
    thunkAPI.dispatch(updateideasData(filteredIdeas));
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const readGoals = createAsyncThunk("dashboard/readGoals", async (_, thunkAPI) => {
  try {
    const ownerId = await getOwnerId();
    if (!ownerId) return;

    const { data: goals, error } = await supabase
      .from('goals')
      .select('*, project:projects(*), members:users!goal_members(*)')
      .eq('owner_id', ownerId);

    if (error) throw error;

    const filteredGoals = (goals || []).filter(goal => goal.project?.is_archived === false);
    thunkAPI.dispatch(updategoalsData(filteredGoals));
  } catch (error) {
    console.error("Error fetching goals:", error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const readTests = createAsyncThunk("dashboard/readTests", async (_, thunkAPI) => {
  try {
    const ownerId = await getOwnerId();
    if (!ownerId) return;

    const { data: tests, error } = await supabase
      .from('tests')
      .select('*, project:projects(*), assigned_to_user:users!test_assignments(*)')
      .eq('owner_id', ownerId);

    if (error) throw error;

    const filteredTests = (tests || []).filter(test => test.project?.is_archived === false);
    thunkAPI.dispatch(updatetestsData(filteredTests));
  } catch (error) {
    console.error("Error fetching tests:", error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

// Notifications
export const readNotifications = createAsyncThunk("dashboard/readNotifications", async (_, thunkAPI) => {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*, sender:sender_id(*)')
      .eq('recipient_id', authUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    thunkAPI.dispatch(updatenotifications(data));
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
});

export const markRead = createAsyncThunk("dashboard/markRead", async (payload, thunkAPI) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', payload.notificationId);

    if (error) throw error;
    thunkAPI.dispatch(readNotifications());
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
});

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    updatetasksAssigned: (state, action) => {
      state.tasksAssigned = action.payload;
    },
    updatetasksCompleted: (state, action) => {
      state.tasksCompleted = action.payload;
    },
    updatecheckins: (state, action) => {
      state.checkins = action.payload;
    },
    updatenotifications: (state, action) => {
      state.notifications = action.payload;
    },
    appendNotification: (state, action) => {
      state.notifications = [action.payload, ...state.notifications];
    },

    updatekeymetricsData: (state, action) => {
      state.keymetricsData = action.payload;
    },
    updatelearningsData: (state, action) => {
      state.learningsData = action.payload;
    },
    updategoalsData: (state, action) => {
      state.goalsData = action.payload;
    },
    updatetestsData: (state, action) => {
      state.testsData = action.payload;
    },
    updateideasData: (state, action) => {
      state.ideasData = action.payload;
    },
    updatepopupMessage: (state, action) => {
      state.popupMessage = action.payload;
    },
  },
});

export const {
  updatetasksAssigned,
  updatetasksCompleted,
  updatecheckins,
  updatenotifications,
  appendNotification,
  updatekeymetricsData,
  updatelearningsData,
  updategoalsData,
  updatetestsData,
  updateideasData,
  updatepopupMessage,
} = dashboardSlice.actions;

export const selecttasksAssigned = (state) => state.dashboard.tasksAssigned;
export const selecttasksCompleted = (state) => state.dashboard.tasksCompleted;
export const selectcheckins = (state) => state.dashboard.checkins;
export const selectnotifications = (state) => state.dashboard.notifications;

export const selectkeymetricsData = (state) => state.dashboard.keymetricsData;
export const selectlearningsData = (state) => state.dashboard.learningsData;
export const selectgoalsData = (state) => state.dashboard.goalsData;
export const selecttestsData = (state) => state.dashboard.testsData;
export const selectideasData = (state) => state.dashboard.ideasData;
export const selectpopupMessage = (state) => state.dashboard.popupMessage;

export default dashboardSlice.reducer;
