/**
 * Service module for interacting with the PayPal REST API.
 * This handles PayPal authentication and payment capture.
 * It includes an in-memory cache for the access token to improve
 * performance by reducing the number of authentication requests to PayPal.
 */

const config = require("../config/config");

// In-memory cache for the PayPal access token. It prevents the
// app from making a new request to PayPal for every single API call.
const paypalAuthToken = {
  value: null,
  expiresAt: null,
};

/**
 * Fetches a PayPal OAuth2 access token, using the in-memory cache.
 */
async function getAccessToken() {
  // Check the cache. If a token exists in cache and its expiration time is in the future,
  // return the cached token immediately.
  if (paypalAuthToken.value && paypalAuthToken.expiresAt > Date.now()) {
    return paypalAuthToken.value;
  }

  // If the cache is empty or expired, fetch a new token from PayPal.
  const { clientId, clientSecret, apiBase } = config.paypal;

  // PayPal requires credentials to be concatenated, separated by a colon,
  // and then Base64 encoded for the 'Authorization' header.
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  // Make the POST request to PayPal's token endpoint using `fetch`.
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`, // Use the Basic Authentication scheme.
    },
    body: "grant_type=client_credentials",
  });

  // Handle potential errors from the API. A non-ok status means an HTTP error.
  if (!response.ok) {
    const errorBody = await response.text(); // Get more details about the error.
    console.error("PayPal Auth Error:", errorBody);
    throw new Error("Failed to get PayPal access token");
  }

  // Parse the successful JSON response from PayPal.
  const data = await response.json();

  // Update the in-memory cache with the new token and its expiry time.
  // Best to subtract 60 seconds from the expiry time as a safety buffer to account for network latency.
  paypalAuthToken.value = data.access_token;
  paypalAuthToken.expiresAt = Date.now() + (data.expires_in - 60) * 1000;

  // Return the new token.
  return paypalAuthToken.value;
}

/**
 * Captures a payment for a given PayPal order ID.
 * This is the final, crucial server-side step in the payment process that actually moves the funds.
 */
async function captureOrder(orderID) {
  // Get a valid access token (either from cache or a new one).
  const accessToken = await getAccessToken();

  // Construct the full URL for the capture API endpoint for the specific order.
  const url = `${config.paypal.apiBase}/v2/checkout/orders/${orderID}/capture`;

  // Make the POST request to capture the payment, authenticating with the Bearer token scheme.
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Parse the JSON response body, regardless of success or failure, to get details.
  const data = await response.json();

  // If the response was not successful, log details and throw an error.
  if (!response.ok) {
    console.error("PayPal Capture Error:", data);
    const errorMessage = data.message || "Failed to capture PayPal order.";
    throw new Error(errorMessage);
  }

  // If successful, return the full capture data for the controller to process.
  return data;
}

module.exports = { captureOrder };
