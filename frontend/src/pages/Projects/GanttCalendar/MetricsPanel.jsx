import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import moment from 'moment';

const MetricsPanel = ({ metric, goals }) => {
  // Calculate trend
  const calculateTrend = (current, past) => {
    if (!past || past === 0) return 0;
    return ((current - past) / past) * 100;
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp size={16} color="#10B981" />;
    if (trend < 0) return <TrendingDown size={16} color="#EF4444" />;
    return <Minus size={16} color="#6B7280" />;
  };

  const getProgressPercentage = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min(100, (current / target) * 100);
  };

  return (
    <div className="metrics-panel">
      <div className="metrics-panel-header">
        <h3>
          <Target size={20} />
          {metric.name}
        </h3>
        {metric.updatedAt && (
          <span className="last-updated">
            Last updated {moment(metric.updatedAt).fromNow()}
          </span>
        )}
      </div>

      <div className="metrics-grid">
        {/* North Star Metric Card */}
        <div className="metric-card north-star-card">
          <div className="metric-label">Current Value</div>
          <div className="metric-value large">
            {metric.currentValue?.toLocaleString() || 0}
          </div>

          <div className="metric-stats">
            <div className="stat-item">
              <span className="stat-label">Past</span>
              <span className="stat-value">{metric.pastValue?.toLocaleString() || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Target</span>
              <span className="stat-value target">{metric.targetValue?.toLocaleString() || 0}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div className="progress-bar-label">
              <span>Progress to Target</span>
              <span>{getProgressPercentage(metric.currentValue, metric.targetValue).toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${getProgressPercentage(metric.currentValue, metric.targetValue)}%`,
                  background: getProgressPercentage(metric.currentValue, metric.targetValue) >= 100
                    ? '#10B981'
                    : '#3B82F6'
                }}
              />
            </div>
          </div>

          {/* Trend */}
          <div className="metric-trend">
            {getTrendIcon(calculateTrend(metric.currentValue, metric.pastValue))}
            <span className={calculateTrend(metric.currentValue, metric.pastValue) >= 0 ? 'positive' : 'negative'}>
              {Math.abs(calculateTrend(metric.currentValue, metric.pastValue)).toFixed(1)}%
            </span>
            <span className="trend-label">vs. past value</span>
          </div>

          {metric.updatedBy && (
            <div className="metric-footer">
              Updated by {metric.updatedBy.name || metric.updatedBy.email}
            </div>
          )}
        </div>

        {/* Goal Key Metrics */}
        <div className="goal-metrics-section">
          <h4>Key Metrics by Goal</h4>
          <div className="goal-metrics-grid">
            {goals?.map(goal => (
              goal.keyMetrics && goal.keyMetrics.length > 0 && (
                <div key={goal._id} className="goal-metrics-group">
                  <h5 className="goal-name">{goal.title}</h5>
                  <div className="key-metrics-list">
                    {goal.keyMetrics.map((keyMetric, idx) => (
                      <div key={idx} className="key-metric-card">
                        <div className="key-metric-header">
                          <span className="key-metric-name">{keyMetric.name}</span>
                          {keyMetric.updatedAt && (
                            <span className="key-metric-date">
                              {moment(keyMetric.updatedAt).format('MMM D')}
                            </span>
                          )}
                        </div>

                        <div className="key-metric-values">
                          <div className="value-item">
                            <span className="value-label">Current</span>
                            <span className="value-number current">
                              {keyMetric.currentValue?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="value-divider">→</div>
                          <div className="value-item">
                            <span className="value-label">Target</span>
                            <span className="value-number target">
                              {keyMetric.targetValue?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>

                        {/* Mini Progress Bar */}
                        <div className="mini-progress-bar">
                          <div
                            className="mini-progress-fill"
                            style={{
                              width: `${getProgressPercentage(keyMetric.currentValue, keyMetric.targetValue)}%`
                            }}
                          />
                        </div>

                        {keyMetric.updatedBy && (
                          <div className="key-metric-footer">
                            <span className="updater-name">
                              {keyMetric.updatedBy.name || keyMetric.updatedBy.email}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
