import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress an image to reduce file size for upload
 * Resizes to max 1024px width and compresses to 80% quality
 */
export const compressImage = async (uri: string): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

/**
 * Get file size from URI (for validation)
 */
export const getFileSize = async (uri: string): Promise<number> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};
