import * as React from "react";

export interface ActivityLogProps {
  logs: string[];
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    borderTop: '1px solid #E5E5E7',
    paddingTop: '4px',
    marginTop: '4px'
  },
  logBody: {
    maxHeight: '40px',
    overflowY: 'auto',
    fontFamily: 'monospace',
    fontSize: '0.75em',
    lineHeight: '1.2',
    color: '#666666'
  },
  emptyMessage: {
    color: '#999999',
    fontStyle: 'italic'
  },
  logEntry: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }
};

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  return (
    <div style={styles.container}>
      <div style={styles.logBody}>
        {logs.length === 0 ? (
          <span style={styles.emptyMessage}>No events.</span>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={styles.logEntry}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
