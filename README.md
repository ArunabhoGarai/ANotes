# StudyMind AI - AI-Powered Study Notes Generator

A beautiful, modern web application that generates comprehensive study notes using Google's Gemini 2.0 Flash model.

## Features

- **AI-Powered Note Generation**: Leverages Gemini 2.0 Flash's advanced reasoning capabilities
- **Beautiful Modern Design**: Clean, responsive interface with subtle animations
- **Comprehensive Study Materials**: Generates detailed notes with key concepts, definitions, examples, and practice questions
- **Export Options**: Copy to clipboard or download as text files
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Setup

1. **Get your Gemini API key**:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - The app uses the `gemini-2.0-flash` model

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Install dependencies and start the development server**:
   ```bash
   npm install
   npm run dev
   ```

## Usage

1. Enter any study topic in the input field
2. Optionally add additional context or requirements
3. Click "Generate Study Notes" to create AI-powered study materials
4. Copy, download, or save your generated notes

## Technologies Used

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: OpenRouter API with DeepSeek R1 model
- **Build Tool**: Vite

## API Integration

The app integrates with Google's Gemini API to access Gemini 2.0 Flash, which provides:
- Advanced reasoning capabilities
- Comprehensive content generation
- Structured educational content
- Context-aware responses

## License

This project is open source and available under the MIT License.