/**
 * LASA CHOCOLATES & BAKERS BY LAKSHITHA
 * Authentic Menu Integration with Pleasant Non-Chocolate Aesthetic
 * & In-Browser Visual Editor (Edit text, change images, add products, export)
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // CLOUD DATABASE CONFIGURATION (Firebase Firestore & Realtime DB)
  // ==========================================
  // Configured with your official Firebase project: lasa-pricing
  const firebaseConfig = {
    apiKey: "AIzaSyBV6EItsLle_mnQR7DrXeDU1ZmOe2AXnCM",
    authDomain: "lasa-pricing.firebaseapp.com",
    projectId: "lasa-pricing",
    storageBucket: "lasa-pricing.firebasestorage.app",
    messagingSenderId: "630646610652",
    appId: "1:630646610652:web:c3bec1c0c2a8eee7563219",
    measurementId: "G-VT7DDFGZ72"
  };

  let firebaseApp = null;
  let firestoreDb = null;
  let realtimeDb = null;

  try {
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
      firebaseApp = (firebase.apps && firebase.apps.length) ? firebase.app() : firebase.initializeApp(firebaseConfig);
      if (firebase.firestore) firestoreDb = firebase.firestore();
      if (firebase.database) realtimeDb = firebase.database();
      if (firebase.analytics) {
        try { firebase.analytics(); } catch(e) {}
      }
    }
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }

  const DEFAULT_FIREBASE_URL = 'https://lasa-pricing-default-rtdb.firebaseio.com';

  // ==========================================
  // REAL LASA MENU DATA
  // ==========================================

  // Bonbons available for the 10-Piece Custom Mix (₹179 - excludes kunafa as per Menu 2)
  const DEFAULT_BONBONS = [
    {
      id: 'rose-white',
      name: 'Rose Flavoured White Chocolate',
      category: 'Exotic Floral',
      img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_rose.jpg',
      flavorDesc: 'Delicately scented rose essence infused into silken handcrafted white chocolate.'
    },
    {
      id: 'dryfruit-white',
      name: 'Mixed Dry Fruit White',
      category: 'Dry Fruit',
      img: 'https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?w=600&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_matcha.jpg',
      flavorDesc: 'Slow-roasted almonds, cashews, and golden raisins folded into creamy white chocolate.'
    },
    {
      id: 'dryfruit-milk',
      name: 'Mixed Dry Fruit Milk',
      category: 'Dry Fruit',
      img: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&auto=format&fit=crop&q=80',
      fallback: 'assets/lasa_thumb.png',
      flavorDesc: 'Crunchy dry fruits blended with velvety milk chocolate goodness.'
    },
    {
      id: 'dryfruit-dark',
      name: 'Mixed Dry Fruit Dark',
      category: 'Dry Fruit',
      img: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_lavender.jpg',
      flavorDesc: 'Rich dark cocoa paired with roasted dry fruits for a wholesome crunch.'
    },
    {
      id: 'cherry-choc',
      name: 'Wild Cherry Confection',
      category: 'Exotic Fruit',
      img: 'https://images.unsplash.com/photo-1575372587186-500b3e51240c?w=600&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_rose.jpg',
      flavorDesc: 'Sweet-tart glace cherry wrapped in smooth handcrafted chocolate.'
    },
    {
      id: 'caramel-choc',
      name: 'Butter Caramel Jewel',
      category: 'Caramel Delight',
      img: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=600&auto=format&fit=crop&q=80',
      fallback: 'assets/lasa_thumb.png',
      flavorDesc: 'Melt-in-mouth slow-cooked rich caramel sealed inside a silky chocolate dome.'
    },
    {
      id: 'plain-white',
      name: 'Pure White Chocolate',
      category: 'Classic Plain',
      img: 'https://images.unsplash.com/photo-1516749622035-ab9e45262e0c?w=600&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_matcha.jpg',
      flavorDesc: 'Pure cocoa butter and dairy cream churned into velvety perfection.'
    },
    {
      id: 'plain-milk',
      name: 'Pure Milk Chocolate',
      category: 'Classic Plain',
      img: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=600&auto=format&fit=crop&q=80',
      fallback: 'assets/lasa_thumb.png',
      flavorDesc: 'Creamy, nostalgic, perfectly balanced milk chocolate.'
    },
    {
      id: 'plain-dark',
      name: 'Pure Dark Chocolate',
      category: 'Classic Plain',
      img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_lavender.jpg',
      flavorDesc: 'Deep, satisfying dark cocoa without harsh bitterness.'
    }
  ];

  let bonbonOverrides = JSON.parse(localStorage.getItem('lasa_bonbon_overrides')) || {};

  function getMergedBonbons() {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return DEFAULT_BONBONS.map(b => {
      const override = bonbonOverrides[b.id];
      if (override) {
        let resolvedImg = override.img || b.img;
        if (!isLocalhost && resolvedImg && resolvedImg.includes('localhost:')) {
          resolvedImg = b.img;
        }
        return {
          ...b,
          img: resolvedImg,
          name: override.name || b.name,
          category: override.category || b.category,
          flavorDesc: override.flavorDesc || b.flavorDesc
        };
      }
      return b;
    });
  }

  let BONBONS = getMergedBonbons();

  // Box Builder Size Prices with Dynamic Overrides & Sync
  const DEFAULT_BOX_PRICES = { 10: 179, 12: 210, 20: 340 };
  let boxPriceOverrides = JSON.parse(localStorage.getItem('lasa_box_prices')) || {};

  function getBoxPrice(size) {
    if (boxPriceOverrides && boxPriceOverrides[size] !== undefined && boxPriceOverrides[size] !== null && boxPriceOverrides[size] !== '') {
      return Number(boxPriceOverrides[size]);
    }
    return DEFAULT_BOX_PRICES[size] || 179;
  }

  // Default Catalog
  const DEFAULT_PRODUCTS = [
    // Exotic
    {
      id: 'lasa-rose-white',
      category: 'exotic',
      title: 'Rose Flavoured White Chocolate',
      pack: '10 Pieces Box',
      badge: 'Atelier Signature',
      price: 140,
      img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_rose.jpg',
      description: 'Our most cherished creation. Subtle organic rose perfume infused directly into creamy white chocolate for a delicate, floral sensation.',
      notes: ['Rose Petals', 'Pure Cocoa Butter', 'Velvet Cream'],
      pairings: 'Pair with warm floral tea, iced lemonade, or chilled sparkling water.'
    },
    {
      id: 'lasa-kunafa',
      category: 'exotic',
      title: 'Crispy Kunafa Chocolate',
      pack: '10 Pieces Gift Box',
      badge: 'Trending Special',
      price: 200,
      img: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/hero_banner.jpg',
      description: 'Crisp golden-roasted kunafa phyllo crunch infused with pistachios and enveloped in chocolate. A sensation of crisp texture and indulgence.',
      notes: ['Crispy Kunafa', 'Roasted Pistachio', 'Silky Shell'],
      pairings: 'Wonderful with cardamom chai or hot espresso.'
    },
    {
      id: 'lasa-cherry-box',
      category: 'exotic',
      title: 'Exotic Cherry Chocolates',
      pack: '10 Pieces Box',
      badge: 'Dark / Milk / White',
      price: 130,
      img: 'https://images.unsplash.com/photo-1575372587186-500b3e51240c?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_rose.jpg',
      description: 'Whole glace cherries enveloped in your choice of dark, milk, or white chocolate. Burst of natural fruit sweetness in every bite.',
      notes: ['Glace Cherry', 'Hand-Tempered Shell'],
      pairings: 'Enjoy as an after-dinner treat or with iced berry tea.'
    },
    {
      id: 'lasa-caramel-box',
      category: 'exotic',
      title: 'Exotic Caramel Chocolates',
      pack: '10 Pieces Box',
      badge: 'Dark / Milk / White',
      price: 130,
      img: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/lasa_thumb.png',
      description: 'Slow-simmered rich golden butter caramel tucked inside delicate chocolate shells. Gooey, luxurious, and satisfying.',
      notes: ['Butter Caramel', 'Sea Salt Touch'],
      pairings: 'Pair with hot latte or classic Indian filter coffee.'
    },

    // Mixed Dry Fruits
    {
      id: 'lasa-dryfruit-white',
      category: 'dryfruit',
      title: 'Mixed Dry Fruit White Chocolate',
      pack: '12 Pieces Box',
      badge: 'Nutty & Creamy',
      price: 160,
      img: 'https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_matcha.jpg',
      description: 'Premium roasted almonds, golden cashews, and sun-dried raisins folded into smooth white chocolate.',
      notes: ['Almonds', 'Cashews', 'Raisins', 'White Chocolate'],
      pairings: 'Delightful companion with evening green tea.'
    },
    {
      id: 'lasa-dryfruit-milk',
      category: 'dryfruit',
      title: 'Mixed Dry Fruit Milk Chocolate',
      pack: '12 Pieces Box',
      badge: 'Bestseller',
      price: 160,
      img: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/lasa_thumb.png',
      description: 'Handcrafted milk chocolate filled to the brim with crunchy slow-roasted nuts and sweet raisins.',
      notes: ['California Almonds', 'Cashews', 'Milk Chocolate'],
      pairings: 'Great with a warm glass of saffron milk.'
    },
    {
      id: 'lasa-dryfruit-dark',
      category: 'dryfruit',
      title: 'Mixed Dry Fruit Dark Chocolate',
      pack: '12 Pieces Box',
      badge: 'Rich & Wholesome',
      price: 150,
      img: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_lavender.jpg',
      description: 'Intense cocoa balanced against the natural roasted richness of dry fruits. Wholesome and guilt-free.',
      notes: ['Roasted Nuts', 'Dark Cocoa'],
      pairings: 'Splendid with black coffee or Earl Grey tea.'
    },

    // Plain Chocolates
    {
      id: 'lasa-plain-white-12',
      category: 'plain',
      title: 'Plain White Chocolate Box',
      pack: '12 Pieces Box',
      badge: 'Pure Velvet',
      price: 110,
      img: 'https://images.unsplash.com/photo-1516749622035-ab9e45262e0c?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_matcha.jpg',
      description: 'Twelve individually crafted squares of pure, smooth white chocolate that melt effortlessly on the tongue.',
      notes: ['Pure Cocoa Butter', 'Vanilla Essence'],
      pairings: 'Chilled berry tonic or light jasmine tea.'
    },
    {
      id: 'lasa-plain-milk-12',
      category: 'plain',
      title: 'Plain Milk Chocolate Box',
      pack: '12 Pieces Box',
      badge: 'Family Classic',
      price: 110,
      img: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/lasa_thumb.png',
      description: 'Classic handcrafted milk chocolate made with rich dairy butter and pure cocoa.',
      notes: ['Pure Milk', 'Sweet Cocoa'],
      pairings: 'A comforting cup of hot chocolate or tea.'
    },
    {
      id: 'lasa-plain-dark-12',
      category: 'plain',
      title: 'Plain Dark Chocolate Box',
      pack: '12 Pieces Box',
      badge: 'Cocoa Pure',
      price: 100,
      img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/bonbon_lavender.jpg',
      description: 'Smooth, tempered dark chocolate pieces with deep chocolate notes and zero bitterness.',
      notes: ['Dark Cocoa', 'Pure Craft'],
      pairings: 'Black coffee or red wine.'
    },
    {
      id: 'lasa-bulk-white-1kg',
      category: 'plain',
      title: 'White Chocolate Bulk Pack',
      pack: '1 Kilogram (1 KG)',
      badge: 'Celebration Bulk',
      price: 800,
      img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/gift_box.jpg',
      description: 'One full kilogram of our handcrafted white chocolate squares, perfect for celebrations, return gifts, and party spreads.',
      notes: ['1 KG Bulk', 'Party Special'],
      pairings: 'Celebration platters and sweet gifting hampers.'
    },
    {
      id: 'lasa-bulk-milk-1kg',
      category: 'plain',
      title: 'Milk Chocolate Bulk Pack',
      pack: '1 Kilogram (1 KG)',
      badge: 'Celebration Bulk',
      price: 850,
      img: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/gift_box.jpg',
      description: 'One kilogram of delicious, velvety milk chocolates packed safely for family feasts and celebrations.',
      notes: ['1 KG Bulk', 'Gifting Special'],
      pairings: 'Wedding hampers and festival gifting.'
    },
    {
      id: 'lasa-bulk-dark-1kg',
      category: 'plain',
      title: 'Dark Chocolate Bulk Pack',
      pack: '1 Kilogram (1 KG)',
      badge: 'Celebration Bulk',
      price: 750,
      img: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/gift_box.jpg',
      description: 'One kilogram of artisanal dark chocolates for true chocolate connoisseurs.',
      notes: ['1 KG Bulk', 'Pure Cocoa Value'],
      pairings: 'Dessert buffets and corporate hampers.'
    },

    // Bakery
    {
      id: 'lasa-brownie-250g',
      category: 'brownie',
      title: 'Homemade Fudge Brownies',
      pack: '250 Grams Box',
      badge: 'Freshly Baked',
      price: 249,
      img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=700&auto=format&fit=crop&q=80',
      fallback: 'assets/brownie_menu.png',
      description: 'Slow-baked with real butter, premium cocoa, and a decadent gooey fudge center crowned with a delicate crackly top.',
      notes: ['Real Butter', 'Fudge Center', 'Crackly Top'],
      pairings: 'Warm slightly and enjoy with a scoop of vanilla ice cream.'
    }
  ];

  // Load product overrides (prices, custom images, packs, descriptions)
  let productOverrides = JSON.parse(localStorage.getItem('lasa_product_overrides')) || {};
  let userProducts = JSON.parse(localStorage.getItem('lasa_custom_products')) || [];
  let deletedProductIds = JSON.parse(localStorage.getItem('lasa_deleted_products')) || [];

  function getMergedProducts() {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return [...DEFAULT_PRODUCTS, ...userProducts]
      .filter(p => !deletedProductIds.includes(p.id))
      .map(p => {
        const override = productOverrides[p.id];
        if (override) {
          let resolvedImg = override.img || p.img;
          if (!isLocalhost && resolvedImg && resolvedImg.includes('localhost:')) {
            resolvedImg = p.img;
          }
          return {
            ...p,
            price: (override.price !== undefined && override.price !== null && override.price !== '') ? Number(override.price) : p.price,
            img: resolvedImg,
            title: override.title || p.title,
            pack: override.pack || p.pack,
            description: override.description || p.description
          };
        }
        return p;
      });
  }

  let PRODUCTS = getMergedProducts();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  let state = {
    boxSize: 10,
    boxPrice: 179,
    boxSelectedBonbons: [],
    cart: JSON.parse(localStorage.getItem('lasa_cart')) || [],
    promoCodeApplied: null,
    discountPercent: 0,
    isEditMode: false,
    activeEditingImageKey: null,
    activeFestival: 'none'
  };

  // ==========================================
  // 10-PIECE CUSTOM MIX BUILDER
  // ==========================================

  const boxSizeLabel = document.getElementById('boxSizeLabel');
  const boxFillCount = document.getElementById('boxFillCount');
  const boxProgressFill = document.getElementById('boxProgressFill');
  const confectionSlots = document.getElementById('confectionSlots');
  const builderTotalPrice = document.getElementById('builderTotalPrice');
  const addCustomBoxToCartBtn = document.getElementById('addCustomBoxToCartBtn');
  const clearBoxBtn = document.getElementById('clearBoxBtn');
  const harmonyTags = document.getElementById('harmonyTags');
  const bonbonPickerGrid = document.getElementById('bonbonPickerGrid');
  const sizeTabs = document.querySelectorAll('.size-tab');

  function openBonbonImageEditor(bonbon) {
    state.activeEditingImageKey = `bonbon-${bonbon.id}`;
    imageUrlInput.value = bonbon.img.startsWith('data:') ? '' : bonbon.img;
    imageFileInput.value = '';
    imageEditModalOverlay.classList.add('active');
  }

  function renderPickerBonbons() {
    bonbonPickerGrid.innerHTML = '';
    const currentBonbons = getMergedBonbons();
    currentBonbons.forEach(bonbon => {
      const card = document.createElement('div');
      card.className = 'bonbon-pick-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.dataset.id = bonbon.id;
      const fallbackUrl = bonbon.fallback || 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&auto=format&fit=crop&q=80';
      card.innerHTML = `
        <div class="pick-thumb" title="${state.isEditMode ? 'Click to change photo' : ''}">
          <img src="${bonbon.img}" 
               alt="${bonbon.name}" 
               class="bonbon-img editable-image" 
               data-img-key="bonbon-${bonbon.id}"
               onerror="if(!this.getAttribute('data-has-fallback')){this.setAttribute('data-has-fallback','1');this.src='${fallbackUrl}';}">
          <span class="bonbon-edit-tip">📷 Change Photo</span>
        </div>
        <div class="pick-info">
          <h4 class="pick-title">${bonbon.name}</h4>
          <p class="pick-notes">${bonbon.flavorDesc}</p>
          <span class="pick-badge">${bonbon.category}</span>
        </div>
        <div class="pick-add-icon" title="Add to Box">+</div>
      `;

      card.addEventListener('click', (e) => {
        if (state.isEditMode) {
          openBonbonImageEditor(bonbon);
          return;
        }
        addBonbonToBox(bonbon);
      });
      bonbonPickerGrid.appendChild(card);
    });
  }

  function renderBoxSlots() {
    confectionSlots.className = `confection-slots-grid grid-${state.boxSize}`;
    confectionSlots.innerHTML = '';
    const currentBonbons = getMergedBonbons();

    for (let i = 0; i < state.boxSize; i++) {
      const item = state.boxSelectedBonbons[i];
      const slot = document.createElement('div');

      if (item) {
        const bonbonId = typeof item === 'string' ? item : item.id;
        const bonbon = currentBonbons.find(b => b.id === bonbonId) || item;
        slot.className = 'box-slot filled';
        slot.title = `${bonbon.name} (Click to remove)`;
        const fallbackUrl = bonbon.fallback || 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&auto=format&fit=crop&q=80';
        slot.innerHTML = `
          <img src="${bonbon.img}" 
               alt="${bonbon.name}" 
               class="slot-bonbon-img"
               onerror="if(!this.getAttribute('data-has-fallback')){this.setAttribute('data-has-fallback','1');this.src='${fallbackUrl}';}">
          <button class="slot-remove-btn" title="Remove">&times;</button>
        `;
        slot.addEventListener('click', () => {
          removeBonbonFromSlot(i);
        });
      } else {
        slot.className = 'box-slot empty';
        slot.innerHTML = `
          <span class="slot-placeholder">Slot ${i + 1}</span>
        `;
      }

      confectionSlots.appendChild(slot);
    }

    updateBoxBuilderMetrics();
  }

  function updateSizeTabsPriceDisplay() {
    sizeTabs.forEach(tab => {
      const size = parseInt(tab.dataset.size, 10);
      const price = getBoxPrice(size);
      tab.dataset.price = price;
      if (size === 10) tab.textContent = `10-Piece Mix (₹${price})`;
      else if (size === 12) tab.textContent = `12-Piece Assortment (₹${price})`;
      else if (size === 20) tab.textContent = `20-Piece Grand (₹${price})`;
    });

    if (state.boxSize === 10) boxSizeLabel.textContent = `10-Piece Custom Selection (₹${getBoxPrice(10)})`;
    else if (state.boxSize === 12) boxSizeLabel.textContent = `12-Piece Assortment Box (₹${getBoxPrice(12)})`;
    else if (state.boxSize === 20) boxSizeLabel.textContent = `20-Piece Grand Celebration Box (₹${getBoxPrice(20)})`;

    state.boxPrice = getBoxPrice(state.boxSize);
    builderTotalPrice.textContent = state.boxPrice.toFixed(0);
  }

  function addBonbonToBox(bonbon) {
    if (state.boxSelectedBonbons.length >= state.boxSize) {
      showToast(`Your ${state.boxSize}-piece box is full! Add it to your bag or tap a piece to replace.`, 'info');
      return;
    }

    state.boxSelectedBonbons.push(bonbon);
    renderBoxSlots();
    showToast(`Added ${bonbon.name} to slot ${state.boxSelectedBonbons.length}`);

    // Auto-scroll confection box horizontally on mobile to show newly filled slot
    const slotIdx = state.boxSelectedBonbons.length - 1;
    if (confectionSlots && confectionSlots.children[slotIdx] && confectionBoxContainer) {
      confectionSlots.children[slotIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function removeBonbonFromSlot(index) {
    const removed = state.boxSelectedBonbons.splice(index, 1);
    renderBoxSlots();
    if (removed.length) {
      showToast(`Removed piece from box`);
    }
  }

  function updateBoxBuilderMetrics() {
    const current = state.boxSelectedBonbons.length;
    const total = state.boxSize;
    const percent = Math.min(100, Math.round((current / total) * 100));

    state.boxPrice = getBoxPrice(state.boxSize);
    boxFillCount.textContent = `${current} of ${total} Selected`;
    boxProgressFill.style.width = `${percent}%`;
    builderTotalPrice.textContent = state.boxPrice.toFixed(0);

    if (current === total) {
      addCustomBoxToCartBtn.disabled = false;
      addCustomBoxToCartBtn.innerHTML = `
        <span>Add ${total}-Piece Box to Bag (₹${state.boxPrice})</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      `;
    } else {
      addCustomBoxToCartBtn.disabled = true;
      addCustomBoxToCartBtn.innerHTML = `
        <span>Select ${total - current} More ${total - current === 1 ? 'Piece' : 'Pieces'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
      `;
    }

    if (current === 0) {
      harmonyTags.innerHTML = `<span class="empty-harmony-hint">Click pieces on the right to start filling your box</span>`;
    } else {
      const categories = [...new Set(state.boxSelectedBonbons.map(b => b.category))];
      harmonyTags.innerHTML = categories.map(cat => `<span class="harmony-tag">✦ ${cat}</span>`).join('');
    }
  }

  sizeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sizeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const size = parseInt(tab.dataset.size, 10);
      const price = getBoxPrice(size);

      state.boxSize = size;
      state.boxPrice = price;

      if (size === 10) boxSizeLabel.textContent = `10-Piece Custom Selection (₹${price})`;
      else if (size === 12) boxSizeLabel.textContent = `12-Piece Assortment Box (₹${price})`;
      else boxSizeLabel.textContent = `20-Piece Grand Celebration Box (₹${price})`;

      if (state.boxSelectedBonbons.length > size) {
        state.boxSelectedBonbons = state.boxSelectedBonbons.slice(0, size);
      }

      renderBoxSlots();
    });
  });

  // Edit Box Builder Price in Edit Mode by tapping price
  if (builderTotalPrice) {
    builderTotalPrice.addEventListener('click', () => {
      if (!state.isEditMode) return;
      const currentPrice = state.boxPrice;
      const newPriceStr = prompt(`Edit Price for ${state.boxSize}-Piece Custom Box (Current: ₹${currentPrice}):`, currentPrice);
      if (newPriceStr !== null && newPriceStr.trim() !== '') {
        const newPrice = parseFloat(newPriceStr.trim());
        if (!isNaN(newPrice) && newPrice > 0) {
          boxPriceOverrides[state.boxSize] = newPrice;
          localStorage.setItem('lasa_box_prices', JSON.stringify(boxPriceOverrides));
          state.boxPrice = newPrice;
          updateBoxBuilderMetrics();
          updateSizeTabsPriceDisplay();
          saveAllEdits();
          showToast(`Updated ${state.boxSize}-Piece Box price to ₹${newPrice} & synced across devices! 🍫✨`, 'success');
        }
      }
    });
  }

  clearBoxBtn.addEventListener('click', () => {
    if (state.boxSelectedBonbons.length === 0) return;
    state.boxSelectedBonbons = [];
    renderBoxSlots();
    showToast('Box cleared');
  });

  addCustomBoxToCartBtn.addEventListener('click', () => {
    if (state.boxSelectedBonbons.length !== state.boxSize) return;

    const summaryMap = {};
    state.boxSelectedBonbons.forEach(b => {
      summaryMap[b.name] = (summaryMap[b.name] || 0) + 1;
    });
    const subText = Object.entries(summaryMap).map(([name, count]) => `${count}x ${name}`).join(', ');

    const customItem = {
      id: `lasa-custom-${Date.now()}`,
      title: `${state.boxSize}-Piece Custom Box`,
      subtitle: subText,
      price: state.boxPrice,
      quantity: 1,
      img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&auto=format&fit=crop&q=80',
      isCustom: true
    };

    addToCart(customItem);
    openCartDrawer();
    showToast(`Added ${state.boxSize}-Piece Box to your bag!`);

    state.boxSelectedBonbons = [];
    renderBoxSlots();
  });

  // ==========================================
  // PRODUCTS GRID & CATEGORY FILTER
  // ==========================================

  const productsGrid = document.getElementById('productsGrid');
  const collectionFilterPills = document.querySelectorAll('#collectionFilterPills .filter-pill');

  function renderProducts(filter = 'all') {
    productsGrid.innerHTML = '';
    const filtered = filter === 'all' 
      ? PRODUCTS 
      : PRODUCTS.filter(c => c.category === filter);

    filtered.forEach(product => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.id = product.id;
      const fallbackImg = product.fallback || 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=700&auto=format&fit=crop&q=80';
      card.innerHTML = `
        <div class="product-media">
          <img src="${product.img}" 
               alt="${product.title}" 
               class="product-img editable-image" 
               data-img-key="product-${product.id}"
               onerror="if(!this.getAttribute('data-has-fallback')){this.setAttribute('data-has-fallback','1');this.src='${fallbackImg}';}">
          <span class="product-badge-tag">${product.badge}</span>
          <span class="image-edit-overlay-tip">📷 Change Photo</span>
          <button type="button" class="product-edit-btn" data-id="${product.id}" title="Edit Price & Details for ${product.title}">✏️ Edit Price</button>
          <button type="button" class="product-delete-btn" data-id="${product.id}" title="Remove this product from live menu">🗑️ Remove</button>
        </div>
        <div class="product-content">
          <span class="product-cacao-origin">${product.pack}</span>
          <h3 class="product-title">${product.title}</h3>
          <p class="product-excerpt">${product.description}</p>
          <div class="product-notes-chips">
            ${(product.notes || []).map(n => `<span class="note-chip">✦ ${n}</span>`).join('')}
          </div>
          <div class="product-footer">
            <div class="product-price-container">
              <span class="product-price" data-id="${product.id}" title="Click to edit price in Edit Mode">₹<span class="price-val">${product.price}</span></span>
              <button type="button" class="inline-edit-price-btn" data-id="${product.id}" title="Edit Price">✏️</button>
            </div>
            <div class="product-actions">
              <button class="quick-view-btn" data-id="${product.id}">Details</button>
              <button class="add-bag-btn" data-id="${product.id}" title="Add to Bag">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;

      card.querySelector('.quick-view-btn').addEventListener('click', () => {
        openProductModal(product);
      });

      card.querySelector('.add-bag-btn').addEventListener('click', () => {
        addToCart({
          id: product.id,
          title: product.title,
          subtitle: product.pack,
          price: Number(product.price),
          quantity: 1,
          img: product.img
        });
        openCartDrawer();
        showToast(`Added ${product.title} to bag! 🍫`);
      });

      // Edit Price & Details (Admin actions)
      const editBtn = card.querySelector('.product-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditProductModal(product);
        });
      }

      const inlineEditPriceBtn = card.querySelector('.inline-edit-price-btn');
      if (inlineEditPriceBtn) {
        inlineEditPriceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditProductModal(product);
        });
      }

      const priceSpan = card.querySelector('.product-price');
      if (priceSpan) {
        priceSpan.addEventListener('click', (e) => {
          if (state.isEditMode) {
            e.stopPropagation();
            openEditProductModal(product);
          }
        });
      }

      const delBtn = card.querySelector('.product-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          confirmAndRemoveProduct(product.id, product.title);
        });
      }

      productsGrid.appendChild(card);
    });

    bindImageEditEvents();
  }

  collectionFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      collectionFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderProducts(pill.dataset.filter);
    });
  });

  // Spotlight Brownie CTA
  const addBrownieHeroBtn = document.getElementById('addBrownieHeroBtn');
  if (addBrownieHeroBtn) {
    addBrownieHeroBtn.addEventListener('click', () => {
      const brownie = PRODUCTS.find(p => p.id === 'lasa-brownie-250g');
      if (brownie) {
        addToCart({
          id: brownie.id,
          title: brownie.title,
          subtitle: brownie.pack,
          price: Number(brownie.price),
          quantity: 1,
          img: brownie.img
        });
        openCartDrawer();
        showToast('Added Homemade Fudge Brownies to bag! 🍫');
      }
    });
  }

  // ==========================================
  // PRODUCT DETAIL / QUICK VIEW MODAL
  // ==========================================

  const productModalOverlay = document.getElementById('productModalOverlay');
  const modalProductContent = document.getElementById('modalProductContent');
  const closeProductModalBtn = document.getElementById('closeProductModalBtn');

  function openProductModal(product) {
    const fallbackImg = product.fallback || 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=700&auto=format&fit=crop&q=80';
    modalProductContent.innerHTML = `
      <div class="modal-img-wrap">
        <img src="${product.img}" alt="${product.title}" class="modal-product-img" onerror="if(!this.getAttribute('data-has-fallback')){this.setAttribute('data-has-fallback','1');this.src='${fallbackImg}';}">
      </div>
      <div class="modal-product-info">
        <span class="section-tag">${product.badge}</span>
        <h2 class="section-title" style="font-size: 2rem; margin-bottom: 0.5rem;">${product.title}</h2>
        <span class="product-cacao-origin" style="margin-bottom: 1rem;">${product.pack}</span>
        <p class="product-excerpt" style="font-size: 1rem; margin-bottom: 1.5rem;">${product.description}</p>

        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin-bottom: 0.5rem;">Highlights & Flavour Profile</h4>
          <div class="product-notes-chips">
            ${(product.notes || []).map(n => `<span class="note-chip" style="font-size: 0.8rem; padding: 0.3rem 0.8rem;">✦ ${n}</span>`).join('')}
          </div>
        </div>

        <div class="pairing-box" style="margin-bottom: 2rem; background: var(--accent-mint-soft); border-radius: var(--radius-sm); padding: 1rem; display: flex; align-items: flex-start; gap: 0.75rem;">
          <span style="font-size: 1.3rem;">💖</span>
          <div>
            <strong style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--accent-sage-dark); text-transform: uppercase;">Serving Suggestion</strong>
            <p style="font-size: 0.8125rem; color: var(--text-secondary);">${product.pairings || 'Enjoy fresh with loved ones or a cup of warm tea.'}</p>
          </div>
        </div>

        <div class="product-footer" style="padding-top: 1.5rem;">
          <span class="product-price" style="font-size: 1.8rem;">₹${product.price}</span>
          <button class="btn btn-primary" id="modalAddBtn">
            <span>Add to Bag</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('modalAddBtn').addEventListener('click', () => {
      addToCart({
        id: product.id,
        title: product.title,
        subtitle: product.pack,
        price: Number(product.price),
        quantity: 1,
        img: product.img
      });
      closeProductModal();
      openCartDrawer();
      showToast(`Added ${product.title} to bag! 🍫`);
    });

    productModalOverlay.classList.add('active');
  }

  function closeProductModal() {
    productModalOverlay.classList.remove('active');
  }

  closeProductModalBtn.addEventListener('click', closeProductModal);
  productModalOverlay.addEventListener('click', (e) => {
    if (e.target === productModalOverlay) closeProductModal();
  });

  // ==========================================
  // MOBILE NAVIGATION DRAWER
  // ==========================================

  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');
  const closeMobileNavBtn = document.getElementById('closeMobileNavBtn');
  const mobileNavLinks = document.querySelectorAll('[data-mobile-nav="true"]');

  function openMobileNav() {
    if (mobileNavDrawer) mobileNavDrawer.classList.add('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    if (mobileNavDrawer) mobileNavDrawer.classList.remove('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', openMobileNav);
  if (closeMobileNavBtn) closeMobileNavBtn.addEventListener('click', closeMobileNav);
  if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileNav);

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileNav();
    });
  });

  // ==========================================
  // SHOPPING CART STATE & DRAWER
  // ==========================================

  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartToggleBtn = document.getElementById('cartToggleBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartCountBadge = document.getElementById('cartCountBadge');
  const drawerItemCount = document.getElementById('drawerItemCount');
  const cartItemsList = document.getElementById('cartItemsList');
  const shippingMeterMsg = document.getElementById('shippingMeterMsg');
  const shippingFill = document.getElementById('shippingFill');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const discountLine = document.getElementById('discountLine');
  const cartDiscount = document.getElementById('cartDiscount');
  const cartShipping = document.getElementById('cartShipping');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const whatsappCheckoutBtn = document.getElementById('whatsappCheckoutBtn');
  const promoInput = document.getElementById('promoInput');
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoFeedback = document.getElementById('promoFeedback');
  const floatingCartPill = document.getElementById('floatingCartPill');
  const floatingCartCountBadge = document.getElementById('floatingCartCountBadge');
  const floatingCartTotal = document.getElementById('floatingCartTotal');

  function openCartDrawer() {
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
  }

  cartToggleBtn.addEventListener('click', openCartDrawer);
  if (floatingCartPill) {
    floatingCartPill.addEventListener('click', openCartDrawer);
  }
  closeCartBtn.addEventListener('click', closeCartDrawer);
  cartOverlay.addEventListener('click', closeCartDrawer);

  function addToCart(item) {
    const existingIndex = state.cart.findIndex(i => i.id === item.id);
    if (existingIndex > -1 && !item.isCustom) {
      state.cart[existingIndex].quantity += 1;
    } else {
      state.cart.push(item);
    }
    saveCart();
    renderCart();

    if (floatingCartPill) {
      floatingCartPill.classList.remove('cart-pulse');
      void floatingCartPill.offsetWidth;
      floatingCartPill.classList.add('cart-pulse');
    }
  }

  function updateQuantity(itemId, delta) {
    const item = state.cart.find(i => i.id === itemId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      state.cart = state.cart.filter(i => i.id !== itemId);
    }
    saveCart();
    renderCart();
  }

  function saveCart() {
    localStorage.setItem('lasa_cart', JSON.stringify(state.cart));
  }

  function getCartCalculations() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingThreshold = 499;
    const isFreeShipping = subtotal >= shippingThreshold || subtotal === 0;
    const shippingCost = isFreeShipping ? 0 : 50;

    let discount = 0;
    if (state.discountPercent > 0) {
      discount = Math.round(subtotal * state.discountPercent);
    }

    const total = Math.max(0, subtotal - discount + (subtotal > 0 ? shippingCost : 0));
    return { subtotal, shippingThreshold, isFreeShipping, shippingCost, discount, total };
  }

  function renderCart() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadge.textContent = totalCount;
    if (floatingCartCountBadge) floatingCartCountBadge.textContent = totalCount;
    drawerItemCount.textContent = `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`;

    if (state.cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="empty-cart-view">
          <div class="empty-cart-icon">🌸</div>
          <h4 style="font-family: var(--font-serif); font-size: 1.3rem; margin-bottom: 0.5rem;">Your Lasa Bag is Empty</h4>
          <p style="font-size: 0.85rem; max-width: 240px; margin: 0 auto 1.5rem;">Curate your custom 10-piece box or add freshly baked brownies!</p>
          <a href="#box-builder" class="btn btn-outline-sm" id="emptyCartBuildBtn">Curate 10-Piece Box</a>
        </div>
      `;
      const btn = document.getElementById('emptyCartBuildBtn');
      if (btn) {
        btn.addEventListener('click', () => closeCartDrawer());
      }
      checkoutBtn.disabled = true;
      whatsappCheckoutBtn.disabled = true;
    } else {
      checkoutBtn.disabled = false;
      whatsappCheckoutBtn.disabled = false;

      cartItemsList.innerHTML = state.cart.map(item => `
        <div class="cart-item-row">
          <img src="${item.img}" alt="${item.title}" class="cart-item-img">
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.title}</h4>
            <div class="cart-item-sub">${item.subtitle}</div>
            <div class="cart-item-controls">
              <div class="qty-control">
                <button class="qty-btn" data-id="${item.id}" data-delta="-1">−</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
              </div>
              <span class="cart-item-price">₹${(item.price * item.quantity)}</span>
            </div>
          </div>
        </div>
      `).join('');

      cartItemsList.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const delta = parseInt(btn.dataset.delta, 10);
          updateQuantity(id, delta);
        });
      });
    }

    const { subtotal, shippingThreshold, isFreeShipping, shippingCost, discount, total } = getCartCalculations();
    const progressPercent = Math.min(100, (subtotal / shippingThreshold) * 100);

    shippingFill.style.width = `${progressPercent}%`;
    if (subtotal >= shippingThreshold) {
      shippingMeterMsg.innerHTML = `<strong>Free local delivery unlocked!</strong> 🎉`;
      cartShipping.textContent = 'Free (₹0)';
    } else {
      const needed = shippingThreshold - subtotal;
      shippingMeterMsg.textContent = `Add ₹${needed} more for free delivery in Bangalore`;
      cartShipping.textContent = subtotal > 0 ? `₹${shippingCost}` : '₹0';
    }

    cartSubtotal.textContent = `₹${subtotal}`;

    if (discount > 0) {
      discountLine.style.display = 'flex';
      cartDiscount.textContent = `-₹${discount}`;
    } else {
      discountLine.style.display = 'none';
    }

    cartTotal.textContent = `₹${total}`;
    if (floatingCartTotal) floatingCartTotal.textContent = `₹${total}`;
  }

  // Promo code engine
  applyPromoBtn.addEventListener('click', () => {
    const code = promoInput.value.trim().toUpperCase();
    if (code === 'LASA10') {
      state.discountPercent = 0.10;
      state.promoCodeApplied = code;
      promoFeedback.className = 'promo-feedback success';
      promoFeedback.textContent = 'Lasa welcome code applied: 10% off!';
      renderCart();
      showToast('10% discount applied to your order!');
    } else if (code === 'PLEASANT') {
      state.discountPercent = 0.15;
      state.promoCodeApplied = code;
      promoFeedback.className = 'promo-feedback success';
      promoFeedback.textContent = 'Privilege voucher applied: 15% off!';
      renderCart();
      showToast('15% discount applied!');
    } else if (code === '') {
      promoFeedback.textContent = '';
    } else {
      promoFeedback.className = 'promo-feedback error';
      promoFeedback.textContent = 'Invalid promo code. Try LASA10.';
    }
  });

  // Compulsory Customer Contact Details for WhatsApp Orders
  const custName = document.getElementById('custName');
  const custPhone = document.getElementById('custPhone');
  const custEmail = document.getElementById('custEmail');
  const custNameErr = document.getElementById('custNameErr');
  const custPhoneErr = document.getElementById('custPhoneErr');
  const custEmailErr = document.getElementById('custEmailErr');
  const summaryCustName = document.getElementById('summaryCustName');
  const summaryCustPhone = document.getElementById('summaryCustPhone');
  const summaryCustEmail = document.getElementById('summaryCustEmail');

  function loadSavedCustomerInfo() {
    try {
      const saved = JSON.parse(localStorage.getItem('lasa_customer_info')) || {};
      if (custName && saved.name) custName.value = saved.name;
      if (custPhone && saved.phone) custPhone.value = saved.phone;
      if (custEmail && saved.email) custEmail.value = saved.email;
    } catch (e) {
      console.error(e);
    }
  }

  function validateCustomerDetails() {
    let isValid = true;
    const nameVal = custName ? custName.value.trim() : '';
    const phoneVal = custPhone ? custPhone.value.trim() : '';
    const emailVal = custEmail ? custEmail.value.trim() : '';

    // 1. Full Name (compulsory, min 2 characters)
    if (!nameVal || nameVal.length < 2) {
      isValid = false;
      if (custName) custName.classList.add('cust-field-error');
      if (custNameErr) {
        custNameErr.textContent = 'Please enter your full name (compulsory).';
        custNameErr.classList.add('visible');
      }
    } else {
      if (custName) custName.classList.remove('cust-field-error');
      if (custNameErr) custNameErr.classList.remove('visible');
    }

    // 2. WhatsApp Number (compulsory, at least 10 digits)
    const digitsOnly = phoneVal.replace(/\D/g, '');
    if (!phoneVal || digitsOnly.length < 10) {
      isValid = false;
      if (custPhone) custPhone.classList.add('cust-field-error');
      if (custPhoneErr) {
        custPhoneErr.textContent = 'Please enter a valid 10-digit WhatsApp number (compulsory).';
        custPhoneErr.classList.add('visible');
      }
    } else {
      if (custPhone) custPhone.classList.remove('cust-field-error');
      if (custPhoneErr) custPhoneErr.classList.remove('visible');
    }

    // 3. Gmail ID / Email (compulsory, valid email format)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      isValid = false;
      if (custEmail) custEmail.classList.add('cust-field-error');
      if (custEmailErr) {
        custEmailErr.textContent = 'Please enter a valid Gmail ID / email address (compulsory).';
        custEmailErr.classList.add('visible');
      }
    } else {
      if (custEmail) custEmail.classList.remove('cust-field-error');
      if (custEmailErr) custEmailErr.classList.remove('visible');
    }

    if (!isValid) {
      if (custName && custName.classList.contains('cust-field-error')) {
        custName.focus();
      } else if (custPhone && custPhone.classList.contains('cust-field-error')) {
        custPhone.focus();
      } else if (custEmail && custEmail.classList.contains('cust-field-error')) {
        custEmail.focus();
      }

      const cartCustomerDetails = document.getElementById('cartCustomerDetails');
      if (cartCustomerDetails) {
        cartCustomerDetails.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      showToast('⚠️ Full Name, WhatsApp Number & Gmail ID are compulsory to order.');
    } else {
      try {
        localStorage.setItem('lasa_customer_info', JSON.stringify({
          name: nameVal,
          phone: phoneVal,
          email: emailVal
        }));
      } catch (e) {}
    }

    return isValid;
  }

  // Clear errors when typing
  [custName, custPhone, custEmail].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        input.classList.remove('cust-field-error');
        const errEl = document.getElementById(input.id + 'Err');
        if (errEl) errEl.classList.remove('visible');
      });
    }
  });

  // Direct WhatsApp Order Generator (Includes Compulsory Customer Details)
  function generateWhatsAppOrderUrl() {
    if (state.cart.length === 0) return '#';

    const nameVal = custName ? custName.value.trim() : '';
    const phoneVal = custPhone ? custPhone.value.trim() : '';
    const emailVal = custEmail ? custEmail.value.trim() : '';

    const { subtotal, discount, total } = getCartCalculations();
    let text = `🌸 *LASA CHOCOLATES & BAKERS — NEW ORDER* 🌸\n\n`;
    text += `👤 *CUSTOMER DETAILS (COMPULSORY):*\n`;
    text += `• *Full Name:* ${nameVal || 'Not provided'}\n`;
    text += `• *WhatsApp Number:* ${phoneVal || 'Not provided'}\n`;
    text += `• *Gmail ID:* ${emailVal || 'Not provided'}\n\n`;

    text += `────────────────\n`;
    text += `🛍️ *BAG ITEMS ORDERED:*\n`;
    state.cart.forEach((item, idx) => {
      text += `\n${idx + 1}. *${item.title}* (${item.subtitle})\n   Qty: ${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}`;
    });

    text += `\n\n────────────────\n`;
    text += `Subtotal: ₹${subtotal}\n`;
    if (discount > 0) {
      text += `Discount (${state.promoCodeApplied}): -₹${discount}\n`;
    }
    text += `*Final Amount Payable: ₹${total}*\n\n`;
    text += `📍 Bangalore Atelier\n`;
    text += `Please confirm order availability and share payment instructions. Thank you! 💖`;

    return `https://wa.me/19035653901?text=${encodeURIComponent(text)}`;
  }

  // Checkout Execution with Compulsory Validation
  const orderSuccessOverlay = document.getElementById('orderSuccessOverlay');
  const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');
  const continueShoppingBtn = document.getElementById('continueShoppingBtn');
  const orderRefNumber = document.getElementById('orderRefNumber');
  const orderedBoxSummary = document.getElementById('orderedBoxSummary');
  const orderSuccessWhatsappBtn = document.getElementById('orderSuccessWhatsappBtn');

  function executeOrderCheckout(openWhatsAppImmediately = true) {
    if (state.cart.length === 0) return;
    if (!validateCustomerDetails()) return;

    const nameVal = custName ? custName.value.trim() : '';
    const phoneVal = custPhone ? custPhone.value.trim() : '';
    const emailVal = custEmail ? custEmail.value.trim() : '';

    const randomRef = 'LASA-' + Math.floor(100000 + Math.random() * 900000);
    orderRefNumber.textContent = randomRef;

    // Display customer details after sending in the summary modal
    if (summaryCustName) summaryCustName.textContent = nameVal;
    if (summaryCustPhone) summaryCustPhone.textContent = phoneVal;
    if (summaryCustEmail) summaryCustEmail.textContent = emailVal;

    const whatsappUrl = generateWhatsAppOrderUrl();
    orderSuccessWhatsappBtn.href = whatsappUrl;

    const { total } = getCartCalculations();
    orderedBoxSummary.innerHTML = `
      <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1.25rem; margin: 1.25rem 0; text-align: left;">
        <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-gold); font-weight: 600;">Items Ordered</span>
        <ul style="list-style: none; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
          ${state.cart.map(i => `<li>• ${i.quantity}x ${i.title} (₹${i.price * i.quantity})</li>`).join('')}
        </ul>
        <div style="margin-top: 0.75rem; border-top: 1px dashed var(--border-light); padding-top: 0.5rem; font-weight: 600; color: var(--text-primary);">
          Total: ₹${total}
        </div>
      </div>
    `;

    if (openWhatsAppImmediately) {
      window.open(whatsappUrl, '_blank');
    }

    state.cart = [];
    saveCart();
    renderCart();
    closeCartDrawer();

    orderSuccessOverlay.classList.add('active');
    showToast(`Order sent to WhatsApp! Thank you ${nameVal}! 🌸`, 'success');
  }

  whatsappCheckoutBtn.addEventListener('click', () => executeOrderCheckout(true));
  checkoutBtn.addEventListener('click', () => executeOrderCheckout(true));

  function closeSuccessModal() {
    orderSuccessOverlay.classList.remove('active');
  }

  closeSuccessModalBtn.addEventListener('click', closeSuccessModal);
  continueShoppingBtn.addEventListener('click', closeSuccessModal);
  orderSuccessOverlay.addEventListener('click', (e) => {
    if (e.target === orderSuccessOverlay) closeSuccessModal();
  });

  // Newsletter
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterEmail = document.getElementById('newsletterEmail');

  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = newsletterEmail.value.trim();
    if (!email) return;

    showToast(`Welcome! Your 10% code LASA10 has been applied to your bag. 🫂`, 'success');
    state.discountPercent = 0.10;
    state.promoCodeApplied = 'LASA10';
    promoInput.value = 'LASA10';
    renderCart();
    newsletterEmail.value = '';
  });

  // Toast
  const toastContainer = document.getElementById('toastContainer');
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span>🌸</span>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3600);
  }

  // ==========================================
  // IN-BROWSER VISUAL LIVE EDITOR (PROTECTED BY PASSWORD 3004)
  // ==========================================

  const OWNER_PASSWORD = '3004';

  const editorToggleBtn = document.getElementById('editorToggleBtn');
  const editorBtnText = document.getElementById('editorBtnText');
  const editorFloatingBar = document.getElementById('editorFloatingBar');
  const editorSaveBtn = document.getElementById('editorSaveBtn');
  const editorExportBtn = document.getElementById('editorExportBtn');
  const editorResetBtn = document.getElementById('editorResetBtn');
  const editorLockBtn = document.getElementById('editorLockBtn');
  const editorAddProductBtn = document.getElementById('editorAddProductBtn');
  const addNewProductBtn = document.getElementById('addNewProductBtn');
  const editorCloudSyncBtn = document.getElementById('editorCloudSyncBtn');

  // Cloud Database Sync Modal Elements
  const cloudSyncModalOverlay = document.getElementById('cloudSyncModalOverlay');
  const closeCloudSyncBtn = document.getElementById('closeCloudSyncBtn');
  const doneCloudSyncBtn = document.getElementById('doneCloudSyncBtn');
  const cloudStatusBadge = document.getElementById('cloudStatusBadge');
  const cloudStatusDot = document.getElementById('cloudStatusDot');
  const cloudStatusText = document.getElementById('cloudStatusText');
  const cloudStatusDetail = document.getElementById('cloudStatusDetail');
  const firebaseDbUrlInput = document.getElementById('firebaseDbUrlInput');
  const saveAndTestCloudBtn = document.getElementById('saveAndTestCloudBtn');
  const disconnectCloudBtn = document.getElementById('disconnectCloudBtn');
  const cloudPermanentCodeBox = document.getElementById('cloudPermanentCodeBox');
  const firebaseCopySnippet = document.getElementById('firebaseCopySnippet');
  const copySnippetBtn = document.getElementById('copySnippetBtn');

  // Password Authentication Modal Elements
  const editorAuthModalOverlay = document.getElementById('editorAuthModalOverlay');
  const closeEditorAuthBtn = document.getElementById('closeEditorAuthBtn');
  const cancelEditorAuthBtn = document.getElementById('cancelEditorAuthBtn');
  const submitEditorAuthBtn = document.getElementById('submitEditorAuthBtn');
  const editorPasswordInput = document.getElementById('editorPasswordInput');
  const editorAuthError = document.getElementById('editorAuthError');
  const togglePasswordVisibilityBtn = document.getElementById('togglePasswordVisibilityBtn');

  // FESTIVAL MODES ENGINE (Pongal, Dasara, Diwali, Christmas)
  const FESTIVAL_CONFIG = {
    pongal: {
      name: 'Pongal',
      tag: '🪁 Pongal',
      toast: 'Pongal mode active! Tiny kites will fly across the page & around clicked buttons 🪁🌾',
      icons: ['🪁', '🪁', '🪁', '🌾', '✨'],
      particleSize: '16px'
    },
    dasara: {
      name: 'Dasara',
      tag: '🏹 Dasara',
      toast: 'Dasara mode active! Golden marigolds and festive sparks will flutter 🌼🏹',
      icons: ['🌼', '🏹', '🌼', '✨', '🌸'],
      particleSize: '15px'
    },
    diwali: {
      name: 'Diwali',
      tag: '🪔 Diwali',
      toast: 'Diwali mode active! Glowing diyas and sparkles will glow 🪔✨',
      icons: ['🪔', '✨', '🪔', '🎇', '⭐'],
      particleSize: '15px'
    },
    christmas: {
      name: 'Christmas',
      tag: '🎄 Christmas',
      toast: 'Christmas mode active! Tiny snowflakes and bells will drift ❄️🔔',
      icons: ['❄️', '🔔', '❄️', '⭐', '✨'],
      particleSize: '15px'
    }
  };

  // Set & Activate Festival Theme across all devices
  function setFestivalTheme(festivalName, andSave = true) {
    state.activeFestival = festivalName || 'none';

    // Update buttons in floating bar
    document.querySelectorAll('.btn-festival-toggle').forEach(btn => {
      if (btn.getAttribute('data-festival') === state.activeFestival) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update status badge
    const badge = document.getElementById('activeFestivalStatusBadge');
    if (badge) {
      if (state.activeFestival === 'none') {
        badge.textContent = 'Festive: Off';
        badge.style.background = 'rgba(122, 154, 139, 0.15)';
      } else {
        const cfg = FESTIVAL_CONFIG[state.activeFestival];
        badge.textContent = `Theme: ${cfg ? cfg.tag : state.activeFestival}`;
        badge.style.background = 'rgba(197, 159, 85, 0.25)';
      }
    }

    if (andSave) {
      localStorage.setItem('lasa_active_festival', state.activeFestival);
      syncFestivalToServer(state.activeFestival);
      if (state.activeFestival !== 'none') {
        const cfg = FESTIVAL_CONFIG[state.activeFestival];
        showToast(cfg ? cfg.toast : `Festival mode set to ${state.activeFestival}! 🎊`, 'success');
        triggerInitialFestivalDisplay(state.activeFestival);
      } else {
        showToast('Festival mode turned off. Standard theme restored.');
      }
    }
  }

  // Quick sync of active festival to cloud & server
  async function syncFestivalToServer(festival) {
    try {
      const savedText = JSON.parse(localStorage.getItem('lasa_text_edits')) || {};
      const savedImgs = JSON.parse(localStorage.getItem('lasa_image_edits')) || {};
      const payload = {
        textEdits: savedText,
        imgEdits: savedImgs,
        activeFestival: festival,
        customProducts: userProducts,
        deletedProductIds: deletedProductIds,
        cloudDbUrl: localStorage.getItem('lasa_cloud_db_url') || DEFAULT_FIREBASE_URL || '',
        updatedAt: new Date().toISOString()
      };
      await saveToCloud(payload);
      await fetch('/api/save-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch(e) {}
  }

  // 1. Initial 5-Second Festival Display on First Page Without Clicking
  function triggerInitialFestivalDisplay(festivalKey) {
    if (!festivalKey || festivalKey === 'none') return;
    const cfg = FESTIVAL_CONFIG[festivalKey];
    if (!cfg) return;

    const container = document.getElementById('festivalOverlayContainer') || document.body;
    container.innerHTML = '';

    const count = 12; // 12 tiny particles
    const viewportWidth = window.innerWidth;
    const viewportHeight = Math.min(window.innerHeight, 720);

    const particles = [];

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'festival-particle festival-initial-particle';
      const icon = cfg.icons[i % cfg.icons.length];
      p.textContent = icon;
      p.style.fontSize = cfg.particleSize || '16px';

      // Random starting coordinates on lower half of 1st screen
      const startX = Math.random() * (viewportWidth - 50);
      const startY = (viewportHeight * 0.4) + Math.random() * (viewportHeight * 0.5);

      p.style.left = `${startX}px`;
      p.style.top = `${startY}px`;

      // Set gentle 5-second drift variables
      p.style.setProperty('--drift-x1', `${(Math.random() - 0.5) * 60}px`);
      p.style.setProperty('--drift-y1', `${-30 - Math.random() * 40}px`);
      p.style.setProperty('--rot1', `${(Math.random() - 0.5) * 35}deg`);

      p.style.setProperty('--drift-x2', `${(Math.random() - 0.5) * 90}px`);
      p.style.setProperty('--drift-y2', `${-80 - Math.random() * 60}px`);
      p.style.setProperty('--rot2', `${(Math.random() - 0.5) * 50}deg`);

      p.style.setProperty('--drift-x3', `${(Math.random() - 0.5) * 120}px`);
      p.style.setProperty('--drift-y3', `${-140 - Math.random() * 80}px`);
      p.style.setProperty('--rot3', `${(Math.random() - 0.5) * 60}deg`);

      p.style.setProperty('--drift-x4', `${(Math.random() - 0.5) * 150}px`);
      p.style.setProperty('--drift-y4', `${-210 - Math.random() * 100}px`);
      p.style.setProperty('--rot4', `${(Math.random() - 0.5) * 70}deg`);

      p.style.animationDelay = `${(i * 0.2).toFixed(2)}s`;

      container.appendChild(p);
      particles.push(p);
    }

    // Automatically remove after 5.5 seconds (leaving the page clean)
    setTimeout(() => {
      particles.forEach(p => {
        if (p && p.parentNode) p.parentNode.removeChild(p);
      });
    }, 5500);
  }

  // 2. Button Click Tiny Particles Burst (kites / symbols fly around clicked button)
  function triggerButtonFestivalBurst(targetElement, event) {
    if (!state.activeFestival || state.activeFestival === 'none') return;
    const cfg = FESTIVAL_CONFIG[state.activeFestival];
    if (!cfg) return;

    const rect = targetElement.getBoundingClientRect();
    const cx = (event && event.clientX) ? event.clientX : (rect.left + rect.width / 2);
    const cy = (event && event.clientY) ? event.clientY : (rect.top + rect.height / 2);

    const container = document.getElementById('festivalOverlayContainer') || document.body;
    const burstCount = 6; // strictly 6 tiny particles

    for (let i = 0; i < burstCount; i++) {
      const p = document.createElement('div');
      p.className = 'festival-particle festival-btn-particle';
      const icon = cfg.icons[i % cfg.icons.length];
      p.textContent = icon;
      p.style.fontSize = '15px'; // tiny size

      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;

      // Distribute in a ring around the button
      const angle = (i / burstCount) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      const distance = 30 + Math.random() * 32;

      const burstX = Math.cos(angle) * distance;
      const burstY = Math.sin(angle) * distance - 12;
      const burstRot = (Math.random() - 0.5) * 60;

      p.style.setProperty('--burst-x', `${burstX.toFixed(1)}px`);
      p.style.setProperty('--burst-y', `${burstY.toFixed(1)}px`);
      p.style.setProperty('--burst-rot', `${burstRot.toFixed(1)}deg`);

      p.style.animationDelay = `${(Math.random() * 0.08).toFixed(2)}s`;

      container.appendChild(p);

      setTimeout(() => {
        if (p && p.parentNode) p.parentNode.removeChild(p);
      }, 1300);
    }
  }

  // ==========================================
  // CLOUD DATABASE SYNC ENGINE (Firebase Realtime DB REST API)
  // ==========================================

  function formatFirebaseUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    let url = rawUrl.trim();
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    url = url.replace(/\/+$/, '');
    if (url.endsWith('/lasa_atelier.json')) return url;
    if (url.endsWith('.json')) return url;
    return `${url}/lasa_atelier.json`;
  }

  function getCloudDbUrl() {
    const local = localStorage.getItem('lasa_cloud_db_url');
    if (local && local.trim()) return formatFirebaseUrl(local);
    if (DEFAULT_FIREBASE_URL && DEFAULT_FIREBASE_URL.trim()) return formatFirebaseUrl(DEFAULT_FIREBASE_URL);
    if (window.__LASA_CLOUD_DB_URL && window.__LASA_CLOUD_DB_URL.trim()) return formatFirebaseUrl(window.__LASA_CLOUD_DB_URL);
    return null;
  }

  function getCloudBaseUrl() {
    const full = getCloudDbUrl();
    if (!full) return '';
    return full.replace(/\/lasa_atelier\.json$/, '').replace(/\.json$/, '');
  }

  // Save full state payload to Firebase Cloud (Firestore & Realtime Database)
  async function saveToCloud(customPayload = null) {
    let payload = customPayload;
    if (!payload) {
      const textEdits = {};
      document.querySelectorAll('[data-editable]').forEach(el => {
        const key = el.getAttribute('data-editable');
        if (key) textEdits[key] = el.innerHTML;
      });
      const imgEdits = {};
      document.querySelectorAll('img[data-img-key]').forEach(img => {
        const key = img.getAttribute('data-img-key');
        if (key) imgEdits[key] = img.src;
      });
      payload = {
        textEdits,
        imgEdits,
        productOverrides,
        bonbonOverrides,
        boxPriceOverrides,
        activeFestival: state.activeFestival || 'none',
        customProducts: userProducts,
        deletedProductIds: deletedProductIds,
        cloudDbUrl: localStorage.getItem('lasa_cloud_db_url') || DEFAULT_FIREBASE_URL || '',
        updatedAt: new Date().toISOString()
      };
    }

    let saved = false;

    // 1. Cloud Firestore (Official SDK)
    if (firestoreDb) {
      try {
        await firestoreDb.collection('lasa_settings').doc('atelier').set(payload, { merge: true });
        saved = true;
      } catch (err) {
        console.warn('Firestore write notice:', err);
        if (err && (err.code === 'permission-denied' || (err.message && err.message.includes('permission')))) {
          window.__LASA_FIRESTORE_PERMISSION_DENIED = true;
        }
      }
    }

    // 2. Realtime Database (Official SDK)
    if (realtimeDb) {
      try {
        await realtimeDb.ref('lasa_atelier').set(payload);
        saved = true;
      } catch (err) {
        console.warn('Realtime DB write notice:', err);
      }
    }

    // 3. REST API Fallback
    const cloudUrl = getCloudDbUrl();
    if (cloudUrl) {
      try {
        const res = await fetch(cloudUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) saved = true;
      } catch (err) {}
    }

    return saved;
  }

  // Apply synchronized data payload to DOM and state
  function applySynchronizedData(data) {
    if (!data || typeof data !== 'object') return;
    if (data.textEdits && Object.keys(data.textEdits).length > 0) {
      applyTextEdits(data.textEdits);
      localStorage.setItem('lasa_text_edits', JSON.stringify(data.textEdits));
    }
    if (data.imgEdits && Object.keys(data.imgEdits).length > 0) {
      applyImageEdits(data.imgEdits);
      localStorage.setItem('lasa_image_edits', JSON.stringify(data.imgEdits));
    }
    if (data.productOverrides && typeof data.productOverrides === 'object') {
      productOverrides = Object.assign({}, productOverrides, data.productOverrides);
      localStorage.setItem('lasa_product_overrides', JSON.stringify(productOverrides));
    }
    if (data.bonbonOverrides && typeof data.bonbonOverrides === 'object') {
      bonbonOverrides = Object.assign({}, bonbonOverrides, data.bonbonOverrides);
      localStorage.setItem('lasa_bonbon_overrides', JSON.stringify(bonbonOverrides));
      BONBONS = getMergedBonbons();
      renderPickerBonbons();
      renderBoxSlots();
    }
    if (data.boxPriceOverrides && typeof data.boxPriceOverrides === 'object') {
      boxPriceOverrides = Object.assign({}, boxPriceOverrides, data.boxPriceOverrides);
      localStorage.setItem('lasa_box_prices', JSON.stringify(boxPriceOverrides));
      updateSizeTabsPriceDisplay();
    }
    if (data.activeFestival !== undefined) {
      setFestivalTheme(data.activeFestival, false);
      localStorage.setItem('lasa_active_festival', data.activeFestival);
    }
    if (data.deletedProductIds) {
      deletedProductIds = data.deletedProductIds;
      localStorage.setItem('lasa_deleted_products', JSON.stringify(deletedProductIds));
    }
    if (data.customProducts) {
      userProducts = data.customProducts;
      localStorage.setItem('lasa_custom_products', JSON.stringify(userProducts));
    }
    
    // Dynamically update catalogue with merged overrides & products
    PRODUCTS = getMergedProducts();
    const activePill = document.querySelector('#collectionFilterPills .filter-pill.active');
    renderProducts(activePill ? activePill.dataset.filter : 'all');

    if (data.cloudDbUrl && !localStorage.getItem('lasa_cloud_db_url')) {
      window.__LASA_CLOUD_DB_URL = data.cloudDbUrl;
    }
  }

  // Load saved text and image edits (Instant Local + Cloud Sync for all devices)
  async function loadSavedTextEdits() {
    // 1. Instant local load (zero flash)
    try {
      const savedOverrides = JSON.parse(localStorage.getItem('lasa_product_overrides')) || {};
      if (Object.keys(savedOverrides).length > 0) {
        productOverrides = Object.assign({}, productOverrides, savedOverrides);
        PRODUCTS = getMergedProducts();
        renderProducts('all');
      }
      const savedBonbons = JSON.parse(localStorage.getItem('lasa_bonbon_overrides')) || {};
      if (Object.keys(savedBonbons).length > 0) {
        bonbonOverrides = Object.assign({}, bonbonOverrides, savedBonbons);
        BONBONS = getMergedBonbons();
        renderPickerBonbons();
        renderBoxSlots();
      }
      const savedPrices = JSON.parse(localStorage.getItem('lasa_box_prices')) || {};
      if (Object.keys(savedPrices).length > 0) {
        boxPriceOverrides = Object.assign({}, boxPriceOverrides, savedPrices);
        updateSizeTabsPriceDisplay();
      }
      const saved = JSON.parse(localStorage.getItem('lasa_text_edits')) || {};
      applyTextEdits(saved);
      const savedImgs = JSON.parse(localStorage.getItem('lasa_image_edits')) || {};
      applyImageEdits(savedImgs);
      const savedFest = localStorage.getItem('lasa_active_festival') || 'none';
      setFestivalTheme(savedFest, false);
    } catch(e) {}

    let loadedFromCloud = false;

    // 2. Fetch from Cloud Firestore (Real-time live multi-device listener)
    if (firestoreDb) {
      try {
        const docSnap = await firestoreDb.collection('lasa_settings').doc('atelier').get();
        if (docSnap.exists) {
          applySynchronizedData(docSnap.data());
          loadedFromCloud = true;
        }

        // Setup real-time snapshot listener: when owner edits on one device, others update dynamically!
        firestoreDb.collection('lasa_settings').doc('atelier').onSnapshot((snap) => {
          if (snap && snap.exists) {
            applySynchronizedData(snap.data());
          }
        }, (err) => {
          console.warn('Firestore live listener notice:', err);
        });
      } catch (err) {
        console.warn('Firestore load notice:', err);
        if (err && (err.code === 'permission-denied' || (err.message && err.message.includes('permission')))) {
          window.__LASA_FIRESTORE_PERMISSION_DENIED = true;
        }
      }
    }

    // 3. Fetch from Realtime Database SDK
    if (!loadedFromCloud && realtimeDb) {
      try {
        const snap = await realtimeDb.ref('lasa_atelier').once('value');
        if (snap.exists()) {
          applySynchronizedData(snap.val());
          loadedFromCloud = true;
        }
        realtimeDb.ref('lasa_atelier').on('value', (s) => {
          if (s.exists()) applySynchronizedData(s.val());
        });
      } catch (err) {}
    }

    // 4. Fallback to Firebase REST API
    if (!loadedFromCloud) {
      const cloudUrl = getCloudDbUrl();
      if (cloudUrl) {
        try {
          const cloudRes = await fetch(cloudUrl + '?t=' + Date.now());
          if (cloudRes.ok) {
            const cloudData = await cloudRes.json();
            if (cloudData && typeof cloudData === 'object') {
              applySynchronizedData(cloudData);
              loadedFromCloud = true;
            }
          }
        } catch (err) {}
      }
    }

    // 5. Fallback to static content-edits.json
    if (!loadedFromCloud) {
      try {
        const res = await fetch('content-edits.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          applySynchronizedData(data);
        }
      } catch(e) {}
    }

    // Trigger initial 5-second festival greeting if active
    if (state.activeFestival && state.activeFestival !== 'none') {
      triggerInitialFestivalDisplay(state.activeFestival);
    }
  }

  function applyTextEdits(edits) {
    if (!edits) return;
    Object.keys(edits).forEach(key => {
      const el = document.querySelector(`[data-editable="${key}"]`);
      if (el) el.innerHTML = edits[key];
    });
  }

  function applyImageEdits(imgs) {
    if (!imgs) return;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    Object.keys(imgs).forEach(key => {
      let src = imgs[key];
      if (!isLocalhost && src && src.includes('localhost:')) {
        return; // Ignore invalid localhost URLs on live domains / GitHub Pages
      }
      const img = document.querySelector(`img[data-img-key="${key}"]`);
      if (img && src) img.src = src;
    });
  }

  // Save all edits (Syncs to Cloud and local server so all devices see the changes)
  async function saveAllEdits() {
    const textEdits = {};
    document.querySelectorAll('[data-editable]').forEach(el => {
      const key = el.getAttribute('data-editable');
      if (key) textEdits[key] = el.innerHTML;
    });
    localStorage.setItem('lasa_text_edits', JSON.stringify(textEdits));

    const imgEdits = {};
    document.querySelectorAll('img[data-img-key]').forEach(img => {
      const key = img.getAttribute('data-img-key');
      if (key) imgEdits[key] = img.src;
    });
    localStorage.setItem('lasa_image_edits', JSON.stringify(imgEdits));

    const payload = { 
      textEdits, 
      imgEdits, 
      productOverrides,
      bonbonOverrides,
      boxPriceOverrides,
      activeFestival: state.activeFestival || 'none',
      customProducts: userProducts,
      deletedProductIds: deletedProductIds,
      cloudDbUrl: localStorage.getItem('lasa_cloud_db_url') || DEFAULT_FIREBASE_URL || '',
      updatedAt: new Date().toISOString() 
    };

    // 1. Sync to Firebase Cloud Database
    const cloudSynced = await saveToCloud(payload);

    // 2. Persist to local server (if running node server.js locally)
    let serverSynced = false;
    try {
      const res = await fetch('/api/save-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) serverSynced = true;
    } catch (err) {
      // Expected when hosted statically on GitHub Pages
    }

    if (cloudSynced) {
      showToast('All edits & festival theme synced to Cloud! Visible on all devices ☁️✨', 'success');
    } else if (serverSynced) {
      showToast('All edits & festival theme saved across all devices! 🌐✨', 'success');
    } else {
      showToast('All your edits have been saved locally! 💾 Connect Cloud Sync to reflect on other devices.', 'info');
    }
  }

  // Password Auth Functions
  function openAuthModal() {
    if (editorAuthError) editorAuthError.classList.remove('visible');
    if (editorPasswordInput) {
      editorPasswordInput.value = '';
      editorPasswordInput.type = 'password';
      editorPasswordInput.classList.remove('input-error');
    }
    if (togglePasswordVisibilityBtn) togglePasswordVisibilityBtn.textContent = '👁️';
    if (editorAuthModalOverlay) editorAuthModalOverlay.classList.add('active');
    setTimeout(() => {
      if (editorPasswordInput) editorPasswordInput.focus();
    }, 120);
  }

  function closeAuthModal() {
    if (editorAuthModalOverlay) editorAuthModalOverlay.classList.remove('active');
    if (editorPasswordInput) {
      editorPasswordInput.value = '';
      editorPasswordInput.classList.remove('input-error');
    }
    if (editorAuthError) editorAuthError.classList.remove('visible');
  }

  function verifyPassword() {
    if (!editorPasswordInput) return;
    const entered = editorPasswordInput.value.trim();

    if (entered === OWNER_PASSWORD) {
      closeAuthModal();
      enableLiveEditMode();
      showToast('Welcome back Lakshitha! Edit Mode unlocked 🔓', 'success');
    } else {
      if (editorAuthError) editorAuthError.classList.add('visible');
      editorPasswordInput.classList.add('input-error');

      const modalWindow = editorAuthModalOverlay ? editorAuthModalOverlay.querySelector('.modal-window') : null;
      if (modalWindow) {
        modalWindow.classList.add('shake-animation');
        setTimeout(() => modalWindow.classList.remove('shake-animation'), 450);
      }

      editorPasswordInput.focus();
      editorPasswordInput.select();
    }
  }

  function enableLiveEditMode() {
    state.isEditMode = true;
    document.body.classList.add('edit-mode-active');
    if (editorFloatingBar) editorFloatingBar.classList.add('active');
    if (editorToggleBtn) editorToggleBtn.classList.add('active');
    if (editorBtnText) editorBtnText.textContent = '🔓 Lock & Exit';
    if (addNewProductBtn) addNewProductBtn.style.display = 'inline-flex';

    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'true';
    });
  }

  function disableLiveEditMode(andSave = true) {
    state.isEditMode = false;
    document.body.classList.remove('edit-mode-active');
    if (editorFloatingBar) editorFloatingBar.classList.remove('active');
    if (editorToggleBtn) editorToggleBtn.classList.remove('active');
    if (editorBtnText) editorBtnText.textContent = '🔒 Edit Mode';
    if (addNewProductBtn) addNewProductBtn.style.display = 'none';

    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'false';
    });

    if (andSave) {
      saveAllEdits();
    }
  }

  // Toggle button click handler
  if (editorToggleBtn) {
    editorToggleBtn.addEventListener('click', () => {
      if (state.isEditMode) {
        disableLiveEditMode(true);
        showToast('Edit Mode locked and all edits saved. 🔒');
      } else {
        openAuthModal();
      }
    });
  }

  // Lock button in floating bar
  if (editorLockBtn) {
    editorLockBtn.addEventListener('click', () => {
      disableLiveEditMode(true);
      showToast('Edit Mode locked! Password is required to access again. 🔒');
    });
  }

  // Password Visibility Toggle
  if (togglePasswordVisibilityBtn && editorPasswordInput) {
    togglePasswordVisibilityBtn.addEventListener('click', () => {
      const isPwd = editorPasswordInput.type === 'password';
      editorPasswordInput.type = isPwd ? 'text' : 'password';
      togglePasswordVisibilityBtn.textContent = isPwd ? '🙈' : '👁️';
    });
  }

  // Auth Modal controls
  if (closeEditorAuthBtn) closeEditorAuthBtn.addEventListener('click', closeAuthModal);
  if (cancelEditorAuthBtn) cancelEditorAuthBtn.addEventListener('click', closeAuthModal);
  if (submitEditorAuthBtn) submitEditorAuthBtn.addEventListener('click', verifyPassword);

  if (editorPasswordInput) {
    editorPasswordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        verifyPassword();
      } else if (e.key === 'Escape') {
        closeAuthModal();
      }
    });

    editorPasswordInput.addEventListener('input', () => {
      if (editorAuthError) editorAuthError.classList.remove('visible');
      editorPasswordInput.classList.remove('input-error');
    });
  }

  if (editorAuthModalOverlay) {
    editorAuthModalOverlay.addEventListener('click', (e) => {
      if (e.target === editorAuthModalOverlay) closeAuthModal();
    });
  }
  editorSaveBtn.addEventListener('click', saveAllEdits);

  editorResetBtn.addEventListener('click', () => {
    if (confirm('Reset all your customized texts, images, and restored products back to original?')) {
      localStorage.removeItem('lasa_text_edits');
      localStorage.removeItem('lasa_image_edits');
      localStorage.removeItem('lasa_custom_products');
      localStorage.removeItem('lasa_deleted_products');
      localStorage.removeItem('lasa_active_festival');
      location.reload();
    }
  });

  // Export HTML with user edits baked in
  editorExportBtn.addEventListener('click', () => {
    saveAllEdits();
    // Clone document
    const clone = document.documentElement.cloneNode(true);
    // Remove editor-floating-bar active state in clone
    const floatingBar = clone.querySelector('#editorFloatingBar');
    if (floatingBar) floatingBar.classList.remove('active');
    clone.classList.remove('edit-mode-active');
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

    const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lasa-chocolates-website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Webpage exported! You can save and host this file anywhere.');
  });

  // Image replacement modal
  const imageEditModalOverlay = document.getElementById('imageEditModalOverlay');
  const closeImageEditBtn = document.getElementById('closeImageEditBtn');
  const cancelImageBtn = document.getElementById('cancelImageBtn');
  const applyImageBtn = document.getElementById('applyImageBtn');
  const imageFileInput = document.getElementById('imageFileInput');
  const imageUrlInput = document.getElementById('imageUrlInput');

  function bindImageEditEvents() {
    document.querySelectorAll('img.editable-image').forEach(img => {
      img.removeEventListener('click', onImageClick);
      img.addEventListener('click', onImageClick);
    });
  }

  function onImageClick(e) {
    if (!state.isEditMode) return;
    const img = e.currentTarget;
    state.activeEditingImageKey = img.getAttribute('data-img-key') || img.id;
    imageUrlInput.value = img.src.startsWith('data:') ? '' : img.src;
    imageFileInput.value = '';
    imageEditModalOverlay.classList.add('active');
  }

  function closeImageModal() {
    imageEditModalOverlay.classList.remove('active');
    state.activeEditingImageKey = null;
  }

  closeImageEditBtn.addEventListener('click', closeImageModal);
  cancelImageBtn.addEventListener('click', closeImageModal);
  imageEditModalOverlay.addEventListener('click', (e) => {
    if (e.target === imageEditModalOverlay) closeImageModal();
  });

  function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  applyImageBtn.addEventListener('click', async () => {
    const key = state.activeEditingImageKey;
    if (!key) return;

    const targetImg = document.querySelector(`img[data-img-key="${key}"]`) || document.getElementById(key);

    let newImgSrc = '';

    if (imageFileInput.files && imageFileInput.files[0]) {
      try {
        newImgSrc = await compressImage(imageFileInput.files[0], 650, 650, 0.72);
      } catch (err) {
        newImgSrc = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (re) => resolve(re.target.result);
          reader.readAsDataURL(imageFileInput.files[0]);
        });
      }
    } else if (imageUrlInput.value.trim()) {
      newImgSrc = imageUrlInput.value.trim();
    }

    if (newImgSrc) {
      if (targetImg) targetImg.src = newImgSrc;

      // If this is a product card in the collections/creations section:
      if (key.startsWith('product-')) {
        const prodId = key.replace('product-', '');
        productOverrides[prodId] = Object.assign({}, productOverrides[prodId] || {}, {
          img: newImgSrc
        });
        localStorage.setItem('lasa_product_overrides', JSON.stringify(productOverrides));

        // If it's in userProducts, update it there too:
        const customIdx = userProducts.findIndex(p => p.id === prodId);
        if (customIdx > -1) {
          userProducts[customIdx].img = newImgSrc;
          localStorage.setItem('lasa_custom_products', JSON.stringify(userProducts));
        }

        // Re-merge catalog so ALL renders, filters & drawers use this photo
        PRODUCTS = getMergedProducts();
        const activeFilterPill = document.querySelector('#collectionFilterPills .filter-pill.active');
        renderProducts(activeFilterPill ? activeFilterPill.dataset.filter : 'all');
      }

      // If this is a bonbon piece in the custom mix builder:
      if (key.startsWith('bonbon-')) {
        const bonbonId = key.replace('bonbon-', '');
        bonbonOverrides[bonbonId] = Object.assign({}, bonbonOverrides[bonbonId] || {}, {
          img: newImgSrc
        });
        localStorage.setItem('lasa_bonbon_overrides', JSON.stringify(bonbonOverrides));
        BONBONS = getMergedBonbons();
        renderPickerBonbons();
        renderBoxSlots();
      }

      saveAllEdits();
      showToast('Photo updated & synced across all devices! 🖼️✨', 'success');
    }

    closeImageModal();
  });

  // Add New Product Modal
  const newProductModalOverlay = document.getElementById('newProductModalOverlay');
  const closeNewProductBtn = document.getElementById('closeNewProductBtn');
  const newProductForm = document.getElementById('newProductForm');

  function openNewProductModal() {
    newProductModalOverlay.classList.add('active');
  }
  function closeNewProductModal() {
    newProductModalOverlay.classList.remove('active');
  }

  if (editorAddProductBtn) editorAddProductBtn.addEventListener('click', openNewProductModal);
  if (addNewProductBtn) addNewProductBtn.addEventListener('click', openNewProductModal);
  closeNewProductBtn.addEventListener('click', closeNewProductModal);
  newProductModalOverlay.addEventListener('click', (e) => {
    if (e.target === newProductModalOverlay) closeNewProductModal();
  });

  newProductForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newProdName').value.trim();
    const price = parseFloat(document.getElementById('newProdPrice').value);
    const category = document.getElementById('newProdCategory').value;
    const pack = document.getElementById('newProdPack').value.trim();
    const desc = document.getElementById('newProdDesc').value.trim();

    if (!name || isNaN(price)) return;

    const newProd = {
      id: `custom-prod-${Date.now()}`,
      category: category,
      title: name,
      pack: pack,
      badge: 'New Creation',
      price: price,
      img: 'assets/gift_box.jpg',
      description: desc,
      notes: [name, 'Handmade Fresh'],
      pairings: 'Pair with warm tea or espresso.'
    };

    userProducts.push(newProd);
    localStorage.setItem('lasa_custom_products', JSON.stringify(userProducts));
    PRODUCTS = getMergedProducts();

    renderProducts('all');
    syncProductsToServer();
    closeNewProductModal();
    newProductForm.reset();
    showToast(`Added "${name}" to your live menu! 🍫`);
  });

  // Edit Product Modal & Price Controls (Live Editor)
  const editProductModalOverlay = document.getElementById('editProductModalOverlay');
  const closeEditProductBtn = document.getElementById('closeEditProductBtn');
  const cancelEditProductBtn = document.getElementById('cancelEditProductBtn');
  const editProductForm = document.getElementById('editProductForm');
  const editProdId = document.getElementById('editProdId');
  const editProdTitle = document.getElementById('editProdTitle');
  const editProdPrice = document.getElementById('editProdPrice');
  const editProdPack = document.getElementById('editProdPack');
  const editProdDesc = document.getElementById('editProdDesc');
  const editProductModalTitle = document.getElementById('editProductModalTitle');

  function openEditProductModal(product) {
    if (!editProductModalOverlay || !product) return;
    if (editProdId) editProdId.value = product.id;
    if (editProdTitle) editProdTitle.value = product.title || '';
    if (editProdPrice) editProdPrice.value = product.price || 0;
    if (editProdPack) editProdPack.value = product.pack || '';
    if (editProdDesc) editProdDesc.value = product.description || '';
    if (editProductModalTitle) editProductModalTitle.textContent = `Edit "${product.title}"`;
    editProductModalOverlay.classList.add('active');
  }

  function closeEditProductModal() {
    if (editProductModalOverlay) editProductModalOverlay.classList.remove('active');
  }

  if (closeEditProductBtn) closeEditProductBtn.addEventListener('click', closeEditProductModal);
  if (cancelEditProductBtn) cancelEditProductBtn.addEventListener('click', closeEditProductModal);
  if (editProductModalOverlay) {
    editProductModalOverlay.addEventListener('click', (e) => {
      if (e.target === editProductModalOverlay) closeEditProductModal();
    });
  }

  if (editProductForm) {
    editProductForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = editProdId.value;
      const title = editProdTitle.value.trim();
      const price = Number(editProdPrice.value);
      const pack = editProdPack.value.trim();
      const desc = editProdDesc.value.trim();

      if (!id || isNaN(price) || price < 1) {
        showToast('Please enter a valid price (₹1 or more)', 'error');
        return;
      }

      // Update in productOverrides
      productOverrides[id] = Object.assign({}, productOverrides[id] || {}, {
        price: price,
        title: title,
        pack: pack,
        description: desc
      });
      localStorage.setItem('lasa_product_overrides', JSON.stringify(productOverrides));

      // Also update in userProducts if custom
      const customIdx = userProducts.findIndex(p => p.id === id);
      if (customIdx > -1) {
        userProducts[customIdx].price = price;
        userProducts[customIdx].title = title;
        userProducts[customIdx].pack = pack;
        userProducts[customIdx].description = desc;
        localStorage.setItem('lasa_custom_products', JSON.stringify(userProducts));
      }

      // Merge and re-render
      PRODUCTS = getMergedProducts();
      const activeFilterPill = document.querySelector('#collectionFilterPills .filter-pill.active');
      renderProducts(activeFilterPill ? activeFilterPill.dataset.filter : 'all');
      closeEditProductModal();

      // Sync across all devices via Firebase
      saveAllEdits();
      showToast(`Updated "${title}" price to ₹${price} & synced across devices! ⚡💰`, 'success');
    });
  }

  // Remove Product Modal & Functions
  const removeProductModalOverlay = document.getElementById('removeProductModalOverlay');
  const editorRemoveProductBtn = document.getElementById('editorRemoveProductBtn');
  const closeRemoveProductBtn = document.getElementById('closeRemoveProductBtn');
  const doneRemoveProductBtn = document.getElementById('doneRemoveProductBtn');
  const removeProductsList = document.getElementById('removeProductsList');

  function openRemoveProductModal() {
    renderRemoveProductsList();
    if (removeProductModalOverlay) removeProductModalOverlay.classList.add('active');
  }

  function closeRemoveProductModal() {
    if (removeProductModalOverlay) removeProductModalOverlay.classList.remove('active');
  }

  function renderRemoveProductsList() {
    if (!removeProductsList) return;
    removeProductsList.innerHTML = '';

    if (PRODUCTS.length === 0) {
      removeProductsList.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
          <p>No products currently in the live menu.</p>
        </div>
      `;
      return;
    }

    PRODUCTS.forEach(p => {
      const row = document.createElement('div');
      row.className = 'remove-product-row';
      row.innerHTML = `
        <div class="remove-prod-info">
          <img src="${p.img}" alt="${p.title}" class="remove-prod-thumb">
          <div class="remove-prod-details">
            <span class="remove-prod-title">${p.title}</span>
            <span class="remove-prod-meta">${p.pack} · ₹${p.price}</span>
          </div>
        </div>
        <button type="button" class="btn-delete-item" data-id="${p.id}">🗑️ Remove</button>
      `;

      row.querySelector('.btn-delete-item').addEventListener('click', () => {
        confirmAndRemoveProduct(p.id, p.title);
      });

      removeProductsList.appendChild(row);
    });
  }

  function confirmAndRemoveProduct(productId, productTitle) {
    const title = productTitle || 'this product';
    if (confirm(`Remove "${title}" from the live menu across all devices?`)) {
      removeProduct(productId);
    }
  }

  function removeProduct(productId) {
    const prod = PRODUCTS.find(p => p.id === productId);
    const title = prod ? prod.title : 'Product';

    if (!deletedProductIds.includes(productId)) {
      deletedProductIds.push(productId);
    }
    userProducts = userProducts.filter(p => p.id !== productId);

    localStorage.setItem('lasa_deleted_products', JSON.stringify(deletedProductIds));
    localStorage.setItem('lasa_custom_products', JSON.stringify(userProducts));

    PRODUCTS = getMergedProducts();

    renderProducts('all');
    renderRemoveProductsList();
    syncProductsToServer();
    showToast(`Removed "${title}" from live menu! 🗑️`, 'info');
  }

  async function syncProductsToServer() {
    try {
      const savedText = JSON.parse(localStorage.getItem('lasa_text_edits')) || {};
      const savedImgs = JSON.parse(localStorage.getItem('lasa_image_edits')) || {};
      const payload = {
        textEdits: savedText,
        imgEdits: savedImgs,
        productOverrides: productOverrides,
        activeFestival: state.activeFestival || 'none',
        customProducts: userProducts,
        deletedProductIds: deletedProductIds,
        cloudDbUrl: localStorage.getItem('lasa_cloud_db_url') || DEFAULT_FIREBASE_URL || '',
        updatedAt: new Date().toISOString()
      };
      await saveToCloud(payload);
      await fetch('/api/save-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch(e) {
      console.warn('Server sync error for products:', e);
    }
  }

  if (editorRemoveProductBtn) editorRemoveProductBtn.addEventListener('click', openRemoveProductModal);
  if (closeRemoveProductBtn) closeRemoveProductBtn.addEventListener('click', closeRemoveProductModal);
  if (doneRemoveProductBtn) doneRemoveProductBtn.addEventListener('click', closeRemoveProductModal);
  if (removeProductModalOverlay) {
    removeProductModalOverlay.addEventListener('click', (e) => {
      if (e.target === removeProductModalOverlay) closeRemoveProductModal();
    });
  }

  // ==========================================
  // CLOUD DATABASE SYNC UI & HANDLERS
  // ==========================================

  function updateCloudStatusUI() {
    if (cloudStatusBadge) {
      cloudStatusBadge.style.background = 'rgba(52, 168, 83, 0.15)';
      cloudStatusBadge.style.color = '#2d7a46';
    }
    if (cloudStatusDot) cloudStatusDot.style.background = '#34a853';
    if (cloudStatusText) cloudStatusText.textContent = 'Project: lasa-pricing ⚡';
    if (cloudStatusDetail) {
      cloudStatusDetail.innerHTML = `Connected to Firebase Project: <strong style="color: #1a73e8;">lasa-pricing</strong> (Firestore &amp; Realtime DB ready).`;
    }
    if (firebaseDbUrlInput && !firebaseDbUrlInput.value) {
      firebaseDbUrlInput.value = 'https://lasa-pricing-default-rtdb.firebaseio.com';
    }
    if (cloudPermanentCodeBox) cloudPermanentCodeBox.style.display = 'block';
    if (firebaseCopySnippet) {
      firebaseCopySnippet.value = `Firebase Project "lasa-pricing" is embedded in app.js!`;
    }
  }

  function openCloudSyncModal() {
    updateCloudStatusUI();
    if (cloudSyncModalOverlay) cloudSyncModalOverlay.classList.add('active');
  }

  function closeCloudSyncModal() {
    if (cloudSyncModalOverlay) cloudSyncModalOverlay.classList.remove('active');
  }

  async function testAndSaveCloudConnection() {
    const origBtnText = saveAndTestCloudBtn ? saveAndTestCloudBtn.innerHTML : '';
    if (saveAndTestCloudBtn) {
      saveAndTestCloudBtn.disabled = true;
      saveAndTestCloudBtn.innerHTML = '⏳ Testing live Firebase connection...';
    }

    try {
      const textEdits = {};
      document.querySelectorAll('[data-editable]').forEach(el => {
        const key = el.getAttribute('data-editable');
        if (key) textEdits[key] = el.innerHTML;
      });
      const imgEdits = {};
      document.querySelectorAll('img[data-img-key]').forEach(img => {
        const key = img.getAttribute('data-img-key');
        if (key) imgEdits[key] = img.src;
      });

      const payload = {
        textEdits,
        imgEdits,
        activeFestival: state.activeFestival || 'none',
        customProducts: userProducts,
        deletedProductIds: deletedProductIds,
        cloudDbUrl: (firebaseDbUrlInput && firebaseDbUrlInput.value.trim()) ? formatFirebaseUrl(firebaseDbUrlInput.value.trim()) : DEFAULT_FIREBASE_URL,
        updatedAt: new Date().toISOString()
      };

      let success = false;
      let permissionDenied = false;

      // 1. Test Cloud Firestore
      if (firestoreDb) {
        try {
          await firestoreDb.collection('lasa_settings').doc('atelier').set(payload, { merge: true });
          const testRead = await firestoreDb.collection('lasa_settings').doc('atelier').get();
          if (testRead.exists) success = true;
        } catch (fErr) {
          if (fErr && (fErr.code === 'permission-denied' || (fErr.message && fErr.message.includes('permission')))) {
            permissionDenied = true;
          }
        }
      }

      // 2. Test Realtime Database REST API if custom URL entered
      if (!success && firebaseDbUrlInput && firebaseDbUrlInput.value.trim()) {
        const testUrl = formatFirebaseUrl(firebaseDbUrlInput.value.trim());
        try {
          const pingRes = await fetch(testUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (pingRes.ok) {
            localStorage.setItem('lasa_cloud_db_url', testUrl);
            success = true;
          } else if (pingRes.status === 401 || pingRes.status === 403) {
            permissionDenied = true;
          }
        } catch(e) {}
      }

      if (success) {
        updateCloudStatusUI();
        showToast('Connected to Firebase! All changes now sync across all devices in real-time ☁️✨', 'success');
        try {
          await fetch('/api/save-edits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch(e) {}
      } else if (permissionDenied) {
        showToast('Database locked! In Firebase Console -> Rules tab, change "if false;" to "if true;" and click Publish.', 'warning', 8000);
      } else {
        showToast('Firebase configured! Set Rules tab to true in Firebase Console to enable public syncing.', 'info', 7000);
      }
    } catch (err) {
      console.error('Firebase test error:', err);
      showToast('Could not reach Firebase. Please check your internet connection.', 'error');
    } finally {
      if (saveAndTestCloudBtn) {
        saveAndTestCloudBtn.disabled = false;
        saveAndTestCloudBtn.innerHTML = origBtnText;
      }
    }
  }

  function disconnectCloud() {
    localStorage.removeItem('lasa_cloud_db_url');
    window.__LASA_CLOUD_DB_URL = null;
    if (firebaseDbUrlInput) firebaseDbUrlInput.value = '';
    updateCloudStatusUI();
    showToast('Cloud Database disconnected. Switched to local storage.', 'info');
  }

  if (editorCloudSyncBtn) editorCloudSyncBtn.addEventListener('click', openCloudSyncModal);
  if (closeCloudSyncBtn) closeCloudSyncBtn.addEventListener('click', closeCloudSyncModal);
  if (doneCloudSyncBtn) doneCloudSyncBtn.addEventListener('click', closeCloudSyncModal);
  if (saveAndTestCloudBtn) saveAndTestCloudBtn.addEventListener('click', testAndSaveCloudConnection);
  if (disconnectCloudBtn) disconnectCloudBtn.addEventListener('click', disconnectCloud);
  if (cloudSyncModalOverlay) {
    cloudSyncModalOverlay.addEventListener('click', (e) => {
      if (e.target === cloudSyncModalOverlay) closeCloudSyncModal();
    });
  }
  if (copySnippetBtn && firebaseCopySnippet) {
    copySnippetBtn.addEventListener('click', () => {
      firebaseCopySnippet.select();
      navigator.clipboard.writeText(firebaseCopySnippet.value).then(() => {
        showToast('Code line copied to clipboard! 📋');
        copySnippetBtn.textContent = 'Copied! 👍';
        setTimeout(() => { copySnippetBtn.textContent = '📋 Copy'; }, 2000);
      }).catch(() => {
        document.execCommand('copy');
        showToast('Code line copied! 📋');
      });
    });
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  // Pure Center Round Intro Video (Automatic Sound & Zero Options)
  const introVideoOverlay = document.getElementById('introVideoOverlay');
  const introVideo = document.getElementById('introVideo');

  let introDismissed = false;

  function dismissIntroVideo() {
    if (introDismissed) return;
    introDismissed = true;

    if (introVideoOverlay) {
      introVideoOverlay.classList.add('fade-out');
      setTimeout(() => {
        if (introVideo) {
          try { introVideo.pause(); } catch(e) {}
        }
        introVideoOverlay.style.display = 'none';
        document.body.style.overflow = '';

        // Trigger initial 5-second festival display when customer lands on first page!
        if (state.activeFestival && state.activeFestival !== 'none') {
          triggerInitialFestivalDisplay(state.activeFestival);
        }
      }, 850);
    }
  }

  if (introVideoOverlay && introVideo) {
    document.body.style.overflow = 'hidden';

    // Configure automatic unmuted audio
    introVideo.muted = false;
    introVideo.volume = 1.0;

    const playPromise = introVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Modern browsers may require a user interaction to play unmuted audio
        console.warn('Autoplay with sound restricted by browser; starting muted and auto-unmuting on interaction', err);
        introVideo.muted = true;
        introVideo.play().catch(() => {});

        const unmuteOnInteraction = () => {
          introVideo.muted = false;
          introVideo.volume = 1.0;
          window.removeEventListener('click', unmuteOnInteraction);
          window.removeEventListener('touchstart', unmuteOnInteraction);
          window.removeEventListener('keydown', unmuteOnInteraction);
        };
        window.addEventListener('click', unmuteOnInteraction, { once: true });
        window.addEventListener('touchstart', unmuteOnInteraction, { once: true });
        window.addEventListener('keydown', unmuteOnInteraction, { once: true });
      });
    }

    // Automatically transition to website when video finishes playing
    introVideo.addEventListener('ended', () => {
      setTimeout(dismissIntroVideo, 300);
    });

    // Handle any network/decode errors cleanly
    introVideo.addEventListener('error', () => {
      console.warn('Intro video error, entering atelier directly');
      dismissIntroVideo();
    });

    // Allow user click anywhere on screen to enter immediately
    introVideoOverlay.addEventListener('click', dismissIntroVideo);

    // Safety fallback timeout
    setTimeout(() => {
      if (!introDismissed) {
        dismissIntroVideo();
      }
    }, 15000);
  }

  /* ==========================================================================
     BOX SLIDER CONTROLS (MOBILE HORIZONTAL SLIDE TO RIGHT & DRAG TO SCROLL)
     ========================================================================== */
  const boxScrollLeftBtn = document.getElementById('boxScrollLeftBtn');
  const boxScrollRightBtn = document.getElementById('boxScrollRightBtn');

  if (confectionBoxContainer) {
    if (boxScrollLeftBtn) {
      boxScrollLeftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        confectionBoxContainer.scrollBy({ left: -180, behavior: 'smooth' });
      });
    }
    if (boxScrollRightBtn) {
      boxScrollRightBtn.addEventListener('click', (e) => {
        e.preventDefault();
        confectionBoxContainer.scrollBy({ left: 180, behavior: 'smooth' });
      });
    }

    // Mouse drag-to-scroll support for smooth sliding across all devices
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    confectionBoxContainer.addEventListener('mousedown', (e) => {
      isDown = true;
      confectionBoxContainer.style.cursor = 'grabbing';
      startX = e.pageX - confectionBoxContainer.offsetLeft;
      scrollStart = confectionBoxContainer.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        if (confectionBoxContainer) confectionBoxContainer.style.cursor = 'grab';
      }
    });

    confectionBoxContainer.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - confectionBoxContainer.offsetLeft;
      const walk = (x - startX) * 1.5;
      confectionBoxContainer.scrollLeft = scrollStart - walk;
    });
  }

  /* ==========================================================================
     INSTAGRAM REELS SHOWCASE INTERACTIONS & LIKE BUTTONS
     ========================================================================== */
  function initInstagramReels() {
    const reelsTrack = document.getElementById('reelsTrack');
    const reelsPrevBtn = document.getElementById('reelsPrevBtn');
    const reelsNextBtn = document.getElementById('reelsNextBtn');

    if (reelsPrevBtn && reelsNextBtn && reelsTrack) {
      reelsPrevBtn.addEventListener('click', () => {
        reelsTrack.scrollBy({ left: -280, behavior: 'smooth' });
      });
      reelsNextBtn.addEventListener('click', () => {
        reelsTrack.scrollBy({ left: 280, behavior: 'smooth' });
      });
    }

    // Video play/pause, sound toggle, and Heart Like button
    document.querySelectorAll('.reel-card').forEach(card => {
      const video = card.querySelector('.reel-video');
      const playBtn = card.querySelector('.reel-play-btn');
      const soundBtn = card.querySelector('.reel-sound-btn');
      const likeBtn = card.querySelector('.reel-action-btn.like-btn');
      const likeCountEl = likeBtn ? likeBtn.querySelector('.action-count') : null;

      if (!video) return;

      const togglePlay = () => {
        if (video.paused) {
          // Pause any other playing reel
          document.querySelectorAll('.reel-video').forEach(v => {
            if (v !== video) {
              v.pause();
              v.closest('.reel-card')?.classList.remove('playing');
            }
          });
          video.play().then(() => {
            card.classList.add('playing');
          }).catch(err => console.log('Autoplay blocked:', err));
        } else {
          video.pause();
          card.classList.remove('playing');
        }
      };

      if (playBtn) playBtn.addEventListener('click', togglePlay);
      video.addEventListener('click', togglePlay);

      // Sound Mute/Unmute
      if (soundBtn) {
        soundBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          video.muted = !video.muted;
          soundBtn.textContent = video.muted ? '🔇' : '🔊';
        });
      }

      // Heart / Like button ("like our reels")
      if (likeBtn && likeCountEl) {
        likeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isLiked = likeBtn.classList.contains('liked');
          let count = parseInt(likeBtn.getAttribute('data-likes') || likeCountEl.getAttribute('data-initial-likes') || '1000', 10);

          if (!isLiked) {
            count += 1;
            likeBtn.classList.add('liked');
            likeBtn.setAttribute('data-likes', count);
            likeCountEl.textContent = formatCount(count);

            // Pop floating heart animation
            spawnFloatingHeart(likeBtn);

            showToast('Thank you for loving our reel! 💖 Follow @lasa.chocolates on Instagram', 'success');
          } else {
            count -= 1;
            likeBtn.classList.remove('liked');
            likeBtn.setAttribute('data-likes', count);
            likeCountEl.textContent = formatCount(count);
          }
        });
      }
    });

    function formatCount(num) {
      if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
      return num.toString();
    }

    function spawnFloatingHeart(targetBtn) {
      const heart = document.createElement('span');
      heart.textContent = '❤️';
      heart.style.position = 'fixed';
      heart.style.zIndex = '99999';
      heart.style.fontSize = '1.6rem';
      heart.style.pointerEvents = 'none';
      heart.style.transition = 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)';

      const rect = targetBtn.getBoundingClientRect();
      heart.style.left = `${rect.left + rect.width / 2 - 12}px`;
      heart.style.top = `${rect.top}px`;
      heart.style.transform = 'translateY(0) scale(1) rotate(0deg)';
      heart.style.opacity = '1';

      document.body.appendChild(heart);

      requestAnimationFrame(() => {
        heart.style.transform = `translate(${Math.random() * 40 - 20}px, -65px) scale(1.6) rotate(${Math.random() * 40 - 20}deg)`;
        heart.style.opacity = '0';
      });

      setTimeout(() => heart.remove(), 1000);
    }
  }

  renderPickerBonbons();
  renderBoxSlots();
  renderProducts('all');
  renderCart();
  loadSavedTextEdits();
  loadSavedCustomerInfo();
  bindImageEditEvents();
  initInstagramReels();

  // Bind festival toggle buttons in edit bar
  document.querySelectorAll('.btn-festival-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const fest = btn.getAttribute('data-festival');
      setFestivalTheme(fest, true);
    });
  });

  // Global Button Click Festival Burst Listener (Tiny festival elements fly around clicked buttons)
  document.addEventListener('click', (e) => {
    if (!state.activeFestival || state.activeFestival === 'none') return;
    const target = e.target.closest('button, .btn, a, .filter-pill, .bonbon-card, .product-card, .cart-trigger-btn, .nav-item, .stat-item');
    if (!target) return;
    if (target.closest('.festival-toggle-group')) return;
    triggerButtonFestivalBurst(target, e);
  }, true);

});
