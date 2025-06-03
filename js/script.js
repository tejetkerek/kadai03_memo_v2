$(document).ready(function () {
  let materials = JSON.parse(localStorage.getItem("materials")) || [];
  let isFirstClick = true;  // 初回クリックフラグ

  // ロゴクリックでリフレッシュ
  $('#refresh-logo').on('click', function() {
    // 全てのセクションを非表示
    $('section').addClass('hidden');
    // ローディング画面を表示（リフレッシュモード）
    showLoading(true);
    // isFirstClickフラグをリセット
    isFirstClick = true;
  });

  // ローディング画面の制御
  const loadingScreen = $('#loading-screen');
  const loadingTicker = $('.loading-ticker');

  function showLoading(isRefresh = false) {
    loadingScreen.removeClass('hidden');
    if (isRefresh || isFirstClick) {
      loadingScreen.addClass('is-refresh');
    } else {
      loadingScreen.removeClass('is-refresh');
    }
  }

  function hideLoading() {
    loadingScreen.addClass('hidden').removeClass('is-refresh');
  }

  // ティッカーに画像を追加
  function initializeLoadingTicker() {
    const images = Array.from({length: 10}, (_, i) => `img/kondate${i + 1}.jpg`);
    // 2周分の画像を追加（スムーズなループのため）
    [...images, ...images].forEach(src => {
      loadingTicker.append(`<img src="${src}" alt="献立画像" class="loading-ticker-item" onerror="this.src='img/kondate1.jpg'">`);
    });
    
    
  }

  // 初期化時にティッカーを設定
  initializeLoadingTicker();

  // ページ読み込み時のローディング表示（最初はずっと表示、リフレッシュモードで）
  showLoading(true);
  // 初期表示でダッシュボードを隠す
  $('#dashboard').addClass('hidden');

  // サイドメニューの制御
  const menuTrigger = $('#menu-trigger');
  const menuTriggerIcon = $('#menu-trigger svg');
  const sideMenu = $('#side-menu');
  const menuOverlay = $('#menu-overlay');
  const mainWrapper = $('#main-wrapper');
  let isMenuOpen = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
      openMenu();
    } else {
      closeMenu();
    }
  }

  function openMenu() {
    sideMenu.removeClass('translate-x-full');
    menuOverlay.removeClass('opacity-0 pointer-events-none').addClass('opacity-50');
    mainWrapper.addClass('-translate-x-32');
    menuTrigger.addClass('-rotate-180');
    $('body').addClass('overflow-hidden');
  }

  function closeMenu() {
    sideMenu.addClass('translate-x-full');
    menuOverlay.addClass('opacity-0 pointer-events-none').removeClass('opacity-50');
    mainWrapper.removeClass('-translate-x-32');
    menuTrigger.removeClass('-rotate-180');
    $('body').removeClass('overflow-hidden');
  }

  menuTrigger.on('click', toggleMenu);
  menuOverlay.on('click', closeMenu);

  // メニュー項目クリック時の処理
  $('.menu-item').on('click', function(e) {
    e.preventDefault();
    const target = $(this).data('target');
    
    if (isFirstClick) {
      // 初回クリック時は即座に切り替え
      isFirstClick = false;
      hideLoading();
      $('section').addClass('hidden');
      $('#' + target).removeClass('hidden').addClass('fade-in');
      if (target === 'list') {
        renderList();
      } else if (target === 'dashboard') {
        initializeDashboard();
      } else if (target === 'inventory') {
        renderInventory();
      } else if (target === 'expiry') {
        renderExpiry();
      }
    } else {
      // 2回目以降は通常のローディング表示（リフレッシュモードではない）
      showLoading(false);
      setTimeout(() => {
        $('section').addClass('hidden');
        $('#' + target).removeClass('hidden').addClass('fade-in');
        if (target === 'list') {
          renderList();
        } else if (target === 'dashboard') {
          initializeDashboard();
        } else if (target === 'inventory') {
          renderInventory();
        } else if (target === 'expiry') {
          renderExpiry();
        }
        hideLoading();
      }, 1000);
    }

    // メニューを閉じる
    closeMenu();
  });

  // 材料登録行のテンプレート
  function createRegisterRow() {
    return $(`
      <div class="register-row bg-indigo-50 rounded-lg p-2 flex flex-col gap-1.5">
        <div class="flex flex-wrap gap-1.5">
          <input type="date" class="form-input w-36 py-1.5" placeholder="日付" />
          <input type="text" placeholder="購入店舗" class="form-input w-28 py-1.5" />
          <input type="text" placeholder="住所" class="form-input flex-1 min-w-[120px] py-1.5" />
        </div>
        <div class="flex flex-wrap gap-1.5 items-end">
          <div class="flex-1 flex gap-1.5">
            <input type="text" placeholder="材料名" class="form-input flex-1 min-w-[90px] py-1.5" />
                      </div>
          <input type="number" placeholder="値段(円)" class="form-input w-24 py-1.5" />
          <button type="button" class="delete-register-row text-red-400 hover:text-red-600 ml-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    `);
  }

  // 材料登録行追加
  $('#register-add-row').on('click', function() {
    const row = createRegisterRow();
    $('#register-rows').append(row);
    updateRegisterDeleteButtons();
  });

  // 材料登録行削除
  $(document).on('click', '.delete-register-row', function() {
    const rows = $('.register-row');
    if (rows.length > 1) {
      $(this).closest('.register-row').remove();
      updateRegisterDeleteButtons();
    }
  });

  // 材料登録行削除ボタンの有効/無効制御
  function updateRegisterDeleteButtons() {
    const rows = $('.register-row');
    if (rows.length <= 1) {
      rows.find('.delete-register-row').prop('disabled', true).addClass('opacity-30 cursor-not-allowed');
    } else {
      rows.find('.delete-register-row').prop('disabled', false).removeClass('opacity-30 cursor-not-allowed');
    }
  }

  // 初期行1つ追加
  if ($('#register-rows').length) {
    $('#register-rows').empty();
    $('#register-add-row').trigger('click');
  }

  // 材料登録の保存処理
  $('#saveBtn').on('click', function() {
    const rows = $('#register-rows .register-row');
    const newMaterials = [];

    rows.each(function() {
      const inputs = $(this).find('input');
      const material = {
        date: inputs.eq(0).val(),
        shop: inputs.eq(1).val(),
        address: inputs.eq(2).val(),
        name: inputs.eq(3).val(),
        price: inputs.eq(4).val()
      };

      // バリデーション
      if (!material.name) {
        showNotification('材料名は必須です', 'error');
        return;
      }

      newMaterials.push(material);
    });

    if (newMaterials.length > 0) {
      // LocalStorageから既存のデータを取得
      let materials = JSON.parse(localStorage.getItem('materials')) || [];
      
      // 新しいデータを追加
      materials = materials.concat(newMaterials);
      
      // LocalStorageに保存
      localStorage.setItem('materials', JSON.stringify(materials));

      // 入力フォームをクリア
      rows.each(function() {
        $(this).find('input').val('');
      });

      showNotification('材料を登録しました', 'success');

      // 材料一覧を更新（表示中の場合）
      if (!$('#list').hasClass('hidden')) {
        renderList();
      }
    }
  });

  // 材料リストの表示処理
  function renderList() {
    const list = $('#materialList').empty();
    // LocalStorageからデータを取得
    const materials = JSON.parse(localStorage.getItem('materials')) || [];
    const filters = [
      { id: 'filter-date', value: $('#filter-date').val(), label: '日付' },
      { id: 'filter-shop', value: $('#filter-shop').val(), label: '店舗' },
      { id: 'filter-name', value: $('#filter-name').val(), label: '材料名' },
      { id: 'filter-price-min', value: $('#filter-price-min').val(), label: '価格(最小)' },
      { id: 'filter-price-max', value: $('#filter-price-max').val(), label: '価格(最大)' }
    ];

    // フィルター適用
    let filteredMaterials = materials.map((m, idx) => ({ ...m, _index: idx }));

    filters.forEach(f => {
      if (f.value) {
        switch (f.id) {
          case 'filter-date':
            filteredMaterials = filteredMaterials.filter(m => m.date === f.value);
            break;
          case 'filter-shop':
            filteredMaterials = filteredMaterials.filter(m => m.shop?.toLowerCase().includes(f.value.toLowerCase()));
            break;
          case 'filter-name':
            filteredMaterials = filteredMaterials.filter(m => m.name?.toLowerCase().includes(f.value.toLowerCase()));
            break;
          case 'filter-price-min':
            filteredMaterials = filteredMaterials.filter(m => parseFloat(m.price) >= parseFloat(f.value));
            break;
          case 'filter-price-max':
            filteredMaterials = filteredMaterials.filter(m => parseFloat(m.price) <= parseFloat(f.value));
            break;
        }
      }
    });

    // リストの描画
    filteredMaterials.forEach((m, idx) => {
      const isSelected = JSON.parse(localStorage.getItem('selectedMaterials') || '[]').includes(m._index ?? idx);
      const row = $(`
        <tr class="border-b hover:bg-indigo-50 ${isSelected ? 'bg-emerald-50' : ''}">
          <td class="p-2 text-center align-middle">
            <input type="checkbox" class="material-check form-checkbox text-emerald-500 rounded w-5 h-5" 
              data-index="${m._index ?? idx}"
              ${isSelected ? 'checked' : ''} />
          </td>
          <td class="p-2 align-middle">${m.date || '-'}</td>
          <td class="p-2 align-middle">${m.shop || '-'}</td>
          <td class="p-2 align-middle">${m.name || '-'}</td>
          <td class="p-2 align-middle">${m.price ? '¥' + Number(m.price).toLocaleString() : '-'}</td>
          <td class="p-2 text-center align-middle">
            <button class="delete-material text-red-400 hover:text-red-600" data-index="${m._index ?? idx}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </td>
        </tr>
      `);
      list.append(row);
    });

    // フィルターバッジの更新
    renderFilterBadges();

    // 全選択チェックボックスの制御
    $('#select-all').on('change', function() {
      const isChecked = $(this).prop('checked');
      $('.material-check').prop('checked', isChecked);
      
      // 選択状態を保存
      const selectedIndexes = isChecked ? 
        $('.material-check').map(function() {
          return $(this).data('index');
        }).get() : [];
      localStorage.setItem('selectedMaterials', JSON.stringify(selectedIndexes));
      
      // 選択行のスタイルを更新
      $('.material-check').each(function() {
        $(this).closest('tr').toggleClass('bg-emerald-50', isChecked);
      });
    });

    // 個別チェックボックスの変更時に全選択の状態を更新
    $(document).on('change', '.material-check', function() {
      const allChecked = $('.material-check:checked').length === $('.material-check').length;
      $('#select-all').prop('checked', allChecked);
      
      // 選択状態を保存
      const selectedIndexes = $('.material-check:checked').map(function() {
        return $(this).data('index');
      }).get();
      localStorage.setItem('selectedMaterials', JSON.stringify(selectedIndexes));
      
      // 選択行のスタイルを更新
      $(this).closest('tr').toggleClass('bg-emerald-50', $(this).prop('checked'));
    });

    // 選択した材料の一括削除
    $('#deleteSelectedBtn').on('click', function() {
      const selectedIndexes = $('.material-check:checked').map(function() {
        return $(this).data('index');
      }).get();

      if (selectedIndexes.length === 0) {
        showNotification('削除する材料を選択してください', 'error');
        return;
      }

      // インデックスの大きい順に削除
      selectedIndexes.sort((a, b) => b - a).forEach(index => {
        materials.splice(index, 1);
      });

      // 選択状態をクリア
      localStorage.removeItem('selectedMaterials');

      localStorage.setItem('materials', JSON.stringify(materials));
      showNotification('選択した材料を削除しました', 'success');
      renderList();
    });

    // 献立提案ボタンのクリックイベント
    $('#generateBtn').on('click', function() {
      // 今日の献立セクションに遷移
      $('section').addClass('hidden');
      $('#menu').removeClass('hidden').addClass('fade-in');
      // メニューを閉じる
      closeMenu();
    });
  }

  // フィルターバッジの表示処理
  function renderFilterBadges() {
    const badgeArea = $('#filter-badges').empty();
    const filters = [
      { id: 'filter-date', value: $('#filter-date').val(), label: '日付' },
      { id: 'filter-shop', value: $('#filter-shop').val(), label: '店舗' },
      { id: 'filter-name', value: $('#filter-name').val(), label: '材料名' },
      { id: 'filter-price-min', value: $('#filter-price-min').val(), label: '価格(最小)' },
      { id: 'filter-price-max', value: $('#filter-price-max').val(), label: '価格(最大)' }
    ];

    filters.forEach(f => {
      if (f.value) {
        const badge = $(`
          <span class="inline-flex items-center rounded-full bg-indigo-100 text-indigo-800 px-3 py-1 text-sm font-medium shadow-sm transition mr-1 mb-1">
            ${f.label}：${f.value}
            <button type="button" class="ml-2 text-indigo-500 hover:text-white hover:bg-indigo-400 rounded-full w-5 h-5 flex items-center justify-center filter-badge-clear" data-filter="${f.id}">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </span>
        `);
        badgeArea.append(badge);
      }
    });
  }

  // フィルターバッジのクリア処理
  $(document).on('click', '.filter-badge-clear', function(e) {
    e.stopPropagation();
    const id = $(this).data('filter');
    $(`#${id}`).val('');
    renderList();
  });

  // 材料の削除処理
  $(document).on('click', '.delete-material', function() {
    const index = $(this).data('index');
    // LocalStorageからデータを取得
    let materials = JSON.parse(localStorage.getItem('materials')) || [];
    // 指定されたインデックスの材料を削除
    materials.splice(index, 1);
    // LocalStorageに保存
    localStorage.setItem('materials', JSON.stringify(materials));
    showNotification('材料を削除しました', 'success');
    renderList();
  });

  // 通知表示
  function showNotification(message, type = "info") {
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500"
    };

    const notification = $(`
      <div class="fixed top-4 right-4 px-6 py-3 rounded-lg text-white ${colors[type]} shadow-lg transform transition-all duration-300 opacity-0 translate-y-[-1rem] z-50">
        ${message}
      </div>
    `).appendTo("body");

    setTimeout(() => {
      notification.css({
        opacity: 1,
        transform: "translateY(0)"
      });
    }, 10);

    setTimeout(() => {
      notification.css({
        opacity: 0,
        transform: "translateY(-1rem)"
      });
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // 各フィルターのイベント
  $('#filter-date, #filter-shop, #filter-name, #filter-price-min, #filter-price-max').on('input change', renderList);

  // 在庫管理の表示処理
  function renderInventory() {
    const inventoryList = $('#inventoryList').empty();
    const inventory = JSON.parse(localStorage.getItem('inventory')) || [];

    inventory.forEach((item, index) => {
      const row = $(`
        <tr class="border-b hover:bg-indigo-50">
          <td class="p-2 align-middle">${item.name}</td>
          <td class="p-2 align-middle">${item.current}${item.unit}</td>
          <td class="p-2 align-middle">${item.min}${item.unit}</td>
          <td class="p-2 align-middle">${item.optimal}${item.unit}</td>
          <td class="p-2 align-middle">${item.location}</td>
          <td class="p-2 text-center align-middle">
            <button class="edit-inventory text-indigo-400 hover:text-indigo-600" data-index="${index}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
          </td>
        </tr>
      `);
      inventoryList.append(row);
    });
  }

  // 賞味期限管理の表示処理
  function renderExpiry() {
    const expiryList = $('#expiryList').empty();
    const expiry = JSON.parse(localStorage.getItem('expiry')) || [];

    expiry.forEach((item, index) => {
      const expiryDate = new Date(item.expiryDate);
      const today = new Date();
      const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      let status, statusClass;
      if (daysLeft < 0) {
        status = '期限切れ';
        statusClass = 'text-red-600';
      } else if (daysLeft <= 7) {
        status = '要注意';
        statusClass = 'text-yellow-600';
      } else {
        status = '良好';
        statusClass = 'text-green-600';
      }

      const row = $(`
        <tr class="border-b hover:bg-indigo-50">
          <td class="p-2 align-middle">${item.name}</td>
          <td class="p-2 align-middle">${item.expiryDate}</td>
          <td class="p-2 align-middle ${statusClass}">${daysLeft}日</td>
          <td class="p-2 align-middle">${item.purchaseDate}</td>
          <td class="p-2 align-middle ${statusClass}">${status}</td>
          <td class="p-2 text-center align-middle">
            <button class="delete-expiry text-red-400 hover:text-red-600" data-index="${index}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </td>
        </tr>
      `);
      expiryList.append(row);
    });
  }

  // ダッシュボードの初期化
  function initializeDashboard() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    // 固定のダミーデータ（3月の2週間分）
    const dummyData = [
      { date: '2024-03-01', avgPrice: 450 },
      { date: '2024-03-04', avgPrice: 680 },
      { date: '2024-03-05', avgPrice: 520 },
      { date: '2024-03-06', avgPrice: 750 },
      { date: '2024-03-07', avgPrice: 480 },
      { date: '2024-03-08', avgPrice: 620 },
      { date: '2024-03-11', avgPrice: 580 },
      { date: '2024-03-12', avgPrice: 800 },
      { date: '2024-03-13', avgPrice: 420 },
      { date: '2024-03-14', avgPrice: 550 },
      { date: '2024-03-15', avgPrice: 630 }
    ];

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dummyData.map(d => {
          const date = new Date(d.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        datasets: [{
          label: '平均価格',
          data: dummyData.map(d => d.avgPrice),
          borderColor: 'rgb(16, 185, 129)',  // emerald-500
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          pointBackgroundColor: 'white',
          pointBorderColor: 'rgb(16, 185, 129)',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: 'rgb(16, 185, 129)',
            bodyColor: '#333',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              title: (items) => {
                const date = new Date(dummyData[items[0].dataIndex].date);
                return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
              },
              label: (item) => {
                return `平均価格: ¥${item.raw.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: {
                size: 11
              },
              color: '#666'
            }
          },
          y: {
            beginAtZero: true,
            border: {
              display: false
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: {
                size: 11
              },
              color: '#666',
              callback: function(value) {
                return '¥' + value.toLocaleString();
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        }
      }
    });
  }

  // リセットボタンのクリックイベント
  $(document).on('click', '#resetDataBtn', function() {
    if (confirm('本当にすべてのデータをリセットしますか？')) {
      localStorage.removeItem('materials');
      localStorage.removeItem('selectedMaterials');
      showNotification('データをリセットしました', 'success');
      renderList();
    }
  });
});
