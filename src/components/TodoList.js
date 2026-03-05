import React, { useState, useEffect } from 'react';
import { 
  fetchTodos, 
  createTodo, 
  updateTodo, 
  deleteTodo, 
  toggleTodoComplete 
} from '../services/api';

/**
 * Tresvita Todo Frontend - TodoList Component
 * Managed by Wissen Team
 * 
 * Main component for displaying and managing todos
 */
const TodoList = () => {
  // State management
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Load todos on component mount
  useEffect(() => {
    loadTodos();
  }, []);

  // Load todos from API
  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTodos();
      setTodos(data);
    } catch (err) {
      setError('Failed to load todos. Please try again.');
      console.error('Error loading todos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new todo
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      setError(null);
      const todo = await createTodo({
        title: newTodoTitle,
        description: newTodoDescription,
        completed: false
      });
      setTodos([todo, ...todos]);
      setNewTodoTitle('');
      setNewTodoDescription('');
    } catch (err) {
      setError('Failed to create todo. Please try again.');
      console.error('Error creating todo:', err);
    }
  };

  // Handle toggling todo completion
  const handleToggleTodo = async (id) => {
    try {
      setError(null);
      const updated = await toggleTodoComplete(id);
      setTodos(todos.map(t => t.id === id ? updated : t));
    } catch (err) {
      setError('Failed to update todo. Please try again.');
      console.error('Error toggling todo:', err);
    }
  };

  // Handle deleting todo
  const handleDeleteTodo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;

    try {
      setError(null);
      await deleteTodo(id);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete todo. Please try again.');
      console.error('Error deleting todo:', err);
    }
  };

  // Start editing todo
  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  // Save edited todo
  const saveEdit = async (id) => {
    if (!editTitle.trim()) return;

    try {
      setError(null);
      const todo = todos.find(t => t.id === id);
      const updated = await updateTodo(id, {
        ...todo,
        title: editTitle,
        description: editDescription
      });
      setTodos(todos.map(t => t.id === id ? updated : t));
      setEditingId(null);
    } catch (err) {
      setError('Failed to update todo. Please try again.');
      console.error('Error updating todo:', err);
    }
  };

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  // Calculate stats
  const totalTodos = todos.length;
  const completedTodos = todos.filter(t => t.completed).length;
  const activeTodos = totalTodos - completedTodos;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="todo-container">
        <div className="todo-card">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your todos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-container">
      <div className="todo-card">
        {/* Header */}
        <div className="todo-header">
          <h1><i className="fas fa-check-circle"></i> Tresvita Todo</h1>
          <p>Manage your tasks efficiently</p>
        </div>

        {/* Body */}
        <div className="todo-body">
          {/* Error message */}
          {error && (
            <div className="error-state">
              <i className="fas fa-exclamation-circle"></i>
              <h4>Error</h4>
              <p>{error}</p>
              <button onClick={loadTodos}>Retry</button>
            </div>
          )}

          {/* Add Todo Form */}
          <form onSubmit={handleAddTodo} className="input-section">
            <div className="todo-input-group">
              <input
                type="text"
                className="todo-input"
                placeholder="What needs to be done?"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn-add"
                disabled={!newTodoTitle.trim()}
              >
                <i className="fas fa-plus"></i> Add
              </button>
            </div>
            <textarea
              className="todo-textarea"
              placeholder="Add a description (optional)..."
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
              rows="2"
            />
          </form>

          {/* Filter Buttons */}
          <div className="filter-section">
            <button 
              className={`btn-filter ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({totalTodos})
            </button>
            <button 
              className={`btn-filter ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({activeTodos})
            </button>
            <button 
              className={`btn-filter ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({completedTodos})
            </button>
          </div>

          {/* Todo List */}
          {filteredTodos.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-clipboard-list"></i>
              <h3>No todos found</h3>
              <p>Add a new todo to get started!</p>
            </div>
          ) : (
            <ul className="todo-list">
              {filteredTodos.map(todo => (
                <li key={todo.id} className="todo-item animate-slide-in">
                  {editingId === todo.id ? (
                    // Edit Mode
                    <div className="edit-mode">
                      <input
                        type="text"
                        className="edit-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                      />
                      <textarea
                        className="edit-input"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows="2"
                      />
                      <div className="edit-actions">
                        <button 
                          className="btn-save"
                          onClick={() => saveEdit(todo.id)}
                        >
                          <i className="fas fa-check"></i> Save
                        </button>
                        <button 
                          className="btn-cancel"
                          onClick={cancelEditing}
                        >
                          <i className="fas fa-times"></i> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <input
                        type="checkbox"
                        className="todo-checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(todo.id)}
                      />
                      <div className="todo-content">
                        <div className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                          {todo.title}
                        </div>
                        {todo.description && (
                          <p className="todo-description">{todo.description}</p>
                        )}
                        <div className="todo-date">
                          <i className="far fa-clock"></i> {formatDate(todo.createdAt)}
                        </div>
                      </div>
                      <div className="todo-actions">
                        <button 
                          className="btn-action btn-edit"
                          onClick={() => startEditing(todo)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteTodo(todo.id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Stats */}
          <div className="stats-section">
            <div className="stats-item">
              <div className="stats-value">{totalTodos}</div>
              <div className="stats-label">Total</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">{activeTodos}</div>
              <div className="stats-label">Active</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">{completedTodos}</div>
              <div className="stats-label">Completed</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">
                {totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0}%
              </div>
              <div className="stats-label">Progress</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="todo-footer">
          <p>Tresvita Todo App &copy; 2024 | Managed by Wissen Team</p>
        </div>
      </div>
    </div>
  );
};

export default TodoList;
