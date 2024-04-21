export async function checkCommentVotesMiddleware(currentUser, comments) {
  const username = currentUser.username;
  comments = comments.map((comment) => {
    const isUpvoted = username && comment.upvote_users.includes(username);
    const isDownvoted = username && comment.downvote_users.includes(username);
    var vote = 0;
    if (isUpvoted) vote = 1;
    else if (isDownvoted) vote = -1;
    return { ...comment.toObject(), vote };
  });
  // console.log(comments);
  return comments;
}
