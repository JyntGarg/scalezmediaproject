import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { backendServerBaseURL } from "../../utils/backendServerBaseURL";
import { supabase } from "../../utils/supabaseClient";

const initialState = {
  me: null,
  profile: null
};

// Get Me
export const getMe = createAsyncThunk("general/getMe", async (_, thunkAPI) => {
  try {
    let response = await axios2.get(`${backendServerBaseURL}/api/v1/auth/me`);

    if (response.status === 200 && response.data.message === "User retrieved successfully") {
      // localStorage.setItem("accessToken", response.data.token);
      localStorage.setItem("userData", JSON.stringify(response.data.user));
      console.log('userData', response.data.user);
      // let projects = JSON.parse(localStorage.getItem("projectsData"));
      // console.log('projects.length', projects)

      // if (projects.length === 0) {
      //   console.log('HEREEEEEE')
      //   // If projectsData length is 0, set widgets to false
      //   let user = JSON.parse(localStorage.getItem("userData") || "{}");
      //   let userDeets = JSON.parse(localStorage.getItem("user") || "{}");
      //   console.log('user getMe', user)
      //   user.widgets = {
      //     activeGoals: false,
      //     activeTests: false,
      //     activity: false,
      //     keyMetrics: false,
      //     recentIdeas: false,
      //     recentLearnings: false
      //   };
      //   userDeets.widgets = {
      //     activeGoals: false,
      //     activeTests: false,
      //     activity: false,
      //     keyMetrics: false,
      //     recentIdeas: false,
      //     recentLearnings: false
      //   };
      //   localStorage.setItem("userData",JSON.stringify(user));
      //   localStorage.setItem("user",JSON.stringify(userDeets));

      //   window.reload();
      // }

      thunkAPI.dispatch(updateMe(JSON.parse(localStorage.getItem("userData") || "{}")));


      // Dispatch the updateMe action with the updated userData

    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const loginUser = createAsyncThunk("general/login", async (payload, thunkAPI) => {
  try {
    // 1. Sign in directly with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      console.error("Supabase Login Error:", error.message);
      payload.setErrors({ afterSubmit: "Invalid email or password" });
      return thunkAPI.rejectWithValue(error.message);
    }

    // 2. Store session details
    const { session, user: authUser } = data;
    localStorage.setItem("accessToken", session.access_token);

    // 3. Fetch user profile from our backend/database
    // We can call getMe now to sync state
    thunkAPI.dispatch(getMe());

    payload.navigate("/dashboard");
    return data;
  } catch (err) {
    console.log('err :>> ', err);
    payload.setErrors({ afterSubmit: "Please enter valid credentials!" });
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const registerUser = createAsyncThunk("general/register", async (payload, thunkAPI) => {
  try {
    // We still call the backend for registration because it handles:
    // 1. Supabase Auth creation
    // 2. Database profile creation
    // 3. Email normalization
    // 4. Role assignment
    let response = await axios.post(`${backendServerBaseURL}/api/v1/auth/create`, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.workEmail,
      password: payload.password,
      organization: payload.companyName,
      designation: "Owner",
    });

    if (response.status === 201) {
      // After registration, log them in directly
      thunkAPI.dispatch(loginUser({
        email: payload.workEmail,
        password: payload.password,
        navigate: payload.navigate,
        setErrors: payload.setErrors
      }));
    }
  } catch (err) {
    console.error("❌ Registration Error:", err);
    const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
    payload.setErrors({ afterSubmit: errorMessage });
    return thunkAPI.rejectWithValue(errorMessage);
  }
});

export const completeProfile = createAsyncThunk("general/completeProfile", async (payload, thunkAPI) => {
  try {
    let response = await axios.put(`${backendServerBaseURL}/api/v1/auth/CompleteProfile/${payload.token}`, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      password: payload.password,
      employees: payload.employees,
      phone: payload.phone,
      industry: payload.industry,
      company: payload.company,
    });

    if (response.status === 200 && response.data.message === "Profile updated successfully, proceed to login") {
      localStorage.setItem("accessToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      window.open("/dashboard", "_self");
    }
  } catch (err) {
    payload.setErrors({ afterSubmit: err.response.data.message });
  }
});
export const readIncompleteProfile = createAsyncThunk("general/readIncompleteProfile", async (payload, thunkAPI) => {
  try {
    let response = await axios.get(`${backendServerBaseURL}/api/v1/auth/readIncompleteProfile/${payload.token}`);
    if (response.status === 200 && response.data.message === "User retrieved successfully") {
      thunkAPI.dispatch(readIncomplete(response.data));
      payload.formik.setFieldValue("firstName", response.data?.user?.firstName)
      payload.formik.setFieldValue("lastName", response.data?.user?.lastName)
    }
  } catch (err) {
    payload.setErrors({ afterSubmit: err.response.data.message });
  }
});

export const generalSlice = createSlice({
  name: "general",
  initialState,
  reducers: {
    updateMe: (state, action) => {
      state.me = action.payload;
    },
    readIncomplete: (state, action) => {
      state.profile = action.payload
    }
  },
});

export const { updateMe, readIncomplete } = generalSlice.actions;

export const selectMe = (state) => state.general.me;
export const incomplete = (state) => state.general.profile;

export default generalSlice.reducer;
