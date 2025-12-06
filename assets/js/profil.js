// 📋 Inisialisasi Data Profil
let userData = {};

// 🎯 Fungsi Utama - Load Data Profil
async function loadProfileData() {
    try {
        console.log('🔍 Loading profile data...');
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('Silakan login kembali');
            window.location.href = 'index.html';
            return;
        }

        // Coba ambil dari localStorage dulu untuk loading cepat
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            userData = JSON.parse(savedUser);
            displayProfileData(); // Tampilkan data lokal dulu
        }

        // Ambil data terbaru dari API
        const response = await fetch('http://localhost:3000/api/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.user) {
            userData = data.user;
            localStorage.setItem('user', JSON.stringify(userData));
            displayProfileData();
            console.log('✅ Profile data loaded successfully:', userData);
        } else {
            throw new Error('Format data tidak valid');
        }
        
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        
        // Fallback ke data dari localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            userData = JSON.parse(savedUser);
            displayProfileData();
            showNotification('Menggunakan data lokal - ' + error.message, 'info');
        } else {
            showNotification('Gagal memuat data profil: ' + error.message, 'error');
        }
    }
}

// 📊 Tampilkan Data ke UI
function displayProfileData() {
    if (!userData) {
        console.log('❌ No user data available');
        return;
    }

    console.log('📊 Displaying profile data:', userData);

    // Data Header
    document.getElementById('nama_pengguna').textContent = userData.namaLengkap || userData.nama_lengkap || 'Nama Pengguna';
    document.getElementById('gender').textContent = userData.jenisKelamin || userData.jenis_kelamin || '-';

    // Data Identitas
    document.getElementById('nama_lengkap').textContent = userData.namaLengkap || userData.nama_lengkap || '-';
    document.getElementById('jenis_kelamin').textContent = userData.jenisKelamin || userData.jenis_kelamin || '-';
    document.getElementById('tgl_lahir').textContent = formatDateForDisplay(userData.tanggalLahir || userData.tanggal_lahir) || '-';
    document.getElementById('alamat').textContent = userData.alamat || '-';

    // Data Kontak
    document.getElementById('email_pengguna').textContent = userData.email || '-';
    document.getElementById('handphone').textContent = userData.nomorHP || userData.nomor_hp || '-';

    // Load foto profil jika ada
    if (userData.fotoProfil || userData.foto_profil) {
        const fotoUrl = userData.fotoProfil || userData.foto_profil;
        document.getElementById('foto_profil').src = `http://localhost:3000${fotoUrl}`;
    }

    console.log('✅ UI updated with profile data');
}

// 📅 Format Tanggal untuk Display
function formatDateForDisplay(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return '-';
    }
}

// 📅 Format Tanggal untuk Input Date
function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Date input formatting error:', error);
        return '';
    }
}

// ✏️ Modal Functions - Edit Profil
function bukaModal() {
    console.log('🔓 Opening edit modal...');
    
    // Isi form dengan data terkini dari userData
    document.getElementById('edit_nama').value = userData.namaLengkap || userData.nama_lengkap || '';
    document.getElementById('edit_email').value = userData.email || '';
    document.getElementById('edit_handphone').value = userData.nomorHP || userData.nomor_hp || '';
    document.getElementById('edit_tgl_lahir').value = formatDateForInput(userData.tanggalLahir || userData.tanggal_lahir);
    document.getElementById('edit_gender').value = userData.jenisKelamin || userData.jenis_kelamin || 'Laki-laki';
    document.getElementById('edit_alamat').value = userData.alamat || '';
    
    document.getElementById('modal_edit').style.display = 'block';
}

function tutupModal() {
    console.log('🔒 Closing edit modal...');
    document.getElementById('modal_edit').style.display = 'none';
}

// 📤 Handle Form Submit - UPDATE PROFILE
async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('📤 Form submitted - Updating profile...');

    const submitBtn = e.target.querySelector('.save_btn');
    const originalText = submitBtn.textContent;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Silakan login kembali');
            window.location.href = 'index.html';
            return;
        }

        // Show loading state
        submitBtn.textContent = 'Menyimpan...';
        submitBtn.disabled = true;

        const formData = {
            namaLengkap: document.getElementById('edit_nama').value.trim(),
            email: document.getElementById('edit_email').value.trim(),
            nomorHP: document.getElementById('edit_handphone').value.trim(),
            tanggalLahir: document.getElementById('edit_tgl_lahir').value,
            jenisKelamin: document.getElementById('edit_gender').value,
            alamat: document.getElementById('edit_alamat').value.trim()
        };

        console.log('🔍 Sending update data:', formData);

        // Validasi form
        if (!formData.namaLengkap) {
            throw new Error('Nama lengkap harus diisi');
        }
        if (!formData.email) {
            throw new Error('Email harus diisi');
        }

        const response = await fetch('http://localhost:3000/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ Profile updated successfully:', data);
            
            // Update local user data
            userData = { ...userData, ...formData };
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Update UI dengan data baru
            displayProfileData();
            
            tutupModal();
            showNotification('Profil berhasil diperbarui!', 'success');
        } else {
            throw new Error(data.error || data.details || 'Gagal memperbarui profil');
        }
        
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        showNotification('Gagal memperbarui profil: ' + error.message, 'error');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 🖼️ Handle Photo Upload
function setupPhotoUpload() {
    const uploadInput = document.getElementById('upload_foto');
    const fotoProfil = document.getElementById('foto_profil');

    uploadInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi file
        if (!file.type.startsWith('image/')) {
            showNotification('Hanya file gambar yang diizinkan!', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showNotification('Ukuran file maksimal 5MB!', 'error');
            return;
        }

        const originalSrc = fotoProfil.src;

        try {
            // Show loading state
            fotoProfil.style.opacity = '0.5';
            
            console.log('🖼️ Uploading profile photo...');
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('fotoProfil', file);

            const response = await fetch('http://localhost:3000/api/users/profile/photo', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log('✅ Photo uploaded successfully:', data);
                
                if (data.user && data.user.fotoProfil) {
                    fotoProfil.src = `http://localhost:3000${data.user.fotoProfil}`;
                    userData.fotoProfil = data.user.fotoProfil;
                    localStorage.setItem('user', JSON.stringify(userData));
                }
                
                showNotification('Foto profil berhasil diubah!', 'success');
            } else {
                throw new Error(data.error || data.details || 'Gagal mengupload foto');
            }

        } catch (error) {
            console.error('❌ Error uploading photo:', error);
            fotoProfil.src = originalSrc; // Kembalikan ke foto sebelumnya
            showNotification('Gagal mengupload foto: ' + error.message, 'error');
        } finally {
            fotoProfil.style.opacity = '1';
        }
    });
}

// 🔐 FUNGSI UBAH PASSWORD
function bukaModalUbahPassword() {
    console.log('🔓 Opening change password modal...');
    document.getElementById('modal_ubah_password').style.display = 'block';
    resetPasswordForm();
}

function tutupModalUbahPassword() {
    console.log('🔒 Closing change password modal...');
    document.getElementById('modal_ubah_password').style.display = 'none';
    resetPasswordForm();
}

function resetPasswordForm() {
    document.getElementById('form_ubah_password').reset();
    hidePasswordErrors();
}

function hidePasswordErrors() {
    const errorElements = ['passwordLamaError', 'passwordBaruError', 'konfirmasiPasswordError'];
    errorElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
}

// Validasi real-time untuk form ubah password
function setupPasswordValidation() {
    const passwordBaruInput = document.getElementById('password_baru');
    const konfirmasiInput = document.getElementById('konfirmasi_password');

    if (passwordBaruInput) {
        passwordBaruInput.addEventListener('blur', function() {
            validatePasswordBaru();
        });
    }

    if (konfirmasiInput) {
        konfirmasiInput.addEventListener('blur', function() {
            validateKonfirmasiPassword();
        });
    }
}

// Handle form submission ubah password
async function handleUbahPasswordSubmit(e) {
    e.preventDefault();
    console.log('🔐 Form ubah password submitted...');

    const submitBtn = e.target.querySelector('.save_btn');
    const originalText = submitBtn.textContent;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Silakan login kembali');
            window.location.href = 'index.html';
            return;
        }

        // Show loading state
        submitBtn.textContent = 'Mengubah...';
        submitBtn.disabled = true;

        const formData = {
            passwordLama: document.getElementById('password_lama').value,
            passwordBaru: document.getElementById('password_baru').value,
            konfirmasiPassword: document.getElementById('konfirmasi_password').value
        };

        console.log('🔍 Sending password change data...');

        // Validasi form
        if (!formData.passwordLama) {
            document.getElementById('passwordLamaError').textContent = 'Password lama harus diisi';
            document.getElementById('passwordLamaError').classList.remove('hidden');
            throw new Error('Password lama harus diisi');
        }

        const isPasswordBaruValid = validatePasswordBaru();
        const isKonfirmasiValid = validateKonfirmasiPassword();

        if (!isPasswordBaruValid || !isKonfirmasiValid) {
            throw new Error('Harap perbaiki error di atas');
        }

        if (formData.passwordBaru !== formData.konfirmasiPassword) {
            document.getElementById('konfirmasiPasswordError').textContent = 'Konfirmasi password tidak cocok';
            document.getElementById('konfirmasiPasswordError').classList.remove('hidden');
            throw new Error('Konfirmasi password tidak cocok');
        }

        const response = await fetch('http://localhost:3000/api/users/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                oldPassword: formData.passwordLama,
                newPassword: formData.passwordBaru
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ Password changed successfully');
            
            tutupModalUbahPassword();
            showNotification('Password berhasil diubah!', 'success');
            
            // Clear form
            document.getElementById('form_ubah_password').reset();
        } else {
            throw new Error(data.error || data.details || 'Gagal mengubah password');
        }
        
    } catch (error) {
        console.error('❌ Error changing password:', error);
        
        // Tampilkan error spesifik untuk password lama
        if (error.message.includes('lama') || error.message.includes('old') || error.message.includes('salah')) {
            document.getElementById('passwordLamaError').textContent = error.message;
            document.getElementById('passwordLamaError').classList.remove('hidden');
        } else {
            showNotification('Gagal mengubah password: ' + error.message, 'error');
        }
    } finally {
        // Reset button state
        submitBtn.textContent = 'Ubah Password';
        submitBtn.disabled = false;
    }
}

// Validasi helper functions
function validatePasswordBaru() {
    const passwordBaru = document.getElementById('password_baru').value;
    const errorElement = document.getElementById('passwordBaruError');
    
    if (passwordBaru.length < 6) {
        errorElement.textContent = 'Password minimal 6 karakter';
        errorElement.classList.remove('hidden');
        return false;
    } else {
        errorElement.classList.add('hidden');
        return true;
    }
}

function validateKonfirmasiPassword() {
    const passwordBaru = document.getElementById('password_baru').value;
    const konfirmasi = document.getElementById('konfirmasi_password').value;
    const errorElement = document.getElementById('konfirmasiPasswordError');
    
    if (konfirmasi !== passwordBaru) {
        errorElement.textContent = 'Konfirmasi password tidak cocok';
        errorElement.classList.remove('hidden');
        return false;
    } else {
        errorElement.classList.add('hidden');
        return true;
    }
}

// 🔔 Notification System
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;

    // Add styles if not exists
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 16px 20px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                border-left: 4px solid #16a34a;
                max-width: 400px;
            }
            .notification.success {
                border-left-color: #16a34a;
            }
            .notification.error {
                border-left-color: #ef4444;
            }
            .notification.info {
                border-left-color: #3b82f6;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #374151;
                font-weight: 500;
            }
            .notification-icon {
                font-size: 16px;
            }
            .notification-message {
                flex: 1;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 🎯 Event Listeners Setup
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Edit Profile Button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', bukaModal);
    }

    // Ubah Password Button
    const ubahPasswordBtn = document.getElementById('ubahPasswordBtn');
    if (ubahPasswordBtn) {
        ubahPasswordBtn.addEventListener('click', bukaModalUbahPassword);
    }

    // Close Modal Buttons
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const closePasswordModal = document.getElementById('closePasswordModal');
    const cancelUbahPassword = document.getElementById('cancelUbahPassword');
    
    if (closeModal) {
        closeModal.addEventListener('click', tutupModal);
    }
    
    if (cancelEdit) {
        cancelEdit.addEventListener('click', tutupModal);
    }

    if (closePasswordModal) {
        closePasswordModal.addEventListener('click', tutupModalUbahPassword);
    }

    if (cancelUbahPassword) {
        cancelUbahPassword.addEventListener('click', tutupModalUbahPassword);
    }

    // Form Submit
    const formEditProfil = document.getElementById('form_edit_profil');
    if (formEditProfil) {
        formEditProfil.addEventListener('submit', handleFormSubmit);
    }

    // Ubah Password Form Submit
    const formUbahPassword = document.getElementById('form_ubah_password');
    if (formUbahPassword) {
        formUbahPassword.addEventListener('submit', handleUbahPasswordSubmit);
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('modal_edit');
        const passwordModal = document.getElementById('modal_ubah_password');
        
        if (event.target === modal) {
            tutupModal();
        }
        if (event.target === passwordModal) {
            tutupModalUbahPassword();
        }
    });

    // Setup photo upload
    setupPhotoUpload();
    
    // Setup password validation
    setupPasswordValidation();
}

// 🚀 Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing profile page...');
    
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Load initial user data from localStorage for fast display
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        userData = JSON.parse(savedUser);
        displayProfileData();
    }

    // Setup event listeners
    setupEventListeners();
    
    // Load fresh data from API
    loadProfileData();
    
    console.log('✅ Profile page initialized');
});