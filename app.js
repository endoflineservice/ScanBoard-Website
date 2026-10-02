// Content is visible by default; only enhance it when motion is supported.
(() => {
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!("IntersectionObserver" in window)) return;

  const groups = [
    ["header > div", "pop"],
    ["main > h2", "slide"],
    ["main > ul > li", "up"],
    ["main > div.flex > div", "up"],
    [".warehouse-mockup", "pop"],
    [".device-gallery > figure", "up"],
    ["footer > p", "up"],
  ];
  const targets = [];
  groups.forEach(([selector, effect]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.dataset.reveal = effect;
      const stagger = selector.includes("li") || selector.includes("div.flex") || selector.includes("figure");
      element.style.setProperty("--reveal-delay", `${stagger ? (index % 4) * 90 : 0}ms`);
      targets.push(element);
    });
  });

  const reveal = (element) => {
    element.classList.remove("reveal-pending");
    observer.unobserve(element);
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) reveal(entry.target);
    });
  }, { threshold: 0.05 });

  if (!motionPreference.matches) {
    targets.forEach((element) => {
      // Avoid hiding content already visible on load or at a restored scroll position.
      const bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0 && bounds.left < window.innerWidth) return;
      element.classList.add("reveal-pending");
      observer.observe(element);
    });
  }

  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) targets.forEach(reveal);
  });
  document.addEventListener("focusin", (event) => {
    const target = event.target.closest(".reveal-pending");
    if (target) reveal(target);
  });
})();

// Decorative video: muted, pausable, and suspended when it leaves the screen.
(() => {
  const video = document.querySelector(".hero-video");
  const button = document.querySelector(".hero-video-toggle");
  if (!video || !button) return;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let userPaused = preference.matches;
  let inView = true;
  video.muted = true;
  button.hidden = false;

  const updateLabel = () => {
    button.textContent = video.paused ? "Play background" : "Pause background";
  };
  const syncPlayback = () => {
    if (userPaused || !inView || document.hidden) {
      video.pause();
    } else {
      video.play().catch(updateLabel);
    }
  };
  video.addEventListener("play", updateLabel);
  video.addEventListener("pause", updateLabel);
  video.addEventListener("error", () => { button.hidden = true; });
  button.addEventListener("click", () => {
    userPaused = !video.paused;
    syncPlayback();
  });
  preference.addEventListener("change", () => {
    userPaused = preference.matches;
    syncPlayback();
  });
  document.addEventListener("visibilitychange", syncPlayback);
  if ("IntersectionObserver" in window) {
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    });
    visibility.observe(video);
  }
  syncPlayback();
})();
