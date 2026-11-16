// ── DEMO CATALOG ───────────────────────────────────────────
// Every demo and evaluation product becomes one of these items, so no two
// stores sell the same thing. Each item has its own drawn image
// (product.art.js draws it from `art` and the item's params).
// Format per category: bases, each with a drawing type, a default
// description, and its items: [name, price, params, description?].
// Items are handed out round-robin across bases (see expandCatalog), so a
// store's products are different kinds of goods, not 3 colors of one shirt.

export const CATALOG = {
  "Food and Packaged Goods": [
    { art: "tin", desc: "Ready-to-eat canned goods, a pantry staple.", items: [
      ["Sardines in Tomato Sauce 155g", 28, { label: "SARDINES", color: "#C0392B", fish: true }],
      ["Spicy Sardines 155g", 30, { label: "SPICY", color: "#E67E22", fish: true }],
      ["Spanish Style Sardines in Oil", 65, { label: "SPANISH", color: "#6B8E23", fish: true }],
      ["Corned Beef 150g", 45, { label: "CORNED BEEF", color: "#7B241C" }],
      ["Tuna Flakes in Oil 180g", 42, { label: "TUNA", color: "#2471A3", fish: true }],
      ["Meat Loaf 150g", 32, { label: "MEAT LOAF", color: "#935116" }],
      ["Liver Spread 85g", 25, { label: "LIVER SPREAD", color: "#641E16" }],
      ["Vienna Sausage 130g", 38, { label: "VIENNA", color: "#D4AC0D" }],
      ["Pork and Beans 230g", 35, { label: "PORK & BEANS", color: "#1E8449" }],
      ["Evaporated Milk 370ml", 38, { label: "EVAP MILK", color: "#2E86C1" }, "Creamy evaporated milk for coffee, desserts and cooking."],
      ["Condensed Milk 300ml", 55, { label: "CONDENSADA", color: "#1F618D" }, "Sweetened condensed milk for leche flan and halo-halo."],
      ["Coconut Milk 400ml", 48, { label: "GATA", color: "#117864" }, "Thick coconut milk for ginataan and curries."],
    ]},
    { art: "jar", desc: "Small-batch spread made by local home cooks.", items: [
      ["Creamy Peanut Butter 250g", 120, { label: "PEANUT BUTTER", fill: "#B97A3C", peanut: true }],
      ["Chunky Peanut Butter 340g", 155, { label: "CHUNKY", fill: "#A0652D", peanut: true }],
      ["Strawberry Jam 300g", 110, { label: "STRAWBERRY", fill: "#B03A2E" }],
      ["Coco Jam 250g", 95, { label: "COCO JAM", fill: "#5D3A1A" }],
      ["Pure Wild Honey 350ml", 220, { label: "HONEY", fill: "#D68910" }, "Raw wild honey from local beekeepers."],
      ["Bagoong Alamang 250g", 85, { label: "BAGOONG", fill: "#A04040" }, "Sauteed shrimp paste, sweet and spicy."],
      ["Atchara (Pickled Papaya) 350g", 90, { label: "ATCHARA", fill: "#E9B44C" }, "Sweet pickled green papaya, perfect with fried food."],
      ["Ube Halaya 300g", 150, { label: "UBE HALAYA", fill: "#6C3483" }, "Purple yam jam cooked the traditional way."],
      ["Chili Garlic Oil 220g", 75, { label: "CHILI GARLIC", fill: "#C0392B" }, "Crunchy garlic and chili in oil."],
      ["Mango Jam 300g", 115, { label: "MANGO JAM", fill: "#F1C40F" }],
    ]},
    { art: "sack", desc: "Well-milled rice and baking staples, sealed for freshness.", items: [
      ["Dinorado Rice 5kg", 340, { label: "DINORADO", sub: "5 KG" }],
      ["Jasmine Rice 10kg", 620, { label: "JASMINE", sub: "10 KG" }],
      ["Sinandomeng Rice 25kg", 1250, { label: "SINANDOMENG", sub: "25 KG" }],
      ["Glutinous Rice (Malagkit) 2kg", 150, { label: "MALAGKIT", sub: "2 KG" }],
      ["Brown Sugar 1kg", 80, { label: "BROWN SUGAR", sub: "1 KG", sackColor: "#D7B98E" }],
      ["White Sugar 1kg", 90, { label: "WHITE SUGAR", sub: "1 KG" }],
      ["All-Purpose Flour 1kg", 65, { label: "FLOUR", sub: "1 KG" }],
    ]},
    { art: "sticks", desc: "Single-serve sachets, easy to bring anywhere.", items: [
      ["3-in-1 Instant Coffee (10s)", 75, { drink: "#6B3E26" }],
      ["Black Coffee Sticks (20s)", 95, { drink: "#2B1A10" }],
      ["Hot Chocolate Drink (10s)", 110, { drink: "#4A2511" }],
      ["Milk Tea Powder (8s)", 120, { drink: "#C8A27A" }],
      ["Powdered Orange Juice (10s)", 60, { drink: "#F39C12" }],
    ]},
    { art: "bottle", desc: "Kitchen condiment for everyday Filipino cooking.", items: [
      ["Soy Sauce 1L", 55, { label: "TOYO", liquid: "#3B1F12" }],
      ["Cane Vinegar 1L", 45, { label: "SUKA", liquid: "#F4EBD0" }],
      ["Fish Sauce (Patis) 750ml", 50, { label: "PATIS", liquid: "#B9770E" }],
      ["Pure Coconut Oil 1L", 160, { label: "COCO OIL", liquid: "#F7E9A0" }],
      ["Banana Ketchup 320g", 38, { label: "KETCHUP", liquid: "#C0392B" }],
    ]},
    { art: "chipbag", desc: "Crunchy local snack, great for merienda and pasalubong.", items: [
      ["Banana Chips 250g", 70, { label: "BANANA CHIPS", chip: "#E9B44C" }],
      ["Pork Chicharon 100g", 85, { label: "CHICHARON", chip: "#D4A15A" }],
      ["Adobong Mani (Garlic Peanuts) 200g", 60, { label: "ADOBONG MANI", chip: "#B5793A" }],
      ["Cassava Chips 150g", 55, { label: "CASSAVA", chip: "#F2D7A0" }],
      ["Shrimp Kropek 200g", 65, { label: "KROPEK", chip: "#F5CBA7" }],
      ["Polvoron Pack (12s)", 90, { label: "POLVORON", chip: "#F0E0C0" }],
      ["Dried Mangoes 200g", 180, { label: "DRIED MANGO", chip: "#F5B041" }],
      ["Piaya (10s)", 85, { label: "PIAYA", chip: "#C8A06A" }],
    ]},
    { art: "noodles", desc: "Quick noodles, ready in minutes.", items: [
      ["Pancit Canton Original (6s)", 90, { label: "CANTON", cup: false }],
      ["Pancit Canton Chilimansi (6s)", 95, { label: "CHILIMANSI", cup: false }],
      ["Chicken Instant Mami (6s)", 70, { label: "MAMI", cup: false }],
      ["Beef Cup Noodles", 32, { label: "BEEF", cup: true }],
      ["Bihon Noodles 500g", 65, { label: "BIHON", cup: false }],
    ]},
    { art: "eggs", desc: "Farm-fresh eggs from nearby poultry raisers.", items: [
      ["Fresh Eggs Medium (12s)", 110, { egg: "#F3E5CF" }],
      ["Salted Eggs (6s)", 70, { egg: "#C0392B" }, "Itlog na maalat, perfect with tomatoes."],
      ["Fresh Eggs Large (30s tray)", 280, { egg: "#EAD7B7", big: true }],
    ]},
  ],

  "Clothing and Apparel": [
    { art: "shirt", desc: "Soft cotton shirt for everyday wear. Sizes S to XL.", items: [
      ["Plain Cotton T-shirt - Black", 199, { color: "#2C2C2C" }],
      ["Plain Cotton T-shirt - White", 199, { color: "#F4F4F2" }],
      ["Plain Cotton T-shirt - Navy", 199, { color: "#1F3A5F" }],
      ["Plain Cotton T-shirt - Red", 199, { color: "#C0392B" }],
      ["Striped T-shirt - Red", 229, { color: "#E74C3C", style: "stripes" }],
      ["Striped T-shirt - Blue", 229, { color: "#2E86C1", style: "stripes" }],
      ["Pocket T-shirt - Olive", 239, { color: "#6B7B3A", style: "pocket" }],
      ["Pocket T-shirt - Gray", 239, { color: "#8E959C", style: "pocket" }],
      ["Graphic Tee Muntinlupa - White", 279, { color: "#F4F4F2", style: "graphic" }],
      ["Graphic Tee Muntinlupa - Yellow", 279, { color: "#F4C542", style: "graphic" }],
      ["Long Sleeve Shirt - Maroon", 289, { color: "#7B241C", style: "long" }],
      ["Long Sleeve Shirt - Teal", 289, { color: "#148F77", style: "long" }],
    ]},
    { art: "tank", desc: "Breathable sando for hot days.", items: [
      ["Cotton Sando - White", 99, { color: "#F4F4F2" }],
      ["Cotton Sando - Black", 99, { color: "#2C2C2C" }],
    ]},
    { art: "hoodie", desc: "Warm fleece-lined top for rainy days.", items: [
      ["Pullover Hoodie - Gray", 549, { color: "#8E959C", hood: true }],
      ["Pullover Hoodie - Navy", 549, { color: "#1F3A5F", hood: true }],
      ["Zip Jacket - Black", 599, { color: "#2C2C2C", zip: true }],
      ["Zip Jacket - Green", 599, { color: "#1E8449", zip: true }],
    ]},
    { art: "polo", desc: "Neat collared polo, good for school and work.", items: [
      ["School Uniform Polo (Blue Trim)", 249, { color: "#FAFAF7", trim: "#2E86C1" }],
      ["School Uniform Polo (Red Trim)", 249, { color: "#FAFAF7", trim: "#C0392B" }],
      ["Polo Shirt - Navy", 349, { color: "#1F3A5F", trim: "#F4F4F2" }],
      ["Polo Shirt - Green", 349, { color: "#1E8449", trim: "#F4F4F2" }],
      ["Linen Button-Down Shirt - White", 399, { color: "#F7F3EA", trim: "#C8B99A", full: true }],
      ["Linen Button-Down Shirt - Sky Blue", 399, { color: "#AED6F1", trim: "#5D8AA8", full: true }],
    ]},
    { art: "shorts", desc: "Comfortable shorts with garterized waist.", items: [
      ["Jogger Shorts - Gray", 189, { color: "#8E959C" }],
      ["Jogger Shorts - Black", 189, { color: "#2C2C2C" }],
      ["Board Shorts - Blue", 249, { color: "#2E86C1", side: true }],
      ["Board Shorts - Orange", 249, { color: "#E67E22", side: true }],
      ["Basketball Shorts - Red", 219, { color: "#C0392B", side: true, long: true }],
      ["Basketball Shorts - Purple", 219, { color: "#6C3483", side: true, long: true }],
    ]},
    { art: "pants", desc: "Everyday pants that fit well and last long.", items: [
      ["Pajama Pants - Blue Check", 229, { color: "#5DADE2", check: true }],
      ["Pajama Pants - Pink Check", 229, { color: "#F1948A", check: true }],
      ["Denim Jeans - Light Wash", 499, { color: "#7FA7D1", seams: true }],
      ["Denim Jeans - Dark Wash", 499, { color: "#1F3A5F", seams: true }],
      ["Jogger Pants - Black", 349, { color: "#2C2C2C", cuffs: true }],
      ["Jogger Pants - Khaki", 349, { color: "#C3A57A", cuffs: true }],
      ["Leggings - Black", 199, { color: "#1C1C1C", slim: true }],
      ["Leggings - Gray", 199, { color: "#7F8C8D", slim: true }],
    ]},
    { art: "dress", desc: "Light, flowy and easy to wash.", items: [
      ["House Duster Dress - Floral Blue", 179, { color: "#5DADE2", floral: true }],
      ["House Duster Dress - Floral Yellow", 179, { color: "#F4D03F", floral: true }],
      ["Kids Summer Dress - Pink", 249, { color: "#F5B7B1" }],
      ["Kids Summer Dress - Mint", 249, { color: "#A3E4D7" }],
      ["Pleated Skirt - Navy", 279, { color: "#1F3A5F", skirt: true }],
      ["Pleated Skirt - Plaid", 279, { color: "#922B21", skirt: true, plaid: true }],
    ]},
    { art: "cap", desc: "Shades your face from the midday sun.", items: [
      ["Baseball Cap - Black", 199, { color: "#2C2C2C" }],
      ["Baseball Cap - Red", 199, { color: "#C0392B" }],
      ["Bucket Hat - Beige", 229, { color: "#D5C4A1", bucket: true }],
      ["Bucket Hat - Denim", 229, { color: "#5D8AA8", bucket: true }],
    ]},
    { art: "socks", desc: "Cotton-blend socks, 3 pairs per pack.", items: [
      ["Ankle Socks (3 pairs) - White", 99, { color: "#F4F4F2" }],
      ["Ankle Socks (3 pairs) - Black", 99, { color: "#2C2C2C" }],
      ["Crew Socks (3 pairs) - Gray", 129, { color: "#8E959C", tall: true }],
      ["Crew Socks (3 pairs) - Striped", 129, { color: "#E74C3C", tall: true, stripes: true }],
    ]},
    { art: "slippers", desc: "Durable slippers for home and errands.", items: [
      ["Rubber Slippers - Blue", 89, { color: "#2E86C1" }],
      ["Rubber Slippers - Black", 89, { color: "#2C2C2C" }],
      ["Native Abaca Slippers - Natural", 189, { color: "#D9B98A", woven: true }],
      ["Native Abaca Slippers - Brown", 189, { color: "#8B5A2B", woven: true }],
    ]},
  ],

  "Home and Living": [
    { art: "basket", desc: "Handwoven by local craftsmen. Sturdy and light.", items: [
      ["Bamboo Fruit Basket", 160, { nat: "#C8A26B", low: true }],
      ["Rattan Laundry Basket", 390, { nat: "#A87A3D", tall: true }],
      ["Woven Storage Basket", 220, { nat: "#D9B98A", band: "#C0392B" }],
      ["Water Hyacinth Basket", 280, { nat: "#9C6B30", handle: true }],
    ]},
    { art: "bin", desc: "Stackable plastic storage with a snap-on lid.", items: [
      ["Plastic Storage Bin 15L", 180, { color: "#5DADE2" }],
      ["Plastic Storage Bin 30L", 320, { color: "#48C9B0" }],
      ["Plastic Storage Bin 60L", 550, { color: "#AF7AC5" }],
      ["Food Container Set (3s)", 150, { color: "#58D68D", small: true }, "Microwave-safe containers for leftovers and baon."],
      ["Lunch Box 2-Layer", 199, { color: "#F5B041", small: true, layers: true }, "Two-layer lunch box for rice and ulam."],
    ]},
    { art: "hanger", desc: "Keeps clothes neat and wrinkle-free.", items: [
      ["Clothes Hanger Set (5s)", 75, {}],
      ["Wooden Hanger Set (5s)", 150, { wood: true }],
      ["Velvet Hanger Set (10s)", 199, { velvet: true }],
    ]},
    { art: "broom", desc: "Classic Filipino broom for floors and yards.", items: [
      ["Walis Tambo (Soft Broom)", 120, { soft: true }],
      ["Walis Tingting (Stick Broom)", 60, { soft: false }],
    ]},
    { art: "dustpan", desc: "Sturdy plastic dustpan.", items: [
      ["Plastic Dustpan", 55, { color: "#E67E22" }],
      ["Dustpan with Long Handle", 95, { color: "#2E86C1", long: true }],
    ]},
    { art: "pail", desc: "Thick plastic, made to last.", items: [
      ["Plastic Pail 12L", 110, { color: "#3498DB" }],
      ["Plastic Pail 20L", 160, { color: "#E74C3C" }],
      ["Plastic Basin 40cm", 99, { color: "#16A085", low: true }],
      ["Plastic Tabo (Dipper) - Blue", 35, { color: "#2E86C1", tabo: true }],
      ["Plastic Tabo (Dipper) - Pink", 35, { color: "#EC7FA9", tabo: true }],
    ]},
    { art: "plates", desc: "Everyday dinnerware for the family table.", items: [
      ["Ceramic Plate Set (6s) - White", 450, { rim: "#BDC3C7" }],
      ["Ceramic Plate Set (6s) - Blue Rim", 450, { rim: "#2E86C1" }],
    ]},
    { art: "mug", desc: "Ceramic mug for your morning kape.", items: [
      ["Ceramic Coffee Mug - Plain", 99, { color: "#F4F4F2" }],
      ["Ceramic Coffee Mug - Printed", 129, { color: "#F5B041", print: true }],
    ]},
    { art: "pot", desc: "Cookware for everyday meals.", items: [
      ["Aluminum Kaldero 24cm", 380, { type: "pot" }],
      ["Aluminum Kaldero 28cm", 450, { type: "pot", big: true }],
      ["Non-stick Frying Pan 26cm", 420, { type: "pan" }],
      ["Cast Iron Skillet 20cm", 650, { type: "skillet" }],
    ]},
    { art: "pillow", desc: "Soft, washable and hypoallergenic.", items: [
      ["Throw Pillow - Gray", 199, { color: "#95A5A6" }],
      ["Throw Pillow - Mustard", 199, { color: "#D4AC0D", tassel: true }],
      ["Bed Pillow (Standard)", 249, { color: "#F4F4F2", long: true }],
      ["Pillowcase Set (2s)", 150, { color: "#AED6F1", long: true, dots: true }],
    ]},
    { art: "mat", desc: "Handmade and easy to clean.", items: [
      ["Cotton Doormat", 120, { color: "#C0392B", stripes: true }],
      ["Coir Doormat", 180, { color: "#A0522D", coir: true }],
      ["Banig (Woven Mat)", 350, { color: "#D9B98A", banig: true }],
      ["Abaca Placemats (4s)", 220, { color: "#C8A26B", placemats: true }],
    ]},
    { art: "clock", desc: "Silent sweep wall clock.", items: [
      ["Wall Clock - Round White", 299, { color: "#2C3E50" }],
      ["Wall Clock - Wooden", 399, { color: "#8B5A2B", wood: true }],
    ]},
    { art: "candle", desc: "Hand-poured soy wax candle.", items: [
      ["Scented Candle Jar - Lavender", 180, { color: "#BB8FCE" }],
      ["Scented Candle Jar - Vanilla", 180, { color: "#F9E79F" }],
    ]},
    { art: "towel", desc: "Soft and quick-drying.", items: [
      ["Bath Towel - Blue", 249, { colors: ["#5DADE2"], single: true }],
      ["Bath Towel - White", 249, { colors: ["#F4F4F2"], single: true }],
      ["Face Towel Set (3s)", 120, { colors: ["#F5B7B1", "#A3E4D7", "#F9E79F"] }],
      ["Kitchen Towel Set (3s)", 99, { colors: ["#E74C3C", "#F4F4F2", "#E74C3C"], check: true }],
    ]},
    { art: "roll", desc: "Strong and leak-proof.", items: [
      ["Trash Bags Large (10s)", 65, { color: "#2C2C2C" }],
      ["Trash Bags Medium (20s)", 75, { color: "#27AE60" }],
    ]},
    { art: "chair", desc: "Classic monobloc chair, stackable.", items: [
      ["Monobloc Chair - White", 280, { color: "#F4F4F2" }],
      ["Monobloc Chair - Green", 280, { color: "#27AE60" }],
    ]},
    { art: "bottle", desc: "Household cleaner that cuts grease fast.", items: [
      ["Dishwashing Liquid 500ml", 65, { label: "DISHWASH", liquid: "#58D68D", shape: "square" }],
      ["Fabric Conditioner 1L", 120, { label: "FABCON", liquid: "#AF7AC5", shape: "square" }],
    ]},
    { art: "soap", desc: "Tough on dirt, gentle on clothes.", items: [
      ["Laundry Bar Soap 380g", 38, { color: "#5DADE2", label: "LAUNDRY", long: true }],
    ]},
    { art: "sponge", desc: "Scrubs pots and pans clean.", items: [
      ["Dish Sponge (3s)", 45, { color: "#F4D03F", scrub: "#27AE60" }],
    ]},
    { art: "coil", desc: "Keeps mosquitoes away for up to 8 hours.", items: [
      ["Mosquito Coil (10s)", 35, {}],
    ]},
    { art: "spoon", desc: "Smooth hardwood utensils.", items: [
      ["Wooden Spoon Set (3s)", 110, {}],
    ]},
  ],

  "Health and Beauty": [
    { art: "soap", desc: "Gentle soap made with natural ingredients.", items: [
      ["Herbal Soap Bar - Guava", 45, { color: "#BFD8B8" }],
      ["Herbal Soap Bar - Papaya", 50, { color: "#F6B26B" }],
      ["Herbal Soap Bar - Oatmeal", 55, { color: "#E8D5B5" }],
      ["Herbal Soap Bar - Charcoal", 65, { color: "#3A3A3A" }],
      ["Kojic Soap 135g", 75, { color: "#E59866" }],
      ["Goat's Milk Soap", 85, { color: "#FBF6EC" }],
    ]},
    { art: "tube", desc: "For a fresh and clean feeling all day.", items: [
      ["Toothpaste 150g - Mint", 95, { label: "MINT", color: "#2E86C1" }],
      ["Kids Toothpaste - Strawberry", 85, { label: "KIDS", color: "#EC7FA9" }],
      ["Whitening Toothpaste 100g", 110, { label: "WHITE", color: "#5DADE2" }],
      ["Facial Wash 100g", 150, { label: "FACE WASH", color: "#48C9B0" }],
      ["Sunscreen SPF50 50ml", 250, { label: "SPF 50", color: "#F5B041" }],
      ["Calamansi Hand Cream 50g", 90, { label: "HAND CREAM", color: "#82E0AA" }],
    ]},
    { art: "toothbrush", desc: "Soft bristles that are gentle on gums.", items: [
      ["Toothbrush Soft (2s)", 60, { color: "#2E86C1" }],
      ["Kids Toothbrush", 45, { color: "#EC7FA9", kids: true }],
    ]},
    { art: "bottle", desc: "Trusted personal care essential.", items: [
      ["Isopropyl Alcohol 70% 500ml", 65, { label: "70%", liquid: "#AED6F1", cross: true }],
      ["Ethyl Alcohol 70% 1L", 150, { label: "70%", liquid: "#D6EAF8", cross: true, big: true }],
      ["Anti-dandruff Shampoo 340ml", 150, { label: "SHAMPOO", liquid: "#5DADE2", shape: "tall" }],
      ["Coconut Shampoo 340ml", 140, { label: "SHAMPOO", liquid: "#F5EEF8", shape: "tall" }],
      ["Hair Conditioner 340ml", 150, { label: "CONDITIONER", liquid: "#F5B7B1", shape: "tall" }],
      ["Mouthwash 250ml", 120, { label: "MOUTHWASH", liquid: "#48C9B0" }],
      ["Baby Oil 125ml", 95, { label: "BABY OIL", liquid: "#FDEBD0" }],
      ["Hair Oil 100ml", 110, { label: "HAIR OIL", liquid: "#D4AC0D", shape: "dropper" }],
      ["Herbal Massage Oil 60ml", 120, { label: "MASSAGE", liquid: "#A9DFBF", shape: "dropper" }],
      ["Tea Tree Face Toner 100ml", 160, { label: "TONER", liquid: "#D5F5E3" }],
      ["Menthol Liniment 50ml", 85, { label: "LINIMENT", liquid: "#ABEBC6", shape: "dropper" }],
      ["Cologne 100ml", 160, { label: "COLOGNE", liquid: "#AED6F1", shape: "square" }],
    ]},
    { art: "pump", desc: "Pump bottle, easy to use one-handed.", items: [
      ["Body Lotion 200ml - Aloe", 135, { label: "ALOE", color: "#82E0AA" }],
      ["Body Lotion 200ml - Cocoa", 135, { label: "COCOA", color: "#A0522D" }],
      ["Liquid Hand Soap 250ml", 85, { label: "HAND SOAP", color: "#F1948A" }],
      ["Hand Sanitizer Gel 60ml", 45, { label: "SANITIZER", color: "#85C1E9", small: true }],
      ["Feminine Wash 150ml", 130, { label: "FEM WASH", color: "#D7BDE2" }],
    ]},
    { art: "jar", desc: "Rich cream that keeps skin soft.", items: [
      ["Petroleum Jelly 100g", 65, { label: "JELLY", fill: "#FDF2E9", short: true }],
      ["Aloe Vera Gel 300ml", 180, { label: "ALOE VERA", fill: "#A9DFBF" }],
      ["Body Scrub 250g", 170, { label: "BODY SCRUB", fill: "#E59866", short: true }],
      ["Hair Gel 150g", 75, { label: "HAIR GEL", fill: "#85C1E9", short: true }],
      ["Hair Pomade 80g", 95, { label: "POMADE", fill: "#5D4037", short: true }],
      ["Cotton Balls (100s)", 40, { label: "COTTON", fill: "#FDFEFE", balls: true }],
    ]},
    { art: "comb", desc: "Smooth, snag-free hair care.", items: [
      ["Wide-tooth Comb", 35, { color: "#8E44AD" }],
      ["Paddle Hair Brush", 120, { color: "#2C3E50", brush: true }],
    ]},
    { art: "box", desc: "Handy everyday health item.", items: [
      ["Cotton Buds (200s)", 45, { label: "COTTON BUDS", color: "#5DADE2", buds: true }],
      ["Face Masks (50s) - Blue", 120, { label: "FACE MASK", color: "#85C1E9", mask: true }],
      ["Face Masks (50s) - Black", 120, { label: "FACE MASK", color: "#34495E", mask: true }],
      ["Adhesive Bandages (20s)", 40, { label: "BANDAGES", color: "#E74C3C", bandage: true }],
      ["Facial Tissue (200 pulls)", 45, { label: "TISSUE", color: "#A3E4D7", tissue: true }],
      ["Dental Floss 50m", 80, { label: "FLOSS", color: "#48C9B0", small: true }],
    ]},
    { art: "pills", desc: "Daily supplement. Read the label before use.", items: [
      ["Vitamin C 500mg (30s)", 180, { color: "#F39C12" }],
      ["Multivitamins (30s)", 250, { color: "#C0392B" }],
    ]},
    { art: "small", desc: "Small and pocket-sized.", items: [
      ["Roll-on Deodorant 40ml", 89, { color: "#5DADE2", type: "rollon" }],
      ["Lip Balm", 75, { color: "#EC7FA9", type: "lipbalm" }],
      ["Nail Polish - Red", 45, { color: "#C0392B", type: "polish" }],
      ["Baby Powder 200g", 99, { color: "#F5B7B1", type: "powder" }],
    ]},
    { art: "nailcutter", desc: "Stainless steel grooming tool.", items: [
      ["Nail Cutter Set", 75, {}],
    ]},
    { art: "razor", desc: "Smooth, close shave.", items: [
      ["Shaving Razor (3s)", 85, { color: "#2E86C1" }],
    ]},
    { art: "sponge", desc: "Natural fiber for a gentle scrub.", items: [
      ["Loofah Bath Sponge", 60, { color: "#E8D5B5", loofah: true }],
    ]},
    { art: "chipbag", desc: "Soft and alcohol-free.", items: [
      ["Wet Wipes (80s)", 65, { label: "WET WIPES", chip: "#FFFFFF", bag: "#5DADE2" }],
    ]},
  ],

  "Electronics and Gadgets": [
    { art: "fan", desc: "Quiet, strong airflow with 3 speed settings.", items: [
      ["Mini Desk Fan", 350, {}],
      ["USB Clip Fan", 280, { clip: true }],
      ["Stand Fan 16-inch", 1290, { stand: true }],
      ["Rechargeable Fan", 899, { handle: true }],
    ]},
    { art: "cable", desc: "Durable braided cable with fast charging.", items: [
      ["USB-C Cable 1m", 89, { tip: "c" }],
      ["Lightning Cable 1m", 129, { tip: "l" }],
      ["Micro-USB Cable 1m", 79, { tip: "m" }],
      ["USB-C to USB-C Cable 2m", 159, { tip: "c", long: true }],
      ["HDMI Cable 1.5m", 180, { tip: "h" }],
      ["LED Strip Lights 5m", 350, { tip: "m", leds: true }],
    ]},
    { art: "bulb", desc: "Energy-saving bulb, lasts up to 15,000 hours.", items: [
      ["LED Bulb 9W", 85, {}],
      ["LED Emergency Bulb 12W", 199, { emergency: true }],
      ["Solar LED Light", 450, { solar: true }],
    ]},
    { art: "charger", desc: "Safe charging with overheat protection.", items: [
      ["20W Fast Charger", 299, { ports: 1 }],
      ["Dual-port Charger", 349, { ports: 2 }],
      ["Battery Charger (AA/AAA)", 450, { ports: 0, batteries: true }],
      ["Universal Socket Adapter", 60, { ports: 0, adapter: true }],
    ]},
    { art: "earphones", desc: "Clear sound and deep bass.", items: [
      ["Wired Earphones", 149, {}],
      ["Wireless Earbuds", 599, { wireless: true }],
    ]},
    { art: "headphones", desc: "Comfortable padded headphones.", items: [
      ["Over-ear Headphones", 699, {}],
      ["Kids Headphones", 450, { kids: true }],
    ]},
    { art: "device", desc: "Reliable gadget for home and school.", items: [
      ["Power Bank 10000mAh", 599, { w: 200, h: 330, rx: 30, leds: 4, port: true }],
      ["Power Bank 20000mAh", 999, { w: 230, h: 360, rx: 26, leds: 4, port: true, screen: true }],
      ["Clear Phone Case", 99, { w: 210, h: 400, rx: 40, cam: true, clear: true }],
      ["Shockproof Phone Case", 199, { w: 220, h: 410, rx: 44, cam: true, bumpers: true }],
      ["Tempered Glass Screen Protector", 99, { w: 210, h: 400, rx: 36, glass: true }],
      ["Scientific Calculator", 550, { w: 230, h: 380, rx: 22, screen: true, keys: [6, 5] }],
      ["Universal TV Remote", 180, { w: 120, h: 400, rx: 50, keys: [7, 3], power: true }],
      ["Digital Alarm Clock", 320, { w: 360, h: 210, rx: 40, clock: true }],
      ["Portable Radio", 550, { w: 380, h: 240, rx: 30, speaker: true, antenna: true }],
      ["Computer Keyboard", 399, { w: 420, h: 170, rx: 16, keys: [4, 12] }],
      ["USB Flash Drive 32GB", 250, { w: 120, h: 260, rx: 20, usb: true }],
      ["Memory Card 64GB", 399, { w: 200, h: 260, rx: 14, sd: true }],
      ["Webcam 1080p", 899, { w: 300, h: 140, rx: 70, lens: true, stand: true }],
      ["Smart Plug", 450, { w: 220, h: 220, rx: 50, socket: true }],
      ["Wireless Doorbell", 499, { w: 180, h: 290, rx: 40, bell: true }],
    ]},
    { art: "flashlight", desc: "Bright LED light for brownouts and night walks.", items: [
      ["LED Flashlight", 199, {}],
      ["LED Headlamp", 249, { headlamp: true }],
    ]},
    { art: "batteries", desc: "Long-lasting alkaline batteries.", items: [
      ["AA Batteries (4s)", 89, { size: "AA" }],
      ["AAA Batteries (4s)", 89, { size: "AAA" }],
    ]},
    { art: "speaker", desc: "Loud, clear Bluetooth sound.", items: [
      ["Mini Bluetooth Speaker", 499, {}],
      ["Party Speaker with Lights", 1500, { party: true }],
    ]},
    { art: "mouse", desc: "Smooth tracking for work and games.", items: [
      ["Wireless Mouse", 299, {}],
      ["Wired Mouse", 149, { wired: true }],
    ]},
    { art: "appliance", desc: "Small appliance that makes home life easier.", items: [
      ["Electric Kettle 1.7L", 799, { type: "kettle" }],
      ["Rice Cooker 1L", 1190, { type: "ricecooker" }],
      ["Flat Iron (Plantsa)", 650, { type: "iron" }],
      ["Hair Dryer", 550, { type: "dryer" }],
    ]},
    { art: "ringlight", desc: "Even lighting for video calls and selling live.", items: [
      ["Ring Light 10-inch", 650, {}],
      ["Phone Tripod Stand", 350, { tripodOnly: true }],
    ]},
    { art: "racket", desc: "Rechargeable mosquito swatter.", items: [
      ["Electric Mosquito Racket", 350, {}],
    ]},
    { art: "lights", desc: "Warm white lights for any occasion.", items: [
      ["Christmas String Lights", 199, {}],
    ]},
  ],

  "Automotive Supplies": [
    { art: "towel", desc: "Lint-free microfiber, safe on paint.", items: [
      ["Microfiber Car Towel (3s)", 99, { colors: ["#2E86C1", "#F39C12", "#27AE60"], dots: true }],
      ["Microfiber Drying Towel Large", 249, { colors: ["#8E44AD"], single: true, dots: true }],
    ]},
    { art: "gloves", desc: "Good grip and protection for your hands.", items: [
      ["Microfiber Wash Mitt", 149, { color: "#3498DB", mitt: true }],
      ["Riding Gloves", 299, { color: "#2C2C2C" }],
      ["Mechanic Gloves", 199, { color: "#E67E22" }],
    ]},
    { art: "toolset", desc: "Complete tools for quick repairs.", items: [
      ["Motorcycle Basic Tool Set", 450, { color: "#C0392B" }],
      ["Socket Wrench Set 40pcs", 899, { color: "#2C3E50", sockets: true }],
      ["Screwdriver Set (6s)", 250, { color: "#F39C12", screwdrivers: true }],
      ["Tire Repair Kit", 299, { color: "#1E8449", repair: true }],
    ]},
    { art: "gauge", desc: "Accurate readings for safe tire pressure.", items: [
      ["Tire Pressure Gauge", 180, { color: "#2E86C1" }],
    ]},
    { art: "device", desc: "Handy gadget for every driver.", items: [
      ["Digital Tire Gauge", 350, { w: 140, h: 330, rx: 40, screen: true, nozzle: true }],
      ["Portable Tire Inflator", 1500, { w: 300, h: 240, rx: 40, screen: true, hose: true }],
      ["Dashboard Camera", 1800, { w: 320, h: 180, rx: 30, lens: true }],
      ["Car Phone Holder", 250, { w: 200, h: 340, rx: 30, clamp: true }],
      ["Car Battery 12V", 3500, { w: 380, h: 260, rx: 16, battery: true }],
    ]},
    { art: "bottle", desc: "Keeps your vehicle clean and protected.", items: [
      ["Car Shampoo 1L", 180, { label: "CAR WASH", liquid: "#5DADE2", shape: "square" }],
      ["Brake Fluid 300ml", 160, { label: "BRAKE FLUID", liquid: "#F7DC6F" }],
      ["Glass Cleaner 500ml", 120, { label: "GLASS", liquid: "#85C1E9", shape: "tall" }],
      ["Leather Conditioner 250ml", 280, { label: "LEATHER", liquid: "#A0522D" }],
    ]},
    { art: "jar", desc: "Protects and shines.", items: [
      ["Car Wax Paste 300g", 250, { label: "CAR WAX", fill: "#F7DC6F", short: true }],
      ["Multi-purpose Grease 500g", 150, { label: "GREASE", fill: "#E59866", short: true }],
      ["Gel Air Freshener", 150, { label: "FRESH", fill: "#76D7C4", short: true }],
      ["Bolt and Nut Set", 99, { label: "BOLTS", fill: "#D5D8DC", nuts: true }],
    ]},
    { art: "jerry", desc: "Quality fluid for smooth engine performance.", items: [
      ["Motor Oil 1L (4T)", 280, { label: "4T OIL", color: "#F39C12" }],
      ["Engine Oil 4L", 1100, { label: "ENGINE OIL", color: "#2C3E50", big: true }],
      ["Coolant 1L", 220, { label: "COOLANT", color: "#27AE60" }],
      ["Degreaser 1L", 199, { label: "DEGREASER", color: "#C0392B" }],
    ]},
    { art: "spray", desc: "Easy-spray can for quick maintenance.", items: [
      ["Chain Lube Spray 400ml", 220, { label: "CHAIN LUBE", color: "#E67E22" }],
      ["Brake Cleaner Spray", 250, { label: "BRAKE CLEAN", color: "#C0392B" }],
      ["Tire Shine Spray", 199, { label: "TIRE SHINE", color: "#2C3E50" }],
      ["Air Freshener Spray (Lemon)", 120, { label: "LEMON", color: "#F4D03F" }],
    ]},
    { art: "helmet", desc: "Certified helmet for safe rides.", items: [
      ["Full-face Helmet", 1800, { color: "#C0392B", full: true }],
      ["Half-face Helmet", 950, { color: "#2C3E50" }],
      ["Helmet Visor (Clear)", 350, { color: "#AED6F1", visorOnly: true }],
    ]},
    { art: "sparkplug", desc: "Reliable ignition for easy starts.", items: [
      ["Spark Plug (Motorcycle)", 120, {}],
      ["Spark Plug Set (Car, 4s)", 550, { set: true }],
    ]},
    { art: "tree", desc: "Long-lasting scent for your car.", items: [
      ["Hanging Air Freshener", 60, { color: "#27AE60" }],
    ]},
    { art: "cable", desc: "Heavy-duty cable for emergencies.", items: [
      ["Jumper Cables 2.5m", 450, { clamps: true }],
      ["Tow Rope 4m", 399, { rope: true }],
    ]},
    { art: "bulb", desc: "Brighter, whiter light for night driving.", items: [
      ["LED Headlight Bulb H4", 650, { headlight: true }],
    ]},
    { art: "sponge", desc: "Soft sponge that is safe on paint.", items: [
      ["Car Wash Sponge", 60, { color: "#F4D03F" }],
    ]},
    { art: "mat", desc: "Fits most cars and is easy to wash.", items: [
      ["Car Floor Mat Set", 799, { color: "#34495E", carmat: true }],
      ["Windshield Sunshade", 250, { color: "#BDC3C7", sunshade: true }],
    ]},
    { art: "ring", desc: "Better grip and a cooler wheel.", items: [
      ["Steering Wheel Cover", 299, { color: "#2C2C2C", wheel: true }],
    ]},
    { art: "tank", desc: "High-visibility vest for riders.", items: [
      ["Reflective Safety Vest", 150, { color: "#F4D03F", reflect: true }],
    ]},
    { art: "dress", desc: "Keeps you dry on rainy rides.", items: [
      ["Rider Rain Poncho", 180, { color: "#2E86C1", poncho: true }],
    ]},
    { art: "triangle", desc: "Early warning device for roadside stops.", items: [
      ["Early Warning Triangle", 350, {}],
    ]},
    { art: "mirror", desc: "Wide-view mirrors for safer riding.", items: [
      ["Motorcycle Side Mirror Set", 350, {}],
    ]},
    { art: "wiper", desc: "Streak-free wiping in heavy rain.", items: [
      ["Wiper Blades 22-inch", 299, {}],
    ]},
    { art: "lock", desc: "Hardened steel lock to deter theft.", items: [
      ["Motorcycle Disc Lock", 450, { color: "#F39C12" }],
    ]},
    { art: "funnel", desc: "For spill-free refilling.", items: [
      ["Fuel Funnel", 60, { color: "#C0392B" }],
    ]},
    { art: "pliers", desc: "Forged steel pliers with a rubber grip.", items: [
      ["Combination Pliers", 180, { color: "#C0392B" }],
    ]},
    { art: "roll", desc: "Strong tape for quick fixes.", items: [
      ["Duct Tape", 85, { color: "#95A5A6", tape: true }],
    ]},
  ],

  Others: [
    { art: "keychain", desc: "Handmade souvenir from local artisans.", items: [
      ["Capiz Shell Keychain", 50, { type: "shell" }],
      ["Wooden Jeepney Keychain", 65, { type: "jeepney" }],
      ["Beaded Keychain", 45, { type: "beads" }],
    ]},
    { art: "magnet", desc: "A little piece of Muntinlupa to bring home.", items: [
      ["Souvenir Ref Magnet (3s)", 120, { type: "magnets" }],
      ["Sticker Pack", 60, { type: "stickers" }],
      ["Greeting Cards (5s)", 75, { type: "cards" }],
      ["Photo Frame 4R", 150, { type: "frame" }],
    ]},
    { art: "wallet", desc: "Handwoven by local weavers.", items: [
      ["Handmade Woven Wallet", 180, {}],
      ["Abaca Coin Purse", 90, { coin: true }],
      ["Crochet Coin Pouch", 90, { coin: true, crochet: true }],
    ]},
    { art: "basket", desc: "Eco-friendly bag, woven by hand.", items: [
      ["Bayong Bag (Buri)", 250, { nat: "#D9B98A", bag: true }],
      ["Woven Tote Bag", 320, { nat: "#B5915C", bag: true, band: "#1F618D" }],
    ]},
    { art: "ring", desc: "Handmade accessory, one size fits most.", items: [
      ["Beaded Bracelet", 60, { color: "#E74C3C", beads: true }],
      ["Wooden Bead Bracelet", 75, { color: "#8B5A2B", beads: true }],
    ]},
    { art: "abaniko", desc: "Folding hand fan for hot afternoons.", items: [
      ["Abaniko (Hand Fan) - Red", 85, { color: "#C0392B" }],
      ["Abaniko (Hand Fan) - Natural", 85, { color: "#D9B98A" }],
    ]},
    { art: "notebook", desc: "School and office supplies.", items: [
      ["Spiral Notebook (2s)", 70, { color: "#2E86C1", spiral: true }],
      ["Composition Notebook", 45, { color: "#2C2C2C" }],
      ["Scrapbook Album", 199, { color: "#C39BD3", spiral: true }],
    ]},
    { art: "pens", desc: "Smooth writing for school and work.", items: [
      ["Ballpen Set (10s)", 80, {}],
      ["Colored Pencils (12s)", 95, { pencils: true }],
    ]},
    { art: "umbrella", desc: "Sturdy umbrella for sun and rain.", items: [
      ["Folding Umbrella", 250, { color: "#1F618D" }],
      ["Kids Umbrella", 180, { color: "#F4D03F", kids: true }],
    ]},
    { art: "box", desc: "A gift from Muntinlupa.", items: [
      ["Pasalubong Gift Box", 350, { label: "PASALUBONG", color: "#C0392B", ribbon: true }],
    ]},
    { art: "mug", desc: "Ceramic mug with a Muntinlupa print.", items: [
      ["Souvenir Mug", 180, { color: "#F4F4F2", print: true, text: true }],
    ]},
    { art: "coasters", desc: "Set of 4 handmade coasters.", items: [
      ["Wooden Coasters (4s)", 120, {}],
    ]},
    { art: "windchime", desc: "Soft, relaxing sound in the breeze.", items: [
      ["Shell Wind Chime", 250, {}],
    ]},
    { art: "jeepney", desc: "Hand-painted mini jeepney display.", items: [
      ["Mini Jeepney Display", 450, {}],
    ]},
    { art: "cap", desc: "Traditional woven hat.", items: [
      ["Handwoven Salakot Hat", 300, { color: "#C8A26B", salakot: true }],
    ]},
  ],
};

// Round-robin across bases: 1st item of every base, then every 2nd item...
// so consecutive products (and so each store's slice) differ in kind.
export const expandCatalog = (bases) => {
  const out = [];
  const longest = Math.max(...bases.map((b) => b.items.length));
  for (let i = 0; i < longest; i++) {
    for (const b of bases) {
      const it = b.items[i];
      if (!it) continue;
      const [name, price, params = {}, desc] = it;
      out.push({ name, price, description: desc || b.desc, art: b.art, params });
    }
  }
  return out;
};
