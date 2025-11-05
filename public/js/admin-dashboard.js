/**
 * Manages the single-page application (SPA) functionality for the product admin dashboard.
 * - Opening, closing, and populating the product modal for add/edit operations.
 * - Sending AJAX (fetch) requests to the backend API for all CRUD operations.
 * - Performing client-side form validation.
 * - Dynamically updating the product table in the DOM without page reloads.
 * - Displaying user feedback via toast notifications.
 * - Toggling the "empty state" view when no products exist.
 */
document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("products-table-body");
  const modal = document.getElementById("product-modal");
  const modalForm = document.getElementById("product-form");
  const modalTitle = document.getElementById("modal-title");
  const modalErrorMessage = document.getElementById("modal-error-message");
  const addProductBtnHeader = document.getElementById(
    "add-product-btn-header",
  );
  const addProductBtnEmpty = document.getElementById("add-product-btn-empty");
  const cancelModalBtn = document.getElementById("cancel-modal-btn");
  const saveProductBtn = document.getElementById("save-product-btn");
  const toast = document.getElementById("toast-notification");
  const toastMessage = document.getElementById("toast-message");
  const productsViewContainer = document.getElementById(
    "products-view-container",
  );
  const emptyStateMessage = document.getElementById("empty-state-message");
  const productsTableContainer = document.getElementById(
    "products-table-container",
  );

  let toastTimer;

  const actionButtonsHTML = `
    <button type="button" class="edit-btn font-bold uppercase underline hover:bg-yellow-300">Edit</button>
    <button type="button" class="delete-btn font-bold uppercase underline hover:bg-yellow-300">Delete</button>
  `;

  /**
   * Toggles visibility between the product table and the "empty state" message.
   */
  const checkTableEmptyState = () => {
    if (!tableBody) return;
    const hasRows = tableBody.querySelectorAll("tr").length > 0;
    productsViewContainer?.classList.toggle("hidden", !hasRows);
    emptyStateMessage?.classList.toggle("hidden", hasRows);
    productsTableContainer?.classList.toggle("hidden", !hasRows);
  };

  /**
   * Generates the inner HTML for a table row (<td> elements) for a given product.
   */
  const createProductRowHTML = (product) => `
    <td class="p-4 font-bold">${product.name}</td>
    <td class="p-4">$${product.price}</td>
    <td class="p-4">${product.text}</td>
    <td class="p-4 space-x-4">
      ${actionButtonsHTML}
    </td>`;

  /**
   * Displays a toast notification.
   */
  const showToast = (message, type = "error") => {
    if (!toast || !toastMessage) return;
    clearTimeout(toastTimer);

    toastMessage.textContent = message;
    toast.classList.remove("bg-yellow-300", "bg-red-400");
    toast.classList.add(type === "success" ? "bg-yellow-300" : "bg-red-400");
    toast.classList.remove("hidden");

    toastTimer = setTimeout(() => toast.classList.add("hidden"), 4000);
  };

  const openModal = () => modal?.classList.remove("hidden");
  const closeModal = () => modal?.classList.add("hidden");

  /**
   * Configures and opens the modal for adding a new product.
   */
  const setupAddModal = () => {
    if (!modalForm || !modalTitle || !modalErrorMessage) return;
    modalForm.reset();
    modalTitle.textContent = "Add New Product";
    modalErrorMessage.classList.add("hidden");
    modalForm.removeAttribute("data-editing-id");
    openModal();
  };

  /**
   * Fetches product data and populates the modal for editing.
   */
  const setupEditModal = async (productId) => {
    if (!modalForm || !modalTitle || !modalErrorMessage) return;
    modalForm.reset();
    modalTitle.textContent = "Edit Product";
    modalErrorMessage.classList.add("hidden");
    modalForm.setAttribute("data-editing-id", productId);

    try {
      const response = await fetch(`/admin/api/products/${productId}`);
      const result = await response.json();
      if (result.success) {
        const { product } = result;
        Object.keys(product).forEach((key) => {
          if (modalForm.elements[key]) {
            modalForm.elements[key].value = product[key];
          }
        });
        openModal();
      } else {
        showToast(result.message);
      }
    } catch (error) {
      showToast("Failed to fetch product details.");
    }
  };

  /**
   * Handles form submission for both creating and updating products.
   */
  async function handleFormSubmit(event) {
    event.preventDefault();
    if (!modalForm || !modalErrorMessage) return;
    modalErrorMessage.classList.add("hidden");

    const formData = new FormData(modalForm);
    const productData = Object.fromEntries(formData.entries());

    if (!productData.name.trim() || !productData.price.trim()) {
      modalErrorMessage.innerHTML =
        '<p class="font-bold uppercase text-red-700">Validation Error</p><p class="mt-1 text-red-800">Product Name and Price are required.</p>';
      modalErrorMessage.classList.remove("hidden");
      return;
    }

    const editingId = modalForm.dataset.editingId;
    const isEditing = !!editingId;
    const url = isEditing
      ? `/admin/api/products/${editingId}`
      : "/admin/api/products";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      const result = await response.json();

      if (result.success) {
        if (isEditing) {
          const rowToUpdate = tableBody.querySelector(
            `tr[data-id="${editingId}"]`,
          );
          if (rowToUpdate)
            rowToUpdate.innerHTML = createProductRowHTML(result.product);
        } else {
          const newRow = tableBody.insertRow();
          newRow.dataset.id = result.product.id;
          newRow.innerHTML = createProductRowHTML(result.product);
        }
        closeModal();
        showToast(`Product "${result.product.name}" saved.`, "success");
        checkTableEmptyState();
      } else {
        modalErrorMessage.innerHTML = `<p class="font-bold uppercase text-red-700">Save Error</p><p class="mt-1 text-red-800">${
          result.message || "Could not save product."
        }</p>`;
        modalErrorMessage.classList.remove("hidden");
      }
    } catch (error) {
      modalErrorMessage.innerHTML = `<p class="font-bold uppercase text-red-700">Network Error</p><p class="mt-1 text-red-800">An unexpected network error occurred.</p>`;
      modalErrorMessage.classList.remove("hidden");
    }
  }

  /**
   * Handles all clicks within the product table body
   */
  async function handleTableClick(event) {
    const { target } = event;
    const productRow = target.closest("tr");
    if (!productRow) return;

    const productId = productRow.dataset.id;
    const actionCell = target.closest("td");

    if (!actionCell) return; // Safety check

    if (target.matches(".edit-btn")) {
      setupEditModal(productId);
    } else if (target.matches(".delete-btn")) {
      actionCell.innerHTML = `
        <span class="text-sm">Are you sure?</span>
        <button type="button" class="confirm-delete-btn ml-2 font-bold uppercase underline text-red-600 hover:bg-yellow-300">Yes</button>
        <button type="button" class="cancel-delete-btn ml-2 font-bold uppercase underline hover:bg-yellow-300">No</button>`;
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

  addProductBtnHeader?.addEventListener("click", setupAddModal);
  addProductBtnEmpty?.addEventListener("click", setupAddModal);
  cancelModalBtn?.addEventListener("click", closeModal);
  modalForm?.addEventListener("submit", handleFormSubmit);
  saveProductBtn?.addEventListener("click", () => modalForm.requestSubmit()); 
  tableBody?.addEventListener("click", handleTableClick);

  checkTableEmptyState();
});
