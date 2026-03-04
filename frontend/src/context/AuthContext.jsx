import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const ensureCsrfToken = useCallback(async () => {
    try {
      await authApi.getCsrf();
    } catch {
      // ignore csrf bootstrap failure
    }
  }, []);

  useEffect(() => {
    ensureCsrfToken().finally(() => {
      authApi.getMe()
        .then((response) => {
          const userData = response.data;
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }, [ensureCsrfToken]);

  const login = async (username, password) => {
    const response = await authApi.login({ username, password });
    const { token: _token, ...userData } = response.data;
    await ensureCsrfToken();
    
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  const register = async (username, email, password) => {
    const response = await authApi.register({ username, email, password });
    const { token: _token, ...userData } = response.data;
    await ensureCsrfToken();
    
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  const logout = async () => {
    try {
      await ensureCsrfToken();
      await authApi.logout();
    } catch {
      // ignore logout API failure and clear local user state anyway
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
