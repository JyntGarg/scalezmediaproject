const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams to access projectId
const {
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
} = require("../controllers/NorthStarMetric.Controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");

// GET /api/v1/projects/:projectId/north-star-metrics - Get all North Star Metrics for a project
router.get("/", verifyAccessToken, getAllNorthStarMetrics);

// GET /api/v1/projects/:projectId/north-star-metrics/active - Get active metrics for dashboard
router.get("/active", verifyAccessToken, getActiveMetrics);

// GET /api/v1/projects/:projectId/north-star-metrics/available - Get available metrics for dropdown
router.get("/available", verifyAccessToken, getAvailableMetrics);

// GET /api/v1/projects/:projectId/north-star-metrics/selected - Get selected metric for project
router.get("/selected", verifyAccessToken, getSelectedNorthStarMetric);

// POST /api/v1/projects/:projectId/north-star-metrics/selected - Set selected metric for project
router.post("/selected", verifyAccessToken, setSelectedNorthStarMetric);

// GET /api/v1/projects/:projectId/north-star-metrics/:id - Get single North Star Metric
router.get("/:id", verifyAccessToken, getNorthStarMetricById);

// POST /api/v1/projects/:projectId/north-star-metrics - Create new North Star Metric
router.post("/", verifyAccessToken, createNorthStarMetric);

// PUT /api/v1/projects/:projectId/north-star-metrics/:id - Update North Star Metric
router.put("/:id", verifyAccessToken, updateNorthStarMetric);

// PATCH /api/v1/projects/:projectId/north-star-metrics/:id/value - Update metric value only
router.patch("/:id/value", verifyAccessToken, updateMetricValue);
// Webhook route for name-based updates (no projectId/metricId in params, use names in body)
router.patch("/value/by-name", verifyAccessToken, updateMetricValue);

// DELETE /api/v1/projects/:projectId/north-star-metrics/:id - Delete North Star Metric
router.delete("/:id", verifyAccessToken, deleteNorthStarMetric);

module.exports = router;
