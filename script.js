(() => {
  const root = document.documentElement;
  const themeButton = document.getElementById('theme');
  const menu = document.getElementById('menu');
  const menuButton = document.getElementById('menuBtn');
  const mobile = matchMedia('(max-width: 900px)');
  document.getElementById('year').textContent = new Date().getFullYear();

  function updateTheme() {
    const dark = root.dataset.theme !== 'light';
    const label = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
    themeButton.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue('--bg').trim();
  }
  updateTheme();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (error) { /* Storage is optional. */ }
    updateTheme();
  });

  function setMenu(open, restoreFocus = false) {
    menu.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menuButton.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    setMenu(false);
    if (mobile.matches) {
      const section = document.querySelector(link.hash);
      if (section) { section.setAttribute('tabindex', '-1'); section.focus({ preventScroll: true }); }
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('open')) setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  mobile.addEventListener('change', () => setMenu(false));

  const sectionLinks = Array.from(menu.querySelectorAll('a'));
  const sections = sectionLinks.map(link => document.querySelector(link.hash));
  let scrollQueued = false;
  function updateNavigation() {
    let active = null;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= Math.max(120, innerHeight * 0.3)) active = sectionLinks[index];
    });
    sectionLinks.forEach(link => {
      if (link === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollQueued = false;
  }
  addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateNavigation); }
  }, { passive: true });
  addEventListener('resize', updateNavigation);
  updateNavigation();

  // Prepare offscreen content before scrolling, then reveal it on entry.
  // Without JavaScript or IntersectionObserver the default CSS stays visible.
  if ('IntersectionObserver' in window) {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const pending = new Set();
    const show = element => {
      entranceObserver.unobserve(element);
      pending.delete(element);
      element.classList.add('is-visible');
      // Remove transition styles after entry so hover effects remain independent.
      setTimeout(() => element.classList.remove('reveal-ready', 'is-visible'), 750);
    };
    const entranceObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) show(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -64px 0px' });
    if (!reducedMotion.matches) {
      try {
        document.querySelectorAll('.section-heading, .project, .skill, .certificate, .about-copy, .education')
          .forEach(element => {
            if (element.getBoundingClientRect().top < innerHeight || element.matches(':focus-within')) return;
            pending.add(element);
            entranceObserver.observe(element);
            element.classList.add('reveal-ready');
          });
      } catch (error) {
        entranceObserver.disconnect();
        pending.forEach(element => element.classList.remove('reveal-ready'));
        pending.clear();
      }
    }
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) {
        pending.forEach(element => show(element));
        document.querySelectorAll('.reveal-ready').forEach(element => element.classList.remove('reveal-ready', 'is-visible'));
      }
    });
    document.addEventListener('focusin', event => {
      const element = event.target.closest('.reveal-ready');
      if (element) {
        show(element);
        element.classList.remove('reveal-ready', 'is-visible');
      }
    });
  }

  const toast = document.getElementById('toast');
  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
  }
  document.querySelectorAll('[data-copy]').forEach(button => {
    let resetTimer;
    button.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(button.dataset.copy);
        button.querySelector('span').textContent = 'Correo copiado';
        notify('Correo copiado al portapapeles.');
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { button.querySelector('span').textContent = 'Copiar correo'; }, 3000);
      } catch (error) {
        notify('No se pudo copiar. Puedes seleccionar el correo o pulsarlo para escribir.');
      }
    });
  });
})();
