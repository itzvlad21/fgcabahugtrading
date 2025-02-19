document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }

    // Cache DOM elements
    const settingsNav = document.querySelector('.settings-nav');
    const settingsContent = document.querySelector('.settings-content');
    const saveBtn = document.querySelector('.save-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const userAvatar = document.querySelector('.user-avatar');
    const userInfoName = document.querySelector('.user-info h3');
    const userInfoEmail = document.querySelector('.user-info p');

    // Form elements
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const fullNameInput = document.getElementById('fullName');
    const mobileInput = document.getElementById('mobile');
    const addressInput = document.getElementById('address');
    const cityInput = document.getElementById('city');
    const provinceInput = document.getElementById('province');
    const zipCodeInput = document.getElementById('zipCode');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Initialize user data
    function initializeUserData() {
        // Get current user data with error handling
        const currentUser = JSON.parse(localStorage.getItem('user'));
        
        if (!currentUser) {
            console.error('No user data found in localStorage');
            window.location.href = '/login.html';
            return;
        }
     
        // Log user data for debugging
        console.log('Current user data:', currentUser);
    
        // Update sidebar user info
        userAvatar.textContent = getInitials(currentUser.fullName || currentUser.username);
        userInfoName.textContent = currentUser.fullName || currentUser.username;
        userInfoEmail.textContent = currentUser.email;
    
        // Populate form fields with null checks and default values
        usernameInput.value = currentUser.username || '';
        emailInput.value = currentUser.email || '';
        fullNameInput.value = currentUser.fullName || '';
        mobileInput.value = currentUser.mobile || '';
        addressInput.value = currentUser.address || '';
        cityInput.value = currentUser.city || '';
        provinceInput.value = currentUser.province || '';
        zipCodeInput.value = currentUser.zipCode || '';
    
        // Log populated values for verification
        console.log('Populated form values:', {
            mobile: mobileInput.value,
            address: addressInput.value,
            city: cityInput.value,
            province: provinceInput.value,
            zipCode: zipCodeInput.value
        });
    }

    // Get initials from name
    function getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    // Store original form values
    let originalValues = {};
    function storeOriginalValues() {
        originalValues = {
            username: usernameInput.value,
            fullName: fullNameInput.value,
            mobile: mobileInput.value,
            address: addressInput.value,
            city: cityInput.value,
            province: provinceInput.value,
            zipCode: zipCodeInput.value
        };
    }

    // Check if form has changes
    function hasFormChanges() {
        return Object.keys(originalValues).some(key => {
            const input = document.getElementById(key);
            return input && input.value !== originalValues[key];
        }) || currentPasswordInput.value || newPasswordInput.value || confirmPasswordInput.value;
    }

    // Handle tab navigation
    settingsNav.addEventListener('click', function(e) {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            // Check for unsaved changes
            if (hasFormChanges()) {
                if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    return;
                }
            }

            // Update active tab
            document.querySelectorAll('.settings-nav a').forEach(a => {
                a.classList.remove('active');
            });
            e.target.classList.add('active');

            // Update header content based on tab
            const headerTitle = document.querySelector('.settings-header h2');
            const headerDesc = document.querySelector('.settings-header p');
            
            switch(e.target.getAttribute('href')) {
                case '#profile':
                    headerTitle.textContent = 'Profile Information';
                    headerDesc.textContent = 'Update your personal information and contact details';
                    break;
                case '#security':
                    headerTitle.textContent = 'Security Settings';
                    headerDesc.textContent = 'Manage your password and security preferences';
                    break;
                case '#notifications':
                    headerTitle.textContent = 'Notification Preferences';
                    headerDesc.textContent = 'Control how you receive notifications';
                    break;
                case '#preferences':
                    headerTitle.textContent = 'Account Preferences';
                    headerDesc.textContent = 'Customize your account settings';
                    break;
            }
        }
    });

    // Form validation
    function validateForm() {
        // Reset previous error messages
        clearErrors();

        let isValid = true;
        const errors = [];

        // Username validation
        if (usernameInput.value.length < 3) {
            errors.push('Username must be at least 3 characters long');
            highlightError(usernameInput);
            isValid = false;
        }

        // Full name validation
        if (fullNameInput.value.trim() === '') {
            errors.push('Full name is required');
            highlightError(fullNameInput);
            isValid = false;
        }

        // Mobile number validation
        const phoneRegex = /^\+?([0-9]{2})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        if (mobileInput.value && !phoneRegex.test(mobileInput.value)) {
            errors.push('Invalid mobile number format');
            highlightError(mobileInput);
            isValid = false;
        }

        // Password change validation
        if (currentPasswordInput.value || newPasswordInput.value || confirmPasswordInput.value) {
            if (!currentPasswordInput.value) {
                errors.push('Current password is required to change password');
                highlightError(currentPasswordInput);
                isValid = false;
            }

            if (newPasswordInput.value) {
                // Password strength validation
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
                if (!passwordRegex.test(newPasswordInput.value)) {
                    errors.push('Password must be at least 8 characters long and contain uppercase, lowercase, and numbers');
                    highlightError(newPasswordInput);
                    isValid = false;
                }

                if (newPasswordInput.value !== confirmPasswordInput.value) {
                    errors.push('New passwords do not match');
                    highlightError(confirmPasswordInput);
                    isValid = false;
                }
            }
        }

        // Display errors if any
        if (!isValid) {
            showErrors(errors);
        }

        return isValid;
    }

    // Error handling
    function showErrors(errors) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.style.cssText = `
            background: #fee2e2;
            color: #dc2626;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        errorContainer.innerHTML = `
            <ul style="margin: 0; padding-left: 1.5rem;">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;

        document.body.appendChild(errorContainer);

        setTimeout(() => {
            errorContainer.remove();
        }, 5000);
    }

    function clearErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
        
        // Clear input highlights
        document.querySelectorAll('.error').forEach(input => {
            input.classList.remove('error');
        });
    }

    function highlightError(input) {
        input.classList.add('error');
        input.style.borderColor = '#dc2626';
    }

    // Save changes
    saveBtn.addEventListener('click', async function(e) {
        e.preventDefault();
    
        if (!validateForm()) {
            return;
        }
    
        try {
            const formData = {
                username: usernameInput.value,
                fullName: fullNameInput.value,
                mobile: mobileInput.value,
                address: addressInput.value,
                city: cityInput.value,
                province: provinceInput.value,
                zipCode: zipCodeInput.value
            };
    
            // Add password if being changed
            if (currentPasswordInput.value && newPasswordInput.value) {
                formData.currentPassword = currentPasswordInput.value;
                formData.newPassword = newPasswordInput.value;
            }
    
            const response = await fetch('/api/users/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update settings');
            }
    
            // Show success message
            showSuccess('Settings updated successfully');
    
            // Update local storage with new data
            const updatedUser = { ...currentUser, ...formData };
            delete updatedUser.currentPassword;
            delete updatedUser.newPassword;
            localStorage.setItem('user', JSON.stringify(updatedUser));
    
            // Reset password fields
            if (currentPasswordInput.value) {
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmPasswordInput.value = '';
            }
    
        } catch (error) {
            showErrors([error.message]);
        }
    });
    // Cancel changes
    cancelBtn.addEventListener('click', function() {
        if (hasFormChanges()) {
            if (confirm('Are you sure you want to discard changes?')) {
                initializeUserData();
                clearErrors();
            }
        }
    });

    // Success message
    function showSuccess(message) {
        const successContainer = document.createElement('div');
        successContainer.className = 'success-message';
        successContainer.style.cssText = `
            background: #dcfce7;
            color: #16a34a;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        successContainer.textContent = message;
        document.body.appendChild(successContainer);

        setTimeout(() => {
            successContainer.remove();
        }, 3000);
    }

    // Handle window unload
    window.addEventListener('beforeunload', function(e) {
        if (hasFormChanges()) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Initialize page
    initializeUserData();
});