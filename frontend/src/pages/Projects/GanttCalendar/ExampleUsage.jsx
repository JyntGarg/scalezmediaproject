import React, { useState } from 'react';
import GanttCalendar from './GanttCalendar';

/**
 * Example usage of GanttCalendar component
 *
 * This demonstrates how to integrate the Gantt Calendar with your project data
 */

const ExampleUsage = () => {
  // Example project data structure
  const [projectData, setProjectData] = useState({
    _id: 'project-1',
    name: 'Growth Experiment 2025',
    members: [
      { _id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      { _id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
      { _id: 'user-3', name: 'Bob Johnson', email: 'bob@example.com' },
    ],

    // North Star Metrics (project-level)
    northStarMetrics: [
      {
        _id: 'nsm-1',
        name: 'Monthly Active Users',
        currentValue: 15000,
        pastValue: 12000,
        targetValue: 20000,
        updatedBy: { _id: 'user-1', name: 'John Doe' },
        updatedAt: new Date('2025-01-05')
      },
      {
        _id: 'nsm-2',
        name: 'Revenue',
        currentValue: 50000,
        pastValue: 45000,
        targetValue: 75000,
        updatedBy: { _id: 'user-2', name: 'Jane Smith' },
        updatedAt: new Date('2025-01-04')
      }
    ],

    // Goals with Ideas, Tests, and Learnings
    goals: [
      {
        _id: 'goal-1',
        title: 'Increase User Acquisition',
        status: 'in_progress',
        members: [
          { _id: 'user-1', name: 'John Doe' },
          { _id: 'user-2', name: 'Jane Smith' }
        ],

        // Key Metrics (goal-level)
        keyMetrics: [
          {
            name: 'Sign-up Rate',
            currentValue: 3.5,
            targetValue: 5.0,
            updatedBy: { _id: 'user-1', name: 'John Doe' },
            updatedAt: new Date('2025-01-05')
          },
          {
            name: 'Cost per Acquisition',
            currentValue: 25,
            targetValue: 20,
            updatedBy: { _id: 'user-2', name: 'Jane Smith' },
            updatedAt: new Date('2025-01-04')
          }
        ],

        ideas: [
          {
            _id: 'idea-1',
            title: 'Referral Program',
            description: 'Launch a referral program where users get rewards for inviting friends',
            status: 'in_progress',
            members: [{ _id: 'user-1', name: 'John Doe' }],
            createdAt: new Date('2025-01-10'),
            updatedAt: new Date('2025-01-12'),
            updatedBy: { _id: 'user-1', name: 'John Doe' },

            tests: [
              {
                _id: 'test-1',
                title: 'A/B Test: $10 vs $20 Reward',
                description: 'Test different reward amounts to see which drives more referrals',
                status: 'in_progress',
                createdAt: new Date('2025-01-15'),
                updatedAt: new Date('2025-01-16'),
                updatedBy: { _id: 'user-1', name: 'John Doe' },

                learnings: [
                  {
                    _id: 'learning-1',
                    title: '$20 reward increased referrals by 45%',
                    description: 'Higher reward value significantly improved participation',
                    status: 'completed',
                    createdAt: new Date('2025-01-20'),
                    updatedAt: new Date('2025-01-21'),
                    updatedBy: { _id: 'user-1', name: 'John Doe' }
                  }
                ]
              },
              {
                _id: 'test-2',
                title: 'Test Email Templates',
                description: 'Test different referral email templates',
                status: 'completed',
                createdAt: new Date('2025-01-18'),
                updatedAt: new Date('2025-01-19'),
                updatedBy: { _id: 'user-2', name: 'Jane Smith' },

                learnings: [
                  {
                    _id: 'learning-2',
                    title: 'Short emails performed better',
                    description: 'Concise emails had 30% higher click-through rate',
                    status: 'completed',
                    createdAt: new Date('2025-01-22'),
                    updatedAt: new Date('2025-01-22'),
                    updatedBy: { _id: 'user-2', name: 'Jane Smith' }
                  }
                ]
              }
            ]
          },
          {
            _id: 'idea-2',
            title: 'Social Media Campaign',
            description: 'Run targeted ads on Facebook and Instagram',
            status: 'pending',
            members: [{ _id: 'user-2', name: 'Jane Smith' }],
            createdAt: new Date('2025-01-25'),
            updatedAt: new Date('2025-01-25'),
            updatedBy: { _id: 'user-2', name: 'Jane Smith' },
            tests: []
          }
        ]
      },
      {
        _id: 'goal-2',
        title: 'Improve User Retention',
        status: 'pending',
        members: [
          { _id: 'user-2', name: 'Jane Smith' },
          { _id: 'user-3', name: 'Bob Johnson' }
        ],

        keyMetrics: [
          {
            name: 'Day 7 Retention',
            currentValue: 35,
            targetValue: 50,
            updatedBy: { _id: 'user-3', name: 'Bob Johnson' },
            updatedAt: new Date('2025-01-03')
          }
        ],

        ideas: [
          {
            _id: 'idea-3',
            title: 'Onboarding Flow Redesign',
            description: 'Redesign the onboarding process to be more engaging',
            status: 'pending',
            members: [{ _id: 'user-3', name: 'Bob Johnson' }],
            createdAt: new Date('2025-02-01'),
            updatedAt: new Date('2025-02-01'),
            updatedBy: { _id: 'user-3', name: 'Bob Johnson' },
            tests: []
          }
        ]
      }
    ]
  });

  // Handle node updates (when user drags a node to change date)
  const handleNodeUpdate = (nodeId, updates) => {
    console.log('Node updated:', nodeId, updates);

    // Here you would typically:
    // 1. Parse the nodeId to determine type (idea/test/learning)
    // 2. Update your backend via API
    // 3. Update local state

    // Example:
    // const [type, id] = nodeId.split('-');
    // if (type === 'idea') {
    //   updateIdea(id, { scheduledDate: updates.date });
    // }
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <GanttCalendar
        projectData={projectData}
        onNodeUpdate={handleNodeUpdate}
      />
    </div>
  );
};

export default ExampleUsage;


/**
 * INTEGRATION GUIDE
 * =================
 *
 * 1. Data Structure Requirements:
 *    - Project must have: goals array, northStarMetrics array
 *    - Each Goal must have: ideas array, keyMetrics array, members array
 *    - Each Idea must have: tests array, createdAt date
 *    - Each Test must have: learnings array, createdAt date
 *    - Each Learning must have: createdAt date
 *
 * 2. API Integration:
 *    - Fetch project data from your backend
 *    - Pass it to the projectData prop
 *    - Implement onNodeUpdate to handle drag-and-drop date changes
 *
 * 3. Customization:
 *    - Modify colors in ganttCalendar.css
 *    - Adjust dayWidth in GanttCalendar.jsx to change spacing
 *    - Customize node icons in MilestoneNode.jsx
 *
 * 4. Adding to Your Routes:
 *    import GanttCalendar from './pages/Projects/GanttCalendar';
 *
 *    <Route path="/projects/:projectId/calendar" element={<GanttCalendar />} />
 */
