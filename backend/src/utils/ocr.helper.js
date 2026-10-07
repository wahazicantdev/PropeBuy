import Tesseract from "tesseract.js";
import sharp from "sharp";

const CONFIDENCE_THRESHOLD = 60;

// ── PREPROCESS IMAGE FOR BETTER OCR ───────────────────
// Converts image to grayscale and increases contrast
// Makes colored backgrounds and white text readable
// buffer — original image buffer from multer
// Returns processed buffer ready for Tesseract
const preprocessImage = async (buffer) => {
  try {
    const processed = await sharp(buffer)
      // Convert to grayscale — removes color that confuses OCR
      .grayscale()
      // Normalize — stretches contrast to full range
      // Makes dark text darker and light backgrounds lighter
      .normalize()
      // Sharpen — makes text edges cleaner
      .sharpen()
      // Convert to PNG — Tesseract handles PNG best
      .png()
      .toBuffer();

    return processed;
  } catch (error) {
    console.error("Image preprocessing failed:", error.message);
    // Return original buffer if preprocessing fails
    return buffer;
  }
};

// ── EXTRACT TEXT FROM IMAGE ────────────────────────────
export const extractTextFromImage = async (buffer) => {
  try {
    // Preprocess image first for better accuracy
    const processedBuffer = await preprocessImage(buffer);

    const result = await Tesseract.recognize(processedBuffer, "eng", {
      logger: (info) => {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `OCR Progress: ${info.status} - ${Math.round((info.progress || 0) * 100)}%`,
          );
        }
      },
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words,
    };
  } catch (error) {
    console.error("OCR extraction failed:", error.message);
    return { text: "", confidence: 0, words: [] };
  }
};

// ── EXTRACT KEY FIELDS FROM ID TEXT ───────────────────
export const extractIDFields = (text) => {
  const upperText = text.toUpperCase();
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // ── EXTRACT NAME ───────────────────────────────────
  let extractedName = null;

  // Pattern 1 — "Name:" label (standard government IDs)
  const labelPatterns = [
    /^NAME\s*[:]\s*(.+)$/im,
    /(?:PANGALAN|FULL NAME)\s*[:]\s*(.+?)$/im,
  ];

  for (const pattern of labelPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      extractedName = match[1].trim().toUpperCase();
      break;
    }
  }

  // Pattern 2 — Name as prominent text (company IDs, school IDs)
  // After preprocessing white-on-blue becomes readable
  // Look for longest all-caps line that looks like a full name
  if (!extractedName) {
    // Score each line for "looks like a name" probability
    const nameScores = lines.map((line) => {
      const upper = line.toUpperCase().trim();
      const words = upper
        .split(/\s+/)
        .filter((w) => w.replace(/[.,]/g, "").length > 1);

      let score = 0;

      // Has 2-5 words — names are not too short or too long
      if (words.length >= 2 && words.length <= 5) score += 30;

      // All letters plus common name punctuation only
      if (/^[A-Z\s.,]+$/.test(upper)) score += 20;

      // Not a company or organization
      const nonNameWords = [
        "INDUSTRIES",
        "CORPORATION",
        "COMPANY",
        "DEPARTMENT",
        "REPUBLIC",
        "PHILIPPINES",
        "BARANGAY",
        "OFFICE",
        "CITY",
        "MANAGER",
        "EMPLOYEE",
        "MEMBER",
        "CERTIFICATE",
        "NATIONAL",
      ];
      if (!nonNameWords.some((w) => upper.includes(w))) score += 20;

      // Contains at least one word that is 3+ chars — avoids initials only
      if (words.some((w) => w.replace(/[.,]/g, "").length >= 3)) score += 15;

      // Filipino name patterns — middle initial with period
      if (/[A-Z]+\s+[A-Z]\.\s+[A-Z]+/.test(upper)) score += 15;

      return { line: upper, score, words };
    });

    // Get highest scoring line that has score above threshold
    const bestMatch = nameScores
      .filter((item) => item.score >= 50 && item.words.length >= 2)
      .sort((a, b) => b.score - a.score)[0];

    if (bestMatch) {
      extractedName = bestMatch.line.trim();
    }
  }

  // ── EXTRACT ADDRESS ────────────────────────────────
  let extractedAddress = null;

  for (const line of lines) {
    if (line.toUpperCase().startsWith("ADDRESS")) {
      const parts = line.split(":");
      if (parts.length > 1 && parts[1].trim().length > 3) {
        extractedAddress = parts[1].trim().toUpperCase();
        break;
      }
    }
  }

  // ── EXTRACT BARANGAY ───────────────────────────────
  let extractedBarangay = null;
  const muntinlupaBarangays = [
    "ALABANG",
    "BAYANAN",
    "BULI",
    "CUPANG",
    "POBLACION",
    "PUTATAN",
    "SUCAT",
    "TUNASAN",
  ];

  for (const barangay of muntinlupaBarangays) {
    if (upperText.includes(barangay)) {
      extractedBarangay = barangay;
      break;
    }
  }

  return {
    name: extractedName,
    address: extractedAddress,
    barangay: extractedBarangay,
  };
};

// ── EXTRACT KEY FIELDS FROM BARANGAY CERTIFICATE ──────
export const extractCertificateFields = (text) => {
  const upperText = text.toUpperCase();
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // ── EXTRACT NAME ───────────────────────────────────
  let extractedName = null;

  // Pattern 1 — "Name : WILLIAM REX P. TAGLOCOP" table format
  const nameLinePattern = /^NAME\s*[:]\s*(.+)$/im;
  const nameLineMatch = text.match(nameLinePattern);
  if (nameLineMatch && nameLineMatch[1] && nameLineMatch[1].trim().length > 3) {
    extractedName = nameLineMatch[1].trim().toUpperCase();
  }

  // Pattern 2 — Look for line containing colon after NAME label
  if (!extractedName) {
    for (let i = 0; i < lines.length; i++) {
      const upperLine = lines[i].toUpperCase();
      if (upperLine.startsWith("NAME")) {
        const colonParts = lines[i].split(":");
        if (colonParts.length > 1 && colonParts[1].trim().length > 3) {
          extractedName = colonParts[1].trim().toUpperCase();
          break;
        }
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (!nextLine.toUpperCase().includes(":") && nextLine.length > 3) {
            extractedName = nextLine.toUpperCase();
            break;
          }
        }
      }
    }
  }

  // ── EXTRACT BARANGAY ───────────────────────────────
  let extractedBarangay = null;
  const muntinlupaBarangays = [
    "ALABANG",
    "BAYANAN",
    "BULI",
    "CUPANG",
    "POBLACION",
    "PUTATAN",
    "SUCAT",
    "TUNASAN",
  ];

  for (const barangay of muntinlupaBarangays) {
    if (upperText.includes(barangay)) {
      extractedBarangay = barangay;
      break;
    }
  }

  // ── EXTRACT DATE ISSUED ────────────────────────────
  // Look specifically for issue date — NOT date of birth
  let extractedDate = null;

  // Pattern for "Issued this 25th day of August 2026"
  // Handles OCR artifacts like 25" or 25th or 25TH
  const issuedPattern =
    /ISSUED\s+THIS\s+[\d]+(?:ST|ND|RD|TH|"|'|`)*\s+DAY\s+OF\s+((?:JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{4})/i;
  const issuedMatch = text.match(issuedPattern);
  if (issuedMatch && issuedMatch[1]) {
    extractedDate = issuedMatch[1].trim();
  }

  // Fallback — take the LAST date in document
  // Issue date always appears after birth date in PH certificates
  if (!extractedDate) {
    const allMonthDates = [
      ...text.matchAll(
        /(?:JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{1,2},?\s+\d{4}/gi,
      ),
    ];
    if (allMonthDates.length > 0) {
      // Last date = issue date (birth date appears earlier)
      extractedDate = allMonthDates[allMonthDates.length - 1][0];
    }
  }

  return {
    name: extractedName,
    barangay: extractedBarangay,
    dateIssued: extractedDate,
  };
};

// ── CROSS CHECK DOCUMENTS ──────────────────────────────
// Your suggestion bossing — compare what was extracted
// from both documents and check consistency
export const crossCheckDocuments = (idFields, certFields, claimedBarangay) => {
  const issues = [];
  let score = 0;
  let maxScore = 0;

  // ── CHECK 1: BARANGAY ON ID ────────────────────────
  maxScore += 35;
  if (idFields.barangay) {
    const idBarangay = idFields.barangay.toUpperCase();
    const claimed = claimedBarangay.toUpperCase();
    if (idBarangay.includes(claimed) || claimed.includes(idBarangay)) {
      score += 35;
    } else {
      issues.push(
        `ID barangay (${idFields.barangay}) does not match claimed barangay (${claimedBarangay})`,
      );
    }
  } else {
    score += 10;
    issues.push("Could not extract barangay from government ID");
  }

  // ── CHECK 2: BARANGAY ON CERTIFICATE ──────────────
  maxScore += 35;
  if (certFields.barangay) {
    const certBarangay = certFields.barangay.toUpperCase();
    const claimed = claimedBarangay.toUpperCase();
    if (certBarangay.includes(claimed) || claimed.includes(certBarangay)) {
      score += 35;
    } else {
      issues.push(
        `Certificate barangay (${certFields.barangay}) does not match claimed barangay (${claimedBarangay})`,
      );
    }
  } else {
    score += 10;
    issues.push("Could not extract barangay from Barangay Certificate");
  }

  // ── CHECK 3: NAME COMPARISON BETWEEN DOCUMENTS ────
  // YOUR SUGGESTION bossing — compare name from ID vs certificate
  maxScore += 30;
  if (idFields.name && certFields.name) {
    const idName = normalizeNameForComparison(idFields.name);
    const certName = normalizeNameForComparison(certFields.name);

    const similarity = calculateNameSimilarity(idName, certName);

    if (similarity >= 0.7) {
      // 70%+ word match — names are consistent
      score += 30;
    } else if (similarity >= 0.4) {
      // Partial match — give partial credit
      // Could be OCR error on one document
      score += 15;
      issues.push(
        `Name similarity between documents is low (${Math.round(similarity * 100)}%) — possible OCR error or name mismatch`,
      );
    } else {
      // Very low match — names are likely different people
      issues.push(
        `Name on ID (${idFields.name}) does not match name on Certificate (${certFields.name})`,
      );
    }
  } else if (certFields.name && !idFields.name) {
    // Certificate has name but ID doesn't — give partial credit
    // ID name extraction might have failed due to colored background
    score += 15;
    issues.push("Could not extract name from government ID for comparison");
  } else if (idFields.name && !certFields.name) {
    // ID has name but certificate doesn't
    score += 15;
    issues.push(
      "Could not extract name from Barangay Certificate for comparison",
    );
  } else {
    // Neither document has extractable name
    score += 5;
    issues.push(
      "Could not extract names from one or both documents for comparison",
    );
  }

  const confidence = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  let result;
  if (confidence >= CONFIDENCE_THRESHOLD) {
    result = "AUTO_APPROVED";
  } else if (confidence >= 30) {
    result = "MANUAL_REVIEW";
  } else {
    result = "AUTO_REJECTED";
  }

  return {
    result,
    confidence,
    issues,
    extractedData: { fromID: idFields, fromCertificate: certFields },
  };
};

// ── NORMALIZE NAME FOR COMPARISON ─────────────────────
// Removes punctuation and extra spaces
// Splits into individual name parts for flexible matching
// "WILLIAM REX P. TAGLOCOP" → ["WILLIAM", "REX", "TAGLOCOP"]
const normalizeNameForComparison = (name) => {
  return (
    name
      .toUpperCase()
      // Remove periods, commas, and extra spaces
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      // Split into words
      .split(" ")
      // Remove single letter initials for comparison
      // "P" alone is not useful for matching
      .filter((word) => word.length > 1)
  );
};

// ── CALCULATE NAME SIMILARITY ──────────────────────────
// Compares two name word arrays
// Returns similarity score 0-1
// 1 = perfect match, 0 = no match
// idNameWords — normalized name words from ID
// certNameWords — normalized name words from certificate
const calculateNameSimilarity = (idNameWords, certNameWords) => {
  if (idNameWords.length === 0 || certNameWords.length === 0) return 0;

  // Count how many words from ID appear in certificate
  const matchingWords = idNameWords.filter((idWord) =>
    certNameWords.some(
      (certWord) =>
        // Check if words match or one contains the other
        // Handles OCR errors like "TAGLOCOP" vs "TAGLOCOB"
        certWord === idWord ||
        certWord.includes(idWord) ||
        idWord.includes(certWord) ||
        levenshteinDistance(idWord, certWord) <= 2, // allow 2 char difference
    ),
  );

  // Similarity = matching words / total unique words
  const totalUniqueWords = new Set([...idNameWords, ...certNameWords]).size;
  return (
    matchingWords.length / Math.min(idNameWords.length, certNameWords.length)
  );
};

// ── LEVENSHTEIN DISTANCE ───────────────────────────────
// Measures how different two strings are
// Returns number of character changes needed
// to transform one string into the other
// Used to handle OCR errors — "TAGLOCOP" vs "TAGLOCOB" = distance 1
const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
};

// ── CHECK IF CERTIFICATE IS RECENT ────────────────────
export const isCertificateRecent = (dateString) => {
  if (!dateString) return null;

  try {
    // Clean up OCR artifacts before parsing
    // Removes "th", "st", "nd", "rd" ordinal suffixes
    // Removes stray quotes from OCR errors like 25"
    const cleanedDate = dateString
      .replace(/\d+(ST|ND|RD|TH)/gi, "")
      .replace(/["`']/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const issueDate = new Date(cleanedDate);
    if (isNaN(issueDate.getTime())) return null;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return issueDate >= sixMonthsAgo;
  } catch {
    return null;
  }
};
