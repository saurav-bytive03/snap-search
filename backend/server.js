import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import tesseract from 'node-tesseract-ocr';
import sharp from 'sharp';
import fs from 'fs';
import multer from 'multer';
import connectDB from './utils/database.js';
import ImageModel from './utils/model.js';

// Load env
dotenv.config();

// ES Module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
}

// Multer config for multiple file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'images');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed'), false);
        }
    }
});

// Ensure temp folder
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Tesseract OCR configuration
const tesseractConfig = {
    lang: 'eng',
    oem: 1, // LSTM OCR Engine Mode
    psm: 3, // Fully automatic page segmentation
};

// Preprocess image: enhance for better OCR
async function preprocessImage(inputPath) {
    const outputPath = path.join(tempDir, `processed_${Date.now()}.png`);

    // Get image metadata to determine best processing
    const metadata = await sharp(inputPath).metadata();

    // Enhanced preprocessing for better OCR accuracy
    const sharpImage = sharp(inputPath);

    // Upscale small images for better recognition
    if (metadata.width && metadata.width < 1000) {
        sharpImage.resize({
            width: metadata.width * 2,
            kernel: sharp.kernel.lanczos3
        });
    }

    await sharpImage
        .grayscale()
        .normalize() // Normalize contrast
        .sharpen({ sigma: 1 }) // Sharpen for better text
        .threshold(128) // Binarize
        .png({ compressionLevel: 0 })
        .toFile(outputPath);

    return outputPath;
}

// Perform OCR on an image
async function performOCR(imagePath) {
    try {
        const text = await tesseract.recognize(imagePath, tesseractConfig);
        return text.trim();
    } catch (error) {
        console.error('OCR Error:', error.message);
        throw new Error('OCR processing failed: ' + error.message);
    }
}

// Root
app.get('/', (req, res) => {
    res.send(`Hello World`);
});

// Existing OCR + Search Route (for single static image)
app.get('/ocr', async (req, res) => {
    try {
        const imageName = req.query.image || 'test.png';
        const searchQuery = (req.query.q || '').toLowerCase().trim();
        const imagePath = path.join(__dirname, 'images', imageName);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'Image not found', path: imagePath });
        }

        console.log(`\nOCR Request: ${imageName}${searchQuery ? ` | Search: "${searchQuery}"` : ''}`);

        // Preprocess
        const processedPath = await preprocessImage(imagePath);
        console.log('Preprocessing done:', processedPath);

        // OCR
        const cleanText = await performOCR(processedPath);

        // Clean up temp file
        fs.unlink(processedPath, () => { });

        // Search
        const found = searchQuery ? cleanText.toLowerCase().includes(searchQuery) : null;

        res.json({
            image: imageName,
            text: cleanText,
            confidence: 'N/A',
            lines: cleanText.split('\n').filter(l => l.trim()),
            found,
            match: searchQuery || null,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('OCR Failed:', error.message);
        res.status(500).json({
            error: 'OCR processing failed',
            details: error.message
        });
    }
});

// NEW: POST /image - Upload multiple images, extract text, save to DB
app.post('/image', upload.array('images', 10), async (req, res) => { // Up to 10 files
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No images uploaded' });
        }

        const results = [];

        for (const file of req.files) {
            const imagePath = file.path;
            const imageName = path.basename(imagePath);

            console.log(`Processing uploaded image: ${imageName}`);

            // Preprocess
            const processedPath = await preprocessImage(imagePath);

            // OCR
            const cleanText = await performOCR(processedPath);

            // Clean up temp
            fs.unlink(processedPath, () => { });

            if (cleanText && cleanText.length > 0) {
                const doc = new ImageModel({
                    image: imageName,
                    text: cleanText
                });
                await doc.save();

                results.push({
                    image: imageName,
                    text: cleanText,
                    confidence: 'N/A',
                    saved: true
                });
            } else {
                console.log(`No text extracted from: ${imageName}`);
            }
        }

        res.json({
            message: `${req.files.length} images processed and saved`,
            results
        });

    } catch (error) {
        console.error('Upload/OCR Failed:', error.message);
        // Clean up any uploaded files on error (optional)
        if (req.files) {
            req.files.forEach(file => fs.unlink(file.path, () => { }));
        }
        res.status(500).json({
            error: 'Upload/OCR failed',
            details: error.message
        });
    }
});

// NEW: GET /image?search=query - Search DB with regex, return matching images
// If no search query, return all images
app.get('/image', async (req, res) => {
    try {
        const searchQuery = req.query.search;

        let docs;
        if (!searchQuery || searchQuery.trim() === '') {
            // Return all images if no search query
            docs = await ImageModel.find({})
                .select('_id image text createdAt')
                .sort({ createdAt: -1 }) // Most recent first
                .limit(100);
        } else {
            // Use regex for flexible search (case-insensitive)
            docs = await ImageModel.find({
                text: { $regex: searchQuery, $options: 'i' }
            })
                .select('_id image text createdAt')
                .sort({ createdAt: -1 })
                .limit(100);
        }

        const results = docs.map(doc => ({
            id: doc._id, // MongoDB ID for update/delete
            image: doc.image, // Filename; full URL: /images/{image}
            text: doc.text,
            matched: searchQuery ? true : false,
            createdAt: doc.createdAt
        }));

        res.json({
            query: searchQuery || null,
            count: results.length,
            results
        });

    } catch (error) {
        console.error('DB Search Failed:', error.message);
        res.status(500).json({
            error: 'Database search failed',
            details: error.message
        });
    }
});

// UPDATE: PATCH /image/:id - Update image text
app.patch('/image/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Text is required' });
        }

        const updatedDoc = await ImageModel.findByIdAndUpdate(
            id,
            { text: text.trim() },
            { new: true }
        );

        if (!updatedDoc) {
            return res.status(404).json({ error: 'Image not found' });
        }

        console.log(`Updated image: ${updatedDoc.image}`);

        res.json({
            message: 'Image text updated successfully',
            result: {
                id: updatedDoc._id,
                image: updatedDoc.image,
                text: updatedDoc.text,
                createdAt: updatedDoc.createdAt
            }
        });

    } catch (error) {
        console.error('Update Failed:', error.message);
        res.status(500).json({
            error: 'Failed to update image',
            details: error.message
        });
    }
});

// REGENERATE: POST /image/:id/regenerate - Re-run OCR on existing image
app.post('/image/:id/regenerate', async (req, res) => {
    try {
        const { id } = req.params;

        const doc = await ImageModel.findById(id);

        if (!doc) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const imagePath = path.join(__dirname, 'images', doc.image);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'Image file not found on server' });
        }

        console.log(`Regenerating text for: ${doc.image}`);

        // Preprocess
        const processedPath = await preprocessImage(imagePath);

        // OCR
        const cleanText = await performOCR(processedPath);

        // Clean up temp
        fs.unlink(processedPath, () => { });

        // Update database with new text
        if (cleanText && cleanText.length > 0) {
            doc.text = cleanText;
            await doc.save();

            console.log(`Regenerated text for: ${doc.image}`);

            res.json({
                message: 'Text regenerated successfully',
                result: {
                    id: doc._id,
                    image: doc.image,
                    text: cleanText,
                    confidence: 'N/A',
                    createdAt: doc.createdAt
                }
            });
        } else {
            return res.status(400).json({
                error: 'No text could be extracted from the image',
                message: 'OCR did not detect any text. Try with a clearer image.'
            });
        }

    } catch (error) {
        console.error('Regenerate Failed:', error.message);
        res.status(500).json({
            error: 'Failed to regenerate text',
            details: error.message
        });
    }
});

// DELETE: DELETE /image/:id - Delete image and file
app.delete('/image/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const doc = await ImageModel.findById(id);

        if (!doc) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Delete the physical file
        const imagePath = path.join(__dirname, 'images', doc.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`Deleted file: ${doc.image}`);
        }

        // Delete from database
        await ImageModel.findByIdAndDelete(id);

        console.log(`Deleted image from DB: ${doc.image}`);

        res.json({
            message: 'Image deleted successfully',
            deleted: {
                id: doc._id,
                image: doc.image
            }
        });

    } catch (error) {
        console.error('Delete Failed:', error.message);
        res.status(500).json({
            error: 'Failed to delete image',
            details: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes in production (SPA fallback)
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// Graceful shutdown
async function shutdown() {
    console.log('\nShutting down...');
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Test OCR: http://localhost:${port}/ocr?image=test.png&q=Nutrition`);
    console.log(`Test Upload: POST /image (multipart, field: images)`);
    console.log(`Test Search: http://localhost:${port}/image?search=Nutrition`);
    await connectDB();
});