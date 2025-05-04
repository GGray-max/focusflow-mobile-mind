
import React from 'react';
import { Navigate } from 'react-router-dom';

const Index = () => {
  return <Navigate to="/tasks" replace />;
};

export default Index;
