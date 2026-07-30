import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { FilterChip, FilterChipRow } from '@/components/filter-chip';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAssignments } from '@/features/homework/use-homework';
import { useExams } from '@/features/listening/use-listening';
import type { QuestionCategory } from '@/features/qna/api';
import { useCreateQuestion } from '@/features/qna/use-qna';
import {
  MAX_QNA_ATTACHMENTS,
  pickQnaPhotos,
  takeQnaPhoto,
  uploadQnaImage,
  type PreparedQnaImage,
} from '@/features/qna/upload';
import { useDays } from '@/features/vocabulary/use-vocabulary';
import { useTheme } from '@/hooks/use-theme';

const TEMPLATE = `[질문 내용]


[내가 이해한 부분 / 막힌 지점]

`;

const CATEGORIES: { value: QuestionCategory; label: string }[] = [
  { value: 'HOMEWORK', label: '숙제' },
  { value: 'VOCAB', label: '단어' },
  { value: 'LISTENING', label: '리스닝' },
  { value: 'TEXTBOOK', label: '교재' },
  { value: 'ETC', label: '기타' },
];

export default function NewQuestionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [category, setCategory] = useState<QuestionCategory>('ETC');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState(TEMPLATE);
  const [publicVisible, setPublicVisible] = useState(false);
  const [images, setImages] = useState<PreparedQnaImage[]>([]);
  const [examId, setExamId] = useState<string | undefined>();
  const [itemNo, setItemNo] = useState('');
  const [wordDayId, setWordDayId] = useState<string | undefined>();
  const [assignmentId, setAssignmentId] = useState<string | undefined>();
  const [textbook, setTextbook] = useState('');
  const [page, setPage] = useState('');

  const create = useCreateQuestion();
  const exams = useExams();
  const days = useDays();
  const assignments = useAssignments(new Date());

  async function addFromAlbum() {
    const picked = await pickQnaPhotos(MAX_QNA_ATTACHMENTS - images.length);
    setImages((current) => [...current, ...picked].slice(0, MAX_QNA_ATTACHMENTS));
  }

  async function addFromCamera() {
    const photo = await takeQnaPhoto();
    if (photo) setImages((current) => [...current, photo].slice(0, MAX_QNA_ATTACHMENTS));
  }

  async function submit() {
    if (title.trim().length < 2 || body.trim().length < 10) {
      Alert.alert('입력 확인', '제목과 내용을 조금 더 자세히 적어 주세요.');
      return;
    }
    try {
      const attachments = [];
      for (const image of images) {
        attachments.push(await uploadQnaImage(image));
      }
      const detail = await create.mutateAsync({
        category,
        title: title.trim(),
        body: body.trim(),
        publicVisible,
        refExamId: category === 'LISTENING' ? examId : undefined,
        refItemNo: category === 'LISTENING' ? Number(itemNo) || undefined : undefined,
        refWordDayId: category === 'VOCAB' ? wordDayId : undefined,
        refAssignmentId: category === 'HOMEWORK' ? assignmentId : undefined,
        refTextbook: category === 'TEXTBOOK' ? textbook.trim() : undefined,
        refPage: category === 'TEXTBOOK' ? Number(page) || undefined : undefined,
        attachments,
      });
      router.replace(`/qna/${detail.id}`);
    } catch (error) {
      Alert.alert('질문 등록 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">질문 작성</ThemedText>

        <View style={styles.fieldGroup}>
          <ThemedText type="smallBold">분류</ThemedText>
          <FilterChipRow style={styles.chipRow}>
            {CATEGORIES.map((item) => (
              <FilterChip
                key={item.value}
                label={item.label}
                active={category === item.value}
                onPress={() => setCategory(item.value)}
              />
            ))}
          </FilterChipRow>
        </View>

        {category === 'LISTENING' ? (
          <View style={styles.fieldGroup}>
            <ThemedText type="smallBold">리스닝 참조</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.inlineChips}>
                {(exams.data ?? []).map((exam) => (
                  <FilterChip
                    key={exam.id}
                    label={exam.title}
                    active={examId === exam.id}
                    onPress={() => setExamId(exam.id)}
                  />
                ))}
              </View>
            </ScrollView>
            <TextField label="문항 번호" keyboardType="number-pad" value={itemNo} onChangeText={setItemNo} />
          </View>
        ) : null}

        {category === 'VOCAB' ? (
          <View style={styles.fieldGroup}>
            <ThemedText type="smallBold">단어 DAY</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.inlineChips}>
                {(days.data ?? []).map((day) => (
                  <FilterChip
                    key={day.id}
                    label={`Day ${day.dayNo}`}
                    active={wordDayId === day.id}
                    onPress={() => setWordDayId(day.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        {category === 'HOMEWORK' ? (
          <View style={styles.fieldGroup}>
            <ThemedText type="smallBold">숙제</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.inlineChips}>
                {(assignments.data ?? []).map((assignment) => (
                  <FilterChip
                    key={assignment.id}
                    label={assignment.title}
                    active={assignmentId === assignment.id}
                    onPress={() => setAssignmentId(assignment.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        {category === 'TEXTBOOK' ? (
          <View style={styles.twoColumns}>
            <TextField label="교재명" value={textbook} onChangeText={setTextbook} style={styles.flexInput} />
            <TextField label="페이지" keyboardType="number-pad" value={page} onChangeText={setPage} style={styles.pageInput} />
          </View>
        ) : null}

        <TextField label="제목" value={title} onChangeText={setTitle} maxLength={60} />
        <TextField
          label="내용"
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
          style={styles.bodyInput}
        />

        <View style={styles.fieldGroup}>
          <View style={styles.rowBetween}>
            <ThemedText type="smallBold">첨부 이미지</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {images.length}/{MAX_QNA_ATTACHMENTS}
            </ThemedText>
          </View>
          {images.length > 0 ? (
            <View style={styles.thumbnailGrid}>
              {images.map((image, index) => (
                <Pressable
                  key={`${image.uri}-${index}`}
                  onPress={() => setImages((current) => current.filter((_, i) => i !== index))}
                  style={[styles.thumbWrap, { borderColor: theme.backgroundSelected }]}>
                  <Image source={{ uri: image.uri }} style={styles.thumb} />
                  <View style={styles.removePill}>
                    <ThemedText type="small" style={{ color: '#ffffff' }}>
                      삭제
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={styles.attachButtons}>
            <Pressable
              disabled={images.length >= MAX_QNA_ATTACHMENTS}
              onPress={addFromCamera}
              style={[styles.secondaryButton, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">촬영</ThemedText>
            </Pressable>
            <Pressable
              disabled={images.length >= MAX_QNA_ATTACHMENTS}
              onPress={addFromAlbum}
              style={[styles.secondaryButton, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">앨범</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={[styles.visibility, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.visibilityText}>
            <ThemedText type="smallBold">공개 질문</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              공개하면 다른 학생도 볼 수 있어요. 이름은 성만 표시됩니다.
            </ThemedText>
          </View>
          <Switch value={publicVisible} onValueChange={setPublicVisible} />
        </View>

        <PrimaryButton label="등록하기" loading={create.isPending} onPress={submit} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 18 },
  fieldGroup: { gap: 8 },
  chipRow: { paddingHorizontal: 0, paddingVertical: 0 },
  inlineChips: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  twoColumns: { flexDirection: 'row', gap: 10 },
  flexInput: { minWidth: 0 },
  pageInput: { minWidth: 92 },
  bodyInput: { minHeight: 190, lineHeight: 22 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  thumbnailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { width: 74, height: 74, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  removePill: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    borderRadius: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  attachButtons: { flexDirection: 'row', gap: 8 },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibility: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visibilityText: { flex: 1, gap: 4 },
});
