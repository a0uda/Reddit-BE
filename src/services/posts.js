import { Comment } from "../db/models/Comment.js";

export async function getPostCommentsHelper(postId) {
  const comments = await Comment.find({ post_id: postId }).exec();
  if (!comments || comments.length === 0) return [];
  const commentsWithReplies = [];
  for (const comment of comments) {
    const replies = comment.replies_comments_ids;
    comment.replies_comments_ids = [];
    for (const reply of replies) {
      const replyObject = await Comment.findById(reply);
      comment.replies_comments_ids.push(replyObject);
    }
    commentsWithReplies.push(comment);
  }
  return commentsWithReplies;
}
