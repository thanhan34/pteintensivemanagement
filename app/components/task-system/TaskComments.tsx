'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { TaskComment } from '@/app/types/task-system';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/app/hooks/use-hydrated';

export default function TaskComments({
  comments,
  canComment,
  onSubmit,
}: {
  comments: TaskComment[];
  canComment: boolean;
  onSubmit: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const hydrated = useHydrated();

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Comments</h3>
        <span className="text-sm text-slate-500">{comments.length} item(s)</span>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-orange-100 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="font-medium text-slate-900">{comment.createdByName || 'User'}</div>
              <div className="text-xs text-slate-500">
                {hydrated
                  ? formatDistanceToNow(comment.createdAt, { addSuffix: true })
                  : comment.createdAt.toLocaleString('en-GB')}
              </div>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{comment.content}</div>
          </div>
        ))}

        {!comments.length && <div className="rounded-xl border border-dashed border-orange-200 p-6 text-center text-sm text-slate-500">No comments yet.</div>}
      </div>

      {canComment && (
        <div className="mt-6 space-y-3">
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a comment..." className="border-orange-100" />
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                if (!content.trim()) return;
                setSubmitting(true);
                try {
                  await onSubmit(content.trim());
                  setContent('');
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
              className="bg-[#fc5d01] text-white hover:bg-[#e55300]"
            >
              {submitting ? 'Posting...' : 'Add comment'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
