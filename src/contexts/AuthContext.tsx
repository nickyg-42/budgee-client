import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { apiService } from '../services/api';
import { extractUserFromJWT, isJWTExpired } from '../utils/jwt';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing authentication...');
      const storedToken = localStorage.getItem('token');
      console.log('Stored token found:', !!storedToken);
      
      if (storedToken) {
        apiService.setToken(storedToken);
        try {
          console.log('Validating stored token...');
          
          // Check if token is expired
          if (isJWTExpired(storedToken)) {
            console.log('Token is expired');
            throw new Error('Token is expired');
          }
          
          // Extract user data from JWT token
          const userFromJWT = extractUserFromJWT(storedToken);
          if (userFromJWT) {
            console.log('User data extracted from JWT during initialization:', userFromJWT);
            console.log('User email from JWT:', userFromJWT.email);
            console.log('User username from JWT:', userFromJWT.username);
            console.log('User first_name from JWT:', userFromJWT.first_name);
            setUser(userFromJWT);
            setToken(storedToken);
          } else {
            console.error('Failed to extract user data from JWT during initialization');
            throw new Error('Invalid token - cannot extract user data');
          }
        } catch (error) {
          console.error('Failed to validate token:', error);
          localStorage.removeItem('token');
          apiService.setToken(null);
        }
      }
      setIsLoading(false);
      console.log('Authentication initialization complete');
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('Attempting login with username:', username);
      const response = await apiService.login({ username, password });
      console.log('Login response received:', response);
      
      // Check if response has token
      if (!response.token) {
        throw new Error('Invalid response from server - missing token');
      }
      
      // Store token immediately
      const token = response.token;
      localStorage.setItem('token', token);
      apiService.setToken(token);
      setToken(token);
      
      // Check if token is expired
      if (isJWTExpired(token)) {
        throw new Error('Token is expired');
      }
      
      // Extract user data from JWT token
      const userFromJWT = extractUserFromJWT(token);
      if (userFromJWT) {
        console.log('User data extracted from JWT:', userFromJWT);
        console.log('User email from login JWT:', userFromJWT.email);
        console.log('User username from login JWT:', userFromJWT.username);
        console.log('User first_name from login JWT:', userFromJWT.first_name);
        setUser(userFromJWT);
      } else {
        console.error('Failed to extract user data from JWT');
        // Still consider login successful if we have token
        // User data can be fetched later if needed
      }
      
      console.log('Login successful - token:', token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string, firstName: string, lastName: string) => {
    try {
      console.log('Attempting registration with email:', email, 'username:', username);
      const response = await apiService.register({ email, username, password, first_name: firstName, last_name: lastName });
      console.log('Registration response received:', response);
      
      // Check if response has token
      if (!response.token) {
        throw new Error('Invalid response from server - missing token');
      }
      
      // Store token immediately
      const token = response.token;
      localStorage.setItem('token', token);
      apiService.setToken(token);
      setToken(token);
      
      // Check if token is expired
      if (isJWTExpired(token)) {
        throw new Error('Token is expired');
      }
      
      // Extract user data from JWT token
      const userFromJWT = extractUserFromJWT(token);
      if (userFromJWT) {
        console.log('User data extracted from JWT:', userFromJWT);
        setUser(userFromJWT);
      } else {
        console.error('Failed to extract user data from JWT');
        // Create a temporary user object from registration data
        const tempUser: User = {
          id: 0, // Will be populated when user data is fetched
          email,
          username,
          first_name: firstName,
          last_name: lastName,
          created_at: new Date().toISOString()
        };
        setUser(tempUser);
      }
      
      console.log('Registration successful - token:', token);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    apiService.setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
  };

  console.log('AuthContext value - user:', !!user, 'token:', !!token, 'isLoading:', isLoading, 'isAuthenticated:', !!user && !!token);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};