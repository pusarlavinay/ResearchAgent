import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Close,
  FilterList,
  Clear,
} from '@mui/icons-material';

const AdvancedSearchFilters = ({ open, onClose, onApplyFilters }) => {
  const [filters, setFilters] = useState({
    dateRange: 'all',
    fileType: 'all',
    confidenceMin: 0,
    tags: [],
    sortBy: 'relevance',
  });

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      dateRange: 'all',
      fileType: 'all',
      confidenceMin: 0,
      tags: [],
      sortBy: 'relevance',
    });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 320, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList color="primary" />
            <Typography variant="h6">Advanced Filters</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Date Range */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 1 }}>Date Range</FormLabel>
          <RadioGroup
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
          >
            <FormControlLabel value="all" control={<Radio size="small" />} label="All time" />
            <FormControlLabel value="today" control={<Radio size="small" />} label="Today" />
            <FormControlLabel value="week" control={<Radio size="small" />} label="This week" />
            <FormControlLabel value="month" control={<Radio size="small" />} label="This month" />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ mb: 3 }} />

        {/* File Type */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 1 }}>File Type</FormLabel>
          <RadioGroup
            value={filters.fileType}
            onChange={(e) => setFilters({ ...filters, fileType: e.target.value })}
          >
            <FormControlLabel value="all" control={<Radio size="small" />} label="All types" />
            <FormControlLabel value="pdf" control={<Radio size="small" />} label="PDF" />
            <FormControlLabel value="docx" control={<Radio size="small" />} label="DOCX" />
            <FormControlLabel value="txt" control={<Radio size="small" />} label="TXT" />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ mb: 3 }} />

        {/* Confidence Score */}
        <Box sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 2 }}>
            Minimum Confidence: {filters.confidenceMin}%
          </FormLabel>
          <Slider
            value={filters.confidenceMin}
            onChange={(e, value) => setFilters({ ...filters, confidenceMin: value })}
            min={0}
            max={100}
            valueLabelDisplay="auto"
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Sort By */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 1 }}>Sort By</FormLabel>
          <RadioGroup
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          >
            <FormControlLabel value="relevance" control={<Radio size="small" />} label="Relevance" />
            <FormControlLabel value="date" control={<Radio size="small" />} label="Date" />
            <FormControlLabel value="name" control={<Radio size="small" />} label="Name" />
          </RadioGroup>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1, mt: 4 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Clear />}
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleApply}
          >
            Apply
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default AdvancedSearchFilters;
