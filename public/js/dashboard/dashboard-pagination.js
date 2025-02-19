//dashboard-pagination.js
window.paginationState = {
    brands: {
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: 5,
        totalItems: 0
    },
    products: {
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: 5,
        totalItems: 0
    },
    users: {
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: 5,
        totalItems: 0
    },
    bookings: {
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: 5,
        totalItems: 0
    }
};

// Function to update pagination UI
window.updatePagination = function(type, paginationState) {
    const paginationContainer = document.getElementById(`${type}Pagination`);
    if (!paginationContainer) return;
    
    let paginationHTML = `
        <button class="pagination-btn" onclick="window.changePage('${type}', 1)" ${paginationState.currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-double-left"></i>
        </button>
        <button class="pagination-btn" onclick="window.changePage('${type}', ${paginationState.currentPage - 1})" ${paginationState.currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-left"></i>
        </button>
    `;
    
    for (let i = 1; i <= paginationState.totalPages; i++) {
        if (
            i === 1 || 
            i === paginationState.totalPages || 
            (i >= paginationState.currentPage - 1 && i <= paginationState.currentPage + 1)
        ) {
            paginationHTML += `
                <button class="pagination-btn ${i === paginationState.currentPage ? 'active' : ''}"
                    onclick="window.changePage('${type}', ${i})">
                    ${i}
                </button>
            `;
        } else if (
            i === paginationState.currentPage - 2 || 
            i === paginationState.currentPage + 2
        ) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    paginationHTML += `
        <button class="pagination-btn" onclick="window.changePage('${type}', ${paginationState.currentPage + 1})" ${paginationState.currentPage === paginationState.totalPages ? 'disabled' : ''}>
            <i class="fas fa-angle-right"></i>
        </button>
        <button class="pagination-btn" onclick="window.changePage('${type}', ${paginationState.totalPages})" ${paginationState.currentPage === paginationState.totalPages ? 'disabled' : ''}>
            <i class="fas fa-angle-double-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
};

// Function to change page
window.changePage = function(type, page) {
    if (page < 1 || page > window.paginationState[type].totalPages) return;
    
    window.paginationState[type].currentPage = page;
    switch(type) {
        case 'brands':
            window.loadBrands();
            break;
        case 'products':
            window.loadAllProducts();
            break;
        case 'users':
            window.loadUsers();
            break;
        case 'bookings':
            window.loadBookings();
            break;
    }
};
