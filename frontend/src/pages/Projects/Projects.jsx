import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AvatarGroup from "../../components/common/AvatarGroup";
import {
  archiveProject,
  getAllProjects,
  getAllUsers,
  selectProjects,
  unarchiveProject,
  updateProjectStatus,
  updateSelectedProject,
} from "../../redux/slices/projectSlice";
import { backendServerBaseURL } from "../../utils/backendServerBaseURL";
import { formatTime } from "../../utils/formatTime";
import { hasPermission_create_project, isTypeOwner, isRoleAdmin, hasPermission_delete_project } from "../../utils/permissions";
import CreateNewProjectDialog from "./CreateNewProjectDialog";
import DeleteProjectDialog from "./DeleteProjectDialog";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

function Projects() {
  const projects = useSelector(selectProjects);
  console.log("projects --",projects)
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [projectToDelete, setprojectToDelete] = useState(null);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false); // Loading state flag


  useEffect(() => {
    dispatch(getAllProjects());
    dispatch(getAllUsers());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("openNewProjectDialog", null) === "1") {
      setIsCreateProjectDialogOpen(true);
      localStorage.setItem("openNewProjectDialog", "0");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 sm:px-6">
        {/* Header Section */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Projects</h1>
              <p className="text-sm text-muted-foreground">
                {
                  projects?.filter((p) => {
                    if (p?.isArchived && statusFilter !== "archived") return false;
                    if (statusFilter === "archived" && !p?.isArchived) return false;
                    if (statusFilter !== "all" && statusFilter !== "archived" && p?.status !== statusFilter) return false;
                    if (searchQuery) {
                      return p?.name?.toLowerCase().includes(searchQuery.toLowerCase());
                    }
                    return true;
                  }).length
                }{" "}
                {projects?.filter((p) => {
                  if (p?.isArchived && statusFilter !== "archived") return false;
                  if (statusFilter === "archived" && !p?.isArchived) return false;
                  if (statusFilter !== "all" && statusFilter !== "archived" && p?.status !== statusFilter) return false;
                  if (searchQuery) {
                    return p?.name?.toLowerCase().includes(searchQuery.toLowerCase());
                  }
                  return true;
                }).length === 1 ? "Project" : "Projects"}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  className="pl-9 w-full h-10 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
                />
              </div>

              {/* Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Not Defined">Not Defined</SelectItem>
                  {(hasPermission_create_project() || isTypeOwner() || isRoleAdmin()) && (
                    <SelectItem value="archived">Archived</SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* New Project Button */}
              {hasPermission_create_project() && (
                <Button
                  className="h-10 bg-black hover:bg-black/90 text-white font-medium"
                  onClick={() => {
                    dispatch(updateSelectedProject(null));
                    setIsCreateProjectDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {projects?.length === 0 && !isLoading && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <img 
                  src="/static/illustrations/no-projects-found.svg" 
                  alt="" 
                  className="h-48"
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
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">No Projects Found</h2>
                  <p className="text-sm text-muted-foreground">Get started by creating your first project</p>
                </div>
                {hasPermission_create_project() && (
                  <Button
                    className="bg-black hover:bg-black/90 text-white font-medium"
                    onClick={() => {
                      dispatch(updateSelectedProject(null));
                      setIsCreateProjectDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create My First Project
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Table */}
        {projects?.length !== 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold h-12">Name</TableHead>
                      <TableHead className="font-semibold h-12">Description</TableHead>
                      <TableHead className="font-semibold h-12">Created</TableHead>
                      <TableHead className="font-semibold h-12">Owner</TableHead>
                      <TableHead className="font-semibold h-12">Members</TableHead>
                      <TableHead className="font-semibold h-12">Goals</TableHead>
                      <TableHead className="font-semibold h-12">Status</TableHead>
                      <TableHead className="w-12 h-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects
                      ?.filter((p) => {
                        // Filter by status
                        if (statusFilter === "archived" && !p?.isArchived) return false;
                        if (statusFilter !== "all" && statusFilter !== "archived") {
                          if (p?.isArchived) return false;
                          if (p?.status !== statusFilter) return false;
                        }
                        if (statusFilter === "all" && p?.isArchived) return false;
                        
                        // Filter by search query
                        if (searchQuery) {
                          return p?.name?.toLowerCase().includes(searchQuery.toLowerCase());
                        }
                        return true;
                      })
                      ?.map((project) => (
                        <TableRow
                          key={project._id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors border-b"
                          onClick={() => {
                            localStorage.setItem("openedProject", JSON.stringify(project));
                            navigate(`/projects/${project._id}/goals`);
                          }}
                        >
                          {/* Name */}
                          <TableCell className="font-semibold text-foreground py-4 max-w-[200px]">
                            <div className="truncate" title={project.name}>
                              {project.name}
                            </div>
                          </TableCell>

                          {/* Description */}
                          <TableCell className="max-w-xs truncate py-4 text-muted-foreground">
                            {project.description || <span className="text-muted-foreground/60">No description</span>}
                          </TableCell>

                          {/* Created */}
                          <TableCell className="text-muted-foreground py-4">
                            {formatTime(project.createdAt)}
                          </TableCell>

                          {/* Owner */}
                          <TableCell className="py-4">
                            {project.createdBy
                              ? `${project.createdBy.firstName} ${project.createdBy.lastName}`
                              : <span className="text-muted-foreground/60">Removed User</span>}
                          </TableCell>

                          {/* Members */}
                          <TableCell className="py-4">
                            <AvatarGroup
                              listOfUrls={project.team?.map((t) => `${backendServerBaseURL}/${t?.avatar}`)}
                              userName={project.team?.map((t) => [
                                t?.firstName,
                                `${backendServerBaseURL}/${t?.avatar}`,
                                t?.lastName,
                              ])}
                              show={3}
                              total={project.team?.length}
                              owner={project?.createdBy}
                            />
                          </TableCell>

                          {/* Goals */}
                          <TableCell className="py-4">
                            <span className="font-medium">{project?.goals || 0}</span>
                          </TableCell>

                          {/* Status */}
                          <TableCell
                            className="py-4"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            {hasPermission_create_project() ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Badge
                                    className={`cursor-pointer transition-colors ${
                                      project.status === "Active"
                                        ? "bg-black text-white hover:bg-black/90"
                                        : project.status === "Completed"
                                        ? "bg-black text-white hover:bg-black/90"
                                        : project.status === "On Hold"
                                        ? "bg-muted text-foreground hover:bg-muted/80"
                                        : project.status === "Not Defined"
                                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                                        : "bg-muted text-muted-foreground"
                                    } text-xs font-medium`}
                                  >
                                    {project.status}
                                  </Badge>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      dispatch(updateProjectStatus({ status: "Not Defined", projectId: project._id }));
                                    }}
                                  >
                                    Not Defined
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      dispatch(updateProjectStatus({ status: "Active", projectId: project._id }));
                                    }}
                                  >
                                    Active
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      dispatch(updateProjectStatus({ status: "Completed", projectId: project._id }));
                                    }}
                                  >
                                    Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      dispatch(updateProjectStatus({ status: "On Hold", projectId: project._id }));
                                    }}
                                  >
                                    On Hold
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <Badge 
                                className={`${
                                  project.status === "Active"
                                    ? "bg-black text-white"
                                    : project.status === "Completed"
                                    ? "bg-black text-white"
                                    : project.status === "On Hold"
                                    ? "bg-muted text-foreground"
                                    : project.status === "Not Defined"
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-muted text-muted-foreground"
                                } text-xs font-medium`}
                              >
                                {project.status}
                              </Badge>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell
                            className="py-4"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            {hasPermission_create_project() && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      localStorage.setItem("openedProject", JSON.stringify(project));
                                      navigate(`/projects/${project._id}`);
                                    }}
                                  >
                                    Open Project
                                  </DropdownMenuItem>
                                  {!project.isArchived && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        dispatch(updateSelectedProject(project));
                                        setIsCreateProjectDialogOpen(true);
                                      }}
                                    >
                                      Edit Project
                                    </DropdownMenuItem>
                                  )}
                                  {!project.isArchived && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        dispatch(archiveProject({ projectId: project._id }));
                                      }}
                                    >
                                      Archive Project
                                    </DropdownMenuItem>
                                  )}
                                  {project.isArchived && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        dispatch(unarchiveProject({ projectId: project._id }));
                                      }}
                                    >
                                      Unarchive Project
                                    </DropdownMenuItem>
                                  )}
                                  {hasPermission_delete_project() && (
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                      onClick={() => {
                                        setprojectToDelete(project);
                                        setIsDeleteProjectDialogOpen(true);
                                      }}
                                    >
                                      Delete Project
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          isLoading && (
            <Card>
              <CardContent className="p-6">
                {/* Loading Skeleton */}
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="grid grid-cols-8 gap-4 py-4">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded col-span-2"></div>
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        )}

      {/* Modals */}
      <CreateNewProjectDialog 
        isOpen={isCreateProjectDialogOpen} 
        onClose={() => {
          setIsCreateProjectDialogOpen(false);
          dispatch(updateSelectedProject(null));
        }} 
      />
      <DeleteProjectDialog 
        projectToDelete={projectToDelete} 
        isOpen={isDeleteProjectDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteProjectDialogOpen(open);
          if (!open) {
            setprojectToDelete(null);
          }
        }}
      />
      </div>
    </div>
  );
}

export default Projects;
