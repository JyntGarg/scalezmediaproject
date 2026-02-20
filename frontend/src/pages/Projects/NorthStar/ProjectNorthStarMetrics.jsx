import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAllNorthStarMetrics,
  createNorthStarMetric,
  updateNorthStarMetric,
  deleteNorthStarMetric,
  updateNorthStarMetricValue,
  getSelectedNorthStarMetric,
  setSelectedNorthStarMetric,
  clearError,
  clearSuccess
} from "../../../redux/slices/northStarMetricSlice";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  MoreVertical, 
  TrendingUp, 
  Target, 
  BarChart3,
  Calendar,
  Users,
  Activity,
  Star,
  Eye,
  EyeOff,
  Save,
  TrendingDown,
  Minus,
  DollarSign,
  Percent,
  Hash,
  Clock,
  Flag,
  RefreshCw
} from "lucide-react";
import moment from "moment";
import { Switch } from "../../../components/ui/switch";
// import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import * as echarts from 'echarts';

function ProjectNorthStarMetrics() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { 
    metrics: northStarMetrics, 
    selectedMetric: selectedMetricFromStore,
    loading, 
    error, 
    success, 
    createLoading, 
    updateLoading, 
    deleteLoading 
  } = useSelector(state => state.northStarMetric);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isChangeNSMDialogOpen, setIsChangeNSMDialogOpen] = useState(false);
  const [isUpdateValueDialogOpen, setIsUpdateValueDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null);
  const [currentMetric, setCurrentMetric] = useState(null);
  const [selectedExistingMetricId, setSelectedExistingMetricId] = useState("");
  const [updateValue, setUpdateValue] = useState("");
  const [chartInstance, setChartInstance] = useState(null);
  const chartRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    description: "",
    currentValue: 0,
    targetValue: 0,
    unit: "",
    metricType: "count",
    timePeriod: "monthly",
    isActive: true,
    isPublic: false,
    deadline: ""
  });

  // Load North Star Metrics and selected metric on component mount
  useEffect(() => {
    if (projectId) {
      console.log('🔄 Loading metrics for projectId:', projectId);
      dispatch(getAllNorthStarMetrics({ projectId }));
      dispatch(getSelectedNorthStarMetric({ projectId }));
    } else {
      console.warn('⚠️ No projectId found in URL');
    }
  }, [dispatch, projectId]);

  // Update currentMetric from Redux store when selected metric changes
  useEffect(() => {
    if (selectedMetricFromStore) {
      setCurrentMetric(selectedMetricFromStore);
    } else if (selectedMetricFromStore === null && currentMetric) {
      // Clear current metric if it's been deselected
      setCurrentMetric(null);
    }
  }, [selectedMetricFromStore]);

  // Update currentMetric when northStarMetrics change (to get latest data)
  useEffect(() => {
    if (currentMetric && northStarMetrics.length > 0) {
      const updatedMetric = northStarMetrics.find(m => m._id === currentMetric._id);
      if (updatedMetric && JSON.stringify(updatedMetric) !== JSON.stringify(currentMetric)) {
        setCurrentMetric(updatedMetric);
      }
    }
  }, [northStarMetrics]);

  // Clear error/success messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  // Initialize chart when component mounts or current metric changes
  useEffect(() => {
    if (chartRef.current && currentMetric) {
      // Dispose old chart if exists
      if (chartInstance) {
        chartInstance.dispose();
      }
      initChart();
    }
    return () => {
      if (chartInstance) {
        chartInstance.dispose();
      }
    };
  }, [currentMetric]);

  // Reinitialize chart when theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (chartRef.current && currentMetric) {
        if (chartInstance) {
          chartInstance.dispose();
        }
        initChart();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [currentMetric, chartInstance]);

  const initChart = () => {
    if (chartRef.current && currentMetric) {
      // Get existing chart instance or create new one
      let chart = echarts.getInstanceByDom(chartRef.current);
      if (chart) {
        chart.dispose();
      }
      chart = echarts.init(chartRef.current);
      setChartInstance(chart);

      // Use a color that works well on both light and dark backgrounds
      const lineColor = '#3b82f6'; // Blue color visible on both modes
      const axisLineColor = '#9ca3af';
      const axisLabelColor = '#6b7280';
      const splitLineColor = '#e5e7eb';

      // Use actual value history data from the metric
      let dates = [];
      let values = [];

      if (currentMetric.valueHistory && currentMetric.valueHistory.length > 0) {
        // Sort value history by date (oldest first)
        const sortedHistory = [...currentMetric.valueHistory].sort((a, b) => {
          const dateA = new Date(a.date || a);
          const dateB = new Date(b.date || b);
          return dateA - dateB;
        });

        // Extract dates and values from history
        dates = sortedHistory.map(item => {
          const date = moment(item.date || item);
          return date.format('MMM DD');
        });

        values = sortedHistory.map(item => {
          return typeof item === 'object' ? item.value : item;
        });

        // If we have less than 30 data points, fill in gaps with current value
        // Or show all data points if less than 30
        if (dates.length < 30) {
          // Option 1: Show all available data points (no padding)
          // Just use what we have
        } else {
          // If more than 30, show last 30 points
          dates = dates.slice(-30);
          values = values.slice(-30);
        }
      } else {
        // No history yet - show current value as a single point
        dates = [moment().format('MMM DD')];
        values = [currentMetric.currentValue || 0];
      }

      // If we only have one data point, duplicate it for better visualization
      if (dates.length === 1) {
        dates = [dates[0], dates[0]];
        values = [values[0], values[0]];
      }

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: 'transparent',
          textStyle: {
            color: '#fff'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
          backgroundColor: 'transparent'
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLine: {
            lineStyle: {
              color: axisLineColor
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: axisLabelColor,
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: axisLabelColor,
            fontSize: 12
          },
          splitLine: {
            lineStyle: {
              color: splitLineColor
            }
          }
        },
        series: [
          {
            name: `${currentMetric.name} (${currentMetric.unit})`,
            type: 'line',
            smooth: values.length > 2, // Only smooth if we have more than 2 points
            data: values,
            lineStyle: {
              color: lineColor,
              width: 3
            },
            itemStyle: {
              color: lineColor
            },
            symbol: 'circle',
            symbolSize: 6
          }
        ]
      };

      chart.setOption(option);

      // Handle window resize
      const handleResize = () => {
        chart.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      shortName: "",
      description: "",
      currentValue: 0,
      targetValue: 0,
      unit: "",
      metricType: "count",
      timePeriod: "monthly",
      isActive: true,
      isPublic: false,
      deadline: ""
    });
  };

  const handleCreateMetric = async () => {
    try {
      const result = await dispatch(createNorthStarMetric({ projectId, ...formData }));
      
      // If metric was created successfully, refresh the list
      if (result.payload && result.payload.data) {
        // Refresh metrics to get the new one
        await dispatch(getAllNorthStarMetrics({ projectId }));
        
        // Optionally auto-select the newly created metric
        // Uncomment below if you want new metrics to be auto-selected
        // const newMetric = result.payload.data;
        // setCurrentMetric(newMetric);
        // const storageKey = `northStarMetric_${projectId}`;
        // localStorage.setItem(storageKey, newMetric._id);
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating metric:", error);
    }
  };

  const handleEditMetric = (metric) => {
    setEditingMetric(metric);
    setFormData({
      name: metric.name,
      shortName: metric.shortName,
      description: metric.description,
      currentValue: metric.currentValue,
      targetValue: metric.targetValue,
      unit: metric.unit,
      metricType: metric.metricType,
      timePeriod: metric.timePeriod,
      isActive: metric.isActive,
      isPublic: metric.isPublic,
      deadline: metric.deadline ? moment(metric.deadline).format('YYYY-MM-DD') : ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateMetric = async () => {
    try {
      await dispatch(updateNorthStarMetric({ 
        projectId, 
        id: editingMetric._id, 
        metricData: formData 
      }));
      
      // Refresh metrics to get updated values
      // The currentMetric will be updated via the useEffect that syncs with northStarMetrics
      await dispatch(getAllNorthStarMetrics({ projectId }));
      
      setIsEditDialogOpen(false);
      setEditingMetric(null);
      resetForm();
    } catch (error) {
      console.error("Error updating metric:", error);
    }
  };

  const handleDeleteMetric = async (metricId) => {
    if (window.confirm("Are you sure you want to delete this metric?")) {
      try {
        await dispatch(deleteNorthStarMetric({ projectId, id: metricId }));
        
        // Refresh metrics and selected metric (backend will clear selection if deleted metric was selected)
        await dispatch(getAllNorthStarMetrics({ projectId }));
        await dispatch(getSelectedNorthStarMetric({ projectId }));
      } catch (error) {
        console.error("Error deleting metric:", error);
      }
    }
  };

  const handleUpdateValue = async () => {
    if (!currentMetric || !updateValue || updateLoading) return;

    try {
      await dispatch(updateNorthStarMetricValue({
        projectId,
        id: currentMetric._id,
        valueData: {
          currentValue: parseFloat(updateValue),
          trend: parseFloat(updateValue) > currentMetric.currentValue ? 'up' : 'down',
          trendPercentage: ((parseFloat(updateValue) - currentMetric.currentValue) / currentMetric.currentValue * 100)
        }
      })).unwrap();

      // Refresh metrics to get updated values
      await dispatch(getAllNorthStarMetrics({ projectId }));

      setIsUpdateValueDialogOpen(false);
      setUpdateValue("");

      // Keep currentMetric selected - don't clear it
      // The refresh above will update the metric data automatically
    } catch (error) {
      console.error("Error updating metric value:", error);
    }
  };

  const handleSelectExistingMetric = async () => {
    if (!selectedExistingMetricId) return;
    
    try {
      // Set selected metric on backend
      await dispatch(setSelectedNorthStarMetric({ projectId, metricId: selectedExistingMetricId }));
      setIsChangeNSMDialogOpen(false);
      setSelectedExistingMetricId("");
      
      // Refresh metrics to get updated data
      await dispatch(getAllNorthStarMetrics({ projectId }));
    } catch (error) {
      console.error("Error setting selected metric:", error);
    }
  };

  const getMetricIcon = (metricType) => {
    switch (metricType) {
      case 'count':
        return <Hash className="h-4 w-4" />;
      case 'decimal':
        return <BarChart3 className="h-4 w-4" />;
      case 'currency':
        return <DollarSign className="h-4 w-4" />;
      case 'rate':
        return <Percent className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getProgressPercentage = (current, target) => {
    const c = Number(current);
    const t = Number(target);
    if (t === 0 || !Number.isFinite(t)) return 0;
    if (!Number.isFinite(c)) return 0;
    return Math.min((c / t) * 100, 100);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">North Star Metrics</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your key performance indicators</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => navigate(`/projects/${projectId}/north-star-metrics/create`)} 
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Metric
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsChangeNSMDialogOpen(true)}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Target className="h-4 w-4 mr-2" />
            Change NSM
          </Button>
        </div>
      </div>

      {/* Current Metric Display */}
      {currentMetric ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getMetricIcon(currentMetric.metricType)}
                <div>
                  <CardTitle className="text-lg">{currentMetric.name}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{currentMetric.shortName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangeNSMDialogOpen(true)}
                >
                  Change NSM
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsUpdateValueDialogOpen(true);
                  }}
                >
                  Update Value
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-medium">
                    {(currentMetric.currentValue ?? 0).toLocaleString()} / {(currentMetric.targetValue ?? 0).toLocaleString()} {currentMetric.unit ?? ''}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-black h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(currentMetric.currentValue, currentMetric.targetValue)}%` }}
                  />
                </div>
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {Math.round(getProgressPercentage(currentMetric.currentValue, currentMetric.targetValue))}% of target
                </div>
              </div>

              {/* Chart */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Growth Over Time</h3>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Last 30 days</span>
                  </div>
                </div>
                <div ref={chartRef} className="h-64 w-full" key={currentMetric?._id}></div>
              </div>

              {/* Metric Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(currentMetric.currentValue ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Value</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(currentMetric.targetValue ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Target Value</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(currentMetric.trendPercentage ?? 0) > 0 ? '+' : ''}{(currentMetric.trendPercentage ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Trend</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMetric.timePeriod}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time Period</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No North Star Metric Selected</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Choose an existing metric or create a new one to start tracking your progress.
            </p>
            <div className="flex justify-center space-x-3">
              <Button onClick={() => setIsChangeNSMDialogOpen(true)} variant="outline">
                Select Existing
              </Button>
              <Button 
            onClick={() => navigate(`/projects/${projectId}/north-star-metrics/create`)} 
            className="bg-black hover:bg-gray-800 text-white"
              >
                Create New
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Metrics Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Metrics</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (projectId) {
                  dispatch(getAllNorthStarMetrics({ projectId }));
                  dispatch(getSelectedNorthStarMetric({ projectId }));
                }
              }}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {northStarMetrics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-4">
                    No metrics found. Metrics count from API: {northStarMetrics.length}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {northStarMetrics.filter(Boolean).map((metric) => (
                    <TableRow key={metric._id ?? metric.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getMetricIcon(metric.metricType)}
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-sm text-gray-500">{metric.shortName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {(metric.currentValue ?? 0).toLocaleString()} {metric.unit ?? ''}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {(metric.targetValue ?? 0).toLocaleString()} {metric.unit ?? ''}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-black h-2 rounded-full"
                        style={{ width: `${getProgressPercentage(metric.currentValue, metric.targetValue)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(getProgressPercentage(metric.currentValue, metric.targetValue))}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm ${getTrendColor(metric.trend)}`}>
                        {(metric.trendPercentage ?? 0) > 0 ? '+' : ''}{(metric.trendPercentage ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={(metric.isActive ?? metric.is_active ?? true) ? "default" : "secondary"}
                      className="min-w-[4.5rem] justify-center"
                    >
                      {(metric.isActive ?? metric.is_active ?? true) ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={async () => {
                          try {
                            // Set selected metric on backend
                            await dispatch(setSelectedNorthStarMetric({ projectId, metricId: metric._id }));
                            // Refresh metrics to get updated data
                            await dispatch(getAllNorthStarMetrics({ projectId }));
                          } catch (error) {
                            console.error("Error setting selected metric:", error);
                          }
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditMetric(metric)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={async () => {
                            try {
                              // Set selected metric on backend
                              await dispatch(setSelectedNorthStarMetric({ projectId, metricId: metric._id }));
                              setCurrentMetric(metric);
                              setIsUpdateValueDialogOpen(true);
                              // Refresh metrics to get updated data
                              await dispatch(getAllNorthStarMetrics({ projectId }));
                            } catch (error) {
                              console.error("Error setting selected metric:", error);
                            }
                          }}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Update Value
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMetric(metric._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Metric Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create Custom North Star Metric</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Metric Definition Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Metric Definition</h3>
              
              <div className="space-y-6">
                {/* Short Name */}
                <div>
                  <Label htmlFor="shortName" className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">SHORT NAME</Label>
                  <Input
                    id="shortName"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="Ex: User, Ride, MRR"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Singular, 1-2 word name for your Metric.</p>
                </div>
                
                {/* Metric Name */}
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">METRIC NAME</Label>
                  <div className="relative mt-2">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Examples: Total Trial Users, People Introduced, Placed Orders, Rides Shared"
                      maxLength={50}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{50 - formData.name.length}</span>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">DESCRIPTION</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this metric measures and why it's important for your product..."
                    className="mt-2 min-h-[100px]"
                  />
                </div>
              </div>
            </div>
            
            {/* Metric Type Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">METRIC TYPE</h3>
              <div className="grid grid-cols-4 gap-4">
                <div
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.metricType === 'count'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setFormData({ ...formData, metricType: 'count' })}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">50</div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">COUNT</div>
                  </div>
                </div>

                <div
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.metricType === 'decimal'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setFormData({ ...formData, metricType: 'decimal' })}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">5.01</div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">DECIMAL</div>
                  </div>
                </div>

                <div
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.metricType === 'currency'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setFormData({ ...formData, metricType: 'currency' })}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">$50K</div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">CURRENCY</div>
                  </div>
                </div>

                <div
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.metricType === 'rate'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setFormData({ ...formData, metricType: 'rate' })}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">50%</div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">RATE</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metric Time Period Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">METRIC TIME PERIOD</h3>
              <p className="text-xs text-gray-500 mb-4">This metric is measured or aggregated:</p>
              <div className="flex flex-wrap gap-2">
                {['across_all_time', 'daily', 'weekly', 'monthly', 'quarterly', 'annually'].map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setFormData({ ...formData, timePeriod: period })}
                    className={`px-4 py-2 text-sm font-medium rounded-md border transition-all ${
                      formData.timePeriod === period
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {period.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Additional Fields */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="currentValue" className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">CURRENT VALUE</Label>
                <Input
                  id="currentValue"
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="targetValue" className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">TARGET VALUE</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
                  placeholder="1000"
                  className="mt-2"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="unit" className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">UNIT</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., users, $, %"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Metric Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Metric Preview</h3>
              <p className="text-xs text-gray-500 mb-4">This is what your North Star Metric will look like when displayed in your Workspace.</p>
              <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {formData.name || "Sample Metric"}
                  </div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                    {formData.metricType === 'currency' && '$'}
                    {formData.currentValue > 0 ? formData.currentValue.toLocaleString() : '1,234'}
                    {formData.metricType === 'rate' && '%'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {formData.unit || "UNITS"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8">
            <Button onClick={handleCreateMetric} disabled={createLoading} className="bg-yellow-500 hover:bg-yellow-600 text-white">
              {createLoading ? "Creating..." : "Create Custom North Star Metric"}
            </Button>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change NSM Dialog */}
      <Dialog open={isChangeNSMDialogOpen} onOpenChange={setIsChangeNSMDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Change your North Star Metric</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Select from your existing metrics or create a custom one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Warning Section - Shorter and better formatted */}
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Flag className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                <strong>Note:</strong> NSMs should quantify customer value over time. 
                Frequent changes can cause team focus loss.
              </p>
            </div>
            
            {/* Existing Metrics Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Select Existing Metric</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {northStarMetrics.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No metrics available</p>
                  </div>
                ) : (
                  northStarMetrics.map((metric) => (
                    <div
                      key={metric._id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedExistingMetricId === metric._id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedExistingMetricId(metric._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getMetricIcon(metric.metricType)}
                          <div>
                            <div className="font-medium text-sm">{metric.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {(metric.currentValue ?? 0).toLocaleString()} / {(metric.targetValue ?? 0).toLocaleString()} {metric.unit ?? ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(getProgressPercentage(metric.currentValue, metric.targetValue))}%
                          </div>
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                            <div
                              className="bg-black h-1 rounded-full"
                              style={{ width: `${getProgressPercentage(metric.currentValue, metric.targetValue)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              onClick={handleSelectExistingMetric}
              disabled={!selectedExistingMetricId}
              className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white"
            >
              Change to this Metric
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsChangeNSMDialogOpen(false);
                navigate(`/projects/${projectId}/north-star-metrics/create`);
              }}
              className="w-full sm:w-auto"
            >
              Create Custom NSM
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsChangeNSMDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Value Dialog */}
      <Dialog open={isUpdateValueDialogOpen} onOpenChange={setIsUpdateValueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Metric Value</DialogTitle>
            <DialogDescription>
              Update the current value for {currentMetric?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="updateValue">New Value</Label>
              <Input
                id="updateValue"
                type="number"
                value={updateValue}
                onChange={(e) => setUpdateValue(e.target.value)}
                placeholder={`Current: ${currentMetric?.currentValue}`}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateValueDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateValue} disabled={updateLoading}>
              {updateLoading ? "Updating..." : "Update Value"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded">
          {success}
        </div>
      )}
    </div>
  );
}

export default ProjectNorthStarMetrics;