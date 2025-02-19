//dashboard.js
let socket;
// Initialize preview for both add and edit forms
setupLogoPreview('brandLogo', 'logoPreview');
setupLogoPreview('editBrandLogo', 'editLogoPreview');

function setupLogoPreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" class="logo-preview">`;
            }
            reader.readAsDataURL(file);
        }
    });
}

// dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Authentication check
    function checkAdminAccess() {
       const user = JSON.parse(localStorage.getItem('user'));
       if (!user || user.role !== 'admin') {
           window.location.href = '/index.html';
           return false;
       }
       return true;
   }

   // Run auth check immediately
   if (!checkAdminAccess()) {
       return; // Stop execution if not admin
   }    

    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user'));
   
    // Update username and role if user exists
    if (currentUser) {
        const userNameElement = document.querySelector('.user-name');
        const userRoleElement = document.querySelector('.user-role');
        const userAvatarElement = document.querySelector('.user-avatar span');
        
        // Update name
        userNameElement.textContent = currentUser.username;
        userRoleElement.textContent = currentUser.role;
        
        // Update avatar initials (get first letter of username)
        userAvatarElement.textContent = currentUser.username.charAt(0).toUpperCase();
    }

    // Logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', function() {
        // Clear user data from localStorage
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = '/login.html';
    });

   // Menu Toggle Functionality
   const menuToggle = document.querySelector('.menu-toggle');
   const sidebar = document.querySelector('.sidebar');
   
   menuToggle?.addEventListener('click', () => {
       sidebar.classList.toggle('active');
   });

   // Navigation Functionality
   const navItems = document.querySelectorAll('.sidebar-nav li');
   navItems.forEach(item => {
       item.addEventListener('click', () => {
           // Remove active class from all items
           navItems.forEach(i => i.classList.remove('active'));
           // Add active class to clicked item
           item.classList.add('active');
           // Update page title
           const pageTitle = document.querySelector('.page-title');
           const linkText = item.querySelector('a span').textContent;
           pageTitle.textContent = linkText;
       });
   });

   // Close sidebar when clicking outside on mobile
   document.addEventListener('click', (e) => {
       if (window.innerWidth <= 768) {
           if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
               sidebar.classList.remove('active');
           }
       }
   });

   // Tab Switching
   const navLinks = document.querySelectorAll('.sidebar-nav a');
   const tabContents = document.querySelectorAll('.tab-content');

   navLinks.forEach(link => {
       link.addEventListener('click', (e) => {
           e.preventDefault();
           const targetId = link.getAttribute('href').substring(1);
           
           // Hide all tab contents
           tabContents.forEach(content => {
               content.style.display = 'none';
           });
           
           // Show target tab content
           const targetContent = document.getElementById(targetId + 'Content');
           if (targetContent) {
               targetContent.style.display = 'block';
           }

           // If products tab is selected, load brands and products
           if (targetId === 'products') {
               loadBrands();
               loadAllProducts();
           }
       });
   });

   // Show dashboard tab by default
   document.getElementById('dashboardContent').style.display = 'block';

   // Brands Management
   const addBrandBtn = document.getElementById('addBrandBtn');
   const addBrandModal = document.getElementById('addBrandModal');
   const addProductModal = document.getElementById('addProductModal');
   const addBrandForm = document.getElementById('addBrandForm');
   const addProductForm = document.getElementById('addProductForm');
   const brandsTableBody = document.getElementById('brandsTableBody');

   // Modal Controls
   const editBrandModal = document.getElementById('editBrandModal');
   const editProductModal = document.getElementById('editProductModal');
   const editBrandForm = document.getElementById('editBrandForm');
   const editProductForm = document.getElementById('editProductForm');

   const closeButtons = document.querySelectorAll('.close-btn');
   closeButtons.forEach(btn => {
       btn.addEventListener('click', () => {
           addBrandModal.style.display = 'none';
           addProductModal.style.display = 'none';
           editBrandModal.style.display = 'none';
           editProductModal.style.display = 'none';
       });
   });

   window.addEventListener('click', (e) => {
       if (e.target === addBrandModal) addBrandModal.style.display = 'none';
       if (e.target === addProductModal) addProductModal.style.display = 'none';
       if (e.target === editBrandModal) editBrandModal.style.display = 'none';
       if (e.target === editProductModal) editProductModal.style.display = 'none';
   });

   // Show Edit Brand Modal
   window.showEditBrandModal = function(brandId, name, description, type, logo) {
    document.getElementById('editBrandId').value = brandId;
    document.getElementById('editBrandName').value = name;
    document.getElementById('editBrandDescription').value = description;
    document.getElementById('editBrandType').value = type;
    
    // Show current logo if it exists
    const previewDiv = document.getElementById('editLogoPreview');
    if (logo) {
        previewDiv.innerHTML = `
            <div class="current-logo">
                <p>Current Logo:</p>
                <img src="/uploads/brands/${logo}" alt="Current logo" class="logo-preview">
            </div>
        `;
    } else {
        previewDiv.innerHTML = '';
    }
    
    editBrandModal.style.display = 'block';
};

   // Show Edit Product Modal
   window.showEditProductModal = function(brandId, productId, name, description) {
       document.getElementById('editProductBrandId').value = brandId;
       document.getElementById('editProductId').value = productId;
       document.getElementById('editProductName').value = name;
       document.getElementById('editProductDescription').value = description;
       editProductModal.style.display = 'block';
   };

   // Edit Brand Form Submit
   editBrandForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const brandId = document.getElementById('editBrandId').value;
    const formData = new FormData();
    
    // Append form fields to FormData
    formData.append('name', document.getElementById('editBrandName').value);
    formData.append('description', document.getElementById('editBrandDescription').value);
    formData.append('type', document.getElementById('editBrandType').value);
    
    // Add file if one is selected
    const logoInput = document.getElementById('editBrandLogo');
    if (logoInput.files[0]) {
        formData.append('logo', logoInput.files[0]);
    }

    try {
        const response = await fetch(`/api/brands/${brandId}`, {
            method: 'PUT',
            body: formData // Remove headers - FormData sets the correct content-type
        });

        if (response.ok) {
            editBrandModal.style.display = 'none';
            editBrandForm.reset();
            document.getElementById('editLogoPreview').innerHTML = '';
            loadBrands();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to update brand');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update brand');
    }
});

   // Edit Product Form Submit
   editProductForm.addEventListener('submit', async (e) => {
       e.preventDefault();
       
       const brandId = document.getElementById('editProductBrandId').value;
       const productId = document.getElementById('editProductId').value;
       const formData = {
           name: document.getElementById('editProductName').value,
           description: document.getElementById('editProductDescription').value
       };

       try {
           const response = await fetch(`/api/brands/${brandId}/products/${productId}`, {
               method: 'PUT',
               headers: {
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify(formData)
           });

           if (response.ok) {
               editProductModal.style.display = 'none';
               editProductForm.reset();
               loadBrands();
               loadAllProducts();
           } else {
               const error = await response.json();
               alert(error.message || 'Failed to update product');
           }
       } catch (error) {
           console.error('Error:', error);
           alert('Failed to update product');
       }
   });

   // Show Add Brand Modal
   addBrandBtn.addEventListener('click', () => {
       addBrandModal.style.display = 'block';
   });

   // Add Brand Form Submit
   addBrandForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('brandName').value);
    formData.append('description', document.getElementById('brandDescription').value);
    formData.append('type', document.getElementById('brandType').value);
    
    const logoInput = document.getElementById('brandLogo');
    if (logoInput.files[0]) {
        formData.append('logo', logoInput.files[0]);
    }

    try {
        const response = await fetch('/api/brands', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            addBrandModal.style.display = 'none';
            addBrandForm.reset();
            document.getElementById('logoPreview').innerHTML = '';
            loadBrands();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to add brand');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add brand');
    }
});

   // Add Product Form Submit
   addProductForm.addEventListener('submit', async (e) => {
       e.preventDefault();
       
       const brandId = document.getElementById('brandId').value;
       const formData = {
           name: document.getElementById('productName').value,
           description: document.getElementById('productDescription').value
       };

       try {
           const response = await fetch(`/api/brands/${brandId}/products`, {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify(formData)
           });

           if (response.ok) {
               addProductModal.style.display = 'none';
               addProductForm.reset();
               loadBrands();
               loadAllProducts();
           } else {
               const error = await response.json();
               alert(error.message || 'Failed to add product');
           }
       } catch (error) {
           console.error('Error:', error);
           alert('Failed to add product');
       }
   });

   // Load and Display Brands
   window.loadBrands = async function() {
    try {
        const response = await fetch('/api/brands');
        const brands = await response.json();
        
        // Apply current filters
        const filteredBrands = brands.filter(brand => {
            const nameMatch = !filterState.brandSearch || 
                brand.name.toLowerCase().includes(filterState.brandSearch);
            const typeMatch = !filterState.typeFilter || 
                brand.type.toLowerCase() === filterState.typeFilter;
            return nameMatch && typeMatch;
        });
        
        // Update pagination with filtered count
        window.paginationState.brands.totalItems = filteredBrands.length;
        window.paginationState.brands.totalPages = Math.ceil(
            filteredBrands.length / window.paginationState.brands.itemsPerPage
        );
        
        // Get current page items
        const startIndex = (window.paginationState.brands.currentPage - 1) * 
                          window.paginationState.brands.itemsPerPage;
        const endIndex = startIndex + window.paginationState.brands.itemsPerPage;
        const currentBrands = filteredBrands.slice(startIndex, endIndex);
        
        const brandsTableBody = document.getElementById('brandsTableBody');
        brandsTableBody.innerHTML = currentBrands.map(brand => `
            <tr>
                <td>
                    ${brand.logo ? 
                        `<img src="/uploads/brands/${brand.logo}" alt="${brand.name}" class="brand-logo">` :
                        `<div class="no-logo">No Logo</div>`
                    }
                </td>
                <td>${brand.name}</td>
                <td class="description-cell">
                    ${brand.description ? brand.description.split('. ').join('.<br><br>') : ''}
                </td>
                <td>${brand.type}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn add-product-btn" onclick="showAddProductModal(${brand.id})">
                            <i class="fas fa-plus"></i> Add Product
                        </button>
                        <button class="action-btn edit-btn" onclick="showEditBrandModal(${brand.id}, '${brand.name}', '${brand.description || ''}', '${brand.type}', '${brand.logo || ''}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteBrand(${brand.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        updateBrandsTable(currentBrands);
        updatePagination('brands', window.paginationState.brands);
    } catch (error) {
        console.error('Error loading brands:', error);
    }
};

   // Load and display all products
   window.loadAllProducts = async function() {
    try {
        const response = await fetch('/api/brands');
        const brands = await response.json();
        
        const productsPromises = brands.map(brand => 
            fetch(`/api/brands/${brand.id}/products`)
                .then(res => res.json())
                .then(data => data.products.map(product => ({
                    ...product, 
                    brandName: brand.name, 
                    brandId: brand.id
                })))
        );
        
        const productsArrays = await Promise.all(productsPromises);
        let allProducts = productsArrays.flat();

        // Apply filters
        if (productFilterState.searchTerm) {
            allProducts = allProducts.filter(product => 
                product.name.toLowerCase().includes(productFilterState.searchTerm)
            );
        }

        if (productFilterState.brandFilter) {
            allProducts = allProducts.filter(product => 
                product.brandName.toLowerCase() === productFilterState.brandFilter
            );
        }
        
        // Calculate pagination
        window.paginationState.products.totalItems = allProducts.length;
        window.paginationState.products.totalPages = Math.ceil(
            allProducts.length / window.paginationState.products.itemsPerPage
        );
        
        // Get current page items
        const startIndex = (window.paginationState.products.currentPage - 1) * 
                          window.paginationState.products.itemsPerPage;
        const endIndex = startIndex + window.paginationState.products.itemsPerPage;
        const currentProducts = allProducts.slice(startIndex, endIndex);
        
        const productsTableBody = document.getElementById('productsTableBody');
        productsTableBody.innerHTML = currentProducts.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${product.brandName}</td>
                <td>${product.description || ''}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="showEditProductModal(${product.brandId}, ${product.id}, '${product.name}', '${product.description || ''}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteProduct(${product.brandId}, ${product.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        updatePagination('products', window.paginationState.products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
};


   // Show Add Product Modal
   window.showAddProductModal = function(brandId) {
       document.getElementById('brandId').value = brandId;
       addProductModal.style.display = 'block';
   };

   // Delete Product
   window.deleteProduct = async function(brandId, productId) {
       const confirmed = confirm('Are you sure you want to delete this product?');
       if (!confirmed) {
           return;
       }

       try {
           const response = await fetch(`/api/brands/${brandId}/products/${productId}`, {
               method: 'DELETE'
           });

           if (response.ok) {
               loadBrands();
               loadAllProducts();
           } else {
               alert('Failed to delete product');
           }
       } catch (error) {
           console.error('Error deleting product:', error);
           alert('Failed to delete product');
       }
   };

   // Delete Brand
   window.deleteBrand = async function(brandId) {
       if (!confirm('Are you sure you want to delete this brand and all its products?')) {
           return;
       }

       try {
           const response = await fetch(`/api/brands/${brandId}`, {
               method: 'DELETE'
           });

           if (response.ok) {
               loadBrands();
               loadAllProducts();
           } else {
               alert('Failed to delete brand');
           }
       } catch (error) {
           console.error('Error deleting brand:', error);
           alert('Failed to delete brand');
       }
   };

   // Load initial data
   loadBrands();
   loadAllProducts();
});
document.addEventListener('DOMContentLoaded', function() {
   // Tab management
   const navLinks = document.querySelectorAll('.sidebar-nav a');
   const tabContents = document.querySelectorAll('.tab-content');
   let currentTab = 'dashboard';
   let chatInstance = null;

   function showTab(tabId) {
       // Hide all tabs
       tabContents.forEach(content => {
           content.style.display = 'none';
       });

       // Remove active class from all nav links
       navLinks.forEach(link => {
           link.classList.remove('active');
       });

       // Show selected tab
       const targetContent = document.getElementById(tabId + 'Content');
       if (targetContent) {
           targetContent.style.display = 'block';
       }

       // Add active class to selected nav link
       const activeLink = document.querySelector(`.sidebar-nav a[href="#${tabId}"]`);
       if (activeLink) {
           activeLink.classList.add('active');
       }

       // Handle tab-specific initialization
       if (tabId === 'chat') {
           if (!chatInstance) {
               chatInstance = new ChatManager();
           }
           chatInstance.initialize();
       } else if (chatInstance) {
           chatInstance.destroy();
       }

       currentTab = tabId;
   }

   // Tab click handlers
   navLinks.forEach(link => {
       link.addEventListener('click', (e) => {
           e.preventDefault();
           const targetId = link.getAttribute('href').substring(1);
           showTab(targetId);
       });
   });

   // Show initial tab
   showTab('dashboard');
});
document.addEventListener('DOMContentLoaded', function() {
    // Function to load dashboard metrics
    async function loadDashboardMetrics() {
        try {
            const response = await fetch('/api/dashboard/metrics');
            const metrics = await response.json();
            
            // Update metrics display
            document.getElementById('totalUsers').textContent = metrics.userCount;
            document.getElementById('totalProducts').textContent = metrics.productCount;
            document.getElementById('totalInquiries').textContent = metrics.inquiryCount;
            
        } catch (error) {
            console.error('Error loading metrics:', error);
        }
    }
 
    // Function to load recent inquiries
    async function loadRecentInquiries() {
        try {
            const response = await fetch('/api/contact-submissions/recent');
            const inquiries = await response.json();
            
            const inquiriesList = document.getElementById('recentInquiries');
            inquiriesList.innerHTML = inquiries.map(inquiry => `
                <div class="activity-item">
                    <div class="activity-avatar">
                        ${inquiry.name.charAt(0)}
                    </div>
                    <div class="activity-content">
                        <h4>${inquiry.name}</h4>
                        <p>${inquiry.message.substring(0, 50)}...</p>
                    </div>
                    <div class="activity-time">
                        ${formatTimeAgo(new Date(inquiry.submitted_at))}
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading inquiries:', error);
        }
    }
 
    // Helper function to format time ago
    function formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
 
    // Load initial data
    loadDashboardMetrics();
    loadRecentInquiries();
 
    // Refresh metrics every 5 minutes
    setInterval(loadDashboardMetrics, 300000);
    setInterval(loadRecentInquiries, 300000);
 });
document.addEventListener('DOMContentLoaded', function() {
   const navLinks = document.querySelectorAll('.sidebar-nav a');
   let filtersInitialized = false;
   
   navLinks.forEach(link => {
       link.addEventListener('click', (e) => {
           const targetId = link.getAttribute('href').substring(1);
           if (targetId === 'products' && !filtersInitialized) {
               setTimeout(() => {
                   initializeTableFilters();
                   filtersInitialized = true;
               }, 100);
           }
       });
   });
});
document.addEventListener('DOMContentLoaded', function() {  
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    initializeSocketConnection();

    // Hide dashboard link for non-admin users
   if (currentUser && currentUser.role !== 'admin') {
    const dashboardLinks = document.querySelectorAll('a[href*="dashboard"]');
    dashboardLinks.forEach(link => {
        link.style.display = 'none';
    });
}

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1);
            if (targetId === 'products') {
                setTimeout(initializeTableFilters, 100); // Initialize after content is loaded
            }
        });
    });

    // Initialize user management features when on users tab
    const userTab = document.querySelector('a[href="#users"]');
    if (userTab) {
        userTab.addEventListener('click', () => {
            loadUsers();
            initializeUserFilters();
        });
    }

    // Load reviews when customization tab is clicked
    const customizationTab = document.querySelector('a[href="#customization"]');
    if (customizationTab) {
        customizationTab.addEventListener('click', loadReviews);
    }
   
   // Load bookings only when bookings tab is clicked
   const bookingsTab = document.querySelector('a[href="#bookings"]');
   if (bookingsTab) {
       bookingsTab.addEventListener('click', () => {
           loadBookings();
           // Start refresh interval only when tab is active
           const refreshInterval = setInterval(loadBookings, 60000);
           
           // Clear interval when switching to different tab
           const otherTabs = document.querySelectorAll('.sidebar-nav a:not([href="#bookings"])');
           otherTabs.forEach(tab => {
               tab.addEventListener('click', () => {
                   clearInterval(refreshInterval);
               });
           });
       });
   }
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize system metrics
    let startTime = new Date();
    let socket = io();

    // Update metrics periodically
    function updateMetrics() {
        fetch('/api/dashboard/metrics')
            .then(response => response.json())
            .then(data => {
                document.getElementById('totalUsers').textContent = data.userCount;
                document.getElementById('totalProducts').textContent = data.productCount;
                document.getElementById('totalInquiries').textContent = data.inquiryCount;
            })
            .catch(error => console.error('Error fetching metrics:', error));
    }

    // Update system status
    function updateSystemStatus() {
        const uptimeInSeconds = Math.floor((new Date() - startTime) / 1000);
        const hours = Math.floor(uptimeInSeconds / 3600);
        const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
        const seconds = uptimeInSeconds % 60;
        
        document.getElementById('systemUptime').textContent = 
            `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Simulate server load
        const load = Math.floor(Math.random() * 30 + 20);
        document.getElementById('serverLoad').textContent = `${load}%`;
    }

    // Socket.io event handlers
    socket.on('connect', () => {
        document.getElementById('dbStatus').textContent = 'Connected';
        document.getElementById('dbStatus').style.color = '#059669';
    });

    socket.on('disconnect', () => {
        document.getElementById('dbStatus').textContent = 'Disconnected';
        document.getElementById('dbStatus').style.color = '#DC2626';
    });

    socket.on('active_users', (users) => {
        document.getElementById('activeUsers').textContent = users.length;
    });

    // Refresh button handler
    document.querySelector('.refresh-btn').addEventListener('click', function() {
        this.classList.add('rotating');
        updateBrandChart().then(() => {
            setTimeout(() => this.classList.remove('rotating'), 1000);
        });
    });

    // Initialize
    updateMetrics();
    
    // Set up intervals
    setInterval(updateMetrics, 30000); // Every 30 seconds
    setInterval(updateSystemStatus, 1000); // Every second

});


async function updateBrandChart() {
    try {
        // Fetch all brands
        const brandsResponse = await fetch('/api/brands');
        const brands = await brandsResponse.json();

        // Fetch products for each brand
        const productPromises = brands.map(brand => 
            fetch(`/api/brands/${brand.id}/products`)
                .then(res => res.json())
                .then(data => ({
                    brandName: brand.name,
                    productCount: data.products.length
                }))
        );

        const brandProductCounts = await Promise.all(productPromises);

        // Prepare chart data
        const chartData = {
            labels: brandProductCounts.map(brand => brand.brandName),
            datasets: [{
                label: 'Number of Products',
                data: brandProductCounts.map(brand => brand.productCount),
                backgroundColor: [
                    '#0F553F',    // Primary Green
                    '#1A7355',    // Secondary Green
                    '#298066',    // Light Green
                    '#45A49E',    // Teal
                    '#72C293'     // Lighter Green
                ],
                borderColor: 'rgba(15, 85, 63, 0.8)',
                borderWidth: 1
            }]
        };

        // Get the canvas context
        const ctx = document.getElementById('brandDistribution').getContext('2d');

        // Destroy existing chart if it exists
        if (window.brandDistributionChart instanceof Chart) {
            window.brandDistributionChart.destroy();
        }

        // Create new chart
        window.brandDistributionChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 10,
                        bottom: 10
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Products',
                            font: {
                                size: 12
                            }
                        },
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Brands',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Product Distribution Across Brands',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 10
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Products: ${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error updating brand distribution chart:', error);
    }
}

function initializeSocketConnection() {
    socket = io();
    const user = JSON.parse(localStorage.getItem('user'));

    socket.on('connect', () => {
        // Send user data when connected
        socket.emit('user_connected', JSON.stringify(user));
    });

    socket.on('active_users_update', (users) => {
        document.getElementById('activeUsers').textContent = users.length;
        updateActiveUsersList(users);
    });

    // Send heartbeat every 30 seconds
    setInterval(() => {
        socket.emit('heartbeat');
    }, 30000);
}

function updateActiveUsersList(users) {
    const usersList = document.createElement('div');
    usersList.className = 'active-users-list';
    
    users.forEach(user => {
        const userEl = document.createElement('div');
        userEl.className = 'active-user';
        userEl.innerHTML = `
            <span class="user-avatar">${user.username.charAt(0)}</span>
            <span class="user-name">${user.username}</span>
            <span class="user-role">${user.role}</span>
        `;
        usersList.appendChild(userEl);
    });

    // Update tooltip or dropdown with active users
    const activeUsersElement = document.getElementById('activeUsers');
    activeUsersElement.title = users.map(u => u.username).join('\n');
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

// Add initialization when page loads
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1);
            if (targetId === 'products') {
                setTimeout(initializeProductFilters, 100);
            }
        });
    });

    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    chartScript.onload = () => {
        updateBrandChart();
    };
    document.head.appendChild(chartScript);

    // Existing refresh button event listener
    document.querySelector('.refresh-btn')?.addEventListener('click', function() {
        this.classList.add('rotating');
        updateBrandChart().then(() => {
            setTimeout(() => this.classList.remove('rotating'), 1000);
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.1/chart.min.js';
    chartScript.onload = () => {
        updateBrandChart();
    };
    chartScript.onerror = () => {
        console.error('Failed to load Chart.js');
    };
    document.head.appendChild(chartScript);
});
