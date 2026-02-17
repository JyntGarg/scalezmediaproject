# Gantt Calendar Component

A powerful, interactive timeline calendar for visualizing project goals, ideas, tests, and learnings with connected milestone nodes.

## Features

✅ **Hierarchical Project Structure**
- Project → Goals → Ideas → Tests → Learnings
- Visual connections showing relationships
- Color-coded milestone nodes

✅ **Metrics Tracking**
- North Star Metrics (project-level)
- Key Metrics (goal-level)
- Past, Current, and Target values
- Progress indicators and trends
- Track who updated and when

✅ **Interactive Timeline**
- Drag-and-drop to reschedule items
- Zoom in/out controls
- Pan and navigate timeline
- Responsive calendar header

✅ **Rich Information Display**
- Hover cards with full details
- Status indicators (completed, in progress, blocked)
- Member assignments
- Update history

✅ **Filtering**
- Filter view by North Star Metric
- Swimlanes organized by goals

## Components

### 1. GanttCalendar.jsx
Main container component that orchestrates the entire calendar.

**Props:**
- `projectData` (object, required): Project data with goals, metrics, ideas, tests, learnings
- `onNodeUpdate` (function, optional): Callback when a node is dragged/updated

### 2. GanttCalendarHeader.jsx
Displays the calendar header with months and dates.

**Props:**
- `dateRange` (object): `{ start: Date, end: Date }`

### 3. MilestoneNode.jsx
Custom ReactFlow node for Ideas, Tests, and Learnings.

**Features:**
- Icon based on type (lightbulb, flask, book)
- Color coding by type and status
- Hover tooltip with details
- Draggable for rescheduling

### 4. MetricsPanel.jsx
Displays North Star Metrics and Key Metrics with progress tracking.

**Props:**
- `metric` (object): Selected North Star Metric
- `goals` (array): Array of goals with their key metrics

## Data Structure

```javascript
{
  _id: 'project-1',
  name: 'Project Name',
  members: [
    { _id: 'user-1', name: 'John', email: 'john@example.com' }
  ],

  northStarMetrics: [
    {
      _id: 'nsm-1',
      name: 'Monthly Active Users',
      currentValue: 15000,
      pastValue: 12000,
      targetValue: 20000,
      updatedBy: { _id: 'user-1', name: 'John' },
      updatedAt: Date
    }
  ],

  goals: [
    {
      _id: 'goal-1',
      title: 'Increase Acquisition',
      status: 'in_progress',
      members: [{ _id: 'user-1', name: 'John' }],

      keyMetrics: [
        {
          name: 'Sign-up Rate',
          currentValue: 3.5,
          targetValue: 5.0,
          updatedBy: { _id: 'user-1', name: 'John' },
          updatedAt: Date
        }
      ],

      ideas: [
        {
          _id: 'idea-1',
          title: 'Referral Program',
          description: 'Launch referral program',
          status: 'in_progress',
          members: [{ _id: 'user-1', name: 'John' }],
          createdAt: Date,
          updatedAt: Date,
          updatedBy: { _id: 'user-1', name: 'John' },

          tests: [
            {
              _id: 'test-1',
              title: 'A/B Test',
              description: 'Test variations',
              status: 'in_progress',
              createdAt: Date,
              updatedAt: Date,
              updatedBy: { _id: 'user-1', name: 'John' },

              learnings: [
                {
                  _id: 'learning-1',
                  title: 'Key finding',
                  description: 'What we learned',
                  status: 'completed',
                  createdAt: Date,
                  updatedAt: Date,
                  updatedBy: { _id: 'user-1', name: 'John' }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Usage

### Basic Usage

```jsx
import GanttCalendar from './pages/Projects/GanttCalendar';

function ProjectTimeline() {
  const projectData = {
    // ... your project data
  };

  const handleUpdate = (nodeId, updates) => {
    console.log('Node updated:', nodeId, updates);
    // Update your backend
  };

  return (
    <GanttCalendar
      projectData={projectData}
      onNodeUpdate={handleUpdate}
    />
  );
}
```

### With API Integration

```jsx
import { useState, useEffect } from 'react';
import GanttCalendar from './pages/Projects/GanttCalendar';
import { fetchProject, updateNodeDate } from './api';

function ProjectTimeline({ projectId }) {
  const [projectData, setProjectData] = useState(null);

  useEffect(() => {
    fetchProject(projectId).then(setProjectData);
  }, [projectId]);

  const handleNodeUpdate = async (nodeId, updates) => {
    // Parse node ID to get type and ID
    const [type, id] = nodeId.split('-');

    // Update backend
    await updateNodeDate(type, id, updates.date);

    // Refresh data
    const updatedData = await fetchProject(projectId);
    setProjectData(updatedData);
  };

  if (!projectData) return <div>Loading...</div>;

  return (
    <GanttCalendar
      projectData={projectData}
      onNodeUpdate={handleNodeUpdate}
    />
  );
}
```

## Customization

### Change Colors

Edit `ganttCalendar.css`:

```css
/* Idea nodes - currently green */
case 'idea': return '#10B981';

/* Test nodes - currently orange */
case 'test': return '#F59E0B';

/* Learning nodes - currently purple */
case 'learning': return '#8B5CF6';
```

### Adjust Timeline Spacing

In `GanttCalendar.jsx`, change `dayWidth`:

```javascript
const dayWidth = 80; // Pixels per day (default: 80)
```

### Custom Node Icons

Edit `MilestoneNode.jsx`:

```javascript
const getIcon = () => {
  switch (data.type) {
    case 'idea':
      return <YourCustomIcon size={20} />;
    // ...
  }
};
```

## Dependencies

- `react` ^19.2.0
- `reactflow` ^11.11.4
- `moment` ^2.30.1
- `lucide-react` ^0.460.0

## File Structure

```
GanttCalendar/
├── GanttCalendar.jsx          # Main component
├── GanttCalendarHeader.jsx    # Calendar header
├── MilestoneNode.jsx          # Custom node component
├── MetricsPanel.jsx           # Metrics display
├── ganttCalendar.css          # Styles
├── ExampleUsage.jsx           # Usage examples
├── index.js                   # Exports
└── README.md                  # Documentation
```

## Features Explained

### 1. Swimlanes by Goals
Each goal gets its own horizontal lane, making it easy to see all work related to that goal.

### 2. Connected Nodes
Visual arrows connect related items:
- Goal → Ideas
- Ideas → Tests
- Tests → Learnings

### 3. Drag to Reschedule
Drag any milestone node left/right to change its date. The `onNodeUpdate` callback receives the new date.

### 4. Status Indicators
Small badge on each node shows status:
- ✓ Green = Completed
- ⏰ Orange = In Progress
- ✕ Red = Blocked
- ⏰ Gray = Pending

### 5. Hover for Details
Hover over any node to see:
- Full title and description
- Current status
- Who updated it and when
- Assigned members

### 6. Zoom Controls
Use zoom buttons to:
- Zoom out: See entire year
- Zoom in: Focus on specific weeks

### 7. North Star Metric Filter
Select a North Star Metric to:
- Highlight related work
- Show metric progress
- View goal-level key metrics

### 8. Metrics Tracking
**North Star Metrics:**
- Project-wide metrics
- Anyone on project can update
- Shows past → current → target
- Visual progress bar

**Key Metrics:**
- Goal-specific metrics
- Goal members can update
- Grouped by goal
- Mini progress indicators

## Best Practices

1. **Date Organization**: Ensure createdAt/updatedAt dates are accurate for proper timeline positioning

2. **Member Assignment**: Assign specific members to ideas/tests to track ownership

3. **Status Updates**: Keep status current (pending, in_progress, completed, blocked)

4. **Metrics Updates**: Regularly update metric values to track progress

5. **Descriptive Names**: Use clear, concise titles for nodes

## Troubleshooting

**Nodes not appearing:**
- Check that createdAt dates are within the dateRange
- Verify data structure matches expected format

**Drag not working:**
- Ensure onNodeUpdate callback is defined
- Check that nodes have draggable: true

**Styling issues:**
- Make sure ganttCalendar.css is imported
- Check for CSS conflicts with global styles

**Performance with large datasets:**
- Consider pagination for goals
- Limit date range to relevant period
- Use React.memo for node components (already implemented)

## Future Enhancements

Potential additions:
- Export to PDF/PNG
- Print-friendly view
- Mobile responsiveness
- Custom date ranges
- Filtering by member
- Search functionality
- Keyboard shortcuts
- Undo/redo for drag operations
- Real-time collaboration
- Comments on nodes

## Support

For issues or questions, refer to:
- ExampleUsage.jsx for implementation examples
- ReactFlow documentation: https://reactflow.dev
- Lucide icons: https://lucide.dev

---

Built with ❤️ using React and ReactFlow
