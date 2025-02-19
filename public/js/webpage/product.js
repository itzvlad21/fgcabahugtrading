let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function () {
    // Load brands and products
    loadBrands();

    // Car preview functionality
    const carSelect = document.querySelector('.car-select');
    const carPreviewImg = document.querySelector('.car-preview img');
    const tintLayer = document.querySelector('.tint-layer');

    const carImages = {
        'small': 'img/Car_customize/small_car.png',
        'medium': 'img/Car_customize/medium_car.png',
        'large': 'img/Car_customize/large_car.png'
    };

    carSelect.addEventListener('change', function () {
        const selectedSize = this.value;
        if (selectedSize && carImages[selectedSize]) {
            carPreviewImg.src = carImages[selectedSize];
            carPreviewImg.alt = `${selectedSize} Car Preview`;
        }
    });
});

// Load and display brands
async function loadBrands() {
    try {
        const response = await fetch('/api/brands');
        const brands = await response.json();
        
        // Filter brands based on selected type
        const filteredBrands = currentFilter === 'all' ? 
            brands : 
            brands.filter(brand => brand.type.toLowerCase() === currentFilter);
        
        // Update brand buttons
        const brandButtons = document.getElementById('brandButtons');
        brandButtons.innerHTML = filteredBrands.map(brand => `
            <button class="brand-button" data-brand="${brand.id}">
                ${brand.name}
            </button>
        `).join('');

        // Add click handlers
        brandButtons.querySelectorAll('.brand-button').forEach(button => {
            button.addEventListener('click', () => {
                brandButtons.querySelectorAll('.brand-button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                loadBrandProducts(button.dataset.brand);
            });
        });

        // Set first brand as active and load its products
        if (filteredBrands.length > 0) {
            const firstButton = brandButtons.querySelector('.brand-button');
            firstButton.classList.add('active');
            loadBrandProducts(filteredBrands[0].id);
        } else {
            // Show empty state if no brands match filter
            document.getElementById('productsDisplay').innerHTML = `
                <div class="empty-state">
                    <p>No ${currentFilter !== 'all' ? currentFilter.toUpperCase() : ''} brands found</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading brands:', error);
    }
}

// Load and display brand products
async function loadBrandProducts(brandId) {
    try {
        const response = await fetch(`/api/brands/${brandId}/products`);
        const {brand, products} = await response.json();
        
        // Filter products based on brand type and current filter
        const filteredProducts = currentFilter === 'all' ? 
            products : 
            products.filter(() => brand.type.toLowerCase() === currentFilter);
            
        const productsDisplay = document.getElementById('productsDisplay');
        productsDisplay.innerHTML = `
            <div class="brand-section active" style="background: #1a1a1a; color: white; padding: 2rem; border-radius: 8px;">
                <div class="brand-header">
                    <h2 style="font-size: 2.5rem; margin-bottom: 0.5rem;">${brand.name}</h2>
                    <p style="color: #999; margin-bottom: 0.5rem;">${brand.description || ''}</p>
                    <p style="color: #666; font-size: 0.9rem;">Type: ${brand.type}</p>
                </div>
                
                <div class="products-grid" style="margin-top: 2rem;">
                    ${filteredProducts.map(product => `
                        <div class="product-card" style="background: #333; padding: 1.5rem; border-radius: 8px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                            <div class="product-info" style="flex: 1;">
                                <h3 style="color: white; font-size: 1.2rem; margin-bottom: 0.25rem;">${product.name}</h3>
                                <p style="color: #999; font-size: 0.9rem;">${product.description || ''}</p>
                            </div>
                            <div class="product-image" style="margin-left: 2rem;">
                                ${brand.logo ? 
                                    `<img src="/uploads/brands/${brand.logo}" alt="${product.name}" style="width: 100px; height: 100px; object-fit: contain; border-radius: 4px;">` :
                                    `<div style="width: 100px; height: 100px; background: #444; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-image" style="color: #666; font-size: 2rem;"></i>
                                    </div>`
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Add filter buttons event listeners
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update filter and reload brands
            currentFilter = btn.dataset.filter;
            loadBrands();
        });
    });

    // Initial load
    loadBrands();
});
document.addEventListener('DOMContentLoaded', function () {
    const brandNav = document.querySelector('.brand-nav');
    const brandButtons = document.querySelector('.brand-buttons');

    // Add scroll indicator element
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'scroll-indicator';
    scrollIndicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
    brandNav.appendChild(scrollIndicator);

    // Mouse drag scrolling variables
    let isDown = false;
    let startX;
    let scrollLeft;

    // Mouse drag event listeners
    brandButtons.addEventListener('mousedown', (e) => {
        isDown = true;
        brandButtons.classList.add('grabbing');
        startX = e.pageX - brandButtons.offsetLeft;
        scrollLeft = brandButtons.scrollLeft;
        e.preventDefault(); // Prevent text selection
    });

    brandButtons.addEventListener('mouseleave', () => {
        isDown = false;
        brandButtons.classList.remove('grabbing');
    });

    brandButtons.addEventListener('mouseup', () => {
        isDown = false;
        brandButtons.classList.remove('grabbing');
    });

    brandButtons.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - brandButtons.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
        brandButtons.scrollLeft = scrollLeft - walk;
    });

    // Check if scrolling is needed
    function checkScroll() {
        if (brandButtons.scrollWidth > brandButtons.clientWidth) {
            brandNav.classList.add('has-scroll');
        } else {
            brandNav.classList.remove('has-scroll');
        }
    }

    // Initial check
    checkScroll();

    // Check on resize
    window.addEventListener('resize', checkScroll);

    // Hide scroll indicator when reached end
    brandButtons.addEventListener('scroll', () => {
        const isAtEnd = brandButtons.scrollLeft + brandButtons.clientWidth >= brandButtons.scrollWidth - 10;
        if (isAtEnd) {
            brandNav.classList.remove('has-scroll');
        } else {
            brandNav.classList.add('has-scroll');
        }
    });

    // Handle touch scrolling
    let isScrolling;
    brandButtons.addEventListener('scroll', () => {
        window.clearTimeout(isScrolling);

        isScrolling = setTimeout(() => {
            const isAtEnd = brandButtons.scrollLeft + brandButtons.clientWidth >= brandButtons.scrollWidth - 10;
            if (isAtEnd) {
                brandNav.classList.remove('has-scroll');
            }
        }, 66);
    });
});