document.addEventListener("DOMContentLoaded", function() {
  
  gsap.registerPlugin(ScrollTrigger);

  // Hero Animations
  gsap.from(".project-title", { duration: 1.5, y: 100, opacity: 0, ease: "power4.out" });
  gsap.from(".project-subtitle", { duration: 1.5, y: 50, opacity: 0, delay: 0.2, ease: "power4.out" });
  gsap.from(".meta-item", { duration: 1, y: 20, opacity: 0, delay: 0.5, stagger: 0.1, ease: "power2.out" });

  // Images Reveal
  gsap.utils.toArray('.reveal-img').forEach(img => {
    gsap.from(img, {
      scrollTrigger: { trigger: img, start: "top 85%" },
      y: 50, opacity: 0, duration: 1.2, ease: "power3.out"
    });
  });

  // Text Reveal
  gsap.utils.toArray('.section-block').forEach(sec => {
    gsap.from(sec, {
      scrollTrigger: { trigger: sec, start: "top 80%" },
      y: 30, opacity: 0, duration: 1, ease: "power2.out"
    });
  });
});