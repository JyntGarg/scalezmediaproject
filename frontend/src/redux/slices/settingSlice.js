import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { updateMe } from "./generalSlice";
import * as supabaseApi from "../../utils/supabaseApi";
// import { updatepopupMessage } from "./dashboardSlice";

const initialState = {
  keyMetrics: [],
  selectedKeymetric: null,

  timezone: null,

  allGrowthLevers: [],
  selectedGrowthLever: null,

  allUsers: [],
  allCollaborators: [],

  oneRole: [],

  selectedRole: null,
  allRoles: [],
  viewRole: false,
  newRoleDialogOpen: false,
  deleteRoleDialogOpen: false,
  newKeyMetricDialogOpen: false,
  newGrowthLeverDialogOpen: false,
  userLimit: 0,
  logo: null
};

// Roles
export const getAllRoles = createAsyncThunk("setting/getAllRoles", async (_, thunkAPI) => {
  try {
    const result = await supabaseApi.getRoles();
    if (result?.roles) thunkAPI.dispatch(updateallRoles(result.roles));
  } catch (err) {
    console.error(err);
  }
});

export const createRole = createAsyncThunk("setting/createRole", async (payload, thunkAPI) => {
  try {
    await supabaseApi.createRole(payload);
    thunkAPI.dispatch(getAllRoles());
    payload.closeDialog?.();
  } catch (err) {
    console.error(err);
  }
});

export const updateRole = createAsyncThunk("setting/updateRole", async (payload, thunkAPI) => {
  try {
    const roleId = thunkAPI.getState().setting.selectedRole?._id || thunkAPI.getState().setting.selectedRole?.id;
    if (!roleId) return;
    await supabaseApi.updateRole(roleId, payload);
    thunkAPI.dispatch(getAllRoles());
    payload.closeDialog?.();
  } catch (err) {
    console.error(err);
  }
});

export const deleteRole = createAsyncThunk("setting/deleteRole", async (payload, thunkAPI) => {
  try {
    const roleId = thunkAPI.getState().setting.selectedRole?._id || thunkAPI.getState().setting.selectedRole?.id;
    if (!roleId) return;
    await supabaseApi.deleteRole(roleId);
    thunkAPI.dispatch(getAllRoles());
    payload.closeDialog?.();
  } catch (err) {
    console.error(err);
  }
});

export const findRole = createAsyncThunk("setting/findRole", async (payload, thunkAPI) => {
  try {
    const roleId = thunkAPI.getState().setting.selectedRole?._id || thunkAPI.getState().setting.selectedRole?.id;
    if (!roleId) return;
    const result = await supabaseApi.findRoleUsers(roleId);
    if (result?.roleUser) thunkAPI.dispatch(findOneRole(result.roleUser));
  } catch (err) {
    console.error(err);
  }
});

// Growth Levers
export const getAllGrowthLevers = createAsyncThunk("setting/getAllGrowthLevers", async (_, thunkAPI) => {
  try {
    const data = await supabaseApi.getLevers();
    thunkAPI.dispatch(updateallGrowthLevers(Array.isArray(data) ? data : []));
  } catch (err) {
    console.error(err);
  }
});

export const createGrowthLever = createAsyncThunk("setting/createGrowthLever", async (payload, thunkAPI) => {
  try {
    await supabaseApi.createLever(payload);
    thunkAPI.dispatch(getAllGrowthLevers());
    payload.closeDialog?.();
  } catch (err) {
    console.error(err);
  }
});

export const updateGrowthLever = createAsyncThunk("setting/updateGrowthLever", async (payload, thunkAPI) => {
  try {
    const leverId = thunkAPI.getState().setting.selectedGrowthLever?._id || thunkAPI.getState().setting.selectedGrowthLever?.id;
    if (!leverId) return;
    await supabaseApi.updateLever(leverId, payload);
    thunkAPI.dispatch(getAllGrowthLevers());
    payload.closeDialog?.();
  } catch (err) {
    console.error(err);
  }
});

export const deleteGrowthLever = createAsyncThunk("setting/deleteGrowthLever", async (payload, thunkAPI) => {
  try {
    const leverId = thunkAPI.getState().setting.selectedGrowthLever?._id || thunkAPI.getState().setting.selectedGrowthLever?.id;
    if (!leverId) return;
    await supabaseApi.deleteLever(leverId);
    thunkAPI.dispatch(getAllGrowthLevers());
    payload.closeDialog?.();
  } catch (err) {
    console.error(err);
  }
});

// keyMetrics
export const getAllkeyMetrics = createAsyncThunk("setting/getAllkeyMetrics", async (_, thunkAPI) => {
  try {
    const result = await supabaseApi.getKeyMetrics();
    if (result?.keymetrics) thunkAPI.dispatch(updatekeyMetrics(result.keymetrics));
  } catch (err) {
    console.error(err);
  }
});

export const createkeyMetric = createAsyncThunk("setting/createkeyMetric", async (payload, thunkAPI) => {
  try {
    await supabaseApi.createKeyMetric({
      ...payload,
      metricTime: payload.metricTimePeriod,
      currencyType: payload.currencyType,
    });
    thunkAPI.dispatch(getAllkeyMetrics());
    payload.closeModal?.();
  } catch (err) {
    console.error(err);
  }
});

export const deletekeyMetric = createAsyncThunk("setting/deletekeyMetric", async (payload, thunkAPI) => {
  try {
    const id = thunkAPI.getState().setting.selectedKeymetric?._id || thunkAPI.getState().setting.selectedKeymetric?.id;
    if (!id) return;
    await supabaseApi.deleteKeyMetric(id);
    thunkAPI.dispatch(getAllkeyMetrics());
    payload.closeDialog?.();
  } catch (err) {
    console.error(err);
  }
});

// Timezone
export const readTimezone = createAsyncThunk("setting/readTimezone", async (_, thunkAPI) => {
  try {
    const result = await supabaseApi.getTimezone();
    thunkAPI.dispatch(updateTimezone(result.timezone));
  } catch (err) {
    console.error(err);
  }
});

export const updateTimezone = createAsyncThunk("setting/updateTimezone", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.updateTimezone(payload.timeZone);
    thunkAPI.dispatch(updateTimezone(result.timezone));
  } catch (err) {
    console.error(err);
  }
});

// Users
export const updateProfilePicture = createAsyncThunk("setting/updateProfilePicture", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.uploadAvatar(payload.file);
    if (result?.user) {
      localStorage.setItem("user", JSON.stringify(result.user));
      thunkAPI.dispatch(updateMe(result.user));
    }
  } catch (err) {
    console.error(err);
  }
});

export const deleteProfilePicture = createAsyncThunk("setting/deleteProfilePicture", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.deleteAvatar();
    if (result?.user) {
      localStorage.setItem("user", JSON.stringify(result.user));
      thunkAPI.dispatch(updateMe(result.user));
    }
  } catch (err) {
    console.error(err);
  }
});

export const updateProfile = createAsyncThunk("setting/updateProfile", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.updateProfile(payload);
    if (result?.user) {
      localStorage.setItem("user", JSON.stringify(result.user));
      thunkAPI.dispatch(updateMe(result.user));
    }
  } catch (err) {
    console.error(err);
  }
});

export const updatePassword = createAsyncThunk("setting/updatePassword", async (payload, thunkAPI) => {
  try {
    await supabaseApi.updatePassword(payload.newPassword);
    payload.closeDialog?.();
  } catch (err) {
    payload.setErrors?.({ afterSubmit: err.message });
  }
});

export const getAllUsers = createAsyncThunk("setting/getAllUsers", async (_, thunkAPI) => {
  try {
    const result = await supabaseApi.getManagementUsers();
    thunkAPI.dispatch(updateAllUsers(result.users || []));
    thunkAPI.dispatch(updateUserLimit(result.limit ?? (result.users?.length ?? 0)));
  } catch (err) {
    console.error(err);
  }
});

export const inviteUser = createAsyncThunk("setting/inviteUser", async (payload, thunkAPI) => {
  try {
    await supabaseApi.inviteUser(payload);
    thunkAPI.dispatch(getAllUsers());
    payload.closeDialog?.();
  } catch (err) {
    console.error(err);
  }
});

export const makeAdmin = createAsyncThunk("setting/makeAdmin", async (payload, thunkAPI) => {
  try {
    await supabaseApi.makeAdmin(payload.userId);
    thunkAPI.dispatch(getAllUsers());
  } catch (err) {
    console.error(err);
  }
});

export const makeUser = createAsyncThunk("setting/makeUser", async (payload, thunkAPI) => {
  try {
    await supabaseApi.makeUser(payload.userId);
    thunkAPI.dispatch(getAllUsers());
  } catch (err) {
    console.error(err);
  }
});

export const changeUserRole = createAsyncThunk("setting/changeUserRole", async (payload, thunkAPI) => {
  try {
    await supabaseApi.updateManagementUser(payload.userId, { role: payload.role });
    thunkAPI.dispatch(findRole({}));
    thunkAPI.dispatch(getAllUsers());
    payload.closeDialog?.();
    if (payload.reload === true) window.location.reload();
  } catch (err) {
    console.error(err);
  }
});

// Company
export const updateCompany = createAsyncThunk("setting/updateCompany", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.updateCompany(payload);
    if (result?.user) localStorage.setItem("user", JSON.stringify(result.user));
  } catch (err) {
    console.error(err);
  }
});

export const uploadFevicon = createAsyncThunk("setting/uploadFevicon", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.uploadFevicon(payload.file);
    if (result?.user) {
      localStorage.setItem("user", JSON.stringify(result.user));
      window.location.reload();
    }
  } catch (err) {
    console.error(err);
  }
});

export const uploadLogo = createAsyncThunk("setting/uploadLogo", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.uploadLogo(payload.file);
    if (result?.user) {
      localStorage.setItem("user", JSON.stringify(result.user));
      thunkAPI.dispatch(updateUserLogo(result.user.logo));
      window.location.reload();
    }
  } catch (err) {
    console.error(err);
  }
});

export const deleteFevicon = createAsyncThunk("setting/deleteFevicon", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.deleteFevicon();
    if (result?.user) {
      localStorage.setItem("user", JSON.stringify(result.user));
      window.location.reload();
    }
  } catch (err) {
    console.error(err);
  }
});

export const deleteLogo = createAsyncThunk("setting/deleteLogo", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.deleteLogo();
    if (result?.user) {
      localStorage.setItem("user", JSON.stringify(result.user));
      window.location.reload();
    }
  } catch (err) {
    console.error(err);
  }
});

// Notifications
export const updateNotifications = createAsyncThunk("setting/updateNotifications", async (payload, thunkAPI) => {
  try {
    await supabaseApi.updateNotificationSettings(payload);
  } catch (err) {
    console.error(err);
  }
});

// Collaborators
export const getAllCollaborators = createAsyncThunk("setting/getAllCollaborators", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.getCollaborators();
    thunkAPI.dispatch(updateAllCollaborators(result.users || []));
    payload.closeDialog?.();
  } catch (err) {
    console.error(err);
  }
});

export const settingSlice = createSlice({
  name: "setting",
  initialState,
  reducers: {
    updatekeyMetrics: (state, action) => {
      state.keyMetrics = action.payload;
    },
    updateselectedKeymetric: (state, action) => {
      state.selectedKeymetric = action.payload;
    },
    updateTimezone: (state, action) => {
      state.timezone = action.payload;
    },
    updateAllUsers: (state, action) => {
      state.allUsers = action.payload;
    },
    updateAllCollaborators: (state, action) => {
      state.allCollaborators = action.payload;
    },
    updateselectedRole: (state, action) => {
      state.selectedRole = action.payload;
    },
    updateallRoles: (state, action) => {
      state.allRoles = action.payload;
    },
    updateallGrowthLevers: (state, action) => {
      state.allGrowthLevers = action.payload;
    },
    updateselectedGrowthLever: (state, action) => {
      state.selectedGrowthLever = action.payload;
    },
    updateviewRole: (state, action) => {
      state.viewRole = action.payload;
    },
    updateNewRoleDialogOpen: (state, action) => {
      state.newRoleDialogOpen = action.payload;
    },
    updateDeleteRoleDialogOpen: (state, action) => {
      state.deleteRoleDialogOpen = action.payload;
    },
    updateNewKeyMetricDialogOpen: (state, action) => {
      state.newKeyMetricDialogOpen = action.payload;
    },
    updateNewGrowthLeverDialogOpen: (state, action) => {
      state.newGrowthLeverDialogOpen = action.payload;
    },
    findOneRole: (state, action) => {
      state.oneRole = action.payload;
    },
    updateUserLimit: (state, action) => {
      state.userLimit = action.payload;
    }, //newChange TBD
    updateUserLogo: (state, action) => {
      state.logo = action.payload;
    },
  },
});

export const {
  updateselectedGrowthLever,
  updateallGrowthLevers,
  updateallRoles,
  updatekeyMetrics,
  updateselectedKeymetric,
  updateAllUsers,
  updateAllCollaborators,
  updateselectedRole,
  updateviewRole,
  updateNewRoleDialogOpen,
  updateDeleteRoleDialogOpen,
  updateNewKeyMetricDialogOpen,
  updateNewGrowthLeverDialogOpen,
  findOneRole,
  updateUserLimit, //newChange TBD
  updateUserLogo
} = settingSlice.actions;

export const selectkeyMetrics = (state) => state.setting.keyMetrics;
export const selectselectedKeymetric = (state) => state.setting.selectedKeymetric;
export const selectTimezone = (state) => state.setting.timezone;
export const selectAllUsers = (state) => state.setting.allUsers;
export const selectAllCollaborators = (state) => state.setting.allCollaborators;
export const selectselectedRole = (state) => state.setting.selectedRole;
export const selectallRoles = (state) => state.setting.allRoles;
export const selectallGrowthLevers = (state) => state.setting.allGrowthLevers;
export const selectselectedGrowthLever = (state) => state.setting.selectedGrowthLever;
export const selectviewRole = (state) => state.setting.viewRole;
export const selectNewRoleDialogOpen = (state) => state.setting.newRoleDialogOpen;
export const selectDeleteRoleDialogOpen = (state) => state.setting.deleteRoleDialogOpen;
export const selectNewKeyMetricDialogOpen = (state) => state.setting.newKeyMetricDialogOpen;
export const selectNewGrowthLeverDialogOpen = (state) => state.setting.newGrowthLeverDialogOpen;
export const findARole = (state) => state.setting.oneRole;
export const selectUserLimit = (state) => state.setting.userLimit; //newChange TBD
export const selectUserLogo = (state) => state.setting.logo; //newChange TBD
export default settingSlice.reducer;
