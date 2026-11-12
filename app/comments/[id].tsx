import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { EmptyState } from '@/src/components/EmptyState';
import { NavBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { PressableScale } from '@/src/components/PressableScale';
import { Screen } from '@/src/components/Screen';
import { useAddComment, useComments } from '@/src/features/posts/comments';
import { formatTime } from '@/src/lib/format';
import { fonts, useTheme } from '@/src/theme';
import type { CommentRow } from '@/src/types/app';

function CommentItem({ comment, replies, onReply }: { comment: CommentRow; replies: CommentRow[]; onReply: (c: CommentRow) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.comment}>
      <Avatar name={comment.authorName} color={comment.authorColor} size={34} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.commentMeta, { color: colors.muted }]}>
          <Text style={{ color: colors.ink, fontFamily: fonts.bodyBold }}>{comment.authorName}</Text> · {formatTime(comment.at)}
        </Text>
        <Text style={[styles.commentBody, { color: colors.ink }]}>{comment.body}</Text>
        <Pressable onPress={() => onReply(comment)} hitSlop={8}>
          <Text style={[styles.replyLink, { color: colors.muted }]}>Reply</Text>
        </Pressable>
        {replies.map((r) => (
          <View key={r.id} style={styles.reply}>
            <Avatar name={r.authorName} color={r.authorColor} size={26} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.commentMeta, { color: colors.muted }]}>
                <Text style={{ color: colors.ink, fontFamily: fonts.bodyBold }}>{r.authorName}</Text> · {formatTime(r.at)}
              </Text>
              <Text style={[styles.commentBody, { color: colors.ink }]}>{r.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function CommentsScreen() {
  const { colors } = useTheme();
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const postKind = kind === 'larp_check' ? 'larp_check' : 'session';
  const { data: comments } = useComments(id!, postKind);
  const addComment = useAddComment(id!, postKind);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);

  const { topLevel, repliesByParent } = useMemo(() => {
    const top: CommentRow[] = [];
    const byParent = new Map<string, CommentRow[]>();
    for (const c of comments ?? []) {
      if (c.parentId) {
        const list = byParent.get(c.parentId) ?? [];
        list.push(c);
        byParent.set(c.parentId, list);
      } else {
        top.push(c);
      }
    }
    return { topLevel: top, repliesByParent: byParent };
  }, [comments]);

  const send = () => {
    const text = body.trim();
    if (!text) return;
    addComment.mutate(
      { body: text, parentId: replyTo?.id ?? null },
      { onSuccess: () => { setBody(''); setReplyTo(null); } },
    );
  };

  const canSend = Boolean(body.trim()) && !addComment.isPending;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Screen
      scroll
      header={<NavBar title="Comments" onClose={() => router.back()} divider />}
      footer={
        <View>
          {replyTo ? (
            <Pressable
              onPress={() => setReplyTo(null)}
              style={styles.replyToPill}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Stop replying to ${replyTo.authorName}`}
            >
              <Text style={[styles.replyToText, { color: colors.muted }]}>Replying to {replyTo.authorName}</Text>
              <Icon name="close" size={11} color={colors.muted} weight="bold" />
            </Pressable>
          ) : null}
          <View style={[styles.inputRow, { backgroundColor: colors.surface2 }]}>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder={replyTo ? `Reply to ${replyTo.authorName}…` : 'Add a comment…'}
              placeholderTextColor={colors.subtle}
              selectionColor={colors.accent}
              style={[styles.input, { color: colors.ink }]}
              multiline
              accessibilityLabel="Comment text"
            />
            <PressableScale
              onPress={send}
              scale={0.9}
              disabled={!canSend}
              disabledOpacity={0.35}
              accessibilityRole="button"
              accessibilityLabel="Post comment"
              style={[styles.send, { backgroundColor: colors.accent }]}
            >
              <Icon name="send" size={17} color={colors.accentInk} weight="bold" />
            </PressableScale>
          </View>
        </View>
      }
    >
      {topLevel.length === 0 ? (
        <EmptyState icon="comment" title="No comments yet" body="Say something kind and specific." />
      ) : (
        topLevel.map((c) => (
          <CommentItem key={c.id} comment={c} replies={repliesByParent.get(c.id) ?? []} onReply={setReplyTo} />
        ))
      )}
    </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  comment: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  commentMeta: { fontFamily: fonts.body, fontSize: 13 },
  commentBody: { fontFamily: fonts.body, fontSize: 15, marginTop: 3, lineHeight: 21 },
  replyLink: { fontFamily: fonts.bodyBold, fontSize: 13, marginTop: 6 },
  reply: { flexDirection: 'row', gap: 8, marginTop: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderRadius: 24, paddingLeft: 16, paddingRight: 6, paddingVertical: 6 },
  replyToPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 8, marginLeft: 4 },
  replyToText: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15.5, minHeight: 36, maxHeight: 120, paddingVertical: 8 },
  send: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
