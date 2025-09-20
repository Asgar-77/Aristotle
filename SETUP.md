# Math Handwriting Recognition Setup Guide

This guide will help you set up the best handwritten math recognition for your application.

## 🎯 Recommended API: Mathpix (Highest Accuracy)

### Why Mathpix?
- **95%+ accuracy** for handwritten math recognition
- **Direct LaTeX output** - no conversion needed
- **Supports complex equations**: fractions, integrals, matrices, Greek letters
- **Free tier**: 1000 requests/month
- **Easy integration** with existing codebase

### Setup Mathpix API

1. **Sign up for Mathpix API**
   - Go to [https://mathpix.com/](https://mathpix.com/)
   - Create a free account
   - Navigate to API section to get your credentials

2. **Get API Credentials**
   - Copy your `app_id` and `app_key`
   - These will be used in your environment variables

3. **Configure Environment Variables**
   ```bash
   # Copy the example file
   cp env.example .env
   
   # Edit .env file with your credentials
   VITE_MATHPIX_APP_ID=your_actual_app_id_here
   VITE_MATHPIX_APP_KEY=your_actual_app_key_here
   ```

4. **Restart the development server**
   ```bash
   npm run dev
   ```

## 🔄 Alternative APIs (Fallback Options)

### Google ML Kit Digital Ink Recognition
- **Accuracy**: 85-90% for basic math
- **Cost**: Free with Google Cloud credits
- **Setup**: Get API key from Google Cloud Console

### LaTeX-OCR (Open Source)
- **Accuracy**: 80-85% with training
- **Cost**: Free
- **Setup**: Requires Python backend server

## 📊 API Comparison

| API | Accuracy | Cost | Setup Difficulty | LaTeX Output |
|-----|----------|------|------------------|--------------|
| **Mathpix** | 95%+ | Free tier + $0.004/request | Easy | ✅ Direct |
| Google ML Kit | 85-90% | Free tier | Easy | ❌ Needs conversion |
| LaTeX-OCR | 80-85% | Free | Hard | ✅ Direct |
| Microsoft Vision | 70-80% | Free tier | Easy | ❌ Needs conversion |

## 🚀 Quick Start

1. **Get Mathpix credentials** (recommended)
2. **Set up environment variables**:
   ```bash
   VITE_MATHPIX_APP_ID=your_app_id
   VITE_MATHPIX_APP_KEY=your_app_key
   ```
3. **Start the application**:
   ```bash
   npm run dev
   ```
4. **Test recognition** by drawing math equations

## 🔧 Troubleshooting

### No Recognition Results
- Check if API keys are correctly set in `.env` file
- Verify API credentials are valid
- Check browser console for error messages

### Low Accuracy
- Ensure handwriting is clear and well-spaced
- Try drawing larger equations
- Check if strokes are complete (no gaps)

### API Rate Limits
- Mathpix free tier: 1000 requests/month
- Google ML Kit: 1000 requests/month
- Consider upgrading to paid plans for higher limits

## 📈 Performance Tips

1. **Image Quality**: The app automatically optimizes canvas quality for recognition
2. **Stroke Thickness**: Slightly thicker strokes (3px) improve recognition
3. **Clear Spacing**: Leave adequate space between symbols
4. **Complete Strokes**: Avoid lifting pen/finger mid-symbol

## 🆘 Support

- **Mathpix Documentation**: [https://docs.mathpix.com/](https://docs.mathpix.com/)
- **Google ML Kit Docs**: [https://developers.google.com/ml-kit](https://developers.google.com/ml-kit)
- **LaTeX-OCR GitHub**: [https://github.com/leonlenk/LaTeX_OCR](https://github.com/leonlenk/LaTeX_OCR)
