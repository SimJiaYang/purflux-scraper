const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://www.purfluxgroupcatalog.com/catalogues/FO/scripts/accueil.php?zone=FR&catalogue=PFX&lang=GB";
const DETAIL_URL_TEMPLATE = "https://www.purfluxgroupcatalog.com/catalogues/FO/scripts/cat_fich_filtre.php?zone=FR&catalogue=PFX&lang=GB&searchref=";

// Generate a unique folder name using the current date and time (ms)
const timestamp = getMalaysiaTimestamp();
const outputDir = path.join(__dirname, "product", timestamp);

// Ensure the folder exists
fs.mkdirSync(outputDir, { recursive: true });

// Scrape the main catalog page to get product references
async function scrapeMainCatalogue() {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        console.log("🌐 Navigating to the catalog page...");
        await page.goto(BASE_URL, { waitUntil: "networkidle2" });

        // Click the "Reference" tab
        console.log("📌 Clicking the 'Reference' tab...");
        await page.click('a[data-toggle="tab"][href="#menu4"]');

        // Wait for the dropdown to appear
        await page.waitForSelector("#ref_filtre", { timeout: 5000 });

        // Extract product references from the dropdown
        const productRefs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("#ref_filtre option"))
                .map(option => option.value)
                .filter(value => value && value !== "Enter or select"); // Remove empty/default option
        });

        console.log(`✅ Extracted ${productRefs.length} product references.`);

        // Save product references to JSON
        const outputFile = path.join(outputDir, "product_references.json");
        fs.writeFileSync(outputFile, JSON.stringify(productRefs, null, 2));

        console.log(`📁 Data saved in: ${outputFile}`);
        return productRefs;
    } catch (error) {
        console.error("❌ Error during scraping:", error.message);
    } finally {
        if (browser) {
            await browser.close();
            console.log("🛑 Browser closed.");
        }
    }
}

// Scrape the details of a single product
async function scrapeProductDetails(productRef) {
    let browser;
    try {
        const productUrl = `${DETAIL_URL_TEMPLATE}${productRef}&old_marque=`;
        browser = await puppeteer.launch({ headless: "new"}); 
        const page = await browser.newPage();
        console.log(`🌐 Navigating to: ${productUrl}`);
        await page.goto(productUrl, { waitUntil: "domcontentloaded" });

        const productData = await page.evaluate(() => {
            const getText = (selector) => document.querySelector(selector)?.textContent.trim() || "N/A";

            // Extract IAM_PN from either <h1> or <h2>
            let iamPN = getText("h1") || getText("h2.title.background4.color1 span");
            iamPN = iamPN.replace(/\s+/g, ""); // Remove extra spaces

            // Extract Product Line from <h2>
			const productLineElement = document.querySelector("h2.title.background4.color1 span");
            const productLine = productLineElement ? productLineElement.textContent.trim() : "N/A";

            // Extract dimensions from Characteristics section
            const dimensions = {};
            document.querySelectorAll(".caracteristics .row1.color3").forEach((row) => {
                const text = row.textContent.trim();
                if (text.includes("Height :")) dimensions.Height = text.replace("Height :", "").trim();
                if (text.includes("Length :")) dimensions.Length = text.replace("Length :", "").trim();
                if (text.includes("Width :")) dimensions.Width = text.replace("Width :", "").trim();
            });

            // Extract image URL
            const imageElement = document.querySelector("figure a.thumbnail.fancybox");
            const imageURL800 = imageElement ? imageElement.href.replace("../../", "https://www.purfluxgroupcatalog.com/") : "N/A";

			// Extract OE_PN values (from div.row.margin20.row2.txtcontent)
            const oePNs = Array.from(document.querySelectorAll("div.row.margin20.row2.txtcontent, div.row.margin20.background4.row2.txtcontent"))
                .map(row => row.querySelector("div.col-xs-3.txtcenter")?.textContent.trim() || "")
                .filter(value => value !== ""); // Remove empty values

			// Extract Vehicle Applications 
			const vehicleApplications = Array.from(document.querySelectorAll("div.row.margin20.row2.txtcontent"))
			.map(row => {
				const modelElement = row.querySelector("div.col-xs-2.txtleft strong");
				if (!modelElement) return null; // Skip rows without a model element
		
				const model = modelElement.textContent.trim();
				const engineCodes = row.querySelector("div.col-xs-2:nth-child(2)")?.textContent.trim() || "";
				const power = row.querySelector("div.col-xs-2:nth-child(3)")?.textContent.trim() || "";
				const productionYear = row.querySelector("div.col-xs-2:nth-child(4)")?.textContent.trim() || "";
				const engineCodeDetails = row.querySelector("div.col-xs-2:nth-child(5)")?.textContent.trim() || "";
		
                // Combine all values into a single string
				let result = `${model}${engineCodes}${power}${productionYear}${engineCodeDetails}`;
		
				return result;
			})
			.filter(entry => entry !== null); // Remove null entries			

            return {
                IAM_PN: iamPN,
                Product_Line: productLine,
                Dimensions: dimensions,
                Source: [
                    {
                        imageURL800: imageURL800,
                    },
                ],
				OE_PN: oePNs,
				Vehicle_Application: vehicleApplications,
            };
        });

        console.log(`✅ Scraped data for product: ${productRef}`);

        // Save the data to a JSON file
        const outputFile = path.join(outputDir, `product_${productRef}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(productData, null, 2));

        console.log(`📁 Data saved in: ${outputFile}`);
        return productData;
    } catch (error) {
        console.error(`❌ Error scraping product ${productRef}:`, error.message);
    } finally {
        if (browser) {
            await browser.close();
            console.log("🛑 Browser closed.");
        }
    }
}

// Main function to scrape all products
async function scrapeAllProducts() {
    try {
        console.log("🚀 Starting Purflux Scraper...");
        
        // Get product references from main catalog
        const productRefs = await scrapeMainCatalogue();
        if (!productRefs || productRefs.length === 0) {
            console.log("⚠️ No products found, stopping scraper.");
            return;
        }

        // await scrapeProductDetails("A1259");
        // return;

        // Loop through each product reference and scrape details
        for (let i = 0; i < productRefs.length; i++) {
            const productRef = productRefs[i];
            console.log(`🔍 Scraping product ${i + 1} of ${productRefs.length}: ${productRef}`);
            await scrapeProductDetails(productRef);

            // Optional: Introduce a small delay to avoid getting blocked - net::ERR_BLOCKED_BY_CLIENT
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        console.log("✅ All products scraped successfully.");
    } catch (error) {
        console.error("❌ Error in scraping process:", error);
    }
}

// Start the scraper
(async () => {
    await scrapeAllProducts();
})();

// Helper function to get Malaysia timestamp as filename
function getMalaysiaTimestamp() {
    const malaysiaTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kuala_Lumpur",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Use 24-hour format
    }).format(new Date());

    return malaysiaTime.replace(/\//g, "").replace(", ", "_").replace(":", "");
}