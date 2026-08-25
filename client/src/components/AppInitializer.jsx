// src/components/AppInitializer.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '../redux/slices/authSlice';

const AppInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { 
    isAuthenticated, 
    profileLoaded, 
    isProfileLoading,
    user 
  } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && !profileLoaded && !isProfileLoading && !user) {
      dispatch(getProfile());
    }
  }, [isAuthenticated, profileLoaded, isProfileLoading, user, dispatch]);

  return children;
};

export default AppInitializer;