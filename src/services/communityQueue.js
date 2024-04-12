import { Community } from "../db/models/Community.js";
import { DiscussionItemMinimal } from "../db/models/communityDiscussionItemMinimal.js";

// Mod Tools --> Queue --> (Moderated, Removed, Reported, Edited, Unmoderated) Pages.
// In each of these pages, the user can filter the discussion items by community and time.

// Testing Accounts:
// 1. Owner (SW-24-Reddit)
// 2. Moderator (Another-Moderator)
// 3. Member to post (Little-User-Tester)
// 4. Member to report (Viewer-User)
// 5. Member to test "Report by member" (Last-Check-Member)

// Test Case: I wrote 3 (Report, Remove, Mark as Spam) * 3 (By Owner, Moderator, Member) posts.

// Initially everyone was able to view all the posts.


// I then opened the Owner's account and took the actions listed above and observed their effects on the posts from the Owner and Member accounts.

// Mark as Spam - Owner --> The post was removed from the owner's community home page.
// Remove       - Owner --> The post was removed from the owner's community home page.
// Report       - Owner --> The post was still visible in the owner's community home page, 
//                          but a message related to the report reason was displayed inside the post itself 
//                          (e.g It's prompting hated based on indentity and vulnerability).

// Mark as Spam - Owner --> The post was removed from the Member's community home page.
// Remove       - Owner --> The post was removed from the Member's community home page.
// Report       - Owner --> The post was still visible in the Member's community home page (with no report messages).


// I then tried the same actions with the Member's account and observed the effect.

// Mark as Spam - Member --> Not an option.
// Remove       - Member --> Not an option.
// Report       - Member --> The post was removed from the Member's community home page.

// Mark as Spam - Member --> Not an option.
// Remove       - Member --> Not an option.
// Report       - Member --> The post was still visible in the Owner's community home page (with no report messages).

// Mark as Spam - Member --> Not an option.
// Remove       - Member --> Not an option.
// Report       - Member --> The post was still visible in the Other Members' community home pages (with no report messages).

// Mod Queue:
// Report by Owner

// Reported:
// Report by Owner

// Removed:
// Mark as Spam by Owner
// Remove by Owner

// Unmoderated:
// All 9 posts, but when a post is removed or marked as spam it is deleted from this page.
// Reported posts by the owner appear with their report messages.






const getRemovedDiscussionItems = async (community_name, time_filter, posts_or_comments) => {
    try {
      // Determine the sort order based on the time_filter
      const sortOrder = time_filter === 'Newest First' ? -1 : 1;
  
      // Determine the discussion item type based on posts_or_comments
      let itemType;
      if (posts_or_comments.toLowerCase() === 'posts and comments') {
        itemType = ['post', 'comment'];
      } else {
        itemType = posts_or_comments.toLowerCase();
      }
  
      // Initialize the query object
      let query = {
        marked_as_spam_by_a_moderator: true,
        discussion_item_type: { $in: itemType }
      };
  
      // If a specific community is specified, add it to the query
      if (community_name !== 'All Subreddits' && community_name != null) {
        const community = await Community.findOne({ name: community_name });
        query.written_in_community = community._id;
      }
  
      // Fetch the removed discussion items
      const removedDiscussionItems = await DiscussionItemMinimal.find(query).sort({ created_at: sortOrder });
  
      return removedDiscussionItems;
    } catch (error) {
      return { err: { status: 500, message: error.message } };
    }
  };
  
  const getEditedDiscussionItems = async (community_name, time_filter, posts_or_comments) => {
    try {
      // Determine the sort order based on the time_filter
      const sortOrder = time_filter === 'Newest First' ? -1 : 1;
  
      // Determine the discussion item type based on posts_or_comments
      let itemType;
      if (posts_or_comments.toLowerCase() === 'posts and comments') {
        itemType = ['post', 'comment'];
      } else {
        itemType = posts_or_comments.toLowerCase();
      }
  
      // Initialize the query object
      let query = {
        edited_flag: true,
        discussion_item_type: { $in: itemType }
      };
  
      // If a specific community is specified, add it to the query
      if (community_name !== 'All Subreddits' && community_name != null) {
        const community = await Community.findOne({ name: community_name });
        query.written_in_community = community._id;
      }
  
      // Fetch the edited discussion items
      const editedDiscussionItems = await DiscussionItemMinimal.find(query).sort({ created_at: sortOrder });
  
      return editedDiscussionItems;
    } catch (error) {
      return { err: { status: 500, message: error.message } };
    }
  };
  
  const getUnmoderatedDiscussionItems = async (community_name, time_filter) => {
    try {
      // Determine the sort order based on the time_filter
      const sortOrder = time_filter === 'Newest First' ? -1 : 1;
  
      // Initialize the query object
      let query = {
        unmoderated_flag: true,
      };
  
      // If a specific community is specified, add it to the query
      if (community_name !== 'All Subreddits' && community_name != null) {
        const community = await Community.findOne({ name: community_name });
        query.written_in_community = community._id;
      }
  
      // Fetch the unmoderated discussion items
      const unmoderatedDiscussionItems = await DiscussionItemMinimal.find(query).sort({ created_at: sortOrder });
  
      return unmoderatedDiscussionItems;
    } catch (error) {
      return { err: { status: 500, message: error.message } };
    }
  };

  export { getRemovedDiscussionItems, getEditedDiscussionItems, getUnmoderatedDiscussionItems };