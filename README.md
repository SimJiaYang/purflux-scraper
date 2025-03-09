# Purflux Catalog Scraper

## 📌 Overview

The **Purflux Catalog Scraper** is a Node.js application that automates the extraction of product data from the Purflux Group Catalog website. Using Puppeteer, the scraper navigates through the catalog, retrieves product references, and scrapes detailed product information such as dimensions, images, OE\_PN values, and vehicle applications.

## 🚀 Features

- Scrapes product references from the main catalog.
- Extracts detailed product information including IAM\_PN, dimensions, images, and OE\_PN values.
- Saves extracted data into structured JSON files.
- Automatically generates a timestamped folder for each scraping session.

---

## 📥 Installation

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (Latest LTS version recommended)
- **npm** (Node Package Manager, comes with Node.js)

### Steps

1. Clone this repository:
   ```sh
   git clone https://github.com/SimJiaYang/purflux-scraper.git
   cd purflux-catalog
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

---

## ▶️ How to Run

To start the scraper, simply run:

```sh
npm start
```

This will execute `scraper.js`, which:

1. Extracts product references from the main catalog.
2. Scrapes detailed product data for each reference.
3. Saves the extracted data as JSON files in a timestamped directory inside the `product` folder.

---

## 🔍 Approach

1. **Scrape Main Catalog:**
   - Navigate to the catalog page.
   - Click on the **Reference** tab.
   - Extract product references from the dropdown.
   - Save extracted references to a JSON file.
2. **Scrape Product Details:**
   - Construct the product detail URL using the extracted references.
   - Extract IAM\_PN, product line, dimensions, image URLs, OE\_PN values, and vehicle application data.
   - Save the data in a structured JSON format.
3. **Automated Execution:**
   - The scraper runs through each product reference sequentially.
   - A short delay is introduced to prevent website blocking.

---

## 🛠 Dependencies

- [**Puppeteer**](https://www.npmjs.com/package/puppeteer) - Headless browser automation.
- [**Axios**](https://www.npmjs.com/package/axios) - For potential HTTP requests.
- **fs (Node.js built-in module)** - File system operations.
- **path (Node.js built-in module)** - Path utilities.

---

## 📁 Output Structure

```
product/
 ├── 12032024_1530/             # Timestamped folder
 │   ├── product_references.json  # List of scraped product references
 │   ├── product_A1259.json       # Detailed data of a specific product
 │   ├── product_B4567.json       # Detailed data of another product
 │   └── ...                      # More scraped products
```

---

## 🤝 Contributions

Feel free to submit issues or pull requests if you want to improve the scraper.

---

## 📜 License

This project is licensed under the **MIT License**.

