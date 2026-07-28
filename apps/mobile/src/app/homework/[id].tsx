import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { dDayLabel, STATUS_STYLE } from '@/features/homework/status';
import { MAX_IMAGES, pickPhotos, takePhoto, uploadImage } from '@/features/homework/upload';
import { useAssignment, useSubmitHomework } from '@/features/homework/use-homework';
import { useTheme } from '@/hooks/use-theme';

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data, isPending, error } = useAssignment(id);
  const submit = useSubmitHomework(id);
  const [uploading, setUploading] = useState(false);

  if (isPending) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error || !data) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          숙제를 불러오지 못했습니다
        </ThemedText>
      </ThemedView>
    );
  }

  const status = STATUS_STYLE[data.status];
  const canSubmit = !data.closed && !uploading && !submit.isPending;

  async function handleAdd(source: 'camera' | 'library') {
    const alreadyUploaded = data?.submission?.images.length ?? 0;
    const remaining = MAX_IMAGES - alreadyUploaded;
    if (remaining <= 0) {
      Alert.alert('사진은 최대 10장까지 첨부할 수 있어요');
      return;
    }

    setUploading(true);
    try {
      const picked = source === 'camera' ? [await takePhoto()] : await pickPhotos(remaining);
      const images = picked.filter((image) => image !== null);
      if (images.length === 0) return;

      // 재제출은 교체 방식이라 기존 사진까지 함께 보내야 남는다
      const uploaded = await Promise.all(images.map(uploadImage));
      const existing = (data?.submission?.images ?? []).map((image) => ({
        storageKey: image.storageKey,
        width: image.width ?? undefined,
        height: image.height ?? undefined,
      }));

      await submit.mutateAsync([...existing, ...uploaded]);
    } catch (e) {
      Alert.alert('제출에 실패했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요');
    } finally {
      setUploading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">{data.title}</ThemedText>
          <View style={styles.metaRow}>
            <ThemedText type="small" style={{ color: status.color }}>
              {status.label}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              마감 {data.dueDate} · {dDayLabel(data.dueDate)}
            </ThemedText>
          </View>
        </View>

        {data.description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {data.description}
          </ThemedText>
        ) : null}

        <Section title="내 제출물">
          {data.submission && data.submission.images.length > 0 ? (
            <View style={styles.imageGrid}>
              {data.submission.images.map((image) => (
                <Image
                  key={image.id}
                  source={{ uri: image.url }}
                  style={styles.thumbnail}
                  contentFit="cover"
                  transition={150}
                />
              ))}
            </View>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              아직 제출하지 않았어요
            </ThemedText>
          )}

          {data.closed ? (
            <ThemedText type="small" themeColor="textSecondary">
              마감된 숙제는 수정할 수 없어요
            </ThemedText>
          ) : (
            <View style={styles.buttonRow}>
              <PrimaryButton
                label="사진 촬영"
                onPress={() => handleAdd('camera')}
                disabled={!canSubmit}
                style={styles.flexButton}
              />
              <PrimaryButton
                label="앨범에서 선택"
                onPress={() => handleAdd('library')}
                loading={uploading || submit.isPending}
                disabled={!canSubmit}
                style={styles.flexButton}
              />
            </View>
          )}
        </Section>

        <Section title="선생님 코멘트">
          {data.submission && data.submission.comments.length > 0 ? (
            data.submission.comments.map((comment) => (
              <View
                key={comment.id}
                style={[styles.comment, { backgroundColor: theme.backgroundElement }]}>
                {comment.body ? <ThemedText type="small">{comment.body}</ThemedText> : null}
                {comment.imageUrl ? (
                  <Image
                    source={{ uri: comment.imageUrl }}
                    style={styles.commentImage}
                    contentFit="cover"
                  />
                ) : null}
              </View>
            ))
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              아직 코멘트가 없어요
            </ThemedText>
          )}
        </Section>
      </ScrollView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  section: {
    gap: 10,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  comment: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  commentImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
});
