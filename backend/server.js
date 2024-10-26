const express = require("express");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const cors = require("cors");
const { execFile } = require("child_process");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(
  cors({
    origin: "http://localhost:3000", // Your frontend URL
    methods: ["GET", "POST"], // Allow only necessary methods
    allowedHeaders: ["Content-Type"], // Allow headers like JSON/FormData
  })
);

// Middleware to parse JSON from the request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload route
app.post("/api/scan", upload.single("resume"), async (req, res) => {
  try {
    const resumeText = await extractText(req.file); // Extract text from uploaded resume
    const jobDescText = req.body.jobDesc; // Get job description from input

    execFile("python3", ["text_processing.py", resumeText, jobDescText], (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", stderr);
        return res.status(500).json({ message: "Error processing request" });
      }

      const { score, similarKeywords } = calculateSimilarity(resumeText, jobDescText);
      res.json({ score, similarKeywords }); // Return similarity score and keywords
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error processing request" });
  }
});

// Function to extract text based on file type (PDF, DOCX, or fallback to OCR)
async function extractText(file) {
  const filePath = file.path;
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension === ".pdf") {
    // Extract text from PDF
    const dataBuffer = require("fs").readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (extension === ".docx") {
    // Extract text from DOCX
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    // Fallback to OCR for unsupported file types
    const { data: { text } } = await Tesseract.recognize(filePath, "eng");
    return text;
  }
}

// Calculate similarity between two pieces of text
function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));

  const similarKeywords = [...words1].filter((word) => words2.has(word));
  const intersection = similarKeywords.length;
  const union = words1.size + words2.size - intersection;

  return {
    score: ((intersection / union) * 100).toFixed(2), // Percentage similarity
    similarKeywords,
  };
}

app.listen(5000, () => console.log("Server running on port 5000"));
