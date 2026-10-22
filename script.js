document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // 1. GET HTML ELEMENTS
  // =========================

  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("taskinput");
  const taskPriority = document.getElementById("task-priority");
  const taskDueDate = document.getElementById("task-due-date");
  const taskSearch = document.getElementById("task-search");
  const taskList = document.getElementById("task-list");
  const totalTasks = document.getElementById("total-tasks");
  const completedTasks = document.getElementById("completed-tasks");
  const remainingTasks = document.getElementById("remaining-tasks");
  const taskMessage = document.getElementById("task-message");

  // TASK PROGRESS ELEMENTS
  const progressPercentage = document.getElementById("progress-percentage");
  const progressTrack = document.getElementById("progress-track");
  const progressFill = document.getElementById("progress-fill");
  const progressMessage = document.getElementById("progress-message");

  // FILTERS AND CLEAR COMPLETED
  const filterButtons = document.querySelectorAll(".filter-btn");
  const clearCompletedBtn = document.getElementById("clear-completed-btn");
  let currentFilter = "all";

  // =========================
  // 2. LOAD SAVED TASKS
  // =========================

  let tasks = [];

  try {
    const savedTasks = localStorage.getItem("myTodoTasks");

    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);

      if (Array.isArray(parsedTasks)) {
        tasks = parsedTasks.filter(
          (task) =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.completed === "boolean",
        );
      }
    }
  } catch (error) {
    console.error("Could not load saved tasks:", error);
  }

  // =========================
  // 3. SAVE TASKS
  // =========================

  function saveTasks() {
    try {
      localStorage.setItem("myTodoTasks", JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error("Could not save tasks:", error);
      taskMessage.textContent =
        "Unable to save tasks. Check your browser storage settings.";
      return false;
    }
  }

  // =========================
  // 4. UPDATE COUNTERS
  // =========================

  function updateCounters() {
    const completedCount = tasks.filter((task) => task.completed).length;
    const totalCount = tasks.length;
    const remainingCount = totalCount - completedCount;

    // UPDATE TASK COUNTERS
    totalTasks.textContent = totalCount;
    completedTasks.textContent = completedCount;
    remainingTasks.textContent = remainingCount;

    // CALCULATE PROGRESS PERCENTAGE
    const percentage =
      totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    // UPDATE PROGRESS BAR
    progressPercentage.textContent = `${percentage}%`;
    progressFill.style.width = `${percentage}%`;

    progressTrack.setAttribute("aria-valuenow", percentage);

    // UPDATE PROGRESS MESSAGE
    if (totalCount === 0) {
      progressMessage.textContent = "Let's complete your first task! 💪";
    } else if (percentage === 100) {
      progressMessage.textContent = "Amazing! All tasks completed! 🎉";
    } else if (percentage >= 50) {
      progressMessage.textContent = "Great progress! Keep it going! 🚀";
    } else {
      progressMessage.textContent = "Every completed task counts! 💚";
    }
  }

  // =========================
  // 5. UPDATE MESSAGE
  // =========================

  function updateMessage() {
    if (tasks.length === 0) {
      taskMessage.textContent = "Your next achievement starts here.";
    } else if (tasks.every((task) => task.completed)) {
      taskMessage.textContent = "Amazing! You've completed every task. 🎉";
    } else {
      taskMessage.textContent = "Keep going! Every small step counts.";
    }
  }

  // =========================
  // 6. RENDER AND FILTER TASKS
  // =========================

  function renderTasks() {
    taskList.replaceChildren();

    // Highlight the selected filter.
    filterButtons.forEach((button) => {
      const isActive = button.dataset.filter === currentFilter;

      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    // Filter tasks.

    const searchTerm = taskSearch.value.trim().toLowerCase();

    const visibleTasks = tasks.filter((task) => {
      // Match the task name against the search text.
      const matchesSearch = task.text.toLowerCase().includes(searchTerm);

      // Match the selected task filter.
      let matchesFilter = true;

      if (currentFilter === "active") {
        matchesFilter = !task.completed;
      } else if (currentFilter === "completed") {
        matchesFilter = task.completed;
      }

      // A task must match both search and filter.
      return matchesSearch && matchesFilter;
    });

    // Display tasks.
    visibleTasks.forEach((task) => {
      const listItem = document.createElement("li");

      // COMPLETION CHECKBOX
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox";
      checkbox.checked = task.completed;

      checkbox.setAttribute(
        "aria-label",
        `${task.completed ? "Mark incomplete" : "Mark complete"}: ${task.text}`,
      );

      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
      });

      // TASK TEXT
      const taskText = document.createElement("span");
      taskText.className = "task-text";
      taskText.textContent = task.text;

      if (task.completed) {
        taskText.classList.add("completed");
      }

      // TASK PRIORITY
      const priorityBadge = document.createElement("span");
      const priority = ["high", "medium", "low"].includes(task.priority)
        ? task.priority
        : "medium";

      priorityBadge.className = `priority-badge priority-${priority}`;
      priorityBadge.textContent =
        priority.charAt(0).toUpperCase() + priority.slice(1);

      // TASK DUE DATE
      let dueDateBadge = null;

      if (task.dueDate) {
        dueDateBadge = document.createElement("span");
        dueDateBadge.className = "due-date-badge";

        // Format the date without timezone shifting.
        const [year, month, day] = task.dueDate.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        dueDateBadge.textContent = `Due: ${date.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`;

        // Mark unfinished past-due tasks.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!task.completed && date < today) {
          dueDateBadge.classList.add("overdue");
          dueDateBadge.textContent += " (Overdue)";
        }
      }

      // EDIT BUTTON
      const editButton = document.createElement("button");
      editButton.className = "edit-btn";
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.setAttribute("aria-label", `Edit task: ${task.text}`);

      editButton.addEventListener("click", () => {
        const updatedText = prompt("Edit your task:", task.text);

        if (updatedText === null) {
          return;
        }

        const trimmedText = updatedText.trim();

        if (!trimmedText) {
          alert("Task cannot be empty.");
          return;
        }

        task.text = trimmedText;
        saveTasks();
        renderTasks();
      });

      // DELETE BUTTON
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-btn";
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete task: ${task.text}`);

      deleteButton.addEventListener("click", () => {
        tasks = tasks.filter((item) => item.id !== task.id);
        saveTasks();
        renderTasks();
      });

      // ADD TASK ELEMENTS TO THE ROW
      listItem.append(checkbox, taskText, priorityBadge);

      if (dueDateBadge) {
        listItem.appendChild(dueDateBadge);
      }

      listItem.append(editButton, deleteButton);
      taskList.appendChild(listItem);
    });

    // EMPTY-STATE MESSAGE
    if (visibleTasks.length === 0) {
      const emptyMessage = document.createElement("li");
      emptyMessage.className = "empty-state";

      if (tasks.length === 0) {
        emptyMessage.textContent = "No tasks yet. Add your first task!";
      } else if (currentFilter === "active") {
        emptyMessage.textContent = "Great! No active tasks left. 🎉";
      } else if (currentFilter === "completed") {
        emptyMessage.textContent = "No completed tasks yet.";
      }

      taskList.appendChild(emptyMessage);
    }

    updateCounters();
    updateMessage();

    // Disable Clear Completed when nothing is completed.
    clearCompletedBtn.disabled = !tasks.some((task) => task.completed);
  }

  // =========================
  // 7. ADD A TASK
  // =========================

  function addTask() {
    const text = taskInput.value.trim();

    if (!text) {
      taskMessage.textContent = "Please enter a task before adding it.";
      taskInput.focus();
      return;
    }

    tasks.push({
      id: crypto.randomUUID(),
      text: text,
      completed: false,
      priority: taskPriority.value,
      dueDate: taskDueDate.value,
    });

    saveTasks();

    currentFilter = "all";
    taskInput.value = "";
    taskDueDate.value = "";

    renderTasks();
    taskInput.focus();
  }

  // =========================
  // TASK SEARCH EVENTS
  // =========================

  taskSearch.addEventListener("input", () => {
    renderTasks();
  });

  // =========================
  // 8. TASK FILTER EVENTS
  // =========================

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      renderTasks();
    });
  });

  // =========================
  // 9. CLEAR COMPLETED TASKS
  // =========================

  clearCompletedBtn.addEventListener("click", () => {
    const completedCount = tasks.filter((task) => task.completed).length;

    if (completedCount === 0) {
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to clear ${completedCount} completed task(s)?`,
    );

    if (!confirmed) {
      return;
    }

    tasks = tasks.filter((task) => !task.completed);

    saveTasks();
    renderTasks();

    taskMessage.textContent = "Completed tasks cleared successfully! 🎉";
  });

  // =========================
  // 10. FORM SUBMISSION
  // =========================

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addTask();
  });

  // =========================
  // 11. INITIAL DISPLAY
  // =========================

  renderTasks();
});
