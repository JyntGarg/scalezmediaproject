import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as supabaseApi from "../../utils/supabaseApi";

const initialState = {
  models: [],
  selectedModel: null,
  singleModelInfo: null,
  showDeleteModelDialog: false,
  showCreateModelDialog: false,
};

export const getAllModels = createAsyncThunk("model/getAllModels", async (_, thunkAPI) => {
  try {
    const result = await supabaseApi.getModels();
    if (result?.models) thunkAPI.dispatch(updateModels(result.models));
  } catch (err) {
    console.error(err);
  }
});

export const getSingleModel = createAsyncThunk("model/getSingleModel", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.getModelById(payload.modelId);
    if (result?.model) thunkAPI.dispatch(updatesingleModelInfo(result.model));
  } catch (err) {
    console.error(err);
  }
});

export const createModel = createAsyncThunk("model/createModel", async (payload, thunkAPI) => {
  try {
    const result = await supabaseApi.createModel(payload);
    const modelId = result?.model?.id || result?.model?._id;
    if (modelId) {
      await thunkAPI.dispatch(getSingleModel({ modelId }));
      payload.closeModal?.();
      payload.navigate?.(`/models/${modelId}`);
    }
  } catch (err) {
    console.error(err);
  }
});

export const editModel = createAsyncThunk("model/editModel", async (payload, thunkAPI) => {
  try {
    await supabaseApi.updateModel(payload.modelId, payload);
    thunkAPI.dispatch(getSingleModel({ modelId: payload.modelId }));
    payload.closeModal?.();
  } catch (err) {
    console.error(err);
  }
});

export const deleteModel = createAsyncThunk("model/deleteModel", async (payload, thunkAPI) => {
  try {
    const modelId = thunkAPI.getState().model.selectedModel?._id || thunkAPI.getState().model.selectedModel?.id;
    if (!modelId) return;
    await supabaseApi.deleteModel(modelId);
    thunkAPI.dispatch(getAllModels());
    payload.closeModal?.();
  } catch (err) {
    console.error(err);
  }
});

export const modelSlice = createSlice({
  name: "model",
  initialState,
  reducers: {
    updateModels: (state, action) => {
      state.models = action.payload;
    },
    updateselectedModel: (state, action) => {
      state.selectedModel = action.payload;
    },
    updatesingleModelInfo: (state, action) => {
      state.singleModelInfo = action.payload;
    },
    updateShowDeleteModelDialog: (state, action) => {
      state.showDeleteModelDialog = action.payload;
    },
    updateShowCreateModelDialog: (state, action) => {
      state.showCreateModelDialog = action.payload;
    },
  },
});

export const { updateModels, updateselectedModel, updatesingleModelInfo, updateShowDeleteModelDialog, updateShowCreateModelDialog } = modelSlice.actions;

export const selectmodels = (state) => state.model.models;
export const selectselectedModel = (state) => state.model.selectedModel;
export const selectsingleModelInfo = (state) => state.model.singleModelInfo;
export const selectShowDeleteModelDialog = (state) => state.model.showDeleteModelDialog;
export const selectShowCreateModelDialog = (state) => state.model.showCreateModelDialog;

export default modelSlice.reducer;
