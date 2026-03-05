/**
 * Tresvita Todo Frontend - API Service
 * Managed by Wissen Team
 * 
 * This service handles all API communication with the backend
 */

// API URL configuration - uses environment variable or defaults to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

/**
 * Fetch all todos
 */
export const fetchTodos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos`);
    if (!response.ok) {
      throw new Error(`Failed to fetch todos: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching todos:', error);
    throw error;
  }
};

/**
 * Fetch todos by completion status
 */
export const fetchTodosByStatus = async (completed) => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos/completed/${completed}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch todos: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching todos by status:', error);
    throw error;
  }
};

/**
 * Create a new todo
 */
export const createTodo = async (todo) => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(todo),
    });
    if (!response.ok) {
      throw new Error(`Failed to create todo: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
};

/**
 * Update an existing todo
 */
export const updateTodo = async (id, todo) => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(todo),
    });
    if (!response.ok) {
      throw new Error(`Failed to update todo: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
};

/**
 * Delete a todo
 */
export const deleteTodo = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete todo: ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
};

/**
 * Toggle todo completion status
 */
export const toggleTodoComplete = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos/${id}/toggle`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      throw new Error(`Failed to toggle todo: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error toggling todo:', error);
    throw error;
  }
};

/**
 * Search todos by title
 */
export const searchTodos = async (title) => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos/search?title=${encodeURIComponent(title)}`);
    if (!response.ok) {
      throw new Error(`Failed to search todos: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching todos:', error);
    throw error;
  }
};

/**
 * Health check
 */
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};
