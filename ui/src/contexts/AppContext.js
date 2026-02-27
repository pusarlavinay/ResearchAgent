import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

export const AppProvider = ({ children }) => {
  const [conversations, setConversations] = useState(() => 
    loadFromStorage('conversations', [])
  );
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState(() => 
    loadFromStorage('documents', [])
  );
  const [selectedDocuments, setSelectedDocuments] = useState(() => 
    loadFromStorage('selectedDocuments', [])
  );
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  
  // Resume Analyzer State
  const [resumeData, setResumeData] = useState(() => 
    loadFromStorage('resumeData', {
      resume: null,
      jobDescription: '',
      analysis: null,
      loading: false
    })
  );

  // New Features State
  const [collections, setCollections] = useState(() =>
    loadFromStorage('collections', [])
  );
  const [searchFilters, setSearchFilters] = useState(() =>
    loadFromStorage('searchFilters', {
      dateRange: 'all',
      fileType: 'all',
      confidenceMin: 0,
      sortBy: 'relevance',
    })
  );
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [notifications, setNotifications] = useState(() =>
    loadFromStorage('notifications', [])
  );
  const [comparisonResult, setComparisonResult] = useState(() =>
    loadFromStorage('comparisonResult', null)
  );
  const [selectedDocsForComparison, setSelectedDocsForComparison] = useState(() =>
    loadFromStorage('selectedDocsForComparison', [])
  );

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      time: new Date().toISOString(),
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  useEffect(() => {
    saveToStorage('conversations', conversations);
  }, [conversations]);

  useEffect(() => {
    saveToStorage('documents', documents);
  }, [documents]);

  useEffect(() => {
    saveToStorage('selectedDocuments', selectedDocuments);
  }, [selectedDocuments]);

  useEffect(() => {
    saveToStorage('resumeData', resumeData);
  }, [resumeData]);

  useEffect(() => {
    saveToStorage('collections', collections);
  }, [collections]);

  useEffect(() => {
    saveToStorage('searchFilters', searchFilters);
  }, [searchFilters]);

  useEffect(() => {
    saveToStorage('notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    saveToStorage('comparisonResult', comparisonResult);
  }, [comparisonResult]);

  useEffect(() => {
    saveToStorage('selectedDocsForComparison', selectedDocsForComparison);
  }, [selectedDocsForComparison]);

  const value = {
    conversations,
    setConversations,
    loading,
    setLoading,
    documents,
    setDocuments,
    selectedDocuments,
    setSelectedDocuments,
    documentsLoaded,
    setDocumentsLoaded,
    resumeData,
    setResumeData,
    collections,
    setCollections,
    searchFilters,
    setSearchFilters,
    smartSuggestions,
    setSmartSuggestions,
    notifications,
    setNotifications,
    addNotification,
    clearNotifications,
    markNotificationRead,
    comparisonResult,
    setComparisonResult,
    selectedDocsForComparison,
    setSelectedDocsForComparison,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};