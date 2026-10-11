const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

// Function to calculate counts and toggle warning/over classes
function updateCounts() {
  const text = noteText.value;
  const chars = text.length;
  
  // Count words by splitting text on whitespace
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  charCount.textContent = `${chars} / 200 characters`;
  wordCount.textContent = `${words} words`;

  // Apply warning or over classes
  charCount.classList.remove("warning", "over");
  if (chars > 200) {
    charCount.classList.add("over");
  } else if (chars > 180) {
    charCount.classList.add("warning");
  }
}

// Function to clear note text, storage, and counters
function clearNote() {
  noteText.value = "";
  localStorage.removeItem("noteDraft");
  updateCounts();
}

// Event: Input tracking for counts and localStorage draft saving
noteText.addEventListener("input", () => {
  updateCounts();
  localStorage.setItem("noteDraft", noteText.value);
});

// Event: Clear button click
clearBtn.addEventListener("click", clearNote);

// Event: Escape key inside textarea clears it
noteText.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    clearNote();
  }
});

// Function to handle theme toggling and label state
function setTheme(isDark) {
  if (isDark) {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "Dark mode";
    localStorage.setItem("theme", "light");
  }
}

// Event: Theme toggle button click
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark");
  setTheme(!isDark);
});

// Event: Page load initialization (restore draft & theme)
window.addEventListener("DOMContentLoaded", () => {
  const savedDraft = localStorage.getItem("noteDraft");
  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    setTheme(true);
  } else {
    setTheme(false);
  }

  updateCounts();
});