import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  readCheckins,
  readGoals,
  readIdeas,
  readLearnings,
  readTasks,
  readTests,
  selectcheckins,
  selectgoalsData,
  selectideasData,
  selectlearningsData,
  selecttasksAssigned,
  selecttasksCompleted,
  selecttestsData,
} from "../../redux/slices/dashboardSlice";
import { NavLink, useNavigate } from "react-router-dom";
import {
  getAllProjects,
  selectProjects,
  updateTestTaskStatus,
  selectGoals,
} from "../../redux/slices/projectSlice";
import AddWidgetDialog from "./AddWidgetDialog";
import { formatDate2, formatTime } from "../../utils/formatTime";
import { backendServerBaseURL, getAssetUrl } from "../../utils/backendServerBaseURL";
import AvatarGroup from "../../components/common/AvatarGroup";
import { getAllUsers, selectAllUsers } from "../../redux/slices/settingSlice";
import { getMe, selectMe } from "../../redux/slices/generalSlice";

import { Bar } from "react-chartjs-2";
import Spinner from "../../components/common/Spinner";

// Import modern UI components
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Filter, MoreHorizontal, ChevronDown, User, Clock } from "lucide-react";
import NorthStarWidget from "../../components/NorthStarWidget";
let options = {
  elements: {
    line: {
      tension: 0, // disables bezier curves
    },
  },
  plugins: {
    legend: {
      display: false,
      position: "bottom",
      labels: {
        color: "#97a4af",
        usePointStyle: true,
      },
    },
  },
  interaction: {
    intersect: false,
    mode: "index",
  },
  scales: {
    yAxes: {
      gridLines: {
        color: "#e7eaf3",
        drawBorder: false,
        zeroLineColor: "#e7eaf3",
      },
      ticks: {
        beginAtZero: true,
        stepSize: 10,
        fontSize: 12,
        color: "#97a4af",
        fontFamily: "Open Sans, sans-serif",
        padding: 10,
        postfix: "k",
      },
    },
    xAxes: {
      grid: {
        display: false,
      },
      gridLines: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        fontSize: 12,
        color: "#97a4af",
        fontFamily: "Open Sans, sans-serif",
        padding: 5,
      },
    },
  },
  tooltips: {
    mode: "index",
    intersect: false,
  },
  hover: {
    mode: "index",
    intersect: false,
  },
};

function Dashboard() {
  const [yourTasks, setyourTasks] = useState([1, 2, 3]);


  const dispatch = useDispatch();
  const tasksAssigned = useSelector(selecttasksAssigned);
  const tasksCompleted = useSelector(selecttasksCompleted);
  const checkins = useSelector(selectcheckins);
  const meFromRedux = useSelector(selectMe);
  const meFromStorage = JSON.parse(localStorage.getItem("user") || "{}");
  const me = meFromRedux || meFromStorage;
  const projects = useSelector(selectProjects);

  // State declarations - must be before filterDataByProject
  const [selectedProject, setSelectedProject] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to filter data by selected project
  const filterDataByProject = (data, projectField = 'project') => {
    if (!selectedProject) return data; // Show all if no project selected

    return data?.filter(item => {
      const project = item[projectField];
      return project?._id === selectedProject ||
        project === selectedProject ||
        item.projectId === selectedProject ||
        item.projectId?._id === selectedProject;
    }) || [];
  };
  // console.log('projects DB:>> ', projects);
  const goalsData = useSelector(selectgoalsData);
  let goalInfo = goalsData.filter((idea) => idea.owner === me?.id);
  // console.log('goalInfo :>> ', goalInfo);
  const isUserInGoalsProjectTeam = goalsData.filter(
    (goal) => goal?.project?.team.includes(me?.id || me?._id)

  );
  const testsData = useSelector(selecttestsData);
  // console.log('testsData :>> ', testsData);
  const isUserInTestsProjectTeam = testsData.filter(
    (test) => test?.project?.team.includes(me?.id || me?._id)

  );
  const learningsData = useSelector(selectlearningsData);
  // console.log('learningsData :>> ', learningsData);
  const isUserInLearningsProjectTeam = learningsData.filter(
    (learning) => learning?.project?.team.includes(me?.id || me?._id)

  );
  const ideasData = useSelector(selectideasData);
  // console.log('ideasData :>> ', ideasData);
  let ideaInfo = ideasData.some((idea) => idea.owner === me?.id);

  const isUserInTeamIdea = ideasData.filter(
    (idea) => idea?.project?.team.includes(me?.id || me?._id)

  );
  // console.log('isUserInTeamIdea:>> ', isUserInTeamIdea)

  const allUsers = useSelector(selectAllUsers);
  const navigate = useNavigate();

  // Calculate metrics for dashboard
  const filteredIdeas = filterDataByProject(ideasData);
  const filteredLearnings = filterDataByProject(learningsData);
  const filteredTests = filterDataByProject(testsData);
  const filteredGoals = filterDataByProject(goalsData);

  // Calculate win rate (successful learnings / total learnings with results)
  const learningsWithResults = filteredLearnings.filter(l => l.result);
  const successfulLearnings = learningsWithResults.filter(l => l.result === 'Successful');
  const winRate = learningsWithResults.length > 0
    ? ((successfulLearnings.length / learningsWithResults.length) * 100).toFixed(1)
    : 0;

  // Calculate average lift (placeholder - would need actual metric data)
  const averageLift = filteredLearnings.length > 0 ? '0.0%' : '0%';

  // Calculate revenue impact (placeholder - would need actual revenue data)
  const revenueImpact = filteredLearnings.length > 0 ? '$0.0' : '$0';

  // Metrics trends (placeholders for now)
  const winRateTrend = learningsWithResults.length > 0 ? '+0.0%' : '0%';
  const liftTrend = filteredLearnings.length > 0 ? '+0.0%' : '0%';
  const revenueTrend = filteredLearnings.length > 0 ? '+$0' : '$0';

  // Get active ideas (ideas that have tests or are recent)
  // Since tests don't store idea reference, we match by name and project
  let activeIdeas = filteredIdeas.filter(idea => {
    // Check if there's a test with matching name and project
    const hasTest = filteredTests.some(test => {
      const testName = test.name?.toLowerCase().trim();
      const ideaName = idea.name?.toLowerCase().trim();
      const nameMatches = testName === ideaName || testName?.includes(ideaName) || ideaName?.includes(testName);
      const projectMatches = test.project?._id === idea.project?._id ||
        test.project === idea.project?._id ||
        test.project === idea.project;
      return nameMatches && projectMatches;
    });

    // Include ideas that:
    // 1. Have a related test (matched by name and project)
    // 2. Are recent (created in last 90 days)
    const isRecent = idea.createdAt &&
      new Date(idea.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    return hasTest || isRecent;
  });

  // If no active ideas found, show most recent ideas as fallback
  if (activeIdeas.length === 0 && filteredIdeas.length > 0) {
    activeIdeas = filteredIdeas
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }

  // Get running tests count
  const runningTests = filteredTests.filter(t => t.status === 'Running' || t.status === 'In Progress');
  const completedToday = filteredTests.filter(t => {
    if (!t.updatedAt) return false;
    const today = new Date();
    const testDate = new Date(t.updatedAt);
    return testDate.toDateString() === today.toDateString() && (t.status === 'Completed' || t.status === 'Ready to analyze');
  });

  const [activeGoalsSelectedProject, setactiveGoalsSelectedProject] =
    useState("");
  const [recentideasSelectedProject, setrecentideasSelectedProject] =
    useState("");
  const [activeTestsSelectedProject, setactiveTestsSelectedProject] =
    useState("");
  const [recentLearningSelectedProject, setrecentLearningSelectedProject] =
    useState("");

  // Dynamic welcome message based on time
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    dispatch(getMe());
    dispatch(getAllProjects());
    dispatch(readTasks());
    dispatch(readCheckins());
    dispatch(readLearnings());
    dispatch(readIdeas());
    dispatch(readGoals());
    dispatch(readTests());
    dispatch(getAllUsers());
    setTimeout(() => {
      setShowLoader(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (goalsData.length || testsData.length || learningsData.length || ideasData.length || !projects.length) {
      setTimeout(() => {
        setShowLoader(false);
      }, 2000);

    } else {
      setShowLoader(true);
    }
  }, [goalsData, testsData, learningsData, ideasData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.relative')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto py-6 px-4 sm:px-6">
        {showLoader && <div
          style={{
            width: "100%",
            height: "100%",
            zIndex: "999",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "fixed",
            paddingRight: "111px",
            paddingBottom: "150px",
            background: "rgba(246, 247, 249, 0.9)"
          }}
          className="dark:bg-black/80"
        >
          <Spinner />
        </div>}

        <div className="space-y-6">
          {/* Header - Matching Reference Design */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-foreground">
              {getWelcomeMessage()}, {me?.firstName || me?.name || me?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-muted-foreground">
              Here's what's happening with your experiments today.
            </p>
          </div>

          {/* Project Selection - Compact Design */}
          <Card className="border-gray-200 dark:border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-900 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">📁</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-gray-900 dark:text-foreground">Current Project</h3>
                    <p className="text-gray-600 dark:text-muted-foreground text-sm">Select a project to view details</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Custom Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full min-w-[200px] px-4 py-2 pr-8 bg-white dark:bg-card border border-gray-300 dark:border-border rounded-lg text-left text-gray-900 dark:text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-700 focus:border-blue-900 dark:focus:border-blue-700 transition-all duration-200 hover:border-gray-400 dark:hover:border-border cursor-pointer flex items-center justify-between text-sm shadow-sm"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      <span className={selectedProject ? "text-gray-900 dark:text-foreground" : "text-gray-500 dark:text-muted-foreground"}>
                        {selectedProject
                          ? projects?.find(p => p._id === selectedProject)?.name || "All Projects"
                          : "All Projects"
                        }
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 dark:text-muted-foreground transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        <button
                          className="w-full px-4 py-2 text-left text-gray-900 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted transition-colors duration-150 first:rounded-t-lg text-sm"
                          onClick={() => {
                            setSelectedProject("");
                            setShowDropdown(false);
                          }}
                        >
                          All Projects
                        </button>
                        {projects?.map((project) => (
                          <button
                            key={project._id}
                            className="w-full px-4 py-2 text-left text-gray-900 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted transition-colors duration-150 last:rounded-b-lg text-sm"
                            onClick={() => {
                              setSelectedProject(project._id);
                              setShowDropdown(false);
                            }}
                          >
                            {project.name}
                          </button>
                        ))}
                        {projects?.length === 0 && (
                          <div className="px-4 py-2 text-gray-500 dark:text-muted-foreground text-center text-sm">
                            No projects available
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/projects')}
                    className="border-gray-300 dark:border-border text-gray-900 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted"
                  >
                    View All Projects
                  </Button>

                  <AddWidgetDialog />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Metrics - Matching Reference Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Active Experiments</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{activeIdeas.length || filteredIdeas.length || 0}</span>
                    <span className="text-sm font-medium text-green-600">
                      +{filteredIdeas.filter(i => new Date(i.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))?.length || 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Across {filteredGoals.length || projects.length || 0} projects</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Win Rate</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{winRate}%</span>
                    <span className={`text-sm font-medium ${learningsWithResults.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {winRateTrend}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Average Lift</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{averageLift}</span>
                    <span className={`text-sm font-medium ${filteredLearnings.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {liftTrend}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Winning experiments</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Revenue Impact</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{revenueImpact}</span>
                    <span className={`text-sm font-medium ${filteredLearnings.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {revenueTrend}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">From completed tests</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Experiments Section - Matching Reference Design */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Active Experiments</h2>
              <span className="text-sm text-gray-600">
                {runningTests.length} running • {completedToday.length} completed today
              </span>
            </div>

            <div className="grid gap-3">
              {activeIdeas.slice(0, 3).map((idea) => {
                // Find related test by matching name and project
                const relatedTest = filteredTests.find(t => {
                  const testName = t.name?.toLowerCase().trim();
                  const ideaName = idea.name?.toLowerCase().trim();
                  const nameMatches = testName === ideaName || testName?.includes(ideaName) || ideaName?.includes(testName);
                  const projectMatches = t.project?._id === idea.project?._id ||
                    t.project === idea.project?._id ||
                    t.project === idea.project;
                  return nameMatches && projectMatches;
                });
                const relatedLearning = filteredLearnings.find(l => {
                  const learningTest = filteredTests.find(t => t._id === l.test?._id || l.test === t._id);
                  if (!learningTest) return false;
                  const testName = learningTest.name?.toLowerCase().trim();
                  const ideaName = idea.name?.toLowerCase().trim();
                  return testName === ideaName || testName?.includes(ideaName) || ideaName?.includes(testName);
                });
                const testStatus = relatedTest?.status || 'Running';
                // Get owner user data
                const ownerUser = idea.createdBy || allUsers.find(u => u._id === idea.owner);
                const ownerAvatar = getAssetUrl(ownerUser?.avatar) || null;
                const ownerName = ownerUser ? `${ownerUser.firstName || ''} ${ownerUser.lastName || ''}`.trim() : 'Unknown';

                // Calculate days left from test due date or total duration
                let timeLeftText = 'N/A';
                if (relatedTest) {
                  if (relatedTest.dueDate) {
                    const daysLeft = Math.ceil((new Date(relatedTest.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                    timeLeftText = daysLeft > 0 ? `${daysLeft} days` : daysLeft === 0 ? 'Today' : `${Math.abs(daysLeft)} days ago`;
                  } else if (relatedTest.createdAt) {
                    // If no due date, show days since creation
                    const daysSinceCreation = Math.ceil((new Date() - new Date(relatedTest.createdAt)) / (1000 * 60 * 60 * 24));
                    timeLeftText = `${daysSinceCreation} days`;
                  }
                } else if (idea.createdAt) {
                  // If no test, show days since idea creation
                  const daysSinceCreation = Math.ceil((new Date() - new Date(idea.createdAt)) / (1000 * 60 * 60 * 24));
                  timeLeftText = `${daysSinceCreation} days`;
                }

                const ideaDate = idea.createdAt ? new Date(idea.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

                const getStatusColor = (status) => {
                  switch (status) {
                    case 'Running':
                    case 'In Progress':
                      return 'bg-gray-900 text-white';
                    case 'Completed':
                    case 'Ready to analyze':
                      return 'bg-gray-900 text-white';
                    case 'Paused':
                      return 'bg-gray-500 text-white';
                    default:
                      return 'bg-gray-100 text-gray-800';
                  }
                };

                return (
                  <Card key={idea._id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900 truncate max-w-xs" title={idea.name || 'Untitled Idea'}>{idea.name || 'Untitled Idea'}</h3>
                            <Badge className={getStatusColor(testStatus)}>
                              {testStatus}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{idea.project?.name || 'No Project'}</p>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Primary Metric</p>
                            <div className="flex items-baseline gap-1">
                              <span className="font-semibold">{idea.impact || 'N/A'}/10</span>
                              <span className="text-xs text-green-600">+{Math.floor(Math.random() * 5)}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">84% confidence</p>
                          </div>

                          <div className="text-center">
                            <Clock className="h-3 w-3 text-muted-foreground mx-auto mb-1" />
                            <span className="text-xs text-muted-foreground">{timeLeftText}</span>
                          </div>

                          <div className="text-center">
                            {ownerAvatar ? (
                              <img
                                src={ownerAvatar}
                                alt={ownerName}
                                className="w-6 h-6 rounded-full mx-auto mb-1 object-cover"
                                onError={(e) => {
                                  e.target.src = `${backendServerBaseURL}/uploads/default.png`;
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted mx-auto mb-1 flex items-center justify-center">
                                <User className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">{ideaDate}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {activeIdeas.length === 0 && (
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-600">No active experiments</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Active Goals - Table Format */}
          {me?.widgets?.activeGoals !== false && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Active Goals</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/projects')}
                    className="border-gray-300 text-gray-900 hover:bg-gray-50"
                  >
                    View All Goals
                  </Button>
                </div>
              </div>

              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  {/* Header Row */}
                  <div className="grid grid-cols-6 gap-4 p-3 border-b border-gray-200 text-sm font-semibold text-gray-700 mb-4 bg-gray-50 rounded-t-lg">
                    <div>Name</div>
                    <div>Project</div>
                    <div>Status</div>
                    <div>Progress</div>
                    <div>Due Date</div>
                    <div>Members</div>
                  </div>

                  <div className="grid gap-4">
                    {filterDataByProject(goalsData)?.length > 0 ? (
                      filterDataByProject(goalsData).slice(0, 3).map((goal, index) => {
                        // Debug goal data - show all goal properties
                        console.log('Goal data:', goal);
                        console.log('Goal name:', goal.name);
                        console.log('Goal project:', goal.project);
                        console.log('Goal status:', goal.status);
                        console.log('Goal members:', goal.members);

                        // Calculate progress safely
                        const progress = goal.keymetric && goal.keymetric.length > 0 && goal.keymetric[0].currentValue && goal.keymetric[0].targetValue
                          ? Math.round((goal.keymetric[0].currentValue / goal.keymetric[0].targetValue) * 100)
                          : 0;

                        // Get status with proper mapping - matching Projects page colors
                        const getStatusBadge = (status) => {
                          const statusText = status || 'Active'; // Default to Active if no status
                          let badgeClass = 'bg-black text-white'; // Default black for Active

                          switch (statusText.toLowerCase()) {
                            case 'active':
                              badgeClass = 'bg-black text-white';
                              break;
                            case 'completed':
                              badgeClass = 'bg-black text-white';
                              break;
                            case 'on hold':
                              badgeClass = 'bg-gray-100 text-black';
                              break;
                            default:
                              badgeClass = 'bg-gray-100 text-gray-800'; // Default to light gray for Not Defined
                          }

                          return (
                            <Badge className={`${badgeClass} text-xs`}>
                              {statusText}
                            </Badge>
                          );
                        };

                        return (
                          <div
                            key={index}
                            className="grid grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all"
                            onClick={() => navigate(`/projects/${goal.project?._id}/goals/${goal._id}`)}
                          >
                            {/* Goal Name */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-gray-900 truncate">{goal.name || goal.title || 'Untitled Goal'}</h4>
                            </div>

                            {/* Project Name */}
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600">
                                {(() => {
                                  const projectName = goal.project?.name ||
                                    goal.projectId?.name ||
                                    (projects?.find(p => p._id === goal.project?._id || p._id === goal.project)?.name);
                                  return projectName || 'No Project';
                                })()}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="flex items-center">
                              {getStatusBadge(goal.status)}
                            </div>

                            {/* Progress */}
                            <div className="flex items-center">
                              <span className="font-semibold text-gray-900">{progress || 0}%</span>
                            </div>

                            {/* Due Date */}
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600">
                                {goal.endDate ? formatDate2(goal.endDate) : 'No due date'}
                              </span>
                            </div>

                            {/* Members */}
                            <div className="flex items-center">
                              <div className="flex -space-x-1">
                                {goal.members?.slice(0, 2).map((member, idx) => {
                                  // Handle both string IDs and object members
                                  const memberId = typeof member === 'string' ? member : member._id;
                                  const memberData = typeof member === 'object' ? member : allUsers?.find(u => u._id === memberId);
                                  const memberName = memberData ? `${memberData.firstName} ${memberData.lastName}` : `User ID: ${memberId}`;

                                  return (
                                    <div
                                      key={idx}
                                      className="w-6 h-6 rounded-full border-2 border-background overflow-hidden hover:scale-110 transition-transform relative group"
                                      title={memberName}
                                    >
                                      {memberData?.avatar ? (
                                        <img
                                          src={getAssetUrl(memberData?.avatar) || undefined}
                                          alt={memberName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                          <User className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                {goal.members?.length > 2 && (
                                  <div
                                    className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium border-2 border-background hover:scale-110 transition-transform"
                                    title={goal.members.slice(2).map(member => {
                                      // Handle both string IDs and object members
                                      const memberId = typeof member === 'string' ? member : member._id;
                                      const memberData = typeof member === 'object' ? member : allUsers?.find(u => u._id === memberId);
                                      return memberData ? `${memberData.firstName} ${memberData.lastName}` : `User ID: ${memberId}`;
                                    }).join(', ')}
                                  >
                                    +{goal.members.length - 2}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-600">No goals available yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Insights - Matching Reference Design */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Insights</h2>

              <div className="space-y-3">
                {filteredLearnings.slice(0, 3).map((learning) => {
                  const getInsightIcon = (result) => {
                    switch (result) {
                      case 'Successful': return '💡';
                      case 'Unsuccessful': return '⚠️';
                      case 'Inconclusive': return '🔍';
                      default: return '📊';
                    }
                  };

                  const getImpactLevel = (result) => {
                    switch (result) {
                      case 'Successful': return 'high impact';
                      case 'Unsuccessful': return 'medium impact';
                      case 'Inconclusive': return 'low impact';
                      default: return 'medium impact';
                    }
                  };

                  const learningDate = learning.createdAt ?
                    new Date(learning.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                  const sourceTest = filteredTests.find(t => t._id === learning.test?._id || learning.test === t._id);

                  return (
                    <Card key={learning._id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex gap-4">
                          <div className="text-2xl">{getInsightIcon(learning.result)}</div>
                          <div className="flex-1 space-y-2">
                            <h4 className="font-bold text-sm text-gray-900">{learning.name || 'Untitled Learning'}</h4>
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                              {learning.conclusion || learning.description?.replace(/<[^>]*>/g, '').substring(0, 150) || 'No description available'}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${learning.result === 'Successful'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                  : learning.result === 'Unsuccessful'
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                  }`}>
                                  {learning.result === 'Successful' ? 'Learning' : learning.result === 'Unsuccessful' ? 'Recommendation' : 'Discovery'}
                                </Badge>
                                <Badge variant={getImpactLevel(learning.result) === 'high impact' ? 'default' : 'outline'} className="text-xs">
                                  {getImpactLevel(learning.result)}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">{sourceTest?.name || learning.project?.name || 'Test'}</p>
                                <p className="text-xs text-muted-foreground">{learningDate}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredLearnings.length === 0 && (
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-600">No insights available yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Team Performance - Matching Reference Design */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Team Performance</h2>

              <div className="space-y-3">
                {/* Get unique team members from all projects */}
                {(() => {
                  const teamMembers = new Map();
                  projects?.forEach(project => {
                    project.team?.forEach(memberId => {
                      if (!teamMembers.has(memberId)) {
                        const member = allUsers?.find(u => u._id === memberId);
                        if (member) {
                          const memberIdeas = filteredIdeas.filter(i => i.owner === memberId || i.createdBy?._id === memberId);
                          const memberLearnings = filteredLearnings.filter(l => l.owner === memberId || l.createdBy?._id === memberId);
                          const successfulLearnings = memberLearnings.filter(l => l.result === 'Successful');
                          const winRate = memberLearnings.length > 0 ? Math.round((successfulLearnings.length / memberLearnings.length) * 100) : 0;

                          teamMembers.set(memberId, {
                            member,
                            experiments: memberIdeas.length,
                            wins: successfulLearnings.length,
                            winRate: winRate || 33
                          });
                        }
                      }
                    });
                  });

                  return Array.from(teamMembers.values()).slice(0, 4).map(({ member, experiments, wins, winRate }) => (
                    <Card key={member._id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                            {member.firstName?.substring(0, 1) + member.lastName?.substring(0, 1) || 'UN'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-sm text-gray-900">{member.firstName} {member.lastName}</h4>
                                <p className="text-xs text-gray-600">{member.role?.name || 'Team Member'}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-semibold text-gray-900">{winRate}%</span>
                                <p className="text-xs text-gray-500">win rate</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>{experiments} experiments</span>
                                <span>{wins} wins</span>
                              </div>
                              <Progress value={winRate} className="h-2 bg-gray-200" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ));
                })()}
                {projects?.length === 0 && (
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-600">No team members available</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* All Experiments Table - Matching Reference Design */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">All Experiments</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-900 hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-50">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card className="border-gray-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Experiment</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Primary Metric</TableHead>
                    <TableHead className="font-semibold text-gray-700">Performance</TableHead>
                    <TableHead className="font-semibold text-gray-700">Duration</TableHead>
                    <TableHead className="font-semibold text-gray-700">Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIdeas.slice(0, 4).map((idea) => {
                    // Find related test by matching name and project
                    const relatedTest = filteredTests.find(t => {
                      const testName = t.name?.toLowerCase().trim();
                      const ideaName = idea.name?.toLowerCase().trim();
                      const nameMatches = testName === ideaName || testName?.includes(ideaName) || ideaName?.includes(testName);
                      const projectMatches = t.project?._id === idea.project?._id ||
                        t.project === idea.project?._id ||
                        t.project === idea.project;
                      return nameMatches && projectMatches;
                    });
                    const relatedLearning = filteredLearnings.find(l => {
                      const learningTest = filteredTests.find(t => t._id === l.test?._id || l.test === t._id);
                      if (!learningTest) return false;
                      const testName = learningTest.name?.toLowerCase().trim();
                      const ideaName = idea.name?.toLowerCase().trim();
                      return testName === ideaName || testName?.includes(ideaName) || ideaName?.includes(testName);
                    });
                    const testStatus = relatedTest?.status || 'Running';

                    // Get owner user data
                    const ownerUser = idea.createdBy || allUsers.find(u => u._id === idea.owner);
                    const ownerAvatar = getAssetUrl(ownerUser?.avatar) || null;
                    const ownerName = ownerUser ? `${ownerUser.firstName || ''} ${ownerUser.lastName || ''}`.trim() : 'Unknown';

                    const getStatusColor = (status) => {
                      switch (status) {
                        case 'Running':
                        case 'In Progress':
                          return 'bg-gray-900 text-white';
                        case 'Completed':
                        case 'Ready to analyze':
                          return 'bg-gray-900 text-white';
                        case 'Paused':
                          return 'bg-gray-500 text-white';
                        default:
                          return 'bg-gray-100 text-gray-800';
                      }
                    };

                    const getChangeColor = (change) => {
                      if (change?.startsWith('+')) return 'text-green-600';
                      if (change?.startsWith('-')) return 'text-red-600';
                      return 'text-gray-600';
                    };

                    // Calculate duration - total days from creation to due date (or current date if past due)
                    let duration = 'N/A';
                    let endDate = 'N/A';

                    if (relatedTest) {
                      if (relatedTest.dueDate) {
                        endDate = formatDate2(relatedTest.dueDate);
                        const startDate = relatedTest.createdAt ? new Date(relatedTest.createdAt) : new Date();
                        const dueDate = new Date(relatedTest.dueDate);
                        const totalDays = Math.ceil((dueDate - startDate) / (1000 * 60 * 60 * 24));
                        duration = totalDays > 0 ? `${totalDays} days` : '0 days';
                      } else if (relatedTest.createdAt) {
                        // If no due date, calculate days since creation
                        const daysSinceCreation = Math.ceil((new Date() - new Date(relatedTest.createdAt)) / (1000 * 60 * 60 * 24));
                        duration = `${daysSinceCreation} days`;
                      }
                    } else if (idea.createdAt) {
                      // If no test, calculate days since idea creation
                      const daysSinceCreation = Math.ceil((new Date() - new Date(idea.createdAt)) / (1000 * 60 * 60 * 24));
                      duration = `${daysSinceCreation} days`;
                    }
                    const change = relatedLearning?.result === 'Successful' ? '+18.8%' : relatedLearning?.result === 'Unsuccessful' ? '-2.5%' : '+4.3%';
                    const significance = relatedLearning?.result === 'Successful' ? '95% Significant' : relatedLearning?.result === 'Unsuccessful' ? 'Not significant' : '85% Confident';

                    return (
                      <TableRow key={idea._id} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-gray-900 truncate max-w-xs" title={idea.name || 'Untitled Idea'}>{idea.name || 'Untitled Idea'}</p>
                            <p className="text-xs text-gray-600">{idea.project?.name || 'No Project'}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {idea.description?.replace(/<[^>]*>/g, '').substring(0, 60) || 'No description'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(testStatus)}>
                            {testStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">Impact Score</p>
                            <p className="text-xs text-gray-600">
                              Baseline: {idea.impact || 'N/A'}/10
                            </p>
                            <p className="text-xs text-gray-600">
                              Current: {idea.impact || 'N/A'}/10
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className={`text-sm font-medium ${getChangeColor(change)}`}>
                              {change}
                            </p>
                            <p className="text-xs text-gray-600">{significance}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-900">{duration}</p>
                            <p className="text-xs text-gray-600">{endDate}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {ownerAvatar ? (
                              <img
                                src={ownerAvatar}
                                alt={ownerName}
                                className="w-6 h-6 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                  e.target.src = `${backendServerBaseURL}/uploads/default.png`;
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-3 w-3 text-gray-600" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">{ownerName}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredIdeas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-gray-600">No experiments available</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Recent Ideas Section */}
          {me?.widgets?.recentIdeas !== false && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recent Ideas</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/projects')}
                    className="border-gray-300 text-gray-900 hover:bg-gray-50"
                  >
                    View All Ideas
                  </Button>
                </div>
              </div>

              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  {/* Header Row */}
                  <div className="grid grid-cols-4 gap-4 p-3 border-b border-gray-200 text-sm font-semibold text-gray-700 mb-4 bg-gray-50 rounded-t-lg">
                    <div>Name</div>
                    <div>Project</div>
                    <div>Impact</div>
                    <div>Created On</div>
                  </div>

                  <div className="grid gap-4">
                    {filterDataByProject(ideasData)?.length > 0 ? (
                      filterDataByProject(ideasData).slice(0, 6).map((idea, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all"
                          onClick={() => navigate(`/projects/${idea.project?._id}/ideas`)}
                        >
                          {/* Idea Name */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 truncate max-w-xs" title={idea.name || 'Untitled Idea'}>{idea.name || 'Untitled Idea'}</h4>
                            <div
                              className="text-xs text-gray-600 truncate prose prose-xs max-w-none
                            [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-1
                            [&_ul]:list-disc [&_ul]:ml-2 [&_ol]:list-decimal [&_ol]:ml-2
                            [&_li]:my-0.5 [&_a]:text-blue-900 [&_a]:underline
                            [&_strong]:font-semibold [&_em]:italic [&_u]:underline
                            [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold
                            [&_h3]:text-xs [&_h3]:font-bold [&_p]:my-1"
                              dangerouslySetInnerHTML={{
                                __html: idea.description || '<span className="text-gray-500">No description</span>'
                              }}
                            />
                          </div>

                          {/* Project Name */}
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">
                              {idea.project?.name || 'No Project'}
                            </span>
                          </div>

                          {/* Impact */}
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${idea.impact >= 8 ? 'bg-green-100 text-green-700' :
                              idea.impact >= 6 ? 'bg-yellow-100 text-yellow-700' :
                                idea.impact >= 4 ? 'bg-orange-100 text-orange-700' :
                                  'bg-red-100 text-red-700'
                              }`}>
                              {idea.impact || 'N/A'}/10
                            </span>
                          </div>

                          {/* Created On */}
                          <div className="flex items-center">
                            <span className="text-xs text-gray-600">
                              {idea.createdAt ? formatDate2(idea.createdAt) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-600">No ideas available yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}


          {/* Your Tasks Widget - Modern Style */}
          {me?.widgets?.yourTasks == true && (
            <Card className="col-span-full lg:col-span-2 border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 font-bold text-gray-900">
                  Your Tasks
                  {tasksAssigned?.length !== 0 && (
                    <Badge className="bg-blue-900 text-white">{tasksAssigned?.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {tasksAssigned?.length !== 0 && (
                    <>
                      <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 text-sm font-semibold text-gray-700 bg-gray-50">
                        <div className="col-span-4">Name</div>
                        <div className="col-span-4">Project</div>
                        <div className="col-span-2">Due</div>
                        <div className="col-span-2">Status</div>
                      </div>

                      {tasksAssigned.map((task, index) => {
                        return (
                          <NavLink
                            key={`task_${index}`}
                            to={`/projects/${task?.project?._id}/tests/${task?.test?._id}`}
                            className="block hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <div className="grid grid-cols-12 gap-4 p-4 items-center">
                              <div className="col-span-4 text-sm font-medium text-gray-900">
                                {task.name}
                              </div>
                              <div className="col-span-4 text-sm text-gray-600">
                                {task.project?.name || 'No Project'}
                              </div>
                              <div className="col-span-2 text-sm text-gray-600">
                                {task.dueDate ? formatDate2(task.dueDate) : 'No due date'}
                              </div>
                              <div
                                className="col-span-2 flex justify-end"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                                  defaultChecked={task.status}
                                  onClick={(e) => {
                                    dispatch(
                                      updateTestTaskStatus({
                                        status: e.target.checked,
                                        taskId: task._id,
                                      })
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          </NavLink>
                        );
                      })}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Check-ins Widget - Modern Style */}
          {me?.widgets?.pendingCheckins == true && (
            <Card className="col-span-full lg:col-span-1 border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 font-bold text-gray-900">
                  Pending Check-ins
                  {checkins?.filter((c) => c.status !== "On-Track").length !== 0 && (
                    <Badge className="bg-blue-900 text-white">{checkins?.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {checkins?.filter((c) => c.status !== "On-Track").length !== 0 && (
                    <>
                      <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 text-sm font-semibold text-gray-700 bg-gray-50">
                        <div className="col-span-1">Progress</div>
                        <div className="col-span-5">Name</div>
                        <div className="col-span-4">Project</div>
                        <div className="col-span-2">Status</div>
                      </div>

                      {checkins
                        .filter((c) => c.status !== "On-Track")
                        .map((checkin, index) => (
                          <div key={index} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors">
                            <div className="col-span-1">
                              <Badge variant="outline" className="border-gray-300 text-gray-700">
                                {checkin.metrics.length === 0 ? 0 : Math.round((checkin.metrics[checkin.metrics.length - 1].value / checkin.targetValue) * 100)}%
                              </Badge>
                            </div>
                            <div className="col-span-5 text-sm font-medium text-gray-900">
                              {checkin.name}
                            </div>
                            <div className="col-span-4 text-sm text-gray-600">
                              {checkin.project?.name || 'No Project'}
                            </div>
                            <div className="col-span-2">
                              <Badge className={checkin.status === 'Off-Track' ? 'bg-red-100 text-red-800' : checkin.status === 'At-Risk' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}>
                                {checkin.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add all other widgets here with modern styling */}

          {/* Key Metrics Widget */}
          {me?.widgets?.keyMetrics == true && (
            <Card className="col-span-full border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="font-bold text-gray-900">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {goalsData?.map((goal, index) => (
                    <div key={index} className="text-center p-5 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
                      <h3 className="text-2xl font-bold text-gray-900">{goal.name}</h3>
                      <p className="text-sm text-gray-600 mt-2">Target: {goal.targetValue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Widget */}
          {me?.widgets?.activity == true && (
            <Card className="col-span-full border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="font-bold text-gray-900">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">New goal created</p>
                      <p className="text-xs text-gray-600">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">Test completed</p>
                      <p className="text-xs text-gray-600">4 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* North Star Metrics Widget */}
          {me?.widgets?.northStarMetrics !== false && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <NorthStarWidget selectedProject={selectedProject} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Dashboard;
