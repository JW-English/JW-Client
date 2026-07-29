import { useCallback, useEffect, useState } from 'react';

import { withAuth } from '@/lib/with-auth';

import { fetchDownloadManifest } from './api';
import {
  type OfflineExam,
  type OfflineItem,
  ensureExamDirectory,
  fileNameFromKey,
  listOfflineExams,
  localFile,
  readOfflineExam,
  removeAllOfflineExams,
  removeOfflineExam,
  writeOfflineExam,
} from './offline-store';

import { File } from 'expo-file-system';

export type DownloadState =
  | { status: 'idle' }
  | { status: 'downloading'; done: number; total: number }
  | { status: 'done' }
  | { status: 'error'; message: string };

/**
 * 회차 단위 다운로드.
 *
 * 전체 24회차는 1.15GB 라 일괄 다운로드는 하지 않는다. 회차 하나가 약 51MB 다.
 */
export function useExamDownload(examId: string) {
  const [offline, setOffline] = useState<OfflineExam | null>(null);
  const [state, setState] = useState<DownloadState>({ status: 'idle' });

  const refresh = useCallback(async () => {
    const saved = await readOfflineExam(examId);
    setOffline(saved);
    setState(saved?.complete ? { status: 'done' } : { status: 'idle' });
  }, [examId]);

  useEffect(() => {
    let alive = true;
    // 이펙트 본문에서 동기로 상태를 바꾸지 않도록 await 뒤에 반영한다
    readOfflineExam(examId).then((saved) => {
      if (!alive) return;
      setOffline(saved);
      setState(saved?.complete ? { status: 'done' } : { status: 'idle' });
    });
    return () => {
      alive = false;
    };
  }, [examId]);

  const download = useCallback(async () => {
    setState({ status: 'downloading', done: 0, total: 1 });

    try {
      const manifest = await withAuth((token) => fetchDownloadManifest(token, examId));
      const dir = ensureExamDirectory(examId);

      const targets = [
        ...(manifest.introUrl && manifest.introKey
          ? [{ url: manifest.introUrl, fileName: fileNameFromKey(manifest.introKey) }]
          : []),
        // 16·17번은 같은 파일을 가리키므로 이름으로 중복을 제거한다
        ...manifest.items.map((item) => ({
          url: item.audioUrl,
          fileName: fileNameFromKey(item.audioKey),
        })),
      ].filter(
        (t, i, all) => all.findIndex((other) => other.fileName === t.fileName) === i,
      );

      setState({ status: 'downloading', done: 0, total: targets.length });

      let bytes = 0;
      for (let i = 0; i < targets.length; i += 1) {
        const { url, fileName } = targets[i];
        const existing = localFile(examId, fileName);

        // 이미 받은 파일은 건너뛴다 — 중단 후 다시 눌렀을 때 처음부터 받지 않는다
        if (!existing.exists) {
          await File.downloadFileAsync(url, dir);
        }

        const saved = localFile(examId, fileName);
        bytes += saved.size ?? 0;
        setState({ status: 'downloading', done: i + 1, total: targets.length });
      }

      const items: OfflineItem[] = manifest.items.map((item) => ({
        id: item.id,
        itemNo: item.itemNo,
        questionText: item.questionText,
        fileName: fileNameFromKey(item.audioKey),
        durationMs: item.durationMs,
        sentences: item.sentences,
      }));

      const saved: OfflineExam = {
        examId,
        examLabel: manifest.examLabel,
        introFileName: manifest.introKey ? fileNameFromKey(manifest.introKey) : null,
        items,
        // 전부 받은 뒤에만 완료로 표시한다. 부분 다운로드를 완료로 보면 재생이 깨진다
        complete: true,
        downloadedAt: Date.now(),
        bytes,
      };

      await writeOfflineExam(saved);
      setOffline(saved);
      setState({ status: 'done' });
    } catch (e) {
      setState({
        status: 'error',
        message: e instanceof Error ? e.message : '다운로드에 실패했어요',
      });
    }
  }, [examId]);

  const remove = useCallback(async () => {
    await removeOfflineExam(examId);
    setOffline(null);
    setState({ status: 'idle' });
  }, [examId]);

  return { offline, state, download, remove, refresh };
}

/** 설정 화면용. 받은 회차 목록과 총 용량 */
export function useOfflineLibrary() {
  const [exams, setExams] = useState<OfflineExam[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await listOfflineExams();
    setExams(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    listOfflineExams().then((list) => {
      if (!alive) return;
      setExams(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const removeOne = useCallback(
    async (examId: string) => {
      await removeOfflineExam(examId);
      await refresh();
    },
    [refresh],
  );

  const removeAll = useCallback(async () => {
    await removeAllOfflineExams();
    await refresh();
  }, [refresh]);

  const totalBytes = exams.reduce((sum, e) => sum + e.bytes, 0);

  return { exams, loading, totalBytes, refresh, removeOne, removeAll };
}
