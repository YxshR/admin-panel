# File Upload System Documentation

## Overview

The file upload system provides a comprehensive solution for handling image uploads in the AI Reels Platform. It includes server-side validation, image optimization, client-side utilities, and React components for easy integration.

## Features

- **Image Validation**: File type, size, and dimension validation
- **Image Optimization**: Automatic resizing and compression using Sharp
- **Multiple Upload Methods**: Single file, multiple files, drag & drop
- **Progress Tracking**: Real-time upload progress with XMLHttpRequest
- **Error Handling**: Comprehensive error handling and user feedback
- **Security**: Path traversal protection and file validation
- **TypeScript Support**: Full TypeScript support with proper types

## Architecture

### Server-Side Components

#### API Route: `/api/upload`
- **POST**: Upload files with validation and optimization
- **DELETE**: Delete uploaded files with security checks

#### Image Utilities (`lib/image-utils.ts`)
- `validateImageFile()`: Validates uploaded image files
- `optimizeImage()`: Optimizes images using Sharp
- `getImageDimensions()`: Gets image dimensions
- `createThumbnail()`: Creates thumbnail versions
- `convertToWebP()`: Converts images to WebP format

### Client-Side Components

#### Upload Client (`lib/upload-client.ts`)
- `uploadFile()`: Upload single file
- `uploadMultipleFiles()`: Upload multiple files
- `deleteFile()`: Delete uploaded file
- `validateFileForUpload()`: Client-side validation

#### React Hook (`lib/hooks/use-file-upload.ts`)
- `useFileUpload()`: React hook for upload state management

#### React Component (`lib/components/file-upload.tsx`)
- `FileUpload`: Complete upload component with drag & drop

## Usage Examples

### Basic File Upload

```tsx
import { FileUpload } from '@/lib/components/file-upload'

function MyComponent() {
  const handleUpload = (files: { url: string; filename: string }[]) => {
    console.log('Uploaded files:', files)
  }

  const handleError = (error: string) => {
    console.error('Upload error:', error)
  }

  return (
    <FileUpload
      onUpload={handleUpload}
      onError={handleError}
      folder="my-uploads"
      accept="image/*"
      maxSize={5 * 1024 * 1024} // 5MB
    />
  )
}
```

### Using the Upload Hook

```tsx
import { useFileUpload } from '@/lib/hooks/use-file-upload'

function MyComponent() {
  const { upload, isUploading, progress, error } = useFileUpload()

  const handleFileSelect = async (file: File) => {
    try {
      const result = await upload(file, { folder: 'my-uploads' })
      console.log('Upload successful:', result)
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  return (
    <div>
      {isUploading && <div>Uploading... {progress}%</div>}
      {error && <div>Error: {error}</div>}
      <input type="file" onChange={(e) => handleFileSelect(e.target.files[0])} />
    </div>
  )
}
```

### Direct API Usage

```tsx
import { uploadFile } from '@/lib/upload-client'

async function uploadImage(file: File) {
  try {
    const result = await uploadFile(file, {
      folder: 'images',
      onProgress: (progress) => console.log(`Progress: ${progress}%`)
    })
    
    console.log('Upload successful:', result.url)
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

## Configuration

### Environment Variables

```env
# File Upload Configuration
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=5242880  # 5MB in bytes
```

### Supported File Types

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### Image Optimization Settings

- **Maximum Dimensions**: 1920x1080px
- **Thumbnail Size**: 400x300px
- **JPEG Quality**: 85%
- **WebP Quality**: 85%
- **PNG Compression**: Level 9

## API Reference

### POST /api/upload

Upload a file with validation and optimization.

**Request:**
- `Content-Type: multipart/form-data`
- `file`: File to upload
- `folder`: Target folder (optional, default: "general")

**Response:**
```json
{
  "success": true,
  "url": "/uploads/folder/filename.jpg",
  "filename": "filename.jpg",
  "size": 12345,
  "originalSize": 54321
}
```

### DELETE /api/upload

Delete an uploaded file.

**Request:**
- `path`: File path to delete (query parameter)

**Response:**
```json
{
  "success": true
}
```

## Security Features

1. **File Type Validation**: Only allows specified image types
2. **File Size Limits**: Configurable maximum file size
3. **Path Traversal Protection**: Prevents directory traversal attacks
4. **Input Sanitization**: Validates all input parameters
5. **Secure File Names**: Generates unique, secure file names

## Error Handling

The system provides comprehensive error handling:

- **Client-side validation** before upload
- **Server-side validation** with detailed error messages
- **Network error handling** with retry capabilities
- **File system error handling** with graceful fallbacks

## Testing

The system includes comprehensive tests:

- **Unit tests** for all utility functions
- **Integration tests** for API endpoints
- **Component tests** for React components
- **Error scenario testing** for edge cases

Run tests with:
```bash
npm run test:ci -- --testPathPatterns="upload|image-utils"
```

## Performance Considerations

1. **Image Optimization**: Automatic compression and resizing
2. **Lazy Loading**: Preview images are loaded on demand
3. **Progress Tracking**: Real-time upload progress
4. **Memory Management**: Proper cleanup of preview URLs
5. **Chunked Uploads**: Support for large file uploads

## Troubleshooting

### Common Issues

1. **Sharp Installation**: Ensure Sharp is properly installed
2. **File Permissions**: Check upload directory permissions
3. **File Size Limits**: Verify server and client size limits match
4. **MIME Type Detection**: Ensure proper file type validation

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Future Enhancements

- [ ] Cloud storage integration (AWS S3, Cloudinary)
- [ ] Image cropping and editing
- [ ] Batch upload with queue management
- [ ] Advanced image formats (AVIF, HEIC)
- [ ] Video file support
- [ ] Upload resumption for large files