import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as supabaseApi from "../../utils/supabaseApi";

const initialState = {
  actionPlans: [],
  selectedActionPlan: null,
  selectedCategory: null,
  selectedPointer: null,
  singlePointerInfo: null,
  extActionPlans: [],
};

// Docs
export const getAllActionPlans = createAsyncThunk(
  "actionPlan/getAllActionPlans",
  async (_, thunkAPI) => {
    try {
      const result = await supabaseApi.getPlans();
      if (result?.plans) thunkAPI.dispatch(updateActionPlans(result.plans));
    } catch (err) {
      console.error(err);
    }
  }
);

export const getExternalActionPlans = createAsyncThunk(
  "actionPlan/getExternalActionPlans",
  async (_, thunkAPI) => {
    try {
      const result = await supabaseApi.getExternalPlans();
      if (result?.plans) thunkAPI.dispatch(updateExternalActionPlans(result.plans));
    } catch (err) {
      console.error(err);
    }
  }
);

export const createActionPlan = createAsyncThunk(
  "actionPlan/createActionPlan",
  async (payload, thunkAPI) => {
    try {
      await supabaseApi.createPlan(payload.name);
      thunkAPI.dispatch(getAllActionPlans());
      payload.closeModal?.();
    } catch (err) {
      console.error(err);
    }
  }
);

export const editActionPlan = createAsyncThunk(
  "actionPlan/editActionPlan",
  async (payload, thunkAPI) => {
    try {
      const planId = thunkAPI.getState().actionPlan.selectedActionPlan?._id || thunkAPI.getState().actionPlan.selectedActionPlan?.id;
      if (!planId) return;
      await supabaseApi.updatePlan(planId, { name: payload.name, isOpened: null });
      payload.closeModal?.();
      thunkAPI.dispatch(getAllActionPlans());
      thunkAPI.dispatch(getExternalActionPlans());
    } catch (err) {
      console.error(err);
    }
  }
);

export const updateIsOpenedForDoc = createAsyncThunk(
  "actionPlan/updateIsOpenedForDoc",
  async (payload, thunkAPI) => {
    try {
      await supabaseApi.updatePlan(payload.actionPlanId, { name: payload.name, isOpened: payload.isOpened });
      payload.closeModal?.();
      thunkAPI.dispatch(getAllActionPlans());
      thunkAPI.dispatch(getExternalActionPlans());
    } catch (err) {
      console.error(err);
    }
  }
);

export const deleteActionPlan = createAsyncThunk(
  "actionPlan/deleteActionPlan",
  async (payload, thunkAPI) => {
    try {
      const planId = thunkAPI.getState().actionPlan.selectedActionPlan?._id || thunkAPI.getState().actionPlan.selectedActionPlan?.id;
      if (!planId) return;
      await supabaseApi.deletePlan(planId);
      thunkAPI.dispatch(getAllActionPlans());
      thunkAPI.dispatch(getExternalActionPlans());
      payload.closeModal?.();
    } catch (err) {
      console.error(err);
    }
  }
);

export const addUsersToActionPlan = createAsyncThunk(
  "actionPlan/addUsersToActionPlan",
  async (payload, thunkAPI) => {
    try {
      const planId = thunkAPI.getState().actionPlan.selectedActionPlan?._id || thunkAPI.getState().actionPlan.selectedActionPlan?.id;
      if (!planId) return;
      const userIds = (payload.users || []).map((u) => u._id || u.id);
      await supabaseApi.addUsersToPlan(planId, userIds, payload.copyTextAllowed);
      payload.closeModal?.();
      thunkAPI.dispatch(getAllActionPlans());
      thunkAPI.dispatch(getExternalActionPlans());
    } catch (err) {
      console.error(err);
    }
  }
);

export const markActionPlan = createAsyncThunk(
  "actionPlan/markActionPlan",
  async (payload, thunkAPI) => {
    try {
      await supabaseApi.markPlan(payload.actionPlanId, payload.checked);
      thunkAPI.dispatch(getAllActionPlans());
      thunkAPI.dispatch(getExternalActionPlans());
    } catch (err) {
      console.error(err);
    }
  }
);

// Category
export const createcategory = createAsyncThunk(
  "actionPlan/createcategory",
  async (payload, thunkAPI) => {
    try {
      const planId = thunkAPI.getState().actionPlan.selectedActionPlan?._id || thunkAPI.getState().actionPlan.selectedActionPlan?.id;
      if (!planId) return;
      await supabaseApi.createCategory(payload.name, planId);
      thunkAPI.dispatch(getAllActionPlans());
      payload.closeModal?.();
    } catch (err) {
      console.error(err);
    }
  }
);

export const editcategory = createAsyncThunk(
  "actionPlan/editcategory",
  async (payload, thunkAPI) => {
    try {
      const categoryId = thunkAPI.getState().actionPlan.selectedCategory?._id || thunkAPI.getState().actionPlan.selectedCategory?.id;
      if (!categoryId) return;
      await supabaseApi.updateCategory(categoryId, { name: payload.name, isOpened: null });
      payload.closeModal?.();
      thunkAPI.dispatch(getAllActionPlans());
    } catch (err) {
      console.error(err);
    }
  }
);

export const updateIsOpenedForCategory = createAsyncThunk(
  "actionPlan/updateIsOpenedForCategory",
  async (payload, thunkAPI) => {
    try {
      await supabaseApi.updateCategory(payload.categoryId, { name: payload.name, isOpened: payload.isOpened });
      payload.closeModal?.();
      thunkAPI.dispatch(getAllActionPlans());
    } catch (err) {
      console.error(err);
    }
  }
);

export const deletecategory = createAsyncThunk(
  "actionPlan/deletecategory",
  async (payload, thunkAPI) => {
    try {
      const categoryId = thunkAPI.getState().actionPlan.selectedCategory?._id || thunkAPI.getState().actionPlan.selectedCategory?.id;
      if (!categoryId) return;
      await supabaseApi.deleteCategory(categoryId);
      thunkAPI.dispatch(getAllActionPlans());
      payload.closeModal?.();
    } catch (err) {
      console.error(err);
    }
  }
);

export const markCategory = createAsyncThunk(
  "actionPlan/markCategory",
  async (payload, thunkAPI) => {
    try {
      await supabaseApi.markCategory(payload.categoryId, payload.checked);
      thunkAPI.dispatch(getAllActionPlans());
      thunkAPI.dispatch(getExternalActionPlans());
    } catch (err) {
      console.error(err);
    }
  }
);

// Pointer
export const readPointer = createAsyncThunk(
  "actionPlan/readPointer",
  async (payload, thunkAPI) => {
    try {
      const result = await supabaseApi.getContentById(payload.pointerId);
      thunkAPI.dispatch(updatesinglePointerInfo(result?.content ?? null));
      thunkAPI.dispatch(getAllActionPlans());
      payload.closeModal?.();
    } catch (err) {
      console.error(err);
    }
  }
);

export const createpointer = createAsyncThunk(
  "actionPlan/createpointer",
  async (payload, thunkAPI) => {
    try {
      const planId = thunkAPI.getState().actionPlan.selectedActionPlan?._id || thunkAPI.getState().actionPlan.selectedActionPlan?.id;
      const categoryId = thunkAPI.getState().actionPlan.selectedCategory?._id || thunkAPI.getState().actionPlan.selectedCategory?.id;
      if (!planId || !categoryId) return;
      await supabaseApi.createContent({ name: payload.name, plan: planId, category: categoryId });
      thunkAPI.dispatch(getAllActionPlans());
      payload.closeModal?.();
    } catch (err) {
      console.error(err);
    }
  }
);

export const editpointer = createAsyncThunk(
  "actionPlan/editpointer",
  async (payload, thunkAPI) => {
    try {
      await supabaseApi.updateContent(payload.pointerId, { name: payload.name, data: payload.data, isOpened: null });
      if (payload.navigate) payload.navigate("/action-plans");
      thunkAPI.dispatch(getAllActionPlans());
      payload.closeModal?.();
    } catch (err) {
      console.error(err);
    }
  }
);

export const updateIsOpenedForPointer = createAsyncThunk(
  "actionPlan/updateIsOpenedForPointer",
  async (payload, thunkAPI) => {
    try {
      await supabaseApi.updateContent(payload.pointerId, { name: payload.name, data: payload.data, isOpened: payload.isOpened });
      thunkAPI.dispatch(getAllActionPlans());
      payload.closeModal?.();
    } catch (err) {
      console.error(err);
    }
  }
);

export const deletepointer = createAsyncThunk(
  "actionPlan/deletepointer",
  async (payload, thunkAPI) => {
    try {
      const pointerId = thunkAPI.getState().actionPlan.selectedPointer?._id || thunkAPI.getState().actionPlan.selectedPointer?.id;
      if (!pointerId) return;
      await supabaseApi.deleteContent(pointerId);
      thunkAPI.dispatch(getAllActionPlans());
      payload.closeModal?.();
    } catch (err) {
      console.error(err);
    }
  }
);

export const markPointer = createAsyncThunk(
  "actionPlan/markPointer",
  async (payload, thunkAPI) => {
    try {
      await supabaseApi.markContent(payload.contentId, payload.checked);
      thunkAPI.dispatch(getAllActionPlans());
      thunkAPI.dispatch(getExternalActionPlans());
    } catch (err) {
      console.error(err);
    }
  }
);

export const actionPlanSlice = createSlice({
  name: "actionPlan",
  initialState,
  reducers: {
    updateActionPlans: (state, action) => {
      state.actionPlans = action.payload;
    },
    updateSelectedActionPlan: (state, action) => {
      state.selectedActionPlan = action.payload;
    },
    updateselectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    updateselectedPointer: (state, action) => {
      state.selectedPointer = action.payload;
    },
    updatesinglePointerInfo: (state, action) => {
      state.singlePointerInfo = action.payload;
    },
    updateExternalActionPlans: (state, action) => {
      state.extActionPlans = action.payload;
    },
  },
});

export const {
  updateActionPlans,
  updateSelectedActionPlan,
  updateselectedCategory,
  updateselectedPointer,
  updatesinglePointerInfo,
  updateExternalActionPlans,
} = actionPlanSlice.actions;

export const selectActionPlans = (state) => state.actionPlan.actionPlans;
export const selectSelectedActionPlan = (state) =>
  state.actionPlan.selectedActionPlan;
export const selectselectedCategory = (state) =>
  state.actionPlan.selectedCategory;
export const selectselectedPointer = (state) =>
  state.actionPlan.selectedPointer;
export const selectsinglePointerInfo = (state) =>
  state.actionPlan.singlePointerInfo;
export const selectExternalActionPlans = (state) =>
  state.actionPlan.extActionPlans;

export default actionPlanSlice.reducer;
