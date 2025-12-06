    /* ============================== */
    /*     LOGIKA APLIKASI KEUANGANKU */
    /* ============================== */

    // 📅 Tanggal & Waktu Real-Time
    function perbaruiTanggalWaktu() {
      const sekarang = new Date();
      document.getElementById("date").textContent = sekarang.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      document.getElementById("time").textContent = sekarang.toLocaleTimeString("id-ID");
    }

    // ⚙️ Modal
    const Modal = {
      open() {
        document.querySelector(".popup_area").classList.add("aktif");
      },
      close() {
        document.querySelector(".popup_area").classList.remove("aktif");
      },
    };

    // 🔐 API Helper Functions
    const API = {
      baseURL: 'https://backend-simanja.vercel.app',
      
      async getHeaders(isFormData = false) {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login kembali.');
        }
        
        const headers = {
          'Authorization': `Bearer ${token}`
        };
        
        if (!isFormData) {
          headers['Content-Type'] = 'application/json';
        }
        
        return headers;
      },

      async get(url) {
        try {
          const response = await fetch(`${this.baseURL}${url}`, {
            headers: await this.getHeaders()
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
          }
          
          return response.json();
        } catch (error) {
          console.error('❌ API GET Error:', error);
          throw error;
        }
      },

      async post(url, data, isFormData = false) {
        try {
          const options = {
            method: 'POST',
            headers: await this.getHeaders(isFormData)
          };
          
          if (isFormData) {
            options.body = data;
          } else {
            options.body = JSON.stringify(data);
          }
          
          console.log('🔍 DEBUG - API POST:', { url, isFormData });
          
          const response = await fetch(`${this.baseURL}${url}`, options);
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText };
            }
            throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
          }
          
          return response.json();
        } catch (error) {
          console.error('❌ API POST Error:', error);
          throw error;
        }
      },

      async delete(url) {
        try {
          const response = await fetch(`${this.baseURL}${url}`, {
            method: 'DELETE',
            headers: await this.getHeaders()
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
          }
          
          return response.json();
        } catch (error) {
          console.error('❌ API DELETE Error:', error);
          throw error;
        }
      }
    };

    // 💰 Data Transaksi
    const Transaksi = {
      semua: [],

      async load() {
        try {
          console.log('🔍 Loading transactions...');
          const data = await API.get('/transactions?limit=1000');
          this.semua = data.transactions || [];
          console.log('✅ Transactions loaded:', this.semua.length);
          return this.semua;
        } catch (error) {
          console.error('❌ Error loading transactions:', error);
          showNotification('Gagal memuat data transaksi', 'error');
          this.semua = [];
          return [];
        }
      },

      async tambah(transaksiFormData) {
        try {
          console.log('🔍 Adding transaction...');
          const response = await API.post('/transactions', transaksiFormData, true);
          console.log('✅ Transaction added:', response);
          
          // Reload data terbaru dari server
          await this.load();
          return response;
        } catch (error) {
          console.error('❌ Error adding transaction:', error);
          throw error;
        }
      },

      async hapus(id) {
        try {
          console.log('🔍 Deleting transaction:', id);
          const response = await API.delete(`/transactions/${id}`);
          
          // Update local data
          this.semua = this.semua.filter(t => t.id !== id);
          return response;
        } catch (error) {
          console.error('❌ Error deleting transaction:', error);
          throw error;
        }
      },

      async getRingkasan() {
        try {
          return await API.get('/transactions/summary');
        } catch (error) {
          console.error('❌ Error loading summary:', error);
          // Fallback ke perhitungan lokal
          return {
            totalIncome: this.pemasukan(),
            totalExpense: this.pengeluaran(),
            balance: this.saldo()
          };
        }
      },

      pemasukan() {
        return this.semua
          .filter(t => t.jenis === 'income')
          .reduce((total, t) => total + parseFloat(t.jumlah), 0);
      },

      pengeluaran() {
        return this.semua
          .filter(t => t.jenis === 'expense')
          .reduce((total, t) => total + parseFloat(t.jumlah), 0);
      },

      saldo() {
        return this.pemasukan() - this.pengeluaran();
      },

      // 🆕 FILTER BERDASARKAN RENTANG WAKTU
      filterByTimeRange(timeRange) {
        const now = new Date();
        let startDate;
        
        switch(timeRange) {
          case '3months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          case '6months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
            break;
          case '1year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
          default: // 'all'
            return this.semua;
        }
        
        return this.semua.filter(transaksi => {
          const transaksiDate = new Date(transaksi.tanggal);
          return transaksiDate >= startDate;
        });
      },

      // 🆕 DATA UNTUK CHART PERTAMA (PERBANDINGAN PEMASUKAN vs PENGELUARAN)
      getDataForMainChart(timeRange = 'all') {
        const filteredTransactions = this.filterByTimeRange(timeRange);
        const pemasukan = filteredTransactions
          .filter(t => t.jenis === 'income')
          .reduce((total, t) => total + parseFloat(t.jumlah), 0);
        const pengeluaran = filteredTransactions
          .filter(t => t.jenis === 'expense')
          .reduce((total, t) => total + parseFloat(t.jumlah), 0);
        
        return {
          labels: ['Pemasukan', 'Pengeluaran'],
          datasets: [{
            label: 'Jumlah (Rp)',
            data: [pemasukan, pengeluaran],
            backgroundColor: ['#3B82F6', '#EF4444'],
            borderColor: ['#2563EB', '#DC2626'],
            borderWidth: 2
          }]
        };
      },

      // 🆕 DATA UNTUK CHART KEDUA (RINCIAN PENGELUARAN BERDASARKAN KETERANGAN)
      getDataForExpenseChart(timeRange = 'all') {
        const filteredTransactions = this.filterByTimeRange(timeRange);
        const pengeluaran = filteredTransactions.filter(t => t.jenis === 'expense');
        
        if (pengeluaran.length === 0) {
          return null;
        }
        
        // Kelompokkan berdasarkan keterangan yang dimasukkan user
        const keteranganMap = {};
        
        pengeluaran.forEach(transaksi => {
          const keterangan = transaksi.keterangan || 'Tanpa Keterangan';
          if (!keteranganMap[keterangan]) {
            keteranganMap[keterangan] = {
              total: 0,
              count: 0,
              transactions: []
            };
          }
          keteranganMap[keterangan].total += parseFloat(transaksi.jumlah);
          keteranganMap[keterangan].count += 1;
          keteranganMap[keterangan].transactions.push(transaksi);
        });
        
        // Urutkan dari yang terbesar ke terkecil
        const sortedKeterangan = Object.entries(keteranganMap)
          .sort(([,a], [,b]) => b.total - a.total);
        
        // Ambil 10 keterangan terbesar, sisanya digabung sebagai "Lainnya"
        const topKeterangan = sortedKeterangan.slice(0, 10);
        const lainnya = sortedKeterangan.slice(10);
        
        // Hitung total untuk "Lainnya"
        let totalLainnya = 0;
        let countLainnya = 0;
        const transactionsLainnya = [];
        
        lainnya.forEach(([keterangan, data]) => {
          totalLainnya += data.total;
          countLainnya += data.count;
          transactionsLainnya.push(...data.transactions);
        });
        
        // Siapkan data untuk chart
        const labels = topKeterangan.map(([keterangan]) => keterangan);
        const data = topKeterangan.map(([, data]) => data.total);
        
        // Tambahkan "Lainnya" jika ada
        if (totalLainnya > 0) {
          labels.push('Lainnya');
          data.push(totalLainnya);
          keteranganMap['Lainnya'] = {
            total: totalLainnya,
            count: countLainnya,
            transactions: transactionsLainnya
          };
        }
        
        return {
          labels,
          datasets: [{
            data,
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
              '#FF9F40', '#FF6384', '#C9CBCF', '#7C4DFF', '#4CAF50',
              '#795548'
            ],
            borderWidth: 2,
            borderColor: '#fff'
          }],
          detailData: keteranganMap
        };
      }
    };

    // 🧾 Manipulasi Tabel
    const DOM = {
      wadahTabel: document.querySelector("#data-table tbody"),

      renderTransactions() {
        this.hapusSemuaTransaksi();
        
        if (Transaksi.semua.length === 0) {
          this.tampilkanPesanKosong();
          return;
        }
        
        Transaksi.semua.forEach((transaksi) => this.tambahTransaksi(transaksi));
      },

      tampilkanPesanKosong() {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td colspan="4" class="text-center py-4 text-gray-500">
            <i class="fas fa-receipt text-3xl mb-2"></i>
            <p>Belum ada data transaksi</p>
            <small>Klik tombol "+" untuk menambah transaksi</small>
          </td>
        `;
        this.wadahTabel.appendChild(tr);
      },

      tambahTransaksi(transaksi) {
        const tr = document.createElement("tr");
        tr.innerHTML = this.isiBarisTransaksi(transaksi);
        this.wadahTabel.appendChild(tr);
      },

      isiBarisTransaksi(transaksi) {
        const kelasCSS = transaksi.jenis === 'income' ? "pemasukan" : "pengeluaran";
        const jumlahFormat = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR'
        }).format(transaksi.jumlah);

        const tanggal = new Date(transaksi.tanggal).toLocaleDateString('id-ID');
        
        return `
          <td class="px-4 py-3">${transaksi.keterangan || '-'}</td>
          <td class="px-4 py-3 ${kelasCSS}">${jumlahFormat}</td>
          <td class="px-4 py-3">${tanggal}</td>
          <td class="px-4 py-3">
            <button onclick="hapusTransaksi(${transaksi.id})" class="btn-hapus">
              <i class="fas fa-trash"></i>
            </button>
            ${transaksi.bukti_transaksi ? `
              <button onclick="Bukti.lihat('${transaksi.bukti_transaksi}')" class="btn-bukti">
                <i class="fas fa-image"></i>
              </button>
            ` : ''}
          </td>
        `;
      },

      async perbaruiRingkasan() {
        try {
          const ringkasan = await Transaksi.getRingkasan();
          
          document.getElementById("incomeDisplay").textContent = 
            "Rp " + Math.round(ringkasan.totalIncome || 0).toLocaleString("id-ID");
          
          document.getElementById("expenseDisplay").textContent = 
            "Rp " + Math.round(ringkasan.totalExpense || 0).toLocaleString("id-ID");
          
          document.getElementById("totalDisplay").textContent = 
            "Rp " + Math.round(ringkasan.balance || 0).toLocaleString("id-ID");
            
        } catch (error) {
          console.error('Error updating summary:', error);
          // Fallback lokal
          document.getElementById("incomeDisplay").textContent = "Rp " + Math.round(Transaksi.pemasukan()).toLocaleString("id-ID");
          document.getElementById("expenseDisplay").textContent = "Rp " + Math.round(Transaksi.pengeluaran()).toLocaleString("id-ID");
          document.getElementById("totalDisplay").textContent = "Rp " + Math.round(Transaksi.saldo()).toLocaleString("id-ID");
        }
      },

      hapusSemuaTransaksi() {
        if (this.wadahTabel) {
          this.wadahTabel.innerHTML = "";
        }
      },

      // 🆕 TAMPILKAN DETAIL PENGELUARAN
      tampilkanDetailPengeluaran(detailData) {
        const expenseDetails = document.getElementById('expenseDetails');
        const detailsList = document.getElementById('detailsList');
        
        if (!detailData || Object.keys(detailData).length === 0) {
          expenseDetails.style.display = 'none';
          return;
        }
        
        expenseDetails.style.display = 'block';
        
        // Urutkan berdasarkan total terbesar
        const sortedDetails = Object.entries(detailData)
          .sort(([,a], [,b]) => b.total - a.total);
        
        let html = '';
        
        sortedDetails.forEach(([keterangan, data], index) => {
          const percentage = ((data.total / Transaksi.pengeluaran()) * 100).toFixed(1);
          
          html += `
            <div class="detail-item" style="
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              padding: 12px 15px; 
              margin-bottom: 8px; 
              background: #f8fafc; 
              border-radius: 8px; 
              border-left: 4px solid ${getColorByIndex(index)};
            ">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">
                  ${keterangan}
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                  ${data.count} transaksi
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 700; color: #ef4444; margin-bottom: 2px;">
                  Rp ${Math.round(data.total).toLocaleString('id-ID')}
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                  ${percentage}%
                </div>
              </div>
            </div>
          `;
        });
        
        detailsList.innerHTML = html;
      }
    };

    // 🎨 Helper function untuk warna
    function getColorByIndex(index) {
      const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#7C4DFF', '#4CAF50',
        '#795548'
      ];
      return colors[index % colors.length];
    }

    // 📤 Form Tambah Transaksi
    const Form = {
      get description() { return document.getElementById("description"); },
      get amount() { return document.getElementById("amount"); },
      get date() { return document.getElementById("dateInput"); },
      get bukti() { return document.getElementById("buktiInput"); },

      ambilNilai() {
        const jenis = document.querySelector('input[name="type"]:checked').value;
        return {
          keterangan: this.description.value.trim(),
          jumlah: parseFloat(this.amount.value),
          jenis: jenis,
          tanggal: this.date.value
        };
      },

      validasi() {
        const { keterangan, jumlah, tanggal } = this.ambilNilai();
        
        if (!keterangan) throw new Error("Keterangan harus diisi!");
        if (isNaN(jumlah) || jumlah <= 0) throw new Error("Jumlah harus lebih dari 0!");
        if (!tanggal) throw new Error("Tanggal harus diisi!");
      },

      buatFormData() {
        const formData = new FormData();
        const { keterangan, jumlah, jenis, tanggal } = this.ambilNilai();
        
        // Tambahkan field text
        formData.append('keterangan', keterangan);
        formData.append('jumlah', jumlah.toString());
        formData.append('jenis', jenis);
        formData.append('tanggal', tanggal);
        
        // Tambahkan file jika ada
        const file = this.bukti.files[0];
        if (file) {
          formData.append('buktiTransaksi', file);
        }
        
        console.log('🔍 FormData:', {
          keterangan, jumlah, jenis, tanggal, 
          hasFile: !!file
        });
        
        return formData;
      },

      hapusIsi() {
        this.description.value = "";
        this.amount.value = "";
        this.date.value = "";
        this.bukti.value = "";
        // Set default ke pengeluaran
        document.getElementById('expenseRadio').checked = true;
      },

      async submit(event) {
        event.preventDefault();
        
        const submitBtn = event.target.querySelector('.save');
        const originalText = submitBtn.textContent;
        
        try {
          console.log('🔍 Starting form submission...');
          
          // Validasi
          this.validasi();
          
          // Loading state
          submitBtn.textContent = 'Menyimpan...';
          submitBtn.disabled = true;
          
          // Buat dan kirim FormData
          const formData = this.buatFormData();
          await Transaksi.tambah(formData);
          
          // Update UI
          DOM.renderTransactions();
          await DOM.perbaruiRingkasan();
          await updateCharts();
          
          // Reset & close
          this.hapusIsi();
          Modal.close();
          
          showNotification('Transaksi berhasil ditambahkan!', 'success');
          
        } catch (error) {
          console.error('❌ Form error:', error);
          showNotification(error.message, 'error');
        } finally {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      }
    };

    // 📸 Popup Bukti Transaksi
    const Bukti = {
      lihat(buktiPath) {
        const previewImg = document.getElementById("previewBukti");
        const popup = document.getElementById("popupBuktiArea");
        
        if (buktiPath.startsWith('data:')) {
          previewImg.src = buktiPath;
        } else {
          previewImg.src = `http://localhost:3000${buktiPath}`;
        }
        
        popup.classList.add("aktif");
      },

      close() {
        document.getElementById("popupBuktiArea").classList.remove("aktif");
      }
    };

    // 📊 Chart System - DUA CHART SEKALIGUS
    let currentMainChart = null;
    let currentExpenseChart = null;

    async function updateCharts() {
      await updateMainChart();
      await updateExpenseChart();
    }

    async function updateMainChart() {
      const canvas = document.getElementById("mainChart");
      const noDataBox = document.querySelector('.no-data-box');
      const chartType = document.getElementById('chartTypeSelector')?.value || 'pie';
      const timeRange = document.getElementById('timeRangeSelector')?.value || 'all';
      
      if (!canvas) return;

      try {
        const chartData = Transaksi.getDataForMainChart(timeRange);
        const hasData = chartData.datasets[0].data.some(value => value > 0);

        if (!hasData) {
          if (currentMainChart) currentMainChart.destroy();
          canvas.style.display = "none";
          if (noDataBox) noDataBox.style.display = "flex";
          return;
        }

        canvas.style.display = "block";
        if (noDataBox) noDataBox.style.display = "none";

        // Hancurkan chart sebelumnya
        if (currentMainChart) currentMainChart.destroy();
        
        // Buat chart baru
        currentMainChart = new Chart(canvas, {
          type: chartType,
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    return `${label}: Rp ${value.toLocaleString('id-ID')}`;
                  }
                }
              }
            },
            scales: chartType === 'bar' ? {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return 'Rp ' + value.toLocaleString('id-ID');
                  }
                }
              }
            } : {}
          }
        });
        
      } catch (error) {
        console.error('Main chart error:', error);
      }
    }

    async function updateExpenseChart() {
      const canvas = document.getElementById("expenseChart");
      const noDataBox = document.getElementById('expenseNoData');
      const chartType = document.getElementById('expenseChartTypeSelector')?.value || 'pie';
      const timeRange = document.getElementById('expenseTimeRangeSelector')?.value || 'all';
      
      if (!canvas) return;

      try {
        const chartData = Transaksi.getDataForExpenseChart(timeRange);

        if (!chartData) {
          if (currentExpenseChart) currentExpenseChart.destroy();
          canvas.style.display = "none";
          if (noDataBox) noDataBox.style.display = "flex";
          DOM.tampilkanDetailPengeluaran(null);
          return;
        }

        canvas.style.display = "block";
        if (noDataBox) noDataBox.style.display = "none";

        // Hancurkan chart sebelumnya
        if (currentExpenseChart) currentExpenseChart.destroy();
        
        // Buat chart baru
        currentExpenseChart = new Chart(canvas, {
          type: chartType,
          data: {
            labels: chartData.labels,
            datasets: [chartData.datasets[0]]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  font: {
                    size: 11
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${label}: Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
        
        // Tampilkan detail pengeluaran
        DOM.tampilkanDetailPengeluaran(chartData.detailData);
        
      } catch (error) {
        console.error('Expense chart error:', error);
      }
    }

    // 🆕 FUNGSI RESET DATA
    async function resetData() {
      if (confirm('Apakah Anda yakin ingin menghapus semua riwayat transaksi? Tindakan ini tidak dapat dibatalkan!')) {
        try {
          const submitBtn = document.querySelector('#resetData');
          const originalText = submitBtn.textContent;
          
          // Loading state
          submitBtn.textContent = 'Menghapus...';
          submitBtn.disabled = true;
          
          // Hapus semua transaksi satu per satu
          const deletePromises = Transaksi.semua.map(transaksi => 
            API.delete(`/transactions/${transaksi.id}`)
          );
          
          await Promise.all(deletePromises);
          
          // Reload data
          await Transaksi.load();
          DOM.renderTransactions();
          await DOM.perbaruiRingkasan();
          await updateCharts();
          
          showNotification('Semua riwayat transaksi berhasil dihapus!', 'success');
          
        } catch (error) {
          console.error('Error resetting data:', error);
          showNotification('Gagal menghapus data: ' + error.message, 'error');
        } finally {
          const submitBtn = document.querySelector('#resetData');
          submitBtn.textContent = 'Atur Ulang';
          submitBtn.disabled = false;
        }
      }
    }

    // Helper function untuk hapus transaksi
    async function hapusTransaksi(id) {
      if (confirm('Hapus transaksi ini?')) {
        try {
          await Transaksi.hapus(id);
          DOM.renderTransactions();
          await DOM.perbaruiRingkasan();
          await updateCharts();
          showNotification('Transaksi dihapus!', 'success');
        } catch (error) {
          showNotification('Gagal menghapus: ' + error.message, 'error');
        }
      }
    }

    // ⚡ Jalankan Aplikasi
    const Aplikasi = {
      async mulai() {
        try {
          console.log('🚀 Starting app...');
          await Transaksi.load();
          DOM.renderTransactions();
          await DOM.perbaruiRingkasan();
          await updateCharts();
          console.log('✅ App started');
        } catch (error) {
          console.error('❌ App error:', error);
          showNotification('Gagal memuat aplikasi', 'error');
        }
      }
    };

    // 👤 FUNGSI PROFIL DAN NAVIGASI
    // Fungsi untuk memuat foto profil
    async function loadProfilePhoto() {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const profileCircle = document.getElementById('profileCircle');
        
        if (user && user.fotoProfil) {
          profileCircle.innerHTML = `<img src="http://localhost:3000${user.fotoProfil}" alt="Foto Profil" class="profile-image">`;
        } else {
          const nama = user.namaLengkap || user.username || 'User';
          const initial = nama.charAt(0).toUpperCase();
          profileCircle.innerHTML = `<div class="profile-default">${initial}</div>`;
        }
      } catch (error) {
        console.error('Error loading profile photo:', error);
        const profileCircle = document.getElementById('profileCircle');
        profileCircle.innerHTML = `<div class="profile-default">U</div>`;
      }
    }

    // Fungsi untuk logout
    function logout() {
      if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('transaksi');
        window.location.href = 'index.html';
      }
    }

    // 🛠 Utility Functions
    function showNotification(message, type = 'info') {
      // Hapus notifikasi lama
      const existing = document.querySelector('.notification');
      if (existing) existing.remove();

      // Buat notifikasi baru
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      
      const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">${icon}</span>
          <span class="notification-message">${message}</span>
        </div>
      `;

      // Style notifikasi
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
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            border-left: 4px solid #16a34a;
            max-width: 400px;
          }
          .notification.success { border-left-color: #16a34a; }
          .notification.error { border-left-color: #ef4444; }
          .notification.info { border-left-color: #3b82f6; }
          .notification.show { transform: translateX(0); }
          .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #374151;
            font-weight: 500;
          }
        `;
        document.head.appendChild(styles);
      }

      document.body.appendChild(notification);

      // Animasi
      setTimeout(() => notification.classList.add('show'), 100);
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    // 📋 Event Listeners
    function setupEventListeners() {
      // Form transaction
      const formTransaction = document.getElementById("formTransaction");
      if (formTransaction) {
        formTransaction.addEventListener("submit", (event) => Form.submit(event));
      }
      
      // Modal buttons
      const showFormBtn = document.getElementById("showForm");
      const closeBtn = document.getElementById("close");
      const cancelBtn = document.querySelector(".cancel");
      
      if (showFormBtn) showFormBtn.addEventListener("click", Modal.open);
      if (closeBtn) closeBtn.addEventListener("click", Modal.close);
      if (cancelBtn) cancelBtn.addEventListener("click", Modal.close);
      
      // Bukti popup
      const buktiCloseBtn = document.querySelector("#popupBuktiArea .btn_close");
      const buktiBlur = document.querySelector("#popupBuktiArea .popupblur");
      
      if (buktiCloseBtn) buktiCloseBtn.addEventListener("click", Bukti.close);
      if (buktiBlur) buktiBlur.addEventListener("click", Bukti.close);
      
      // Chart controls untuk kedua chart
      const chartTypeSelector = document.getElementById('chartTypeSelector');
      const timeRangeSelector = document.getElementById('timeRangeSelector');
      const expenseChartTypeSelector = document.getElementById('expenseChartTypeSelector');
      const expenseTimeRangeSelector = document.getElementById('expenseTimeRangeSelector');
      
      if (chartTypeSelector) {
        chartTypeSelector.addEventListener('change', updateMainChart);
      }
      
      if (timeRangeSelector) {
        timeRangeSelector.addEventListener('change', updateMainChart);
      }
      
      if (expenseChartTypeSelector) {
        expenseChartTypeSelector.addEventListener('change', updateExpenseChart);
      }
      
      if (expenseTimeRangeSelector) {
        expenseTimeRangeSelector.addEventListener('change', updateExpenseChart);
      }
      
      // Tombol reset data
      const resetDataBtn = document.getElementById('resetData');
      if (resetDataBtn) {
        resetDataBtn.addEventListener('click', resetData);
      }
      
      // NAVIGASI PROFIL & DROPDOWN
      const profileCircle = document.getElementById("profileCircle");
      const profileDropdown = document.getElementById("profileDropdown");
      const logoutBtn = document.getElementById("logoutBtn");
      
      // Toggle dropdown profil
      if (profileCircle) {
        profileCircle.addEventListener("click", function(e) {
          e.stopPropagation();
          if (profileDropdown) {
            profileDropdown.classList.toggle('active');
          }
        });
      }
      
      // Logout function
      if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
      }
      
      // Close dropdown ketika klik di luar
      document.addEventListener("click", function() {
        const profileDropdown = document.getElementById("profileDropdown");
        if (profileDropdown) {
          profileDropdown.classList.remove("active");
        }
      });
    }

    // 🎯 Inisialisasi Aplikasi
    document.addEventListener("DOMContentLoaded", async function() {
      console.log("📄 DOM Loaded");
      
      // Cek login
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = "index.html";
        return;
      }
      
      // Setup
      perbaruiTanggalWaktu();
      setInterval(perbaruiTanggalWaktu, 1000);
      
      // Setup profil dan navigasi
      await loadProfilePhoto();
      setupEventListeners();
      
      // Set tanggal default ke hari ini
      const dateInput = document.getElementById("dateInput");
      if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
      }
      
      // Jalankan app
      await Aplikasi.mulai();
    });

    // Handle page visibility change (refresh data when page becomes visible)
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        // Page is visible, refresh data
        Aplikasi.mulai();
      }

    })
