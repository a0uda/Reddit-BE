import { User } from '../db/models/User.js';
import { Community } from '../db/models/Community.js';
import { Comment } from '../db/models/Comment.js';
import { Post } from '../db/models/Post.js';

const mapMessageToFormat = async (message) => {
    let receiver_username = null;
    if (message.receiver_type === "user")
        receiver_username = await User.findOne({ _id: message.receiver_id }).select('username');
    else //reciever type is moderator 
        receiver_username = await Community.findOne({ _id: message.receiver_id }).select('name');

    let senderVia_name = null;
    if (message.sender_type === "moderator") {
        const community = await Community.findOne({ _id: message.sender_via_id }).select('name');
        senderVia_name = community.name;
    }
    const sender_username = await User.findOne({ _id: message.sender_id }).select('username');

    return {
        _id: message._id,
        sender_username: sender_username.username,
        sender_type: message.sender_type,
        receiver_username: receiver_username.name,
        receiver_type: message.receiver_type,
        senderVia: senderVia_name,
        message: message.message,
        created_at: message.created_at,
        deleted_at: message.deleted_at,
        unread_flag: message.unread_flag,
        isSent: true,
        isReply: !!message.parent_message_id,
        parentMessageId: message.parent_message_id,
        subject: message.subject
    };
};
const mapUserMentionsToFormat = async (userMentions, user) => {
    console.log("insise mapUserMentionsToFormat")

    const post = await Post.findOne({ _id: userMentions.post_id });

    const comment = await Comment.findOne({ _id: userMentions.comment_id }).select('created_at sender_username description upvotes_count downvotes_count downvote_users upvote_users');

    const postCreator = await User.findOne({ _id: post.user_id }).select('username');


    let postCreatorType = null;
    let rank;
    //check if user._id some of comment.upvoted_users 
    const upvoted = comment.upvote_users.includes(user._id);
    const downvoted = comment.downvote_users.includes(user._id);
    if (upvoted)
        rank = 1;
    else if (downvoted)
        rank = 0;
    else
        rank = -1;


    if (post.post_in_community_flag) {
        const community = await Community.findOne({ _id: post.community_id }).select('moderators');
        //check if post creator is in moderators 
        postCreatorType = community.moderators.includes(postCreator.username) ? "moderator" : "user";

    } else {
        postCreatorType = "user";
    }

    const mappedMessages = {
        created_at: comment.created_at,
        senderUsername: userMentions.sender_username,
        postCreator: postCreator.username,
        postCreatorType: postCreatorType,
        postSubject: post.title,
        replyContent: comment.description,
        _id: comment._id,
        unread: "true",
        commentsCount: post.comments_count,
        rank: rank,
        upvotes_count: comment.upvotes_count,
        downvotes_count: comment.downvotes_count,

    };

    console.log(mappedMessages)
    return mappedMessages;

}
const mapPostRepliesToFormat = async (post, user) => {

    //console.log("inside mapPostRepliesToFormat")
    const comment = await Comment.findOne({ post_id: post._id }).select('created_at sender_username description upvotes_count downvotes_count downvote_users upvote_users');
    if (comment) {


        // console.log("comment")
        // console.log(comment)
        const postCreator = user.username;
        let postCreatorType = null;
        let rank;
        //check if user._id some of comment.upvoted_users 
        const upvoted = comment.upvote_users.includes(user._id);
        const downvoted = comment.downvote_users.includes(user._id);
        if (upvoted)
            rank = 1;
        else if (downvoted)
            rank = 0;
        else
            rank = -1;


        if (post.post_in_community_flag) {
            const community = await Community.findOne({ _id: post.community_id }).select('moderators');
            //check if post creator is in moderators 
            postCreatorType = community.moderators.includes(postCreator.username) ? "moderator" : "user";

        } else {
            postCreatorType = "user";
        }

        const mappedMessages = {
            created_at: comment.created_at,
            senderUsername: user.username,
            postCreator: postCreator.username,
            postCreatorType: postCreatorType,
            postSubject: post.title,
            replyContent: comment.description,
            _id: comment._id,
            unread: "true",
            commentsCount: post.comments_count,
            rank: rank,
            upvotes_count: comment.upvotes_count,
            downvotes_count: comment.downvotes_count,
        };

        return mappedMessages;
    } else {
        return null;
    }


}

export { mapMessageToFormat, mapUserMentionsToFormat, mapPostRepliesToFormat };