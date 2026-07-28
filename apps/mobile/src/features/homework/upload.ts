import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { withAuth } from '@/lib/with-auth';

import { presignUpload } from './api';

/** 장변 기준 최대 크기. 숙제 사진은 글씨만 읽히면 되므로 1600px 이면 충분하다. */
const MAX_EDGE = 1600;
const QUALITY = 0.8;

export type PreparedImage = {
  uri: string;
  width: number;
  height: number;
};

export const MAX_IMAGES = 10;

/** 카메라로 촬영. 권한이 없으면 null 을 반환한다(호출부에서 안내). */
export async function takePhoto(): Promise<PreparedImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({ quality: 1 });
  if (result.canceled || result.assets.length === 0) return null;

  return resize(result.assets[0].uri);
}

/** 앨범에서 여러 장 선택. */
export async function pickPhotos(limit: number): Promise<PreparedImage[]> {
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

/**
 * 업로드 전 리사이즈·압축.
 * 원본 그대로 올리면 장당 5MB 를 넘어 학생 데이터도, 서버 비용도 낭비된다.
 */
async function resize(uri: string): Promise<PreparedImage> {
  const rendered = await ImageManipulator.manipulate(uri).renderAsync();

  const longEdge = Math.max(rendered.width, rendered.height);
  const context = ImageManipulator.manipulate(uri);
  if (longEdge > MAX_EDGE) {
    // 장변만 지정하면 비율은 자동으로 유지된다
    context.resize(
      rendered.width >= rendered.height ? { width: MAX_EDGE } : { height: MAX_EDGE },
    );
  }

  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: QUALITY });

  return { uri: saved.uri, width: saved.width, height: saved.height };
}

/**
 * presign 으로 URL 을 받아 스토리지에 직접 PUT 한다. 서버는 바이트를 경유하지 않는다.
 * 반환된 key 를 제출 API 에 등록하면 끝이다.
 */
export async function uploadImage(image: PreparedImage): Promise<{
  storageKey: string;
  width: number;
  height: number;
}> {
  const presigned = await withAuth((token) =>
    presignUpload(token, {
      directory: 'homework',
      contentType: 'image/jpeg',
      extension: 'jpg',
    }),
  );

  const body = await fetch(image.uri).then((response) => response.blob());
  const uploaded = await fetch(presigned.url, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body,
  });

  if (!uploaded.ok) {
    throw new Error(`이미지 업로드에 실패했습니다 (${uploaded.status})`);
  }

  return { storageKey: presigned.key, width: image.width, height: image.height };
}
