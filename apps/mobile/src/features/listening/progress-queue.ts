import AsyncStorage from '@react-native-async-storage/async-storage';

import { withAuth } from '@/lib/with-auth';

import { saveProgress } from './api';

const KEY = 'listening:progress-queue';

type QueuedProgress = {
  itemId: string;
  lastPositionMs: number;
  completed: boolean;
  /** 충돌 시 최신 것을 남기려고 들고 있는다 */
  at: number;
};

async function readQueue(): Promise<QueuedProgress[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedProgress[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedProgress[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(queue));
}

/**
 * 진도를 보낸다. 실패하면 기기에 쌓아 두고 다음에 다시 시도한다.
 *
 * 오프라인 학습을 붙이면서 필요해졌다. 이전에는 전송이 실패해도 그냥 유실됐다.
 */
export async function enqueueProgress(
  itemId: string,
  body: { lastPositionMs: number; completed: boolean },
) {
  try {
    await withAuth((token) => saveProgress(token, itemId, body));
    return;
  } catch {
    // 아래에서 쌓는다
  }

  const queue = await readQueue();
  // 같은 문항은 최신 것만 남긴다 — 10초마다 쌓이면 큐가 무한정 길어진다
  const next = queue.filter((q) => q.itemId !== itemId);
  next.push({ itemId, ...body, at: Date.now() });
  await writeQueue(next);
}

/**
 * 쌓인 진도를 한 번에 보낸다. 온라인으로 돌아왔을 때 호출한다.
 * 실패한 것만 다시 큐에 남긴다.
 */
export async function flushProgressQueue() {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const failed: QueuedProgress[] = [];

  for (const entry of queue) {
    try {
      await withAuth((token) =>
        saveProgress(token, entry.itemId, {
          lastPositionMs: entry.lastPositionMs,
          completed: entry.completed,
        }),
      );
    } catch {
      failed.push(entry);
    }
  }

  await writeQueue(failed);
}
