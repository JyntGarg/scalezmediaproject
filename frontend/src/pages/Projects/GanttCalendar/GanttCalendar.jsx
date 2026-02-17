import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import GanttCalendarHeader from './GanttCalendarHeader';
import MilestoneNode from './MilestoneNode';
import MetricsPanel from './MetricsPanel';
import './ganttCalendar.css';

const GanttCalendar = ({ projectData, onNodeUpdate }) => {
  const [selectedNorthStarMetric, setSelectedNorthStarMetric] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1), // Start of year
    end: new Date(new Date().getFullYear(), 11, 31)  // End of year
  });
  const [zoomLevel, setZoomLevel] = useState(1);

  // Custom node types
  const nodeTypes = useMemo(() => ({
    milestone: MilestoneNode,
  }), []);

  // Generate nodes and edges from project data
  const generateNodesAndEdges = useCallback(() => {
    const nodes = [];
    const edges = [];
    let yPosition = 100;
    const dayWidth = 80; // Width per day on timeline
    const swimlaneHeight = 200;

    // Calculate position based on date
    const getXPosition = (date) => {
      const startTime = dateRange.start.getTime();
      const dateTime = new Date(date).getTime();
      const daysDiff = (dateTime - startTime) / (1000 * 60 * 60 * 24);
      return daysDiff * dayWidth;
    };

    const projectGoals = projectData?.goals || [];
    projectGoals.forEach((goal, goalIndex) => {
      const goalYPosition = yPosition + (goalIndex * swimlaneHeight);

      // Add goal header node
      nodes.push({
        id: `goal-${goal._id}`,
        type: 'default',
        data: {
          label: goal.title,
          members: goal.members,
          type: 'goal'
        },
        position: { x: -200, y: goalYPosition },
        draggable: false,
        style: {
          background: '#4F46E5',
          color: 'white',
          border: '2px solid #4338CA',
          borderRadius: '8px',
          padding: '10px',
          width: 180,
          fontWeight: 'bold'
        }
      });

      // Process ideas under this goal
      const goalIdeas = goal.ideas || [];
      goalIdeas.forEach((idea, ideaIndex) => {
        const ideaId = `idea-${idea._id}`;
        const ideaX = getXPosition(idea.createdAt);

        nodes.push({
          id: ideaId,
          type: 'milestone',
          data: {
            label: idea.title,
            type: 'idea',
            status: idea.status,
            updatedBy: idea.updatedBy,
            updatedAt: idea.updatedAt,
            members: idea.members,
            description: idea.description
          },
          position: { x: ideaX, y: goalYPosition },
          draggable: true,
        });

        // Connect to goal
        edges.push({
          id: `edge-goal-${goal._id}-${ideaId}`,
          source: `goal-${goal._id}`,
          target: ideaId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#9CA3AF', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#9CA3AF',
          },
        });

        // Process tests under this idea
        let previousTestId = ideaId;
        const ideaTests = idea.tests || [];
        ideaTests.forEach((test, testIndex) => {
          const testId = `test-${test._id}`;
          const testX = getXPosition(test.createdAt);

          nodes.push({
            id: testId,
            type: 'milestone',
            data: {
              label: test.title,
              type: 'test',
              status: test.status,
              updatedBy: test.updatedBy,
              updatedAt: test.updatedAt,
              description: test.description
            },
            position: { x: testX, y: goalYPosition + 40 },
            draggable: true,
          });

          // Connect to previous node (idea or previous test)
          edges.push({
            id: `edge-${previousTestId}-${testId}`,
            source: previousTestId,
            target: testId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#9CA3AF', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#9CA3AF',
            },
          });

          // Process learnings under this test
          const testLearnings = test.learnings || [];
          testLearnings.forEach((learning, learningIndex) => {
            const learningId = `learning-${learning._id}`;
            const learningX = getXPosition(learning.createdAt);

            nodes.push({
              id: learningId,
              type: 'milestone',
              data: {
                label: learning.title,
                type: 'learning',
                status: learning.status,
                updatedBy: learning.updatedBy,
                updatedAt: learning.updatedAt,
                description: learning.description
              },
              position: { x: learningX, y: goalYPosition + 80 },
              draggable: true,
            });

            // Connect to test
            edges.push({
              id: `edge-${testId}-${learningId}`,
              source: testId,
              target: learningId,
              type: 'smoothstep',
              animated: false,
              style: { stroke: '#9CA3AF', strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#9CA3AF',
              },
            });
          });

          previousTestId = testId;
        });
      });
    });

    return { nodes, edges };
  }, [projectData, dateRange]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => generateNodesAndEdges(),
    [generateNodesAndEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node drag end - update date
  const onNodeDragStop = useCallback((event, node) => {
    const dayWidth = 80;
    const newX = node.position.x;
    const daysDiff = newX / dayWidth;
    const newDate = new Date(dateRange.start.getTime() + (daysDiff * 24 * 60 * 60 * 1000));

    if (onNodeUpdate) {
      onNodeUpdate(node.id, { date: newDate, position: node.position });
    }
  }, [dateRange, onNodeUpdate]);

  // Regenerate nodes when project data changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [projectData, generateNodesAndEdges, setNodes, setEdges]);

  return (
    <div className="gantt-calendar-container">
      {/* Top Controls */}
      <div className="gantt-controls">
        <h2 className="gantt-title">Project Timeline</h2>

        {/* North Star Metric Filter */}
        {projectData?.northStarMetrics?.length > 0 && (
          <div className="north-star-filter">
            <label>Filter by North Star Metric:</label>
            <select
              value={selectedNorthStarMetric?._id || ''}
              onChange={(e) => {
                const metric = projectData.northStarMetrics.find(m => m._id === e.target.value);
                setSelectedNorthStarMetric(metric);
              }}
            >
              <option value="">All</option>
              {projectData.northStarMetrics.map(metric => (
                <option key={metric._id} value={metric._id}>
                  {metric.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="zoom-controls">
          <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))}>
            Zoom Out
          </button>
          <span>{Math.round(zoomLevel * 100)}%</span>
          <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))}>
            Zoom In
          </button>
        </div>
      </div>

      {/* Calendar Header */}
      <GanttCalendarHeader dateRange={dateRange} />

      {/* Metrics Panel */}
      {selectedNorthStarMetric && (
        <MetricsPanel
          metric={selectedNorthStarMetric}
          goals={projectData?.goals}
        />
      )}

      {/* ReactFlow Canvas */}
      <div className="gantt-flow-wrapper" style={{ height: 'calc(100vh - 300px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: zoomLevel }}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.data?.type) {
                case 'idea': return '#10B981';
                case 'test': return '#F59E0B';
                case 'learning': return '#8B5CF6';
                default: return '#6B7280';
              }
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default GanttCalendar;
