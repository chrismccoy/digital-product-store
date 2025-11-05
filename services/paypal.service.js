/**
 * Service module for interacting with the PayPal REST API.
 */

const config = require("../config/config");

const paypalAuthToken = {
  value: null,
  expiresAt: null,
};

async function getAccessToken() {
  if (paypalAuthToken.value && paypalAuthToken.expiresAt > Date.now()) {
    return paypalAuthToken.value;
  }

  const { clientId, clientSecret, apiBase } = config.paypal;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`, // Use the Basic Authentication scheme.
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorBody = await response.text(); // Get more details about the error.
    console.error("PayPal Auth Error:", errorBody);
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();

  paypalAuthToken.value = data.access_token;
  paypalAuthToken.expiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return paypalAuthToken.value;
}

async function captureOrder(orderID) {
  const accessToken = await getAccessToken();

  const url = `${config.paypal.apiBase}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("PayPal Capture Error:", data);
    const errorMessage = data.message || "Failed to capture PayPal order.";
    throw new Error(errorMessage);
  }

  return data;
}

module.exports = { captureOrder };
