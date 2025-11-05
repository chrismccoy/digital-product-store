/**
 * Manages the admin product dashboard table.
 */
document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("products-table-body");
  const productsViewContainer = document.getElementById(
    "products-view-container"
  );
  const emptyStateMessage = document.getElementById("empty-state-message");
  const productsTableContainer = document.getElementById(
    "products-table-container"
  );

  const toast = document.getElementById("toast-notification");
  const toastMessage = document.getElementById("toast-message");

  let toastTimer;
  const TOAST_TIMEOUT_MS = 4000;

  const actionButtonsHTML = `
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="edit-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors duration-150"
      >
        Edit
      </button>
      <button
        type="button"
        class="delete-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors duration-150"
      >
        Delete
      </button>
    </div>
  `;

  const checkTableEmptyState = () => {
    if (!tableBody) return;
    const hasRows = tableBody.querySelectorAll("tr").length > 0;
    productsViewContainer?.classList.toggle("hidden", !hasRows);
    emptyStateMessage?.classList.toggle("hidden", hasRows);
    productsTableContainer?.classList.toggle("hidden", !hasRows);
  };

  const showToast = (message, type = "error") => {
    if (!toast || !toastMessage) return;
    clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.classList.remove("bg-yellow-300", "bg-red-400");
    toast.classList.add(type === "success" ? "bg-yellow-300" : "bg-red-400");
    toast.classList.remove("hidden");
    toastTimer = setTimeout(() => toast.classList.add("hidden"), TOAST_TIMEOUT_MS);
  };

  async function handleTableClick(event) {
    const { target } = event;
    const productRow = target.closest("tr");
    if (!productRow) return;

    const productId = productRow.dataset.id;
    const actionCell = target.closest("td");
    if (!actionCell) return;

    if (target.matches(".edit-btn")) {
      window.location.href = `/admin/products/${productId}/edit`;
    } else if (target.matches(".delete-btn")) {
      actionCell.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-600 font-medium">Are you sure?</span>
          <button
            type="button"
            class="confirm-delete-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors duration-150"
          >
            Yes
          </button>
          <button
            type="button"
            class="cancel-delete-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-150"
          >
            No
          </button>
        </div>`;
    } else if (target.matches(".cancel-delete-btn")) {
      actionCell.innerHTML = actionButtonsHTML;
    } else if (target.matches(".confirm-delete-btn")) {
      try {
        const response = await fetch(`/admin/api/products/${productId}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
          productRow.remove();
          showToast("Product deleted successfully.", "success");
          checkTableEmptyState();
        } else {
          showToast(result.message);
        }
      } catch (error) {
        showToast("An unexpected network error occurred.");
      }
    }
  }

  tableBody?.addEventListener("click", handleTableClick);

  let draggedRow = null;

  const getRowAfterCursor = (y) => {
    const rows = [
      ...tableBody.querySelectorAll("tr[draggable]:not(.is-dragging)"),
    ];
    return rows.reduce(
      (closest, row) => {
        const box = row.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: row };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null },
    ).element;
  };

  const reorderEnabled = () => tableBody?.dataset.reorderEnabled !== "false";

  const persistOrder = async () => {
    if (!reorderEnabled()) return;
    const order = [...tableBody.querySelectorAll("tr[data-id]")].map(
      (row) => row.dataset.id,
    );
    const startIndex = parseInt(tableBody.dataset.startIndex, 10) || 0;
    try {
      const response = await fetch("/admin/api/products/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order, startIndex }),
      });
      const result = await response.json();
      if (result.success) {
        showToast("Order saved.", "success");
      } else {
        showToast(result.message || "Could not save order.");
      }
    } catch (error) {
      showToast("An unexpected network error occurred.");
    }
  };

  tableBody?.addEventListener("dragstart", (event) => {
    if (!reorderEnabled()) return;
    const row = event.target.closest("tr[draggable]");
    if (!row) return;
    draggedRow = row;
    row.classList.add("is-dragging", "opacity-50");
    event.dataTransfer.effectAllowed = "move";
  });

  tableBody?.addEventListener("dragover", (event) => {
    if (!draggedRow) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const afterRow = getRowAfterCursor(event.clientY);
    if (afterRow == null) {
      tableBody.appendChild(draggedRow);
    } else if (afterRow !== draggedRow) {
      tableBody.insertBefore(draggedRow, afterRow);
    }
  });

  tableBody?.addEventListener("dragend", () => {
    if (!draggedRow) return;
    draggedRow.classList.remove("is-dragging", "opacity-50");
    draggedRow = null;
    persistOrder();
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("saved")) {
    showToast(`Product "${params.get("saved")}" saved.`, "success");
    history.replaceState(null, "", window.location.pathname);
  }

  checkTableEmptyState();
});
