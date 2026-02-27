import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search,
  Analytics,
  CloudUpload,
  Memory,
  Psychology,
  Grain,
  Timeline,
  Speed,
  Hub,
  Circle,
} from '@mui/icons-material';

const Sidebar = ({ open, onToggle, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Hub />,
      path: '/dashboard',
      description: 'Overview & quick actions',
    },
    {
      id: 'query',
      label: 'Query Documents',
      icon: <Search />,
      path: '/query',
      description: 'Search and analyze documents',
    },
    {
      id: 'resume',
      label: 'Resume Analyzer',
      icon: <Psychology />,
      path: '/resume',
      description: 'Analyze resume & skill gaps',
    },
    {
      id: 'upload',
      label: 'Upload Files',
      icon: <CloudUpload />,
      path: '/upload',
      description: 'Add new documents',
    },
    {
      id: 'metrics',
      label: 'System Status',
      icon: <Analytics />,
      path: '/metrics',
      description: 'Performance metrics',
    },
  ];

  const drawerWidth = open ? 280 : 72;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: open ? 3 : 2, textAlign: open ? 'left' : 'center' }}>
        {open ? (
          <Box>
            <Typography
              variant="h5"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                mb: 0.5,
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              Research Agent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Document Intelligence
            </Typography>
          </Box>
        ) : (
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: 'primary.main',
              color: '#ffffff',
              fontSize: '1.2rem',
              fontWeight: 700,
            }}
          >
            RA
          </Avatar>
        )}
      </Box>

      <Divider sx={{ borderColor: 'divider' }} />

      {/* Navigation */}
      <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 1,
                mx: 1,
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                  color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                  },
                  '& .MuiListItemText-secondary': {
                    color: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: location.pathname === item.path 
                    ? (theme.palette.mode === 'dark' ? '#000000' : '#ffffff')
                    : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: 'divider', mx: 2 }} />
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.2s ease-in-out',
          overflow: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;