import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../config/auth';

export async function POST(request: NextRequest) {
  console.log('Upload API called');
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Session check:', session ? 'authenticated' : 'not authenticated');
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('File received:', file ? `${file.name} (${file.size} bytes)` : 'no file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Chỉ hỗ trợ file ảnh (JPEG, PNG, WebP)' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Kích thước file không được vượt quá 5MB' 
      }, { status: 400 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create storage reference
    const storageRef = ref(storage, `receipts/${fileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return NextResponse.json({
      success: true,
      url: downloadURL
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ 
      error: 'Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.' 
    }, { status: 500 });
  }
}
