import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const directUploadImage = async (file: File, folder: string = 'receipts'): Promise<UploadResult> => {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Chỉ hỗ trợ file ảnh (JPEG, PNG, WebP)'
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Kích thước file không được vượt quá 5MB'
      };
    }

    // Create unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    // Upload file directly to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      success: true,
      url: downloadURL
    };
  } catch (error) {
    console.error('Error uploading image directly:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.'
    };
  }
};
