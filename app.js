(() => {
    // DOM elements
    const taskForm = document.getElementById('taskForm');
    const taskTitleInput = document.getElementById('taskTitle');
    const taskCategoryInput = document.getElementById('taskCategory');
    const taskDueInput = document.getElementById('taskDue');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const resetFormBtn = document.getElementById('resetFormBtn');
    const tasksGrid = document.getElementById('tasksGrid');
    const filterCategory = document.getElementById('filterCategory');
    const statusFilters = document.getElementsByName('statusFilter');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const clearAllBtn = document.getElementById('clearAll');
    const totalCountBadge = document.getElementById('totalCount');
    const pendingCountBadge = document.getElementById('pendingCount');
    const completedCountBadge = document.getElementById('completedCount');
    const showAddTaskBtn = document.getElementById('showAddTask');
    const themeToggle = document.getElementById('themeToggle');

    // Edit modal elements
    const editTaskModalEl = document.getElementById('editTaskModal');
    const editTaskForm = document.getElementById('editTaskForm');
    const editTaskId = document.getElementById('editTaskId');
    const editTaskTitle = document.getElementById('editTaskTitle');
    const editTaskCategory = document.getElementById('editTaskCategory');
    const editTaskDue = document.getElementById('editTaskDue');
    const editTaskCompleted = document.getElementById('editTaskCompleted');
    const editModal = new bootstrap.Modal(editTaskModalEl);

    let tasks = [];

    // Utilities
    const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

    const saveToLocalStorage = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const loadFromLocalStorage = () => {
        const raw = localStorage.getItem('tasks');
        tasks = raw ? JSON.parse(raw) : [];
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getActiveFilters = () => {
        const category = filterCategory.value;
        const status = Array.from(statusFilters).find(r => r.checked).value;
        return { category, status };
    };

    const updateStats = () => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        totalCountBadge.textContent = total;
        completedCountBadge.textContent = completed;
        pendingCountBadge.textContent = pending;
    };

    const escapeHtml = (unsafe) => {
        return String(unsafe)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    };

    // Render tasks based on filters
    const renderTasks = () => {
        const { category, status } = getActiveFilters();
        tasksGrid.innerHTML = '';

        const filteredTasks = tasks.filter(task => {
            const categoryMatch = (category === 'all') || (task.category === category);
            const statusMatch = (status === 'all') ||
                (status === 'pending' && !task.completed) ||
                (status === 'completed' && task.completed);
            return categoryMatch && statusMatch;
        });

        filteredTasks.forEach(task => {
            const col = document.createElement('div');
            col.className = 'col-12 col-sm-6 col-md-4 task-card';
            col.innerHTML = `
                <div class="card h-100" data-id="${task.id}">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">${escapeHtml(task.title)}</h6>
                            <span class="badge badge-category bg-secondary">${escapeHtml(task.category)}</span>
                        </div>
                        <p class="card-text text-muted mb-2">Due: ${formatDate(task.due)}</p>
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <div class="btn-group" role="group" aria-label="Task actions">
                                <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${task.id}">Edit</button>
                                <button class="btn btn-sm ${task.completed ? 'btn-outline-success' : 'btn-outline-warning'} btn-toggle" data-id="${task.id}">
                                    ${task.completed ? 'Completed' : 'Mark Done'}
                                </button>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-danger btn-delete" data-id="${task.id}" title="Delete task">Delete</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer text-end">
                        <small class="text-muted">Created: ${formatDate(task.createdAt)}</small>
                    </div>
                </div>
            `;
            if (task.isNew) {
                col.querySelector('.card').classList.add('new-pulse');
                delete task.isNew;
                saveToLocalStorage();
            }
            tasksGrid.appendChild(col);
        });

        updateStats();
        attachCardEventListeners();
    };

    const attachCardEventListeners = () => {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = (e) => openEditModal(e.currentTarget.dataset.id);
        });
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.onclick = (e) => toggleTaskCompleted(e.currentTarget.dataset.id);
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = (e) => deleteTask(e.currentTarget.dataset.id);
        });
    };

    const addTask = (title, category, due) => {
        const id = generateId();
        const task = {
            id,
            title,
            category,
            due,
            completed: false,
            createdAt: new Date().toISOString().slice(0,10),
            isNew: true
        };
        tasks.unshift(task);
        saveToLocalStorage();
        renderTasks();
    };

    const toggleTaskCompleted = (id) => {
        tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        saveToLocalStorage();
        renderTasks();
    };

    const deleteTask = (id) => {
        const card = document.querySelector(`[data-id="${id}"]`);
        if (card) {
            card.classList.add('fade-out');
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== id);
                saveToLocalStorage();
                renderTasks();
            }, 300);
        } else {
            tasks = tasks.filter(t => t.id !== id);
            saveToLocalStorage();
            renderTasks();
        }
    };

    const clearCompletedTasks = () => {
        tasks = tasks.filter(t => !t.completed);
        saveToLocalStorage();
        renderTasks();
    };

    const clearAllTasks = () => {
        if (!confirm('Are you sure you want to remove ALL tasks? This cannot be undone.')) return;
        tasks = [];
        saveToLocalStorage();
        renderTasks();
    };

    const openEditModal = (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        editTaskId.value = task.id;
        editTaskTitle.value = task.title;
        editTaskCategory.value = task.category;
        editTaskDue.value = task.due;
        editTaskCompleted.checked = !!task.completed;
        editModal.show();
    };

    const updateTask = (id, newData) => {
        tasks = tasks.map(t => t.id === id ? { ...t, ...newData } : t);
        saveToLocalStorage();
        renderTasks();
    };

    // Event bindings
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = taskTitleInput.value.trim();
        const category = taskCategoryInput.value;
        const due = taskDueInput.value;
        if (!title || !category || !due) {
            alert('Please fill all fields to add a task.');
            return;
        }
        addTask(title, category, due);
        taskForm.reset();
        taskTitleInput.focus();
    });

    resetFormBtn.addEventListener('click', () => taskTitleInput.focus());
    filterCategory.addEventListener('change', () => renderTasks());
    statusFilters.forEach(r => r.addEventListener('change', () => renderTasks()));
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    clearAllBtn.addEventListener('click', clearAllTasks);

    showAddTaskBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        taskTitleInput.focus();
    });

    editTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = editTaskId.value;
        const updated = {
            title: editTaskTitle.value.trim(),
            category: editTaskCategory.value,
            due: editTaskDue.value,
            completed: editTaskCompleted.checked
        };
        if (!updated.title || !updated.category || !updated.due) {
            alert('Please complete all fields before saving changes.');
            return;
        }
        updateTask(id, updated);
        editModal.hide();
    });

    const applyTheme = (isDark) => {
        if (isDark) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.checked = false;
        }
    };

    themeToggle.addEventListener('change', (e) => applyTheme(e.target.checked));

    const restoreTheme = () => {
        const t = localStorage.getItem('theme');
        applyTheme(t === 'dark');
    };

    const init = () => {
        loadFromLocalStorage();
        restoreTheme();
        renderTasks();
    };

    init();
})();