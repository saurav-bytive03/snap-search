# Deployment Guide

## Deploying to Easypanel

### Prerequisites
- Easypanel account and server setup
- MongoDB database (use Easypanel's MongoDB service or external)

### Step 1: Prepare Your Repository

1. Ensure all code is committed to Git:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create MongoDB Service in Easypanel

1. Go to your Easypanel dashboard
2. Click "Create Service" → "MongoDB"
3. Configure:
   - Name: `ocr-mongodb`
   - Version: `7` (or latest)
   - Create database: `ocr-gallery`
4. Deploy and note the connection string

### Step 3: Deploy Application

1. In Easypanel, click "Create Service" → "GitHub"
2. Connect your repository
3. Configure the service:

**Build Settings:**
- Build Type: `Dockerfile`
- Dockerfile Path: `./Dockerfile`
- Context: `.`

**Environment Variables:**
```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb://ocr-mongodb:27017/ocr-gallery
```

**Port Configuration:**
- Container Port: `8000`
- Public Port: `80` (or your preferred port)

**Volumes (Optional but Recommended):**
- `/app/images` → Persistent storage for uploaded images
- `/app/temp` → Temporary storage for processing

**Resources:**
- Memory: At least 512MB (1GB recommended)
- CPU: 0.5 cores minimum

4. Click "Deploy"

### Step 4: Configure Domain (Optional)

1. Go to service settings
2. Add your custom domain
3. Enable SSL/HTTPS (automatic with Easypanel)

### Step 5: Verify Deployment

Once deployed, visit your app URL and:
1. Check that the UI loads
2. Upload a test image
3. Try searching for text
4. Verify all features work

## Environment Variables Reference

| Variable      | Description               | Default      | Required |
| ------------- | ------------------------- | ------------ | -------- |
| `NODE_ENV`    | Environment mode          | `production` | Yes      |
| `PORT`        | Server port               | `8000`       | No       |
| `MONGODB_URI` | MongoDB connection string | -            | Yes      |

## Troubleshooting

### "Tesseract not found" Error
The Dockerfile includes Tesseract installation. If you see this error:
- Rebuild the Docker image
- Check build logs for installation errors

### MongoDB Connection Failed
- Verify MongoDB service is running
- Check `MONGODB_URI` environment variable
- Ensure services are in the same network

### Upload Fails
- Check volume permissions
- Verify `/app/images` directory exists
- Ensure sufficient disk space

### High Memory Usage
- Tesseract OCR is memory-intensive
- Increase memory allocation to at least 1GB
- Consider scaling horizontally for high traffic

## Local Testing with Docker

Test your Docker setup locally before deploying:

```bash
# Build and run with docker-compose
docker-compose up --build

# Access at http://localhost:8000
```

Stop services:
```bash
docker-compose down
```

Clean up (including volumes):
```bash
docker-compose down -v
```

## Production Best Practices

1. **Persistent Storage:**
   - Always use volumes for `/app/images`
   - This prevents data loss on container restart

2. **Database Backups:**
   - Set up automated MongoDB backups
   - Use Easypanel's backup features

3. **Monitoring:**
   - Monitor memory usage (Tesseract can be memory-intensive)
   - Set up health check alerts
   - Monitor disk space for image uploads

4. **Security:**
   - Use environment variables for sensitive data
   - Enable HTTPS
   - Set up rate limiting if needed

5. **Scaling:**
   - For high traffic, consider multiple instances
   - Use external object storage (S3) for images
   - Consider Redis for caching search results

## Update Deployment

To update your deployed app:

1. Push new changes to your repository:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

2. In Easypanel:
   - Go to your service
   - Click "Rebuild" or enable auto-deploy
   - Monitor deployment progress

## Logs and Debugging

Access logs in Easypanel:
1. Go to your service
2. Click "Logs" tab
3. View real-time application logs

Common log messages:
- `Server running on http://localhost:8000` - Server started
- `MongoDB connected` - Database connected
- `Processing uploaded image: <filename>` - Image being processed
- `Regenerating text for: <filename>` - OCR being re-run

## Support

For issues:
- Check application logs in Easypanel
- Review this deployment guide
- Check main README.md for application details
- Verify all environment variables are set correctly

