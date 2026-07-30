import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { presignUpload } from '@/features/homework/api';
import { withAuth } from '@/lib/with-auth';

const MAX_EDGE = 1600;
const QUALITY = 0.8;

export const MAX_QNA_ATTACHMENTS = 5;

export type PreparedQnaImage = {
  uri: string;
  width: number;
  height: number;
};

export async function pickQnaPhotos(limit: number): Promise<PreparedQnaImage[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 1,
  });
  if (result.canceled) return [];

  return Promise.all(result.assets.map((asset) => resize(asset.uri)));
}

export async function takeQnaPhoto(): Promise<PreparedQnaImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({ quality: 1 });
  if (result.canceled || result.assets.length === 0) return null;

  return resize(result.assets[0].uri);
}

async function resize(uri: string): Promise<PreparedQnaImage> {
  const rendered = await ImageManipulator.manipulate(uri).renderAsync();
  const longEdge = Math.max(rendered.width, rendered.height);
  const context = ImageManipulator.manipulate(uri);
  if (longEdge > MAX_EDGE) {
    context.resize(rendered.width >= rendered.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: QUALITY });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

export async function uploadQnaImage(image: PreparedQnaImage) {
  const presigned = await withAuth((token) =>
    presignUpload(token, {
      directory: 'qna',
      contentType: 'image/jpeg',
      extension: 'jpg',
    }),
  );

  const blob = await fetch(image.uri).then((response) => response.blob());
  const uploaded = await fetch(presigned.url, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: blob,
  });

  if (!uploaded.ok) {
    throw new Error(`이미지 업로드에 실패했습니다 (${uploaded.status})`);
  }

  return {
    storageKey: presigned.key,
    mimeType: 'image/jpeg',
    byteSize: blob.size,
    width: image.width,
    height: image.height,
  };
}
