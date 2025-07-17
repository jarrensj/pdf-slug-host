import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadFileToS3 = async (file: Buffer, fileName: string, contentType: string) => {
  // Determine the folder based on content type
  const folder = contentType === 'application/pdf' ? 'pdfs' : 'images';
  const key = `${folder}/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);
  
  // Return the public URL
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

// Keep the old function for backwards compatibility
export const uploadPdfToS3 = async (file: Buffer, fileName: string) => {
  return uploadFileToS3(file, fileName, 'application/pdf');
};

export const generatePresignedUploadUrl = async (fileName: string) => {
  const key = `pdfs/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    ContentType: 'application/pdf',
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  
  return {
    uploadUrl: signedUrl,
    fileUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    key,
  };
}; 