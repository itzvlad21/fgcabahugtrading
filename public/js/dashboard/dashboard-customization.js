async function deleteReview(reviewId) {
    // Confirm deletion
    const confirmed = confirm('Are you sure you want to delete this review?');
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Reload reviews after successful deletion
            loadReviews();
            showNotification('Review deleted successfully', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to delete review', 'error');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        showNotification('Failed to delete review', 'error');
    }
}

async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        const reviews = await response.json();
        
        const tbody = document.getElementById('reviewsTableBody');
        if (!tbody) return;

        function generateStarRating(rating) {
            return Array(5).fill().map((_, i) => 
                `<i class="${i < rating ? 'fas' : 'far'} fa-star"></i>`
            ).join('');
        }

        function getServiceTypeBadgeClass(type) {
            return `service-type-badge ${type.toLowerCase()}`;
        }

        tbody.innerHTML = reviews.map((review, index) => `
            <tr>
                <td>${review.name}</td>
                <td>
                    <div class="star-rating">
                        ${generateStarRating(review.rating)}
                    </div>
                </td>
                <td>
                    <span class="${getServiceTypeBadgeClass(review.serviceType)}">
                        ${review.serviceType}
                    </span>
                </td>
                <td>
                    <div class="review-text" title="${review.review}">
                        ${review.review}
                    </div>
                </td>
                <td>
                    <span class="review-date">
                        ${new Date(review.date).toLocaleDateString()}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn delete-btn" onclick="deleteReview('${review.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add filter functionality
        const ratingFilter = document.getElementById('ratingFilter');
        const searchInput = document.getElementById('reviewSearch');

        function filterReviews() {
            const rating = ratingFilter.value;
            const searchTerm = searchInput.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                const stars = row.querySelector('.star-rating').querySelectorAll('.fas').length;
                const matchesRating = !rating || stars === parseInt(rating);
                const matchesSearch = text.includes(searchTerm);

                row.style.display = matchesRating && matchesSearch ? '' : 'none';
            });
        }

        ratingFilter.addEventListener('change', filterReviews);
        searchInput.addEventListener('input', filterReviews);

    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Utility function for showing notifications (if not already defined)
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