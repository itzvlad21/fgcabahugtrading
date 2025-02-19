document.addEventListener('DOMContentLoaded', function() {
    const requestResetForm = document.getElementById('requestResetForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const resetTitle = document.getElementById('resetTitle');

    // Check if we're on the reset page with a token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        // Show reset password form
        requestResetForm.style.display = 'none';
        resetPasswordForm.style.display = 'block';
        resetTitle.textContent = 'Create New Password';
    }

    // Password requirements checking
    const newPasswordInput = document.getElementById('newPassword');
    const requirements = {
        length: { regex: /.{8,}/, element: document.getElementById('length') },
        uppercase: { regex: /[A-Z]/, element: document.getElementById('uppercase') },
        lowercase: { regex: /[a-z]/, element: document.getElementById('lowercase') },
        number: { regex: /[0-9]/, element: document.getElementById('number') }
    };

    newPasswordInput.addEventListener('input', function() {
        const password = this.value;
        
        // Check each requirement
        for (const [key, requirement] of Object.entries(requirements)) {
            const meets = requirement.regex.test(password);
            requirement.element.classList.toggle('requirement-met', meets);
        }
    });

    // Handle request reset form submission
    requestResetForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const submitButton = this.querySelector('button[type="submit"]');
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            const response = await fetch('/api/request-password-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Check your email for password reset instructions', 'success');
                this.reset();
            } else {
                throw new Error(data.error || 'Failed to send reset link');
            }
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Request Reset Link';
        }
    });

    // Handle reset password form submission
    resetPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitButton = this.querySelector('button[type="submit"]');

        // Validate passwords match
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        // Validate all requirements are met
        for (const [key, requirement] of Object.entries(requirements)) {
            if (!requirement.regex.test(password)) {
                showMessage('Password does not meet all requirements', 'error');
                return;
            }
        }

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Resetting...';

            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Password reset successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                throw new Error(data.error || 'Failed to reset password');
            }
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Reset Password';
        }
    });

    // Message display function
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        // Remove any existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Insert message after the form
        const activeForm = token ? resetPasswordForm : requestResetForm;
        activeForm.parentNode.insertBefore(messageDiv, activeForm.nextSibling);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
});