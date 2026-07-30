// Small shared client-side helpers — no framework, no build step, kept dependency-free
// on purpose since this is a server-rendered EJS dashboard.

(function () {
  // ---- Mobile sidebar toggle ----
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const toggles = document.querySelectorAll('.mobile-nav-toggle');
  toggles.forEach(btn => btn.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    backdrop?.classList.toggle('open');
  }));
  backdrop?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('open');
  });

  // ---- Section-nav scrollspy (guild settings page) ----
  const sectionLinks = document.querySelectorAll('.section-nav a[href^="#"]');
  const sections = Array.from(sectionLinks)
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (sections.length) {
    const setActive = (id) => {
      sectionLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    };
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-96px 0px -70% 0px', threshold: 0 });
    sections.forEach(s => io.observe(s));
    if (sectionLinks[0]) setActive(sectionLinks[0].getAttribute('href').slice(1));
  }

  // ---- Toasts ----
  function ensureStack() {
    let stack = document.getElementById('toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }
  window.showToast = function (message, type) {
    type = type || 'success';
    const stack = ensureStack();
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    const icon = type === 'success' ? '<i class="fa-solid fa-check"></i>' : type === 'error' ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-circle-info"></i>';
    el.innerHTML = '<span class="ic">' + icon + '</span><span>' + message + '</span>';
    stack.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 220ms ease, transform 220ms ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(() => el.remove(), 220);
    }, 3800);
  };

  // Auto-toast based on ?saved= / ?error= query params set by form redirects.
  const params = new URLSearchParams(location.search);
  if (params.get('saved')) window.showToast('Settings saved.', 'success');
  if (params.get('error')) window.showToast(decodeURIComponent(params.get('error')), 'error');
  if (params.get('saved') || params.get('error')) {
    const url = new URL(location.href);
    url.searchParams.delete('saved');
    url.searchParams.delete('error');
    window.history.replaceState({}, '', url.toString());
  }

  // ---- Generic client-side search filter: any input[data-filter-target] ----
  document.querySelectorAll('input[data-filter-target]').forEach(input => {
    const targetSelector = input.getAttribute('data-filter-target');
    const items = () => document.querySelectorAll(targetSelector);
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      items().forEach(item => {
        const haystack = (item.getAttribute('data-search') || item.textContent).toLowerCase();
        item.style.display = haystack.includes(q) ? '' : 'none';
      });
    });
  });
})();
