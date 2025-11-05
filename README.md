# Digital Product Store

This is a small online store for selling digital products, such as files people download after they pay. It shows the shop pages, takes payment through PayPal, sends the buyer a receipt email, and gives them a download link that works one time. It also includes an admin panel where you sign in to add products, view sales, and change settings.

The store runs in one of two ways, and you pick which from the admin settings:

- Shop mode: many products in a browsable grid.
- Single product mode: the whole site points at one product.

You can switch between the two at any time

#### Prerequisite

You must have a **PayPal Business account**. A Personal account cannot generate the API credentials this app needs.

### Admin Features

Things you do to run the store, from the admin pages.

- **Two Ways to Sell:** Show many products in a store, or show just one product on its own page. You pick which from the settings, and the site changes over right away.
- **Admin Login:** The admin pages are behind a password, so only you can add, edit, and remove products. When you make a change, the page updates without reloading. The sidebar has links at the top to sign out and to open your live store in a new tab.
- **Settings Page:** Change your store name, links, homepage and header text, footer text, how many products show per page, and your email details from one settings page. The options are split into tabs, such as General, Shop content, Shop, Email, Mode, Default image, and Account, so each group is easy to find without a long scroll. Your changes save and take effect right away. You never have to edit files by hand.
- **Change Your Login:** Change your admin username and password from the settings page. The password is saved in a scrambled form, never as plain text. The values in the `.env` file are used only the first time, until you set your own.
- **Maintenance Mode:** Close the shop for a while with a maintenance page you turn on from the settings. Visitors see a simple page with a heading and message you choose, while you stay signed in and can still open the live store to check your work. The admin area always stays open, so you can turn it back off whenever you are ready.
- **Search Engine Settings:** A settings tab for search engines and social sharing. Set your site address, a default description, a Twitter or X handle, and a picture to show when pages are shared. There is also a switch that asks search engines not to list your store, handy while you are still setting things up before launch.
- **Private Products:** Mark any product as private on the add or edit page. A private product is hidden from your shop grid, your category and tag pages, and the sitemap, and search engines are asked not to list it. It still works from its own direct link, so you can share a private product address with only the people you choose.
- **Categories:** Make categories and put each product in one. You can filter your product list by category, including a group for products with no category. If you delete a category, its products stay and are marked as having no category.
- **Search Products:** Search your product list by name or product ID from the box at the top of the admin dashboard. You can search on its own or together with the category filter to narrow the list further, so you can find one product fast even when you have many. A Clear link brings back the full list.
- **Product Tags:** Add tags to a product by typing them on the add or edit page. Press comma or Enter and each word turns into a tag. Tags help customers find related products, and you can reuse the same tag on as many products as you like.
- **Website and Demo Links:** Give a product an optional link to its own website and an optional live demo link. Fill in either one and it shows as a button on the product page. Leave them empty and nothing extra appears.
- **Screenshots:** Add a set of screenshots to a product. Upload several at once on the add or edit page, and remove any you no longer want with a checkbox. They show as a gallery on the product page.
- **Faster Screenshots:** Turn on smaller screenshot images from the settings page so image-heavy products load quicker. The store makes a smaller copy of each new screenshot for the grid and keeps the full-size one for the popup viewer. This needs the `sharp` image tool installed. If it is not installed, the option is greyed out and the store simply uses the full-size images with the browser loading them only as needed.
- **Backup Image:** Upload one backup image in settings for any product you add without a picture of its own. If you do not set one, a built-in image is shown, so a product never looks broken in the store.
- **Pin to Top:** Pin one or more products so they always show first in the store.
- **Drag to Reorder:** Drag products into any order on the admin page, and the store shows that same order. New products start at the top until you move them.
- **Products With No File:** Sell a service or anything that has no file to download. Leave the file empty and write a note that buyers see after they pay, such as letting them know you will be in touch. You can also set one note to use for every product that has no file.
- **Products Per Page:** Set how many products show on each store page, and set a different number for your admin product list. If someone opens a page that no longer exists, they are sent to the last real page.
- **Transactions List:** A transactions page shows every completed purchase, newest first. You choose how many show per page, and long lists split into pages so they stay easy to read.
- **Search Transactions:** Look up a purchase by buyer email, buyer name, product name, order number, or transaction ID. The list narrows to the matches, so you can find one order fast even when there are many.
- **View a Transaction:** Open any purchase to see its full details, such as the buyer, the product, the price, and when it happened. Handy when a buyer loses their receipt or asks about an order. The record still shows even if you later delete the product.
- **Receipt Status and Resend:** Each purchase shows whether the receipt email was sent or not. If it did not go through, or the buyer never got it, open the purchase and press Resend to send it again. A sale is never held up waiting on email, so a mail problem never blocks a customer from paying.
- **Order History Stays Accurate:** Every order saves the product name and price as they were at the time of the sale. If you later rename a product or change its price, your past orders still show what the buyer actually paid.
- **Login Lockout:** After too many wrong password tries, the admin login is blocked for a while, so no one can keep guessing.
- **Terminal Tools:** Manage products and send a test receipt email from the terminal, without opening a browser. There are step-by-step prompts or short one-line commands. Run `npm run products:help` to see the options, including `--delete` to remove a product by its ID.
- **Built-In Storage:** Your products and orders are kept in one small database file (`db/store.db`) that is made for you the first time you run the store. There is nothing separate to install or set up.
- **Quick Setup:** Your PayPal keys, session secret, and starting admin login go in one `.env` file. Everything else, such as your store text, email details, and page sizes, is set from the settings page.

### Shop Features

What your customers see and use on the store.

- **Product Grid:** Products show a page at a time. Pinned products come first, then the order you set. If you prefer, the store can show a single product on its own page instead.
- **Category Filter:** Turn on a filter bar so customers can view one category at a time, and every product page links back to its category.
- **Browse by Tag:** Products show their tags as small chips on the store and on each product page. Click a tag to open a page with every product that shares it.
- **Website and Live Demo Buttons:** When a product has a website or demo link, buttons appear near its title so customers can visit the site or try a live demo before they buy.
- **Screenshot Gallery:** Products can show a grid of screenshots. Click any one to open a full-screen viewer with next and previous arrows, a row of thumbnails to jump between images, a counter, and a button to save the picture. Arrow keys move between screenshots and the Escape key closes the viewer.
- **Safe Payments:** Every payment is checked on the server, so no one can change the price in their browser. The amount PayPal takes is always matched against your own price before the sale goes through.
- **Private Downloads:** Product files are never open to the public. Each download link belongs to one confirmed purchase and works only once. To download again, a customer uses the Redownload page with their order number or the email they paid with.
- **Receipt Emails:** Buyers get a receipt email as soon as their payment goes through, with their order details and a link to download the file again later. Works with your server's mail or an email service you already use.
- **Contact Form:** A contact page where visitors send you a message with their name, email, and a short note. All three boxes must be filled in, and the page shows a thank you or an error the moment they press send, without reloading. Messages come to your own inbox using the same email details as your receipts, so you can reply straight to the person who wrote in. To cut down on spam, there is a limit on how many messages one visitor can send in a short time. You can change the page heading and wording from the settings.
- **Free Products:** A product priced at $0.00 skips payment and goes straight to the download page, so you can offer free items next to paid ones.
- **Built for Search and Sharing:** Every page carries the details search engines and social sites read: a title, a description, a canonical link, and a preview picture. Product pages add clear information about the item and its price, and category, tag, and product pages show a breadcrumb trail so visitors know where they are. The store also serves a robots file and a sitemap so search engines can find every product.

### Security

- **Price Validation:** The price is always read from the store's own database when a payment is captured, never from the browser. This means a buyer cannot change what they pay by editing the page.

- **Protected File Storage:** Product files live in a folder that is not publicly accessible. Files are only served after the store has confirmed the customer has a valid, verified purchase.

- **Single-Use Download Links:** Download access is removed as soon as a file is sent, and it also expires if it is not used within 15 minutes, so access left open on a shared computer does not stay valid. The same link cannot be reused. Customers who need to download again can re-verify through the Redownload page using either their Transaction ID or the email address they paid with.

- **Purchase Snapshots:** Every transaction stores a copy of the product name and price at the moment of purchase. Changing a product's details later cannot alter historical order records.

- **Brute-Force Protection:** The admin login blocks further attempts from the same IP address after too many failures. By default, 5 failed attempts within 15 minutes triggers a lockout. These limits can be adjusted in the `.env` file.

- **Admin IP Allowlist:** You can limit the admin area to specific IP addresses. Set `ADMIN_IP_ALLOWLIST` in the `.env` file to a comma-separated list of allowed addresses, and every other visitor is turned away before they even see the login page. Leave it empty to allow any address. Your own computer (localhost) is always allowed, so a wrong entry will not lock you out on the machine itself.
