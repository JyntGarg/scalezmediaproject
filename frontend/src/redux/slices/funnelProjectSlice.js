import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as supabaseApi from "../../utils/supabaseApi";

const initialState = {
  allProjects: [],
  singleProject: null,
  selectedSidebarTab: "canvas",
  reportsSelectedTab: "projectSummary",
  scenarioId: 0,
};

export const createProject = createAsyncThunk(
  "funnelProject/createProject",
  async (payload, _) => {
    try {
      const result = await supabaseApi.createFunnelProject({ title: payload.title, description: payload.description });
      if (result?.payload?.project) {
        if (payload.setIsCreateProjectOpen) payload.setIsCreateProjectOpen(false);
        else if (payload.createNewProjectCloseRef?.current) payload.createNewProjectCloseRef.current.click();
        const projectId = result.payload.project._id || result.payload.project.id;
        localStorage.setItem("projectId", projectId);
        window.open(`/funnel/${projectId}`, "_self");
      }
    } catch (err) {
      payload.setErrors?.({ afterSubmit: err.message });
    }
  }
);

export const updateProject = createAsyncThunk(
  "funnelProject/updateProject",
  async (payload, _) => {
    try {
      await supabaseApi.updateFunnelProject(payload.projectId, {
        title: payload.title,
        description: payload.description,
        processingRatePercent: payload.processingRatePercent,
        perTransactionFee: payload.perTransactionFee,
      });
      payload.editProjectCloseRef?.current?.click();
    } catch (err) {
      payload.setErrors?.({ afterSubmit: err.message });
    }
  }
);

export const getAllProjects = createAsyncThunk(
  "funnelProject/getAllProjects",
  async (payload, thunkAPI) => {
    try {
      const result = await supabaseApi.getFunnelProjects();
      if (result?.payload?.projects) thunkAPI.dispatch(updateAllProjects(result.payload.projects));
    } catch (err) {
      payload.setErrors?.({ afterSubmit: err.message });
    }
  }
);

export const deleteProject = createAsyncThunk(
  "funnelProject/deleteProject",
  async (payload, thunkAPI) => {
    try {
      await supabaseApi.deleteFunnelProject(payload.projectId);
      payload.closeDeleteprojectModalRef?.current?.click();
      thunkAPI.dispatch(getAllProjects());
      const otherProjects = thunkAPI.getState().funnelProject.allProjects.filter((p) => (p._id || p.id) !== payload.projectId);
      if (payload.projectId === payload.openedProjectId) {
        window.open(`/funnel/${otherProjects.length > 0 ? (otherProjects[0]._id || otherProjects[0].id) : "0"}`, "_self");
      } else {
        window.open("/funnel/0", "_self");
      }
    } catch (err) {
      payload.setErrors?.({ afterSubmit: err.message });
    }
  }
);

export const getSingleProject = createAsyncThunk(
  "funnelProject/getSingleProject",
  async (payload, thunkAPI) => {
    try {
      const result = await supabaseApi.getFunnelProject(payload.projectId);
      const pl = result?.payload;
      if (pl?.scenario?.length) {
        if (payload.setNodes) payload.setNodes(() => pl.scenario[0].nodes || []);
        if (payload.setEdges) payload.setEdges(() => pl.scenario[0].edges || []);
        thunkAPI.dispatch(updateScenarioId(pl.scenario[0]._id || pl.scenario[0].id));
      }
      thunkAPI.dispatch(updatesingleProject(pl || null));
    } catch (err) {
      payload.setErrors?.({ afterSubmit: err.message });
    }
  }
);

export const createScenario = createAsyncThunk(
  "funnelProject/createScenario",
  async (payload, thunkAPI) => {
    try {
      await supabaseApi.createFunnelScenario(payload.projectId);
      thunkAPI.dispatch(getSingleProject({ projectId: payload.projectId }));
    } catch (err) {
      payload.setErrors?.({ afterSubmit: err.message });
    }
  }
);

export const deleteScenario = createAsyncThunk(
  "funnelProject/deleteScenario",
  async (payload, thunkAPI) => {
    try {
      await supabaseApi.deleteFunnelScenario(payload.scenarioId);
      thunkAPI.dispatch(getSingleProject({ projectId: payload.projectId }));
    } catch (err) {
      payload.setErrors?.({ afterSubmit: err.message });
    }
  }
);

export const funnelProjectSlice = createSlice({
  name: "funnelProject",
  initialState,
  reducers: {
    updateAllProjects: (state, action) => {
      state.allProjects = action.payload;
    },
    updatesingleProject: (state, action) => {
      state.singleProject = action.payload;
    },
    updateselectedSidebarTab: (state, action) => {
      state.selectedSidebarTab = action.payload;
    },
    updatereportsSelectedTab: (state, action) => {
      state.reportsSelectedTab = action.payload;
    },
    updateScenarioId: (state, action) => {
      state.scenarioId = action.payload;
    },
    updateNodesInSelectedScenario: (state, action) => {
      if (
        state.singleProject &&
        state.singleProject.scenario.find((s) => s._id === state.scenarioId)
      ) {
        state.singleProject.scenario.find(
          (s) => s._id === state.scenarioId
        ).nodes = action.payload;
      }
    },
    updateEdgesInSelectedScenario: (state, action) => {
      if (
        state.singleProject &&
        state.singleProject.scenario.find((s) => s._id === state.scenarioId)
      ) {
        state.singleProject.scenario.find(
          (s) => s._id === state.scenarioId
        ).edges = action.payload;
      }
    },
  },
});

export const {
  updateAllProjects,
  updatesingleProject,
  updateselectedSidebarTab,
  updatereportsSelectedTab,
  updateScenarioId,
  updateNodesInSelectedScenario,
  updateEdgesInSelectedScenario,
} = funnelProjectSlice.actions;

export const selectAllProjects = (state) => state.funnelProject.allProjects;
export const selectsingleProject = (state) => state.funnelProject.singleProject;
export const selectselectedSidebarTab = (state) =>
  state.funnelProject.selectedSidebarTab;
export const selectreportsSelectedTab = (state) =>
  state.funnelProject.reportsSelectedTab;
export const selectScenarioId = (state) => state.funnelProject.scenarioId;

export default funnelProjectSlice.reducer;
