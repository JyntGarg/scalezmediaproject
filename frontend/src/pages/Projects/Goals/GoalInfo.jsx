import moment from "moment";
import React, { useEffect, useState } from "react";
import { Mention, MentionsInput } from "react-mentions";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import AvatarGroup from "../../../components/common/AvatarGroup";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Plus, Edit3, Share2, Archive, BarChart3, Bell, Edit, Trash2, TrendingUp, Target, Play, MessageSquare, UserPlus, Settings, Activity, Bold, Italic, AtSign, Send } from "lucide-react";
import ReactECharts from 'echarts-for-react';
import {
  addGoalComment,
  deleteGoalComment,
  deleteKeyMetricValue,
  getProjectCollaborators,
  getProjectUsers,
  readSingleGoal,
  selectProjectCollaboratos,
  selectProjectUsers,
  selectSingleGoalInfo,
  updateGoalComment,
  updateKeyMetricStatus,
  updateSelectedGoal,
  updateSelectedIdea,
  updateSelectedKeyMetric,
  getAllIdeas,
  updateShowDeleteGoalDialog,
} from "../../../redux/slices/projectSlice";
import { getAllkeyMetrics } from "../../../redux/slices/settingSlice";
import { backendServerBaseURL } from "../../../utils/backendServerBaseURL";
import { formatDate2, formatTime } from "../../../utils/formatTime";
import {
  hasPermission_create_goals,
  isTypeOwner,
  isRoleAdmin,
  isRoleMember,
  hasPermission_create_ideas,
  hasPermission_create_comments,
  hasPermission_mention_everyone,
} from "../../../utils/permissions";
import { getUsersFromTags, swapTags } from "../../../utils/tag.js";
import InviteCollaboratorsDialog from "../../Settings/InviteCollaboratorsDialog";
import CreateNewIdeaDialog from "../Ideas/CreateNewIdeaDialog";
import CreateNewGoalDialog from "./CreateNewGoalDialog";
import EditMetricValueDialog from "./EditMetricValueDialog";
import UpdateMetricDialog from "./UpdateMetricDialog";
import DeleteGoalDialog from "./DeleteGoalDialog";
import Spinner from "../../../components/common/Spinner";
import LoadingButton from "../../../components/common/LoadingButton";
import Toast from "../../../components/common/Toast";

function GoalInfo() {
  const [ideasForWeeklySales, setideasForWeeklySales] = useState([1, 2, 3]);
  const [selectedMenu, setselectedMenu] = useState("");
  const params = useParams();
  const projectId = params.projectId;
  const goalId = params.goalId;
  const dispatch = useDispatch();
  const singleGoalInfo = useSelector(selectSingleGoalInfo);
  const [ProjectsMenus, setprojectsMenus] = useState([]);
  let [selectedKeyMetric, setselectedKeyMetric] = useState(null);
  // console.log('selectedKeyMetric :>> ', selectedKeyMetric);
  const me = JSON.parse(localStorage.getItem("user", ""));
  const [comment, setcomment] = useState("");
  const [comment2, setcomment2] = useState("");
  const projectUsers = useSelector(selectProjectUsers);
  const projectCollaborators = useSelector(selectProjectCollaboratos);
  const [editingComment, seteditingComment] = useState(0);
  const openedProject = JSON.parse(localStorage.getItem("openedProject", ""));
  const [selectedTab, setselectedTab] = useState("About Goal");
  const navigate = useNavigate();
  let [selectedKeyMetricIndex, setselectedKeyMetricIndex] = useState(0);
  const [isCreateGoalDialogOpen, setIsCreateGoalDialogOpen] = useState(false);
  const [isUpdateMetricDialogOpen, setIsUpdateMetricDialogOpen] = useState(false);
  const [isCreateIdeaDialogOpen, setIsCreateIdeaDialogOpen] = useState(false);
  const [isEditMetricValueDialogOpen, setIsEditMetricValueDialogOpen] = useState(false);


  const [showLoader, setShowLoader] = useState(true);
  const [isSubmitting, setisSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleShare = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setToastMessage('Link copied to clipboard!');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
      setToastMessage('Failed to copy link. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  // Text formatting functions for comments
  const toggleFormatting = (formatType) => {
    const textarea = document.getElementById('comment-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = comment.substring(start, end);

    const wrapper = formatType === 'bold' ? '**' : '*';
    const wrapperLength = wrapper.length;

    // Check if the selected text is already formatted
    const beforeSelection = comment.substring(start - wrapperLength, start);
    const afterSelection = comment.substring(end, end + wrapperLength);

    let newText;
    let newCursorStart;
    let newCursorEnd;

    if (beforeSelection === wrapper && afterSelection === wrapper) {
      // Remove formatting
      newText = comment.substring(0, start - wrapperLength) +
                selectedText +
                comment.substring(end + wrapperLength);
      newCursorStart = start - wrapperLength;
      newCursorEnd = end - wrapperLength;
    } else if (selectedText) {
      // Add formatting to selected text
      const replacement = `${wrapper}${selectedText}${wrapper}`;
      newText = comment.substring(0, start) + replacement + comment.substring(end);
      newCursorStart = start;
      newCursorEnd = end + (wrapperLength * 2);
    } else {
      // No selection, insert placeholder text with formatting
      const placeholderText = formatType === 'bold' ? 'bold text' : 'italic text';
      const replacement = `${wrapper}${placeholderText}${wrapper}`;
      newText = comment.substring(0, start) + replacement + comment.substring(end);
      newCursorStart = start + wrapperLength;
      newCursorEnd = start + wrapperLength + placeholderText.length;
    }

    setcomment(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
      textarea.focus();
    }, 0);
  };

  const handleBold = () => toggleFormatting('bold');
  const handleItalic = () => toggleFormatting('italic');

  // Function to generate comprehensive activity data
  const generateGoalActivities = () => {
    const activities = [];

    // Add comments as activities
    if (singleGoalInfo?.comments) {
      singleGoalInfo.comments.forEach(comment => {
        activities.push({
          id: `comment-${comment._id}`,
          type: 'comment',
          user: comment.createdBy,
          action: 'commented',
          description: comment.comment,
          timestamp: comment.createdAt,
          icon: MessageSquare,
          color: 'text-blue-600'
        });
      });
    }

    // Add metric updates as activities
    if (singleGoalInfo?.keymetric) {
      singleGoalInfo.keymetric.forEach(metric => {
        if (metric.metrics && metric.metrics.length > 0) {
          metric.metrics.forEach((metricValue, index) => {
            activities.push({
              id: `metric-${metric._id}-${index}`,
              type: 'metric_update',
              user: metricValue.updatedBy || { firstName: 'System', lastName: '', avatar: 'uploads/default.png' },
              action: 'updated metric',
              description: `${metric.name}: ${metricValue.value}`,
              timestamp: metricValue.updatedAt || metricValue.createdAt,
              icon: BarChart3,
              color: 'text-green-600'
            });
          });
        }
      });
    }

    // Add goal creation activity
    if (singleGoalInfo?.createdAt) {
      activities.push({
        id: `goal-created-${singleGoalInfo._id}`,
        type: 'goal_created',
        user: singleGoalInfo.createdBy || { firstName: 'System', lastName: '', avatar: 'uploads/default.png' },
        action: 'created goal',
        description: singleGoalInfo.name,
        timestamp: singleGoalInfo.createdAt,
        icon: Target,
        color: 'text-purple-600'
      });
    }

    // Add goal updates activity
    if (singleGoalInfo?.updatedAt && singleGoalInfo.updatedAt !== singleGoalInfo.createdAt) {
      activities.push({
        id: `goal-updated-${singleGoalInfo._id}`,
        type: 'goal_updated',
        user: singleGoalInfo.updatedBy || { firstName: 'System', lastName: '', avatar: 'uploads/default.png' },
        action: 'updated goal',
        description: 'Goal details were modified',
        timestamp: singleGoalInfo.updatedAt,
        icon: Edit3,
        color: 'text-orange-600'
      });
    }

    // Add ideas created for this goal
    if (singleGoalInfo?.ideas) {
      singleGoalInfo.ideas.forEach(idea => {
        activities.push({
          id: `idea-${idea._id}`,
          type: 'idea_created',
          user: idea.createdBy,
          action: 'created idea',
          description: idea.name,
          timestamp: idea.createdAt,
          icon: Plus,
          color: 'text-indigo-600'
        });
      });
    }

    // Add tests created for this goal
    if (singleGoalInfo?.tests) {
      singleGoalInfo.tests.forEach(test => {
        activities.push({
          id: `test-${test._id}`,
          type: 'test_created',
          user: test.createdBy,
          action: 'created test',
          description: test.name,
          timestamp: test.createdAt,
          icon: Play,
          color: 'text-red-600'
        });
      });
    }

    // Sort activities by timestamp (newest first)
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // useEffect(() => {
  //   if (singleGoalInfo) {
  //     // setShowLoader(false); 
  //   } else {
  //     // setShowLoader(true); 
  //   }
  // }, [singleGoalInfo]);

  useEffect(() => {
    dispatch(readSingleGoal({ goalId: params.goalId }));
    console.log('params.goalId :>> ', params.goalId);
    dispatch(getProjectUsers({ projectId }));
    dispatch(getAllkeyMetrics());
    dispatch(getProjectCollaborators({ projectId }));
    setShowLoader(false);
  }, [goalId, projectId, dispatch]);

  // Redirect to goals list if goal is deleted (singleGoalInfo becomes null after deletion)
  useEffect(() => {
    if (singleGoalInfo === null && goalId && !showLoader) {
      // Small delay to allow navigation from delete dialog to complete first
      const timer = setTimeout(() => {
        navigate(`/projects/${projectId}/goals`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [singleGoalInfo, goalId, projectId, navigate, showLoader]);

  useEffect(() => {
    if (singleGoalInfo) {
      setprojectsMenus(
        singleGoalInfo?.keymetric?.map((k) => {
          return { name: k.name, id: k._id };
        })
      );

      setselectedKeyMetric(singleGoalInfo.keymetric[selectedKeyMetricIndex]);
      let tempMenu = singleGoalInfo.keymetric[selectedKeyMetricIndex];
      setselectedMenu({ name: tempMenu?.name, id: tempMenu?._id });

      // console.log('selectedKeyMetricIndex :>> ', selectedKeyMetricIndex);
      //       console.log('setselectedKeyMetric(singleGoalInfo.keymetric[selectedKeyMetricIndex', setselectedKeyMetric(singleGoalInfo.keymetric[selectedKeyMetricIndex])
      // );
      // console.log('singleGoalInfo 11:>> ', singleGoalInfo);
      // console.log('selectedKeyMetric 11:>> ', selectedKeyMetric);
      // if(selectedKeyMetric){
      //   setselectedKeyMetric(singleGoalInfo.keymetric.filter((m) => m._id === selectedKeyMetric?._id)[0]);
      // }
      if (selectedMenu?.id === ProjectsMenus[selectedKeyMetricIndex]?.id) {
        setselectedKeyMetricIndex(0);
      }
    }
  }, [singleGoalInfo, selectedKeyMetric]);

  useEffect(() => {
    if (selectedMenu == "" && ProjectsMenus.length !== 0) {
      setselectedMenu(ProjectsMenus[0]);
    }
  }, [ProjectsMenus]);

  useEffect(() => {
    // console.log('selectedMenu ---:>> ', selectedMenu);
    if (singleGoalInfo && singleGoalInfo?.keymetric.length !== 0) {
      setselectedKeyMetric(singleGoalInfo.keymetric.filter((k) => k._id === selectedMenu.id)[0]);
    }
  }, [selectedMenu]);

  const keymetricProgressPercent = () => {
    const currentValue = selectedKeyMetric?.metrics?.length === 0 ? 0 : selectedKeyMetric?.metrics[selectedKeyMetric?.metrics?.length - 1].value;
    const targetValue = selectedKeyMetric?.targetValue;
    const startValue = selectedKeyMetric?.startValue || 0;

    if (!targetValue || targetValue === 0) return 0;

    // If start and target are the same, return 100% if current >= target, else 0%
    if (targetValue === startValue) {
      return currentValue >= targetValue ? 100 : 0;
    }

    // Calculate progress from start to target
    const progress = ((currentValue - startValue) / (targetValue - startValue)) * 100;
    return Math.max(0, Math.min(100, Math.round(progress))); // Clamp between 0-100%
  };

  const getActualProgressPercent = () => {
    const currentValue = selectedKeyMetric?.metrics?.length === 0 ? 0 : selectedKeyMetric?.metrics[selectedKeyMetric?.metrics?.length - 1].value;
    const targetValue = selectedKeyMetric?.targetValue;
    const startValue = selectedKeyMetric?.startValue || 0;

    if (!targetValue || targetValue === 0) return 0;

    // If start and target are the same, return 100% if current >= target, else 0%
    if (targetValue === startValue) {
      return currentValue >= targetValue ? 100 : 0;
    }

    // Calculate actual percentage (can exceed 100%)
    const actualProgress = ((currentValue - startValue) / (targetValue - startValue)) * 100;
    return Math.round(actualProgress);
  };

  const getChartOption = () => {
    const currentValue = selectedKeyMetric?.metrics?.length === 0 ? 0 : selectedKeyMetric?.metrics[selectedKeyMetric?.metrics?.length - 1].value;
    const targetValue = selectedKeyMetric?.targetValue;
    const startValue = selectedKeyMetric?.startValue || 0;
    const metrics = selectedKeyMetric?.metrics || [];

    return {
      title: {
        text: selectedKeyMetric?.name || 'Key Metric Progress',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#374151'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['Current Value', 'Target Value', 'Start Value'],
        bottom: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: metrics.map((m) => formatDate2(m.date)),
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#6b7280',
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
          color: '#6b7280',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6'
          }
        }
      },
      series: [
        {
          name: 'Current Value',
          type: 'line',
          data: metrics.map((m) => m.value),
          smooth: true,
          lineStyle: {
            color: '#3b82f6',
            width: 3
          },
          itemStyle: {
            color: '#3b82f6'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(59, 130, 246, 0.3)'
              }, {
                offset: 1, color: 'rgba(59, 130, 246, 0.05)'
              }]
            }
          }
        },
        {
          name: 'Target Value',
          type: 'line',
          data: new Array(metrics.length).fill(targetValue),
          lineStyle: {
            color: '#10b981',
            width: 2,
            type: 'dashed'
          },
          itemStyle: {
            color: '#10b981'
          },
          symbol: 'none'
        },
        {
          name: 'Start Value',
          type: 'line',
          data: new Array(metrics.length).fill(startValue),
          lineStyle: {
            color: '#f59e0b',
            width: 2,
            type: 'dashed'
          },
          itemStyle: {
            color: '#f59e0b'
          },
          symbol: 'none'
        }
      ]
    };
  };

  return (
    <div className="space-y-4">
      {showLoader ? (
        /* Skeleton Loader */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-2">
                    <div className="skeleton-placeholder h-6 w-64"></div>
                    <div className="skeleton-placeholder h-4 w-32"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="skeleton-placeholder h-8 w-16"></div>
                    <div className="skeleton-placeholder h-8 w-16"></div>
                  </div>
                </div>
                <div className="space-y-4">
    <div>
                    <div className="skeleton-placeholder h-4 w-20 mb-2"></div>
                    <div className="skeleton-placeholder h-4 w-full"></div>
                    <div className="skeleton-placeholder h-4 w-3/4"></div>
          </div>
                  <div className="flex gap-8">
                    <div>
                      <div className="skeleton-placeholder h-4 w-16 mb-1"></div>
                      <div className="skeleton-placeholder h-4 w-24"></div>
                    </div>
                    <div>
                      <div className="skeleton-placeholder h-4 w-20 mb-1"></div>
                      <div className="skeleton-placeholder h-6 w-16"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metric Goals Skeleton */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="skeleton-placeholder h-6 w-32"></div>
                <div className="skeleton-placeholder h-8 w-32"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="skeleton-placeholder h-48 w-full mb-4"></div>
                    <div className="skeleton-placeholder h-4 w-16 mb-2"></div>
                    <div className="skeleton-placeholder h-2 w-full"></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <div className="skeleton-placeholder h-4 w-20 mb-2"></div>
                          <div className="skeleton-placeholder h-8 w-16"></div>
                        </div>
                        <div className="skeleton-placeholder h-8 w-full"></div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="skeleton-placeholder h-4 w-20 mb-2"></div>
                          <div className="skeleton-placeholder h-8 w-16"></div>
                        </div>
                        <div className="skeleton-placeholder h-8 w-full"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
          </div>

            {/* Ideas Section Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="skeleton-placeholder h-6 w-16"></div>
                  <div className="skeleton-placeholder h-8 w-32"></div>
              </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="skeleton-placeholder h-10 w-10 rounded-full"></div>
                        <div className="flex-1">
                          <div className="skeleton-placeholder h-4 w-32 mb-1"></div>
                          <div className="skeleton-placeholder h-3 w-24"></div>
            </div>
                      </div>
                      <div className="skeleton-placeholder h-6 w-8"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tests Section Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="skeleton-placeholder h-6 w-16"></div>
                </div>
                <div className="space-y-0 border border-gray-200 rounded-lg">
                  {[1, 2].map((i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 py-4 px-4 border-b last:border-0">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="skeleton-placeholder h-8 w-8 rounded-full"></div>
                        <div className="skeleton-placeholder h-4 w-24"></div>
              </div>
                      <div className="col-span-2">
                        <div className="skeleton-placeholder h-4 w-12"></div>
            </div>
                      <div className="col-span-2">
                        <div className="skeleton-placeholder h-4 w-16"></div>
          </div>
                      <div className="col-span-2">
                        <div className="skeleton-placeholder h-6 w-16"></div>
                      </div>
                      <div className="col-span-1">
                        <div className="skeleton-placeholder h-3 w-12"></div>
                      </div>
                      <div className="col-span-1">
                        <div className="skeleton-placeholder h-6 w-8"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section Skeleton */}
            <div className="mt-8">
              <div className="skeleton-placeholder h-6 w-20 mb-4"></div>
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="flex gap-3 mb-4">
                    <div className="skeleton-placeholder h-10 w-10 rounded-full"></div>
                    <div className="skeleton-placeholder h-12 flex-1"></div>
                  </div>
                  <div className="flex justify-end">
                    <div className="skeleton-placeholder h-8 w-20"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Activity Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="skeleton-placeholder h-4 w-24 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="skeleton-placeholder h-6 w-6 rounded-full"></div>
                      <div className="flex-1">
                        <div className="skeleton-placeholder h-4 w-32 mb-1"></div>
                        <div className="skeleton-placeholder h-3 w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Related Ideas Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="skeleton-placeholder h-4 w-24 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="pb-3 border-b last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="skeleton-placeholder h-4 w-24"></div>
                        <div className="skeleton-placeholder h-5 w-6"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="skeleton-placeholder h-5 w-5 rounded-full"></div>
                        <div className="skeleton-placeholder h-3 w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Actual Content */
        <div>
          {/* Breadcrumbs */}
          <div className="mb-4 px-6 py-3 text-sm text-gray-600">
            <span className="cursor-pointer hover:text-gray-900" onClick={() => navigate('/projects')}>Projects</span>
            <span className="mx-2">&gt;</span>
            <span className="cursor-pointer hover:text-gray-900" onClick={() => navigate(`/projects/${projectId}`)}>{openedProject?.name}</span>
            <span className="mx-2">&gt;</span>
            <span className="text-foreground font-medium">Goals</span>
            <span className="mx-2">&gt;</span>
            <span className="font-medium text-foreground">{singleGoalInfo?.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="p-6">
              {/* Header with Actions */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">{singleGoalInfo?.name}</h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated {formatTime(singleGoalInfo?.updatedAt)} by {singleGoalInfo?.updatedBy?.firstName || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                      onClick={() => {
                      setselectedTab("About Goal");
                      dispatch(updateSelectedGoal(singleGoalInfo));
                      setIsCreateGoalDialogOpen(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-red-600 hover:text-red-700"
                    onClick={() => {
                      dispatch(updateSelectedGoal(singleGoalInfo));
                      dispatch(updateShowDeleteGoalDialog(true));
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                      </div>
                    </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm text-foreground leading-relaxed">{singleGoalInfo?.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-2">Created On</h3>
                    <p className="text-sm text-foreground">{formatTime(singleGoalInfo?.createdAt)}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-2">Confidence Meter</h3>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs font-medium">
                      {singleGoalInfo?.confidence || 'Not Set'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* Metric Goals Section */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Metric Goals</h3>
                <div className="flex items-center gap-2">
                  <Select defaultValue="30days">
                    <SelectTrigger className="w-28 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">7 days</SelectItem>
                      <SelectItem value="30days">30 days</SelectItem>
                      <SelectItem value="90days">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasPermission_create_goals() && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setselectedTab("Key Metrics");
                        dispatch(updateSelectedGoal(singleGoalInfo));
                        setIsCreateGoalDialogOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Metric
                    </Button>
                  )}
                </div>
              </div>

              {ProjectsMenus.length !== 0 && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Currently Viewing:</span>
                      <Select
                        value={selectedMenu?.id}
                        onValueChange={(value) => {
                          const menu = ProjectsMenus.find(m => m.id === value);
                          const index = ProjectsMenus.findIndex(m => m.id === value);
                          setselectedMenu(menu);
                          setselectedKeyMetricIndex(index);
                        }}
                      >
                        <SelectTrigger className="w-auto h-7 text-xs border-0 bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ProjectsMenus.map((menu) => (
                            <SelectItem key={menu.id} value={menu.id}>{menu.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setselectedTab("Key Metrics");
                        dispatch(updateSelectedGoal(singleGoalInfo));
                        setIsCreateGoalDialogOpen(true);
                      }}
                      title="Edit metric"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Current Metric Summary */}
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold">
                      {selectedKeyMetric?.metrics?.length === 0 ? 0 : selectedKeyMetric?.metrics[selectedKeyMetric?.metrics?.length - 1].value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      of {selectedKeyMetric?.targetValue} target
                    </div>
                    <Badge
                      variant={getActualProgressPercent() >= 80 ? "default" : getActualProgressPercent() >= 50 ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {getActualProgressPercent().toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="h-64 bg-white rounded-lg border">
                <ReactECharts
                  option={getChartOption()}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>

              {/* Progress Summary */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm font-medium text-foreground">Progress</span>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold leading-none">{getActualProgressPercent().toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedKeyMetric?.metrics?.length === 0 ? 0 : selectedKeyMetric?.metrics[selectedKeyMetric?.metrics?.length - 1].value} of {selectedKeyMetric?.targetValue}
                    </div>
                  </div>
                </div>

                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      getActualProgressPercent() > 100
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : getActualProgressPercent() >= 80
                          ? 'bg-gradient-to-r from-green-400 to-green-600'
                          : getActualProgressPercent() >= 50
                            ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                            : 'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${Math.min(keymetricProgressPercent(), 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={getActualProgressPercent() > 100 ? "default" : getActualProgressPercent() >= 80 ? "secondary" : "outline"}
                    className={`text-xs ${
                      getActualProgressPercent() > 100
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : getActualProgressPercent() >= 80
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}
                  >
                    {getActualProgressPercent() > 100 ? 'Target Exceeded' : getActualProgressPercent() >= 80 ? 'On Track' : 'Needs Attention'}
                  </Badge>
                  {selectedKeyMetric?.targetValue - (selectedKeyMetric?.metrics?.length === 0 ? 0 : selectedKeyMetric?.metrics[selectedKeyMetric?.metrics?.length - 1].value) > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {(selectedKeyMetric?.targetValue - (selectedKeyMetric?.metrics?.length === 0 ? 0 : selectedKeyMetric?.metrics[selectedKeyMetric?.metrics?.length - 1].value)).toFixed(1)} to go
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Check-ins Section */}
        {ProjectsMenus.length !== 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Daily Check-ins</h3>
                    {hasPermission_create_goals() && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          dispatch(updateSelectedKeyMetric(selectedKeyMetric));
                          setIsUpdateMetricDialogOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Entry
                      </Button>
                    )}
                  </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white border-b">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Value</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Change</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Updated</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Member</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Note</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedKeyMetric?.metrics?.length > 0 ? (
                        selectedKeyMetric.metrics.map((metricUpdate, index) => {
                          const previousValue = index > 0 ? selectedKeyMetric.metrics[index - 1].value : selectedKeyMetric.startValue || 0;
                          const change = metricUpdate.value - previousValue;
                          const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';

                          return (
                            <tr className="border-b hover:bg-gray-50" key={metricUpdate?._id}>
                              <td className="py-3 px-4 text-sm font-medium">{metricUpdate?.value}</td>
                              <td className={`py-3 px-4 text-sm font-semibold ${changeColor}`}>
                                {change > 0 && '+'}{change.toFixed(1)}
                              </td>
                              <td className="py-3 px-4 text-sm">{formatDate2(metricUpdate?.updatedAt)}</td>
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={`${backendServerBaseURL}/${metricUpdate?.createdBy?.avatar || metricUpdate?.updatedBy?.avatar || 'uploads/default.png'}`}
                                    className="w-6 h-6 rounded-full object-cover"
                                    alt=""
                                    onError={(e) => {
                                      e.target.src = `${backendServerBaseURL}/uploads/default.png`;
                                    }}
                                  />
                                  <span className="text-sm">
                                    {metricUpdate?.createdBy?.firstName || metricUpdate?.updatedBy?.firstName || ''} {metricUpdate?.createdBy?.lastName || metricUpdate?.updatedBy?.lastName || ''}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">-</td>
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <button
                                    className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      dispatch(updateSelectedKeyMetric(metricUpdate));
                                      setIsEditMetricValueDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 text-gray-600" />
                                  </button>
                                  <button
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    onClick={() => {
                                      dispatch(deleteKeyMetricValue({
                                        keymetricId: metricUpdate?._id,
                                        goalId: goalId,
                                      }));
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-gray-600" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-12">
                            <div className="text-center space-y-4">
                              <div className="flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                  <BarChart3 className="h-8 w-8 text-black" />
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium mb-1">
                                  No {selectedKeyMetric?.name} entries yet
                                </h3>
                                <p className="text-xs text-muted-foreground mb-4">
                                  Start tracking your {selectedKeyMetric?.name?.toLowerCase()} progress by adding your first value.
                                  <br />
                                  Target: {selectedKeyMetric?.targetValue}{selectedKeyMetric?.unit || '%'}
                                </p>
                                {hasPermission_create_goals() && (
                                  <Button
                                    onClick={() => {
                                      dispatch(updateSelectedKeyMetric(selectedKeyMetric));
                                      setIsEditMetricValueDialogOpen(true);
                                    }}
                                    size="sm"
                                    className="bg-black hover:bg-gray-800 text-white"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add First Entry
                                  </Button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </CardContent>
          </Card>
        )}

            </div>
        {/* Left Column End */}

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
                <Badge className="bg-gray-100 text-gray-800 text-xs">
                  {generateGoalActivities().length}
                </Badge>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {generateGoalActivities().slice(0, 10).map((activity) => {
                  const IconComponent = activity.icon;
                  // Normalize avatar path
                  const avatarPath = activity.user?.avatar 
                    ? (activity.user.avatar.startsWith('/') ? activity.user.avatar : `/${activity.user.avatar}`)
                    : '/uploads/default.png';
                  const avatarUrl = `${backendServerBaseURL}${avatarPath}`;
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="relative">
                        <img
                          src={avatarUrl}
                          className="w-6 h-6 rounded-full flex-shrink-0 object-cover"
                          alt=""
                          onError={(e) => {
                            e.target.src = `${backendServerBaseURL}/uploads/default.png`;
                          }}
                        />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-white border border-gray-200 flex items-center justify-center`}>
                          <IconComponent className={`w-2 h-2 ${activity.color}`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight m-0">
                          <span className="font-semibold">{activity.user?.firstName} {activity.user?.lastName}</span> {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground truncate leading-tight m-0 mt-1" title={activity.description}>
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground leading-tight m-0 mt-1">{moment(activity.timestamp).fromNow()}</p>
                      </div>
                    </div>
                  );
                })}
                {generateGoalActivities().length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ideas */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Ideas</h3>
                {hasPermission_create_ideas() && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      dispatch(updateSelectedIdea(null));
                      setIsCreateIdeaDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Suggest
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {singleGoalInfo?.ideas && singleGoalInfo.ideas.length > 0 ? (
                  singleGoalInfo.ideas.slice(0, 5).map((idea) => (
                    <div
                      key={idea._id}
                      className="pb-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                      onClick={() => {
                        dispatch(updateSelectedIdea(idea));
                        navigate(`/projects/${projectId}/ideas/${idea._id}`);
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium truncate flex-1">{idea.name}</p>
                        <span className="text-xs text-muted-foreground ml-2">ICE: {idea.score}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{idea.status || 'Activation'}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {idea.createdBy?.firstName?.charAt(0)}. {idea.createdBy?.lastName}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No ideas yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tests */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Tests</h3>
              <div className="space-y-3">
                {singleGoalInfo?.tests && singleGoalInfo.tests.length > 0 ? (
                  singleGoalInfo.tests.slice(0, 5).map((test) => (
                    <div
                      key={test._id}
                      className="pb-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                      onClick={() => {
                        navigate(`/projects/${projectId}/tests/${test._id}`);
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium truncate flex-1">{test.name}</p>
                        <span className="text-xs text-green-600 font-medium ml-2">+12.3%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{test.status || 'Running'}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No tests yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Learnings */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Learnings</h3>
              <div className="space-y-3">
                {singleGoalInfo?.learnings && singleGoalInfo.learnings.length > 0 ? (
                  singleGoalInfo.learnings.slice(0, 5).map((learning) => (
                    <div
                      key={learning._id}
                      className="pb-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                      onClick={() => {
                        navigate(`/projects/${projectId}/learnings/${learning._id}`);
                      }}
                    >
                      <p className="text-sm font-medium truncate mb-2">{learning.name || learning.title}</p>
                      <Badge className={`text-xs ${
                        learning.impact === 'High' ? 'bg-black text-white' :
                        learning.impact === 'Medium' ? 'bg-gray-200 text-gray-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {learning.impact || 'High'} Impact
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No learnings yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Right Column End */}
      </div>
      {/* Grid End */}

      {/* Comments Section - Full Width */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Comments</h3>
            <Badge variant="outline" className="text-xs">
              {singleGoalInfo?.comments?.length || 0} comments
            </Badge>
          </div>

          {hasPermission_create_comments() && (
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <img
                  src={`${backendServerBaseURL}/${me?.avatar}`}
                  className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                  alt=""
                />
                <div className="flex-1 relative">
                  <Textarea
                    id="comment-textarea"
                    placeholder="Share updates, ask questions, or mention teammates with @..."
                    value={comment}
                    onChange={(e) => {
                      const value = e.target.value;
                      const cursorPos = e.target.selectionStart;
                      setcomment(value);
                      setCursorPosition(cursorPos);

                      // Check for @ mentions
                      const textBeforeCursor = value.substring(0, cursorPos);
                      const atIndex = textBeforeCursor.lastIndexOf('@');

                      if (atIndex !== -1 && atIndex === textBeforeCursor.length - 1) {
                        // Just typed @
                        setShowMentionDropdown(true);
                        setMentionQuery('');
                      } else if (atIndex !== -1) {
                        const query = textBeforeCursor.substring(atIndex + 1);
                        if (query.includes(' ') || query.length === 0) {
                          setShowMentionDropdown(false);
                        } else {
                          setShowMentionDropdown(true);
                          setMentionQuery(query);
                        }
                      } else {
                        setShowMentionDropdown(false);
                      }
                    }}
                    className="min-h-[80px] text-sm transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowMentionDropdown(false);
                      }
                      // Handle keyboard shortcuts
                      if (e.ctrlKey || e.metaKey) {
                        if (e.key === 'b') {
                          e.preventDefault();
                          handleBold();
                        } else if (e.key === 'i') {
                          e.preventDefault();
                          handleItalic();
                        }
                      }
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'hsl(var(--foreground))';
                      const button = document.getElementById('comment-submit-button');
                      if (button) {
                        button.classList.add('bg-foreground', 'text-background');
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      const button = document.getElementById('comment-submit-button');
                      if (button) {
                        button.classList.remove('bg-foreground', 'text-background');
                      }
                    }}
                  />

                  {/* Mention Dropdown - Improved positioning */}
                  {showMentionDropdown && projectUsers && projectUsers.length > 0 && (() => {
                    const filteredMembers = projectUsers.filter(member =>
                      `${member.firstName} ${member.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                      member.email?.toLowerCase().includes(mentionQuery.toLowerCase())
                    );
                    return filteredMembers.length > 0 && (
                      <div 
                        className="absolute left-0 right-0 bg-background border border-border rounded-md shadow-xl z-50 max-h-48 overflow-y-auto mt-1"
                        style={{
                          bottom: 'calc(100% + 4px)',
                          maxWidth: '320px'
                        }}
                      >
                        <div className="py-1">
                          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border/50">
                            Mention a teammate
                          </div>
                          {filteredMembers.map((member, index) => (
                            <button
                              key={member._id || member.id}
                              onClick={() => {
                                const textBeforeCursor = comment.substring(0, cursorPosition);
                                const atIndex = textBeforeCursor.lastIndexOf('@');
                                const textAfterMention = comment.substring(cursorPosition);
                                const newText = comment.substring(0, atIndex) + `@${member.firstName} ${member.lastName} ` + textAfterMention;
                                setcomment(newText);
                                setShowMentionDropdown(false);
                                setMentionQuery('');
                                
                                // Focus back to textarea
                                setTimeout(() => {
                                  const textarea = document.getElementById('comment-textarea');
                                  if (textarea) {
                                    const newCursorPos = atIndex + member.firstName.length + member.lastName.length + 3;
                                    textarea.setSelectionRange(newCursorPos, newCursorPos);
                                    textarea.focus();
                                  }
                                }, 0);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-accent/50 text-left transition-colors ${
                                index === 0 ? 'bg-accent/30' : ''
                              }`}
                            >
                              <img
                                src={`${backendServerBaseURL}/${member.avatar}`}
                                className="w-7 h-7 rounded-full"
                                alt=""
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{member.firstName} {member.lastName}</div>
                                <div className="text-xs text-muted-foreground">{member.email || ''}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Formatting Toolbar */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={handleBold}
                        title="Bold (Ctrl+B)"
                        type="button"
                      >
                        <Bold className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={handleItalic}
                        title="Italic (Ctrl+I)"
                        type="button"
                      >
                        <Italic className="h-3 w-3" />
                      </Button>
                      <div className="w-px h-4 bg-border mx-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setcomment(comment + '@');
                          document.getElementById('comment-textarea')?.focus();
                        }}
                        type="button"
                      >
                        <AtSign className="h-3 w-3 mr-1" />
                        Mention
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {comment.length}/500
                      </span>
                      <Button
                        id="comment-submit-button"
                        size="sm"
                        className="h-7 text-xs transition-colors"
                        disabled={!comment.trim() || comment.length > 500 || isSubmitting}
                        onClick={async () => {
                          if (isSubmitting) return;
                          setisSubmitting(true);
                          try {
                            await dispatch(addGoalComment({ goalId, comment }));
                            setcomment("");
                          } catch (error) {
                            console.error("Error adding comment:", error);
                          } finally {
                            setisSubmitting(false);
                          }
                        }}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        {isSubmitting ? "Sending..." : "Comment"}
                      </Button>
                    </div>
                  </div>

                  {/* Helper Text */}
                  <div className="mt-1 text-xs text-muted-foreground">
                    Use Ctrl+B for bold, Ctrl+I for italic, @ to mention teammates
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Saved Comments */}
          {hasPermission_create_comments() && (
            <div className="space-y-4">
              {singleGoalInfo?.comments?.map((c) => {
                // Extract mentions from comment
                const mentionRegex = /@(\w+\s+\w+)/g;
                const mentions = [];
                let match;
                while ((match = mentionRegex.exec(c.comment)) !== null) {
                  mentions.push(match[1]);
                }

                return (
                  <div key={c._id} className="flex items-start gap-3">
                    <img
                      src={`${backendServerBaseURL}/${c.createdBy.avatar}`}
                      className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                      alt=""
                    />
                    <div className="flex-1">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{`${c.createdBy.firstName} ${c.createdBy.lastName}`}</span>
                            <span className="text-xs text-muted-foreground">
                              {moment(new Date(c.createdAt)).fromNow()}
                            </span>
                          </div>
                          {/* Edit/Delete buttons for own comments */}
                          {hasPermission_create_comments() && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  seteditingComment(c._id);
                                  setcomment2(c.comment);
                                }}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                                onClick={() => {
                                  dispatch(
                                    deleteGoalComment({
                                      goalId,
                                      commentId: c._id,
                                    })
                                  );
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {editingComment === c._id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={comment2}
                              onChange={(e) => setcomment2(e.target.value)}
                              className="text-sm min-h-[60px] transition-colors"
                              onKeyDown={(e) => {
                                // Handle keyboard shortcuts for edit mode
                                if (e.ctrlKey || e.metaKey) {
                                  if (e.key === 'b') {
                                    e.preventDefault();
                                    const textarea = e.target;
                                    const start = textarea.selectionStart;
                                    const end = textarea.selectionEnd;
                                    const selectedText = comment2.substring(start, end);
                                    const newText = comment2.substring(0, start) +
                                                   `**${selectedText || 'bold text'}**` +
                                                   comment2.substring(end);
                                    setcomment2(newText);
                                  } else if (e.key === 'i') {
                                    e.preventDefault();
                                    const textarea = e.target;
                                    const start = textarea.selectionStart;
                                    const end = textarea.selectionEnd;
                                    const selectedText = comment2.substring(start, end);
                                    const newText = comment2.substring(0, start) +
                                                   `*${selectedText || 'italic text'}*` +
                                                   comment2.substring(end);
                                    setcomment2(newText);
                                  }
                                }
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = 'hsl(var(--foreground))';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = '';
                              }}
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => {
                                  dispatch(
                                    updateGoalComment({
                                      commentId: c._id,
                                      comment: comment2,
                                      goalId,
                                    })
                                  );
                                  seteditingComment(0);
                                  setcomment2('');
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => {
                                  seteditingComment(0);
                                  setcomment2('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className="text-sm"
                              dangerouslySetInnerHTML={{ __html: c.comment ? swapTags(c.comment) : '' }}
                            />
                            {mentions.length > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                {mentions.map((mention, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-transparent">
                                    @{mention}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <UpdateMetricDialog 
        open={isUpdateMetricDialogOpen} 
        onOpenChange={setIsUpdateMetricDialogOpen} 
      />
      <CreateNewGoalDialog
        openRequestIdeaDialog={() => {}}
        selectedTab={selectedTab}
        setselectedTab={setselectedTab}
        open={isCreateGoalDialogOpen}
        onOpenChange={setIsCreateGoalDialogOpen}
      />
      <InviteCollaboratorsDialog />
      <CreateNewIdeaDialog 
        selectedGoal={singleGoalInfo} 
        isOpen={isCreateIdeaDialogOpen} 
        onClose={() => setIsCreateIdeaDialogOpen(false)} 
      />
      <EditMetricValueDialog 
        open={isEditMetricValueDialogOpen} 
        onOpenChange={setIsEditMetricValueDialogOpen} 
      />
      <DeleteGoalDialog />
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
        </div>
      )}
    </div>
  );
}

export default GoalInfo;
