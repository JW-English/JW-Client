import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import type { SentenceItem } from './api';

/**
 * 오프라인 저장소.
 *
 * ⚠️ 저장 위치는 반드시 documentDirectory 다. cacheDirectory 에 두면 iOS 가
 * 저장공간이 부족할 때 임의로 지워서 "받아뒀는데 없어졌다"가 된다.
 */
const ROOT = 'listening';

/** 회차별 메타데이터(대본·타임스탬프·완료 여부)를 담는 키 */
const metaKey = (examId: string) => `listening:offline:${examId}`;

export type OfflineItem = {
  id: string;
  itemNo: number;
  questionText: string | null;
  /** 기기에 저장된 파일 이름 */
  fileName: string;
  durationMs: number | null;
  sentences: SentenceItem[];
};

export type OfflineExam = {
  examId: string;
  examLabel: string;
  introFileName: string | null;
  items: OfflineItem[];
  /** 모든 파일을 받아 끝냈는지. 부분 다운로드를 완료로 착각하면 재생이 깨진다 */
  complete: boolean;
  downloadedAt: number;
  /** 바이트. 용량 표시용 */
  bytes: number;
};

export function examDirectory(examId: string) {
  return new Directory(Paths.document, ROOT, examId);
}

export function ensureExamDirectory(examId: string) {
  const dir = examDirectory(examId);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

/** presigned URL 은 만료되므로 저장 이름은 storage key 에서 뽑는다 */
export function fileNameFromKey(key: string) {
  return key.split('/').pop() ?? key;
}

export function localFile(examId: string, fileName: string) {
  return new File(examDirectory(examId), fileName);
}

/** 재생에 쓸 로컬 경로. 없으면 null 을 주고 호출부가 스트리밍으로 넘어간다 */
export function localUri(examId: string, fileName: string | null | undefined) {
  if (!fileName) return null;
  const file = localFile(examId, fileName);
  return file.exists ? file.uri : null;
}

export async function readOfflineExam(examId: string): Promise<OfflineExam | null> {
  const raw = await AsyncStorage.getItem(metaKey(examId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OfflineExam;
  } catch {
    // 메타가 깨졌으면 없는 것으로 본다. 파일은 남아 있어도 재생 경로를 못 찾는다
    return null;
  }
}

export async function writeOfflineExam(exam: OfflineExam) {
  await AsyncStorage.setItem(metaKey(exam.examId), JSON.stringify(exam));
}

export async function listOfflineExams(): Promise<OfflineExam[]> {
  const keys = await AsyncStorage.getAllKeys();
  const mine = keys.filter((k) => k.startsWith('listening:offline:'));
  if (mine.length === 0) return [];

  const entries = await AsyncStorage.multiGet(mine);
  return entries
    .map(([, value]) => {
      if (!value) return null;
      try {
        return JSON.parse(value) as OfflineExam;
      } catch {
        return null;
      }
    })
    .filter((e): e is OfflineExam => e !== null)
    .sort((a, b) => b.downloadedAt - a.downloadedAt);
}

export async function removeOfflineExam(examId: string) {
  const dir = examDirectory(examId);
  if (dir.exists) dir.delete();
  await AsyncStorage.removeItem(metaKey(examId));
}

export async function removeAllOfflineExams() {
  const exams = await listOfflineExams();
  await Promise.all(exams.map((e) => removeOfflineExam(e.examId)));
}
