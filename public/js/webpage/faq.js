document.addEventListener('DOMContentLoaded', function() {
    const faqContainer = document.getElementById('faqContainer');
    const searchInput = document.getElementById('faqSearch');
    
    // Load FAQ data
    async function loadFAQs() {
        try {
            const response = await fetch('/api/faq');
            const faqData = await response.json();
            
            renderFAQs(faqData);
        } catch (error) {
            console.error('Error loading FAQs:', error);
            faqContainer.innerHTML = `
                <div class="error-message">
                    Failed to load FAQ content. Please try again later.
                </div>
            `;
        }
    }

    // Render FAQ content
    function renderFAQs(categories) {
        faqContainer.innerHTML = categories.map(category => `
            <div class="faq-category">
                <h2 class="category-title">${category.name}</h2>
                ${category.questions.map(q => `
                    <div class="faq-item">
                        <div class="faq-question">
                            <span>${q.question}</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <div class="faq-answer-content">
                                ${q.answer}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');

        // Reinitialize accordion functionality
        initializeAccordions();
    }

    // Search functionality
    function initializeSearch() {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const faqItems = document.querySelectorAll('.faq-item');
            
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question span').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer-content').textContent.toLowerCase();
                const matches = question.includes(searchTerm) || answer.includes(searchTerm);
                
                item.style.display = matches ? 'block' : 'none';
            });

            // Show/hide categories based on visible questions
            document.querySelectorAll('.faq-category').forEach(category => {
                const hasVisibleQuestions = [...category.querySelectorAll('.faq-item')]
                    .some(item => item.style.display !== 'none');
                category.style.display = hasVisibleQuestions ? 'block' : 'none';
            });
        });
    }

    // Accordion functionality
    function initializeAccordions() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const isOpen = question.classList.contains('active');
                
                // Close all other answers
                faqQuestions.forEach(q => {
                    if (q !== question) {
                        q.classList.remove('active');
                        q.nextElementSibling.style.maxHeight = '0';
                    }
                });
                
                // Toggle current answer
                question.classList.toggle('active');
                if (!isOpen) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = '0';
                }
            });
        });
    }

    // Initialize
    loadFAQs();
    initializeSearch();
});