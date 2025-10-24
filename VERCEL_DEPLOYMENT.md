# MedMate Vercel Deployment Guide

## Prerequisites
- Vercel account
- Vercel CLI installed (`npm i -g vercel`)
- Required API keys

## Environment Variables

Set these in your Vercel project dashboard:

```
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
SECRET_KEY=your_secret_key_here
VERCEL=1
```

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   For production:
   ```bash
   vercel --prod
   ```

## Important Notes

### Serverless Limitations

1. **Database**: SQLite database uses `/tmp` directory in Vercel, which means:
   - Data does NOT persist between function invocations
   - Consider using a cloud database (PostgreSQL, MongoDB, etc.) for production

2. **Text-to-Speech**: `pyttsx3` is disabled in serverless environment
   - The app will run without TTS features
   - Voice features won't work on Vercel

3. **File Uploads**: Files uploaded to `/tmp/uploads` will not persist
   - Consider using cloud storage (AWS S3, Cloudinary, etc.) for production

### Configuration Files

- `vercel.json`: Vercel deployment configuration
- `api/index.py`: Serverless function entry point
- `requirements.txt`: Python dependencies (pyttsx3 removed for Vercel)
- `requirements.txt.backup`: Original requirements with all dependencies

### Local Development

For local development with full features, restore the original requirements:
```bash
cp requirements.txt.backup requirements.txt
pip install -r requirements.txt
```

## Troubleshooting

### Function Invocation Failed
- Check Vercel logs: `vercel logs`
- Ensure all environment variables are set
- Verify API keys are valid

### Import Errors
- Make sure `requirements.txt` doesn't include `pyttsx3`
- Check Python version compatibility (Vercel uses Python 3.9)

### Database Issues
- Remember: SQLite data doesn't persist in serverless
- For production, migrate to a cloud database

## Production Recommendations

For a production deployment, consider:
1. Using PostgreSQL or MongoDB instead of SQLite
2. Using cloud storage (S3, Cloudinary) for file uploads
3. Removing or replacing TTS functionality
4. Setting up proper error monitoring (Sentry, etc.)
5. Implementing rate limiting and security measures
