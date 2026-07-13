// ─── Nav scroll behavior ─────────────────────────────────────────
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ─── Mobile menu toggle ──────────────────────────────────────────
const toggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
if (toggle && mobileMenu) {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
}

// ─── Active nav link ─────────────────────────────────────────────
const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
const currentPath = window.location.pathname;
navLinks.forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
    link.classList.add('active');
  }
});

// ─── Scroll reveal ───────────────────────────────────────────────
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.puppy-card, .why-card, .testimonial-card, .delivery-card, .credential-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ─── Form character counter for message ─────────────────────────
const msgField = document.getElementById('message');
if (msgField) {
  const counter = document.createElement('div');
  counter.style.cssText = 'text-align:right;font-size:.75rem;color:#8a7a6a;margin-top:4px;';
  msgField.parentNode.appendChild(counter);
  const update = () => { counter.textContent = `${msgField.value.length} characters`; };
  msgField.addEventListener('input', update);
  update();
}

// ─── FAQ Accordion ───────────────────────────────────────────────
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    // Close all open items
    document.querySelectorAll('.faq-item.open').forEach(el => {
      el.classList.remove('open');
      el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });
    // Toggle clicked item
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// ─── Auto-dismiss alerts ─────────────────────────────────────────
const alert = document.querySelector('.alert-success');
if (alert) {
  setTimeout(() => {
    alert.style.transition = 'opacity 0.5s';
    alert.style.opacity = '0';
  }, 8000);
}
