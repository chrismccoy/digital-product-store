# Digital Product Store

A secure, dual-mode e-commerce application for selling digital goods with an integrated admin panel.

#### Prerequisite

You must have a **PayPal Business account**. You cannot use a Personal account to generate the necessary REST API credentials.

### ✨ Features

*   **↔️ Dual Application Modes:** Run in **Shop Mode** to display a multi-product catalog with pagination, or switch to **Single Product Mode** for a streamlined, high-conversion landing page. The Admin Panel is automatically disabled in Single Product Mode.
*   **🔐 Secure Admin Panel (Shop Mode):** Manage your entire product catalog through a password-protected dashboard with full CRUD (Create, Read, Update, Delete) functionality.
*   **💳 Secure PayPal Integration:** All payment processing is handled on the server-side to prevent client-side price manipulation and ensure transaction integrity.
*   **📦 Protected Downloads:** Download links are authorized via secure, server-side sessions, making them single-use and preventing unauthorized sharing of your digital files.
*   **📧 Automated Email Receipts:** Customers automatically receive a professional HTML email receipt with their purchase details and a link to redownload their product.
*   **🔒 Brute-Force Protection:** The admin login route is protected by a rate limiter, blocking IP addresses that make too many failed login attempts.
*   **💻 Powerful CLI Tools:** Manage your product catalog and test your email configuration directly from the command line without needing to access the admin panel.
*   **📱 Responsive Design:** A clean, brutalist-inspired design that looks great on all devices, built with Tailwind CSS.
*   **⚙️ Easy Configuration:** The entire application is configured through a single `.env` file, making setup and deployment incredibly simple.


### 🔒 Security Features

This application was built with security as a primary concern.

*   **Server-Side Price Validation:** The final, authoritative price of a product is always retrieved from the secure server-side configuration (`products.json`) during the payment capture step. This prevents a malicious user from manipulating the price in the browser's developer tools.

*   **Protected File Downloads:** All digital product files are stored in a `private_downloads` directory which is not publicly accessible. Files are only served through a dedicated `/download/product` route after verifying the user has a valid, authorized session.

*   **One-Time Use Download Links:** The session authorization for a download is immediately invalidated after the file is requested. This means the download link cannot be copied and shared. To download again, a user must re-verify their purchase.

*   **Brute-Force Protection (Rate Limiting):** To prevent automated password guessing attacks, the admin login route (`POST /admin/login`) is protected by a rate limiter. By default, it allows **5 failed login attempts** from the same IP address within a **15-minute window**. After the limit is exceeded, further requests are blocked with a `429 Too Many Requests` error until the window resets. This is a crucial security layer, and the limits can be easily configured in your `.env` file.

