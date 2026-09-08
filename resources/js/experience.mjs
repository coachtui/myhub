// Progressive enhancement: content is always visible without motion or JavaScript.
export function mountExperience(doc = document) {
  const win = doc.defaultView;
  if (!win) return;
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const reveal = el => {
    if (reduced.matches || !el.animate) return;
    const animation = el.animate([
      { opacity: 0, transform: 'translateY(18px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
  };
  if ('IntersectionObserver' in win) {
    const observer = new win.IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    }, { threshold: .08 });
    doc.querySelectorAll('.opening__copy, .opening__art, .section-heading, .path-layout, .reading-card, .personal-note, .beyond-basics, .hub-page__head, .money-hero, .hub-section').forEach(el => observer.observe(el));
    reduced.addEventListener('change', () => {
      if (reduced.matches) { animations.forEach(a => a.cancel()); observer.disconnect(); }
    });
  }

  const article = doc.querySelector('.article');
  const header = doc.getElementById('site-header');
  if (article && header) {
    const progress = doc.createElement('div');
    progress.className = 'reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    header.append(progress);
    let queued = false;
    const update = () => {
      const rect = article.getBoundingClientRect();
      const distance = Math.max(1, rect.height - win.innerHeight + header.offsetHeight);
      const fraction = Math.max(0, Math.min(1, (header.offsetHeight - rect.top) / distance));
      progress.style.transform = `scaleX(${fraction})`;
      queued = false;
    };
    const schedule = () => { if (!queued) { queued = true; win.requestAnimationFrame(update); } };
    win.addEventListener('scroll', schedule, { passive: true });
    win.addEventListener('resize', schedule);
    if ('ResizeObserver' in win) new win.ResizeObserver(schedule).observe(article);
    update();
  }
}
