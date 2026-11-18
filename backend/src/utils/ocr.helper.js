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
    // A certificate in the ID slot means the uploads were swapped
    looksLikeCertificate: looksLikeCertificate(text),
  };
};

// ── DOES THIS TEXT READ LIKE A BARANGAY CERTIFICATE? ───
// Certificates carry fixed wording that IDs never have. Used to catch
// an ID uploaded as the certificate and the other way around.
const looksLikeCertificate = (text) =>
  /CERTIF(?:Y|ICATE|ICATION)|TO WHOM IT MAY CONCERN|BARANGAY CLEARANCE/i.test(text || "");

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
    // An ID in the certificate slot has none of the certificate wording
    looksLikeCertificate: looksLikeCertificate(text),
  };
};

// ── CROSS CHECK DOCUMENTS ──────────────────────────────
// Scores how well the two documents back up the registration (Yoy, 11-18).
// Every check earns its points only when the OCR actually read the field,
// so anything it could not read lowers the confidence. A hard mismatch
// (wrong barangay, names that don't match, swapped uploads, an old
// certificate) caps the score below the Safe line, so it lands in
// Needs review. The score only sorts the queue; staff always decide.
//
// Points (100 total):
//   20  barangay on the ID matches the one chosen at registration
//   20  barangay on the certificate matches
//   15  name on the ID matches the name on the certificate
//   15  name typed at registration matches the ID
//   10  name typed at registration matches the certificate
//   10  certificate issue date read and within 6 months
//   10  each upload is in the right slot (certificate wording only in the certificate)
export const crossCheckDocuments = (idFields, certFields, claimedBarangay, registeredName = "") => {
  const issues = [];
  let score = 0;
  // Set when a check finds a real contradiction, not just a blank
  let hardMismatch = false;

  // ── BARANGAY ON EACH DOCUMENT ──
  const claimed = (claimedBarangay || "").toUpperCase();
  const barangayCheck = (found, label) => {
    if (!found) {
      issues.push(`Could not read the barangay on the ${label}`);
      return;
    }
    const value = found.toUpperCase();
    if (claimed && (value.includes(claimed) || claimed.includes(value))) {
      score += 20;
    } else {
      hardMismatch = true;
      issues.push(`${label} barangay (${found}) does not match the barangay chosen at registration (${claimedBarangay || "none"})`);
    }
  };
  barangayCheck(idFields.barangay, "Government ID");
  barangayCheck(certFields.barangay, "Barangay Certificate");

  // ── NAMES ──
  // Compares two names word by word; blank names earn nothing
  const nameCheck = (a, b, points, labelA, labelB) => {
    if (!a || !b) {
      issues.push(`Could not compare the name on the ${labelA} with the ${labelB}: ${!a ? labelA : labelB} name not read`);
      return;
    }
    const similarity = calculateNameSimilarity(normalizeNameForComparison(a), normalizeNameForComparison(b));
    if (similarity >= 0.7) {
      score += points;
    } else if (similarity >= 0.4) {
      // Close but not the same, often an OCR misread: half the points
      score += Math.round(points / 2);
      issues.push(`Name on the ${labelA} (${a}) only partly matches the ${labelB} (${b}), ${Math.round(similarity * 100)}% similar`);
    } else {
      hardMismatch = true;
      issues.push(`Name on the ${labelA} (${a}) does not match the ${labelB} (${b})`);
    }
  };
  nameCheck(idFields.name, certFields.name, 15, "Government ID", "Barangay Certificate");
  nameCheck(registeredName, idFields.name, 15, "registration form", "Government ID");
  nameCheck(registeredName, certFields.name, 10, "registration form", "Barangay Certificate");

  // ── CERTIFICATE DATE ──
  const recent = isCertificateRecent(certFields.dateIssued);
  if (recent === true) {
    score += 10;
  } else if (recent === false) {
    hardMismatch = true;
    issues.push("Barangay Certificate may be outdated — issued more than 6 months ago");
  } else {
    issues.push("Could not read the issue date on the Barangay Certificate");
  }

  // ── RIGHT DOCUMENT IN THE RIGHT SLOT ──
  if (idFields.looksLikeCertificate && !certFields.looksLikeCertificate) {
    hardMismatch = true;
    issues.push("The uploads look swapped: the Government ID slot holds a certificate and the certificate slot does not");
  } else if (idFields.looksLikeCertificate) {
    hardMismatch = true;
    issues.push("The Government ID upload looks like a certificate, not an ID");
  } else if (!certFields.looksLikeCertificate) {
    // A missing certificate is a missing requirement, e.g. the ID uploaded twice
    hardMismatch = true;
    issues.push("The Barangay Certificate upload does not read like a barangay certificate");
  } else {
    score += 10;
  }

  // Never above the Safe line when something contradicts the registration
  let confidence = Math.min(100, score);
  if (hardMismatch) confidence = Math.min(confidence, CONFIDENCE_THRESHOLD - 1);

  // These codes only sort the admin's queue. Nothing here changes an
  // account's status, because the admin makes every decision.
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
    extractedData: { registeredName: registeredName || null, fromID: idFields, fromCertificate: certFields },
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
