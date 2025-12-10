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
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        apiService.setToken(storedToken);
        try {
          
          // Check if token is expired
          if (isJWTExpired(storedToken)) {
            throw new Error('Token is expired');
          }
          
          // Extract user data from JWT token
          const userFromJWT = extractUserFromJWT(storedToken);
          if (userFromJWT) {
            setUser(userFromJWT);
            setToken(storedToken);
          } else {
            throw new Error('Invalid token - cannot extract user data');
          }
        } catch (error) {
          localStorage.removeItem('token');
          apiService.setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiService.login({ username, password });
      
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
        setUser(userFromJWT);
      } else {
        // Still consider login successful if we have token
        // User data can be fetched later if needed
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await apiService.register({ email, username, password, first_name: firstName, last_name: lastName });
      
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
        setUser(userFromJWT);
      } else {
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
      
    } catch (error) {
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


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
