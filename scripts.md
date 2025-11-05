### 🔧 Command-Line Scripts

These scripts are run from the root of the project.

#### Product Management CLI (`manageProducts.js`)

This powerful script lets you manage your `products.json` file without needing the admin panel. It's perfect for bulk operations or server-side automation.

*   **Show Help:**
    ```bash
    node ./scripts/manageProducts.js --help
    ```

*   **Add a Product (Interactive Mode):** You will be prompted for each field.
    ```bash
    node ./scripts/manageProducts.js
    ```

*   **Add a Product (Argument Mode):**
    ```bash
    node ./scripts/manageProducts.js --name="New Plugin" --price="49.99" --filename="plugin.zip"
    ```

*   **Delete a Product:**
    ```bash
    node ./scripts/manageProducts.js --delete new-plugin
    ```

#### Email Testing Script (`test-email.js`)

This script sends a test email using your `.env` configuration, allowing you to verify that your email settings are correct without making a real purchase.

*   **Usage:**
    ```bash
    node ./scripts/test-email.js recipient@example.com
    ```

### 📚 Managing the Product Catalog (`products.json`)

This file is the heart of your storefront and acts as a single source of truth for all product data, **used by both `shop` and `single` modes**. While you can manage products via the Admin Panel (in Shop Mode) or the CLI, you can also edit this file directly.

#### File Structure

The file is a **JSON array**, which starts with `[` and ends with `]`. Each item inside the array is a **JSON object** (enclosed in `{...}`) that represents a single product.

#### Field-by-Field Breakdown

| Field         | Type     | Description                                                                                                                                                    | Example                                                              |
| :------------ | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| `id`          | `String` | A **unique**, URL-friendly identifier for the product. **This is used in the product's URL** (e.g., `/product/brutal-ui-kit`). Use kebab-case (all lowercase with hyphens). | `"brutal-ui-kit"`                                                    |
| `name`        | `String` | The customer-facing name of the product. This is displayed prominently on the shop and product pages.                                                          | `"Brutal UI Kit"`                                                    |
| `price`       | `String` | **Crucial:** The price of the product, which **must be a string** with two decimal places. This is required for the PayPal API and the server-side security check. | `"79.00"` (Correct)<br/>`79` (Incorrect)<br/>`79.0` (Incorrect)      |
| `text`        | `String` | A short description or tagline used on the product page and checkout section.                                                                                  | `"BrutalKit UI - Lifetime License"`                                  |
| `filename`    | `String` | **Crucial:** The **exact filename** (including extension) of the digital product located in the `/private_downloads` directory. This is case-sensitive.          | `"brutalkit-v1.zip"`                                                 |
| `image`       | `String` | The URL for the product's image displayed on the shop page. This can be an external URL or a local path (e.g., `/images/my-product.png`).                         | `"https://placehold.co/800x600/000000/FFFF00?text=UI+KIT"`            |
| `description` | `String` | The main description of the product shown on the shop page grid. Keep it concise, around one or two sentences.                                                 | `"A complete system of unstyled, accessible components..."`          |

#### Complete Example

Here is a complete example of a `products.json` file with three products. You can use this as a template.

```json
[
  {
    "id": "brutal-ui-kit",
    "name": "Brutal UI Kit",
    "price": "79.00",
    "text": "BrutalKit UI - Lifetime License",
    "filename": "brutalkit-v1.zip",
    "image": "https://placehold.co/800x600/000000/FFFF00?text=UI+KIT",
    "description": "A complete system of unstyled, accessible components for developers who value function over form."
  },
  {
    "id": "portfolio-template",
    "name": "Portfolio Template",
    "price": "49.00",
    "text": "Brutalist Portfolio HTML Template",
    "filename": "portfolio-template-v1.zip",
    "image": "https://placehold.co/800x600/e8e8e8/000000?text=TEMPLATE",
    "description": "The complete source code for this website. A ready-to-deploy brutalist portfolio template."
  },
  {
    "id": "monospace-icons",
    "name": "Monospace Icon Set",
    "price": "29.00",
    "text": "100+ Monospace SVG Icons",
    "filename": "monospace-icons-v1.zip",
    "image": "https://placehold.co/800x600/e8e8e8/000000?text=ICON+SET",
    "description": "A collection of 100+ sharp, single-stroke SVG icons designed for clarity and technical precision."
  }
]
```

#### How to Add a New Product

1.  **Prepare your file:** Place the new digital product file (e.g., `my-new-product.zip`) inside the `/private_downloads` directory.
2.  **Open `products.json`:** Open the file in your code editor.
3.  **Copy an existing object:** Copy an entire product object, from its opening `{` to its closing `}`.
4.  **Add a comma:** If you are adding the new product after an existing one, make sure to add a comma `,` after the closing `}` of the preceding product.
5.  **Paste the new object:** Paste the copied object into the array.
6.  **Update the values:** Carefully change all the values (`id`, `name`, `price`, etc.) to match your new product.
7.  **Save the file.** If you are running the server with `npm run dev`, the shop page will update automatically when you refresh your browser.

#### ⚠️ Important Considerations

*   **Valid JSON Syntax:** The most common mistake is a missing or extra comma. Every product object must be separated by a comma, except for the very last one. If you get an error, use an online tool like [JSONLint](https://jsonlint.com/) to validate your `products.json` file.
*   **Price MUST be a String:** Always enclose the price in double quotes (e.g., `"29.00"`). A number (`29.00`) will cause the payment verification to fail.
*   **Filenames Must Match Exactly:** The value of the `filename` field is case-sensitive and must perfectly match the name of the file in the `/private_downloads` folder.
