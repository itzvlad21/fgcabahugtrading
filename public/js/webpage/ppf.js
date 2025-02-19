document.addEventListener('DOMContentLoaded', function() {
    // Content data for different customer types
    const benefitsData = {
        luxury: {
            title: "Premium Protection for Luxury Vehicles",
            subtitle: "Preserve your investment with top-tier protection",
            benefits: [
                {
                    icon: "fa-shield-alt",
                    title: "Premium Protection",
                    description: "Guards against paint damage, maintaining your car's pristine look"
                },
                {
                    icon: "fa-eye-slash",
                    title: "Invisible Shield",
                    description: "Undetectable protection that maintains your car's original appearance"
                },
                {
                    icon: "fa-magic",
                    title: "Self-Healing",
                    description: "Minor scratches disappear automatically, keeping your car flawless"
                },
                {
                    icon: "fa-chart-line",
                    title: "Preserves Value",
                    description: "Maintains your vehicle's value with long-lasting protection"
                }
            ],
            ctaText: "Schedule Your Premium Protection Consultation"
        },
        budget: {
            title: "Smart Protection for Value-Conscious Owners",
            subtitle: "Affordable protection that saves you money long-term",
            benefits: [
                {
                    icon: "fa-piggy-bank",
                    title: "Affordable Protection",
                    description: "Save money on future repairs and paint jobs"
                },
                {
                    icon: "fa-shield-alt",
                    title: "Prevents Damage",
                    description: "Shields against scratches, rock chips, and stains"
                },
                {
                    icon: "fa-clock",
                    title: "Long-Lasting",
                    description: "One-time application lasts 5-10 years"
                },
                {
                    icon: "fa-coins",
                    title: "Better Resale",
                    description: "Maintain higher resale value for your vehicle"
                }
            ],
            ctaText: "Get Your Value Protection Quote"
        },
        enthusiast: {
            title: "Performance Protection for Enthusiasts",
            subtitle: "Customizable protection for those who love their cars",
            benefits: [
                {
                    icon: "fa-tachometer-alt",
                    title: "Enhanced Durability",
                    description: "Perfect for high-performance driving and track days"
                },
                {
                    icon: "fa-sliders-h",
                    title: "Customizable Coverage",
                    description: "Choose protection zones based on your driving style"
                },
                {
                    icon: "fa-car",
                    title: "Clear Protection",
                    description: "Maintain your car's aggressive look while keeping it protected"
                },
                {
                    icon: "fa-magic",
                    title: "Self-Healing",
                    description: "Active protection against minor scratches and swirls"
                }
            ],
            ctaText: "Design Your Custom Protection Package"
        }
    };

    // Get DOM elements
    const typeCards = document.querySelectorAll('.type-card');
    const benefitsDisplay = document.querySelector('.benefits-display');
    const ctaButton = document.querySelector('.cta-button');
    const proceedButton = document.querySelector('.proceed-button');
    const openerSection = document.querySelector('.interactive-opener');
    const guideSection = document.querySelector('.ppf-guide-section');

    // Section transition handling
    proceedButton?.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Slide out opener
        openerSection.classList.add('slide-out');
        
        // Show guide section
        setTimeout(() => {
            openerSection.style.display = 'none';
            guideSection.style.display = 'block';
            // Force reflow
            guideSection.offsetHeight;
            guideSection.classList.add('active');
        }, 800);
    });

    // Function to update benefits display
    function updateBenefits(type) {
        const data = benefitsData[type];
        if (!data) return;

        // Create benefits HTML
        const benefitsHTML = `
            <h3 class="benefits-title">${data.title}</h3>
            <p class="benefits-subtitle">${data.subtitle}</p>
            <div class="benefits-list">
                ${data.benefits.map(benefit => `
                    <div class="benefit-item">
                        <i class="fas ${benefit.icon}"></i>
                        <div class="benefit-content">
                            <h4>${benefit.title}</h4>
                            <p>${benefit.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Update display with animation
        benefitsDisplay.style.opacity = '0';
        setTimeout(() => {
            benefitsDisplay.innerHTML = benefitsHTML;
            benefitsDisplay.style.opacity = '1';
        }, 300);

        // Update CTA button
        ctaButton.textContent = data.ctaText;
    }

    // Set initial benefits display content
    benefitsDisplay.innerHTML = `
        <h3 class="benefits-title">Choose your vehicle category above</h3>
        <p class="benefits-subtitle">Get personalized protection recommendations</p>
    `;

    // Add click handlers to type cards
    typeCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove active class from all cards
            typeCards.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked card
            card.classList.add('active');
            
            // Update benefits based on selected type
            const type = card.dataset.type;
            updateBenefits(type);

            // Smooth scroll to benefits
            benefitsDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // Add scroll animation for benefits
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    observer.observe(benefitsDisplay);
});

document.addEventListener('DOMContentLoaded', function() {
    const messageBoxes = document.querySelectorAll('.message-box');
    const responseButtons = document.querySelectorAll('.response-button');

    // Show initial message
    setTimeout(() => {
        document.querySelector('.initial-message').classList.add('show');
    }, 500);

    // Handle response button clicks
    responseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const nextMessage = this.dataset.next + '-message';
            const currentBox = this.closest('.message-box');
            const nextBox = document.querySelector('.' + nextMessage);

            // Hide current message
            currentBox.style.opacity = '0';
            currentBox.style.transform = 'translateY(-20px)';

            // Show next message
            setTimeout(() => {
                currentBox.style.display = 'none';
                nextBox.style.display = 'block';
                setTimeout(() => {
                    nextBox.classList.add('show');
                }, 50);
            }, 500);
        });
    });
});
