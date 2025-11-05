/**
 * Client-side PayPal checkout, shared by both application modes.
 */
document.addEventListener("DOMContentLoaded", () => {
  const paymentForm = document.getElementById("payment-form");
  if (!paymentForm) return;

  const productPrice = paymentForm.dataset.price;
  const productDescription = paymentForm.dataset.description;
  const productID = paymentForm.dataset.productId;

  const paypalButtonContainer = document.querySelector(
    "#paypal-button-container",
  );
  const paymentMessages = document.querySelector("#payment-messages");

  if (paypalButtonContainer && paymentMessages) {
    paypal
      .Buttons({
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
        onApprove: async (data, actions) => {
          paymentMessages.textContent = "Processing your payment...";
          try {
            const body = productID
              ? { orderID: data.orderID, productID }
              : { orderID: data.orderID };

            const response = await fetch("/api/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (!response.ok) {
              const errorDetails = await response.json();
              throw new Error(
                errorDetails.message || "Server error during capture.",
              );
            }
            const orderDetails = await response.json();
            if (orderDetails.success) {
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
        onCancel: (data) => {
          window.location.href = productID
            ? `/cancel?productId=${productID}`
            : "/cancel";
        },
        onError: (err) => {
          console.error("PayPal Button Error:", err);
          paymentMessages.textContent =
            "An error occurred with PayPal. Please try again.";
        },
      })
      .render(paypalButtonContainer);
  }
});
