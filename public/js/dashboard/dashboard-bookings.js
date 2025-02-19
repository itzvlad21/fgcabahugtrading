window.loadBookings = async function() {
    try {
        const response = await fetch('/api/cal/bookings');
        const bookings = await response.json();
        
        // Calculate pagination
        window.paginationState.bookings.totalItems = bookings.length;
        window.paginationState.bookings.totalPages = Math.ceil(bookings.length / window.paginationState.bookings.itemsPerPage);
        
        // Get current page items
        const startIndex = (window.paginationState.bookings.currentPage - 1) * window.paginationState.bookings.itemsPerPage;
        const endIndex = startIndex + window.paginationState.bookings.itemsPerPage;
        const currentBookings = bookings.slice(startIndex, endIndex);

         //event listeners for filtering
         const searchInput = document.getElementById('bookingSearch');
         const statusFilter = document.getElementById('statusFilter');
         
         searchInput.addEventListener('input', filterBookings);
         statusFilter.addEventListener('change', filterBookings);
        
        const tbody = document.getElementById('bookingsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = currentBookings.map(booking => `
            <tr>
                <td>${booking.full_name}</td>
                <td>${booking.email}</td>
                <td>${booking.phone_number || 'N/A'}</td>
                <td>${new Date(booking.booking_date).toLocaleString()}</td>
                <td class="inquiry-cell">
                    <div class="inquiry-content">
                        ${booking.inquiry || 'No inquiry provided'}
                    </div>
                </td>
                <td>
                    <select class="status-select ${booking.status}" 
                            onchange="updateBookingStatus(${booking.id}, this.value)">
                        <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <button class="action-btn delete-btn" onclick="deleteBooking(${booking.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');

        // Update pagination UI
        updatePagination('bookings', window.paginationState.bookings);
        filterBookings();

    } catch (error) {
        console.error('Error loading bookings:', error);
    }
};

function filterBookings() {
    const searchTerm = document.getElementById('bookingSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value.toLowerCase();
    const rows = document.querySelectorAll('#bookingsTableBody tr');

    rows.forEach(row => {
        const fullName = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        const phone = row.cells[2].textContent.toLowerCase();
        const status = row.querySelector('.status-select').value.toLowerCase();

        const matchesSearch = 
            fullName.includes(searchTerm) || 
            email.includes(searchTerm) || 
            phone.includes(searchTerm);
            
        const matchesStatus = !statusFilter || status === statusFilter;

        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

// Add status update function
async function updateBookingStatus(bookingId, newStatus) {
   try {
       const response = await fetch(`/api/bookings/${bookingId}/status`, {
           method: 'PUT',
           headers: {
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({ status: newStatus })
       });

       if (!response.ok) {
           throw new Error('Failed to update status');
       }

       // Reload bookings to show updated status
       loadBookings();
   } catch (error) {
       console.error('Error updating booking status:', error);
   }
}

// Add delete function
async function deleteBooking(bookingId) {
   if (!confirm('Are you sure you want to delete this booking?')) {
       return;
   }

   try {
       const response = await fetch(`/api/bookings/${bookingId}`, {
           method: 'DELETE'
       });

       if (!response.ok) {
           throw new Error('Failed to delete booking');
       }

       // Reload bookings after deletion
       loadBookings();
   } catch (error) {
       console.error('Error deleting booking:', error);
   }
}

// Phone number formatting utility
function formatPhoneNumber(phone) {
    if (!phone) return 'N/A';
    
    // Remove all non-numeric characters
    let cleaned = ('' + phone).replace(/\D/g, '');
    
    // Handle scientific notation format
    if (cleaned.includes('E')) {
        cleaned = cleaned.split('E')[0];
    }
    
    // Remove all leading zeros first
    cleaned = cleaned.replace(/^0+/, '');
    
    // Handle different formats
    if (cleaned.startsWith('63')) {
        cleaned = cleaned.substring(2); // Remove 63 prefix
    }
    
    // Add single leading zero
    cleaned = '0' + cleaned;
    
    // Return the formatted number
    return cleaned;
}
// Export bookings to CSV
function exportBookingsToCSV(bookings) {
    // CSV Headers
    const headers = [
        'Full Name',
        'Email',
        'Phone Number',
        'Date & Time',
        'Inquiry',
        'Status'
    ];

    // Convert bookings to CSV rows
    const rows = bookings.map(booking => {
        const phoneNumber = formatPhoneNumber(booking.phone_number);
        
        return [
            booking.full_name,
            booking.email,
            // Force phone number as text by adding ="number"
            `="${phoneNumber}"`,
            new Date(booking.booking_date).toLocaleString(),
            booking.inquiry || 'No inquiry provided',
            booking.status
        ];
    });

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    
    // Combine headers and rows
    const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
            // Escape special characters and wrap in quotes if not already formatted
            cell.startsWith('=') ? cell : `"${(cell + '').replace(/"/g, '""')}"`
        ).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event handler for export button
document.getElementById('exportBookings')?.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/cal/bookings');
        const bookings = await response.json();
        exportBookingsToCSV(bookings);
    } catch (error) {
        console.error('Error exporting bookings:', error);
        alert('Failed to export bookings');
    }
});

// Update phone number display in table
function updateBookingsTable(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    tbody.innerHTML = bookings.map(booking => `
        <tr>
            <td>${booking.full_name}</td>
            <td>${booking.email}</td>
            <td>${formatPhoneNumber(booking.phone_number)}</td>
            <td>${new Date(booking.booking_date).toLocaleString()}</td>
            <td>${booking.inquiry || 'No inquiry provided'}</td>
            <td>
                <select class="status-select ${booking.status}" onchange="updateBookingStatus(${booking.id}, this.value)">
                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <button class="action-btn delete-btn" onclick="deleteBooking(${booking.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}