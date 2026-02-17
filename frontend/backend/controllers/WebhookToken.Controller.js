const userService = require("../services/userService");
const createError = require("http-errors");
const { verifyAccessToken } = require("../helpers/jwt_helper");
const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const getProjectWebhookToken = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.payload?.aud || req.user?._id;

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const hasAccess = project.owner_id === userId || project.team?.includes(userId) || project.created_by === userId;
    if (!hasAccess) return res.status(403).json({ success: false, message: "You don't have access to this project's webhook tokens" });

    let { data: webhookToken } = await supabase
      .from('webhook_tokens')
      .select('*, createdBy:users!created_by(*)')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .single();

    if (!webhookToken) {
      const JWT = require("jsonwebtoken");
      const ownerId = project.owner_id || project.created_by;
      const owner = await userService.findUserById(ownerId);

      if (!owner) return res.status(404).json({ success: false, message: "Project owner not found" });

      const payload = { projectId: projectId.toString(), type: "webhook", scope: "project" };
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const options = { expiresIn: "365d", issuer: "scalez.in", audience: ownerId.toString() };

      const token = await new Promise((resolve, reject) => {
        JWT.sign(payload, secret, options, (err, token) => {
          if (err) reject(err);
          else resolve(token);
        });
      });

      const { data: newToken, error } = await supabase
        .from('webhook_tokens')
        .insert({
          project_id: projectId,
          token: token,
          created_by: ownerId,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        })
        .select('*, createdBy:users!created_by(*)')
        .single();

      if (error) throw error;
      webhookToken = newToken;
    }

    await supabase
      .from('webhook_tokens')
      .update({
        last_used_at: new Date(),
        usage_count: (webhookToken.usage_count || 0) + 1,
      })
      .eq('id', webhookToken.id);

    res.status(200).json({
      success: true,
      data: {
        token: webhookToken.token,
        projectId: webhookToken.project_id,
        expiresAt: webhookToken.expires_at,
        createdAt: webhookToken.created_at,
        usageCount: webhookToken.usage_count,
        lastUsedAt: webhookToken.last_used_at,
        webhookUrls: {
          northStarMetrics: `http://localhost:5678/webhook/north-star-metrics`,
          goalMetrics: `http://localhost:5678/webhook/goal-metrics`
        },
        createdBy: webhookToken.createdBy
      }
    });
  } catch (error) {
    console.error("Error getting webhook token:", error);
    res.status(500).json({ success: false, message: "Failed to get webhook token", error: error.message });
  }
};

const regenerateProjectWebhookToken = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.payload?.aud || req.user?._id;

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    if (project.owner_id !== userId && project.created_by !== userId) {
      return res.status(403).json({ success: false, message: "Only project owner can regenerate webhook tokens" });
    }

    await supabase.from('webhook_tokens').update({ is_active: false }).eq('project_id', projectId).eq('is_active', true);

    const JWT = require("jsonwebtoken");
    const ownerId = project.owner_id || project.created_by;

    const payload = { projectId: projectId.toString(), type: "webhook", scope: "project" };
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const options = { expiresIn: "365d", issuer: "scalez.in", audience: ownerId.toString() };

    const token = await new Promise((resolve, reject) => {
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) reject(err);
        else resolve(token);
      });
    });

    const { data: webhookToken, error } = await supabase
      .from('webhook_tokens')
      .insert({
        project_id: projectId,
        token: token,
        created_by: ownerId,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      .select('*, createdBy:users!created_by(*)')
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Webhook token regenerated successfully",
      data: {
        token: webhookToken.token,
        projectId: webhookToken.project_id,
        expiresAt: webhookToken.expires_at,
        webhookUrls: {
          northStarMetrics: `http://localhost:5678/webhook/north-star-metrics`,
          goalMetrics: `http://localhost:5678/webhook/goal-metrics`
        },
        createdBy: webhookToken.createdBy
      }
    });
  } catch (error) {
    console.error("Error regenerating webhook token:", error);
    res.status(500).json({ success: false, message: "Failed to regenerate webhook token", error: error.message });
  }
};

module.exports = {
  getProjectWebhookToken,
  regenerateProjectWebhookToken
};
