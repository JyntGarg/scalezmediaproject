import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Lightbulb, FlaskConical, BookOpen, Check, Clock, XCircle } from 'lucide-react';
import moment from 'moment';

const MilestoneNode = ({ data }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Icon based on type
  const getIcon = () => {
    switch (data.type) {
      case 'idea':
        return <Lightbulb size={20} />;
      case 'test':
        return <FlaskConical size={20} />;
      case 'learning':
        return <BookOpen size={20} />;
      default:
        return null;
    }
  };

  // Color based on type and status
  const getColors = () => {
    const baseColors = {
      idea: { bg: '#10B981', border: '#059669', light: '#D1FAE5' },
      test: { bg: '#F59E0B', border: '#D97706', light: '#FEF3C7' },
      learning: { bg: '#8B5CF6', border: '#7C3AED', light: '#EDE9FE' },
    };

    const colors = baseColors[data.type] || baseColors.idea;

    // Modify based on status
    if (data.status === 'completed') {
      return { ...colors, indicator: '#10B981' };
    } else if (data.status === 'in_progress') {
      return { ...colors, indicator: '#F59E0B' };
    } else if (data.status === 'blocked') {
      return { ...colors, indicator: '#EF4444' };
    }

    return { ...colors, indicator: '#6B7280' };
  };

  const colors = getColors();

  // Status icon
  const getStatusIcon = () => {
    switch (data.status) {
      case 'completed':
        return <Check size={14} color="#10B981" />;
      case 'in_progress':
        return <Clock size={14} color="#F59E0B" />;
      case 'blocked':
        return <XCircle size={14} color="#EF4444" />;
      default:
        return <Clock size={14} color="#6B7280" />;
    }
  };

  return (
    <>
      <Handle type="target" position={Position.Left} style={{ background: colors.border }} />

      <div
        className="milestone-node"
        style={{
          background: colors.bg,
          borderColor: colors.border,
          color: 'white',
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="milestone-icon">
          {getIcon()}
        </div>

        <div
          className="milestone-status-indicator"
          style={{ background: colors.indicator }}
        >
          {getStatusIcon()}
        </div>

        {/* Hover Tooltip */}
        {showTooltip && (
          <div className="milestone-tooltip">
            <div className="tooltip-header">
              <h4>{data.label}</h4>
              <span className={`status-badge status-${data.status}`}>
                {data.status?.replace('_', ' ')}
              </span>
            </div>

            {data.description && (
              <p className="tooltip-description">{data.description}</p>
            )}

            <div className="tooltip-meta">
              {data.updatedBy && (
                <div className="meta-item">
                  <span className="meta-label">Updated by:</span>
                  <span className="meta-value">{data.updatedBy.name || data.updatedBy.email}</span>
                </div>
              )}

              {data.updatedAt && (
                <div className="meta-item">
                  <span className="meta-label">Updated:</span>
                  <span className="meta-value">{moment(data.updatedAt).fromNow()}</span>
                </div>
              )}

              {data.members && data.members.length > 0 && (
                <div className="meta-item">
                  <span className="meta-label">Members:</span>
                  <div className="members-list">
                    {data.members.map((member, idx) => (
                      <span key={idx} className="member-tag">
                        {member.name || member.email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="tooltip-footer">
              <small>Click to edit • Drag to reschedule</small>
            </div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: colors.border }} />
    </>
  );
};

export default memo(MilestoneNode);
