// Users Management
let userFilterState = {
    searchTerm: '',
    roleFilter: ''
};

window.loadUsers = async function() {
    try {
        const response = await fetch('/api/users');
        let users = await response.json();
        
        // Apply filters to entire dataset
        const filteredUsers = users.filter(user => {
            const searchMatch = !userFilterState.searchTerm || 
                Object.values(user).some(val => 
                    String(val).toLowerCase().includes(userFilterState.searchTerm)
                );
            
            const roleMatch = !userFilterState.roleFilter || 
                user.role.toLowerCase() === userFilterState.roleFilter;
            
            return searchMatch && roleMatch;
        });
        
        // Calculate pagination on filtered dataset
        window.paginationState.users.totalItems = filteredUsers.length;
        window.paginationState.users.totalPages = Math.ceil(
            filteredUsers.length / window.paginationState.users.itemsPerPage
        );
        
        // Get current page items
        const startIndex = (window.paginationState.users.currentPage - 1) * 
                          window.paginationState.users.itemsPerPage;
        const endIndex = startIndex + window.paginationState.users.itemsPerPage;
        const currentUsers = filteredUsers.slice(startIndex, endIndex);
        
        const usersTableBody = document.getElementById('usersTableBody');
        if (!usersTableBody) return;

        usersTableBody.innerHTML = currentUsers.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.fullName}</td>
                <td>${user.email}</td>
                <td>
                    <span class="user-role ${user.role}">
                        ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                </td>
                <td>${user.mobile || 'N/A'}</td>
                <td class="location-cell">
                    ${[user.address, user.city, user.province, user.zipCode]
                        .filter(Boolean)
                        .join(', ')}
                </td>
                <td>${new Date(user.joinDate).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        ${user.role !== 'admin' ? `
                            <button class="action-btn" onclick="updateUserRole('${user.id}', 'admin')">
                                <i class="fas fa-user-shield"></i> Make Admin
                            </button>
                        ` : `
                            <button class="action-btn" onclick="updateUserRole('${user.id}', 'member')">
                                <i class="fas fa-user"></i> Make Member
                            </button>
                        `}
                        <button class="action-btn delete-btn" onclick="deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Update pagination UI
        updatePagination('users', window.paginationState.users);

        // Update filter inputs to reflect current state
        const searchInput = document.getElementById('userSearch');
        const roleFilter = document.getElementById('roleFilter');
        if (searchInput) searchInput.value = userFilterState.searchTerm;
        if (roleFilter) roleFilter.value = userFilterState.roleFilter;

    } catch (error) {
        console.error('Error loading users:', error);
    }
};


// Delete user
async function deleteUser(userId) {
   if (!confirm('Are you sure you want to delete this user?')) {
       return;
   }

   try {
       const response = await fetch(`/api/users/${userId}`, {
           method: 'DELETE'
       });

       if (!response.ok) {
           const error = await response.json();
           alert(error.error || 'Failed to delete user');
           return;
       }

       loadUsers();
   } catch (error) {
       console.error('Error deleting user:', error);
       alert('Failed to delete user');
   }
}

// Update user role
window.updateUserRole = async function(userId, newRole) {
    try {
        const response = await fetch(`/api/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Failed to update user role');
            return;
        }

        // Reload full users list and reapply filters
        await loadUsers();
    } catch (error) {
        console.error('Error updating user role:', error);
        alert('Failed to update user role');
    }
};

// Search and filter functionality
function initializeUserFilters() {
    const searchInput = document.getElementById('userSearch');
    const roleFilter = document.getElementById('roleFilter');

    if (!searchInput || !roleFilter) return;

    // Remove any existing listeners
    const newSearchInput = searchInput.cloneNode(true);
    const newRoleFilter = roleFilter.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    roleFilter.parentNode.replaceChild(newRoleFilter, roleFilter);

    // Add new event listeners with debounced search
    newSearchInput.addEventListener('input', debounce((e) => {
        userFilterState.searchTerm = e.target.value.toLowerCase();
        // Reset to first page when filtering
        window.paginationState.users.currentPage = 1;
        loadUsers();
    }, 300));

    newRoleFilter.addEventListener('change', (e) => {
        userFilterState.roleFilter = e.target.value.toLowerCase();
        // Reset to first page when filtering
        window.paginationState.users.currentPage = 1;
        loadUsers();
    });

    // Initial load
    loadUsers();
}

// Utility debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function filterUsers() {
   const searchInput = document.getElementById('userSearch');
   const roleFilter = document.getElementById('roleFilter');
   const rows = document.querySelectorAll('#usersTableBody tr');

   const searchTerm = searchInput.value.toLowerCase();
   const roleValue = roleFilter.value.toLowerCase();

   rows.forEach(row => {
       const text = row.textContent.toLowerCase();
       const roleCell = row.querySelector('.user-role').textContent.toLowerCase();
       
       const matchesSearch = text.includes(searchTerm);
       const matchesRole = !roleValue || roleCell.includes(roleValue);

       row.style.display = matchesSearch && matchesRole ? '' : 'none';
   });
}
