/**
 * @module comments/services
 */

import mongoose from "mongoose";
/**
 * Middleware function to fetch and populate comments with voting and saved status for the current user.
 *
 * @param {Object} currentUser - The authenticated user object.
 * @param {Array} comments - An array of comments to be populated with user-specific voting and save status.
 *
 * @returns {Array} An array of comments with added attributes:
 *   - {Number} vote: Indicates the voting status of the current user on the comment (-1 for downvoted, 0 for neutral, 1 for upvoted).
 *   - {Boolean} saved: Indicates whether the comment is saved by the current user.
 *
 * @example
 * // Example usage of checkCommentVotesMiddleware function
 * const currentUser = {
 *   username: "john_doe",
 *   saved_comments_ids: ["comment1", "comment3"],
 * };
 * const comments = [
 *   { _id: "comment1", upvote_users: ["john_doe", "alice"], downvote_users: [] },
 *   { _id: "comment2", upvote_users: [], downvote_users: ["john_doe"] },
 *   { _id: "comment3", upvote_users: ["john_doe"], downvote_users: ["alice"] },
 * ];
 * const updatedComments = await checkCommentVotesMiddleware(currentUser, comments);
 * console.log(updatedComments);
 */
export async function checkCommentVotesMiddleware(currentUser, comments) {
  if (currentUser) {
    const username = currentUser.username;
    comments = comments.map((comment) => {
      // console.log(comment);
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
