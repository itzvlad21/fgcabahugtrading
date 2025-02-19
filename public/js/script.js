document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });

    // Menu Button in Hero Section
    const menuButton = document.querySelector('.hero-content button');
    menuButton.addEventListener('click', () => {
        document.querySelector('#menu').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });

    // Reservation Form Handling
    const reservationForm = document.querySelector('.reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const reservationData = {};
            formData.forEach((value, key) => {
                reservationData[key] = value;
            });

            // Show confirmation message
            alert('Thank you for your reservation! We will contact you shortly to confirm.');
            this.reset();
        });
    }

    // Contact Form Handling
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                name: this.querySelector('#name').value,
                email: this.querySelector('#email').value,
                phone: this.querySelector('#phone').value,
                message: this.querySelector('#message').value
            };
    
            const submitBtn = this.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
    
            try {
                // Send to contact submissions endpoint
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
    
                const result = await response.json();
    
                if (result.success) {
                    submitBtn.textContent = 'Message Sent!';
                    submitBtn.style.backgroundColor = '#28a745';
                    this.reset();
                    
                    // Show success message to user
                    showNotification('Message sent successfully!', 'success');
                } else {
                    throw new Error(result.error || 'Failed to send message');
                }
    
            } catch (error) {
                console.error('Submission error:', error);
                submitBtn.textContent = 'Error - Try Again';
                submitBtn.style.backgroundColor = '#dc3545';
                showNotification('Failed to send message. Please try again.', 'error');
            }
    
            // Reset button after delay
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
                submitBtn.style.backgroundColor = '';
            }, 3000);
        });
    }

    // Scroll Animation
    const sections = document.querySelectorAll('section');
    const options = {
        root: null,
        threshold: 0.1,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, options);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Dynamic Year in Footer
    const yearSpan = document.querySelector('.footer-content p');
    if (yearSpan) {
        yearSpan.innerHTML = yearSpan.innerHTML.replace('2024', new Date().getFullYear());
    }

    // Menu Carousel
    const carousel = document.querySelector('.menu-carousel');
    if (carousel) {
        const prevBtn = carousel.querySelector('.prev');
        const nextBtn = carousel.querySelector('.next');
        const menuPages = carousel.querySelectorAll('.menu-page');
        let currentIndex = 0;

        function showPage(index) {
            menuPages.forEach((page, i) => {
                if (i === index) {
                    page.classList.remove('slide-out');
                    page.classList.add('active', 'slide-in');
                } else {
                    page.classList.remove('active', 'slide-in');
                    if (i === currentIndex) {
                        page.classList.add('slide-out');
                    }
                }
            });
            currentIndex = index;
        }

        function nextPage() {
            const nextIndex = (currentIndex + 1) % menuPages.length;
            showPage(nextIndex);
        }

        function prevPage() {
            const prevIndex = (currentIndex - 1 + menuPages.length) % menuPages.length;
            showPage(prevIndex);
        }

        nextBtn.addEventListener('click', nextPage);
        prevBtn.addEventListener('click', prevPage);

        // Optional: Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                prevPage();
            } else if (e.key === 'ArrowRight') {
                nextPage();
            }
        });

        // Optional: Add touch swipe support
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchEndX < touchStartX - 50) { // Swipe left
                nextPage();
            } else if (touchEndX > touchStartX + 50) { // Swipe right
                prevPage();
            }
        });
    }
});

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    const grid = document.querySelector('.recommendations-grid');
    const items = grid.innerHTML;
    
    // Duplicate items for seamless scroll
    grid.innerHTML = items + items;
    
    // Optional: Adjust scroll position on window resize
    window.addEventListener('resize', () => {
        const scrollWidth = grid.scrollWidth;
        if (grid.scrollLeft >= scrollWidth / 2) {
            grid.scrollLeft = 0;
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.menu-carousel');
    if (carousel) {
        const indicators = carousel.querySelectorAll('.indicator');
        let currentIndex = 0;

        // Update indicators
        function updateIndicators(index) {
            const indicators = document.querySelectorAll('.indicator');
            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
            });
        }

        // Add click events to indicators
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                showPage(index);
            });
        });

        // Update the existing showPage function
        function showPage(index) {
            const menuPages = carousel.querySelectorAll('.menu-page');
            menuPages.forEach((page, i) => {
                if (i === index) {
                    page.classList.remove('slide-out');
                    page.classList.add('active', 'slide-in');
                } else {
                    page.classList.remove('active', 'slide-in');
                    if (i === currentIndex) {
                        page.classList.add('slide-out');
                    }
                }
            });
            currentIndex = index;
            updateIndicators(index);
        }
    }
});

// About Us
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.about-slider');
    const dots = document.querySelectorAll('.about-page-dot');
    let currentSlide = 0;
    let startX;
    let currentX;
    let isDragging = false;

    // Touch events
    slider.addEventListener('touchstart', handleTouchStart);
    slider.addEventListener('touchmove', handleTouchMove);
    slider.addEventListener('touchend', handleTouchEnd);

    // Mouse events
    slider.addEventListener('mousedown', handleMouseDown);
    slider.addEventListener('mousemove', handleMouseMove);
    slider.addEventListener('mouseup', handleMouseUp);
    slider.addEventListener('mouseleave', handleMouseUp);

    // Pagination dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    function handleTouchStart(e) {
        startX = e.touches[0].clientX;
        isDragging = true;
        slider.style.transition = 'none';
    }

    function handleMouseDown(e) {
        startX = e.clientX;
        isDragging = true;
        slider.style.transition = 'none';
        slider.style.cursor = 'grabbing';
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diff = startX - currentX;
        const move = -(currentSlide * 33.333) - (diff / slider.offsetWidth * 100);
        slider.style.transform = `translateX(${move}%)`;
    }

    function handleMouseMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.clientX;
        const diff = startX - currentX;
        const move = -(currentSlide * 33.333) - (diff / slider.offsetWidth * 100);
        slider.style.transform = `translateX(${move}%)`;
    }

    function handleTouchEnd() {
        if (!isDragging) return;
        isDragging = false;
        slider.style.transition = 'transform 0.3s ease-out';
        
        const diff = startX - currentX;
        if (Math.abs(diff) > 50) { // Minimum drag distance
            if (diff > 0 && currentSlide < 2) {
                currentSlide++;
            } else if (diff < 0 && currentSlide > 0) {
                currentSlide--;
            }
        }
        goToSlide(currentSlide);
    }

    function handleMouseUp() {
        if (!isDragging) return;
        isDragging = false;
        slider.style.transition = 'transform 0.3s ease-out';
        slider.style.cursor = 'grab';
        
        if (currentX === undefined) return;
        
        const diff = startX - currentX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentSlide < 2) {
                currentSlide++;
            } else if (diff < 0 && currentSlide > 0) {
                currentSlide--;
            }
        }
        goToSlide(currentSlide);
    }

    function goToSlide(index) {
        currentSlide = index;
        slider.style.transform = `translateX(-${index * 33.333}%)`;
        updateDots();
    }

    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Navbar scroll handling
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > lastScroll && currentScroll > 100) {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
        lastScroll = currentScroll;
    });

    // Floating Action Button
    const fabMain = document.querySelector('.fab-main');
    const fabMenu = document.querySelector('.fab-menu');
    
    fabMain.addEventListener('click', () => {
        fabMenu.classList.toggle('active');
        fabMain.classList.toggle('active');
    });

    // Close FAB menu when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.fab-container')) {
            fabMenu.classList.remove('active');
            fabMain.classList.remove('active');
        }
    });

    // Handle FAB menu item clicks
    document.querySelectorAll('.fab-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(item.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                fabMenu.classList.remove('active');
                fabMain.classList.remove('active');
            }
        });
    });
});

/* staff scroll */
document.addEventListener('DOMContentLoaded', function() {
    const staffGrids = document.querySelectorAll('.staff-grid');
    
    function initializeScrolling(grid) {
        // Clone items for seamless scrolling
        const originalItems = grid.innerHTML;
        grid.innerHTML = originalItems + originalItems;
        
        // Set initial position based on direction
        const isReverse = grid.closest('.staff-scroll').classList.contains('reverse');
        if (isReverse) {
            grid.style.transform = 'translateX(calc(-100% / 2))';
        }
        
        // Start animation after a brief delay to ensure proper positioning
        setTimeout(() => {
            grid.style.animation = `${isReverse ? 'scrollRight' : 'scrollLeft'} 30s linear infinite`;
        }, 100);
        
        // Handle animation reset
        grid.addEventListener('animationend', () => {
            grid.style.animation = 'none';
            grid.offsetHeight; // Trigger reflow
            grid.style.animation = `${isReverse ? 'scrollRight' : 'scrollLeft'} 30s linear infinite`;
        });
        
        // Pause on hover
        const container = grid.closest('.staff-scroll');
        container.addEventListener('mouseenter', () => {
            grid.style.animationPlayState = 'paused';
        });
        
        container.addEventListener('mouseleave', () => {
            grid.style.animationPlayState = 'running';
        });
    }
    
    // Initialize all grids
    staffGrids.forEach(initializeScrolling);
    
    // Optional: Reset scroll position on window resize
    window.addEventListener('resize', () => {
        staffGrids.forEach(grid => {
            const isReverse = grid.closest('.staff-scroll').classList.contains('reverse');
            grid.style.transform = isReverse ? 
                'translateX(calc(-100% / 2))' : 
                'translateX(0)';
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.car-slider');
    const slides = document.querySelectorAll('.car-slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const indicatorsContainer = document.querySelector('.indicators-container');
    
    let currentIndex = 0;
    
    // Make first slide visible initially
    slides[0].classList.add('active');
    
    // Create indicators
    slides.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.classList.add('indicator');
        if (index === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(indicator);
    });
    
    const indicators = document.querySelectorAll('.indicator');
    
    function updateSlides() {
        slides.forEach((slide, index) => {
            slide.style.display = index === currentIndex ? 'block' : 'none';
            slide.classList.toggle('active', index === currentIndex);
            indicators[index].classList.toggle('active', index === currentIndex);
        });
    }
    
    // Initialize first slide
    updateSlides();
    
    function goToSlide(index) {
        currentIndex = index;
        updateSlides();
    }
    
    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlides();
    }
    
    function prevSlide() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlides();
    }
    
    // Event listeners
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
});

// Timeline Animation
document.addEventListener('DOMContentLoaded', function() {
    const timelineLine = document.querySelector('.timeline-line');
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target === timelineLine) {
                    entry.target.classList.add('animate');
                } else {
                    // Add a delay based on the item's position
                    const index = Array.from(timelineItems).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                    }, index * 500); // 500ms delay between each item
                }
            }
        });
    }, {
        threshold: 0.2
    });
    
    // First animate the line
    observer.observe(timelineLine);
    
    // Then observe each timeline item
    timelineItems.forEach(item => {
        observer.observe(item);
    });
});

// Add this to your script.js
document.addEventListener('DOMContentLoaded', function() {
    const timelineLine = document.querySelector('.timeline-line');
    const timelineSection = document.querySelector('.history-section');
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Remove old transition
    timelineLine.style.transition = 'none';

    function updateTimeline() {
        // Get timeline section boundaries
        const sectionRect = timelineSection.getBoundingClientRect();
        const sectionTop = sectionRect.top;
        const sectionHeight = sectionRect.height;
        const windowHeight = window.innerHeight;

        // Calculate how much of section is scrolled
        let scrollPercentage = 0;
        
        if (sectionTop <= windowHeight && sectionTop >= -sectionHeight) {
            // Calculate visible percentage
            scrollPercentage = Math.min(100, Math.max(0, 
                ((windowHeight - sectionTop) / (windowHeight + sectionHeight)) * 100
            ));
            
            // Update line height
            timelineLine.style.height = `${scrollPercentage}%`;
            
            // Animate timeline items
            timelineItems.forEach((item, index) => {
                const itemTop = item.getBoundingClientRect().top;
                if (itemTop < windowHeight * 0.8) {
                    item.classList.add('animate');
                } else {
                    item.classList.remove('animate');
                }
            });
        }
    }

    // Update on scroll
    window.addEventListener('scroll', () => {
        requestAnimationFrame(updateTimeline);
    });
    
    // Initial update
    updateTimeline();
});

/* filter */
document.addEventListener("DOMContentLoaded", function () {
    const filterButtons = document.querySelectorAll(".customize-selection-filter button");
    const productLists = document.querySelectorAll(".customize-selection-list");

    // Hide all product lists initially
    productLists.forEach(list => list.style.display = "none");

    // Set default active button (first one) and show its products
    if (filterButtons.length > 0) {
        filterButtons[0].classList.add("active");
        productLists[0].style.display = "flex";
    }

    filterButtons.forEach((button, index) => {
        button.addEventListener("click", function () {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove("active"));
            
            // Hide all product lists
            productLists.forEach(list => list.style.display = "none");
            
            // Add active class to the clicked button
            button.classList.add("active");
            
            // Show the corresponding product list
            productLists[index].style.display = "flex";
        });
    });
});

(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "30min", {origin:"https://cal.com"});

Cal.ns["30min"]("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
  
  // Important: Please add the following attributes to the element that should trigger the calendar to open upon clicking.
  // data-cal-link="vladimyr-9cyji1/30min"
  // data-cal-namespace="30min"
  // data-cal-config='{"layout":"month_view"}'

  Cal.ns["30min"]("ui", {"cssVarsPerTheme":{"light":{"cal-brand":"#004E1F"}},"hideEventTypeDetails":false,"layout":"month_view"});

  document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.close-modal');
    const staffItems = document.querySelectorAll('.staff-item img');
    
    // Open modal
    staffItems.forEach(img => {
        img.addEventListener('click', function() {
            modal.classList.add('show');
            modalImg.src = this.src;
            modalImg.classList.add('show');
            document.body.classList.add('modal-open');
            
            // Pause all staff-scroll animations
            document.querySelectorAll('.staff-scroll .staff-grid').forEach(grid => {
                grid.style.animationPlayState = 'paused';
            });
        });
    });
    
    // Close modal functions
    function closeModal() {
        modalImg.classList.remove('show');
        setTimeout(() => {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            
            // Resume all staff-scroll animations
            document.querySelectorAll('.staff-scroll .staff-grid').forEach(grid => {
                grid.style.animationPlayState = 'running';
            });
        }, 300);
    }
    
    // Close button click
    closeBtn.addEventListener('click', closeModal);
    
    // Click outside image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
});

// automatic underline
document.addEventListener('DOMContentLoaded', function() {
    // Get all sections that should be tracked
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    console.log('Found sections:', sections.length);
    console.log('Found nav links:', navLinks.length);

    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px',
        threshold: 0
    };

    function highlightNavigation(entries) {
        entries.forEach(entry => {
            console.log('Section intersecting:', entry.target.id, entry.isIntersecting);
            
            if (entry.isIntersecting) {
                // Remove active class from all links
                navLinks.forEach(link => link.classList.remove('active'));
                
                // Add active class to corresponding link
                const activeId = entry.target.id;
                const correspondingLink = document.querySelector(`.nav-links a[href="#${activeId}"]`);
                
                console.log('Active section:', activeId);
                console.log('Found corresponding link:', correspondingLink);
                
                if (correspondingLink) {
                    correspondingLink.classList.add('active');
                }
            }
        });
    }

    // Create the observer
    const observer = new IntersectionObserver(highlightNavigation, observerOptions);

    // Observe all sections
    sections.forEach(section => {
        console.log('Observing section:', section.id);
        observer.observe(section);
    });

    // Set initial active state
    function setInitialActive() {
        const scrollPosition = window.scrollY;
        console.log('Initial scroll position:', scrollPosition);
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            console.log('Section:', section.id, 'Top:', sectionTop, 'Height:', sectionHeight);
            
            if (scrollPosition >= sectionTop - window.innerHeight/2 && 
                scrollPosition < sectionTop + sectionHeight - window.innerHeight/2) {
                navLinks.forEach(link => link.classList.remove('active'));
                const correspondingLink = document.querySelector(`.nav-links a[href="#${section.id}"]`);
                if (correspondingLink) {
                    correspondingLink.classList.add('active');
                }
            }
        });
    }

    // Set initial state on page load
    setInitialActive();

    // Add scroll event listener for debugging
    window.addEventListener('scroll', () => {
        console.log('Current scroll position:', window.scrollY);
    });
});

function initImageComparison() {
    const container = document.querySelector('.image-comparison');
    const slider = document.querySelector('.comparison-slider');
    const tintedImage = document.querySelector('.comparison-image.tinted');
    
    if (!container || !slider || !tintedImage) {
        console.warn('Image comparison elements not found');
        return;
    }

    let isSliding = false;
    let startX;
    let sliderLeft;

    function updateSliderPosition(clientX) {
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerLeft = containerRect.left;
        
        // Calculate percentage
        let percentage = ((clientX - containerLeft) / containerWidth) * 100;
        percentage = Math.min(Math.max(percentage, 0), 100);
        
        // Update slider position
        slider.style.left = `${percentage}%`;
        
        // Update image clip path
        tintedImage.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
    }

    function startSliding(e) {
        isSliding = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        sliderLeft = slider.offsetLeft;
        
        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';
    }

    function stopSliding() {
        isSliding = false;
        document.body.style.userSelect = '';
    }

    function slide(e) {
        if (!isSliding) return;
        
        e.preventDefault();
        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        updateSliderPosition(currentX);
    }

    // Mouse events
    slider.addEventListener('mousedown', startSliding);
    document.addEventListener('mousemove', slide);
    document.addEventListener('mouseup', stopSliding);

    // Touch events
    slider.addEventListener('touchstart', startSliding);
    document.addEventListener('touchmove', slide, { passive: false });
    document.addEventListener('touchend', stopSliding);

    // Double click to reset
    container.addEventListener('dblclick', () => {
        slider.style.left = '50%';
        tintedImage.style.clipPath = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
    });

    // Window resize handling
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Reset to middle on resize
            slider.style.left = '50%';
            tintedImage.style.clipPath = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
        }, 250);
    });
}

// Add to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    initImageComparison();
});

document.addEventListener('DOMContentLoaded', function() {
    const colorPicker = document.getElementById('colorPicker');
    const colorDisplay = document.getElementById('colorDisplay');
    const colorValue = document.getElementById('colorValue');
    const redSlider = document.getElementById('redSlider');
    const greenSlider = document.getElementById('greenSlider');
    const blueSlider = document.getElementById('blueSlider');
    const redValue = document.getElementById('redValue');
    const greenValue = document.getElementById('greenValue');
    const blueValue = document.getElementById('blueValue');

    function updateColor(e) {
        const color = e.target.value;
        colorDisplay.style.backgroundColor = color;
        colorValue.textContent = color.toUpperCase();
        
        // Update RGB sliders
        const r = parseInt(color.substr(1,2), 16);
        const g = parseInt(color.substr(3,2), 16);
        const b = parseInt(color.substr(5,2), 16);
        
        redSlider.value = r;
        greenSlider.value = g;
        blueSlider.value = b;
        
        redValue.textContent = r;
        greenValue.textContent = g;
        blueValue.textContent = b;
    }

    function updateFromSliders() {
        const r = parseInt(redSlider.value);
        const g = parseInt(greenSlider.value);
        const b = parseInt(blueSlider.value);
        
        const color = '#' + 
            r.toString(16).padStart(2, '0') + 
            g.toString(16).padStart(2, '0') + 
            b.toString(16).padStart(2, '0');
        
        colorPicker.value = color;
        colorDisplay.style.backgroundColor = color;
        colorValue.textContent = color.toUpperCase();
        
        redValue.textContent = r;
        greenValue.textContent = g;
        blueValue.textContent = b;
    }

    colorPicker.addEventListener('input', updateColor);
    redSlider.addEventListener('input', updateFromSliders);
    greenSlider.addEventListener('input', updateFromSliders);
    blueSlider.addEventListener('input', updateFromSliders);

    // Initial color update
    updateColor({ target: colorPicker });
});

document.addEventListener('DOMContentLoaded', function() {
    const brandButtons = document.querySelectorAll('.brand-button');
    const brandSections = document.querySelectorAll('.brand-section');

    brandButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and sections
            brandButtons.forEach(btn => btn.classList.remove('active'));
            brandSections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked button and corresponding section
            button.classList.add('active');
            const brandId = button.dataset.brand;
            document.getElementById(brandId).classList.add('active');
        });
    });
});

// Load reviews into staff showcase
async function loadShowcaseReviews() {
    try {
        const response = await fetch('/api/reviews');
        const reviews = await response.json();
        
        // Get the reviews grid
        const reviewsGrid = document.querySelector('.staff-scroll .reviews-grid');
        if (!reviewsGrid) return;

        // Take only the first 6 reviews
        const showcaseReviews = reviews.slice(0, 6);
        
        // Clear existing content
        reviewsGrid.innerHTML = '';

        // Add reviews
        showcaseReviews.forEach(review => {
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            
            const reviewCard = document.createElement('div');
            reviewCard.className = 'staff-item review-card';
            reviewCard.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${review.name}</span>
                    <span class="service-tag">${review.serviceType}</span>
                </div>
                <div class="review-stars">${stars}</div>
                <p class="review-text">"${review.review}"</p>
                <span class="review-date">${formatReviewDate(review.date)}</span>
            `;
            
            reviewsGrid.appendChild(reviewCard);
        });

        // Clone reviews for infinite scroll if needed
        const reviews2 = reviewsGrid.cloneNode(true);
        reviewsGrid.appendChild(reviews2.children[0]);

    } catch (error) {
        console.error('Error loading showcase reviews:', error);
    }
}

// Format date helper
function formatReviewDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

// Call this when the document loads
document.addEventListener('DOMContentLoaded', function() {
    // ... existing DOMContentLoaded code ...
    loadShowcaseReviews();
});