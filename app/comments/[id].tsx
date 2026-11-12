import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
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

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Comments</Text>
        <Button title="Close" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>

      {topLevel.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>No comments yet. Say something kind and specific.</Text>
      ) : (
        topLevel.map((c) => (
          <CommentItem key={c.id} comment={c} replies={repliesByParent.get(c.id) ?? []} onReply={setReplyTo} />
        ))
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputRow, { borderColor: colors.line, backgroundColor: colors.surface }]}>
          {replyTo ? (
            <Pressable onPress={() => setReplyTo(null)} style={styles.replyToPill}>
              <Text style={[styles.replyToText, { color: colors.muted }]}>Replying to {replyTo.authorName} ✕</Text>
            </Pressable>
          ) : null}
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={replyTo ? `Reply to ${replyTo.authorName}…` : 'Add a comment…'}
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.ink }]}
            multiline
            accessibilityLabel="Comment text"
          />
          <Button title="Post" size="sm" onPress={send} disabled={!body.trim() || addComment.isPending} loading={addComment.isPending} />
        </View>
      </KeyboardAvoidingView>
      <View style={{ height: 20 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 22 },
  empty: { fontFamily: fonts.body, fontSize: 15, textAlign: 'center', marginTop: 30 },
  comment: { flexDirection: 'row', gap: 10, paddingVertical: 12 },
  commentMeta: { fontFamily: fonts.body, fontSize: 13 },
  commentBody: { fontFamily: fonts.body, fontSize: 15, marginTop: 3, lineHeight: 21 },
  replyLink: { fontFamily: fonts.bodyBold, fontSize: 13, marginTop: 6 },
  reply: { flexDirection: 'row', gap: 8, marginTop: 10 },
  inputRow: { borderWidth: 1, borderRadius: 16, padding: 10, marginTop: 8, gap: 8 },
  replyToPill: { alignSelf: 'flex-start' },
  replyToText: { fontFamily: fonts.body, fontSize: 12.5 },
  input: { fontFamily: fonts.body, fontSize: 15, minHeight: 38, maxHeight: 120 },
});
