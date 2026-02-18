import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { backendServerBaseURL } from "../../utils/backendServerBaseURL";
import { supabase } from "../../utils/supabaseClient";
import * as supabaseApi from "../../utils/supabaseApi";

const initialState = {
  me: null,
  profile: null
};

// Get Me
export const getMe = createAsyncThunk("general/getMe", async (_, thunkAPI) => {
  try {
    // 1. Get current auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) throw authError || new Error("No auth user found");

    // 2. Fetch profile from public.users with roles
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*, roles!role_id(*)')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) throw profileError;

    let finalUser = null;

    if (!profile) {
      // Check super_owners table
      const { data: superOwner, error: soError } = await supabase
        .from('super_owners')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (soError) throw soError;
      if (superOwner) {
        finalUser = {
          id: superOwner.id,
          _id: superOwner.id,
          firstName: superOwner.first_name,
          lastName: superOwner.last_name,
          email: superOwner.email,
          avatar: superOwner.avatar,
          company: superOwner.organization,
          role: { name: 'Super Owner', id: 'super_owner' }
        };
      }
    } else {
      // Map profile to legacy model structure
      finalUser = {
        id: profile.id,
        _id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        role: profile.roles ? { ...profile.roles, _id: profile.roles.id } : profile.role_id,
        avatar: profile.avatar,
        designation: profile.designation,
        company: profile.company,
        timezone: profile.timezone,
        address: profile.address,
        address2: profile.address2,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
        country: profile.country,
        currency: profile.currency,
        domain: profile.domain,
        phone: profile.phone,
        industry: profile.industry,
        fevicon: profile.fevicon,
        logo: profile.logo,
        widgets: profile.widgets,
        notificationSettings: profile.notification_settings,
      };
    }

    if (finalUser) {
      localStorage.setItem("user", JSON.stringify(finalUser));
      thunkAPI.dispatch(updateMe(finalUser));
      return finalUser;
    }

    return thunkAPI.rejectWithValue("User profile not found");
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
    // Note: The profile is fetched via getMe() which sets the 'user' key

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
    const result = await supabaseApi.registerUser({
      firstName: payload.firstName,
      lastName: payload.lastName,
      workEmail: payload.workEmail,
      password: payload.password,
      companyName: payload.companyName,
    });

    if (result?.user) {
      thunkAPI.dispatch(loginUser({
        email: payload.workEmail,
        password: payload.password,
        navigate: payload.navigate,
        setErrors: payload.setErrors
      }));
    }
  } catch (err) {
    console.error("❌ Registration Error:", err);
    const errorMessage = err.message || err.response?.data?.message || "Registration failed. Please try again.";
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
    const result = await supabaseApi.readIncompleteProfile(payload.token);
    if (result?.user) {
      thunkAPI.dispatch(readIncomplete({ user: result.user, message: result.message }));
      payload.formik?.setFieldValue("firstName", result.user?.firstName);
      payload.formik?.setFieldValue("lastName", result.user?.lastName);
    }
  } catch (err) {
    payload.setErrors({ afterSubmit: err.message });
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
