/**
 * Redownload verification form.
 */

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

function noticeHtml(label, message, tone) {
  const colors =
    tone === "error"
      ? "border-red-200 bg-red-50 dark:border-red-400/20 dark:bg-red-400/5"
      : "border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/5";
  const labelColor =
    tone === "error"
      ? "text-red-700 dark:text-red-400"
      : "text-slate-500 dark:text-slate-400";
  const bodyColor =
    tone === "error"
      ? "text-red-800 dark:text-red-300"
      : "text-slate-700 dark:text-slate-300";
  return `
    <div class="rounded-2xl border px-6 py-4 text-left ${colors}">
        <p class="text-xs font-semibold uppercase tracking-widest ${labelColor} mb-1">${esc(label)}</p>
        <p class="text-sm ${bodyColor}">${esc(message)}</p>
    </div>
  `;
}

function actionSectionHtml(hasFile, serviceMessage) {
  if (hasFile) {
    return `
      <section class="mx-auto max-w-md mb-8">
          <a href="/download/product" class="group flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-8 py-5 text-lg font-bold text-white shadow-lg transition-all duration-150 hover:scale-[1.02] hover:bg-emerald-600 dark:bg-white dark:text-slate-950 dark:hover:bg-emerald-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Your File
          </a>
          <p class="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">This link is valid for one download</p>
      </section>`;
  }
  return `
    <section class="mx-auto max-w-xl mb-8">
        <div class="rounded-2xl border border-slate-200 bg-slate-50/80 px-6 py-4 text-left dark:border-white/10 dark:bg-white/5">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">No file for this item</p>
            <p class="text-sm text-slate-700 dark:text-slate-300">${esc(serviceMessage)}</p>
        </div>
    </section>`;
}

function successHtml(transaction, actionSection) {
  return `
    <section class="pt-2 pb-8 text-center">
        <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium tracking-[0.2em] text-emerald-700 uppercase dark:text-emerald-300">Verified</div>
        <h2 class="text-4xl font-black leading-none tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Verification
            <span class="bg-gradient-to-r from-emerald-500 via-cyan-500 to-brand-500 bg-clip-text text-transparent">complete!</span>
        </h2>
    </section>
    ${actionSection}
    <section class="mx-auto max-w-xl text-left">
        <div class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 shadow-panelLight dark:border-white/10 dark:bg-white/5 dark:shadow-panelDark">
            <div class="border-b border-slate-200 bg-slate-50/80 px-8 py-5 dark:border-white/10 dark:bg-white/5">
                <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Purchase Details</p>
            </div>
            <div class="divide-y divide-slate-100 px-8 dark:divide-white/5">
                <div class="flex flex-wrap items-center gap-2 py-4"><span class="w-32 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Product</span><span class="text-sm font-medium text-slate-950 dark:text-white">${esc(transaction.product.name)}</span></div>
                <div class="flex flex-wrap items-center gap-2 py-4"><span class="w-32 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Customer</span><span class="text-sm font-medium text-slate-950 dark:text-white">${esc(transaction.payer.firstName)} ${esc(transaction.payer.lastName)}</span></div>
                <div class="flex flex-wrap items-center gap-2 py-4"><span class="w-32 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Email</span><span class="break-all text-sm font-medium text-slate-950 dark:text-white">${esc(transaction.payer.email)}</span></div>
                <div class="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50/60 py-4 dark:bg-amber-400/5"><span class="w-32 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Transaction ID</span><span class="break-all rounded-lg bg-amber-100 px-2 py-1 text-sm font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300">${esc(transaction.id)}</span></div>
            </div>
        </div>
    </section>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("redownload-form");
  if (!form) return;

  const transactionIdInput = document.getElementById("transactionId");
  const emailInput = document.getElementById("email");
  const resultContainer = document.getElementById("result-container");
  const errorContainer = document.getElementById("error-container");
  const introSection = document.getElementById("redownload-intro");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorContainer.innerHTML = "";
    resultContainer.innerHTML =
      '<p class="text-lg text-slate-500 dark:text-slate-400">Verifying...</p>';

    const transactionId = transactionIdInput.value.trim();
    const email = emailInput.value.trim();

    if (!transactionId && !email) {
      resultContainer.innerHTML = "";
      errorContainer.innerHTML = noticeHtml(
        "Input required",
        "Please enter a Transaction ID or an Email Address.",
        "error",
      );
      return;
    }

    try {
      const response = await fetch("/api/verify-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed.");
      }

      if (data.success && data.transaction) {
        introSection.style.display = "none";
        form.style.display = "none";

        const actionSection = actionSectionHtml(
          data.hasFile,
          data.serviceMessage,
        );
        resultContainer.innerHTML = successHtml(data.transaction, actionSection);
      }
    } catch (error) {
      resultContainer.innerHTML = "";
      errorContainer.innerHTML = noticeHtml(
        "Verification failed",
        error.message,
        "error",
      );
    }
  });
});
