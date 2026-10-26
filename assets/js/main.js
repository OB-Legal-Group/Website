/* OB Legal Group — page behaviour: navigation, contact form, reveal-on-scroll */
const $ = (s, r = document) => r.querySelector(s);

function initNavigation() {
  const toggle = $("#menuToggle"), nav = $("#nav");
  if (!toggle || !nav) return;
  const set = (open) => { nav.classList.toggle("open", open); toggle.setAttribute("aria-expanded", String(open)); };
  toggle.addEventListener("click", () => set(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
}


/* hCaptcha: set to false to remove the captcha from the contact form.
   Keep it in sync with the hCaptcha option in your Web3Forms dashboard. */
const CAPTCHA_ENABLED = true;
const HCAPTCHA_SITEKEY = "50b2fe65-b00b-4b9e-ad62-3ba471098be2"; // public Web3Forms free-plan key

function initCaptcha(form) {
  if (!CAPTCHA_ENABLED) return;

  const button = form.querySelector('[type="submit"]');
  if (!button) return;

  const widget = document.createElement("div");
  widget.className = "h-captcha";
  button.before(widget);

  // hCaptcha is about 500 KB of script, so it is loaded only when the visitor
  // starts using the form instead of on every page view.
  let started = false;

  const start = () => {
    if (started) return;
    started = true;

    window.onHcaptchaReady = () => {
      window.hcaptcha.render(widget, { sitekey: HCAPTCHA_SITEKEY });
    };

    const lang = document.documentElement.lang || "en";
    const script = document.createElement("script");
    script.src = `https://js.hcaptcha.com/1/api.js?render=explicit&onload=onHcaptchaReady&hl=${lang}&recaptchacompat=off`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  };

  ["focusin", "pointerdown", "touchstart", "keydown", "submit"].forEach((type) =>
    form.addEventListener(type, start, { once: true, passive: true }),
  );
}

function initContactForm() {
  const form = $("#contactForm");
  if (!form) return;

  initCaptcha(form);

  const status = $("#formStatus");
  const d = form.dataset;

  const say = (message, type = "") => {
    if (!status) return;

    status.textContent = message;
    status.classList.remove("success", "error");

    if (type) status.classList.add(type);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    if (form.querySelector(".h-captcha")) {
      const token = form.querySelector('[name="h-captcha-response"]')?.value;

      if (!token) {
        say(d.captcha || "", "error");
        return;
      }
    }

    const data = new FormData(form);

    if (d.endpoint) {
      const button = form.querySelector('[type="submit"]');

      if (button?.disabled) return;

      const originalText = button?.textContent;

      if (button) {
        button.disabled = true;
        button.textContent = d.sending || "";
      }

      say(d.sending || "");

      try {
        const response = await fetch(d.endpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: data
        });

        const result = await response.json();

        if (!response.ok || result.success !== true) {
          throw new Error(result.message || "Submission failed");
        }

        form.reset();
        say(d.sent || "", "success");
      } catch (error) {
        console.error("Contact form submission failed:", error);
        say(d.error || "", "error");
      } finally {
        // hCaptcha tokens are single-use: always request a fresh one
        if (window.hcaptcha) window.hcaptcha.reset();

        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
      }

      return;
    }

    // Fallback: open a mailto link when no form endpoint is configured
    const label = (id) =>
      (form.querySelector(`label[for="${id}"]`) || {}).textContent || id;

    const body =
      `${label("name")}: ${data.get("name")}\n` +
      `${label("email")}: ${data.get("email")}\n\n` +
      `${data.get("message")}`;

    say(d.status || "");

    window.location.href =
      `mailto:${d.email}?subject=${encodeURIComponent(d.subject || "")}` +
      `&body=${encodeURIComponent(body)}`;
  });
}


function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) return items.forEach((i) => i.classList.add("visible"));
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); } }), { threshold: 0.12 });
  items.forEach((i) => io.observe(i));
}

initNavigation(); initContactForm(); initReveal();
