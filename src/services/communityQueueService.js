import { Post } from '../db/models/Post.js';
import { Comment } from '../db/models/Comment.js';
import { Community } from '../db/models/Community.js';

// Mod Tools --> Queue --> (Moderated, Removed, Reported, Edited, Unmoderated) Pages.
// In each of these pages, the user can filter the discussion items by community and time.


////////////////////////////////////////////////////////////////////////// Getting Queue Items //////////////////////////////////////////////////////////////////////////
// This function fetches removed posts and comments from a specific community, sorted by creation date.
const getRemovedItems = async (community_name, time_filter, posts_or_comments) => {

  try {
    // Validate the input parameters. They should all be strings.
    if (typeof community_name !== 'string' || typeof time_filter !== 'string' || typeof posts_or_comments !== 'string') {
      return { err: { status: 400, message: 'Invalid input parameters' } };
    }

    // Validate the time_filter parameter. It should be either 'newest first' or 'oldest first'.
    if (!['newest first', 'oldest first'].includes(time_filter.toLowerCase())) {
      return { err: { status: 400, message: 'Invalid time filter' } };
    }

    // Validate the posts_or_comments parameter. It should be either 'posts', 'comments', or 'posts and comments'.
    if (!['posts', 'comments', 'posts and comments'].includes(posts_or_comments.toLowerCase())) {
      return { err: { status: 400, message: 'Invalid posts or comments value' } };
    }

    // Determine the sort order based on the time_filter. If it's 'Newest First', sort in descending order (-1). Otherwise, sort in ascending order (1).
    const sortOrder = time_filter === 'Newest First' ? -1 : 1;

    // Initialize the query object. This will be used to fetch the posts and comments.
    let query = {
      // Approved, Removed, Spammed, Reported.
      $or: [
        {
          // Cas 1: The item went from unmoderated to removed.
          'moderator_details.removed_flag': true,

          'moderator_details.approved_flag': false,
          'moderator_details.spammed_flag': false,
          'moderator_details.reported_flag': false
        },
        {
          // Case 2: The item went from approved to removed.
          'moderator_details.removed_flag': true,
          'moderator_details.approved_flag': true,
          'moderator_details.spammed_flag': false,
          'moderator_details.reported_flag': false,
          $expr: { $lt: ["$moderator_details.approved_date", "$moderator_details.removed_date"] }
        },
        {
          // Case 3: The item went from unmoderated to spammed.
          'moderator_details.spammed_flag': true,

          'moderator_details.approved_flag': false,
          'moderator_details.removed_flag': false,
          'moderator_details.reported_flag': false
        },
        {
          // Case 4: The item went from approved to spammed.
          'moderator_details.spammed_flag': true,

          'moderator_details.approved_flag': true,
          'moderator_details.removed_flag': false,
          'moderator_details.reported_flag': false,
          $expr: { $lt: ["$moderator_details.approved_date", "$moderator_details.spammed_date"] }
        },
        {
          // Case 5: The item went from reported to removed.
          'moderator_details.removed_flag': true,

          'moderator_details.approved_flag': false,
          'moderator_details.spammed_flag': false,
          'moderator_details.reported_flag': true,
          $expr: { $lt: ["$moderator_details.reported_date", "$moderator_details.removed_date"] }
        }
      ]
    };

    // If a specific community is specified, add it to the query. This will fetch posts and comments from that community only.
    if (community_name !== 'All Subreddits' && community_name != null) {
      query.community_name = community_name;
    }

    let [removedPosts, removedComments] = await Promise.all([
      (posts_or_comments.toLowerCase() === 'posts' || posts_or_comments.toLowerCase() === 'posts and comments') ? Post.find(query).sort({ created_at: sortOrder }) : [],
      (posts_or_comments.toLowerCase() === 'comments' || posts_or_comments.toLowerCase() === 'posts and comments') ? Comment.find(query).sort({ created_at: sortOrder }) : []
    ]);

    // Merge and sort the posts and comments. This will create a single array of posts and comments, sorted by creation date.
    let removedItems = [...removedPosts, ...removedComments];
    removedItems.sort((a, b) => sortOrder * (new Date(a.created_at) - new Date(b.created_at)));

    // Return the sorted array of removed posts and comments.
    return { removedItems };

  } catch (error) {
    // If an error occurs, return an error object with the status code and message.
    return { err: { status: 500, message: error.message } };
  }
};

// This function fetches reported posts and comments from a specific community, sorted by creation date.
const getReportedItems = async (community_name, time_filter, posts_or_comments) => {
  try {
    // Validate the input parameters. They should all be strings.
    if (typeof community_name !== 'string' || typeof time_filter !== 'string' || typeof posts_or_comments !== 'string') {
      return { err: { status: 400, message: 'Invalid input parameters' } };
    }

    // Validate the time_filter parameter. It should be either 'newest first' or 'oldest first'.
    if (!['newest first', 'oldest first'].includes(time_filter.toLowerCase())) {
      return { err: { status: 400, message: 'Invalid time filter' } };
    }

    // Validate the posts_or_comments parameter. It should be either 'posts', 'comments', or 'posts and comments'.
    if (!['posts', 'comments', 'posts and comments'].includes(posts_or_comments.toLowerCase())) {
      return { err: { status: 400, message: 'Invalid posts or comments value' } };
    }

    // Determine the sort order based on the time_filter. If it's 'Newest First', sort in descending order (-1). Otherwise, sort in ascending order (1).
    const sortOrder = time_filter === 'Newest First' ? -1 : 1;

    // Initialize the query object. This will be used to fetch the posts and comments.
    let query = {
      // No need to check for the spammed flag as a post could never be spammed and reported.
      $or: [
        {
          // Case 1: The item went from unmoderated to reported.
          'moderator_details.reported_flag': true,

          'moderator_details.approved_flag': false,
          'moderator_details.removed_flag': false,
        },
        {
          // Case 2: The item went from approved to reported.
          'moderator_details.reported_flag': true,

          'moderator_details.approved_flag': true,
          'moderator_details.removed_flag': false,
          $expr: { $lt: ["$moderator_details.approved_date", "$moderator_details.reported_date"] }

        }
      ]
    };

    // If a specific community is specified, add it to the query. This will fetch posts and comments from that community only.
    if (community_name !== 'All Subreddits' && community_name != null) {
      query.community_name = community_name;
    }

    let [reportedPosts, reportedComments] = await Promise.all([
      (posts_or_comments.toLowerCase() === 'posts' || posts_or_comments.toLowerCase() === 'posts and comments') ? Post.find(query).sort({ created_at: sortOrder }) : [],
      (posts_or_comments.toLowerCase() === 'comments' || posts_or_comments.toLowerCase() === 'posts and comments') ? Comment.find(query).sort({ created_at: sortOrder }) : []
    ]);

    // Merge and sort the posts and comments. This will create a single array of posts and comments, sorted by creation date.
    let reportedItems = [...reportedPosts, ...reportedComments];
    reportedItems.sort((a, b) => sortOrder * (new Date(a.created_at) - new Date(b.created_at)));

    // Return the sorted array of reported posts and comments.
    return { reportedItems };

  } catch (error) {
    // If an error occurs, return an error object with the status code and message.
    return { err: { status: 500, message: error.message } };
  }
};

// This function fetches unmoderated posts and comments from a specific community, sorted by creation date.
const getUnmoderatedItems = async (community_name, time_filter, posts_or_comments) => {
  try {
    // Validate the input parameters. They should all be strings.
    if (typeof community_name !== 'string' || typeof time_filter !== 'string' || typeof posts_or_comments !== 'string') {
      return { err: { status: 400, message: 'Invalid input parameters' } };
    }

    // Validate the time_filter parameter. It should be either 'newest first' or 'oldest first'.
    if (!['newest first', 'oldest first'].includes(time_filter.toLowerCase())) {
      return { err: { status: 400, message: 'Invalid time filter' } };
    }

    // Validate the posts_or_comments parameter. It should be either 'posts', 'comments', or 'posts and comments'.
    if (!['posts', 'comments', 'posts and comments'].includes(posts_or_comments.toLowerCase())) {
      return { err: { status: 400, message: 'Invalid posts or comments value' } };
    }

    // Determine the sort order based on the time_filter. If it's 'Newest First', sort in descending order (-1). Otherwise, sort in ascending order (1).
    const sortOrder = time_filter === 'Newest First' ? -1 : 1;

    // Initialize the query object. This will be used to fetch the posts and comments.
    let query = {
      $and: [
        { 'moderator_details.approved_flag': false },
        { 'moderator_details.removed_flag': false },
        { 'moderator_details.spammed_flag': false },
        { 'moderator_details.reported_flag': false }
      ]
    };

    // If a specific community is specified, add it to the query. This will fetch posts and comments from that community only.
    if (community_name !== 'All Subreddits' && community_name != null) {
      query.community_name = community_name;
    }

    let [unmoderatedPosts, unmoderatedComments] = await Promise.all([
      (posts_or_comments.toLowerCase() === 'posts' || posts_or_comments.toLowerCase() === 'posts and comments') ? Post.find(query).sort({ created_at: sortOrder }) : [],
      (posts_or_comments.toLowerCase() === 'comments' || posts_or_comments.toLowerCase() === 'posts and comments') ? Comment.find(query).sort({ created_at: sortOrder }) : []
    ]);

    // Merge and sort the posts and comments. This will create a single array of posts and comments, sorted by creation date.
    let unmoderatedItems = [...unmoderatedPosts, ...unmoderatedComments];
    unmoderatedItems.sort((a, b) => sortOrder * (new Date(a.created_at) - new Date(b.created_at)));

    // Return the sorted array of unmoderated posts and comments.
    return { unmoderatedItems };

  } catch (error) {
    // If an error occurs, return an error object with the status code and message.
    return { err: { status: 500, message: error.message } };
  }
};

//////////////////////////////////////////////////////////////////////////// Buttons/Actions ////////////////////////////////////////////////////////////////////////////

const removeItem = async (item_id, item_type, removed_by, removed_removal_reason = null) => {
  try {
    // Validate the input parameters. They should be strings.
    if (typeof item_id !== 'string' || typeof item_type !== 'string') {
      return { err: { status: 400, message: 'Invalid input parameters' } };
    }

    // Validate that the input is either 'post' or 'comment'.
    if (!['post', 'comment'].includes(item_type.toLowerCase())) {
      return { err: { status: 400, message: 'Invalid item type' } };
    }

    // Validate that the post or comment exists in the database.
    if (item_type.toLowerCase() === 'post') {
      const post = await Post.findById(item_id);
      if (!post) {
        return { err: { status: 404, message: 'Post not found' } };
      }
      if (post.moderator_details.removed_flag) {
        return { err: { status: 400, message: 'Post already removed' } };
      }
    }
    if (item_type.toLowerCase() === 'comment') {
      const comment = await Comment.findById(item_id);
      if (!comment) {
        return { err: { status: 404, message: 'Comment not found' } };
      }
      if (comment.moderator_details.removed_flag) {
        return { err: { status: 400, message: 'Comment already removed' } };
      }
    }

    // If a removal reason is provided, validate that it is a valid removal reason title.
    if (removed_removal_reason) {
      const community = await Community.findOne({ 'removal_reasons.removal_reason_title': removed_removal_reason });
      if (!community) {
        return { err: { status: 400, message: 'Invalid removal reason' } };
      }
    }

    // If the item type is 'post', remove the post.
    if (item_type.toLowerCase() === 'post') {
      await Post.findByIdAndUpdate(item_id, {
        'moderator_details.removed_flag': true,
        'moderator_details.removed_by': removed_by,
        'moderator_details.removed_date': new Date(),
        'moderator_details.removed_removal_reason': removed_removal_reason
      });
    }

    // If the item type is 'comment', remove the comment.
    if (item_type.toLowerCase() === 'comment') {
      await Comment.findByIdAndUpdate(item_id, {
        'moderator_details.removed_flag': true,
        'moderator_details.removed_by': removed_by,
        'moderator_details.removed_date': new Date(),
        'moderator_details.removed_removal_reason': removed_removal_reason
      });
    }

    // Return a success message.
    return { message: 'Item removed successfully' };
  } catch (error) {
    // If an error occurs, return an error object with the status code and message.
    return { err: { status: 500, message: error.message } };
  }
}

const spamItem = async (item_id, item_type, spammed_by, spammed_removal_reason = null) => {
  try {
    // Validate the input parameters. They should be strings.
    if (typeof item_id !== 'string' || typeof item_type !== 'string') {
      return { err: { status: 400, message: 'Invalid input parameters' } };
    }

    // Validate that the input is either 'post' or 'comment'.
    if (!['post', 'comment'].includes(item_type.toLowerCase())) {
      return { err: { status: 400, message: 'Invalid item type' } };
    }

    // Validate that the post or comment exists in the database.
    if (item_type.toLowerCase() === 'post') {
      const post = await Post.findById(item_id);
      if (!post) {
        return { err: { status: 404, message: 'Post not found' } };
      }
      if (post.moderator_details.spammed_flag) {
        return { err: { status: 400, message: 'Post already marked as spam' } };
      }
    }
    if (item_type.toLowerCase() === 'comment') {
      const comment = await Comment.findById(item_id);
      if (!comment) {
        return { err: { status: 404, message: 'Comment not found' } };
      }
      if (comment.moderator_details.spammed_flag) {
        return { err: { status: 400, message: 'Comment already marked as spam' } };
      }
    }

    // If a removal reason is provided, validate that it is a valid removal reason title.
    if (spammed_removal_reason) {
      const community = await Community.findOne({ 'removal_reasons.removal_reason_title': spammed_removal_reason });
      if (!community) {
        return { err: { status: 400, message: 'Invalid removal reason' } };
      }
    }

    const flagsCount = ['reported_flag'].filter(flag => item.moderator_details[flag]).length;

    // Check if the current approved_count is less than (n + 1).
    if (item.moderator_details.approved_count >= flagsCount + 1) {
      return { err: { status: 400, message: 'The item has been removed the maximum number of times. You can only approve posts that are in one of the Queues, removed, reported, and unmoderated.' } };
    }


    // If the item type is 'post', remove the post.
    if (item_type.toLowerCase() === 'post') {
      await Post.findByIdAndUpdate(item_id, {
        'moderator_details.spammed_flag': true,
        'moderator_details.spammed_by': spammed_by,
        'moderator_details.spammed_date': new Date(),
        'moderator_details.spammed_removal_reason': spammed_removal_reason
      });
    }

    // If the item type is 'comment', remove the comment.
    if (item_type.toLowerCase() === 'comment') {
      await Comment.findByIdAndUpdate(item_id, {
        'moderator_details.spammed_flag': true,
        'moderator_details.spammed_by': spammed_by,
        'moderator_details.spammed_date': new Date(),
        'moderator_details.spammed_removal_reason': spammed_removal_reason
      });
    }

    // Return a success message.
    return { message: 'Item marked as spam successfully' };
  } catch (error) {
    // If an error occurs, return an error object with the status code and message.
    return { err: { status: 500, message: error.message } };
  }
}

const reportItem = async (item_id, item_type, reported_by) => {
  try {
    // Validate the input parameters. They should be strings.
    if (typeof item_id !== 'string' || typeof item_type !== 'string') {
      return { err: { status: 400, message: 'Invalid input parameters' } };
    }

    // Validate that the input is either 'post' or 'comment'.
    if (!['post', 'comment'].includes(item_type.toLowerCase())) {
      return { err: { status: 400, message: 'Invalid item type' } };
    }

    // Validate that the post or comment exists in the database.
    if (item_type.toLowerCase() === 'post') {
      const post = await Post.findById(item_id);
      if (!post) {
        return { err: { status: 404, message: 'Post not found' } };
      }
      if (post.moderator_details.reported_flag) {
        return { err: { status: 400, message: 'Post already reported' } };
      }
    }
    if (item_type.toLowerCase() === 'comment') {
      const comment = await Comment.findById(item_id);
      if (!comment) {
        return { err: { status: 404, message: 'Comment not found' } };
      }
      if (comment.moderator_details.reported_flag) {
        return { err: { status: 400, message: 'Comment already reported' } };
      }
    }

    // If the item type is 'post', report the post.
    if (item_type.toLowerCase() === 'post') {
      await Post.findByIdAndUpdate(item_id, {
        'moderator_details.reported_flag': true,
        'moderator_details.reported_by': reported_by,
        'moderator_details.reported_date': new Date()
      });
    }

    // If the item type is 'comment', report the comment.
    if (item_type.toLowerCase() === 'comment') {
      await Comment.findByIdAndUpdate(item_id, {
        'moderator_details.reported_flag': true,
        'moderator_details.reported_by': reported_by,
        'moderator_details.reported_date': new Date()
      });
    }

    // Return a success message.
    return { message: 'Item reported successfully' };
  } catch (error) {
    // If an error occurs, return an error object with the status code and message.
    return { err: { status: 500, message: error.message } };
  }
}

const approveItem = async (item_id, item_type, approved_by) => {
  try {
    // Validate the input parameters. They should be strings.
    if (typeof item_id !== 'string' || typeof item_type !== 'string') {
      return { err: { status: 400, message: 'Invalid input parameters' } };
    }

    // Validate that the input is either 'post' or 'comment'.
    if (!['post', 'comment'].includes(item_type.toLowerCase())) {
      return { err: { status: 400, message: 'Invalid item type' } };
    }

    let item;
    // Validate that the post or comment exists in the database.
    if (item_type.toLowerCase() === 'post') {
      item = await Post.findById(item_id);
      if (!item) {
        return { err: { status: 404, message: 'Post not found' } };
      }
    }
    if (item_type.toLowerCase() === 'comment') {
      item = await Comment.findById(item_id);
      if (!item) {
        return { err: { status: 404, message: 'Comment not found' } };
      }
    }

    // Count the number of flags (other than approve) that are set to true.
    const flagsCount = ['removed_flag', 'spammed_flag', 'reported_flag'].filter(flag => item.moderator_details[flag]).length;

    // Check if the current approved_count is less than (n + 1).
    if (item.moderator_details.approved_count >= flagsCount + 1) {
      return { err: { status: 400, message: 'The item has been approved the maximum number of times. You can only approve posts that are in one of the Queues, removed, reported, and unmoderated.' } };
    }

    // If the item type is 'post', approve the post.
    if (item_type.toLowerCase() === 'post') {
      await Post.findByIdAndUpdate(item_id, {
        'moderator_details.approved_flag': true,
        'moderator_details.approved_by': approved_by,
        'moderator_details.approved_date': new Date(),
        $inc: { 'moderator_details.approved_count': 1 }
      });
    }

    // If the item type is 'comment', approve the comment.
    if (item_type.toLowerCase() === 'comment') {
      await Comment.findByIdAndUpdate(item_id, {
        'moderator_details.approved_flag': true,
        'moderator_details.approved_by': approved_by,
        'moderator_details.approved_date': new Date(),
        $inc: { 'moderator_details.approved_count': 1 }
      });
    }

    // Return a success message.
    return { message: 'Item approved successfully' };
  } catch (error) {
    // If an error occurs, return an error object with the status code and message.
    return { err: { status: 500, message: error.message } };
  }
}

/////////////////////////////////////////////////////////////////////////////////// New Phase 3 Endpoints ///////////////////////////////////////////////////////////////////////////////////

const editItem = async (item_id, item_type, new_content, editing_user) => {
  try {

    // Validate that the new_content is provided and of type string.
    if (typeof new_content !== 'string') {
      return { err: { status: 400, message: 'Invalid new content' } };
    }

    // Validate the the editting user is the same as the user who created the post or comment.

    // If the item type is 'post', edit the post.
    if (item_type.toLowerCase() === 'post') {
      try {
        // Validate that the post exists in the database.
        const post = await Post.findById(item_id)
        if (!post) {
          return { err: { status: 404, message: 'Post not found' } };
        }
        if (post.username !== editing_user.username) {
          return { err: { status: 403, message: 'Access denied. You must be the author of the post to edit it.' } };
        }
        // Update the post with the new content and add a new entry to the edit history
        await Post.findByIdAndUpdate(item_id, {
          description: new_content,
          $push: {
            'moderator_details.edit_history': {
              edited_at: new Date(),
            }
          }
        });
      } catch (error) {
        return { err: { status: 500, message: error.message } };
      }
    }

    // If the item type is 'comment', edit the comment.
    if (item_type.toLowerCase() === 'comment') {
      try {
        // Validate that the comment exists in the database.
        const comment = await Comment.findById(item_id)
        if (!comment) {
          return { err: { status: 404, message: 'Comment not found' } };
        }
        if (comment.username !== editing_user.username) {
          return { err: { status: 403, message: 'Access denied. You must be the author of the comment to edit it.' } };
        }
        if (comment.moderator_details.removed_flag) {
          return { err: { status: 400, message: 'Comment already removed' } };
        }

        // Update the comment with the new content and add a new entry to the edit history
        await Comment.findByIdAndUpdate(item_id, {
          description: new_content,
          $push: {
            'moderator_details.edit_history': {
              edited_at: new Date(),
            }
          }
        });
      } catch (error) {
        return { err: { status: 500, message: error.message } };
      }
    }

    // Return a success message.
    return { message: 'Item edited successfully' };
  } catch (error) {
    // If an error occurs, return an error object with the status code and message.
    return { err: { status: 500, message: error.message } };
  }
}

const getEditedItems = async (community_name, time_filter, posts_or_comments) => {
  try {
    // Determine the sort order based on the time_filter. If it's 'Newest First', sort in descending order (-1). Otherwise, sort in ascending order (1).
    const sortOrder = time_filter === 'Newest First' ? -1 : 1;

    // Initialize the query object. This will be used to fetch the posts and comments.

    // This query uses the $expr operator to perform a query on the edit_history array. 
    // The $let operator is used to define a variable lastEdit that represents the last element in the edit_history array. 
    // The $arrayElemAt operator is used to get the last element in the array. 
    // The query then checks if both approved_edit_flag and removed_edit_flag of the last edit are false. 
    // If they are, the document matches the query.
    let query = {
      $expr: {
        $let: {
          vars: {
            lastEdit: { $arrayElemAt: ['$moderator_details.edit_history', -1] }
          },
          in: {
            $and: [
              { $eq: ['$$lastEdit.approved_edit_flag', false] },
              { $eq: ['$$lastEdit.removed_edit_flag', false] }
            ]
          }
        }
      }
    };

    // If a specific community is specified, add it to the query. This will fetch posts and comments from that community only.
    if (community_name !== 'All Subreddits' && community_name != null) {
      query.community_name = community_name;
    }

    let [editedPosts, editedComments] = await Promise.all([
      (posts_or_comments.toLowerCase() === 'posts' || posts_or_comments.toLowerCase() === 'posts and comments') ? Post.find(query).sort({ created_at: sortOrder }) : [],
      (posts_or_comments.toLowerCase() === 'comments' || posts_or_comments.toLowerCase() === 'posts and comments') ? Comment.find(query).sort({ created_at: sortOrder }) : []
    ]);

    // Merge and sort the posts and comments. This will create a single array of posts and comments, sorted by creation date.
    let editedItems = [...editedPosts, ...editedComments];
    editedItems.sort((a, b) => sortOrder * (new Date(a.created_at) - new Date(b.created_at)));

    // Return the sorted array of edited posts and comments.
    return { editedItems };

  } catch (error) {
    // If an error occurs, return an error object with the status code and message.
    return { err: { status: 500, message: error.message } };
  }
}

// Check if the last elemnt in the edit_history array has approved_edit_flag set to false and removed_edit_flag set to false
// If so, set approved_edit_flag to true
const approveEdit = async (item_id, item_type) => {
  // Determine the model based on the item_type
  const Model = item_type === 'post' ? Post : Comment;

  let item;
  try {
    // Fetch the item
    item = await Model.findById(item_id);

    // Check if the item exists
    if (!item) {
      return { err: { status: 404, message: 'Item not found' } };
    }
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }

  // Get the last edit
  const lastEdit = item.moderator_details.edit_history[item.moderator_details.edit_history.length - 1];

  // Check if the last edit is not approved and not removed
  if (lastEdit && !lastEdit.approved_edit_flag && !lastEdit.removed_edit_flag) {
    // Approve the last edit
    lastEdit.approved_edit_flag = true;

    try {
      // Save the item
      await item.save();
    } catch (error) {
      return { err: { status: 500, message: `Error while saving the item after approving its edit: ${error.message}` } };
    }

  } else {
    return { err: { status: 400, message: 'The last edit is already approved or removed' } };
  } 
  
  return { message: 'Edit approved successfully' };

};

const removeEdit = async (item_id, item_type) => {
  // Determine the model based on the item_type
  const Model = item_type === 'post' ? Post : Comment;

  let item;
  try {
    // Fetch the item
    item = await Model.findById(item_id);

    // Check if the item exists
    if (!item) {
      return { err: { status: 404, message: 'Item not found' } };
    }
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }

  // Get the last edit
  const lastEdit = item.moderator_details.edit_history[item.moderator_details.edit_history.length - 1];

  // Check if the last edit is not approved and not removed
  if (lastEdit && !lastEdit.approved_edit_flag && !lastEdit.removed_edit_flag) {
    // Approve the last edit
    lastEdit.removed_edit_flag = true;

    try {
      // Save the item
      await item.save();
    } catch (error) {
      return { err: { status: 500, message: `Error while saving the item after removing its edit: ${error.message}` } };
    }

  } else {
    return { err: { status: 400, message: 'The last edit is already approved or removed' } };
  } 
  
  return { message: 'Edit removed successfully' };

};




export {
  getRemovedItems,
  getReportedItems,
  getUnmoderatedItems,
  getEditedItems,

  removeItem,
  spamItem,
  reportItem,
  approveItem,
  editItem,
  approveEdit,
  removeEdit
};