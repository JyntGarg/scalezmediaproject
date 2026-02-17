import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import AvatarGroup from "../../../components/common/AvatarGroup";
import { getAllGoals, getProjectUsers, selectGoals, updateSelectedGoal, updateShowDeleteGoalDialog } from "../../../redux/slices/projectSlice";
import { getAllkeyMetrics } from "../../../redux/slices/settingSlice";
import { backendServerBaseURL } from "../../../utils/backendServerBaseURL";
import { formatDate } from "../../../utils/formatTime";
import { hasPermission_create_goals, isRoleAdmin, isTypeOwner, isRoleMember } from "../../../utils/permissions";
import TourModal from "../Tour/TourModal";
import CreateNewGoalDialog from "./CreateNewGoalDialog";
import DeleteGoalDialog from "./DeleteGoalDialog";
import RequestIdeaDialog from "./RequestIdeaDialog";
import { Badge } from "../../../components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Plus, ChevronRight, ChevronDown, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

function Goals() {
  const [selectedMenu, setselectedMenu] = useState("All Goals");
  const [arrowStateUpdater, setArrowStateUpdater] = useState([]);
  const navigate = useNavigate();
  const params = useParams();
  const projectId = params.projectId;
  const dispatch = useDispatch();
  const requestIdeaDialogRef = useRef();
  const goals = useSelector(selectGoals);

  console.log("goals", goals)
  const [filteredGoals, setfilteredGoals] = useState([]);
  const openedProject = JSON.parse(localStorage.getItem("openedProject", ""));
  const [selectedTab, setselectedTab] = useState("About Goal");
  const [isCreateGoalDialogOpen, setIsCreateGoalDialogOpen] = useState(false);
  const ProjectsMenus = [
    {
      name: "All Goals",
    },
    {
      name: "Active",
    },
    {
      name: "Completed",
    },
  ];

  const RightProjectsMenus = [];

  const openRequestIdeaDialog = () => {
    requestIdeaDialogRef.current.click();
  };

  const [isLoading, setIsLoading] = useState(true); // Loading state flag
  const [showSkeletonLoader, setShowSkeletonLoader] = useState(true);
  const [isLoadingActive, setIsLoadingActive] = useState(true);

  const toggleGoalExpanded = (goalId) => {
    setArrowStateUpdater((prev) => {
      if (prev.includes(goalId)) return prev.filter((id) => id !== goalId);
      return [...prev, goalId];
    });
  };



  const tabSwitch = async () => {
    if (selectedMenu === "Completed") {
      setfilteredGoals(
        goals?.filter((goal) => {
          if (
            Math.round(
              goal.keymetric.reduce(
                (partialSum, a) => (partialSum + a?.metrics?.length === 0 ? 0 : (a?.metrics[a?.metrics?.length - 1]?.value / a?.targetValue) * 100),
                0
              )
            ) >= 100
          ) {
            return goal;
          }
        })
      );
    }

    if (selectedMenu === "Active") {   
      setIsLoadingActive(true); // Set isLoadingActive to true
      setfilteredGoals(goals);
    }

    if (selectedMenu === "All Goals") {
      setfilteredGoals(goals);
    }
  };

  useEffect(() => {
    tabSwitch();
  }, [selectedMenu, goals]);

  useEffect(() => {
    // Handle the "Active" tab separately
    if (selectedMenu === "Active") {
      console.log('isLoadingActive :>> ', isLoadingActive);
      setIsLoadingActive(false);
      setIsLoading(false);
      dispatch(getAllGoals({ projectId }));
      dispatch(getProjectUsers({ projectId }));
      dispatch(getAllkeyMetrics());
      setShowSkeletonLoader(false);
    } else if (selectedMenu === "All Goals") {
      setIsLoading(false);
      dispatch(getAllGoals({ projectId }));
      dispatch(getProjectUsers({ projectId }));
      dispatch(getAllkeyMetrics());
      setShowSkeletonLoader(false);
    }
  }, [selectedMenu]);



  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{openedProject?.name}</h1>
          <p className="text-sm text-gray-500">
            {goals?.length == 1
              ? `${goals?.length} Goal`
              : `${goals?.length} Goals`}
          </p>
        </div>

        <div className="flex-1 flex flex-row-reverse">
          <div className="flex items-center gap-2 sm:gap-3">
            {hasPermission_create_goals() && (
              <Button
                className="bg-black hover:bg-gray-800 text-white"
                onClick={() => {
                  setselectedTab("About Goal");
                  dispatch(updateSelectedGoal(null));
                  setIsCreateGoalDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border mt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {ProjectsMenus.map((menu) => (
              <button
                key={menu.name}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  selectedMenu === menu.name
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setselectedMenu(menu.name);
                }}
              >
                {menu.name}
                {selectedMenu === menu.name && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                )}
              </button>
            ))}
                </div>

          <div className="flex items-center">
            {RightProjectsMenus.map((menu) => (
              <button
                key={menu.name}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  selectedMenu === menu.name
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setselectedMenu(menu.name);
                }}
              >
                {menu.name}
                {selectedMenu === menu.name && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                )}
              </button>
            ))}
                </div>
        </div>
      </div>

      {filteredGoals?.length === 0 && !isLoading ? (
            <div className="flex items-center justify-center mt-5">
            <div className="flex flex-col gap-3 text-center">
              <img
                src="/static/illustrations/no-projects-found.svg"
                alt=""
                height="200px"
                style={{ pointerEvents: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
              <h2 className="text-xl font-semibold text-gray-900">No goals created yet</h2>
              {selectedMenu === "All Goals" && (
                <Button
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                  onClick={() => {
                    setselectedTab("About Goal");
                    dispatch(updateSelectedGoal(null));
                    setIsCreateGoalDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                    Create My First Goal
                </Button>
              )}
            </div>
          </div>    
    )
   : (filteredGoals?.length > 0  ? 
     (
      <>
      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-medium" style={{ width: '359px', maxWidth: '359px' }}>Name</TableHead>
                <TableHead className="font-medium">Duration</TableHead>
                <TableHead className="font-medium">Members</TableHead>
                <TableHead className="font-medium text-center">Ideas</TableHead>
                <TableHead className="font-medium">Progress</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
      {filteredGoals.map((goal, index) => {
        const progress = Math.round(
          goal.keymetric.reduce((partialSum, metric) => {
            const lastMetric = metric.metrics[metric.metrics.length - 1];
            const percentage = lastMetric
              ? (lastMetric.value / metric.targetValue) * 100
              : 0;
            return partialSum + percentage;
          }, 0)
        );

        return (
          filteredGoals.length !== 0 ? (
            <React.Fragment key={`goal_body_${index}`}>
              <TableRow
                className="cursor-pointer hover:bg-muted/50"
              onClick={() => {
                navigate(`/projects/${projectId}/goals/${goal._id}`);
              }}
              >
                <TableCell className="py-3 align-middle">
                  <div
                    className="expand-icon cursor-pointer"
                  >
                    {arrowStateUpdater.includes(goal._id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    )}
              </div>
                </TableCell>

                <TableCell className="font-medium py-3 align-middle" style={{ width: '359px', maxWidth: '359px' }}>
                  <div className="w-full">
                    <div className="font-semibold text-sm text-black truncate" title={goal.name}>{goal.name}</div>
                    {goal.description && (
                      <div className="text-xs text-gray-500 truncate" title={goal.description}>{goal.description}</div>
                    )}
                    <button
                      type="button"
                      className="mt-1 text-xs text-muted-foreground hover:text-foreground hover:underline inline-flex items-center gap-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleGoalExpanded(goal._id);
                      }}
                    >
                      {arrowStateUpdater.includes(goal._id) ? "Hide key metrics" : "Show key metrics"}
                    </button>
              </div>
                </TableCell>

                <TableCell className="text-sm text-gray-600 py-3 align-middle">
                  {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
                </TableCell>

                <TableCell className="py-3 align-middle">
                <AvatarGroup
                  listOfUrls={goal.members.map(
                    (member) => `${backendServerBaseURL}/${member.avatar}`
                  )}
                  show={3}
                  total={goal.members.length}
                  owner={goal?.createdBy}
                  userName={goal.members?.map((t) => [
                    t?.firstName,
                    `${backendServerBaseURL}/${t?.avatar}`,
                    t?.lastName,
                  ])}
                />
                </TableCell>

                <TableCell className="text-center py-3 align-middle">
                  <div className="flex items-center justify-center gap-1.5 text-sm">
                    <span className="text-blue-600 font-medium">I:{goal.ideas || 0}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-orange-600 font-medium">T:{goal.tests || 0}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-green-600 font-medium">L:{goal.learnings || 0}</span>
                  </div>
                </TableCell>

                <TableCell className="py-3 align-middle">
                  <div className="flex items-center gap-2 w-32">
                    <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-black rounded-full h-1.5 transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                  </div>
                    <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{progress}%</span>
                </div>
                </TableCell>

                <TableCell className="py-3 align-middle">
                  {hasPermission_create_goals() && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                            navigate(`/projects/${projectId}/goals/${goal._id}`);
                          }}
                        >
                          View Goal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                          setselectedTab("About Goal");
                          dispatch(updateSelectedGoal(goal));
                            setIsCreateGoalDialogOpen(true);
                        }}
                        >
                          Edit Goal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(updateSelectedGoal(goal));
                            dispatch(updateShowDeleteGoalDialog(true));
                          }}
                        >
                          Delete Goal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>

              {/* Collapsible Key Metrics Row */}
              {arrowStateUpdater.includes(goal._id) && (
              <TableRow>
                <TableCell colSpan={7} className="p-0 border-t-0 bg-white">
                  <div className="px-6 py-4">
                    {/* Key Metrics Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">Key Metrics</h3>
                      {(hasPermission_create_goals() || isTypeOwner() || isRoleAdmin() || isRoleMember()) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setselectedTab("Key Metrics");
                            dispatch(updateSelectedGoal(goal));
                            setIsCreateGoalDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Metric
                        </Button>
                      )}
                    </div>

                    {/* Key Metrics List */}
                    <div className="space-y-0">
                      {goal.keymetric.map((keyMetric, metricIndex) => {
                        const currentValue = keyMetric.metrics.length === 0 
                          ? keyMetric.startValue || 0 
                          : keyMetric.metrics[keyMetric.metrics.length - 1]?.value;
                        const metricProgress = keyMetric.metrics.length === 0
                          ? 0
                          : Math.round((currentValue / keyMetric.targetValue) * 100);
                        const unit = keyMetric.unit || '%';

                        return (
                          <div
                            key={`metric_${metricIndex}`}
                            className="group flex items-center gap-4 py-3 border-b last:border-0 -mx-6 px-6 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                              {/* Left: Metric Name */}
                              <p className="text-sm font-bold text-foreground">
                                {keyMetric.name}
                              </p>
                              
                              {/* Middle: Current and Target Values */}
                              <div className="text-sm text-center">
                                <span className="text-muted-foreground">{currentValue || 0}</span>
                                <span className="mx-2">→</span>
                                <span className="font-bold text-foreground">{keyMetric.targetValue}</span>
                              </div>
                              
                              {/* Right: Progress Bar with Percentage */}
                              <div className="flex items-center justify-end gap-2">
                                <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden" style={{ width: '80px' }}>
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      metricProgress >= 100
                                        ? "bg-green-500"
                                        : metricProgress >= 80
                                        ? "bg-black"
                                        : metricProgress >= 50
                                        ? "bg-yellow-500"
                                        : metricProgress > 0
                                        ? "bg-red-500"
                                        : "bg-gray-300"
                                    }`}
                                    style={{ width: `${Math.min(metricProgress, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                  {metricProgress}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              )}
            </React.Fragment>
          ) : null
        );
      })}
        </TableBody>
        </Table>
        </CardContent>
      </Card>
    </>
    )
   : (isLoading ? (
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-center">Ideas</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={`skeleton_${index}`} className="animate-pulse">
                    <TableCell><div className="h-4 w-4 bg-gray-200 rounded"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-full"></div></TableCell>
                    <TableCell>
                      <div className="flex -space-x-1">
                        <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                        <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
    </div>
                    </TableCell>
                    <TableCell className="text-center"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></TableCell>
                    <TableCell><div className="h-2 bg-gray-200 rounded-full w-full"></div></TableCell>
                    <TableCell><div className="h-8 w-8 bg-gray-200 rounded"></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null)
  )}

      <CreateNewGoalDialog
        openRequestIdeaDialog={openRequestIdeaDialog}
        selectedTab={selectedTab}
        open={isCreateGoalDialogOpen}
        onOpenChange={setIsCreateGoalDialogOpen}
      />
      <DeleteGoalDialog />

      <div
        ref={requestIdeaDialogRef}
      ></div>
      <RequestIdeaDialog />

      <TourModal />
    </div>
  );
}

export default Goals;
