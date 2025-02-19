const filterState = {
    brandSearch: '',
    typeFilter: '',
    productSearch: '',
    brandFilter: ''
};

const productFilterState = {
    searchTerm: '',
    brandFilter: ''
};


// dashboard-products.js
function initializeTableFilters() {
    // Check if filters already exist
    const existingBrandFilters = document.querySelector('.brands-filters');
    const existingProductFilters = document.querySelector('.products-filters');
    
    // If filters exist, don't create new ones
    if (existingBrandFilters || existingProductFilters) {
        return;
    }
 
    // Brand table filters
    const brandSearch = document.createElement('input');
    brandSearch.type = 'text';
    brandSearch.placeholder = 'Search brands...';
    brandSearch.className = 'table-search';
    
    const typeFilter = document.createElement('select');
    typeFilter.className = 'table-filter';
    typeFilter.innerHTML = `
        <option value="">All Types</option>
        <option value="tint">Tint</option>
        <option value="ppf">PPF</option>
    `;
 
    // Product table filters
    const productSearch = document.createElement('input');
    productSearch.type = 'text';
    productSearch.placeholder = 'Search products...';
    productSearch.className = 'table-search';
    
    const brandFilter = document.createElement('select');
    brandFilter.className = 'table-filter';
    brandFilter.innerHTML = '<option value="">All Brands</option>';
 
    // Add filter containers with unique classes
    const brandFiltersContainer = document.createElement('div');
    brandFiltersContainer.className = 'table-filters brands-filters';
    brandFiltersContainer.appendChild(brandSearch);
    brandFiltersContainer.appendChild(typeFilter);
 
    const productFiltersContainer = document.createElement('div');
    productFiltersContainer.className = 'table-filters products-filters';
    productFiltersContainer.appendChild(productSearch);
    productFiltersContainer.appendChild(brandFilter);
 
    // Insert filters before tables
    const brandsTable = document.querySelector('.brands-table-container');
    const productsTable = document.querySelector('.products-table-container');
 
    if (brandsTable) {
        brandsTable.insertAdjacentElement('beforebegin', brandFiltersContainer);
    }
    if (productsTable) {
        productsTable.insertAdjacentElement('beforebegin', productFiltersContainer);
    }
 
    // Event listeners for brand filters
    brandSearch.addEventListener('input', filterBrandsTable);
    typeFilter.addEventListener('change', filterBrandsTable);
 
    // Event listeners for product filters
    productSearch.addEventListener('input', filterProductsTable);
    brandFilter.addEventListener('change', filterProductsTable);
 
    // Load brand options for product filter
    loadBrandOptions(brandFilter);
 
    return {
        brandSearch,
        typeFilter,
        productSearch,
        brandFilter
    };
 }
 
 function initializeProductFilters() {
    const productSearch = document.querySelector('.products-filters .table-search');
    const brandFilter = document.querySelector('.products-filters .table-filter');

    if (!productSearch || !brandFilter) return;

    // Initial brand population
    loadBrandOptions(brandFilter);

    // Add event listeners with debounce
    productSearch.addEventListener('input', debounce(filterProductsTable, 300));
    brandFilter.addEventListener('change', debounce(filterProductsTable, 300));
}

async function loadBrandOptions(brandFilter) {
    try {
        const response = await fetch('/api/brands');
        const brands = await response.json();
        
        const options = brands.map(brand => 
            `<option value="${brand.name.toLowerCase()}">${brand.name}</option>`
        ).join('');
        
        brandFilter.innerHTML = '<option value="">All Brands</option>' + options;
    } catch (error) {
        console.error('Error loading brand options:', error);
    }
}


 function filterBrandsTable() {
    const searchInput = document.querySelector('.brands-filters .table-search');
    const typeFilter = document.querySelector('.brands-filters .table-filter');
    
    if (!searchInput || !typeFilter) {
        console.warn('Filter elements not found');
        return;
    }

    filterState.brandSearch = searchInput.value.toLowerCase().trim();
    filterState.typeFilter = typeFilter.value.toLowerCase().trim();

    // Reset pagination to first page when filter changes
    window.paginationState.brands.currentPage = 1;

    // Fetch and filter all brands
    fetch('/api/brands')
        .then(response => response.json())
        .then(brands => {
            // Apply filters to full dataset
            const filteredBrands = brands.filter(brand => {
                const nameMatch = brand.name.toLowerCase().includes(filterState.brandSearch);
                const typeMatch = !filterState.typeFilter || brand.type.toLowerCase() === filterState.typeFilter;
                return nameMatch && typeMatch;
            });

            // Update pagination state with filtered results
            window.paginationState.brands.totalItems = filteredBrands.length;
            window.paginationState.brands.totalPages = Math.ceil(
                filteredBrands.length / window.paginationState.brands.itemsPerPage
            );

            // Get current page items
            const startIndex = (window.paginationState.brands.currentPage - 1) * 
                              window.paginationState.brands.itemsPerPage;
            const endIndex = startIndex + window.paginationState.brands.itemsPerPage;
            const currentPageBrands = filteredBrands.slice(startIndex, endIndex);

            updateBrandsTable(currentPageBrands);
            updatePagination('brands', window.paginationState.brands);
        })
        .catch(error => console.error('Error filtering brands:', error));
}

function updateBrandsTable(brands) {
    const brandsTableBody = document.getElementById('brandsTableBody');
    brandsTableBody.innerHTML = brands.map(brand => `
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
}

// Add debounce to prevent too many API calls
const debouncedFilterBrands = debounce(filterBrandsTable, 300);

// Update event listeners
document.querySelector('.brands-filters .table-search')?.addEventListener('input', debouncedFilterBrands);
document.querySelector('.brands-filters .table-filter')?.addEventListener('change', debouncedFilterBrands);

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
function filterProductsTable() {
    const productSearch = document.querySelector('.products-filters .table-search');
    const brandFilter = document.querySelector('.products-filters .table-filter');

    // Update global filter state
    productFilterState.searchTerm = productSearch.value.toLowerCase().trim();
    productFilterState.brandFilter = brandFilter.value.toLowerCase().trim();

    // Reset pagination
    window.paginationState.products.currentPage = 1;

    // Reload products with current filters
    loadAllProducts();
}

async function applyProductsFilter(searchTerm, selectedBrand) {
    try {
        // Fetch all brands to get their products
        const response = await fetch('/api/brands');
        const brands = await response.json();
        
        // Fetch all products for each brand
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
        const allProducts = productsArrays.flat();

        // Apply filters to full dataset
        const filteredProducts = allProducts.filter(product => {
            const nameMatch = product.name.toLowerCase().includes(searchTerm);
            const brandMatch = !selectedBrand || product.brandName.toLowerCase() === selectedBrand;
            return nameMatch && brandMatch;
        });

        // Update pagination state with filtered results
        window.paginationState.products.totalItems = filteredProducts.length;
        window.paginationState.products.totalPages = Math.ceil(
            filteredProducts.length / window.paginationState.products.itemsPerPage
        );

        // Get current page items
        const startIndex = (window.paginationState.products.currentPage - 1) * 
                          window.paginationState.products.itemsPerPage;
        const endIndex = startIndex + window.paginationState.products.itemsPerPage;
        const currentPageProducts = filteredProducts.slice(startIndex, endIndex);

        // Update table with filtered and paginated results
        const productsTableBody = document.getElementById('productsTableBody');
        productsTableBody.innerHTML = currentPageProducts.map(product => `
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

        // Update pagination UI
        updatePagination('products', window.paginationState.products);

    } catch (error) {
        console.error('Error filtering products:', error);
    }
}

// Add debounce to prevent too many API calls
const debouncedFilterProducts = debounce(filterProductsTable, 300);

// Update event listeners
document.querySelector('.products-filters .table-search')?.addEventListener('input', debouncedFilterProducts);
document.querySelector('.products-filters .table-filter')?.addEventListener('change', debouncedFilterProducts);


async function applyBrandsFilter(searchTerm, selectedType) {
    try {
        const response = await fetch('/api/brands');
        const brands = await response.json();

        // Apply filters to full dataset
        const filteredBrands = brands.filter(brand => {
            const nameMatch = brand.name.toLowerCase().includes(searchTerm);
            const typeMatch = !selectedType || brand.type.toLowerCase() === selectedType;
            return nameMatch && typeMatch;
        });

        // Update pagination state with filtered results
        window.paginationState.brands.totalItems = filteredBrands.length;
        window.paginationState.brands.totalPages = Math.ceil(
            filteredBrands.length / window.paginationState.brands.itemsPerPage
        );

        // Get current page items
        const startIndex = (window.paginationState.brands.currentPage - 1) * 
                          window.paginationState.brands.itemsPerPage;
        const endIndex = startIndex + window.paginationState.brands.itemsPerPage;
        const currentPageBrands = filteredBrands.slice(startIndex, endIndex);

        // Update table with filtered and paginated results
        const brandsTableBody = document.getElementById('brandsTableBody');
        brandsTableBody.innerHTML = currentPageBrands.map(brand => `
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

        // Update pagination UI
        updatePagination('brands', window.paginationState.brands);

    } catch (error) {
        console.error('Error filtering brands:', error);
    }
}
