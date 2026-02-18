/**
 * Supabase API layer - replaces Scalez backend API calls.
 * All data operations use Supabase client with current auth session.
 * RLS (Row Level Security) must be configured in Supabase for access control.
 */
import { supabase, getOwnerId } from "./supabaseClient";

// ---- Helpers: map snake_case DB rows to camelCase / legacy shapes ----
function mapUser(u) {
  if (!u) return null;
  const role = u.roles || u.role;
  return {
    ...u,
    id: u.id,
    _id: u.id,
    firstName: u.first_name ?? u.firstName,
    lastName: u.last_name ?? u.lastName,
    role: role ? { ...role, _id: role.id } : u.role_id,
  };
}

function mapRole(r) {
  if (!r) return null;
  return { ...r, _id: r.id };
}

function mapLever(l) {
  if (!l) return null;
  const createdBy = l.createdBy || l.created_by;
  return {
    ...l,
    _id: l.id,
    createdBy: createdBy ? mapUser(createdBy) : null,
  };
}

function mapKeyMetric(km) {
  if (!km) return null;
  const createdBy = km.createdBy || km.created_by;
  return {
    ...km,
    _id: km.id,
    shortName: km.short_name ?? km.shortName,
    metricType: km.metric_type ?? km.metricType,
    createdBy: createdBy ? mapUser(createdBy) : null,
  };
}

function mapNorthStarMetric(m) {
  if (!m) return null;
  return {
    ...m,
    _id: m.id,
    shortName: m.short_name ?? m.shortName,
    currentValue: m.current_value ?? m.currentValue,
    targetValue: m.target_value ?? m.targetValue,
    metricType: m.metric_type ?? m.metricType,
    timePeriod: m.time_period ?? m.timePeriod,
    isActive: m.is_active ?? m.isActive,
    isPublic: m.is_public ?? m.isPublic,
    valueHistory: m.value_history ?? m.valueHistory,
    createdBy: m.createdBy ?? m.created_by,
    lastUpdatedBy: m.lastUpdatedBy ?? m.last_updated_by,
  };
}

// ---- Auth & User ----
export async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Register: create Supabase Auth user + public.users row. Requires RLS to allow insert on users for auth.uid(). */
export async function registerUser({ firstName, lastName, workEmail, password, companyName }) {
  const email = (workEmail || "").trim().toLowerCase();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: undefined, data: { first_name: firstName, last_name: lastName, company: companyName } },
  });
  if (authError) throw authError;
  if (!authData.user) throw new Error("Registration failed");

  const { data: ownerRole } = await supabase.from("roles").select("id").ilike("name", "owner").limit(1).maybeSingle();
  const roleId = ownerRole?.id ?? null;

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .insert({
      id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      role_id: roleId,
      designation: "Owner",
      company: companyName,
    })
    .select("*, roles!role_id(*)")
    .single();

  if (userError) throw userError;
  return { user: mapUser(userRow), message: "User created successfully" };
}

/** Complete profile (invite token flow): read user by token. Password set must be done via backend/Edge Function. */
export async function readIncompleteProfile(token) {
  const { data, error } = await supabase.from("users").select("*, roles!role_id(*)").eq("token", token).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("User not found");
  return { user: mapUser(data), message: "User retrieved successfully" };
}

/** Update profile by invite token. Still need server/Edge Function to set password for new auth user. */
export async function updateProfileByToken(token, payload) {
  const { data: user, error: findErr } = await supabase.from("users").select("id").eq("token", token).maybeSingle();
  if (findErr || !user) throw new Error("User not found");

  const updates = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    company: payload.company,
    phone: payload.phone,
    industry: payload.industry,
    employees: payload.employees,
    joined: new Date(),
    token: "",
    status: "enabled",
  };

  const { data: updated, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select("*, roles!role_id(*)")
    .single();

  if (error) throw error;
  return { user: mapUser(updated), message: "Profile updated successfully" };
}

// ---- Profile (current user) ----
export async function updateProfile(payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const updates = {};
  if (payload.firstName !== undefined) updates.first_name = payload.firstName;
  if (payload.lastName !== undefined) updates.last_name = payload.lastName;
  if (payload.email !== undefined) updates.email = payload.email;
  if (payload.designation !== undefined) updates.designation = payload.designation;
  if (payload.about !== undefined) updates.about = payload.about;

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select("*, roles!role_id(*)")
    .single();

  if (error) throw error;
  return { user: mapUser(data), message: "Profile updated successfully" };
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return { message: "Password updated successfully" };
}

export async function updateCompany(payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const updates = {
    company: payload.company,
    timezone: payload.timezone,
    address: payload.address,
    address2: payload.address2,
    city: payload.city,
    state: payload.state,
    zip: payload.zip,
    country: payload.country,
    currency: payload.currency,
    domain: payload.domain,
  };

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select("*, roles!role_id(*)")
    .single();

  if (error) throw error;
  return { user: mapUser(data), message: "Company updated successfully" };
}

export async function updateNotificationSettings(notificationSettings) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const { error } = await supabase.from("users").update({ notification_settings: notificationSettings }).eq("id", userId);
  if (error) throw error;
  return { message: "Notification settings updated successfully" };
}

// ---- Avatar / Fevicon / Logo: Supabase Storage ----
const BUCKET_AVATARS = "avatars";

function getStoragePath(folder, fileName) {
  const uid = fileName || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${folder}/${uid}`;
}

export async function uploadAvatar(file) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const path = getStoragePath("avatars", `${userId}-${file.name}`);
  const { data, error } = await supabase.storage.from(BUCKET_AVATARS).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(BUCKET_AVATARS).getPublicUrl(data.path);
  const publicUrl = urlData?.publicUrl ?? data.path;

  const { data: user, error: updateErr } = await supabase
    .from("users")
    .update({ avatar: publicUrl })
    .eq("id", userId)
    .select("*, roles!role_id(*)")
    .single();

  if (updateErr) throw updateErr;
  return { user: mapUser(user), message: "Profile picture updated successfully" };
}

export async function deleteAvatar() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const defaultPath = "uploads/default.png";
  const { data: user, error } = await supabase
    .from("users")
    .update({ avatar: defaultPath })
    .eq("id", userId)
    .select("*, roles!role_id(*)")
    .single();

  if (error) throw error;
  return { user: mapUser(user), message: "Profile picture deleted successfully" };
}

export async function uploadFevicon(file) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const path = getStoragePath("fevicon", `${userId}-${file.name}`);
  const { data, error } = await supabase.storage.from(BUCKET_AVATARS).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(BUCKET_AVATARS).getPublicUrl(data.path);
  const publicUrl = urlData?.publicUrl ?? data.path;

  const { data: user, error: updateErr } = await supabase
    .from("users")
    .update({ fevicon: publicUrl })
    .eq("id", userId)
    .select("*, roles!role_id(*)")
    .single();

  if (updateErr) throw updateErr;
  return { user: mapUser(user), message: "Fevicon picture updated successfully" };
}

export async function deleteFevicon() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const { data: user, error } = await supabase
    .from("users")
    .update({ fevicon: null })
    .eq("id", userId)
    .select("*, roles!role_id(*)")
    .single();

  if (error) throw error;
  return { user: mapUser(user), message: "Fevicon picture deleted successfully" };
}

export async function uploadLogo(file) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const path = getStoragePath("logo", `${userId}-${file.name}`);
  const { data, error } = await supabase.storage.from(BUCKET_AVATARS).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(BUCKET_AVATARS).getPublicUrl(data.path);
  const publicUrl = urlData?.publicUrl ?? data.path;

  const { data: user, error: updateErr } = await supabase
    .from("users")
    .update({ logo: publicUrl })
    .eq("id", userId)
    .select("*, roles!role_id(*)")
    .single();

  if (updateErr) throw updateErr;
  return { user: mapUser(user), message: "Logo picture updated successfully" };
}

export async function deleteLogo() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const { data: user, error } = await supabase
    .from("users")
    .update({ logo: null })
    .eq("id", userId)
    .select("*, roles!role_id(*)")
    .single();

  if (error) throw error;
  return { user: mapUser(user), message: "Logo picture deleted successfully" };
}

// ---- Roles ----
export async function getRoles() {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");

  const { data, error } = await supabase.from("roles").select("*").eq("owner_id", ownerId);
  if (error) throw error;
  return { message: "Roles List", roles: (data || []).map(mapRole) };
}

export async function createRole(payload) {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("You are not authorized to create a role");

  const { error } = await supabase.from("roles").insert({
    name: payload.roleName,
    permissions: {
      company_access: payload.accessToCompany,
      create_workspace: payload.createEditAWorkspace,
      create_actionPlans: payload.createActionPlans,
      create_roles: payload.createRoles,
      add_user: payload.addUser,
      remove_user: payload.removeUser,
      create_models: payload.createModels,
      create_project: payload.createEditProject,
      delete_project: payload.deleteProject,
      create_goals: payload.createEditDeleteGoals,
      create_ideas: payload.createEditDeleteIdeas,
      nominate_ideas: payload.createNominateIdeas,
      create_tests: payload.createEditDeleteTests,
      create_learnings: payload.createEditDeleteLearnings,
      create_comments: payload.canCommentAndMentionUsers,
      mention_everyone: payload.canUseEveryoneMention,
    },
    owner_id: ownerId,
  });
  if (error) throw error;
  return { message: "Role created successfully" };
}

export async function updateRole(roleId, payload) {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("You are not authorized to update roles");

  const { error } = await supabase
    .from("roles")
    .update({
      name: payload.roleName,
      permissions: {
        company_access: payload.accessToCompany,
        create_workspace: payload.createEditAWorkspace,
        create_actionPlans: payload.createActionPlans,
        create_roles: payload.createRoles,
        add_user: payload.addUser,
        remove_user: payload.removeUser,
        create_models: payload.createModels,
        create_project: payload.createEditProject,
        delete_project: payload.deleteProject,
        create_goals: payload.createEditDeleteGoals,
        create_ideas: payload.createEditDeleteIdeas,
        nominate_ideas: payload.createNominateIdeas,
        create_tests: payload.createEditDeleteTests,
        create_learnings: payload.createEditDeleteLearnings,
        create_comments: payload.canCommentAndMentionUsers,
        mention_everyone: payload.canUseEveryoneMention,
      },
    })
    .eq("id", roleId);
  if (error) throw error;
  return { message: "Role updated successfully" };
}

export async function deleteRole(roleId) {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("You are not authorized to delete roles");

  const { data: roleUsers } = await supabase.from("users").select("id").eq("role_id", roleId);
  if (roleUsers?.length > 0) throw new Error("Cannot delete role with assigned users");

  const { error } = await supabase.from("roles").delete().eq("id", roleId);
  if (error) throw error;
  return { message: "Role deleted successfully" };
}

export async function findRoleUsers(roleId) {
  const { data, error } = await supabase.from("users").select("*, roles!role_id(*)").eq("role_id", roleId);
  if (error) throw error;
  return { message: "Get users according to roles", roleUser: (data || []).map(mapUser) };
}

// ---- Levers ----
const DEFAULT_LEVERS = [
  { name: "Acquisition", color: "Blue", type: "default" },
  { name: "Activation", color: "Orange", type: "default" },
  { name: "Referral", color: "Green", type: "default" },
  { name: "Retention", color: "Red", type: "default" },
  { name: "Revenue", color: "Yellow", type: "default" },
];

export async function getLevers() {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("levers")
    .select("*, createdBy:users!created_by(*)")
    .eq("owner_id", ownerId);
  if (error) throw error;
  const list = (data || []).map(mapLever);
  return [...DEFAULT_LEVERS, ...list];
}

export async function createLever(payload) {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("levers")
    .insert({
      name: payload.leverName,
      color: payload.color,
      workspace_id: payload.workspaceId,
      created_by: userId,
      owner_id: ownerId,
    })
    .select()
    .single();
  if (error) throw error;
  return { message: "Lever created successfully", data: mapLever(data) };
}

export async function updateLever(leverId, payload) {
  const { error } = await supabase
    .from("levers")
    .update({
      name: payload.leverName,
      color: payload.color,
      workspace_id: payload.workspaceId,
    })
    .eq("id", leverId);
  if (error) throw error;
  return { message: "Lever updated successfully" };
}

export async function deleteLever(leverId) {
  const { error } = await supabase.from("levers").delete().eq("id", leverId);
  if (error) throw error;
  return { message: "Lever deleted successfully" };
}

// ---- Key metrics ----
export async function getKeyMetrics() {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("keymetrics")
    .select("*, createdBy:users!created_by(*)")
    .eq("owner_id", ownerId);
  if (error) throw error;
  return { message: "Keymetrics retrieved successfully", keymetrics: (data || []).map(mapKeyMetric) };
}

export async function createKeyMetric(payload) {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("keymetrics")
    .insert({
      name: payload.name,
      short_name: payload.shortName,
      description: payload.description,
      metric_type: payload.metricType,
      metric_time: payload.metricTime,
      type: payload.currencyType,
      created_by: userId,
      workspace_id: payload.workspaceId,
      owner_id: ownerId,
    })
    .select()
    .single();
  if (error) throw error;
  return { message: "Keymetric created successfully", keymetric: mapKeyMetric(data) };
}

export async function deleteKeyMetric(id) {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");
  const { error } = await supabase.from("keymetrics").delete().eq("id", id);
  if (error) throw error;
  return { message: "Keymetric deleted successfully" };
}

// ---- Timezone ----
export async function getTimezone() {
  return { message: "Timezone retrieved successfully", timezone: null };
}

export async function updateTimezone(name) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const { data, error } = await supabase
    .from("timezones")
    .update({ name })
    .eq("owner_id", userId)
    .select()
    .single();
  if (error) throw error;
  return { message: "Timezone updated successfully", timezone: data };
}

// ---- Management: users & collaborators ----
export async function getManagementUsers() {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("users")
    .select("*, role:roles!role_id(*)")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const users = (data || []).map(mapUser);
  return { message: "Users retrieved successfully", users, limit: users.length };
}

export async function inviteUser(payload) {
  // Invitation flow: typically send email; here we just acknowledge.
  return { message: "Users invited successfully", email: payload.emails?.[0] };
}

export async function getCollaborators() {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("users")
    .select("*, role:roles!role_id(*)")
    .eq("owner_id", ownerId)
    .eq("type", "collaborator")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { message: "Collaborators retrieved successfully", users: (data || []).map(mapUser) };
}

export async function updateManagementUser(userId, payload) {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");

  const updates = {};
  if (payload.firstName !== undefined) updates.first_name = payload.firstName;
  if (payload.lastName !== undefined) updates.last_name = payload.lastName;
  if (payload.role !== undefined) updates.role_id = payload.role;

  const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single();
  if (error) throw error;
  return { message: "User updated successfully", user: mapUser(data) };
}

export async function makeAdmin(userId) {
  const { data: role } = await supabase.from("roles").select("id").ilike("name", "admin").limit(1).maybeSingle();
  if (!role) throw new Error("Admin role not found");
  const { error } = await supabase.from("users").update({ role_id: role.id }).eq("id", userId);
  if (error) throw error;
  return { message: "User made admin" };
}

export async function makeUser(userId) {
  const { data: role } = await supabase.from("roles").select("id").ilike("name", "member").limit(1).maybeSingle();
  if (!role) throw new Error("Member role not found");
  const { error } = await supabase.from("users").update({ role_id: role.id }).eq("id", userId);
  if (error) throw error;
  return { message: "admin made to user" };
}

// ---- North Star Metrics ----
export async function getNorthStarMetrics(projectId) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const { data: project, error: projErr } = await supabase.from("projects").select("owner_id, team, created_by, selected_north_star_metric").eq("id", projectId).single();
  if (projErr || !project) throw new Error("Project not found");
  const team = project.team || [];
  const hasAccess = project.owner_id === userId || team.includes(userId) || project.created_by === userId;
  if (!hasAccess) throw new Error("You don't have access to this project's North Star Metrics");

  const { data: metrics, error } = await supabase
    .from("northstarmetrics")
    .select("*, createdBy:users!created_by(id, first_name, last_name, avatar), lastUpdatedBy:users!last_updated_by(id, first_name, last_name, avatar)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const list = (metrics || []).map(mapNorthStarMetric);
  const selectedMetricId = project.selected_north_star_metric;
  return { success: true, data: list, selectedMetricId: selectedMetricId || null, count: list.length };
}

export async function getActiveNorthStarMetrics(projectId) {
  const { data, error } = await supabase
    .from("northstarmetrics")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { success: true, data: (data || []).map(mapNorthStarMetric) };
}

export async function getNorthStarMetricById(projectId, id) {
  const { data, error } = await supabase
    .from("northstarmetrics")
    .select("*, createdBy:users!created_by(*), lastUpdatedBy:users!last_updated_by(*)")
    .eq("project_id", projectId)
    .eq("id", id)
    .single();
  if (error || !data) throw new Error("North Star Metric not found");
  return { success: true, data: mapNorthStarMetric(data) };
}

export async function createNorthStarMetric(projectId, metricData) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const row = {
    name: metricData.name,
    short_name: metricData.shortName,
    description: metricData.description,
    current_value: parseFloat(metricData.currentValue),
    target_value: parseFloat(metricData.targetValue),
    unit: metricData.unit,
    metric_type: metricData.metricType || "count",
    time_period: metricData.timePeriod || "monthly",
    is_active: metricData.isActive !== undefined ? metricData.isActive : true,
    is_public: metricData.isPublic !== undefined ? metricData.isPublic : false,
    project_id: projectId,
    created_by: userId,
    last_updated_by: userId,
    deadline: metricData.deadline ? new Date(metricData.deadline) : null,
    value_history: [{ date: new Date(), value: parseFloat(metricData.currentValue), updated_by: userId }],
  };

  const { data, error } = await supabase
    .from("northstarmetrics")
    .insert(row)
    .select("*, createdBy:users!created_by(*), lastUpdatedBy:users!last_updated_by(*)")
    .single();
  if (error) throw error;
  return { success: true, message: "North Star Metric created successfully", data: mapNorthStarMetric(data) };
}

export async function updateNorthStarMetric(projectId, id, metricData) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const updates = {};
  if (metricData.name !== undefined) updates.name = metricData.name;
  if (metricData.shortName !== undefined) updates.short_name = metricData.shortName;
  if (metricData.description !== undefined) updates.description = metricData.description;
  if (metricData.currentValue !== undefined) updates.current_value = parseFloat(metricData.currentValue);
  if (metricData.targetValue !== undefined) updates.target_value = parseFloat(metricData.targetValue);
  if (metricData.unit !== undefined) updates.unit = metricData.unit;
  if (metricData.metricType !== undefined) updates.metric_type = metricData.metricType;
  if (metricData.timePeriod !== undefined) updates.time_period = metricData.timePeriod;
  if (metricData.isActive !== undefined) updates.is_active = metricData.isActive;
  if (metricData.isPublic !== undefined) updates.is_public = metricData.isPublic;
  if (metricData.deadline !== undefined) updates.deadline = metricData.deadline ? new Date(metricData.deadline) : null;
  updates.last_updated_by = userId;

  const { data, error } = await supabase
    .from("northstarmetrics")
    .update(updates)
    .eq("id", id)
    .eq("project_id", projectId)
    .select("*, createdBy:users!created_by(*), lastUpdatedBy:users!last_updated_by(*)")
    .single();
  if (error) throw error;
  return { success: true, message: "North Star Metric updated successfully", data: mapNorthStarMetric(data) };
}

export async function updateNorthStarMetricValue(projectId, id, valueData) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const { data: metric, error: fetchErr } = await supabase.from("northstarmetrics").select("value_history, current_value").eq("id", id).eq("project_id", projectId).single();
  if (fetchErr || !metric) throw new Error("North Star Metric not found");

  const history = Array.isArray(metric.value_history) ? metric.value_history : [];
  const newValue = valueData.value !== undefined ? parseFloat(valueData.value) : metric.current_value;
  history.push({ date: new Date(), value: newValue, updated_by: userId });

  const { data: updated, error } = await supabase
    .from("northstarmetrics")
    .update({ current_value: newValue, value_history: history, last_updated_by: userId })
    .eq("id", id)
    .eq("project_id", projectId)
    .select("*, createdBy:users!created_by(*), lastUpdatedBy:users!last_updated_by(*)")
    .single();
  if (error) throw error;
  return { success: true, message: "Value updated successfully", data: mapNorthStarMetric(updated) };
}

export async function deleteNorthStarMetric(projectId, id) {
  const { error } = await supabase.from("northstarmetrics").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw error;
  await supabase.from("projects").update({ selected_north_star_metric: null }).eq("selected_north_star_metric", id);
  return id;
}

export async function getSelectedNorthStarMetric(projectId) {
  const { data: project } = await supabase.from("projects").select("selected_north_star_metric").eq("id", projectId).single();
  const metricId = project?.selected_north_star_metric ?? null;
  if (!metricId) return { success: true, data: null };
  const { data } = await supabase.from("northstarmetrics").select("*").eq("id", metricId).eq("project_id", projectId).single();
  return { success: true, data: data ? mapNorthStarMetric(data) : null };
}

export async function setSelectedNorthStarMetric(projectId, metricId) {
  const { error } = await supabase.from("projects").update({ selected_north_star_metric: metricId || null }).eq("id", projectId);
  if (error) throw error;
  const data = metricId ? await getNorthStarMetricById(projectId, metricId).then((r) => r.data) : null;
  return { success: true, message: "Selected metric updated", data };
}

// ---- Models ----
export async function getModels() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const { data, error } = await supabase.from("models").select("*, creator:users!creator_id(*)").eq("creator_id", userId);
  if (error) throw error;
  return { message: "Models fetched successfully", models: data || [] };
}

export async function getModelById(modelId) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const { data, error } = await supabase
    .from("models")
    .select("*, creator:users!creator_id(*)")
    .eq("id", modelId)
    .eq("creator_id", userId)
    .single();
  if (error) throw error;
  return { message: "Model fetched successfully", model: data };
}

export async function createModel(payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const { data, error } = await supabase
    .from("models")
    .insert({ name: payload.name, creator_id: userId, data: payload.values })
    .select("*, creator:users!creator_id(*)")
    .single();
  if (error) throw error;
  return { message: "Model created successfully", model: data };
}

export async function updateModel(modelId, payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const { data, error } = await supabase
    .from("models")
    .update({ name: payload.name, data: payload.values })
    .eq("id", modelId)
    .eq("creator_id", userId)
    .select("*, creator:users!creator_id(*)")
    .single();
  if (error) throw error;
  return { message: "Model updated successfully", model: data };
}

export async function deleteModel(modelId) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const { data, error } = await supabase
    .from("models")
    .delete()
    .eq("id", modelId)
    .eq("creator_id", userId)
    .select("*, creator:users!creator_id(*)")
    .single();
  if (error) throw error;
  return { message: "Model deleted successfully", model: data };
}

// ---- Analytics ----
export async function getAnalytics() {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");

  const [projectsRes, goalsRes, ideasRes, testsRes, learningsRes] = await Promise.all([
    supabase.from("projects").select("*").eq("owner_id", ownerId).eq("is_archived", false),
    supabase.from("goals").select("*", { count: "exact", head: true }).eq("owner_id", ownerId),
    supabase.from("ideas").select("*", { count: "exact", head: true }).eq("owner_id", ownerId),
    supabase.from("tests").select("*", { count: "exact", head: true }).eq("owner_id", ownerId),
    supabase.from("learnings").select("*", { count: "exact", head: true }).eq("owner_id", ownerId),
  ]);

  const [recentIdeas, recentTests, recentLearnings] = await Promise.all([
    supabase.from("ideas").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(10),
    supabase.from("tests").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(10),
    supabase.from("learnings").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(10),
  ]);

  return {
    projects: projectsRes.data || [],
    counts: {
      goals: goalsRes.count ?? 0,
      ideas: ideasRes.count ?? 0,
      tests: testsRes.count ?? 0,
      learnings: learningsRes.count ?? 0,
    },
    recentActivity: {
      ideas: recentIdeas.data || [],
      tests: recentTests.data || [],
      learnings: recentLearnings.data || [],
    },
  };
}

// ---- Plans (Action Plans) ----
export async function getPlans() {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");
  const { data, error } = await supabase
    .from("plans")
    .select("*, categories:categories(*, contents:contents(*)), users:users!plan_users(*)")
    .eq("owner_id", ownerId);
  if (error) throw error;
  return { message: "Plans fetched successfully", plans: data || [] };
}

export async function getExternalPlans() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data, error } = await supabase.from("plans").select("*, categories:categories(*, contents:contents(*)), users:users!plan_users(*)").contains("users", [user.id]);
  if (error) throw error;
  return { message: "Plans fetched successfully", plans: data || [] };
}

export async function createPlan(name) {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");
  const { data, error } = await supabase.from("plans").insert({ name, owner_id: ownerId }).select().single();
  if (error) throw error;
  return { message: "Plan created successfully", plan: data };
}

export async function updatePlan(planId, payload) {
  const updates = { name: payload.name };
  if (payload.isOpened !== null && payload.isOpened !== undefined) updates.is_opened = payload.isOpened;
  const { data, error } = await supabase.from("plans").update(updates).eq("id", planId).select().single();
  if (error) throw error;
  return { message: "Plan updated successfully", plan: data };
}

export async function deletePlan(planId) {
  const { data: plan } = await supabase.from("plans").select("category").eq("id", planId).single();
  if (plan?.category?.length) {
    await supabase.from("contents").delete().in("category_id", plan.category);
    await supabase.from("categories").delete().in("id", plan.category);
  }
  const { error } = await supabase.from("plans").delete().eq("id", planId);
  if (error) throw error;
  return { message: "Plan deleted successfully" };
}

export async function addUsersToPlan(planId, userIds, copyTextAllowed) {
  const { data: plan } = await supabase.from("plans").select("users").eq("id", planId).single();
  if (!plan) throw new Error("Plan not found");
  const usersInPlan = plan.users || [];
  const toAdd = (userIds || []).filter((id) => !usersInPlan.includes(id));
  const updatedUsers = [...usersInPlan, ...toAdd];
  const { error } = await supabase.from("plans").update({ users: updatedUsers }).eq("id", planId);
  if (error) throw error;
  return { message: "Users added successfully" };
}

export async function markPlan(planId, checked) {
  const { error } = await supabase.from("plans").update({ checked: !!checked }).eq("id", planId);
  if (error) throw error;
  return { message: "Plan updated successfully" };
}

// ---- Categories ----
export async function createCategory(name, planId) {
  const { data: planFound } = await supabase.from("plans").select("category").eq("id", planId).single();
  if (!planFound) throw new Error("Plan not found");
  const { data, error } = await supabase.from("categories").insert({ name, plan_id: planId }).select().single();
  if (error) throw error;
  const categories = planFound.category || [];
  categories.push(data.id);
  await supabase.from("plans").update({ category: categories }).eq("id", planId);
  return { message: "Category created successfully", category: data };
}

export async function updateCategory(categoryId, payload) {
  const updates = { name: payload.name };
  if (payload.isOpened !== null && payload.isOpened !== undefined) updates.is_opened = payload.isOpened;
  const { data, error } = await supabase.from("categories").update(updates).eq("id", categoryId).select().single();
  if (error) throw error;
  return { message: "Category updated successfully", category: data };
}

export async function deleteCategory(categoryId) {
  await supabase.from("contents").delete().eq("category_id", categoryId);
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) throw error;
  return { message: "Category deleted successfully" };
}

export async function markCategory(categoryId, checked) {
  const { error } = await supabase.from("categories").update({ checked: !!checked }).eq("id", categoryId);
  if (error) throw error;
  return { message: "Category updated successfully" };
}

// ---- Contents ----
export async function getContents(categoryId) {
  const { data, error } = await supabase.from("contents").select("*").eq("category_id", categoryId);
  if (error) throw error;
  return { message: "Contents fetched successfully", contents: data || [] };
}

export async function getContentById(contentId) {
  const { data, error } = await supabase.from("contents").select("*").eq("id", contentId).single();
  if (error) throw error;
  return { message: "Content fetched successfully", content: data };
}

export async function createContent(payload) {
  const { name, plan, category } = payload;
  const { data, error } = await supabase.from("contents").insert({ name, plan_id: plan, category_id: category }).select().single();
  if (error) throw error;
  const { data: planData } = await supabase.from("plans").select("content").eq("id", plan).single();
  if (planData) {
    const contents = planData.content || [];
    contents.push(data.id);
    await supabase.from("plans").update({ content: contents }).eq("id", plan);
  }
  const { data: categoryData } = await supabase.from("categories").select("content").eq("id", category).single();
  if (categoryData) {
    const contents = categoryData.content || [];
    contents.push(data.id);
    await supabase.from("categories").update({ content: contents }).eq("id", category);
  }
  return { message: "Content created successfully", content: data };
}

export async function updateContent(pointerId, payload) {
  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.data !== undefined) updates.data = payload.data;
  if (payload.isOpened !== undefined) updates.is_opened = payload.isOpened;
  if (payload.checked !== undefined) updates.checked = payload.checked;
  const { data, error } = await supabase.from("contents").update(updates).eq("id", pointerId).select().single();
  if (error) throw error;
  return { message: "Content updated successfully", content: data };
}

export async function deleteContent(contentId) {
  const { error } = await supabase.from("contents").delete().eq("id", contentId);
  if (error) throw error;
  return { message: "Content deleted successfully" };
}

export async function markContent(contentId, checked) {
  const { error } = await supabase.from("contents").update({ checked: !!checked }).eq("id", contentId);
  if (error) throw error;
  return { message: "Content updated successfully" };
}

// ---- Funnel projects ----
function mapFunnelProject(p) {
  if (!p) return null;
  return { ...p, _id: p.id };
}

export async function getFunnelProjects() {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");
  const { data, error } = await supabase
    .from("funnel_projects")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const projects = (data || []).map(mapFunnelProject);
  return { message: "Projects list", payload: { projects } };
}

export async function getFunnelProject(projectId) {
  const { data: project, error } = await supabase
    .from("funnel_projects")
    .select("*, products:products(*), expenses:expenses(*), versions:versions(*)")
    .eq("id", projectId)
    .single();
  if (error || !project) throw new Error("Project not found");
  const { data: scenarios } = await supabase.from("scenarios").select("*").eq("project_id", projectId);
  let scenarioList = (scenarios || []).map((s) => ({ ...s, _id: s.id }));
  if (scenarioList.length === 0) {
    scenarioList = [{ id: projectId, _id: projectId, nodes: project.nodes || [], edges: project.edges || [] }];
  }
  const payload = { ...mapFunnelProject(project), scenario: scenarioList };
  return { message: "Project fetched", payload };
}

export async function createFunnelProject(body) {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error("Unauthorized");
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("funnel_projects")
    .insert({
      name: body.title || body.name,
      description: body.description,
      nodes: body.nodes || [],
      edges: body.edges || [],
      owner_id: ownerId,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return { message: "Project created successfully", payload: { project: mapFunnelProject(data) } };
}

export async function updateFunnelProject(projectId, body) {
  const updates = {};
  if (body.title !== undefined) updates.name = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.nodes !== undefined) updates.nodes = body.nodes;
  if (body.edges !== undefined) updates.edges = body.edges;
  if (body.processingRatePercent !== undefined) updates.processing_rate_percent = body.processingRatePercent;
  if (body.perTransactionFee !== undefined) updates.per_transaction_fee = body.perTransactionFee;
  const { error } = await supabase.from("funnel_projects").update(updates).eq("id", projectId);
  if (error) throw error;
  return { message: "Project updated successfully" };
}

export async function deleteFunnelProject(projectId) {
  const { error } = await supabase.from("funnel_projects").delete().eq("id", projectId);
  if (error) throw error;
  return { message: "Project deleted successfully" };
}

export async function createFunnelScenario(projectId) {
  const { data, error } = await supabase
    .from("scenarios")
    .insert({ project_id: projectId, name: "Scenario 1", data: {} })
    .select()
    .single();
  if (error) throw error;
  return { message: "Scenario created successfully", data };
}

export async function deleteFunnelScenario(scenarioId) {
  const { error } = await supabase.from("scenarios").delete().eq("id", scenarioId);
  if (error) throw error;
  return { message: "Scenario deleted successfully" };
}
