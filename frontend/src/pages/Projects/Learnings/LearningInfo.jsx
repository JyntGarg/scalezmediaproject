import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  addLearningComment,
  deleteLearningComment,
  getProjectCollaborators,
  getProjectUsers,
  readSingleLearning,
  selectProjectUsers,
  selectsingleLearningInfo,
  updateLearningComment,
  updateselectedLearning,
  updateTestTaskStatus,
  updateShowSendBackToTestsDialog,
} from "../../../redux/slices/projectSlice";
import SendBackToTestsDialog from "./SendBackToTestsDialog";
import { formatTime, formatDate2 } from "../../../utils/formatTime";
import { backendServerBaseURL } from "../../../utils/backendServerBaseURL";
import { swapTags } from "../../../utils/tag.js";
import moment from "moment";
import FilePreview from "../../../components/common/FilePreview";
import InviteCollaboratorsDialog from "../../Settings/InviteCollaboratorsDialog";
import { hasPermission_create_learnings, hasPermission_create_comments } from "../../../utils/permissions";
import MoveToLearningDialog from "../Tests/MoveToLearningDialog";
import TaskLearningDialog from "../Learnings/TaskLearningDialog";
import LoadingButton from "../../../components/common/LoadingButton";
import Toast from "../../../components/common/Toast";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Checkbox } from "../../../components/ui/checkbox";
import { Textarea } from "../../../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Edit3,
  Users,
  TestTube2,
  Plus,
  BarChart3,
  Bell,
  Edit,
  Trash2,
  Play,
  UserPlus,
  Settings,
  Activity,
  MessageSquare,
  Target,
  TrendingUp,
  Star,
  CheckCircle,
  BookOpen,
  Share2,
  FileIcon,
  Send,
  Bold,
  Italic,
  AtSign
} from "lucide-react";

function LearningInfo() {
  const dispatch = useDispatch();
  const params = useParams();
  const projectId = params.projectId;
  const learningId = params.learningId;
  const navigate = useNavigate();
  const singleLearningInfo = useSelector(selectsingleLearningInfo);
  const openedProject = JSON.parse(localStorage.getItem("openedProject", ""));
  const projectUsers = useSelector(selectProjectUsers);
  const [comment, setcomment] = useState("");
  const [comment2, setcomment2] = useState("");
  const [editingComment, seteditingComment] = useState(0);
  const me = JSON.parse(localStorage.getItem("user", ""));
  const [showLoader, setShowLoader] = useState(true);
  const [isSubmitting, setisSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
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

  useEffect(() => {
    dispatch(readSingleLearning({ learningId }));
    dispatch(getProjectUsers({ projectId }));
    dispatch(getProjectCollaborators({ projectId }));
    setShowLoader(false);
  }, []);

  // Function to generate comprehensive activity data for learnings
  const generateLearningActivities = () => {
    const activities = [];

    // Add comments as activities
    if (singleLearningInfo?.comments) {
      singleLearningInfo.comments.forEach(comment => {
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

    // Add learning creation activity
    if (singleLearningInfo?.createdAt) {
      activities.push({
        id: `learning-created-${singleLearningInfo._id}`,
        type: 'learning_created',
        user: singleLearningInfo.createdBy || { firstName: 'System', lastName: '', avatar: 'uploads/default.png' },
        action: 'created learning',
        description: singleLearningInfo.name,
        timestamp: singleLearningInfo.createdAt,
        icon: BookOpen,
        color: 'text-green-600'
      });
    }

    // Add learning updates activity
    if (singleLearningInfo?.updatedAt && singleLearningInfo.updatedAt !== singleLearningInfo.createdAt) {
      activities.push({
        id: `learning-updated-${singleLearningInfo._id}`,
        type: 'learning_updated',
        user: singleLearningInfo.updatedBy || { firstName: 'System', lastName: '', avatar: 'uploads/default.png' },
        action: 'updated learning',
        description: 'Learning details were modified',
        timestamp: singleLearningInfo.updatedAt,
        icon: Edit3,
        color: 'text-orange-600'
      });
    }

    // Add ICE score updates as activities
    if (singleLearningInfo?.impact || singleLearningInfo?.confidence || singleLearningInfo?.ease) {
      activities.push({
        id: `ice-update-${singleLearningInfo._id}`,
        type: 'ice_update',
        user: singleLearningInfo.updatedBy || singleLearningInfo.createdBy || { firstName: 'System', lastName: '', avatar: 'uploads/default.png' },
        action: 'updated ICE score',
        description: `Impact: ${singleLearningInfo.impact || 0}, Confidence: ${singleLearningInfo.confidence || 0}, Ease: ${singleLearningInfo.ease || 0}`,
        timestamp: singleLearningInfo.updatedAt || singleLearningInfo.createdAt,
        icon: BarChart3,
        color: 'text-green-600'
      });
    }

    // Add result/conclusion updates as activities
    if (singleLearningInfo?.result) {
      activities.push({
        id: `result-update-${singleLearningInfo._id}`,
        type: 'result_update',
        user: singleLearningInfo.updatedBy || singleLearningInfo.createdBy || { firstName: 'System', lastName: '', avatar: 'uploads/default.png' },
        action: 'updated result',
        description: `Result: ${singleLearningInfo.result}`,
        timestamp: singleLearningInfo.updatedAt || singleLearningInfo.createdAt,
        icon: CheckCircle,
        color: 'text-purple-600'
      });
    }

    // Add task completions as activities
    if (singleLearningInfo?.tasks) {
      singleLearningInfo.tasks.forEach((task, index) => {
        if (task.status) {
          activities.push({
            id: `task-completed-${singleLearningInfo._id}-${index}`,
            type: 'task_completed',
            user: singleLearningInfo.updatedBy || singleLearningInfo.createdBy || { firstName: 'System', lastName: '', avatar: 'uploads/default.png' },
            action: 'completed task',
            description: task.name,
            timestamp: singleLearningInfo.updatedAt || singleLearningInfo.createdAt,
            icon: CheckCircle,
            color: 'text-green-600'
          });
        }
      });
    }

    // Add member assignments as activities
    if (singleLearningInfo?.assignedTo && singleLearningInfo.assignedTo.length > 0) {
      singleLearningInfo.assignedTo.forEach((member, index) => {
        activities.push({
          id: `member-assigned-${singleLearningInfo._id}-${index}`,
          type: 'member_assigned',
          user: singleLearningInfo.createdBy || { firstName: 'System', lastName: '', avatar: 'uploads/default.png' },
          action: 'assigned member',
          description: `${member.firstName} ${member.lastName}`,
          timestamp: singleLearningInfo.createdAt,
          icon: UserPlus,
          color: 'text-purple-600'
        });
      });
    }

    // Add conclusion updates as activities
    if (singleLearningInfo?.conclusion) {
      activities.push({
        id: `conclusion-update-${singleLearningInfo._id}`,
        type: 'conclusion_update',
        user: singleLearningInfo.updatedBy || singleLearningInfo.createdBy || { firstName: 'System', lastName: '', avatar: 'uploads/default.png' },
        action: 'updated conclusion',
        description: 'Learning conclusion was modified',
        timestamp: singleLearningInfo.updatedAt || singleLearningInfo.createdAt,
        icon: BookOpen,
        color: 'text-indigo-600'
      });
    }

    // Sort activities by timestamp (newest first)
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Text formatting functions for comments
  const toggleFormatting = (formatType) => {
    const textarea = document.getElementById('comment-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = comment.substring(start, end);
    let newText = '';

    if (formatType === 'bold') {
      newText = comment.substring(0, start) + `**${selectedText || 'bold text'}**` + comment.substring(end);
    } else if (formatType === 'italic') {
      newText = comment.substring(0, start) + `*${selectedText || 'italic text'}*` + comment.substring(end);
    }

    setcomment(newText);
    setTimeout(() => {
      textarea.focus();
      if (formatType === 'bold') {
        textarea.setSelectionRange(start + 2, start + 2 + (selectedText || 'bold text').length);
      } else if (formatType === 'italic') {
        textarea.setSelectionRange(start + 1, start + 1 + (selectedText || 'italic text').length);
      }
    }, 0);
  };

  const handleBold = () => toggleFormatting('bold');
  const handleItalic = () => toggleFormatting('italic');

  return (
    <div className="space-y-6">
      {showLoader ? (
        /* Skeleton Loader */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Header Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <div className="skeleton-placeholder h-7 w-64"></div>
                    <div className="skeleton-placeholder h-3 w-40"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="skeleton-placeholder h-8 w-32 rounded-md"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="skeleton-placeholder h-3 w-20 mb-1"></div>
                    <div className="skeleton-placeholder h-4 w-full mb-1"></div>
                    <div className="skeleton-placeholder h-4 w-4/5 mb-1"></div>
                    <div className="skeleton-placeholder h-4 w-3/4"></div>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <div className="skeleton-placeholder h-3 w-16 mb-1"></div>
                      <div className="skeleton-placeholder h-5 w-24"></div>
                    </div>
                    <div>
                      <div className="skeleton-placeholder h-3 w-20 mb-1"></div>
                      <div className="skeleton-placeholder h-4 w-28"></div>
                    </div>
                    <div>
                      <div className="skeleton-placeholder h-3 w-20 mb-1"></div>
                      <div className="skeleton-placeholder h-5 w-12"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ICE Analysis Skeleton */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="skeleton-placeholder h-7 w-32"></div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6 pb-6">
                      <div className="flex flex-col items-center justify-center">
                        <div className="skeleton-placeholder h-9 w-12 mb-2"></div>
                        <div className="skeleton-placeholder h-4 w-20 mb-4"></div>
                        <div className="skeleton-placeholder h-2 w-32 rounded-full mb-2"></div>
                        <div className="skeleton-placeholder h-3 w-16"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Learning Details Skeleton */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="skeleton-placeholder h-7 w-32"></div>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="skeleton-placeholder h-4 w-16"></div>
                      <div className="skeleton-placeholder h-4 w-20"></div>
                      <div className="skeleton-placeholder h-4 w-24"></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="skeleton-placeholder h-4 w-24"></div>
                      <div className="skeleton-placeholder h-4 w-28"></div>
                      <div className="skeleton-placeholder h-5 w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conclusion Skeleton */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="skeleton-placeholder h-7 w-32"></div>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="skeleton-placeholder h-4 w-full"></div>
                    <div className="skeleton-placeholder h-4 w-full"></div>
                    <div className="skeleton-placeholder h-4 w-4/5"></div>
                    <div className="skeleton-placeholder h-4 w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comments Skeleton */}
            <div>
              <div className="skeleton-placeholder h-6 w-24 mb-4"></div>
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
              {[1, 2].map((i) => (
                <Card key={i} className="mb-3">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="skeleton-placeholder h-10 w-10 rounded-full"></div>
                      <div className="flex-1">
                        <div className="skeleton-placeholder h-4 w-24 mb-2"></div>
                        <div className="skeleton-placeholder h-4 w-full mb-1"></div>
                        <div className="skeleton-placeholder h-4 w-3/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {/* Result Badge Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="skeleton-placeholder h-5 w-20 mb-2"></div>
                <div className="skeleton-placeholder h-8 w-32"></div>
              </CardContent>
            </Card>

            {/* Details Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="skeleton-placeholder h-4 w-20 mb-2"></div>
                    <div className="skeleton-placeholder h-4 w-32"></div>
                  </div>
                  <div>
                    <div className="skeleton-placeholder h-4 w-24 mb-2"></div>
                    <div className="skeleton-placeholder h-6 w-16"></div>
                  </div>
                  <div>
                    <div className="skeleton-placeholder h-4 w-20 mb-2"></div>
                    <div className="skeleton-placeholder h-5 w-24"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div>
          {/* Breadcrumbs */}
          <div className="mb-4 px-6 py-3 text-sm text-gray-600">
            <span className="cursor-pointer hover:text-gray-900" onClick={() => navigate('/projects')}>Projects</span>
            <span className="mx-2">&gt;</span>
            <span className="cursor-pointer hover:text-gray-900" onClick={() => navigate(`/projects/${projectId}`)}>{openedProject?.name}</span>
            <span className="mx-2">&gt;</span>
            <span className="text-foreground font-medium">Learnings</span>
            <span className="mx-2">&gt;</span>
            <span className="font-medium text-foreground">{singleLearningInfo?.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card>
              <CardContent className="p-8">
                {/* Title & Meta */}
                <div className="mb-8">
                  <div className="space-y-3">
                    <h1 className="text-xl font-semibold text-foreground">{singleLearningInfo?.name}</h1>
                    <p className="text-xs text-muted-foreground">
                      Updated {moment(singleLearningInfo?.updatedAt).fromNow()} by {singleLearningInfo?.createdBy?.firstName} {singleLearningInfo?.createdBy?.lastName}
                    </p>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-8">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      dispatch(updateselectedLearning(singleLearningInfo));
                    }}
                    disabled={!hasPermission_create_learnings()}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={handleShare}
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      dispatch(updateselectedLearning(singleLearningInfo));
                      dispatch(updateShowSendBackToTestsDialog(true));
                    }}
                    disabled={!hasPermission_create_learnings()}
                  >
                    <TestTube2 className="h-3 w-3 mr-1" />
                    Send to Tests
                  </Button>
                </div>

                {/* Description and Details in One Box */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs text-muted-foreground mb-1">Conclusion</h3>
                    <Badge className="bg-black text-white hover:bg-black text-xs mb-2">
                      {singleLearningInfo?.result}
                    </Badge>
                    <div
                      className="text-sm leading-relaxed prose prose-sm max-w-none
                        [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2
                        [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4
                        [&_li]:my-1 [&_a]:text-blue-600 [&_a]:underline
                        [&_strong]:font-semibold [&_em]:italic [&_u]:underline
                        [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold
                        [&_h3]:text-base [&_h3]:font-bold [&_p]:my-2"
                      dangerouslySetInnerHTML={{
                        __html: singleLearningInfo?.conclusion || '<p className="text-gray-500">No conclusion provided</p>'
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="text-xs text-muted-foreground mb-1">Description</h3>
                    <div
                      className="text-sm leading-relaxed prose prose-sm max-w-none
                        [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2
                        [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4
                        [&_li]:my-1 [&_a]:text-blue-600 [&_a]:underline
                        [&_strong]:font-semibold [&_em]:italic [&_u]:underline
                        [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold
                        [&_h3]:text-base [&_h3]:font-bold [&_p]:my-2"
                      dangerouslySetInnerHTML={{
                        __html: singleLearningInfo?.description || '<p className="text-gray-500">No description provided</p>'
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-x-32 gap-y-4 mb-6">
                    <div>
                      <h3 className="text-xs text-muted-foreground mb-1">Created On</h3>
                      <p className="text-sm">{formatTime(singleLearningInfo?.createdAt)}</p>
                    </div>
                    <div>
                      <h3 className="text-xs text-muted-foreground mb-1">ICE Score</h3>
                      <Badge className="bg-black text-white hover:bg-black text-xs">
                        {singleLearningInfo?.score}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ICE Score Breakdown */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">ICE Score Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black dark:text-white">{singleLearningInfo?.impact || 0}</div>
                    <div className="text-xs text-muted-foreground">Impact</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black dark:text-white">{singleLearningInfo?.confidence || 0}</div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black dark:text-white">{singleLearningInfo?.ease || 0}</div>
                    <div className="text-xs text-muted-foreground">Ease</div>
                  </div>
                  <div className="text-center border-l border-border pl-4">
                    <div className="text-3xl font-bold text-black dark:text-white">{singleLearningInfo?.score?.toFixed(1) || '0.0'}</div>
                    <div className="text-xs text-muted-foreground">Average Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Details Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Learning Details</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-medium text-xs">Goal</TableHead>
                        <TableHead className="font-medium text-xs">Key Metric</TableHead>
                        <TableHead className="font-medium text-xs">Growth Lever</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-sm">{singleLearningInfo?.goal?.name || 'No goal assigned'}</TableCell>
                        <TableCell className="text-sm">{singleLearningInfo?.keymetric?.name || 'No metric assigned'}</TableCell>
                        <TableCell>
                          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 text-xs">
                            {singleLearningInfo?.lever || "Not Defined"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Tasks Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Tasks</h3>
                <div className="space-y-3">
                  {singleLearningInfo?.tasks?.map((task, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`task-${index}`}
                        checked={task.status}
                        disabled={true}
                      />
                      <label
                        htmlFor={`task-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {task.name}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Media Section */}
            {singleLearningInfo?.media && singleLearningInfo.media.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Media & Documents</h3>
                  <div className="flex flex-wrap gap-2">
                    {singleLearningInfo?.media?.map((mediaUrl) => {
                      return (
                        <FilePreview
                          url={`${backendServerBaseURL}/${mediaUrl}`}
                          key={mediaUrl}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
                  <Badge className="bg-gray-100 text-gray-800 text-xs">
                    {generateLearningActivities().length}
                  </Badge>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {generateLearningActivities().slice(0, 10).map((activity) => {
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
                            <span className="font-semibold">{activity.user?.firstName || 'System'} {activity.user?.lastName || ''}</span> {activity.action}
                          </p>
                          <p className="text-xs text-muted-foreground truncate leading-tight m-0 mt-1" title={activity.description}>
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground leading-tight m-0 mt-1">{moment(activity.timestamp).fromNow()}</p>
                        </div>
                      </div>
                    );
                  })}
                  {generateLearningActivities().length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Members Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Assigned Members</h3>
                </div>
                <div className="space-y-2">
                  {singleLearningInfo?.assignedTo?.map((member) => (
                    <div key={member._id} className="flex items-center gap-2 p-2 border-b">
                      <img
                        src={`${backendServerBaseURL}/${member.avatar}`}
                        className="w-8 h-8 rounded-full"
                        alt=""
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{member?.role?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Grid End */}

        {/* Comments Section - Full Width */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Comments</h3>
              <Badge variant="outline" className="text-xs">
                {singleLearningInfo?.comments?.length || 0} comments
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
                      className="min-h-[80px] text-sm focus:border-foreground focus:ring-foreground"
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
                          className="h-7 text-xs focus:bg-primary focus:text-primary-foreground"
                          disabled={!comment.trim() || comment.length > 500}
                          onClick={async () => {
                            setisSubmitting(true);
                            await dispatch(addLearningComment({ learningId, comment }));
                            setcomment("");
                            setTimeout(() => {
                              setisSubmitting(false);
                            }, 200);
                          }}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Comment
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
                {singleLearningInfo?.comments?.map((c) => {
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
                        src={`${backendServerBaseURL}/${c.createdBy?.avatar || projectUsers[0]?.avatar}`}
                        className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                        alt=""
                      />
                      <div className="flex-1">
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{`${c.createdBy?.firstName} ${c.createdBy?.lastName}`}</span>
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
                                      deleteLearningComment({
                                        learningId,
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
                                      updateLearningComment({
                                        commentId: c._id,
                                        comment: comment2,
                                        learningId,
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
        </div>
      )}

      <SendBackToTestsDialog />
      <InviteCollaboratorsDialog />
      <MoveToLearningDialog />
      <TaskLearningDialog />
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

export default LearningInfo;
