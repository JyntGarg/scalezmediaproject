import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as supabaseApi from "../../utils/supabaseApi";

const initialState = {
  anayticsData: [],
  span: "2weeks",
  ideaTest:{}
};

export const getAnayticsData = createAsyncThunk("anaytics/getAnayticsData", async (_, thunkAPI) => {
  try {
    const data = await supabaseApi.getAnalytics();
    thunkAPI.dispatch(updateanayticsData({ ...data, message: "Projects fetched successfully" }));
  } catch (err) {
    console.error(err);
  }
});





export const anayticsSlice = createSlice({
  name: "anaytics",
  initialState,
  reducers: {
    updateanayticsData: (state, action) => {
      console.log(action.payload)
      state.anayticsData = action.payload.projects;
      state.ideaTest.idea=action.payload.idea
      state.ideaTest.test=action.payload.test
      state.ideaTest.learning=action.payload.learning
      state.ideaTest.labels=action.payload.labels
      state.ideaTest.data=action.payload.data

      state.ideaTest.acquisition = action.payload.acquisition
      state.ideaTest.activation = action.payload.activation
      state.ideaTest.referral = action.payload.referral
      state.ideaTest.retention = action.payload.retention
      state.ideaTest.revenue = action.payload.revenue

      state.ideaTest.userData = action.payload.userData


    },
    updatespan: (state, action) => {
      state.span = action.payload;
    },
  },
});

export const { updateanayticsData, updatespan } = anayticsSlice.actions;

export const selectanayticsData = (state) => state.anaytics.anayticsData;
export const ideaTestData = (state) => state.anaytics.ideaTest;
// export const ideaData = (state) => state.anaytics.idea;
export const selectspan = (state) => state.anaytics.span;

export default anayticsSlice.reducer;
