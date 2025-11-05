/**
 * Client-side script for handling the redownload verification form.
 * This script manages form submission via fetch, communicates with the server's
 * verification API, and dynamically updates the page with success or error messages
 * without a page reload. This script is generic and works for both application modes.
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("redownload-form");
  if (!form) return; // Exit if the form isn't on the current page.

  const transactionIdInput = document.getElementById("transactionId");
  const emailInput = document.getElementById("email");
  const resultContainer = document.getElementById("result-container");
  const errorContainer = document.getElementById("error-container");
  const introSection = document.getElementById("redownload-intro");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Clear previous results and provide immediate "loading" feedback to the user.
    errorContainer.innerHTML = "";
    resultContainer.innerHTML = '<p class="text-lg">Verifying...</p>';

    const transactionId = transactionIdInput.value.trim();
    const email = emailInput.value.trim();

    // Perform basic client-side validation.
    if (!transactionId && !email) {
      resultContainer.innerHTML = ""; // Clear "Verifying..."
      errorContainer.innerHTML = `
        <div class="border-2 border-red-600 bg-red-50 p-4 text-left">
            <p class="font-bold uppercase text-red-700">Input Required</p>
            <p class="mt-1 text-red-800">Please enter a Transaction ID or an Email Address.</p>
        </div>
      `;
      return; // Stop execution.
    }

    try {
      // Use the Fetch API to make an asynchronous POST request to our server's verification endpoint.
      const response = await fetch("/api/verify-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the credentials as a JSON string in the request body.
        body: JSON.stringify({ transactionId, email }),
      });

      const data = await response.json(); // Parse the JSON response from the server.

      if (!response.ok) {
        throw new Error(data.message || "Verification failed.");
      }

      // If the server confirms success and provides the transaction data...
      if (data.success && data.transaction) {
        const transaction = data.transaction;
        introSection.style.display = "none"; // Hide the original form.
        form.style.display = "none";

        // Dynamically build the entire success view using a template literal
        resultContainer.innerHTML = `
          <p class="text-4xl font-bold uppercase text-green-700 mb-8">Verification Successful!</p>
          <section class="max-w-xl mx-auto mt-4 border-2 border-black p-6 bg-white space-y-4 text-left">
              <h3 class="text-2xl font-bold uppercase inline-block bg-black text-yellow-300 px-3 py-1 mb-4">
                  // Your Purchase Details
              </h3>
              <div class="divide-y-2 divide-black">
                  <div class="flex flex-wrap p-2">
                      <span class="font-bold uppercase w-1/3">Product:</span>
                      <span class="w-2/3">${transaction.product.name}</span>
                  </div>
                  <div class="flex flex-wrap p-2">
                      <span class="font-bold uppercase w-1/3">Customer:</span>
                      <span class="w-2/3">${transaction.payer.firstName} ${transaction.payer.lastName}</span>
                  </div>
                  <div class="flex flex-wrap p-2">
                      <span class="font-bold uppercase w-1/3">Email:</span>
                      <span class="w-2/3 break-all">${transaction.payer.email}</span>
                  </div>
                  <div class="flex flex-wrap p-2">
                      <span class="font-bold uppercase w-1/3">Transaction ID:</span>
                      <span class="w-2/3 break-all font-bold text-lg">${transaction.id}</span>
                  </div>
              </div>
          </section>
          <section class="max-w-xl mx-auto w-full mt-12">
              <a href="/download/product" class="block w-full text-center px-8 py-6 bg-yellow-300 text-black text-2xl font-bold border-2 border-black uppercase transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000]">
                  Download Your File
              </a>
              <p class="text-sm text-neutral-600 mt-4">(This link is valid for one download)</p>
          </section>
        `;
      }
    } catch (error) {
      resultContainer.innerHTML = ""; // Clear "Verifying..."
      errorContainer.innerHTML = `
        <div class="border-2 border-red-600 bg-red-50 p-4 text-left">
            <p class="font-bold uppercase text-red-700">Verification Failed</p>
            <p class="mt-1 text-red-800">${error.message}</p>
        </div>
      `;
    }
  });
});
