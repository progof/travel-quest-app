# Quest Image Matching System (Responses API)

An efficient image matching system for travel quest apps using OpenAI's modern **Responses API** with structured outputs. This system allows users to upload images and check if they match any of your predefined quest locations without re-uploading location images every time.

## 🚀 How It Works

1. **One-time Setup**: Upload all your quest location images to OpenAI's file storage
2. **Efficient Matching**: Use Chat Completions with vision and structured outputs to compare user images against pre-uploaded references
3. **Fast Results**: Get structured JSON responses with match confidence and reasoning
4. **No Deprecated APIs**: Uses the modern Responses API instead of the deprecated Assistants API

## 📋 Prerequisites

- Node.js 18+ (with ES modules support)
- OpenAI API key with access to GPT-4o
- Quest location images in `public/images/` directory

## 🛠️ Setup

### 1. Environment Configuration

Create a `.env` file in your project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Initial Setup

Run the setup script once to upload your quest images:

```bash
# Using Node.js with TypeScript support
node --experimental-strip-types ./setup-quest-assistant.ts

# Or compile first
npx tsc setup-quest-assistant.ts && node setup-quest-assistant.js
```

This will:
- Upload all images from your `quest` data to OpenAI
- Save the configuration to `.quest-matcher-config.json`
- Use the modern Responses API approach

### 3. Test Image Matching

Test the system with a user image:

```bash
# Test with a sample image
node --experimental-strip-types ./match-user-image.ts path/to/test-image.jpg
```

## 📝 Usage

### API Endpoint

The system provides a Nuxt server route at `/api/match-quest-image` that accepts multipart form data:

```javascript
// Frontend usage example
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/match-quest-image', {
  method: 'POST',
  body: formData
});

const result = await response.json();

if (result.success && result.matched) {
  console.log(`Match found: ${result.location}`);
  console.log(`Confidence: ${result.confidence}`);
} else {
  console.log('No match found');
}
```

### Programmatic Usage

```typescript
import { matchUserImage } from './match-user-image';

const result = await matchUserImage('/path/to/user-image.jpg');

if (result.success && result.matchedLocation) {
  console.log(`Found match: ${result.matchedLocation}`);
} else {
  console.log('No match found');
}
```

## 📊 API Response Format

### Success Response (Match Found)
```json
{
  "success": true,
  "matched": true,
  "location": "Coffee Break Lemur",
  "confidence": "high",
  "message": "Great! You found: Coffee Break Lemur",
  "api": "responses-api"
}
```

### Success Response (No Match)
```json
{
  "success": true,
  "matched": false,
  "message": "This image doesn't match any quest locations. Keep exploring!",
  "api": "responses-api"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "statusMessage": "Invalid file type. Allowed: JPEG, PNG, WebP"
}
```

## 🏗️ File Structure

```
your-project/
├── setup-quest-assistant.ts    # One-time setup script (Responses API)
├── match-user-image.ts         # Core matching utility (Responses API)
├── server/api/
│   └── match-quest-image.post.ts # Nuxt API endpoint
├── types/
│   └── quest-matcher.ts        # TypeScript type definitions
├── config/
│   └── quest-matcher.ts        # Configuration and constants
├── shared/
│   └── quest.ts               # Quest location definitions
└── .quest-matcher-config.json # Generated configuration (new format)
```

## ⚙️ Configuration

You can customize the system behavior in `config/quest-matcher.ts`:

```typescript
export const defaultConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ["image/jpeg", "image/png", "image/webp"],
  temperature: 0.1, // Low temperature for consistent matching
  maxTokens: 500
};
```

## 🔄 Updating Quest Locations

If you add new quest locations or modify existing ones:

1. Update your `shared/quest.ts` file
2. Re-run the setup script: `node --experimental-strip-types ./setup-quest-assistant.ts`
3. This will upload the new images and update the configuration

## 🚨 Error Handling

The system handles various error scenarios:
- Invalid file types
- Missing assistant configuration
- OpenAI API errors
- File system errors
- Network timeouts

## 🔧 Troubleshooting

### Configuration Not Found
```bash
# Re-run setup if configuration is lost
node --experimental-strip-types ./setup-quest-assistant.ts
```

### API Key Issues
- Ensure `OPENAI_API_KEY` is set in your environment
- Verify the API key has sufficient credits
- Check that the API key has access to the GPT-4o model

### Image Upload Issues
- Verify images exist in the `public/images/` directory
- Check file permissions
- Ensure image files are valid JPEG/PNG/WebP format

## 💰 Cost Optimization

This system is designed to minimize OpenAI API costs:
- Location images are uploaded once during setup
- Only user images are uploaded for each matching request
- Automatic cleanup of temporary user images
- Efficient assistant instructions to minimize token usage

## 🔒 Security Considerations

- User images are temporarily stored and automatically cleaned up
- File type validation prevents malicious uploads
- File size limits prevent abuse
- All API keys should be kept secure and not committed to version control

## 🎯 Performance Tips

- Use compressed, reasonably sized images for quest locations
- Consider resizing user uploads before processing
- Monitor OpenAI usage to optimize costs
- Implement rate limiting for the API endpoint in production

## 📈 Monitoring

Track the following metrics:
- Match accuracy rates
- Response times
- OpenAI API usage and costs
- Error rates and types

## 🤝 Contributing

1. Follow the existing TypeScript patterns
2. Add proper error handling for new features
3. Update types and configuration as needed
4. Test thoroughly with various image types and sizes