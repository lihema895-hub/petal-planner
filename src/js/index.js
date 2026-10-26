
import "../css/style.css";
import { format, parseISO } from "date-fns";

const STORAGE_KEY = "petal-planner-data";

const elements = {
  todayLabel: document.querySelector("#todayLabel"),
  projectList: document.querySelector("#projectList"),
  addProjectBtn: document.querySelector("#addProjectBtn"),
  addTaskBtn: document.querySelector("#addTaskBtn"),
  taskForm: document.querySelector("#taskForm"),
  taskTitle: document.querySelector("#taskTitle"),
  taskDescription: document.querySelector("#taskDescription"),
  taskDueDate: document.querySelector("#taskDueDate"),
  taskPriority: document.querySelector("#taskPriority"),
  cancelTaskBtn: document.querySelector("#cancelTaskBtn"),
  taskList: document.querySelector("#taskList"),
  taskHeading: document.querySelector("#taskHeading"),
  progressText: document.querySelector("#progressText"),
  progressFill: document.querySelector("#progressFill"),
};

let state;

function createInitialState() {
  return {
    projects: [{ id: "default", name: "My Tasks" }],
    tasks: [],
    selectedProjectId: "default",
    filter: "all",
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved && Array.isArray(saved.projects) && Array.isArray(saved.tasks)) {
      const projects = saved.projects.some(
        (project) => project.id === "default"
      )
        ? saved.projects
        : [{ id: "default", name: "My Tasks" }, ...saved.projects];

      return {
        ...createInitialState(),
        ...saved,
        projects,
        tasks: saved.tasks.filter((task) =>
          projects.some((project) => project.id === task.projectId)
        ),
      };
    }
  } catch (error) {
    console.error("Could not load saved tasks:", error);
  }

  return createInitialState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Could not save tasks:", error);
    alert("Your changes could not be saved in this browser.");
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function getSelectedProject() {
  return state.projects.find(
    (project) => project.id === state.selectedProjectId
  );
}




function renderProjects() {
  elements.projectList.replaceChildren();

  state.projects.forEach((project) => {
    const row = document.createElement("div");
    row.className = "project-row";

    const projectButton = document.createElement("button");
    projectButton.type = "button";
    projectButton.className = "project-button";
    projectButton.dataset.project = project.id;

    if (project.id === state.selectedProjectId) {
      projectButton.classList.add("active");
    }

    projectButton.textContent =
      `${project.id === "default" ? "♡" : "🌸"} ${project.name}`;

    row.appendChild(projectButton);

    if (project.id !== "default") {
      const actions = document.createElement("div");
      actions.className = "project-actions";

      const renameButton = document.createElement("button");
      renameButton.type = "button";
      renameButton.className = "project-action-button";
      renameButton.textContent = "✎";
      renameButton.title = "Rename project";
      renameButton.setAttribute("aria-label", `Rename ${project.name}`);
      renameButton.dataset.projectAction = "rename";
      renameButton.dataset.projectId = project.id;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "project-action-button";
      deleteButton.textContent = "×";
      deleteButton.title = "Delete project";
      deleteButton.setAttribute("aria-label", `Delete ${project.name}`);
      deleteButton.dataset.projectAction = "delete";
      deleteButton.dataset.projectId = project.id;

      actions.append(renameButton, deleteButton);
      row.appendChild(actions);
    }

    elements.projectList.appendChild(row);
  });

  const selectedProject = getSelectedProject();

  if (selectedProject) {
    elements.taskHeading.textContent = `${selectedProject.name} ♡`;
  }
}
function renderTasks() {
  elements.taskList.replaceChildren();

  const projectTasks = state.tasks.filter(
    (task) => task.projectId === state.selectedProjectId
  );

  const filteredTasks = projectTasks.filter((task) => {
    if (state.filter === "active") return !task.completed;
    if (state.filter === "completed") return task.completed;
    return true;
  });

  const completedCount = projectTasks.filter(
    (task) => task.completed
  ).length;

  elements.progressText.textContent =
    `${completedCount} of ${projectTasks.length} tasks completed`;

  const percentage = projectTasks.length
    ? (completedCount / projectTasks.length) * 100
    : 0;

  elements.progressFill.style.width = `${percentage}%`;

  if (filteredTasks.length === 0) {
    const empty = createElement("div", "empty-state");
    const flower = createElement("div", "", "🌷");

    const message = createElement(
      "p",
      "",
      projectTasks.length === 0
        ? "Your little list is waiting for its first task."
        : "No tasks here right now. You're doing great!"
    );

    empty.append(flower, message);
    elements.taskList.append(empty);
    return;
  }

  filteredTasks.forEach((task) => {
    const card = createElement("article", "task-card");

    if (task.completed) card.classList.add("completed");

    const top = createElement("div", "task-card-top");
    const left = createElement("div", "task-main");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Complete ${task.title}`);

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveState();
      renderTasks();
    });

    const title = createElement("h3", "task-title", task.title);

    if (task.completed) title.classList.add("completed-title");

    left.append(checkbox, title);

    const priority = createElement(
      "span",
      `priority-badge priority-${task.priority}`,
      `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`
    );

    top.append(left, priority);
    card.append(top);

    if (task.description) {
      card.append(
        createElement("p", "task-description", task.description)
      );
    }

    if (task.dueDate) {
      let formattedDate = task.dueDate;

      try {
        formattedDate = format(parseISO(task.dueDate), "MMM d, yyyy");
      } catch {
        // Keep the original date if formatting fails.
      }

      card.append(
        createElement("p", "task-due-date", `♡ Due ${formattedDate}`)
      );
    }

    const actions = createElement("div", "task-actions");

    const editButton = createElement("button", "secondary-button", "Edit");
    editButton.type = "button";
    editButton.addEventListener("click", () => openTaskForm(task));

    const deleteButton = createElement(
      "button",
      "secondary-button",
      "Delete"
    );

    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => {
      if (!confirm(`Delete the task "${task.title}"?`)) return;

      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      saveState();
      renderTasks();
    });

    actions.append(editButton, deleteButton);
    card.append(actions);
    elements.taskList.append(card);
  });
}

function render() {
  renderProjects();
  renderTasks();
}

function openTaskForm(task = null) {
  elements.taskForm.hidden = false;

  if (task) {
    elements.taskForm.dataset.editingId = task.id;
    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description || "";
    elements.taskDueDate.value = task.dueDate || "";
    elements.taskPriority.value = task.priority || "medium";
    elements.taskForm.querySelector("h3").textContent = "Edit your task ♡";
  } else {
    delete elements.taskForm.dataset.editingId;
    elements.taskForm.reset();
    elements.taskPriority.value = "medium";
    elements.taskForm.querySelector("h3").textContent = "A new little task ♡";
  }

  elements.taskTitle.focus();
}

function closeTaskForm() {
  elements.taskForm.hidden = true;
  elements.taskForm.reset();
  delete elements.taskForm.dataset.editingId;
}

function resetFilters() {
  state.filter = "all";

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });
}

// Add a task or update an existing one.
elements.addTaskBtn.addEventListener("click", () => openTaskForm());

elements.cancelTaskBtn.addEventListener("click", closeTaskForm);

elements.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = elements.taskTitle.value.trim();

  if (!title) {
    elements.taskTitle.focus();
    return;
  }

  const editingId = elements.taskForm.dataset.editingId;

  if (editingId) {
    const task = state.tasks.find((item) => item.id === editingId);

    if (task) {
      task.title = title;
      task.description = elements.taskDescription.value.trim();
      task.dueDate = elements.taskDueDate.value;
      task.priority = elements.taskPriority.value;
    }
  } else {
    state.tasks.push({
      id: makeId(),
      projectId: state.selectedProjectId,
      title,
      description: elements.taskDescription.value.trim(),
      dueDate: elements.taskDueDate.value,
      priority: elements.taskPriority.value,
      completed: false,
    });
  }

  saveState();
  closeTaskForm();
  renderTasks();
});

// Create a new project.
elements.addProjectBtn.addEventListener("click", () => {
  const name = prompt("What would you like to name your new project?");

  if (name === null) return;

  const trimmedName = name.trim();

  if (!trimmedName) {
    alert("Please enter a project name.");
    return;
  }

  const duplicate = state.projects.some(
    (project) => project.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (duplicate) {
    alert("A project with that name already exists.");
    return;
  }

  const project = {
    id: makeId(),
    name: trimmedName,
  };

  state.projects.push(project);
  state.selectedProjectId = project.id;

  resetFilters();
  closeTaskForm();
  saveState();
  render();
});

// Rename or delete projects, or switch between them.
elements.projectList.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-project-action]");

  if (actionButton) {
    const projectId = actionButton.dataset.projectId;
    const action = actionButton.dataset.projectAction;

    const project = state.projects.find(
      (item) => item.id === projectId
    );

    if (!project || project.id === "default") return;

    if (action === "rename") {
      const name = prompt("Enter a new project name:", project.name);

      if (name === null) return;

      const trimmedName = name.trim();

      if (!trimmedName) {
        alert("Project name cannot be empty.");
        return;
      }

      const duplicate = state.projects.some(
        (item) =>
          item.id !== projectId &&
          item.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (duplicate) {
        alert("A project with that name already exists.");
        return;
      }

      project.name = trimmedName;
      saveState();
      render();
      return;
    }

    if (action === "delete") {
      const taskCount = state.tasks.filter(
        (task) => task.projectId === projectId
      ).length;

      const message =
        `Delete "${project.name}" and its ${taskCount} task(s)?\n\n` +
        "This cannot be undone.";

      if (!confirm(message)) return;

      state.projects = state.projects.filter(
        (item) => item.id !== projectId
      );

      state.tasks = state.tasks.filter(
        (task) => task.projectId !== projectId
      );

      if (state.selectedProjectId === projectId) {
        state.selectedProjectId = "default";
      }

      resetFilters();
      closeTaskForm();
      saveState();
      render();
      return;
    }
  }

  const projectButton = event.target.closest("[data-project]");

  if (!projectButton) return;

  state.selectedProjectId = projectButton.dataset.project;

  resetFilters();
  closeTaskForm();
  render();
});

// Filter tasks.
document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;

    document.querySelectorAll("[data-filter]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    renderTasks();
  });
});

// Show today's date.
if (elements.todayLabel) {
  elements.todayLabel.textContent = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

// Start the app using saved data.
state = loadState();

if (!state.projects.some((project) => project.id === state.selectedProjectId)) {
  state.selectedProjectId = "default";
}

render();
saveState();

console.log("Petal Planner is blooming! 🌷");
