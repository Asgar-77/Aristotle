# Aristotle - AI-Powered Math Learning Platform

Aristotle is an interactive math learning platform that uses AI to provide real-time feedback on handwritten mathematical solutions. Students can practice math problems by writing them by hand, and the AI validates each step, providing guidance and encouragement.

## Features

- **Handwritten Math Recognition**: Convert handwritten math to digital format in real-time
- **AI-Powered Validation**: Get instant feedback on each step of your solution
- **Step-by-Step Guidance**: Receive hints and corrections as you work
- **Interactive Notebook**: Save and organize your practice sessions
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Multiple Math Topics**: Support for algebra, geometry, calculus, and more

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Canvas**: Fabric.js for drawing functionality
- **Math Rendering**: KaTeX
- **AI**: Groq API for math validation
- **Icons**: Lucide React
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Groq API key (for AI functionality)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd math-hand-written-main
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Add your Groq API key to `.env`:
```
VITE_GROQ_API_KEY=your_groq_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment on Netlify

This project is configured for easy deployment on Netlify:

1. **Connect your repository** to Netlify
2. **Set build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

3. **Add environment variables** in Netlify dashboard:
   - `VITE_GROQ_API_KEY`: Your Groq API key

4. **Deploy**: Netlify will automatically build and deploy your site

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Upload the `dist` folder to Netlify or use the Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Project Structure

```
src/
├── components/          # React components
│   ├── LandingPage.tsx  # Landing page
│   ├── FabricNotebookCanvas.tsx  # Main notebook interface
│   ├── PracticeDashboard.tsx     # Dashboard for notebooks
│   └── ErrorBoundary.tsx         # Error handling
├── services/            # API services
│   ├── aiValidation.ts  # AI validation service
│   └── recognition.ts   # Handwriting recognition
├── types/               # TypeScript type definitions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GROQ_API_KEY` | Groq API key for AI validation | Yes |
| `VITE_SUPABASE_URL` | Supabase URL (optional) | No |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (optional) | No |

## API Configuration

The application uses the Groq API for AI-powered math validation. To get started:

1. Sign up at [Groq](https://console.groq.com/)
2. Create an API key
3. Add the key to your environment variables

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.

## Changelog

### v1.0.0
- Initial release
- Handwritten math recognition
- AI-powered step validation
- Interactive notebook interface
- Responsive design
- Netlify deployment ready