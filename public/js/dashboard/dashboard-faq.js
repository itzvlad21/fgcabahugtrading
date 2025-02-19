// FAQ Management in Dashboard
function loadFAQManagement() {
    const container = document.getElementById('faqManagementContainer');
    
    fetch('/api/faq')
        .then(response => response.json())
        .then(categories => {
            container.innerHTML = categories.map(category => `
                <div class="faq-category" data-id="${category.id}">
                    <div class="category-header">
                        <h3 class="category-title">${category.name}</h3>
                        <div class="category-actions">
                            <button class="action-btn" onclick="showAddQuestionModal(${category.id})">
                                <i class="fas fa-plus"></i> Add Question
                            </button>
                            <button class="action-btn edit-btn" onclick="editCategory(${category.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="deleteCategory(${category.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="questions-list">
                        ${category.questions.map(q => `
                            <div class="faq-question-item" data-id="${q.id}">
                                <div class="question-content">
                                    <h4 class="question-title">${q.question}</h4>
                                    <p class="question-answer">${q.answer}</p>
                                </div>
                                <div class="question-actions">
                                    <button class="action-btn edit-btn" onclick="editQuestion(${q.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete-btn" onclick="deleteQuestion(${q.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('Error loading FAQ management:', error);
            container.innerHTML = '<div class="error-message">Failed to load FAQ management.</div>';
        });
}

// Show add category modal
function showAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    modal.style.display = 'block';
}

// Show add question modal
function showAddQuestionModal(categoryId) {
    const modal = document.getElementById('addQuestionModal');
    document.getElementById('questionCategoryId').value = categoryId;
    modal.style.display = 'block';
}

// Edit category
async function editCategory(id) {
    try {
        const category = document.querySelector(`.faq-category[data-id="${id}"] .category-title`);
        const modal = document.getElementById('editCategoryModal');
        const nameInput = document.getElementById('editCategoryName');
        const idInput = document.getElementById('editCategoryId');
        
        nameInput.value = category.textContent;
        idInput.value = id;
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error preparing category edit:', error);
        alert('Failed to prepare category edit');
    }
}

// Delete category
async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category and all its questions?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/faq/categories/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadFAQManagement();
        } else {
            throw new Error('Failed to delete category');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete category');
    }
}

// Edit question
async function editQuestion(id) {
    try {
        const questionEl = document.querySelector(`.faq-question-item[data-id="${id}"]`);
        const modal = document.getElementById('editQuestionModal');
        const questionInput = document.getElementById('editQuestionText');
        const answerInput = document.getElementById('editQuestionAnswer');
        const idInput = document.getElementById('editQuestionId');
        
        questionInput.value = questionEl.querySelector('.question-title').textContent;
        answerInput.value = questionEl.querySelector('.question-answer').textContent;
        idInput.value = id;
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error preparing question edit:', error);
        alert('Failed to prepare question edit');
    }
}

// Delete question
async function deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/faq/questions/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadFAQManagement();
        } else {
            throw new Error('Failed to delete question');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete question');
    }
}

// Add category form submission handler
document.getElementById('addCategoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameInput = document.getElementById('categoryName');
    
    try {
        const response = await fetch('/api/faq/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: nameInput.value
            })
        });
        
        if (response.ok) {
            document.getElementById('addCategoryModal').style.display = 'none';
            nameInput.value = '';
            loadFAQManagement();
        } else {
            throw new Error('Failed to add category');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add category');
    }
});

// Add question form submission handler
document.getElementById('addQuestionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const categoryId = document.getElementById('questionCategoryId').value;
    const questionInput = document.getElementById('question');
    const answerInput = document.getElementById('answer');
    
    try {
        const response = await fetch('/api/faq/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                categoryId: parseInt(categoryId),
                question: questionInput.value,
                answer: answerInput.value
            })
        });
        
        if (response.ok) {
            document.getElementById('addQuestionModal').style.display = 'none';
            questionInput.value = '';
            answerInput.value = '';
            loadFAQManagement();
        } else {
            throw new Error('Failed to add question');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add question');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const addCategoryModal = document.getElementById('addCategoryModal');
    const editCategoryModal = document.getElementById('editCategoryModal');
    const addQuestionModal = document.getElementById('addQuestionModal');
    const editQuestionModal = document.getElementById('editQuestionModal');

    // Get all close buttons
    const closeButtons = document.querySelectorAll('.close-btn');

    // Add click handlers to all close buttons
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Close all modals
            addCategoryModal.style.display = 'none';
            editCategoryModal.style.display = 'none';
            addQuestionModal.style.display = 'none';
            editQuestionModal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === addCategoryModal) addCategoryModal.style.display = 'none';
        if (e.target === editCategoryModal) editCategoryModal.style.display = 'none';
        if (e.target === addQuestionModal) addQuestionModal.style.display = 'none';
        if (e.target === editQuestionModal) editQuestionModal.style.display = 'none';
    });

    // Function to show add category modal
    window.showAddCategoryModal = function() {
        addCategoryModal.style.display = 'block';
    };

    // Add ESC key handler for closing modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            addCategoryModal.style.display = 'none';
            editCategoryModal.style.display = 'none';
            addQuestionModal.style.display = 'none';
            editQuestionModal.style.display = 'none';
        }
    });
});

document.getElementById('editCategoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editCategoryId').value;
    const name = document.getElementById('editCategoryName').value;
    
    try {
        const response = await fetch(`/api/faq/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        
        if (response.ok) {
            document.getElementById('editCategoryModal').style.display = 'none';
            loadFAQManagement(); // Reload the FAQ management section
        } else {
            throw new Error('Failed to update category');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update category');
    }
});
// Initialize FAQ management
document.addEventListener('DOMContentLoaded', function() {
    const customizationTab = document.querySelector('a[href="#customization"]');
    if (customizationTab) {
        customizationTab.addEventListener('click', loadFAQManagement);
    }
    
    // Form submissions
    document.getElementById('editQuestionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editQuestionId').value;
        const question = document.getElementById('editQuestionText').value;
        const answer = document.getElementById('editQuestionAnswer').value;
        
        try {
            const response = await fetch(`/api/faq/questions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question, answer })
            });
            
            if (response.ok) {
                document.getElementById('editQuestionModal').style.display = 'none';
                loadFAQManagement();
            } else {
                throw new Error('Failed to update question');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update question');
        }
    });
    
     // Edit Question Form Submit
     document.getElementById('editQuestionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editQuestionId').value;
        const question = document.getElementById('editQuestionText').value;
        const answer = document.getElementById('editQuestionAnswer').value;
        
        try {
            const response = await fetch(`/api/faq/questions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question, answer })
            });
            
            if (response.ok) {
                document.getElementById('editQuestionModal').style.display = 'none';
                loadFAQManagement();
            } else {
                throw new Error('Failed to update question');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update question');
        }
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const editCategoryModal = document.getElementById('editCategoryModal');
        const editQuestionModal = document.getElementById('editQuestionModal');
        
        if (e.target === editCategoryModal) editCategoryModal.style.display = 'none';
        if (e.target === editQuestionModal) editQuestionModal.style.display = 'none';
    });

    // Close modals with close button
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('editCategoryModal').style.display = 'none';
            document.getElementById('editQuestionModal').style.display = 'none';
        });
    });

});