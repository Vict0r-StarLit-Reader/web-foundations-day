// DOM Element References
const loadUsersBtn = document.getElementById('load-users');
const filterInput = document.getElementById('filter-input');
const statusP = document.getElementById('status');
const usersList = document.getElementById('users-list');

// Global array to store loaded users
let allUsers = [];

/**
 * Renders an array of user objects to the DOM.
 * Displays name, email, city, and company name using createElement and textContent.
 */
function renderUsers(list) {
  usersList.innerHTML = ''; // Clear existing list

  if (list.length === 0) {
    statusP.textContent = 'No users match your filter.';
    return;
  }

  statusP.textContent = `Showing ${list.length} user(s).`;

  list.forEach(user => {
    const li = document.createElement('li');
    
    // Create text elements using textContent
    const nameHeading = document.createElement('strong');
    nameHeading.textContent = user.name;

    const details = document.createElement('p');
    details.textContent = `Email: ${user.email} | City: ${user.address?.city} | Company: ${user.company?.name}`;

    li.appendChild(nameHeading);
    li.appendChild(details);
    usersList.appendChild(li);
  });
}

/**
 * Fetches user data from JSONPlaceholder API using async/await and try/catch/finally.
 */
async function loadUsers() {
  const url = 'https://jsonplaceholder.typicode.com/users';

  // Disable button and set loading state
  loadUsersBtn.disabled = true;
  statusP.textContent = 'Loading users...';
  usersList.innerHTML = '';

  try {
    const response = await fetch(url);

    // Check response status
    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }

    const data = await response.json();
    allUsers = data; // Store users in state array

    renderUsers(allUsers);
  } catch (error) {
    statusP.textContent = `Failed to load users: ${error.message}`;
    console.error('Fetch error:', error);
  } finally {
    // Re-enable load button
    loadUsersBtn.disabled = false;
  }
}

// Event Listener for Load Button
loadUsersBtn.addEventListener('click', loadUsers);

// Event Listener for Input Filter (client-side filtering, no new requests)
filterInput.addEventListener('input', (event) => {
  const searchTerm = event.target.value.toLowerCase().trim();

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm)
  );

  renderUsers(filteredUsers);
});