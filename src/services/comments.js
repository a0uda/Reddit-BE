import mongoose from "mongoose";

export async function checkCommentVotesMiddleware(currentUser, comments) {
  if (currentUser) {
    const username = currentUser.username;
    comments = comments.map((comment) => {
      const isUpvoted = comment.upvote_users.includes(username);
      const isDownvoted = comment.downvote_users.includes(username);
      var vote = 0;
      if (isUpvoted) vote = 1;
      else if (isDownvoted) vote = -1;

      const saved = currentUser.saved_comments_ids.includes(
        comment._id.toString()
      );
      if (comment instanceof mongoose.Document)
        return { ...comment.toObject(), vote, saved };
      else return { ...comment, vote, saved };
    });
    // console.log(comments);
    return comments;
  }
  return comments;
}
