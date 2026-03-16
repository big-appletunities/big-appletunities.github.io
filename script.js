const sections = document.querySelectorAll("[data-section]");
const navLinks = document.querySelectorAll(".nav-links a[data-section]");

if (sections.length && navLinks.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const activeSection = entry.target.getAttribute("data-section");

        navLinks.forEach((link) => {
          const isActive = link.getAttribute("data-section") === activeSection;
          link.classList.toggle("active-link", isActive);
        });
      });
    },
    {
      rootMargin: "-35% 0px -45% 0px",
      threshold: 0.2,
    }
  );

  sections.forEach((section) => observer.observe(section));
}
