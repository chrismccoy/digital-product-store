/**
 * Client side script for the contact form. Validates each field, submits via
 * fetch, and shows an inline success or error notice without a page reload.
 */

const esc = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function noticeHtml(label, message, tone) {
  const colors =
    tone === "error"
      ? "border-red-200 bg-red-50 dark:border-red-400/20 dark:bg-red-400/5"
      : "border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/5";
  const labelColor =
    tone === "error"
      ? "text-red-700 dark:text-red-400"
      : "text-emerald-700 dark:text-emerald-300";
  const bodyColor =
    tone === "error"
      ? "text-red-800 dark:text-red-300"
      : "text-emerald-800 dark:text-emerald-300";
  return `
    <div class="rounded-2xl border px-6 py-4 text-left ${colors}">
        <p class="text-xs font-semibold uppercase tracking-widest ${labelColor} mb-1">${esc(label)}</p>
        <p class="text-sm ${bodyColor}">${esc(message)}</p>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const fields = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    message: document.getElementById("message"),
  };
  const errorEls = {
    name: document.getElementById("error-name"),
    email: document.getElementById("error-email"),
    message: document.getElementById("error-message"),
  };
  const noticeContainer = document.getElementById("notice-container");
  const submitBtn = document.getElementById("contact-submit");

  const errorInputClasses = ["border-red-400", "dark:border-red-400/50"];

  function showFieldError(key, message) {
    const el = errorEls[key];
    if (el) {
      el.textContent = message;
      el.classList.remove("hidden");
    }
    fields[key].classList.add(...errorInputClasses);
  }

  function clearFieldError(key) {
    const el = errorEls[key];
    if (el) {
      el.textContent = "";
      el.classList.add("hidden");
    }
    fields[key].classList.remove(...errorInputClasses);
  }

  Object.keys(fields).forEach((key) => {
    fields[key].addEventListener("input", () => clearFieldError(key));
  });

  function validate() {
    const values = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      message: fields.message.value.trim(),
    };

    let valid = true;
    if (!values.name) {
      showFieldError("name", "Please enter your name.");
      valid = false;
    }
    if (!values.email) {
      showFieldError("email", "Please enter your email address.");
      valid = false;
    } else if (!EMAIL_RE.test(values.email)) {
      showFieldError("email", "Please enter a valid email address.");
      valid = false;
    }
    if (!values.message) {
      showFieldError("message", "Please enter a message.");
      valid = false;
    }

    return valid ? values : null;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    noticeContainer.innerHTML = "";
    Object.keys(fields).forEach(clearFieldError);

    const values = validate();
    if (!values) return;

    submitBtn.disabled = true;
    noticeContainer.innerHTML =
      '<p class="text-sm text-slate-500 dark:text-slate-400">Sending...</p>';

    try {
      const response = await fetch("/contact/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          Object.keys(data.errors).forEach((key) => {
            if (fields[key]) showFieldError(key, data.errors[key]);
          });
        }
        throw new Error(data.message || "Your message could not be sent.");
      }

      form.reset();
      noticeContainer.innerHTML = noticeHtml(
        "Message sent",
        data.message || "Thanks for reaching out!",
        "success",
      );
    } catch (error) {
      noticeContainer.innerHTML = noticeHtml(
        "Could not send",
        error.message,
        "error",
      );
    } finally {
      submitBtn.disabled = false;
    }
  });
});
