let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
  const searchTerm = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(searchTerm));
}

function longestNote() {
  if (notes.length === 0) return null;
  
  return notes.reduce((longest, current) => {
    return current.text.length > longest.text.length ? current : longest;
  }, notes[0]);
}

function countByCategory() {
  const counts = {};
  for (const note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}

function getSummary() {
  const total = notes.length;
  const counts = countByCategory();
  const label = total === 1 ? "note" : "notes";
  
  const categoryDetails = Object.entries(counts)
    .map(([cat, count]) => `${count} ${cat}`)
    .join(", ");
    
  return `${total} ${label}: ${categoryDetails}.`;
}

function isDuplicate(text) {
  const formattedText = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === formattedText);
}

function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];
  const trimmedText = text.trim();

  if (trimmedText.length === 0 || trimmedText.length > 200) {
    console.log("Failed to add note: Text length must be between 1 and 200 characters.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log(`Failed to add note: Category must be one of ${validCategories.join(", ")}.`);
    return false;
  }

  if (isDuplicate(trimmedText)) {
    console.log("Failed to add note: Duplicate note text already exists.");
    return false;
  }

  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: newId, text: trimmedText, category });
  console.log("Successfully added note!");
  return true;
}


console.log("searchNotes ('javascript'):", searchNotes("javascript")); 


console.log("searchNotes ('python'):", searchNotes("python")); 


// 2. longestNote tests
console.log("longestNote():", longestNote()); 


const savedNotes = notes;
notes = [];
console.log("longestNote() when empty:", longestNote()); 

notes = savedNotes; 


console.log("countByCategory():", countByCategory()); 



console.log("getSummary():", getSummary()); 



console.log("isDuplicate ('Call mum'):", isDuplicate("Call mum")); 


console.log("isDuplicate ('Buy groceries'):", isDuplicate("Buy groceries")); 



console.log("addNote (valid):", addNote("Buy tea", "personal")); 


console.log("addNote (duplicate):", addNote("Call mum", "personal")); 


console.log("addNote (invalid category):", addNote("Go to gym", "health")); 
