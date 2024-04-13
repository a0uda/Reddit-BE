import {Post} from '../db/models/Post.js';
import {Comment} from '../db/models/Comment.js';
import {Community} from '../db/models/Community.js';

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
        $or: [
          { 'moderator_details.removed_flag': true },
          { 'moderator_details.spammed_flag': true }
        ]
      };
  
      // If a specific community is specified, add it to the query. This will fetch posts and comments from that community only.
      if (community_name !== 'All Subreddits' && community_name != null) {
        query.community_name = community_name;
      }
  
      let removedPosts = [];
      let removedComments = [];

      // Fetch the removed posts if 'posts' or 'posts and comments' is specified.
      if (posts_or_comments.toLowerCase() === 'posts' || posts_or_comments.toLowerCase() === 'posts and comments') {
        removedPosts = await Post.find(query).sort({ created_at: sortOrder });
      }

      // Fetch the removed comments if 'comments' or 'posts and comments' is specified.
      if (posts_or_comments.toLowerCase() === 'comments' || posts_or_comments.toLowerCase() === 'posts and comments') {
        removedComments = await Comment.find(query).sort({ created_at: sortOrder });
      }
  
      // Merge and sort the posts and comments. This will create a single array of posts and comments, sorted by creation date.
      let removedItems = [...removedPosts, ...removedComments];
      removedItems.sort((a, b) => sortOrder * (new Date(a.created_at) - new Date(b.created_at)));
  
      // Return the sorted array of removed posts and comments.
      return {removedItems};
      
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
      $and: [
        {'moderator_details.reported_flag': true},
        {'moderator_details.removed_flag': false}
      ]
    };

    // If a specific community is specified, add it to the query. This will fetch posts and comments from that community only.
    if (community_name !== 'All Subreddits' && community_name != null) {
      query.community_name = community_name;
    }

    let reportedPosts = [];
    let reportedComments = [];

    // Fetch the reported posts if 'posts' or 'posts and comments' is specified.
    if (posts_or_comments.toLowerCase() === 'posts' || posts_or_comments.toLowerCase() === 'posts and comments') {
      reportedPosts = await Post.find(query).sort({ created_at: sortOrder });
    }

    // Fetch the reported comments if 'comments' or 'posts and comments' is specified.
    if (posts_or_comments.toLowerCase() === 'comments' || posts_or_comments.toLowerCase() === 'posts and comments') {
      reportedComments = await Comment.find(query).sort({ created_at: sortOrder });
    }

    // Merge and sort the posts and comments. This will create a single array of posts and comments, sorted by creation date.
    let reportedItems = [...reportedPosts, ...reportedComments];
    reportedItems.sort((a, b) => sortOrder * (new Date(a.created_at) - new Date(b.created_at)));
    
    // Return the sorted array of reported posts and comments.
    return {reportedItems};
    
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
      {'moderator_details.approved_flag': false},
      {'moderator_details.removed_flag': false},
      {'moderator_details.spammed_flag': false}
      ]
    };

    // If a specific community is specified, add it to the query. This will fetch posts and comments from that community only.
    if (community_name !== 'All Subreddits' && community_name != null) {
      query.community_name = community_name;
    }

    let unmoderatedPosts = [];
    let unmoderatedComments = [];

    // Fetch the unmoderated posts if 'posts' or 'posts and comments' is specified.
    if (posts_or_comments.toLowerCase() === 'posts' || posts_or_comments.toLowerCase() === 'posts and comments') {
      unmoderatedPosts = await Post.find(query).sort({ created_at: sortOrder });
    }

    // Fetch the unmoderated comments if 'comments' or 'posts and comments' is specified.
    if (posts_or_comments.toLowerCase() === 'comments' || posts_or_comments.toLowerCase() === 'posts and comments') {
      unmoderatedComments = await Comment.find(query).sort({ created_at: sortOrder });
    }

    // Merge and sort the posts and comments. This will create a single array of posts and comments, sorted by creation date.
    let unmoderatedItems = [...unmoderatedPosts, ...unmoderatedComments];
    unmoderatedItems.sort((a, b) => sortOrder * (new Date(a.created_at) - new Date(b.created_at)));

    // Return the sorted array of unmoderated posts and comments.
    return {unmoderatedItems};
    
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
    }
    if (item_type.toLowerCase() === 'comment') {
      const comment = await Comment.findById(item_id);
      if (!comment) {
        return { err: { status: 404, message: 'Comment not found' } };
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



export { 
  getRemovedItems, 
  getReportedItems, 
  getUnmoderatedItems,

  removeItem,
};