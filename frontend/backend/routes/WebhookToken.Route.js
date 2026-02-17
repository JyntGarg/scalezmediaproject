const express = require("express");
const router = express.Router();
const {
  getProjectWebhookToken,
  regenerateProjectWebhookToken
} = require("../controllers/WebhookToken.Controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");

// GET /api/v1/projects/:projectId/webhook-token - Get webhook token for a project
router.get("/:projectId/webhook-token", verifyAccessToken, getProjectWebhookToken);

// POST /api/v1/projects/:projectId/webhook-token/regenerate - Regenerate webhook token
router.post("/:projectId/webhook-token/regenerate", verifyAccessToken, regenerateProjectWebhookToken);

module.exports = router;

