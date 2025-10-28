# OCR Image Gallery

A full-stack application that allows users to upload images, extract text using OCR (Optical Character Recognition), and search for images by their content.

## Features

- 🖼️ **Multiple Image Upload**: Upload up to 10 images at once with drag & drop support
- 🔍 **Real-time Text Search**: Search filters images as you type - no button needed!
- 📱 **Responsive Masonry Gallery**: Beautiful grid layout that adapts to any screen size
- ⚡ **Auto-load Images**: All images are displayed when you first open the app
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 📤 **Modal Upload**: Clean upload interface in a modal dialog
- 🌓 **Dark Mode Support**: Full dark mode theme support
- 🔄 **Live Updates**: Gallery refreshes automatically after upload

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling
- **shadcn/ui** for UI components
- **react-responsive-masonry** for gallery layout
- **Axios** for API calls
- **Lucide React** for icons
- **Sonner** for toast notifications

### Backend
- **Node.js** with Express
- **node-tesseract-ocr** (native Tesseract wrapper for better accuracy)
- **Sharp** for image preprocessing
- **MongoDB** with Mongoose for data storage
- **Multer** for file uploads
- **CORS** enabled for cross-origin requests

## Project Structure

```
tesseract/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/           # shadcn UI components
│   │   ├── lib/
│   │   ├── App.tsx           # Main application component
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── utils/
│   │   ├── database.js       # MongoDB connection
│   │   ├── model.js          # Image model schema
│   │   └── worker.js         # Tesseract worker
│   ├── images/               # Uploaded images storage
│   ├── temp/                 # Temporary files for processing
│   ├── server.js             # Express server
│   └── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB installed and running
- **Tesseract OCR** installed on your system (required)
- npm or yarn

### Install Tesseract OCR

#### macOS
```bash
brew install tesseract
```

#### Ubuntu/Debian
```bash
sudo apt-get install tesseract-ocr
```

#### Windows
Download and install from: https://github.com/UB-Mannheim/tesseract/wiki

Verify installation:
```bash
tesseract --version
```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/ocr-gallery
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

   The backend will start on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   VITE_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173`

## API Endpoints

### Upload Images
- **POST** `/image`
- Upload multiple images (up to 10) with OCR processing
- **Content-Type**: `multipart/form-data`
- **Field Name**: `images`
- **Returns**: Array of processed images with extracted text

```bash
curl -X POST http://localhost:8000/image \
  -F "images=@image1.png" \
  -F "images=@image2.jpg"
```

### Get All Images
- **GET** `/image`
- Retrieve all uploaded images
- **Returns**: Array of all images with text and metadata (sorted by newest first)

```bash
curl "http://localhost:8000/image"
```

### Search Images
- **GET** `/image?search=query`
- Search for images containing specific text
- **Query Parameter**: `search` (optional - if omitted, returns all images)
- **Returns**: Array of matching images with text and metadata

```bash
curl "http://localhost:8000/image?search=Nutrition"
```

### Update Image Text
- **PATCH** `/image/:id`
- Update the extracted text for a specific image
- **Body**: `{ "text": "Updated text content" }`
- **Returns**: Updated image object

```bash
curl -X PATCH http://localhost:8000/image/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"text": "Updated extracted text"}'
```

### Regenerate Text (Re-run OCR)
- **POST** `/image/:id/regenerate`
- Re-run OCR process on an existing image
- Useful when initial OCR results were poor
- **Returns**: Updated image with new extracted text and confidence score

```bash
curl -X POST http://localhost:8000/image/507f1f77bcf86cd799439011/regenerate
```

### Delete Image
- **DELETE** `/image/:id`
- Delete an image and its associated file
- **Returns**: Confirmation message

```bash
curl -X DELETE http://localhost:8000/image/507f1f77bcf86cd799439011
```

### OCR Single Image (Legacy)
- **GET** `/ocr?image=filename&q=query`
- Process a specific image file with optional search
- **Query Parameters**: 
  - `image`: filename in the images directory
  - `q`: search query (optional)

### Health Check
- **GET** `/health`
- Check server status

## Usage

1. **View All Images**:
   - All uploaded images are automatically displayed when you open the app
   - Images are shown in a beautiful responsive masonry grid
   - Most recent images appear first

2. **Upload Images**:
   - Click "Upload Images" button in the top-right corner
   - Drag and drop images onto the upload area, or click to browse
   - Select up to 10 images at once
   - Preview selected images before uploading
   - Click "Upload & Process" to extract text from images
   - Gallery automatically refreshes to show new images

3. **Search Images**:
   - Start typing in the search box
   - Images are filtered in real-time as you type
   - No need to press Enter or click a button
   - See count of matching vs total images
   - Click X button to clear search and show all images

4. **View Details**:
   - Each card shows image preview, confidence score, and text snippet
   - Click on any image card to see the full extracted text in a modal
   - See upload date for each image

5. **Edit & Delete**:
   - Click "Edit" button in the image modal to modify extracted text
   - Make corrections to OCR text and click "Save"
   - Click "Delete" button to permanently remove an image
   - Confirmation dialog prevents accidental deletions

## Features in Detail

### Image Processing
- Images are automatically preprocessed for better OCR accuracy
- Grayscale conversion, normalization, sharpening, and binarization
- Small images are upscaled for better recognition
- Uses native Tesseract engine (via node-tesseract-ocr) for superior accuracy
- Supports multiple image formats (PNG, JPG, WEBP, etc.)

### Search Functionality
- Case-insensitive regex-based search
- Searches through all extracted text in the database
- Results are sorted by upload date
- Supports partial text matching

### UI/UX Features
- Drag & drop file upload
- Multiple file preview with individual removal
- Loading states for upload, search, update, and delete operations
- Toast notifications for success/error feedback
- Modal view for detailed image inspection
- Inline text editing with textarea
- Confirmation dialogs for destructive actions
- Responsive design for mobile, tablet, and desktop
- Smooth animations and transitions

## Environment Variables

### Backend (.env)
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/ocr-gallery
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```
The built files will be in the `dist` directory.

### Backend
The backend doesn't require a build step. Just ensure all environment variables are set correctly.

## Docker Deployment

### Quick Start with Docker Compose

```bash
# Build and run
docker-compose up --build

# Access at http://localhost:8000
```

### Deploy to Easypanel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Quick Summary:**
1. Push code to GitHub
2. Create MongoDB service in Easypanel
3. Create new service from GitHub repository
4. Set environment variables:
   - `NODE_ENV=production`
   - `PORT=8000`
   - `MONGODB_URI=mongodb://mongodb:27017/ocr-gallery`
5. Deploy with Dockerfile
6. Configure domain and SSL

The Dockerfile includes:
- Multi-stage build for optimized image size
- Tesseract OCR pre-installed
- Frontend built and served by backend
- Health checks included
- Production-ready configuration

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or `brew services start mongodb-community`
- Check the MongoDB URI in your `.env` file
- Verify port 27017 is not blocked

### CORS Errors
- Ensure the backend has CORS enabled
- Check that `VITE_API_URL` in frontend matches your backend URL
- Verify both servers are running

### Upload Failures
- Check file size (limit is 10MB per file)
- Ensure the `images` directory exists and is writable
- Verify supported image formats

### OCR Accuracy Issues
- Use high-quality, high-contrast images
- Ensure text is clearly visible and not skewed
- Preprocessing helps, but very low-quality images may have poor results

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

saurav-bytive03

## Acknowledgments

- Tesseract.js for OCR capabilities
- shadcn/ui for beautiful UI components
- React Responsive Masonry for gallery layout

