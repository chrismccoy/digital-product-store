/**
 * Client-side PayPal script for SHOP mode.
 * This script is responsible for rendering the PayPal buttons on a product-specific page.
 * It reads the product's price, description, and unique ID from data-* attributes
 * in the HTML, which are set by the server. It then sends this productID to the server
 * during the capture and cancel steps.
 */
document.addEventListener("DOMContentLoaded", () => {
  const paymentForm = document.getElementById("payment-form");
  if (!paymentForm) return;

  // Read all product-specific data from the `data-*` attributes on the payment form.
  const productPrice = paymentForm.dataset.price;
  const productDescription = paymentForm.dataset.description;
  const productID = paymentForm.dataset.productId; // This is crucial for shop mode.

  const paypalButtonContainer = document.querySelector(
    "#paypal-button-container",
  );
  const paymentMessages = document.querySelector("#payment-messages");

  if (paypalButtonContainer && paymentMessages) {
    paypal
      .Buttons({
        // `createOrder` is called when the user clicks the PayPal button.
        // It sets up the transaction details with PayPal.
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                description: productDescription,
                amount: {
                  value: productPrice,
                },
              },
            ],
          });
        },
        // `onApprove` is called after the user successfully approves the payment in the PayPal popup.
        // This is the point where we securely hand off the transaction to our own server.
        onApprove: async (data, actions) => {
          paymentMessages.textContent = "Processing your payment...";
          try {
            // Send BOTH the `orderID` from PayPal and our internal `productID`
            // to our server's `/api/capture-order` endpoint for secure verification.
            const response = await fetch("/api/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderID: data.orderID,
                productID: productID, // Sending the specific product ID is critical.
              }),
            });
            if (!response.ok) {
              const errorDetails = await response.json();
              throw new Error(
                errorDetails.message || "Server error during capture.",
              );
            }
            // If the server successfully verifies and captures the payment,
            // it will respond with `success: true` and a unique transactionId.
            const orderDetails = await response.json();
            if (orderDetails.success) {
              // Redirect the user to the success page.
              window.location.href = `/purchase/success?transactionId=${orderDetails.transactionId}`;
            } else {
              paymentMessages.textContent = `Error: ${
                orderDetails.message ||
                "Could not finalize payment. Please try again."
              }`;
            }
          } catch (error) {
            console.error("Approval Error:", error);
            paymentMessages.textContent = `An unexpected error occurred: ${error.message}`;
          }
        },
        // `onCancel` is called if the user closes the PayPal window.
        // We redirect them to our own cancellation page, passing the productID
        // so the page can show which item was being purchased.
        onCancel: (data) => {
          window.location.href = `/cancel?productId=${productID}`;
        },
        // `onError` is a catch-all for any unexpected errors within the PayPal SDK itself.
        onError: (err) => {
          console.error("PayPal Button Error:", err);
          paymentMessages.textContent =
            "An error occurred with PayPal. Please try again.";
        },
      })
      .render(paypalButtonContainer);
  }
});
