document.addEventListener('DOMContentLoaded', function() {
    // Star Rating System
    const stars = document.querySelectorAll('.stars i');
    const ratingInput = document.getElementById('rating');
    let currentRating = 0;

    stars.forEach(star => {
        // Hover effect
        star.addEventListener('mouseover', function() {
            const rating = this.dataset.rating;
            highlightStars(rating);
        });

        // Click handler
        star.addEventListener('click', function() {
            currentRating = this.dataset.rating;
            ratingInput.value = currentRating;
            highlightStars(currentRating);
        });
    });

    // Reset stars when mouse leaves container
    document.querySelector('.stars').addEventListener('mouseleave', function() {
        highlightStars(currentRating);
    });

    function highlightStars(rating) {
        stars.forEach(star => {
            const starRating = star.dataset.rating;
            if (starRating <= rating) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
    }

    // Form Submission
    const reviewForm = document.getElementById('reviewForm');
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted'); // Debug log
    
        // Validate form
        if (!validateForm()) {
            console.log('Form validation failed'); // Debug log
            return;
        }
    
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
    
        try {
            const formData = {
                rating: ratingInput.value,
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                serviceType: document.getElementById('serviceType').value,
                review: document.getElementById('review').value,
                date: new Date().toISOString()
            };
            
            console.log('Sending data:', formData); // Debug log
    
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
    
            const result = await response.json();
            console.log('Server response:', result); // Debug log
    
            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit review');
            }
    
            // Success handling
            showNotification('Review submitted successfully!', 'success');
            reviewForm.reset();
            currentRating = 0;
            highlightStars(0);
    
        } catch (error) {
            console.error('Submission error:', error); // Detailed error log
            showNotification(error.message || 'Failed to submit review. Please try again.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Review';
        }
    });

    function validateForm() {
        if (!currentRating) {
            showNotification('Please select a rating', 'error');
            return false;
        }

        const requiredFields = ['name', 'email', 'serviceType', 'review'];
        for (const field of requiredFields) {
            const element = document.getElementById(field);
            if (!element.value.trim()) {
                showNotification(`Please fill in your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
                element.focus();
                return false;
            }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(document.getElementById('email').value)) {
            showNotification('Please enter a valid email address', 'error');
            document.getElementById('email').focus();
            return false;
        }

        return true;
    }

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

    async function loadNewReviews() {
        try {
            const response = await fetch('/api/reviews');
            const reviews = await response.json();
            
            const reviewsGrid = document.querySelector('.reviews-grid');
            reviewsGrid.innerHTML = ''; // Clear existing reviews

            reviews.forEach(review => {
                const reviewCard = createReviewCard(review);
                reviewsGrid.insertBefore(reviewCard, reviewsGrid.firstChild);
            });
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    function generateStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>'; // Filled star
            } else {
                stars += '<i class="far fa-star"></i>'; // Empty star
            }
        }
        return stars;
    }
    

    function createReviewCard(review) {
        const card = document.createElement('div');
        card.className = 'review-card';
        
        card.innerHTML = `
            <div class="review-header">
                <div class="reviewer-info">
                    <h3>${review.name}</h3>
                    <div class="review-stars">
                        ${generateStarRating(review.rating)}
                    </div>
                </div>
                <span class="service-tag">${review.serviceType}</span>
            </div>
            <p class="review-text">"${review.review}"</p>
            <span class="review-date">${formatDate(review.date)}</span>
        `;
    
        return card;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Initial load of reviews
    loadNewReviews();

    // Mobile menu handling
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
});

function filterReviewsByStar() {
    const starFilter = document.getElementById('starFilter');
    const selectedStars = starFilter.value;
    const reviewCards = document.querySelectorAll('.review-card');

    reviewCards.forEach(card => {
        // Count the number of filled star icons
        const starCount = card.querySelectorAll('.review-stars .fas').length;
        
        // Show/hide based on filter
        if (selectedStars === '' || starCount === parseInt(selectedStars)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Add event listener to star filter dropdown
document.addEventListener('DOMContentLoaded', function() {
    const starFilter = document.getElementById('starFilter');
    if (starFilter) {
        starFilter.addEventListener('change', filterReviewsByStar);
    }
});
