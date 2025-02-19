document.addEventListener('DOMContentLoaded', function() {
    // Show popup after 5 seconds
    setTimeout(() => {
        const popup = document.getElementById('adPopup');
        if (popup) {
            popup.classList.add('show');
        }
    }, 5000);

    // Close popup on close button click
    const closeBtn = document.querySelector('.ad-popup-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('adPopup').classList.remove('show');
        });
    }

    // Close popup when clicking outside
    document.getElementById('adPopup').addEventListener('click', (e) => {
        if (e.target.id === 'adPopup') {
            e.target.classList.remove('show');
        }
    });

    // Close popup when clicking Book Now button
    const bookBtn = document.querySelector('.ad-popup-book');
    if (bookBtn) {
        bookBtn.addEventListener('click', () => {
            document.getElementById('adPopup').classList.remove('show');
        });
    }
});