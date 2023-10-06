import React from 'react'
import { createContext, useContext } from 'react';

const AppContext = createContext();

export const AppWrapper = ({ children, sharedState }) => {
  return (
    <AppContext.Provider value={sharedState}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  return useContext(AppContext);
}
