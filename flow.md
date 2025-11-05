### 👤 User & Admin Workflows

#### Customer: Purchase & Redownload

1.  **Browse:** The customer visits the site (either the shop or single product page).
2.  **Checkout:** On the product page, they click the PayPal button.
3.  **Payment:** They complete the payment in the secure PayPal popup window.
4.  **Verification:** The server securely captures the payment, verifies the amount paid matches the product price, and saves a transaction record.
5.  **Success:** The customer is redirected to a success page displaying their purchase details and a secure, one-time download button.
6.  **Email:** Simultaneously, they receive an HTML email receipt with the same purchase details and a link to the redownload page.
7.  **Redownload:** If the customer loses their file, they can visit the "Redownload" page, enter their Transaction ID or email, and get a new secure download link.

#### Administrator: Managing Products (Shop Mode Only)

1.  **Login:** The admin navigates to `/admin/login` and enters the `ADMIN_USERNAME` and `ADMIN_PASSWORD` from the `.env` file.
2.  **Dashboard:** Upon success, they are redirected to the product dashboard.
3.  **Create:** They can click "Add Product" to open a modal, fill in the product details, and save. The product list updates instantly without a page reload.
4.  **Update:** Clicking "Edit" on any product opens the same modal pre-filled with that product's data for easy updating.
5.  **Delete:** Clicking "Delete" prompts for confirmation before permanently removing the product from `products.json`.

### 🌊 Shop Application Process

### 💳 The Purchase

This is the step-by-step from a user clicking the PayPal button to receiving their download link.

*   **① Client-Side: User Initiates Payment**
    *   A user clicks the PayPal button on a purchase page (`/purchase` or `/product/:id`).
    *   The client-side JavaScript calls `paypal.Buttons({ createOrder: ... })`.
    *   The script reads the product's price and description from the `data-*` attributes in the HTML and sends this information to PayPal's servers to create an order.
    *   PayPal responds with a unique `orderID`, and the PayPal checkout popup/window opens.

*   **② Client-Side: User Approves Payment**
    *   The user logs into their PayPal account (or enters guest checkout details) and approves the transaction.
    *   The PayPal popup closes, and control is returned to our page.
    *   The PayPal SDK automatically triggers the `onApprove` function in our script, providing the final, approved `orderID`.

*   **③ Client-to-Server: Hand-off for Secure Capture**
    *   The `onApprove` function immediately shows a "Processing..." message to the user.
    *   It then makes a `POST` request to our server's `/api/capture-order` endpoint.
    *   **Crucially**, it sends a JSON body containing the `orderID` from PayPal. If in `shop` mode, it also sends the `productID` from the page's `data-*` attribute.

*   **④ Server-Side: Verification & Capture**
    *   The `purchase.controller.js` on the server receives the request.
    *   It calls the `paypal.service.js`, which communicates directly with PayPal's API to officially "capture" the funds for the given `orderID`.
    *   **Security Check #1:** The controller inspects PayPal's response. If the payment status is anything other than `COMPLETED`, it rejects the transaction.
    *   **Security Check #2 (The Price Check):** The controller extracts the actual amount paid from PayPal's response. It compares this value against the price stored in its own secure configuration (`products.json`). If they don't match, it rejects the transaction.

*   **⑤ Server-Side: Record Keeping & Authorization**
    *   If all security checks pass, the controller creates a new transaction object containing all the verified details (PayPal IDs, payer info, product info).
    *   This transaction object is appended to the `data/transactions.json` file.
    *   The `email.service.js` is triggered to asynchronously send a purchase receipt to the customer.
    *   The server sends a `200 OK` success response back to the client's original `fetch` request, including the unique `transactionId` for the newly created record.

*   **⑥ Client-Side: Redirection to Success**
    *   The client-side `onApprove` function receives the successful JSON response from the server.
    *   It uses the `transactionId` from the response to construct the final URL (e.g., `/purchase/success?transactionId=...`).
    *   It redirects the user's browser to this success page.

*   **⑦ Server-Side: Rendering the Success Page**
    *   The server's `download.controller.js` handles the request for the `/purchase/success` page.
    *   It verifies that the `transactionId` in the URL corresponds to a real transaction in the database.
    *   If valid, it sets the `authorizedProduct` variable in the user's secure session (`req.session`).
    *   Finally, it renders the success page, which contains the download button. The user is now authorized to download the file.

### 🔄 The Redownload

The returning customer who has lost their original download link.

*   **① Client-Side: User Submits Credentials**
    *   A user navigates to the `/redownload` page.
    *   They fill out the form with either their original PayPal Transaction ID or their purchase email.
    *   They click "Verify & Download".
    *   The `redownload-handler.js` script prevents the default form submission.

*   **② Client-to-Server: Verification Request**
    *   The script shows a "Verifying..." message.
    *   It makes a `POST` request to the server's `/api/verify-transaction` endpoint, sending the transaction ID and/or email in a JSON body.

*   **③ Server-Side: Database Lookup**
    *   The `download.controller.js` receives the request.
    *   It calls the `transaction.service.js` to search the `data/transactions.json` database.
    *   If a Transaction ID was provided, it looks for an exact match.
    *   If an email was provided, it finds all transactions for that email and returns the most recent one.

*   **④ Server-Side: Authorization & Response**
    *   If a matching transaction is found, the controller sets the `authorizedProduct` variable in the user's session (`req.session`), just like in the original purchase flow.
    *   It sends a `200 OK` success response back to the client, containing the details of the found transaction.
    *   If no transaction is found, it sends a `404 Not Found` error response with a corresponding message.

*   **⑤ Client-Side: Dynamic Page Update**
    *   The `redownload-handler.js` script receives the response from the server.
    *   **On Success:** It dynamically hides the form and uses JavaScript to build and inject a success message, the purchase details, and a new download button directly into the page without a page reload.
    *   **On Failure:** It dynamically injects an error message into the page, informing the user that no purchase was found.

*   **⑥ The Download Itself (Shared Flow)**
    *   Whether arriving from the initial purchase or a redownload, the user now clicks a "Download File" button, which links to `/download/product`.
    *   The `download.controller.js` handles this request. It performs the **core security check:** does `req.session.authorizedProduct` exist?
    *   If yes, it immediately **deletes `req.session.authorizedProduct`** to invalidate the link for future use, finds the correct product filename, and serves the file for download.
    *   If no, it denies access and redirects the user to the `/redownload` page.
