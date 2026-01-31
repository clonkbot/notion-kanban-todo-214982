import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'done';
  createdAt: Date;
}

interface Column {
  id: string;
  title: string;
  status: 'todo' | 'inprogress' | 'done';
  color: string;
}

const STORAGE_KEY = 'notion-kanban-tasks';

const columns: Column[] = [
  { id: 'todo', title: '📋 To Do', status: 'todo', color: 'bg-red-50 border-red-200' },
  { id: 'inprogress', title: '⚡ In Progress', status: 'inprogress', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'done', title: '✅ Done', status: 'done', color: 'bg-green-50 border-green-200' }
];

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState<'todo' | 'inprogress' | 'done'>('todo');
  const [editingTask, setEditingTask] = useState<string | null>(null);

  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        }));
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (title: string, description: string, status: 'todo' | 'inprogress' | 'done') => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      status,
      createdAt: new Date()
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editDescription, setEditDescription] = useState(task.description);

    const handleSave = () => {
      updateTask(task.id, { title: editTitle, description: editDescription });
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditTitle(task.title);
      setEditDescription(task.description);
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div className="bg-white border border-notion-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full text-sm font-medium text-notion-text mb-2 border-none outline-none bg-transparent resize-none"
            placeholder="Task title"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full text-sm text-notion-gray mb-3 border-none outline-none bg-transparent resize-none"
            placeholder="Add a description..."
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-notion-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
           onClick={() => setIsEditing(true)}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-medium text-notion-text flex-1">
            {task.title || 'Untitled'}
          </h3>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newStatus = task.status === 'todo' ? 'inprogress' : 
                                task.status === 'inprogress' ? 'done' : 'todo';
                updateTask(task.id, { status: newStatus });
              }}
              className="text-xs text-notion-gray hover:text-notion-text p-1"
              title="Move to next column"
            >
              →
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
              className="text-xs text-red-500 hover:text-red-700 p-1"
              title="Delete task"
            >
              ×
            </button>
          </div>
        </div>
        {task.description && (
          <p className="text-sm text-notion-gray mb-3">{task.description}</p>
        )}
        <div className="text-xs text-notion-gray">
          {task.createdAt.toLocaleDateString()}
        </div>
      </div>
    );
  };

  const AddTaskForm = ({ column, onCancel }: { column: Column, onCancel: () => void }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (title.trim()) {
        addTask(title.trim(), description.trim(), column.status);
        setTitle('');
        setDescription('');
        onCancel();
      }
    };

    return (
      <div className="bg-white border border-notion-border rounded-lg p-4 shadow-sm">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full text-sm font-medium text-notion-text mb-2 border-none outline-none bg-transparent"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="w-full text-sm text-notion-gray mb-3 border-none outline-none bg-transparent resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add Task
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-notion-bg font-notion">
      {/* Header */}
      <header className="border-b border-notion-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-notion-text">📋 Kanban Board</h1>
              <p className="text-sm text-notion-gray">Organize your tasks in Notion style</p>
            </div>
            <div className="text-sm text-notion-gray">
              {tasks.length} total tasks
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => {
            const columnTasks = tasks.filter(task => task.status === column.status);
            const showForm = isAddingTask && newTaskColumn === column.status;

            return (
              <div key={column.id} className={`rounded-lg border-2 border-dashed ${column.color} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-notion-text flex items-center gap-2">
                    {column.title}
                    <span className="bg-notion-border text-notion-gray px-2 py-0.5 rounded-full text-xs">
                      {columnTasks.length}
                    </span>
                  </h2>
                  <button
                    onClick={() => {
                      setIsAddingTask(true);
                      setNewTaskColumn(column.status);
                    }}
                    className="text-notion-gray hover:text-notion-text transition-colors text-lg leading-none"
                    title="Add new task"
                  >
                    +
                  </button>
                </div>

                <div className="space-y-3">
                  {showForm && (
                    <AddTaskForm 
                      column={column} 
                      onCancel={() => {
                        setIsAddingTask(false);
                        setNewTaskColumn('todo');
                      }} 
                    />
                  )}
                  
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  
                  {columnTasks.length === 0 && !showForm && (
                    <div className="text-center py-8 text-notion-gray">
                      <div className="text-2xl mb-2">📝</div>
                      <p className="text-sm">No tasks yet</p>
                      <button
                        onClick={() => {
                          setIsAddingTask(true);
                          setNewTaskColumn(column.status);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Add your first task
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-notion-border rounded-lg p-4">
            <div className="text-2xl font-bold text-red-500">{tasks.filter(t => t.status === 'todo').length}</div>
            <div className="text-sm text-notion-gray">To Do</div>
          </div>
          <div className="bg-white border border-notion-border rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-500">{tasks.filter(t => t.status === 'inprogress').length}</div>
            <div className="text-sm text-notion-gray">In Progress</div>
          </div>
          <div className="bg-white border border-notion-border rounded-lg p-4">
            <div className="text-2xl font-bold text-green-500">{tasks.filter(t => t.status === 'done').length}</div>
            <div className="text-sm text-notion-gray">Completed</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;