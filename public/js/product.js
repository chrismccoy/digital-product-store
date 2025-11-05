/**
 * Client-side PayPal script for SINGLE PRODUCT mode.
 * This is a simpler version of the checkout script. It doesn't need to handle a productID
 * because the server already knows which product is being sold.
 */
document.addEventListener("DOMContentLoaded", () => {
  const paymentForm = document.getElementById("payment-form");
  if (!paymentForm) return;

  const productPrice = paymentForm.dataset.price;
  const productDescription = paymentForm.dataset.description;

  const paypalButtonContainer = document.querySelector(
    "#paypal-button-container",
  );
  const paymentMessages = document.querySelector("#payment-messages");

  if (paypalButtonContainer && paymentMessages) {
    paypal
      .Buttons({
        // `createOrder` sets up the transaction details with PayPal.
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
        // `onApprove` is called after the user approves the payment.
        onApprove: async (data, actions) => {
          paymentMessages.textContent = "Processing your payment...";
          try {
            // Only the `orderID` needs to be sent. The server knows which
            // product it is because the application is in single-product mode.
            const response = await fetch("/api/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderID: data.orderID }),
            });
            if (!response.ok) {
              const errorDetails = await response.json();
              throw new Error(
                errorDetails.message || "Server error during capture.",
              );
            }
            // If the server verifies the payment, it responds with success.
            const orderDetails = await response.json();
            if (orderDetails.success) {
              // Redirect to the success page.
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
        // No productID is needed in the URL for the single-product cancel page.
        onCancel: (data) => {
          window.location.href = "/cancel";
        },
        // `onError` is a catch-all for any unexpected errors within the PayPal SDK.
        onError: (err) => {
          console.error("PayPal Button Error:", err);
          paymentMessages.textContent =
            "An error occurred with PayPal. Please try again.";
        },
      })
      .render(paypalButtonContainer);
  }
});
