import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Folder,
  Add,
  Edit,
  Delete,
  MoreVert,
  FolderOpen,
} from '@mui/icons-material';

const CollectionsManager = ({ open, onClose, documents, onUpdateDocument }) => {
  const [collections, setCollections] = useState([
    { id: 'all', name: 'All Documents', count: documents.length },
    { id: 'recent', name: 'Recent', count: 0 },
  ]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      const newCollection = {
        id: Date.now().toString(),
        name: newCollectionName,
        count: 0,
      };
      setCollections([...collections, newCollection]);
      setNewCollectionName('');
    }
  };

  const handleDeleteCollection = (id) => {
    setCollections(collections.filter(c => c.id !== id));
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event, collection) => {
    setMenuAnchor(event.currentTarget);
    setSelectedCollection(collection);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Collections</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="New collection name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateCollection()}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateCollection}
            >
              Create
            </Button>
          </Box>
        </Box>

        <List>
          {collections.map((collection) => (
            <ListItem
              key={collection.id}
              secondaryAction={
                collection.id !== 'all' && collection.id !== 'recent' && (
                  <IconButton
                    edge="end"
                    onClick={(e) => handleMenuOpen(e, collection)}
                  >
                    <MoreVert />
                  </IconButton>
                )
              }
            >
              <ListItemIcon>
                {collection.id === 'all' ? <FolderOpen /> : <Folder />}
              </ListItemIcon>
              <ListItemText
                primary={collection.name}
                secondary={`${collection.count} documents`}
              />
            </ListItem>
          ))}
        </List>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => setEditingId(selectedCollection?.id)}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleDeleteCollection(selectedCollection?.id)}>
            <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CollectionsManager;
