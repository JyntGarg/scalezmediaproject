import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  createNorthStarMetric,
  clearError,
  clearSuccess
} from "../../../redux/slices/northStarMetricSlice";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { 
  ArrowLeft,
  Plus,
  Hash,
  BarChart3,
  DollarSign,
  Percent
} from "lucide-react";

function CreateNorthStarMetric() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { createLoading, error, success } = useSelector(state => state.northStarMetric);

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

  const handleCreateMetric = async () => {
    try {
      await dispatch(createNorthStarMetric({ projectId, ...formData }));
      // Navigate back to the main page after successful creation
      navigate(`/projects/${projectId}/north-star-metrics`);
    } catch (error) {
      console.error("Error creating metric:", error);
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
        return <Hash className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/projects/${projectId}/north-star-metrics`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Custom North Star Metric</h1>
          <p className="text-gray-600 dark:text-gray-400">Define a new metric to track your project's progress</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Metric Definition Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Metric Definition</h3>
              
              <div className="space-y-6">
                {/* Short Name */}
                <div>
                  <Label htmlFor="shortName" className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">SHORT NAME</Label>
                  <div className="relative mt-2">
                    <Input
                      id="shortName"
                      value={formData.shortName}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 20) {
                          setFormData({ ...formData, shortName: value });
                        }
                      }}
                      placeholder="Ex: User, Ride, MRR"
                      maxLength={20}
                      className="pr-16"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{formData.shortName.length}/20</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Singular, 1-2 word name for your Metric (max 20 chars).</p>
                </div>
                
                {/* Metric Name */}
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">METRIC NAME</Label>
                  <div className="relative mt-2">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 50) {
                          setFormData({ ...formData, name: value });
                        }
                      }}
                      placeholder="Examples: Total Trial Users, People Introduced, Placed Orders, Rides Shared"
                      maxLength={50}
                      className="pr-16"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{formData.name.length}/50</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Descriptive name for your metric (max 50 chars).</p>
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
          
          <div className="flex justify-end space-x-3 mt-8">
            <Button
              onClick={handleCreateMetric}
              disabled={createLoading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-8"
            >
              {createLoading ? "Creating..." : "Create Custom North Star Metric"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${projectId}/north-star-metrics`)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

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

export default CreateNorthStarMetric;
