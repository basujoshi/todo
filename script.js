const STORAGE_KEY = "daymark-tasks";

const state = {
  tasks: loadTasks(),
  filter: "all",
  query: ""
};

const elements = {
  form: document.querySelector("#taskForm"),
  input: document.querySelector("#taskInput"),
  list: document.querySelector("#taskList"),
  empty: document.querySelector("#emptyState"),
  emptyTitle: document.querySelector("#emptyTitle"),
  emptyMessage: document.querySelector("#emptyMessage"),
  search: document.querySelector("#searchInput"),
  clearCompleted: document.querySelector("#clearCompleted"),
  allCount: document.querySelector("#allCount"),
  activeCount: document.querySelector("#activeCount"),
  completedCount: document.querySelector("#completedCount"),
  remainingCount: document.querySelector("#remainingCount"),
  progressValue: document.querySelector("#progressValue"),
  progressRing: document.querySelector("#progressRing"),
  dateStamp: document.querySelector("#dateStamp")
};

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(timestamp);
}

function getVisibleTasks() {
  return state.tasks.filter((task) => {
    const matchesFilter = state.filter === "all"
      || (state.filter === "active" && !task.completed)
      || (state.filter === "completed" && task.completed);
    const matchesQuery = task.text.toLowerCase().includes(state.query.toLowerCase());
    return matchesFilter && matchesQuery;
  });
}

function render() {
  const visibleTasks = getVisibleTasks();
  const completed = state.tasks.filter((task) => task.completed).length;
  const active = state.tasks.length - completed;
  const progress = state.tasks.length ? Math.round((completed / state.tasks.length) * 100) : 0;

  elements.list.innerHTML = visibleTasks.map((task, index) => `
    <article class="task-item ${task.completed ? "is-complete" : ""}" style="animation-delay: ${index * 35}ms">
      <button class="task-check" type="button" data-action="toggle" data-id="${task.id}" aria-label="Mark ${escapeHtml(task.text)} as ${task.completed ? "open" : "complete"}" aria-pressed="${task.completed}"></button>
      <span class="task-text">${escapeHtml(task.text)}</span>
      <span class="task-meta">${formatDate(task.createdAt)}</span>
      <button class="delete-task" type="button" data-action="delete" data-id="${task.id}" aria-label="Delete ${escapeHtml(task.text)}">×</button>
    </article>
  `).join("");

  const hasVisibleTasks = visibleTasks.length > 0;
  elements.empty.hidden = hasVisibleTasks;
  elements.list.hidden = !hasVisibleTasks;
  if (!hasVisibleTasks) {
    const hasTasks = state.tasks.length > 0;
    elements.emptyTitle.textContent = state.query ? "No matching tasks." : hasTasks ? "Nothing in this view." : "Nothing here yet.";
    elements.emptyMessage.textContent = state.query ? "Try a different search." : hasTasks ? "A quieter list is a good list." : "Add a task above and give your day a first mark.";
  }

  elements.allCount.textContent = state.tasks.length;
  elements.activeCount.textContent = active;
  elements.completedCount.textContent = completed;
  elements.remainingCount.textContent = active;
  elements.progressValue.textContent = `${progress}%`;
  elements.progressRing.style.strokeDashoffset = 314 - (314 * progress / 100);
}

function escapeHtml(value) {
  const escaped = document.createElement("span");
  escaped.textContent = value;
  return escaped.innerHTML;
}

function addTask(text) {
  state.tasks.unshift({ id: crypto.randomUUID(), text, completed: false, createdAt: Date.now() });
  saveTasks();
  render();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = elements.input.value.trim();
  if (!text) return;
  addTask(text);
  elements.input.value = "";
  elements.input.focus();
});

elements.list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const taskId = button.dataset.id;
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  if (button.dataset.action === "toggle") task.completed = !task.completed;
  if (button.dataset.action === "delete") state.tasks = state.tasks.filter((item) => item.id !== taskId);
  saveTasks();
  render();
});

document.querySelectorAll(".filter-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    state.filter = tab.dataset.filter;
    document.querySelectorAll(".filter-tab").forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", active);
    });
    render();
  });
});

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  render();
});

elements.clearCompleted.addEventListener("click", () => {
  state.tasks = state.tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

elements.dateStamp.textContent = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date());
render();
