// Content is visible by default; only enhance it when motion is supported.
(() => {
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!("IntersectionObserver" in window)) return;

  const groups = [
    ["header > div", "pop"],
    ["main > h2", "slide"],
    ["main > ul > li", "up"],
    ["main > div.flex > div", "up"],
    [".video-block", "up"],
    [".scan-process", "up"],
    [".warehouse-mockup", "pop"],
    [".device-gallery > figure", "up"],
    [".contact-section", "up"],
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

// Static-site contact delivery: turn validated form values into an email draft.
// See the single hosted-endpoint hook beside the form if a server-backed send is needed.
(() => {
  const form = document.querySelector("[data-mailto-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const fields = new FormData(form);
    const name = fields.get("name").trim();
    const company = fields.get("company").trim();
    const email = fields.get("email").trim();
    const phone = fields.get("phone").trim();
    const message = fields.get("message").trim();
    const lines = [
      `Name: ${name}`,
      `Company: ${company || "Not provided"}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      "",
      "Message:",
      message,
    ];
    const subject = `ScanBoard website inquiry from ${name}`;
    window.location.href = `mailto:CorryRHolt@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
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

// In-body adverts: the source is attached only as a clip nears the viewport, and
// never at all for reduced-motion visitors, who just keep the poster frame.
(() => {
  const videos = Array.from(document.querySelectorAll(".section-video"));
  if (!videos.length) return;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const supported = "IntersectionObserver" in window;

  videos.forEach((video) => {
    video.muted = true;
    let inView = false;

    const attach = () => {
      if (video.dataset.attached || preference.matches) return;
      video.dataset.attached = "true";
      video.src = video.dataset.src;
    };

    const sync = () => {
      if (!video.dataset.attached) return;
      if (preference.matches || !inView || document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };

    if (supported) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView) attach();
        sync();
      }, { rootMargin: "200px 0px" }).observe(video);
    } else {
      attach();
      inView = true;
    }

    preference.addEventListener("change", () => {
      if (!preference.matches && inView) attach();
      sync();
    });
    document.addEventListener("visibilitychange", sync);
    sync();
  });
})();
