import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  TrendingUp, 
  Target, 
  Eye, 
  EyeOff,
  ChevronRight,
  Star
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getActiveNorthStarMetrics } from "../redux/slices/northStarMetricSlice";

function NorthStarWidget({ selectedProject }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { activeMetrics: northStarMetrics, loading } = useSelector(state => state.northStarMetric);

  // Extract projectId from URL or use selected project from Dashboard
  const getProjectIdFromPath = () => {
    const pathParts = location.pathname.split('/');
    const projectIndex = pathParts.indexOf('projects');
    if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
      return pathParts[projectIndex + 1];
    }
    return null;
  };

  const projectId = selectedProject || getProjectIdFromPath();

  // Load active North Star Metrics for the current project
  useEffect(() => {
    if (projectId) {
      dispatch(getActiveNorthStarMetrics({ projectId }));
    }
  }, [dispatch, projectId]);

  const getProgressPercentage = (current, target) => {
    const c = Number(current) || 0;
    const t = Number(target) || 1;
    if (t === 0) return 0;
    return Math.min((c / t) * 100, 100);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case "down":
        return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      default:
        return <Target className="h-3 w-3 text-gray-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Show message when no project is selected
  if (!projectId) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-bold">North Star Metrics</h3>
          </div>
          <div className="text-center py-4">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Select a project to view North Star Metrics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-bold">North Star Metrics</h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <h3 className="text-sm font-bold">North Star Metrics</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${projectId}/north-star-metrics`)}
            className="h-6 w-6 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {northStarMetrics.length === 0 ? (
            <div className="text-center py-4">
              <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No metrics yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/projects/${projectId}/north-star-metrics`)}
                className="mt-2"
              >
                Add Metrics
              </Button>
            </div>
          ) : (
            northStarMetrics.slice(0, 3).map((metric) => (
              <div key={metric._id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{metric.name}</p>
                    {metric.isPublic && <Eye className="h-3 w-3 text-blue-600" />}
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-xs ${getTrendColor(metric.trend)}`}>
                      {Number(metric?.trendPercentage ?? 0) > 0 ? '+' : ''}{Number(metric?.trendPercentage ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{(metric.currentValue ?? 0).toLocaleString()} {metric.unit ?? ''}</span>
                    <span>{(metric.targetValue ?? 0).toLocaleString()} {metric.unit ?? ''}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-black h-1.5 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage(metric.currentValue ?? 0, metric.targetValue ?? 1)}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-center">
                    {Math.round(getProgressPercentage(metric.currentValue ?? 0, metric.targetValue ?? 1))}% of target
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {northStarMetrics.length > 3 && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/north-star-metrics`)}
              className="w-full text-xs"
            >
              View All Metrics ({northStarMetrics.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NorthStarWidget;
