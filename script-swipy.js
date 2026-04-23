// On attend que le DOM soit chargé pour éviter les erreurs
document.addEventListener("DOMContentLoaded", function() {
  
  // Enregistrer le plugin ScrollTrigger de GSAP
  gsap.registerPlugin(ScrollTrigger);

  // Animation du Titre Hero
  gsap.from(".project-title", { duration: 1.5, y: 100, opacity: 0, ease: "power4.out" });
  gsap.from(".project-subtitle", { duration: 1.5, y: 50, opacity: 0, delay: 0.2, ease: "power4.out" });
  gsap.from(".meta-item", { duration: 1, y: 20, opacity: 0, delay: 0.5, stagger: 0.1, ease: "power2.out" });

  // Animation des images au scroll
  gsap.utils.toArray('.reveal-img').forEach(img => {
    gsap.from(img, {
      scrollTrigger: {
        trigger: img,
        start: "top 85%", // L'anim commence quand le haut de l'image arrive à 85% de la fenêtre
      },
      y: 50,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out"
    });
  });

  // Animation des sections de texte
  gsap.utils.toArray('.section-block').forEach(sec => {
    gsap.from(sec, {
      scrollTrigger: {
        trigger: sec,
        start: "top 80%",
      },
      y: 30,
      opacity: 0,
      duration: 1,
      ease: "power2.out"
    });
  });

});