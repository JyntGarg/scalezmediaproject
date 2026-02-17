import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Calendar, Target, Lightbulb, TestTube, BookOpen, Star, TrendingUp, Filter, X, MessageCircle, User, ChevronLeft, ChevronRight, Smile, Frown, Meh, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import axios from '../../../utils/axios';
import { backendServerBaseURL } from '../../../utils/backendServerBaseURL';
import moment from 'moment';

const ProjectCalendar = () => {
  const { projectId } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState('all');
  const [availableGoals, setAvailableGoals] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [viewMode, setViewMode] = useState('month'); // 'all' or 'month'
  const [zoomLevel, setZoomLevel] = useState(0.8);
  const [selectedFilters, setSelectedFilters] = useState({
    goals: true,
    ideas: true,
    tests: true,
    learnings: true,
    northStar: true,
    northStarUpdate: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 0.8 });
  const [stickyDates, setStickyDates] = useState([]);
  const [stickyGoals, setStickyGoals] = useState([]);

  // Refs to track programmatic updates and prevent loops
  const isProgrammaticMonthChange = useRef(false);
  const isProgrammaticPan = useRef(false);
  const startDateRef = useRef(null);
  const pixelsPerDayRef = useRef(70);
  const hasInitializedRef = useRef(false);
  const previousViewModeRef = useRef(viewMode);
  const reactFlowInstanceRef = useRef(null);
  const viewportUpdateTimeoutRef = useRef(null);
  const goalRowsRef = useRef([]);
  
  // Calculate initial viewport position for today's date
  const getInitialViewport = useCallback(() => {
    // Calculate based on estimated start date (current month - 1 month)
    const estimatedStartDate = moment().subtract(1, 'month').startOf('month');
    const today = moment().startOf('day');
    const daysFromStart = today.diff(estimatedStartDate, 'days');
    const todayX = 150 + (daysFromStart * pixelsPerDayRef.current);
    const containerWidth = window.innerWidth || 1200;
    const zoom = 0.8;
    
    // Calculate viewport X to center on today
    const centerX = (containerWidth / 2) / zoom - todayX;
    
    return { x: centerX, y: 0, zoom: zoom };
  }, []);
  
  const [initialViewport] = useState(() => getInitialViewport());

  // Helper function to calculate X position of a month's center
  const getMonthCenterX = useCallback((month, startDate) => {
    if (!startDate) return 150;
    const monthStart = month.clone().startOf('month');
    const monthMiddle = monthStart.clone().date(15); // 15th day of the month
    const daysFromStart = monthMiddle.diff(startDate, 'days');
    return 150 + (daysFromStart * pixelsPerDayRef.current);
  }, []);

  // Helper function to calculate which month is at a given X position
  const getMonthFromX = useCallback((x, startDate) => {
    if (!startDate) return moment();
    const daysFromStart = Math.round((x - 150) / pixelsPerDayRef.current);
    const dateAtX = startDate.clone().add(daysFromStart, 'days');
    return dateAtX.clone().startOf('month');
  }, []);

  // Helper function to strip HTML tags from description
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Activity type configs (for rendering icons)
  const allActivityTypes = [
    { key: 'goals', label: 'Goals', icon: Target, color: '#9ca3af' },
    { key: 'ideas', label: 'Ideas', icon: Lightbulb, color: '#9ca3af' },
    { key: 'tests', label: 'Tests', icon: TestTube, color: '#9ca3af' },
    { key: 'learnings', label: 'Learnings', icon: BookOpen, color: '#9ca3af' },
    { key: 'northStar', label: 'North Star', icon: Star, color: '#9ca3af' },
    { key: 'northStarUpdate', label: 'Metric Update', icon: TrendingUp, color: '#9ca3af' },
    { key: 'metrics', label: 'Metrics', icon: TrendingUp, color: '#9ca3af' },
    { key: 'comment', label: 'Comments', icon: MessageCircle, color: '#9ca3af' },
  ];

  // Filter options (only main workflow items)
  const activityTypes = [
    { key: 'goals', label: 'Goals', icon: Target, color: '#9ca3af' },
    { key: 'ideas', label: 'Ideas', icon: Lightbulb, color: '#9ca3af' },
    { key: 'tests', label: 'Tests', icon: TestTube, color: '#9ca3af' },
    { key: 'learnings', label: 'Learnings', icon: BookOpen, color: '#9ca3af' },
    { key: 'northStar', label: 'North Star', icon: Star, color: '#9ca3af' },
    { key: 'northStarUpdate', label: 'Metric Updates', icon: TrendingUp, color: '#9ca3af' },
  ];

  useEffect(() => {
    console.log('🔵 Calendar useEffect triggered with projectId:', projectId);
    console.log('🔵 projectId type:', typeof projectId);
    console.log('🔵 projectId is truthy?', !!projectId);
    if (projectId) {
      console.log('🔵 Calling fetchProjectActivities...');
    fetchProjectActivities();
    } else {
      console.log('🔴 projectId is undefined/null, NOT calling fetchProjectActivities');
    }
  }, [projectId]);

  useEffect(() => {
    if (activities.length > 0) {
      const goals = [...new Set(
        activities
          .filter(a => a.goalName)
          .map(a => a.goalName)
      )];
      setAvailableGoals(goals);
      // Reset initialization when switching TO month view from all view
      if (viewMode === 'month' && previousViewModeRef.current !== 'month') {
        hasInitializedRef.current = false;
      }
      previousViewModeRef.current = viewMode;
      generateTimeline();
    }
  }, [activities, selectedFilters, selectedGoal, currentMonth, viewMode, zoomLevel]);

  const fetchProjectActivities = async () => {
    console.log('🟢 fetchProjectActivities called with projectId:', projectId);
    try {
      setLoading(true);
      const apiUrl = `${backendServerBaseURL}/api/v1/project/activities/${projectId}`;
      console.log('🟢 Making API call to:', apiUrl);
      const response = await axios.get(apiUrl);
      console.log('🟢 API response received:', response.status, response.data);
      const fetchedActivities = response.data.activities || [];
      console.log('🟢 Fetched activities count:', fetchedActivities.length);
      setActivities(fetchedActivities);

      // Debug: Show summary of transitions for each unique item
      const itemTransitions = {};
      fetchedActivities.forEach(activity => {
        if (activity.type === 'ideas' || activity.type === 'tests' || activity.type === 'learnings') {
          const key = `${activity.name}-${activity.type}`;
          if (!itemTransitions[key]) {
            itemTransitions[key] = [];
          }
          itemTransitions[key].push({
            action: activity.action,
            date: moment(activity.date).format('MMM D'),
            _id: activity._id
          });
        }
      });

      console.log('=== FULL TRANSITION HISTORY ===');
      Object.entries(itemTransitions).forEach(([key, transitions]) => {
        if (transitions.length > 1) {
          console.log(`${key}: ${transitions.length} transitions`, transitions.map(t => `${t.action} (${t.date})`).join(' → '));
        }
      });
      console.log('===============================');
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeline = () => {
    // Filter out comments and metrics (they show in hover only)
    let filteredActivities = activities.filter(
      (activity) =>
        selectedFilters[activity.type] &&
        activity.type !== 'comment' &&
        activity.type !== 'metrics'
    );

    if (selectedGoal !== 'all') {
      filteredActivities = filteredActivities.filter(
        (activity) => activity.goalName === selectedGoal || activity.type === 'northStar' || activity.type === 'northStarUpdate'
      );
    }

    // For edge connections, we need ALL activities (not filtered by month)
    // This allows connections between goals in Oct and ideas in Nov
    const allActivitiesForEdges = activities.filter(
      (activity) =>
        selectedFilters[activity.type] &&
        activity.type !== 'comment' &&
        activity.type !== 'metrics'
    );

    // Filter by month if in month view mode (for display only)
    if (viewMode === 'month') {
      const monthStart = currentMonth.clone().startOf('month');
      const monthEnd = currentMonth.clone().endOf('month');
      filteredActivities = filteredActivities.filter((activity) => {
        const activityDate = moment(activity.date);
        return activityDate.isBetween(monthStart, monthEnd, 'day', '[]');
      });
    }

    // Set date range based on view mode and zoom level
    // When zoomed in, extend range to show adjacent months (instead of white space)
    let startDate, endDate;
    // Calculate how many months to show based on zoom level
    // When zoomed out (low zoom), show more months. When zoomed in (high zoom), show fewer but extend adjacent months
    const baseMonths = viewMode === 'month' ? 1 : 3;
    const zoomMultiplier = zoomLevel < 0.5 ? 3 : zoomLevel < 0.8 ? 2 : 1.5; // Show more months when zoomed out
    const monthsToShow = Math.max(baseMonths, Math.ceil(baseMonths * zoomMultiplier));
    
    if (viewMode === 'month') {
      // Always show at least 1 month before and after to prevent white space
      // This allows cross-month connections (e.g., goal in Oct, idea in Nov)
      // When zoomed in, show more adjacent months
      const adjacentMonths = zoomLevel > 0.7 ? 2 : 1; // Show more months when zoomed in
      startDate = currentMonth.clone().subtract(adjacentMonths, 'months').startOf('month');
      endDate = currentMonth.clone().add(adjacentMonths, 'months').endOf('month');
    } else {
      // For "All Time" view, use activities date range but always extend by at least 1 month on each side
      if (allActivitiesForEdges.length > 0) {
        const sortedForRange = [...allActivitiesForEdges].sort((a, b) => new Date(a.date) - new Date(b.date));
        const earliestDate = moment(sortedForRange[0].date).startOf('month');
        const latestDate = moment(sortedForRange[sortedForRange.length - 1].date).endOf('month');
        // Always extend range by at least 1 month on each side for better visibility and connections
        startDate = earliestDate.clone().subtract(1, 'months');
        endDate = latestDate.clone().add(1, 'months');
      } else {
        // If no activities, show current month with adjacent months
        startDate = moment().subtract(1, 'months').startOf('month');
        endDate = moment().add(1, 'months').endOf('month');
      }
    }

    // Sort activities (even if empty, we still want to show the date range)
    const sortedActivities = filteredActivities.length > 0 
      ? [...filteredActivities].sort((a, b) => new Date(a.date) - new Date(b.date))
      : [];

    // For edge creation, we need to include activities that might be outside the current view
    // but are needed for connections (e.g., goal in Oct, idea in Nov)
    // Filter activities that fall within the extended date range
    const activitiesForNodes = allActivitiesForEdges.filter((activity) => {
      const activityDate = moment(activity.date);
      return activityDate.isBetween(startDate, endDate, 'day', '[]');
    });
    
    // Store startDate in ref for use in ReactFlow component
    startDateRef.current = startDate;

    // Combine displayed activities with activities needed for connections
    const allNodesActivities = [...new Map([
      ...sortedActivities.map(a => [a.id || a._id, a]),
      ...activitiesForNodes.map(a => [a.id || a._id, a])
    ]).values()].sort((a, b) => new Date(a.date) - new Date(b.date));

    const timelineNodes = [];
    const edges = [];
    
    // Track node mappings for creating edges
    // Structure: { activityId: { nodeId, activity, position } }
    const nodeMap = new Map();
    
    // Track goal nodes
    const goalNodes = new Map(); // goalId -> nodeId
    
    // Track idea nodes by their original itemId and creation date
    const ideaNodes = new Map(); // ideaId -> { nodeId, activity }
    
    // Track test nodes by their original itemId and related idea/test/learning IDs
    const testNodes = new Map(); // testId -> { nodeId, activity, ideaCreatedAt, testCreatedAt, learningCreatedAt }
    
    // Track learning nodes by their original itemId and related IDs
    const learningNodes = new Map(); // learningId -> { nodeId, activity, ideaCreatedAt, testCreatedAt }

    const pixelsPerDay = 70; // Increased spacing between dates

    // Create clean date headers (like the image)
    const headerY = 20;
    let currentDate = startDate.clone();
    let xOffset = 150;
    let lastMonth = null;

    // Day numbers with month labels when month changes
    while (currentDate.isSameOrBefore(endDate)) {
      const currentMonthKey = currentDate.format('YYYY-MM');

      // Month labels removed - now shown only in sticky header at top
      if (lastMonth !== currentMonthKey) {
        lastMonth = currentMonthKey;
      }

      // Calculate left and right boundaries for this date column
      const leftBoundary = xOffset - pixelsPerDay / 2;
      const rightBoundary = xOffset + pixelsPerDay / 2;
      const centerX = xOffset; // Center point between the two lines

      // Add extremely thin left boundary line using border
    timelineNodes.push({
        id: `boundary-line-left-${currentDate.format('YYYY-MM-DD')}`,
      type: 'default',
        position: { x: leftBoundary, y: headerY - 10 },
      data: {
        label: (
            <div style={{
              width: '1px',
              height: '20000px',
              borderLeft: '0.5px solid rgba(59, 130, 246, 0.35)',
              transform: 'scaleX(0.3)',
              transformOrigin: 'left center',
            }} />
        ),
      },
      draggable: false,
      selectable: false,
        style: {
          zIndex: 3,
          background: 'transparent',
          border: 'none',
          width: '1px',
          height: '20000px',
          pointerEvents: 'none',
        },
      });

      // Add extremely thin right boundary line using border
      timelineNodes.push({
        id: `boundary-line-right-${currentDate.format('YYYY-MM-DD')}`,
        type: 'default',
        position: { x: rightBoundary, y: headerY - 10 },
        data: {
          label: (
            <div style={{
              width: '1px',
              height: '20000px',
              borderLeft: '0.5px solid rgba(59, 130, 246, 0.35)',
              transform: 'scaleX(0.3)',
              transformOrigin: 'left center',
            }} />
          ),
        },
        draggable: false,
        selectable: false,
        style: {
          zIndex: 3,
          background: 'transparent',
          border: 'none',
          width: '1px',
          height: '20000px',
          pointerEvents: 'none',
        },
      });

      // Date numbers removed - now shown only in sticky header at top

      // Check if this is today's date
      const isToday = currentDate.isSame(moment(), 'day');

      // Add very subtle background area for this date column (light blue)
      // Highlight today's date with a more prominent background
      timelineNodes.push({
        id: `date-bg-${currentDate.format('YYYY-MM-DD')}`,
        type: 'default',
        position: { x: leftBoundary, y: headerY + 50 },
        data: {
          label: <div />,
        },
        draggable: false,
        selectable: false,
        style: {
          zIndex: 1,
          background: isToday 
            ? 'rgba(59, 130, 246, 0.15)' // Highlight today with more visible blue
            : 'rgba(59, 130, 246, 0.02)', // More subtle background for other dates
          border: isToday 
            ? '2px solid rgba(59, 130, 246, 0.4)' 
            : 'none',
          width: `${pixelsPerDay}px`,
          height: '20000px', // Very tall to cover all content
          pointerEvents: 'none',
        },
      });

      xOffset += pixelsPerDay;
      currentDate.add(1, 'day');
    }

    const timelineStartY = headerY + 80;

    // Organize activities by goal (current state only, no connections)
    const goalGroups = {};

    // Separate North Star metrics and their updates - use allActivitiesForEdges to get ALL North Star activities regardless of month filter
    const northStarActivities = allActivitiesForEdges.filter(a => a.type === 'northStar' || a.type === 'northStarUpdate');

    // Group all activities by goal (use allNodesActivities to include cross-month connections)
    allNodesActivities.forEach((activity) => {
      if (activity.type === 'northStar' || activity.type === 'northStarUpdate') return;

      const goalKey = activity.goalId || activity.goalName || 'Other';

      if (!goalGroups[goalKey]) {
        goalGroups[goalKey] = {
          goalName: activity.goalName || 'Unknown Goal',
          activities: [],
        };
      }

      goalGroups[goalKey].activities.push(activity);
    });

    // Sort activities within each goal by date
    Object.values(goalGroups).forEach(group => {
      group.activities.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    // Helper function to create node and track it for edge creation
    const createNode = (activity, xPos, yPos, nodeId) => {
      // Store node mapping for edge creation
      nodeMap.set(nodeId, { activity, position: { x: xPos, y: yPos } });
      
      // Track by activity type for relationship mapping
      if (activity.type === 'goals' && activity._id) {
        goalNodes.set(activity._id.toString(), nodeId);
      } else if (activity.type === 'ideas') {
        // Track ideas by their _id or id
        const ideaId = activity._id?.toString() || activity.id?.toString();
        if (ideaId) {
          if (!ideaNodes.has(ideaId)) {
            ideaNodes.set(ideaId, []);
          }
          ideaNodes.get(ideaId).push({ nodeId, activity, position: { x: xPos, y: yPos } });
        }
      } else if (activity.type === 'tests') {
        // Track tests by their _id or id
        const testId = activity._id?.toString() || activity.id?.toString();
        if (testId) {
          if (!testNodes.has(testId)) {
            testNodes.set(testId, []);
          }
          testNodes.get(testId).push({ 
            nodeId, 
            activity, 
            position: { x: xPos, y: yPos },
            ideaCreatedAt: activity.ideaCreatedAt,
            testCreatedAt: activity.testCreatedAt,
            learningCreatedAt: activity.learningCreatedAt,
            previousTestCreatedAt: activity.previousTestCreatedAt
          });
        }
      } else if (activity.type === 'learnings') {
        // Track learnings by their _id or id
        const learningId = activity._id?.toString() || activity.id?.toString();
        if (learningId) {
          if (!learningNodes.has(learningId)) {
            learningNodes.set(learningId, []);
          }
          learningNodes.get(learningId).push({ 
            nodeId, 
            activity, 
            position: { x: xPos, y: yPos },
            ideaCreatedAt: activity.ideaCreatedAt,
            testCreatedAt: activity.testCreatedAt
          });
        }
      }
      const activityDate = moment(activity.date);
      const activityConfig = allActivityTypes.find((t) => t.key === activity.type);
      
      // For learnings, use face icons based on result status
      let Icon = activityConfig?.icon || Calendar;
      if (activity.type === 'learnings') {
        // Use result-based icons ONLY (no more angry face for reverted)
        // Default to Meh (straight face) if no result
        Icon = Meh;

        if (activity.result) {
          const result = activity.result.toLowerCase();
          if (result === 'successful') {
            Icon = Smile; // Smiley face for successful
          } else if (result === 'unsuccessful') {
            Icon = Frown; // Sad face for unsuccessful
          } else if (result === 'inconclusive' || result === 'pending') {
            Icon = Meh; // Straight face for inconclusive/pending
          }
        }
      }

      const creatorName = activity.createdBy?.firstName && activity.createdBy?.lastName
        ? `${activity.createdBy.firstName} ${activity.createdBy.lastName}`
        : activity.createdBy?.name || 'Unknown';

      const ownerName = activity.owner?.firstName && activity.owner?.lastName
        ? `${activity.owner.firstName} ${activity.owner.lastName}`
        : activity.owner?.name || '';

      // Determine the action/status of this activity using transitionAction field
      const transitionAction = activity.transitionAction || activity.action || 'created';

      // For IDEAS:
      // - Show green checkmark if transitionAction is 'moved_to_test' (idea sent to test)
      // - Show red X if transitionAction is 'sent_back_to_idea' (test sent back to idea - should never happen but just in case)
      const ideaMovedToTest = activity.type === 'ideas' && transitionAction === 'moved_to_test';
      const ideaReverted = activity.type === 'ideas' && transitionAction === 'sent_back_to_idea';

      // For TESTS:
      // - Show green checkmark if transitionAction is 'moved_to_learning' (test sent to learning)
      // - Show red X if transitionAction is 'sent_back_to_test' (learning sent back to test, shown on test)
      const testMovedToLearning = activity.type === 'tests' && transitionAction === 'moved_to_learning';
      const testReverted = activity.type === 'tests' && transitionAction === 'sent_back_to_idea';

      // For LEARNINGS:
      // - Show red X if transitionAction is 'sent_back_to_test' (learning sent back to test)
      const learningSentBackToTest = activity.type === 'learnings' && transitionAction === 'sent_back_to_test';

      // Debug logging to verify we're getting ALL transitions for the same item
      // Each transition (forward or backward) should be a separate activity with unique date and _id
      if (activity.name && (activity.type === 'ideas' || activity.type === 'tests' || activity.type === 'learnings')) {
        console.log(`[${activity.type.toUpperCase()}] ${activity.name}:`, {
          _id: activity._id,
          action: activity.action,
          transitionAction: transitionAction,
          date: moment(activity.date).format('MMM D, YYYY HH:mm'),
          '✓Forward': ideaMovedToTest || testMovedToLearning,
          '✗Backward': ideaReverted || testReverted || learningSentBackToTest,
          result: activity.result || null
        });
      }

      const CustomNode = () => {
        const [showTooltip, setShowTooltip] = React.useState(false);
        const nodeRef = React.useRef(null);
        const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

        const updateTooltipPosition = () => {
          if (nodeRef.current) {
            const rect = nodeRef.current.getBoundingClientRect();
            setTooltipPosition({
              x: rect.left + rect.width / 2,
              y: rect.top,
            });
          }
        };

        return (
          <div className="relative">
            <div
              ref={nodeRef}
              className="flex flex-col items-center gap-1"
              onMouseEnter={() => {
                updateTooltipPosition();
                setShowTooltip(true);
              }}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <div className="relative w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500 transition-all cursor-pointer">
                <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                
                {/* Green checkmark for ideas moved to test (forward) */}
                {ideaMovedToTest && !ideaReverted && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-md">
                    <Check className="h-3 w-3 text-white stroke-[3]" />
                  </div>
                )}

                {/* Red badge for reverted ideas (sent back from test) */}
                {ideaReverted && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-white shadow-md">
                    <X className="h-3 w-3 text-white stroke-[3]" />
                  </div>
                )}

                {/* Green checkmark for tests moved to learning (forward) */}
                {testMovedToLearning && !testReverted && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-md">
                    <Check className="h-3 w-3 text-white stroke-[3]" />
                  </div>
                )}

                {/* Red badge for reverted tests (sent back from learning) */}
                {testReverted && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-white shadow-md">
                    <X className="h-3 w-3 text-white stroke-[3]" />
                  </div>
                )}

                {/* Red badge for learnings sent back to test */}
                {learningSentBackToTest && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-white shadow-md">
                    <X className="h-3 w-3 text-white stroke-[3]" />
                  </div>
                )}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                {activityDate.format('MMM D')}
              </div>
            </div>

            {showTooltip && createPortal(
              <div
                className="fixed transform -translate-x-1/2"
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y - 20}px`,
                  transform: 'translate(-50%, -100%)',
                  pointerEvents: 'none',
                  zIndex: 99999
                }}
              >
                <div className="px-4 py-3 rounded-lg shadow-2xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 min-w-[300px] max-w-[500px]">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      {activityConfig?.label}
                    </div>
                  </div>

                  {/* Goal Name Label */}
                  {activity.goalName && (
                    <div className="mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Goal:</div>
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{activity.goalName}</div>
                    </div>
                  )}

                  <div className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {activity.name}
                    {activity.historyEntry && activity.action && (
                      <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                        ({activity.action.replace(/_/g, ' ')})
                      </span>
                    )}
                  </div>

                  {activity.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                      {stripHtml(activity.description)}
                    </div>
                  )}

                  <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>
                        {activity.action === 'created' ? 'Created by' : 'Updated by'}: <span className="font-semibold">{creatorName}</span>
                      </span>
                    </div>

                    {/* Show assigned users for this snapshot */}
                    {activity.assignedTo && activity.assignedTo.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span>Assigned to: <span className="font-semibold">
                          {activity.assignedTo.map(u =>
                            u?.firstName && u?.lastName ? `${u.firstName} ${u.lastName}` : u?.name || 'Unknown'
                          ).join(', ')}
                        </span></span>
                      </div>
                    )}

                    {ownerName && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span>Owner: <span className="font-semibold">{ownerName}</span></span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium">{activityDate.format('MMM DD, YYYY HH:mm')}</span>
                    </div>

                    {/* Show reason if this is a history entry */}
                    {activity.historyEntry && activity.historyEntry.reason && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Reason:</span> <span className="italic">{activity.historyEntry.reason}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* History Details - Backend now sends history as separate activities, no need for history log */}
                  {false && activity.history && activity.history.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        History Log
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {activity.history.map((historyItem, idx) => {
                          const performedByName = historyItem.performedBy?.firstName && historyItem.performedBy?.lastName
                            ? `${historyItem.performedBy.firstName} ${historyItem.performedBy.lastName}`
                            : historyItem.performedBy?.name || 'Unknown';
                          const historyDate = moment(historyItem.actionDate);
                          
                          return (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 capitalize">
                                  {historyItem.action.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {historyDate.format('MMM DD, HH:mm')}
                                </span>
                              </div>
                              
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                By: <span className="font-medium">{performedByName}</span>
                              </div>

                              {/* Show assignees if changed */}
                              {historyItem.snapshot?.assignedTo && historyItem.snapshot.assignedTo.length > 0 && (
                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                  <span className="font-medium">Assigned to:</span>{' '}
                                  {historyItem.snapshot.assignedTo.map((user, i) => 
                                    user?.firstName && user?.lastName 
                                      ? `${user.firstName} ${user.lastName}`
                                      : user?.name || 'Unknown'
                                  ).join(', ')}
                                </div>
                              )}

                              {/* Show previous assignees if changed */}
                              {historyItem.previousState?.assignedTo && 
                               historyItem.previousState.assignedTo.length > 0 &&
                               JSON.stringify(historyItem.previousState.assignedTo) !== JSON.stringify(historyItem.snapshot?.assignedTo || []) && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  <span className="font-medium">Previous:</span>{' '}
                                  {historyItem.previousState.assignedTo.map((user, i) => 
                                    user?.firstName && user?.lastName 
                                      ? `${user.firstName} ${user.lastName}`
                                      : user?.name || 'Unknown'
                                  ).join(', ')}
                                </div>
                              )}

                              {/* Show tasks */}
                              {historyItem.snapshot?.tasks && historyItem.snapshot.tasks.length > 0 && (
                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                  <span className="font-medium">Tasks:</span>{' '}
                                  {historyItem.snapshot.tasks.map((task, i) => (
                                    <span key={i} className={task.status ? 'line-through text-gray-400 dark:text-gray-500' : ''}>
                                      {task.name || task}
                                      {i < historyItem.snapshot.tasks.length - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Show status change */}
                              {historyItem.snapshot?.status && (
                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                  <span className="font-medium">Status:</span>{' '}
                                  <span className="font-semibold">{historyItem.snapshot.status}</span>
                                  {historyItem.previousState?.status && historyItem.previousState.status !== historyItem.snapshot.status && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {' '}(was: {historyItem.previousState.status})
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Show result for learnings */}
                              {historyItem.snapshot?.result && (
                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                  <span className="font-medium">Result:</span>{' '}
                                  <span className={`font-semibold ${
                                    historyItem.snapshot.result === 'Successful' ? 'text-green-600 dark:text-green-400' :
                                    historyItem.snapshot.result === 'Unsuccessful' ? 'text-red-600 dark:text-red-400' :
                                    'text-yellow-600 dark:text-yellow-400'
                                  }`}>
                                    {historyItem.snapshot.result}
                                  </span>
                                </div>
                              )}

                              {/* Show conclusion */}
                              {historyItem.snapshot?.conclusion && (
                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                  <span className="font-medium">Conclusion:</span>{' '}
                                  <span className="italic">{historyItem.snapshot.conclusion.substring(0, 100)}
                                    {historyItem.snapshot.conclusion.length > 100 ? '...' : ''}
                                  </span>
                                </div>
                              )}

                              {/* Show reason if available */}
                              {historyItem.reason && (
                                <div className="text-xs text-gray-700 dark:text-gray-300 mt-1 pt-1 border-t border-gray-300 dark:border-gray-600 italic">
                                  <span className="font-medium">Reason:</span> {historyItem.reason}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Show tasks for history entries */}
                  {activity.historyEntry && activity.tasks && activity.tasks.length > 0 && (
                    <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Tasks at this time:</div>
                      <div className="space-y-1">
                        {activity.tasks.map((task, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                            <span className={task.status ? 'line-through text-gray-400 dark:text-gray-500' : ''}>
                              • {task.name || task}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {activity.status && (
                      <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {activity.status}
                      </div>
                    )}

                    {activity.score && (
                      <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        Score: {activity.score}/10
                      </div>
                    )}

                    {activity.result && (
                      <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {activity.result}
                      </div>
                    )}

                    {activity.currentValue && (
                      <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {activity.currentValue}/{activity.targetValue} {activity.unit}
                      </div>
                    )}

                    {activity.conclusion && (
                      <div className="text-xs px-3 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {activity.conclusion}
                  </div>
                    )}
                </div>
              </div>
              </div>,
              document.body
            )}
          </div>
        );
      };

      timelineNodes.push({
        id: nodeId,
        type: 'default',
        position: { x: xPos, y: yPos },
        data: { 
          label: <CustomNode />,
        },
        draggable: false, // Disable dragging - items stay in their correct date position
        selectable: true,
        style: {
          zIndex: 50,
          background: 'transparent',
          border: 'none',
          padding: 0,
          width: 'auto',
          height: 'auto',
          pointerEvents: 'all',
        },
        className: 'calendar-node',
      });
    };

    let currentY = timelineStartY;
    const rowHeight = 100;

    // Reset goal rows tracking
    goalRowsRef.current = [];

    // Goal sections - show all activities by date (no connections)
    // Even if no activities, we still show the date timeline above
    Object.entries(goalGroups).forEach(([_goalKey, group], goalIndex) => {
      if (group.activities.length === 0) return;

      // Track goal row position for sticky headers
      goalRowsRef.current.push({
        index: goalIndex,
        name: group.goalName,
        y: currentY + 15,
      });

      // Goal label
      timelineNodes.push({
        id: `label-goal-${goalIndex}`,
        type: 'default',
        position: { x: 10, y: currentY + 15 },
        data: {
          label: (
            <div className="text-xs text-gray-600 font-medium max-w-[130px] truncate">
              {group.goalName}
            </div>
          ),
        },
        draggable: false,
        selectable: false,
        style: { zIndex: 10, background: 'transparent', border: 'none' },
      });

      // Group activities by date - INCLUDING all history snapshots as separate nodes
      const activitiesByDate = {};

      // Backend now sends ALL activities including historical states as separate items
      // Just group them by date - no need to process history array
      group.activities.forEach((activity) => {
        const dateKey = moment(activity.date).format('YYYY-MM-DD');
        if (!activitiesByDate[dateKey]) {
          activitiesByDate[dateKey] = [];
        }
        activitiesByDate[dateKey].push(activity);
      });

      // Render activities, stacking multiple activities on same date vertically
      let activityIndex = 0;
      Object.entries(activitiesByDate).forEach(([dateKey, dateActivities]) => {
        const activityDate = moment(dateKey);
        const daysFromStart = activityDate.diff(startDate, 'days');
        const baseXPos = 150 + (daysFromStart * pixelsPerDay);

        // Stack multiple activities vertically on the same date
        const verticalSpacing = 90; // Increased vertical spacing between stacked items

        dateActivities.forEach((activity, idx) => {
          const xPos = baseXPos; // Same X position for all activities on this date
          const yPos = currentY + (idx * verticalSpacing); // Stack vertically
          const nodeId = `activity-${goalIndex}-${activityIndex}`;

          createNode(activity, xPos, yPos, nodeId);
          activityIndex++;
        });
      });

      // Adjust currentY based on the maximum number of activities on any single date in this goal
      const maxActivitiesOnDate = Math.max(...Object.values(activitiesByDate).map(arr => arr.length), 1);
      const additionalHeight = (maxActivitiesOnDate - 1) * 90; // Extra height for stacked activities (increased spacing)
      currentY += rowHeight + additionalHeight;

      // currentY is already adjusted above based on stacked activities
    });

    // North Star section (moved to appear after Goals)
    if (northStarActivities.length > 0 && selectedGoal === 'all') {
      // Track North Star row position for sticky headers
      goalRowsRef.current.push({
        index: 'northstar',
        name: 'North Star Metrics',
        y: currentY + 15,
      });

      timelineNodes.push({
        id: 'label-northstar',
        type: 'default',
        position: { x: 10, y: currentY + 15 },
        data: {
          label: (
            <div className="text-xs text-gray-600 font-medium">
              North Star Metrics
            </div>
          ),
        },
        draggable: false,
        selectable: false,
        style: { zIndex: 10, background: 'transparent', border: 'none' },
      });

      // Group North Star activities by date - only include those within the visible date range
      const northStarByDate = {};
      northStarActivities.forEach((activity) => {
        const activityDate = moment(activity.date);
        // Only include if within the visible date range
        if (activityDate.isBetween(startDate, endDate, 'day', '[]')) {
          const dateKey = activityDate.format('YYYY-MM-DD');
          if (!northStarByDate[dateKey]) {
            northStarByDate[dateKey] = [];
          }
          northStarByDate[dateKey].push(activity);
        }
      });

      // Render North Star activities, stacking multiple on same date vertically
      let northStarIdx = 0;
      let maxNorthStarStack = 1;
      Object.entries(northStarByDate).forEach(([dateKey, dateActivities]) => {
        const activityDate = moment(dateKey);
        const daysFromStart = activityDate.diff(startDate, 'days');
        const baseXPos = 150 + (daysFromStart * pixelsPerDay);
        
        // Stack multiple activities vertically on the same date
        const verticalSpacing = 90; // Increased vertical spacing between stacked items
        maxNorthStarStack = Math.max(maxNorthStarStack, dateActivities.length);
        
        dateActivities.forEach((activity, idx) => {
          const xPos = baseXPos; // Same X position for all activities on this date
          const yPos = currentY + (idx * verticalSpacing); // Stack vertically
          createNode(activity, xPos, yPos, `northstar-${northStarIdx}`);
          northStarIdx++;
        });
      });
      
      // Adjust currentY based on maximum stack height
      const additionalHeight = (maxNorthStarStack - 1) * 90; // Increased spacing
      currentY += rowHeight + additionalHeight;
    }

    // Helper function to check if a node exists in timelineNodes
    const nodeExists = (nodeId) => {
      return timelineNodes.some(node => node.id === nodeId);
    };

    // Helper function to avoid duplicate edges
    const edgeIds = new Set();

    // Create edges to connect related activities
    // 1. Connect Goals → Ideas (ONLY for first/original idea creation, NOT recreated ideas)
    ideaNodes.forEach((ideaList, ideaId) => {
      ideaList.forEach(({ nodeId: ideaNodeId, activity: ideaActivity }) => {
        // Only connect goal to the FIRST idea (action = 'created'), not to recreated ideas (action = 'recreated')
        const isOriginalIdea = !ideaActivity.action || ideaActivity.action === 'created' || ideaActivity.action === 'moved_to_test';

        if (isOriginalIdea && (ideaActivity.goalId || ideaActivity.goal)) {
          const goalId = (ideaActivity.goalId || ideaActivity.goal)?.toString();
          const goalNodeId = goalNodes.get(goalId);
          if (goalNodeId && nodeExists(goalNodeId) && nodeExists(ideaNodeId)) {
            const edgeId = `edge-goal-${goalId}-idea-${ideaNodeId}`;
            if (!edgeIds.has(edgeId)) {
              edgeIds.add(edgeId);
              edges.push({
                id: edgeId,
                source: goalNodeId,
                target: ideaNodeId,
                type: 'smoothstep',
                animated: false,
                style: { stroke: '#10b981', strokeWidth: 2 }, // Green for forward
                markerEnd: { type: 'arrowclosed', color: '#10b981' },
              });
              console.log(`✓ Connected Goal → Idea (original): ${ideaActivity.name} (${ideaActivity.action || 'created'})`);
            }
          }
        } else if (ideaActivity.action === 'recreated') {
          console.log(`✗ Skipped Goal → Idea (recreated): ${ideaActivity.name} - this is a reverted idea, not original`);
        }
      });
    });

    // 2. Connect Ideas ↔ Tests ↔ Learnings using UNIFIED CHRONOLOGICAL matching
    // Build ONE unified timeline for each item including ALL stages (idea, test, learning)
    const allItemActivities = new Map(); // key: "name-goalId", value: sorted array of ALL activities

    // Collect ALL ideas, tests, and learnings into one unified map
    ideaNodes.forEach((ideaList) => {
      ideaList.forEach(({ nodeId: ideaNodeId, activity: ideaActivity }) => {
        const goalId = (ideaActivity.goalId || ideaActivity.goal)?.toString() || 'unknown';
        const key = `${ideaActivity.name}-${goalId}`;
        if (!allItemActivities.has(key)) {
          allItemActivities.set(key, []);
        }
        allItemActivities.get(key).push({
          type: 'idea',
          nodeId: ideaNodeId,
          activity: ideaActivity,
          date: moment(ideaActivity.date),
          action: ideaActivity.action || 'created'
        });
      });
    });

    testNodes.forEach((testList) => {
      testList.forEach(({ nodeId: testNodeId, activity: testActivity }) => {
        const goalId = (testActivity.goalId || testActivity.goal)?.toString() || 'unknown';
        const key = `${testActivity.name}-${goalId}`;
        if (!allItemActivities.has(key)) {
          allItemActivities.set(key, []);
        }
        allItemActivities.get(key).push({
          type: 'test',
          nodeId: testNodeId,
          activity: testActivity,
          date: moment(testActivity.date),
          action: testActivity.action || 'created'
        });
      });
    });

    learningNodes.forEach((learningList) => {
      learningList.forEach(({ nodeId: learningNodeId, activity: learningActivity }) => {
        const goalId = (learningActivity.goalId || learningActivity.goal)?.toString() || 'unknown';
        const key = `${learningActivity.name}-${goalId}`;
        if (!allItemActivities.has(key)) {
          allItemActivities.set(key, []);
        }
        allItemActivities.get(key).push({
          type: 'learning',
          nodeId: learningNodeId,
          activity: learningActivity,
          date: moment(learningActivity.date),
          action: learningActivity.action || 'created'
        });
      });
    });

    // For each item, sort ALL activities chronologically and connect adjacent transitions
    allItemActivities.forEach((activities) => {
      // Sort by date (chronological order) - this gives us the complete timeline for this item
      activities.sort((a, b) => a.date - b.date);

      // Debug: Log the full sequence for this item with _id and action
      if (activities.length > 0) {
        const itemName = activities[0].activity.name;
        console.log(`\n=== TIMELINE for "${itemName}" ===`);
        activities.forEach((a, idx) => {
          console.log(`  ${idx + 1}. ${a.type.toUpperCase()} - ${a.date.format('MMM D HH:mm')} - action: ${a.action} - _id: ${a.activity._id} - nodeId: ${a.nodeId}`);
        });
        const sequence = activities.map(a => `${a.type}(${a.date.format('MMM D')})`).join(' → ');
        console.log(`Sequence: ${sequence}\n`);
      }

      // Connect each activity to the next one in the chronological sequence
      for (let i = 0; i < activities.length - 1; i++) {
        const current = activities[i];
        const next = activities[i + 1];

        // Only connect if nodes exist
        if (!nodeExists(current.nodeId) || !nodeExists(next.nodeId)) {
          console.log(`⚠️  Skipping edge: ${current.type}(${current.nodeId}) → ${next.type}(${next.nodeId}) - node(s) not found`);
          continue;
        }

        // Determine if this is a forward or backward transition
        let isForward = false;
        let isBackward = false;

        // Forward transitions: idea→test, test→learning
        if ((current.type === 'idea' && next.type === 'test') ||
            (current.type === 'test' && next.type === 'learning')) {
          isForward = true;
        }

        // Backward transitions: test→idea, learning→test
        // Check if the next item came FROM the current type (has previousItemType)
        const nextPrevType = next.activity.historyEntry?.previousItemType;

        if ((current.type === 'test' && next.type === 'idea' && nextPrevType === 'test') ||
            (current.type === 'learning' && next.type === 'test' && nextPrevType === 'learning')) {
          isBackward = true;
        }

        // Create edge if it's a valid transition
        if (isForward || isBackward) {
          const edgeId = `edge-${current.type}-${current.nodeId}-${next.type}-${next.nodeId}`;
          if (!edgeIds.has(edgeId)) {
            edgeIds.add(edgeId);
            edges.push({
              id: edgeId,
              source: current.nodeId,
              target: next.nodeId,
              type: 'smoothstep',
              animated: false,
              style: isForward
                ? { stroke: '#10b981', strokeWidth: 2 } // Green for forward
                : { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5,5' }, // Red dashed for backward
              markerEnd: {
                type: 'arrowclosed',
                color: isForward ? '#10b981' : '#ef4444'
              },
            });

            const arrow = isForward ? '✓' : '✗';
            console.log(`${arrow} ${current.type} → ${next.type}: ${current.activity.name} (${current.date.format('MMM D')}) → (${next.date.format('MMM D')})`);
          }
        }
      }
    });

    // Note: previousTestCreatedAt connections are handled above in the backward transitions
    // The previous test → current test connection is already covered by the idea → test backward flow

    // Final validation: Filter out any edges where source or target nodes don't exist
    const validNodeIds = new Set(timelineNodes.map(node => node.id));
    const validEdges = edges.filter(edge => {
      const sourceExists = validNodeIds.has(edge.source);
      const targetExists = validNodeIds.has(edge.target);
      return sourceExists && targetExists;
    });

    setNodes(timelineNodes);
    setEdges(validEdges); // Set only valid edges
  };

  const toggleFilter = (filterKey) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  // Function to center on today's date (current date in the middle of viewport)
  const centerOnToday = useCallback(() => {
    if (!reactFlowInstanceRef.current || !startDateRef.current || !nodes.length) return;
    
    const { getViewport, setCenter, setViewport } = reactFlowInstanceRef.current;
    if (!getViewport || !setCenter || !setViewport) return;

    isProgrammaticPan.current = true;
    const today = moment().startOf('day');
    const todayStr = today.format('YYYY-MM-DD');
    
    // Try to find a node for today's date
    let todayX = null;
    const todayNode = nodes.find(node => {
      const nodeDate = node.data?.activityDate;
      if (nodeDate) {
        const nodeDateStr = moment(nodeDate).format('YYYY-MM-DD');
        if (nodeDateStr === todayStr) {
          todayX = node.position.x;
          return true;
        }
      }
      // Also check date nodes
      if (node.id && node.id.startsWith('day-')) {
        const dateStr = node.id.replace('day-', '');
        if (dateStr === todayStr) {
          todayX = node.position.x;
          return true;
        }
      }
      return false;
    });
    
    // If we didn't find a node, calculate the position
    if (todayX === null) {
      const startDate = moment(startDateRef.current).startOf('day');
      const daysFromStart = today.diff(startDate, 'days');
      todayX = 150 + (daysFromStart * pixelsPerDayRef.current);
    }
    
    const viewport = getViewport();
    const zoom = viewport.zoom || 0.8;
    
    // First, center horizontally on today's date using setCenter
    setCenter(todayX, 0, { zoom: zoom });
    
    // Then, adjust the Y position to start from top using setViewport
    // Get the viewport again after setCenter to get the new X position
    setTimeout(() => {
      const newViewport = getViewport();
      // Set Y to 0 to start from top, keep the X that setCenter calculated
      setViewport({ x: newViewport.x, y: 0, zoom: zoom });
      
      // Reset flag after a delay
      setTimeout(() => {
        isProgrammaticPan.current = false;
      }, 300);
    }, 100);
  }, [nodes]);

  // Function to pan calendar to a specific month (start from beginning of month, not center)
  const panToMonth = useCallback((month) => {
    if (!reactFlowInstanceRef.current || !startDateRef.current) return;
    
    const { getViewport, setViewport } = reactFlowInstanceRef.current;
    if (!getViewport || !setViewport) return;

    isProgrammaticPan.current = true;
    const monthStart = month.clone().startOf('month');
    const daysFromStart = monthStart.diff(startDateRef.current, 'days');
    // Calculate X position of the 1st day of the month
    const firstDayX = 150 + (daysFromStart * pixelsPerDayRef.current);
    const viewport = getViewport();
    
    // Position so the 1st day of the month is at the left edge with padding
    // viewport.x is the offset, so we need: firstDayX + viewport.x = padding
    // Therefore: viewport.x = padding - firstDayX
    const padding = 50; // 50px padding from left edge
    const newX = padding - firstDayX;
    
    setViewport({ x: newX, y: viewport.y, zoom: viewport.zoom });
    
    // Reset flag after a delay
    setTimeout(() => {
      isProgrammaticPan.current = false;
    }, 500);
  }, []);

  // Initial positioning on today's date (center current date) when timeline is first generated
  useEffect(() => {
    if (nodes.length > 0 && viewMode === 'month' && startDateRef.current && reactFlowInstanceRef.current) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        // Shorter delay since defaultViewport is already set correctly
        // Just fine-tune the position if needed
        setTimeout(() => {
          // Double check everything is still ready
          if (reactFlowInstanceRef.current && startDateRef.current) {
            // Small delay to fine-tune position
            setTimeout(() => {
              centerOnToday();
            }, 200);
          }
        }, 300);
      }
    }
  }, [nodes.length, viewMode, centerOnToday]);

  // Effect to pan to selected month when currentMonth changes (only if from user clicking, not from panning)
  useEffect(() => {
    if (isProgrammaticMonthChange.current) {
      isProgrammaticMonthChange.current = false;
      return;
    }

    if (viewMode === 'month' && startDateRef.current && hasInitializedRef.current && reactFlowInstanceRef.current) {
      panToMonth(currentMonth);
    }
  }, [currentMonth, viewMode, panToMonth, isProgrammaticMonthChange, hasInitializedRef]);

  // Handle viewport movement - track zoom and position for sticky overlays
  const handleMove = useCallback((event, newViewport) => {
    // Disabled auto-sync: Calendar panning no longer updates month selector
    // Users can pan freely without jumping months
    setZoomLevel(newViewport.zoom);
    setViewport(newViewport); // Track viewport for sticky headers
  }, [setZoomLevel]);

  // Calculate sticky headers based on viewport and nodes
  useEffect(() => {
    if (!nodes.length || !startDateRef.current) return;

    const containerWidth = window.innerWidth || 1200;
    const containerHeight = window.innerHeight || 800;

    // Calculate visible X range (for dates)
    const viewportLeft = -viewport.x / viewport.zoom;
    const viewportRight = viewportLeft + containerWidth / viewport.zoom;

    // Calculate visible Y range (for goals)
    const viewportTop = -viewport.y / viewport.zoom;
    const viewportBottom = viewportTop + containerHeight / viewport.zoom;

    // Find visible date nodes - format as "MMM D" (e.g., "OCT 1", "NOV 2")
    const visibleDates = [];
    let currentDate = startDateRef.current.clone();
    const pixelsPerDay = 70;
    let xOffset = 150;

    // Scan through dates and find visible dates
    const endDate = moment(startDateRef.current).add(365, 'days'); // Scan up to 1 year ahead
    const today = moment().startOf('day');
    while (currentDate.isBefore(endDate)) {
      // Check if this date is in visible range
      if (xOffset >= viewportLeft && xOffset <= viewportRight) {
        // Check if this is today's date
        const isToday = currentDate.isSame(today, 'day');
        // Add date formatted as "MMM D" (e.g., "OCT 1", "NOV 2")
        visibleDates.push({
          label: currentDate.format('MMM D'),
          x: xOffset,
          isToday: isToday,
        });
      }

      xOffset += pixelsPerDay;
      currentDate.add(1, 'day');
    }

    // Find visible goals
    const visibleGoals = goalRowsRef.current
      .filter(goal => {
        // Check if goal is in visible Y range
        return goal.y >= viewportTop && goal.y <= viewportBottom;
      })
      .map(goal => ({
        name: goal.name,
        x: 10,
        y: goal.y,
      }));

    setStickyDates(visibleDates);
    setStickyGoals(visibleGoals);
  }, [viewport, nodes, startDateRef.current]);

  const selectAllFilters = () => {
    const allTrue = Object.fromEntries(
      Object.keys(selectedFilters).map((key) => [key, true])
    );
    setSelectedFilters(allTrue);
  };

  const clearAllFilters = () => {
    const allFalse = Object.fromEntries(
      Object.keys(selectedFilters).map((key) => [key, false])
    );
    setSelectedFilters(allFalse);
  };

  // Generate table data for calendar
  const generateTableData = () => {
    // Filter activities
    let filteredActivities = activities.filter(
      (activity) =>
        selectedFilters[activity.type] &&
        activity.type !== 'comment' &&
        activity.type !== 'metrics'
    );

    if (selectedGoal !== 'all') {
      filteredActivities = filteredActivities.filter(
        (activity) => activity.goalName === selectedGoal || activity.type === 'northStar' || activity.type === 'northStarUpdate'
      );
    }

    // Determine date range - include past dates
    let startDate, endDate;
    const today = moment().startOf('day');
    
    if (viewMode === 'month') {
      // Show full month including past dates
      startDate = currentMonth.clone().startOf('month');
      endDate = currentMonth.clone().endOf('month');
    } else {
      // For "All Time" view, include all dates from activities
      if (filteredActivities.length > 0) {
        const sorted = [...filteredActivities].sort((a, b) => new Date(a.date) - new Date(b.date));
        const earliestDate = moment(sorted[0].date).startOf('month');
        const latestDate = moment(sorted[sorted.length - 1].date).endOf('month');
        // Show from earliest activity date, extend 1 month before and after
        startDate = earliestDate.clone().subtract(1, 'month');
        endDate = latestDate.clone().add(1, 'month');
      } else {
        // Show current month with past dates
        startDate = moment().startOf('month');
        endDate = moment().endOf('month');
      }
    }

    // Generate dates array
    const dates = [];
    const currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate)) {
      dates.push(currentDate.clone());
      currentDate.add(1, 'day');
    }

    // Group activities by goal
    const goalGroups = {};
    filteredActivities.forEach((activity) => {
      const goalKey = activity.goalName || activity.goalId || (activity.type === 'northStar' || activity.type === 'northStarUpdate' ? 'North Star Metrics' : 'Other');
      if (!goalGroups[goalKey]) {
        goalGroups[goalKey] = {
          name: goalKey,
          activities: {},
        };
      }
      const dateKey = moment(activity.date).format('YYYY-MM-DD');
      if (!goalGroups[goalKey].activities[dateKey]) {
        goalGroups[goalKey].activities[dateKey] = [];
      }
      goalGroups[goalKey].activities[dateKey].push(activity);
    });

    return { dates, goalGroups };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading Growth Calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <style>{`
        /* Hide ReactFlow node connection dots by making them match background */
        .react-flow__handle {
          background: white !important;
          border-color: white !important;
        }
        .dark .react-flow__handle,
        [data-theme="dark"] .react-flow__handle {
          background: black !important;
          border-color: black !important;
        }
        /* Also hide on hover/selected states */
        .react-flow__node.selected .react-flow__handle,
        .react-flow__node:hover .react-flow__handle {
          background: white !important;
          border-color: white !important;
        }
        .dark .react-flow__node.selected .react-flow__handle,
        .dark .react-flow__node:hover .react-flow__handle,
        [data-theme="dark"] .react-flow__node.selected .react-flow__handle,
        [data-theme="dark"] .react-flow__node:hover .react-flow__handle {
          background: black !important;
          border-color: black !important;
        }
        /* Remove hover shadows from ReactFlow nodes */
        .react-flow__node:hover,
        .react-flow__node.selected,
        .react-flow__node-default:hover,
        .react-flow__node-default.selected,
        .calendar-node:hover,
        .calendar-node.selected {
          box-shadow: none !important;
          filter: none !important;
        }
        /* Remove shadows from circle elements inside nodes */
        .react-flow__node:hover div,
        .react-flow__node.selected div,
        .calendar-node:hover div,
        .calendar-node.selected div {
          box-shadow: none !important;
        }
        /* Hide scrollbars */
        .react-flow__viewport,
        .react-flow__container {
          overflow: hidden !important;
        }
        /* Hide scrollbars but allow scrolling functionality */
        .react-flow__viewport::-webkit-scrollbar,
        .react-flow__container::-webkit-scrollbar {
          display: none;
        }
        .react-flow__viewport,
        .react-flow__container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* Custom scrollbar for activity cells */
        table td::-webkit-scrollbar {
          width: 4px;
        }
        table td::-webkit-scrollbar-track {
          background: transparent;
        }
        table td::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        table td::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        /* Firefox scrollbar for activity cells */
        table td {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
      `}</style>
      {/* Header Section */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-4">
            {/* Title and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                  Growth Calendar
                </h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Month Navigation - Only show in month view */}
                {viewMode === 'month' && (
                  <div className="flex items-center border border-input dark:border-gray-700 rounded-md overflow-hidden bg-background">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newMonth = currentMonth.clone().subtract(1, 'month');
                        isProgrammaticMonthChange.current = false;
                        setCurrentMonth(newMonth);
                      }}
                      className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[140px] text-center px-3 py-2 bg-gray-50 dark:bg-gray-800/50">
                      {currentMonth.format('MMMM YYYY')}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newMonth = currentMonth.clone().add(1, 'month');
                        isProgrammaticMonthChange.current = false;
                        setCurrentMonth(newMonth);
                      }}
                      className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* View Mode Toggle */}
                <div className="flex border border-input dark:border-gray-700 rounded-md overflow-hidden bg-background">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className={`rounded-none border-0 h-9 px-4 text-sm font-medium ${
                      viewMode === 'month' 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    Month
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('all')}
                    className={`rounded-none border-0 border-l border-input dark:border-gray-700 h-9 px-4 text-sm font-medium ${
                      viewMode === 'all' 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    All Time
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-9 gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Goal Selector and Filters Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Goal Selector */}
              {availableGoals.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap">Goal:</label>
                  <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                    <SelectTrigger className="w-[200px] h-9">
                      <SelectValue placeholder="All Goals" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Goals</SelectItem>
                      {availableGoals.map((goal) => (
                        <SelectItem key={goal} value={goal}>
                          {goal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filters Panel */}
              {showFilters && (
                <Card className="flex-1 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Activity Types</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={selectAllFilters} 
                          className="text-xs h-7 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          All
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearAllFilters} 
                          className="text-xs h-7 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          None
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowFilters(false)} 
                          className="h-7 w-7 p-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activityTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedFilters[type.key];
                        return (
                          <Button
                            key={type.key}
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFilter(type.key)}
                            className={`h-8 gap-2 text-xs border ${
                              isSelected 
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600' 
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {type.label}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Table */}
      <div className="flex-1 bg-background dark:bg-background overflow-hidden">
        {activities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Calendar className="h-16 w-16 text-muted-foreground dark:text-gray-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground dark:text-gray-200">No Activities Yet</h3>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Start creating goals, ideas, and experiments!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Card className="m-6 border-border dark:border-gray-700">
            <CardContent className="p-0">
              <div 
                className="w-full"
                style={{ maxHeight: 'calc(100vh - 250px)' }}
                ref={(el) => {
                  if (el && !loading && activities.length > 0) {
                    // Scroll to today's date column when calendar loads
                    const todayCell = el.querySelector('[data-today-date="true"]');
                    if (todayCell) {
                      setTimeout(() => {
                        todayCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      }, 100);
                    }
                  }
                }}
              >
                {(() => {
                  const { dates, goalGroups } = generateTableData();
                  const today = moment().format('YYYY-MM-DD');
                  const goalNames = Object.keys(goalGroups);
                  
                  return (
                    <div className="overflow-x-auto overflow-y-auto w-full" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                      <table className="w-full caption-bottom text-sm border-collapse" style={{ minWidth: `${dates.length * 100 + 300}px` }}>
                        <thead className="[&_tr]:border-b">
                          <tr className="bg-muted/50 dark:bg-muted/30 border-b border-border dark:border-gray-700">
                            <th className="sticky left-0 z-10 bg-background dark:bg-background h-12 px-4 text-left align-middle font-semibold text-muted-foreground dark:text-gray-300 min-w-[250px] max-w-[300px] border-r border-border dark:border-gray-700">
                              Goal
                            </th>
                            {dates.map((date) => {
                              const dateKey = date.format('YYYY-MM-DD');
                              const isToday = dateKey === today;
                              return (
                                <th
                                  key={dateKey}
                                  data-today-date={isToday ? "true" : "false"}
                                  className={`h-12 px-4 text-center align-middle font-semibold min-w-[100px] border-border dark:border-gray-700 ${
                                    isToday ? 'bg-blue-50 dark:bg-blue-900/30' : 'text-muted-foreground dark:text-gray-400'
                                  }`}
                                >
                                  <div className={`py-2 ${
                                    isToday 
                                      ? 'text-blue-600 dark:text-blue-400 font-bold' 
                                      : 'text-muted-foreground dark:text-gray-400'
                                  }`}>
                                    {date.format('MMM D')}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                          {goalNames.length === 0 ? (
                            <tr className="border-b border-border dark:border-gray-700 transition-colors hover:bg-muted/50 dark:hover:bg-muted/30">
                              <td colSpan={dates.length + 1} className="p-4 align-middle text-center py-8 text-muted-foreground dark:text-gray-400">
                                No activities found
                              </td>
                            </tr>
                          ) : (
                            goalNames.map((goalKey) => {
                              const goal = goalGroups[goalKey];
                              return (
                                <tr key={goalKey} className="border-b border-border dark:border-gray-700 transition-colors hover:bg-muted/50 dark:hover:bg-muted/30">
                                  <td className="sticky left-0 z-10 bg-background dark:bg-background p-4 align-middle font-medium text-foreground dark:text-gray-200 border-r border-border dark:border-gray-700 min-w-[250px] max-w-[300px]">
                                    <div className="whitespace-normal break-words" title={goal.name}>
                                      {goal.name}
                                    </div>
                                  </td>
                                  {dates.map((date) => {
                                    const dateKey = date.format('YYYY-MM-DD');
                                    const isToday = dateKey === today;
                                    const dayActivities = goal.activities[dateKey] || [];
                                    
                                  return (
                                    <td
                                      key={dateKey}
                                      className={`p-1 align-top text-center border-r border-border dark:border-gray-700 ${
                                        isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-background dark:bg-background'
                                      }`}
                                      style={{ 
                                        maxHeight: '150px',
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        position: 'relative'
                                      }}
                                    >
                                      {dayActivities.length > 0 && (
                                        <div className="space-y-1">
                                          {dayActivities.map((activity, idx) => {
                                            const activityConfig = activityTypes.find(t => t.key === activity.type);
                                            const Icon = activityConfig?.icon || Calendar;
                                            return (
                                              <div
                                                key={idx}
                                                className="flex items-center justify-center gap-1 text-xs p-1.5 rounded mb-1 dark:opacity-90"
                                                style={{
                                                  backgroundColor: activityConfig?.color || '#9ca3af',
                                                  color: 'white',
                                                  minHeight: '28px',
                                                }}
                                                title={activity.name || activity.description || activity.type}
                                              >
                                                <Icon className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate max-w-[80px] text-xs">
                                                  {activity.name || activity.description || activity.type}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </td>
                                  );
                                  })}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectCalendar;
