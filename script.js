// script.js

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Helpers
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));

  // THEME TOGGLE
  const themeToggleBtn = $('#theme-toggle');
  const themeStorageKey = 'theme';
  const defaultTheme = localStorage.getItem(themeStorageKey)
                        || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      themeToggleBtn.textContent = '☀️ Light Mode';
      themeToggleBtn.setAttribute('aria-pressed','true');
    } else {
      document.body.classList.remove('dark-mode');
      themeToggleBtn.textContent = '🌙 Dark Mode';
      themeToggleBtn.setAttribute('aria-pressed','false');
    }
    localStorage.setItem(themeStorageKey, theme);
  };

  applyTheme(defaultTheme);

  themeToggleBtn.addEventListener('click', () => {
    const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    applyTheme(newTheme);
  });

  // GREETING (non-blocking)
  const greetingEl = $('header p');
  const nameKey = 'userName';
  let userName = localStorage.getItem(nameKey);
  if (!userName) {
    // instead of prompt, maybe show small modal or input - fallback
    userName = prompt("Welcome to OMORO's Jewelry! What's your name?", "Guest") || 'Guest';
    localStorage.setItem(nameKey, userName);
  }
  const hour = new Date().getHours();
  const greetingText = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  if (greetingEl) {
    greetingEl.textContent = `${greetingText}, ${userName}! Welcome to our jewelry showcase.`;
  }

  // PRODUCT COUNTERS
  const counterKeys = ['ring','necklace','earrings'];
  const counterStorageKey = 'productCounters';
  let counters = {};
  try {
    const stored = JSON.parse(localStorage.getItem(counterStorageKey));
    if (stored && typeof stored === 'object') {
      counters = Object.fromEntries(counterKeys.map(k => [k, stored[k] || 0]));
    } else {
      counterKeys.forEach(k => counters[k] = 0);
    }
  } catch(e) {
    counterKeys.forEach(k => counters[k] = 0);
  }

  const updateCounterDisplay = (product) => {
    const el = $(`#${product}-counter`);
    if (el) {
      el.textContent = counters[product];
    }
  };

  counterKeys.forEach(product => updateCounterDisplay(product));

  $$('.counter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = btn.dataset.product;
      const action = btn.dataset.action;
      if (!product || !counters.hasOwnProperty(product)) return;
      if (action === 'increment') counters[product]++;
      else if (action === 'decrement' && counters[product] > 0) counters[product]--;
      updateCounterDisplay(product);
      // highlight effect
      const el = $(`#${product}-counter`);
      if (el) {
        el.classList.add('highlight');
        setTimeout(() => el.classList.remove('highlight'), 500);
      }
      localStorage.setItem(counterStorageKey, JSON.stringify(counters));
    });
  });

  // LIGHTBOX

  const lightbox = $('#lightbox');
  const lbImage = $('#lightbox-image');
  const lbClose = $('#lightbox-close');
  const productImages = $$('.product img');
  let lbImageList = productImages.map(img => ({src: img.src, alt: img.alt}));
  let currentLbIndex = -1;

  const openLightboxAt = (index) => {
    if (index < 0 || index >= lbImageList.length) return;
    currentLbIndex = index;
    lbImage.src = lbImageList[index].src;
    lbImage.alt = lbImageList[index].alt || '';
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.style.display = 'flex';
    lbClose.focus();
  };

  productImages.forEach((img, idx) => {
    // click
    img.addEventListener('click', () => openLightboxAt(idx));
    // keyboard
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightboxAt(idx);
      }
    });
  });

  const closeLightbox = () => {
    lightbox.style.display = 'none';
    lightbox.setAttribute('aria-hidden','true');
    lbImage.src = '';
    lbImage.alt = '';
  };

  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.getAttribute('aria-hidden') === 'false') {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        openLightboxAt( (currentLbIndex + 1) % lbImageList.length );
      } else if (e.key === 'ArrowLeft') {
        openLightboxAt( (currentLbIndex - 1 + lbImageList.length) % lbImageList.length );
      }
    }
  });

  // ANIMATION CONTROL
  const startAnimationBtn = $('#start-animation');
  const stopAnimationBtn = $('#stop-animation');

  startAnimationBtn?.addEventListener('click', () => {
    $$('.product').forEach((product, idx) => {
      product.style.animation = 'productEntrance 0.8s ease-out';
      product.style.animationDelay = `${(idx + 1) * 0.1}s`;
    });
  });

  stopAnimationBtn?.addEventListener('click', () => {
    $$('.product').forEach(product => {
      product.style.animation = 'none';
    });
  });

  // PRICE CALCULATOR MODAL
  const priceModal = $('#price-modal');
  const priceForm = $('#price-form');
  const priceResult = $('#price-result');
  const priceCancel = $('#calc-cancel');
  let currentPrice = 0;

  $$('.price-calculator').forEach(btn => {
    btn.addEventListener('click', () => {
      const price = parseFloat(btn.dataset.price);
      const productName = btn.dataset.product || '';
      currentPrice = price || 0;
      priceModal.setAttribute('aria-hidden', 'false');
      priceModal.style.display = 'flex';
      $('#calc-quantity').value = 1;
      $('#calc-state').value = 'CA';
      $('#calc-quantity').focus();
      priceResult.textContent = '';
    });
  });

  priceCancel.addEventListener('click', () => {
    priceModal.setAttribute('aria-hidden', 'true');
    priceModal.style.display = 'none';
  });

  priceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const qty = parseInt($('#calc-quantity').value, 10) || 1;
    const state = $('#calc-state').value;
    const taxRates = { CA: 0.08, NY: 0.088, TX: 0.0625, FL: 0.06 };
    const rate = taxRates[state] ?? 0.08;
    const subtotal = currentPrice * qty;
    const tax = subtotal * rate;
    const total = subtotal + (subtotal * rate);
    priceResult.textContent = `Subtotal: $${subtotal.toFixed(2)} • Tax (${(rate*100).toFixed(2)}%): $${(subtotal * rate).toFixed(2)} • Total: $${total.toFixed(2)}`;
  });

  document.addEventListener('keydown', (e) => {
    // close price modal with Escape
    if (e.key === 'Escape' && priceModal.getAttribute('aria-hidden') === 'false') {
      priceModal.setAttribute('aria-hidden','true');
      priceModal.style.display = 'none';
    }
  });

  // BACK TO TOP BUTTON
  const backToTopBtn = $('#back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY >= 200) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

});
