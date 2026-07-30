import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import type { QuestionAttachment, QuestionCategory, QuestionReference, QuestionStatus } from '@/features/qna/api';
import {
  useAddQuestionMessage,
  useAttachmentUrl,
  useCloseQuestion,
  useDeleteQuestion,
  useQuestion,
  useUpdateQuestion,
} from '@/features/qna/use-qna';
import { useTheme } from '@/hooks/use-theme';

const CATEGORY_LABEL: Record<QuestionCategory, string> = {
  HOMEWORK: '숙제',
  VOCAB: '단어',
  LISTENING: '리스닝',
  TEXTBOOK: '교재',
  ETC: '기타',
};

const STATUS_LABEL: Record<QuestionStatus, string> = {
  PENDING: '답변대기',
  ANSWERED: '답변완료',
  REOPENED: '재질문',
  CLOSED: '종료',
};

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const question = useQuestion(id);
  const addMessage = useAddQuestionMessage(id);
  const close = useCloseQuestion(id);
  const remove = useDeleteQuestion(id);
  const update = useUpdateQuestion(id);
  const [reply, setReply] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const detail = question.data;

  async function submitReply() {
    if (reply.trim().length < 2) return;
    try {
      await addMessage.mutateAsync({ body: reply.trim() });
      setReply('');
    } catch (error) {
      Alert.alert('재질문 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    }
  }

  async function submitEdit() {
    if (!detail) return;
    try {
      await update.mutateAsync({
        title: editTitle.trim(),
        body: editBody.trim(),
        publicVisible: detail.publicVisible,
      });
      setEditing(false);
    } catch (error) {
      Alert.alert('수정 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    }
  }

  async function deleteMine() {
    Alert.alert('질문 삭제', '답변 전 질문만 삭제할 수 있어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await remove.mutateAsync();
          router.replace('/qna');
        },
      },
    ]);
  }

  if (question.isPending) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!detail) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          질문을 불러오지 못했습니다
        </ThemedText>
      </ThemedView>
    );
  }

  const canEdit = detail.mine && detail.status === 'PENDING';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="smallBold">← 질문</ThemedText>
          </Pressable>
          {canEdit ? (
            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  setEditTitle(detail.title);
                  setEditBody(detail.body);
                  setEditing(true);
                }}
                hitSlop={8}>
                <ThemedText type="smallBold" style={{ color: Palette.primary }}>
                  수정
                </ThemedText>
              </Pressable>
              <Pressable onPress={deleteMine} hitSlop={8}>
                <ThemedText type="smallBold" style={{ color: Palette.danger }}>
                  삭제
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
          <View style={styles.badges}>
            <Badge label={CATEGORY_LABEL[detail.category]} color={Palette.primary} />
            <Badge label={STATUS_LABEL[detail.status]} color={statusColor(detail.status)} />
            {!detail.publicVisible ? <ThemedText type="small">🔒</ThemedText> : null}
          </View>
          <ThemedText type="subtitle">{detail.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {detail.authorName} · {formatDateTime(detail.createdAt)}
          </ThemedText>
          <ReferenceCard reference={detail.reference} />
          <ThemedText style={styles.body}>{detail.body}</ThemedText>
          <AttachmentGrid attachments={detail.attachments} onOpen={setPreview} />
        </View>

        {detail.messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.message,
              {
                backgroundColor:
                  message.role === 'TEACHER' ? theme.backgroundSelected : theme.backgroundElement,
                borderColor: theme.backgroundSelected,
              },
            ]}>
            <ThemedText type="smallBold">
              {message.role === 'TEACHER' ? '선생님 답변' : '재질문'}
            </ThemedText>
            <ThemedText style={styles.body}>{message.body}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatDateTime(message.createdAt)}
            </ThemedText>
            <AttachmentGrid attachments={message.attachments} onOpen={setPreview} />
          </View>
        ))}

        {detail.mine && detail.status !== 'CLOSED' ? (
          <View style={[styles.replyBox, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">재질문</ThemedText>
            <TextInput
              value={reply}
              onChangeText={setReply}
              multiline
              textAlignVertical="top"
              placeholder="답변에서 이해되지 않은 부분을 적어 주세요"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.replyInput,
                { color: theme.text, borderColor: theme.backgroundSelected },
              ]}
            />
            <PrimaryButton label="재질문하기" loading={addMessage.isPending} onPress={submitReply} />
          </View>
        ) : null}

        {detail.mine && detail.status === 'ANSWERED' ? (
          <PrimaryButton label="해결됨" loading={close.isPending} onPress={() => close.mutate()} />
        ) : null}
      </ScrollView>

      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <ThemedView style={styles.modalContent}>
          <TextInput
            value={editTitle}
            onChangeText={setEditTitle}
            style={[styles.editTitle, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <TextInput
            value={editBody}
            onChangeText={setEditBody}
            multiline
            textAlignVertical="top"
            style={[styles.editBody, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <PrimaryButton label="수정 완료" loading={update.isPending} onPress={submitEdit} />
          <Pressable onPress={() => setEditing(false)} style={styles.cancelButton}>
            <ThemedText type="smallBold">취소</ThemedText>
          </Pressable>
        </ThemedView>
      </Modal>

      <Modal visible={preview !== null} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreview(null)}>
          {preview ? (
            <ScrollView
              maximumZoomScale={3}
              minimumZoomScale={1}
              contentContainerStyle={styles.previewScroll}>
              <Image source={{ uri: preview }} style={styles.previewImage} contentFit="contain" />
            </ScrollView>
          ) : null}
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

function ReferenceCard({ reference }: { reference: QuestionReference }) {
  const router = useRouter();
  const theme = useTheme();

  if (reference.examId && reference.itemNo) {
    return (
      <Pressable
        onPress={() => router.push(`/listening/${reference.examId}`)}
        style={[styles.reference, { borderColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">
          🎧 {reference.examTitle} · {reference.itemNo}번
        </ThemedText>
      </Pressable>
    );
  }
  if (reference.wordDayId) {
    return (
      <Pressable
        onPress={() => router.push(`/vocabulary/${reference.wordDayId}`)}
        style={[styles.reference, { borderColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">Day {reference.wordDayNo}</ThemedText>
      </Pressable>
    );
  }
  if (reference.assignmentId) {
    return (
      <Pressable
        onPress={() => router.push(`/homework/${reference.assignmentId}`)}
        style={[styles.reference, { borderColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">{reference.assignmentTitle}</ThemedText>
      </Pressable>
    );
  }
  if (reference.textbook) {
    return (
      <View style={[styles.reference, { borderColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">
          {reference.textbook} · p.{reference.page}
        </ThemedText>
      </View>
    );
  }
  return null;
}

function AttachmentGrid({
  attachments,
  onOpen,
}: {
  attachments: QuestionAttachment[];
  onOpen: (url: string) => void;
}) {
  if (attachments.length === 0) return null;
  return (
    <View style={styles.attachmentGrid}>
      {attachments.map((attachment) => (
        <AttachmentThumb key={attachment.id} attachment={attachment} onOpen={onOpen} />
      ))}
    </View>
  );
}

function AttachmentThumb({
  attachment,
  onOpen,
}: {
  attachment: QuestionAttachment;
  onOpen: (url: string) => void;
}) {
  const signed = useAttachmentUrl(attachment.id);
  const url = signed.data?.url;

  return (
    <Pressable
      onPress={() => {
        if (url) onOpen(url);
      }}
      style={styles.attachment}>
      {url ? (
        <Image source={{ uri: url }} style={styles.attachmentImage} contentFit="cover" />
      ) : (
        <ActivityIndicator />
      )}
    </Pressable>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <ThemedText type="small" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

function statusColor(status: QuestionStatus) {
  if (status === 'ANSWERED') return Palette.primary;
  if (status === 'REOPENED') return Palette.warning;
  if (status === 'CLOSED') return '#94A3B8';
  return '#64748B';
}

function formatDateTime(value: string) {
  const date = new Date(value);
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${date.getMonth() + 1}/${date.getDate()} ${hour}:${minute}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 14 },
  topRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  badges: { minHeight: 24, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  badge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  body: { lineHeight: 24 },
  reference: { borderWidth: 1, borderRadius: 10, padding: 12 },
  message: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
  attachmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attachment: {
    width: 88,
    height: 88,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.line,
  },
  attachmentImage: { width: '100%', height: '100%' },
  replyBox: { borderRadius: 14, padding: 14, gap: 10 },
  replyInput: { minHeight: 100, borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
  modalContent: { flex: 1, padding: 20, gap: 12, justifyContent: 'center' },
  editTitle: { minHeight: 48, borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 18 },
  editBody: { minHeight: 220, borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
  cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  previewScroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
});
