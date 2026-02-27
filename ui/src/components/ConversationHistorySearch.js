import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  Close,
  History,
  Person,
  SmartToy,
} from '@mui/icons-material';

const ConversationHistorySearch = ({ open, onClose, conversations, onSelectConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    
    const term = searchTerm.toLowerCase();
    return conversations.filter(conv => 
      conv.content.toLowerCase().includes(term)
    );
  }, [conversations, searchTerm]);

  const handleSelect = (conversation) => {
    onSelectConversation(conversation);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History color="primary" />
            <Typography variant="h6">Search Conversation History</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Found {filteredConversations.length} message(s)
          </Typography>
        </Box>

        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredConversations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No conversations found
              </Typography>
            </Box>
          ) : (
            filteredConversations.map((conv) => (
              <ListItem
                key={conv.id}
                button
                onClick={() => handleSelect(conv)}
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
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {conv.type === 'user' ? (
                      <Person fontSize="small" color="action" />
                    ) : (
                      <SmartToy fontSize="small" color="primary" />
                    )}
                    <Chip
                      label={conv.type === 'user' ? 'You' : 'AI'}
                      size="small"
                      color={conv.type === 'user' ? 'default' : 'primary'}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(conv.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {conv.content}
                  </Typography>
                  {conv.confidence && (
                    <Chip
                      label={`${Math.round(conv.confidence * 100)}% confidence`}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </ListItem>
            ))
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationHistorySearch;
