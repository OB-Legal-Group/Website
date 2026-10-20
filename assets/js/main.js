/* OB Legal Group — سلوك الصفحة فقط. النصوص والترجمات تولَّد في HTML بواسطة build.py */
const $ = (s, r = document) => r.querySelector(s);

function initNavigation() {
  const toggle = $("#menuToggle"), nav = $("#nav");
  if (!toggle || !nav) return;
  const set = (open) => { nav.classList.toggle("open", open); toggle.setAttribute("aria-expanded", String(open)); };
  toggle.addEventListener("click", () => set(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
}


function initContactForm() {
  const form = $("#contactForm");
  if (!form) return;

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
          throw new Error("Submission failed");
        }

        form.reset();
        say(d.sent || "", "success");
      } catch (error) {
        console.error("Contact form submission failed:", error);
        say(d.error || "", "error");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
      }

      return;
    }

    // الإبقاء على طريقة البريد الإلكتروني القديمة عند عدم ضبط endpoint
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
