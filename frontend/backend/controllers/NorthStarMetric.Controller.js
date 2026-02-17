const userService = require("../services/userService");
const createError = require("http-errors");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

// Get all North Star Metrics for a project
const getAllNorthStarMetrics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.payload?.aud || req.user?._id;

    const { data: project, error: projError } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (projError || !project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const hasAccess = project.owner_id === userId || project.team?.includes(userId) || project.created_by === userId;
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "You don't have access to this project's North Star Metrics" });
    }

    const selectedMetricId = project.selected_north_star_metric;

    const { data: metrics, error } = await supabase
      .from('northstarmetrics')
      .select('*, createdBy:users!created_by(id, first_name, last_name, avatar), lastUpdatedBy:users!last_updated_by(id, first_name, last_name, avatar)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const metricsWithSelection = (metrics || []).map(metric => ({
      ...metric,
      isSelected: metric.id === selectedMetricId
    }));

    res.status(200).json({
      success: true,
      data: metricsWithSelection,
      selectedMetricId: selectedMetricId || null,
      count: metrics?.length || 0
    });
  } catch (error) {
    console.error("Error fetching North Star Metrics:", error);
    res.status(500).json({ success: false, message: "Failed to fetch North Star Metrics", error: error.message });
  }
};

// Get a single North Star Metric by ID
const getNorthStarMetricById = async (req, res) => {
  try {
    const { id, projectId } = req.params;
    const userId = req.payload?.aud || req.user?._id;

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const hasAccess = project.owner_id === userId || project.team?.includes(userId) || project.created_by === userId;
    if (!hasAccess) return res.status(403).json({ success: false, message: "You don't have access to this project's North Star Metrics" });

    const { data: metric, error } = await supabase
      .from('northstarmetrics')
      .select('*, createdBy:users!created_by(*), lastUpdatedBy:users!last_updated_by(*)')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();

    if (error || !metric) return res.status(404).json({ success: false, message: "North Star Metric not found" });

    res.status(200).json({ success: true, data: metric });
  } catch (error) {
    console.error("Error fetching North Star Metric:", error);
    res.status(500).json({ success: false, message: "Failed to fetch North Star Metric", error: error.message });
  }
};

// Create a new North Star Metric
const createNorthStarMetric = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.payload?.aud || req.user?._id;
    const { name, shortName, description, currentValue, targetValue, unit, metricType, timePeriod, isActive, isPublic, deadline } = req.body;

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const hasAccess = project.owner_id === userId || project.team?.includes(userId) || project.created_by === userId;
    if (!hasAccess) return res.status(403).json({ success: false, message: "You don't have access to create North Star Metrics for this project" });

    if (!name || !shortName || !description || currentValue === undefined || targetValue === undefined || !unit) {
      return res.status(400).json({ success: false, message: "Missing required fields: name, shortName, description, currentValue, targetValue, unit" });
    }

    const { data: existingMetric } = await supabase.from('northstarmetrics').select('*').eq('name', name).eq('project_id', projectId).maybeSingle();
    if (existingMetric) return res.status(400).json({ success: false, message: "A North Star Metric with this name already exists in this project" });

    const { data: newMetric, error } = await supabase
      .from('northstarmetrics')
      .insert({
        name,
        short_name: shortName,
        description,
        current_value: parseFloat(currentValue),
        target_value: parseFloat(targetValue),
        unit,
        metric_type: metricType || "count",
        time_period: timePeriod || "monthly",
        is_active: isActive !== undefined ? isActive : true,
        is_public: isPublic !== undefined ? isPublic : false,
        project_id: projectId,
        created_by: userId,
        last_updated_by: userId,
        deadline: deadline ? new Date(deadline) : null,
        value_history: [{
          date: new Date(),
          value: parseFloat(currentValue),
          updated_by: userId
        }]
      })
      .select('*, createdBy:users!created_by(*), lastUpdatedBy:users!last_updated_by(*)')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, message: "North Star Metric created successfully", data: newMetric });
  } catch (error) {
    console.error("Error creating North Star Metric:", error);
    res.status(500).json({ success: false, message: "Failed to create North Star Metric", error: error.message });
  }
};

// Update a North Star Metric
const updateNorthStarMetric = async (req, res) => {
  try {
    const { id, projectId } = req.params;
    const userId = req.payload?.aud || req.user?._id;
    const updateData = req.body;

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const hasAccess = project.owner_id === userId || project.team?.includes(userId) || project.created_by === userId;
    if (!hasAccess) return res.status(403).json({ success: false, message: "You don't have access to update North Star Metrics for this project" });

    const { data: metric } = await supabase.from('northstarmetrics').select('*').eq('id', id).eq('project_id', projectId).single();
    if (!metric) return res.status(404).json({ success: false, message: "North Star Metric not found" });

    if (updateData.name && updateData.name !== metric.name) {
      const { data: existingMetric } = await supabase.from('northstarmetrics').select('*').eq('name', updateData.name).eq('project_id', projectId).neq('id', id).maybeSingle();
      if (existingMetric) return res.status(400).json({ success: false, message: "A North Star Metric with this name already exists in this project" });
    }

    const dbUpdate = {};
    if (updateData.name) dbUpdate.name = updateData.name;
    if (updateData.shortName) dbUpdate.short_name = updateData.shortName;
    if (updateData.description) dbUpdate.description = updateData.description;
    if (updateData.currentValue !== undefined) dbUpdate.current_value = parseFloat(updateData.currentValue);
    if (updateData.targetValue !== undefined) dbUpdate.target_value = parseFloat(updateData.targetValue);
    if (updateData.unit) dbUpdate.unit = updateData.unit;
    if (updateData.metricType) dbUpdate.metric_type = updateData.metricType;
    if (updateData.timePeriod) dbUpdate.time_period = updateData.timePeriod;
    if (updateData.isActive !== undefined) dbUpdate.is_active = updateData.isActive;
    if (updateData.isPublic !== undefined) dbUpdate.is_public = updateData.isPublic;
    if (updateData.deadline) dbUpdate.deadline = new Date(updateData.deadline);

    dbUpdate.last_updated_by = userId;
    dbUpdate.last_updated_at = new Date();

    const { data: updatedMetric, error } = await supabase
      .from('northstarmetrics')
      .update(dbUpdate)
      .eq('id', id)
      .select('*, createdBy:users!created_by(*), lastUpdatedBy:users!last_updated_by(*)')
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, message: "North Star Metric updated successfully", data: updatedMetric });
  } catch (error) {
    console.error("Error updating North Star Metric:", error);
    res.status(500).json({ success: false, message: "Failed to update North Star Metric", error: error.message });
  }
};

// Delete a North Star Metric
const deleteNorthStarMetric = async (req, res) => {
  try {
    const { id, projectId } = req.params;
    const userId = req.payload?.aud || req.user?._id;

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const hasAccess = project.owner_id === userId || project.team?.includes(userId) || project.created_by === userId;
    if (!hasAccess) return res.status(403).json({ success: false, message: "You don't have access to delete North Star Metrics for this project" });

    const { data: metric } = await supabase.from('northstarmetrics').select('*').eq('id', id).eq('project_id', projectId).single();
    if (!metric) return res.status(404).json({ success: false, message: "North Star Metric not found" });

    if (project.selected_north_star_metric === id) {
      await supabase.from('projects').update({ selected_north_star_metric: null }).eq('id', projectId);
    }

    const { error } = await supabase.from('northstarmetrics').delete().eq('id', id);
    if (error) throw error;

    res.status(200).json({ success: true, message: "North Star Metric deleted successfully" });
  } catch (error) {
    console.error("Error deleting North Star Metric:", error);
    res.status(500).json({ success: false, message: "Failed to delete North Star Metric", error: error.message });
  }
};

// Update metric value
const updateMetricValue = async (req, res) => {
  try {
    const { id, projectId } = req.params;
    const { currentValue, trend, trendPercentage, userEmail, userId: bodyUserId, projectName, metricName } = req.body;

    if (currentValue === undefined) return res.status(400).json({ success: false, message: "currentValue is required" });

    let updateUserId = req.payload?.aud || req.user?._id;
    if (userEmail) {
      const emailUser = await userService.findUserByEmail(userEmail.toLowerCase().trim());
      if (!emailUser) return res.status(404).json({ success: false, message: `User with email ${userEmail} not found` });
      updateUserId = emailUser.id;
    } else if (bodyUserId) {
      const idUser = await userService.findUserById(bodyUserId);
      if (!idUser) return res.status(404).json({ success: false, message: `User with ID ${bodyUserId} not found` });
      updateUserId = bodyUserId;
    }

    let project, metric;
    if (projectId && id) {
      const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).single();
      project = proj;
      const { data: met } = await supabase.from('northstarmetrics').select('*').eq('id', id).eq('project_id', projectId).single();
      metric = met;
    } else if (projectName && metricName) {
      const { data: proj } = await supabase.from('projects').select('*').eq('name', projectName).single();
      if (!proj) return res.status(404).json({ success: false, message: `Project "${projectName}" not found` });
      project = proj;
      const { data: met } = await supabase.from('northstarmetrics').select('*').eq('name', metricName).eq('project_id', proj.id).single();
      metric = met;
    } else {
      return res.status(400).json({ success: false, message: "Either projectId/metricId or projectName/metricName is required" });
    }

    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    if (!metric) return res.status(404).json({ success: false, message: `North Star Metric not found` });

    const hasAccess = project.owner_id === updateUserId || project.team?.includes(updateUserId) || project.created_by === updateUserId;
    if (!hasAccess) return res.status(403).json({ success: false, message: "User is not a member of this project" });

    const valueHistory = metric.value_history || [];
    valueHistory.push({ date: new Date(), value: parseFloat(currentValue), updated_by: updateUserId });

    const updateObj = {
      current_value: parseFloat(currentValue),
      last_updated_by: updateUserId,
      last_updated_at: new Date(),
      value_history: valueHistory
    };
    if (trend) updateObj.trend = trend;
    if (trendPercentage !== undefined) updateObj.trend_percentage = parseFloat(trendPercentage);

    const { data: updatedMetric, error } = await supabase
      .from('northstarmetrics')
      .update(updateObj)
      .eq('id', metric.id)
      .select('*, createdBy:users!created_by(*), lastUpdatedBy:users!last_updated_by(*)')
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, message: "Metric value updated successfully", data: updatedMetric });
  } catch (error) {
    console.error("Error updating metric value:", error);
    res.status(500).json({ success: false, message: "Failed to update metric value", error: error.message });
  }
};

// Get active metrics
const getActiveMetrics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.payload?.aud || req.user?._id;

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const hasAccess = project.owner_id === userId || project.team?.includes(userId) || project.created_by === userId;
    if (!hasAccess) return res.status(403).json({ success: false, message: "You don't have access to this project's North Star Metrics" });

    const { data: metrics, error } = await supabase
      .from('northstarmetrics')
      .select('*, createdBy:users!created_by(*)')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.status(200).json({ success: true, data: metrics || [], count: metrics?.length || 0 });
  } catch (error) {
    console.error("Error fetching active North Star Metrics:", error);
    res.status(500).json({ success: false, message: "Failed to fetch active North Star Metrics", error: error.message });
  }
};

// Get available metrics
const getAvailableMetrics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.payload?.aud || req.user?._id;

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const hasAccess = project.owner_id === userId || project.team?.includes(userId) || project.created_by === userId;
    if (!hasAccess) return res.status(403).json({ success: false, message: "You don't have access to this project's North Star Metrics" });

    const { data: metrics, error } = await supabase
      .from('northstarmetrics')
      .select('*, createdBy:users!created_by(*)')
      .eq('project_id', projectId)
      .order('name', { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, data: metrics || [], count: metrics?.length || 0 });
  } catch (error) {
    console.error("Error fetching available North Star Metrics:", error);
    res.status(500).json({ success: false, message: "Failed to fetch available North Star Metrics", error: error.message });
  }
};

// Get selected North Star Metric
const getSelectedNorthStarMetric = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.payload?.aud || req.user?._id;

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const hasAccess = project.owner_id === userId || project.team?.includes(userId) || project.created_by === userId;
    if (!hasAccess) return res.status(403).json({ success: false, message: "You don't have access to this project's North Star Metrics" });

    if (!project.selected_north_star_metric) {
      return res.status(200).json({ success: true, data: null, message: "No metric selected" });
    }

    const { data: selectedMetric, error } = await supabase
      .from('northstarmetrics')
      .select('*, createdBy:users!created_by(*), lastUpdatedBy:users!last_updated_by(*)')
      .eq('id', project.selected_north_star_metric)
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data: selectedMetric });
  } catch (error) {
    console.error("Error fetching selected North Star Metric:", error);
    res.status(500).json({ success: false, message: "Failed to fetch selected North Star Metric", error: error.message });
  }
};

// Set selected North Star Metric
const setSelectedNorthStarMetric = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { metricId } = req.body;
    const userId = req.payload?.aud || req.user?._id;

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const hasAccess = project.owner_id === userId || project.team?.includes(userId) || project.created_by === userId;
    if (!hasAccess) return res.status(403).json({ success: false, message: "You don't have access to set this project's North Star Metric" });

    if (!metricId) {
      await supabase.from('projects').update({ selected_north_star_metric: null }).eq('id', projectId);
      return res.status(200).json({ success: true, message: "Selected metric cleared", data: null });
    }

    const { data: metric } = await supabase.from('northstarmetrics').select('*').eq('id', metricId).eq('project_id', projectId).single();
    if (!metric) return res.status(404).json({ success: false, message: "North Star Metric not found or doesn't belong to this project" });

    await supabase.from('projects').update({ selected_north_star_metric: metricId }).eq('id', projectId);

    const { data: selectedMetric } = await supabase
      .from('northstarmetrics')
      .select('*, createdBy:users!created_by(*), lastUpdatedBy:users!last_updated_by(*)')
      .eq('id', metricId)
      .single();

    res.status(200).json({ success: true, message: "Selected metric updated successfully", data: selectedMetric });
  } catch (error) {
    console.error("Error setting selected North Star Metric:", error);
    res.status(500).json({ success: false, message: "Failed to set selected North Star Metric", error: error.message });
  }
};

module.exports = {
  getAllNorthStarMetrics,
  getNorthStarMetricById,
  createNorthStarMetric,
  updateNorthStarMetric,
  deleteNorthStarMetric,
  updateMetricValue,
  getActiveMetrics,
  getAvailableMetrics,
  getSelectedNorthStarMetric,
  setSelectedNorthStarMetric
};