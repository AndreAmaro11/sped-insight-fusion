
// Simple mock auth service for demo purposes
// In a real application, you would connect this to a backend authentication system

// Mock user data
const MOCK_USERS = [
  { id: 1, email: 'admin@example.com', password: 'admin123', name: 'Administrador', role: 'admin' },
  { id: 2, email: 'user@example.com', password: 'user123', name: 'Usuário Padrão', role: 'user' }
];

// Interface for user data
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('sped_auth_token') !== null;
};

// Get current user
export const getCurrentUser = (): User | null => {
  const userJSON = localStorage.getItem('sped_current_user');
  if (!userJSON) return null;
  try {
    return JSON.parse(userJSON);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Login function
export const login = async (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    // Simulate API call delay
    setTimeout(() => {
      const user = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      
      if (!user) {
        reject(new Error('Invalid credentials'));
        return;
      }
      
      // Create a sanitized user object (without password)
      const userWithoutPassword: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
      
      // Store auth data in localStorage
      localStorage.setItem('sped_auth_token', 'mock_token_' + Math.random());
      localStorage.setItem('sped_current_user', JSON.stringify(userWithoutPassword));
      
      resolve(userWithoutPassword);
    }, 800); // simulate network delay
  });
};

// Logout function
export const logout = (): void => {
  localStorage.removeItem('sped_auth_token');
  localStorage.removeItem('sped_current_user');
  window.location.href = '/';
};

// Check if user has specific role
export const hasRole = (role: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === role;
};
