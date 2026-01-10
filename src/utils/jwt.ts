import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  user_id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  theme?: string;
  super_admin?: boolean;
  exp?: number;
  iat?: number;
}

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return decoded;
  } catch (error) {
    return null;
  }
};

export const extractUserFromJWT = (token: string) => {
  const payload = decodeJWT(token);
  
  if (!payload) {
    return null;
  }

  // Convert JWT payload to User interface
  const user = {
    id: payload.user_id || 0,
    username: payload.username || '',
    email: payload.email || '',
    first_name: payload.first_name || '',
    last_name: payload.last_name || '',
    theme: payload.theme || '',
    super_admin: payload.super_admin === true,
    created_at: new Date().toISOString(), // JWT doesn't typically include creation date
  };

  return user;
};

export const isJWTExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  
  if (!payload || !payload.exp) {
    return true; // Consider expired if we can't decode or no expiry
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};
