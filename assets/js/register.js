document.addEventListener('DOMContentLoaded', function() {
      const registerForm = document.getElementById('registerForm');
      const passwordInput = document.getElementById('passwordInput');
      const togglePassword = document.getElementById('togglePassword');
      const eyeIcon = document.getElementById('eyeIcon');
      const buttonText = document.getElementById('buttonText');
      const loadingSpinner = document.getElementById('loadingSpinner');
      const errorMessage = document.getElementById('errorMessage');
      const successMessage = document.getElementById('successMessage');

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
      const namaInput = document.querySelector('input[name="nama"]');
      const emailInput = document.querySelector('input[name="email"]');
      
      namaInput.addEventListener('blur', validateNama);
      emailInput.addEventListener('blur', validateEmail);
      passwordInput.addEventListener('blur', validatePassword);

      function validateNama() {
        const namaError = document.getElementById('namaError');
        if (!namaInput.value.trim()) {
          namaError.textContent = 'Nama lengkap harus diisi';
          namaError.classList.remove('hidden');
          return false;
        } else {
          namaError.classList.add('hidden');
          return true;
        }
      }

      function validateEmail() {
        const emailError = document.getElementById('emailError');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
          emailError.textContent = 'Format email tidak valid';
          emailError.classList.remove('hidden');
          return false;
        } else {
          emailError.classList.add('hidden');
          return true;
        }
      }

      function validatePassword() {
        const passwordError = document.getElementById('passwordError');
        if (passwordInput.value.length < 6) {
          passwordError.textContent = 'Password minimal 6 karakter';
          passwordError.classList.remove('hidden');
          return false;
        } else {
          passwordError.classList.add('hidden');
          return true;
        }
      }

      // Form submission
      registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate all fields
        const isNamaValid = validateNama();
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (!isNamaValid || !isEmailValid || !isPasswordValid) {
          errorMessage.textContent = 'Harap perbaiki error di atas';
          errorMessage.classList.remove('hidden');
          return;
        }

        // Show loading state
        buttonText.textContent = 'Mendaftarkan...';
        loadingSpinner.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');

        try {
          const formData = {
            namaLengkap: namaInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
            username: emailInput.value.trim().split('@')[0] // Generate username from email
          };

          // Send registration request to backend
          const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
          });

          const data = await response.json();

          if (response.ok) {
            successMessage.textContent = 'Pendaftaran berhasil! Mengarahkan ke login...';
            successMessage.classList.remove('hidden');
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 2000);
          } else {
            throw new Error(data.error || 'Terjadi kesalahan saat pendaftaran');
          }

        } catch (error) {
          errorMessage.textContent = error.message;
          errorMessage.classList.remove('hidden');
        } finally {
          // Reset loading state
          buttonText.textContent = 'Daftar';
          loadingSpinner.classList.add('hidden');
        }
      });

      // Enter key support
      registerForm.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          registerForm.dispatchEvent(new Event('submit'));
        }
      });
    });