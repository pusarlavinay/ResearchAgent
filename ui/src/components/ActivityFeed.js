import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  CloudUpload,
  Search,
  CheckCircle,
  Error,
  Info,
  Delete,
  ExpandMore,
  ExpandLess,
  Timeline,
} from '@mui/icons-material';
import { useAppContext } from '../contexts/AppContext';

const ActivityFeed = () => {
  const { documents, conversations } = useAppContext();
  const [activities, setActivities] = useState([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const newActivities = [];

    // Add document activities
    documents.slice(-5).forEach(doc => {
      newActivities.push({
        id: `doc-${doc.id}`,
        type: 'upload',
        title: 'Document Uploaded',
        description: doc.filename,
        timestamp: new Date(doc.created_at),
        icon: <CloudUpload />,
        color: 'success',
      });
    });

    // Add conversation activities
    conversations.slice(-5).forEach(conv => {
      if (conv.type === 'ai') {
        newActivities.push({
          id: `conv-${conv.id}`,
          type: 'query',
          title: 'Query Processed',
          description: `Confidence: ${Math.round((conv.confidence || 0) * 100)}%`,
          timestamp: new Date(conv.timestamp),
          icon: <Search />,
          color: 'primary',
        });
      }
    });

    // Sort by timestamp
    newActivities.sort((a, b) => b.timestamp - a.timestamp);
    setActivities(newActivities.slice(0, 10));
  }, [documents, conversations]);

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timeline color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Activity Feed
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        {activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Info sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No recent activity
            </Typography>
          </Box>
        ) : (
          <List sx={{ overflow: 'auto', maxHeight: 400 }}>
            {activities.map((activity) => (
              <ListItem
                key={activity.id}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon>
                  <Avatar
                    sx={{
                      bgcolor: `${activity.color}.main`,
                      width: 32,
                      height: 32,
                    }}
                  >
                    {activity.icon}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {activity.title}
                      </Typography>
                      <Chip
                        label={getTimeAgo(activity.timestamp)}
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                    >
                      {activity.description}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Collapse>
    </Paper>
  );
};

export default ActivityFeed;
