# Quick Start Guide

## Prerequisites
- Node.js (v18+)
- MongoDB running locally
- **Tesseract OCR** installed on your system
- Both frontend and backend dependencies installed

### Install Tesseract OCR

#### macOS
```bash
brew install tesseract
```

#### Ubuntu/Debian
```bash
sudo apt-get install tesseract-ocr
```

#### Verify
```bash
tesseract --version
```

## Starting the Application

### 1. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# macOS (if installed via Homebrew)
brew services start mongodb-community

# Or start manually
mongod
```

### 2. Start Backend Server
```bash
cd backend
npm run dev
```
Backend will start on: http://localhost:8000

### 3. Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will start on: http://localhost:5173

## Quick Test

1. Open http://localhost:5173 in your browser
2. Click "Upload Images" button in the top-right corner
3. Drag & drop or select one or more images
4. Click "Upload & Process" button
5. Your images will appear in the gallery automatically
6. Start typing in the search box to filter images in real-time
7. Click any image to view the full extracted text

## Troubleshooting

### Port Already in Use
If you get an error that the port is already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Vite will automatically prompt you to use a different port

### MongoDB Connection Error
Ensure MongoDB is running and the connection string in `backend/.env` is correct:
```env
MONGODB_URI=mongodb://localhost:27017/ocr-gallery
```

### CORS Issues
Make sure both servers are running and the `VITE_API_URL` in `frontend/.env` matches your backend URL.

### Tesseract Not Found
If you get "tesseract command not found" error:
- Install Tesseract OCR on your system (see prerequisites)
- Restart your terminal/IDE after installation
- Verify with: `tesseract --version`

## Features to Try

1. **Auto-load**: Notice all your images load automatically when you open the app
2. **Real-time Search**: Start typing - images filter as you type!
3. **Multi-upload**: Upload 5-10 images at once from the modal
4. **Drag & Drop**: Drag images directly onto the upload area in the modal
5. **Image Details**: Click on any image to see the full extracted text
6. **Edit Text**: Click "Edit" button in the image modal to correct OCR mistakes
7. **Delete Images**: Click "Delete" button to remove images (with confirmation)
8. **Clear Search**: Click the X button to clear search and show all images
9. **Remove Files**: Click the X button on previews before uploading

## Example Test Images

For testing OCR, use images with clear text like:
- Screenshots of articles or documents
- Photos of signs or labels
- Scanned receipts or invoices
- Business cards
- Product packaging with text

Higher quality images with clear, well-lit text will give better OCR results!

