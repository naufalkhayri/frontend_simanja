document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        const passwordInput = document.getElementById('passwordInput');
        const togglePassword = document.getElementById('togglePassword');
        const eyeIcon = document.getElementById('eyeIcon');
        const buttonText = document.getElementById('buttonText');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const errorMessage = document.getElementById('errorMessage');
        const usernameInput = document.querySelector('input[name="username"]');

        // Toggle password visibility
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Update eye icon
            if (type === 'text') {
                eyeIcon.innerHTML = `
                    <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1 4.474-4.474l-1.615-1.614a4.5 4.5 0 0 0-6.632 6.632l.001.001-4.561 4.56a.5.5 0 1 0 .708.708l4.56-4.56 4.56 4.56a.5.5 0 0 0 .708-.708l-4.56-4.56Zm3.806-.486a3.5 3.5 0 0 1-3.806 3.806l1.614-1.614a2.5 2.5 0 0 0 2.192-2.192l1.614-1.614Z"/>
                    <path d="M5.525 7.646a4.5 4.5 0 0 0 6.632 6.632l-1.614-1.614a3.5 3.5 0 0 1-4.474-4.474L5.525 7.646Zm-.708-.708 1.614 1.614A3.5 3.5 0 0 1 9.34 6.032l1.614-1.614a4.5 4.5 0 0 0-6.632 6.632Z"/>
                `;
            } else {
                eyeIcon.innerHTML = `
                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                `;
            }
        });

        // Real-time validation
        usernameInput.addEventListener('blur', validateUsername);
        passwordInput.addEventListener('blur', validatePassword);

        function validateUsername() {
            const usernameError = document.getElementById('usernameError');
            if (!usernameInput.value.trim()) {
                usernameError.textContent = 'Username atau email harus diisi';
                usernameError.classList.remove('hidden');
                return false;
            } else {
                usernameError.classList.add('hidden');
                return true;
            }
        }

        function validatePassword() {
            const passwordError = document.getElementById('passwordError');
            if (!passwordInput.value.trim()) {
                passwordError.textContent = 'Password harus diisi';
                passwordError.classList.remove('hidden');
                return false;
            } else {
                passwordError.classList.add('hidden');
                return true;
            }
        }

        // Form submission
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Validate all fields
            const isUsernameValid = validateUsername();
            const isPasswordValid = validatePassword();

            if (!isUsernameValid || !isPasswordValid) {
                errorMessage.textContent = 'Harap perbaiki error di atas';
                errorMessage.classList.remove('hidden');
                return;
            }

            // Show loading state
            buttonText.textContent = 'Memproses...';
            loadingSpinner.classList.remove('hidden');
            errorMessage.classList.add('hidden');

            try {
                const loginData = {
                    username: usernameInput.value.trim(),
                    password: passwordInput.value
                };

                // Send login request to backend
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loginData)
                });

                const data = await response.json();

                if (response.ok) {
                    // Save token and user data
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('isLoggedIn', 'true');
                    
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    throw new Error(data.error || 'Terjadi kesalahan saat login');
                }

            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.classList.remove('hidden');
            } finally {
                // Reset loading state
                buttonText.textContent = 'Masuk';
                loadingSpinner.classList.add('hidden');
            }
        });

        // Enter key support
        loginForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });