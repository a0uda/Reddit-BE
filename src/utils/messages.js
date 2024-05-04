import { User } from '../db/models/User.js';
import { Community } from '../db/models/Community.js';
import { Comment } from '../db/models/Comment.js';
import { Post } from '../db/models/Post.js';

const mapMessageToFormat = async (message, user, which_function) => {
    let receiver_username = null;
    if (message.receiver_type === "user") {
        const receiver = await User.findOne({ _id: message.receiver_id })
        if (!receiver) {
            return null;

        }
        receiver_username = receiver.username;


    }
    else //reciever type is moderator here is the bug 
    {
        console.log("message", message)
        const community = await Community.findOne({ _id: message.receiver_id }).select('name')
        console.log("community", community)
        receiver_username = community.name;


    }


    let senderVia_name = null;
    if (message.sender_type === "moderator") {
        const community = await Community.findOne({ _id: message.sender_via_id }).select('name');
        if (!community) {
            return null;
        }
        senderVia_name = community.name;
    }
    //this part is not tested 
    let isSent = message.sender_id.toString() === user._id.toString() ? true : false;


    //if the message is recieved by the user and the function is getUserSentMessages
    // remove all read messages and messages from blocked users and mjuted communities
    const blockedUsers = user.safety_and_privacy_settings.blocked_users.map(
        (user) => user.id
    );

    const muted_communities = user.safety_and_privacy_settings.muted_communities.map(
        (user) => user.id
    );
    //
    console.log("blockedUsers", blockedUsers);
    console.log("muted_communities", muted_communities);

    if (which_function === "getUserUnreadMessages" && (!isSent) && (message.unread_flag === false ||
        (blockedUsers.includes(message.sender_id) ||
            (message.sender_type === "moderator" && muted_communities.includes(message.sender_via_id)))
    )) return null;
    //if the message is sent by the user and the function is getUserUnreadMessages
    // remove all messages from blocked users and muted communities  
    if (which_function === "getAllMessages" && (!isSent) && (
        (blockedUsers.includes(message.sender_id) ||
            (message.sender_type === "moderator" && muted_communities.includes(message.sender_via_id)))
    )) return null;
    //filter deleted messages
    //TODO: UNCOMMENT THIS WHEN SEEDING IS DONE  if ((!isSent && message.receiver_deleted_at !== null) || (isSent && message.sender_deleted_at !== null)) return null;
    const sender = await User.findOne({ _id: message.sender_id });
    if (!sender) {
        return null;
    }
    return {
        _id: message._id,
        sender_username: sender.username,
        sender_type: message.sender_type,
        receiver_username,
        receiver_type: message.receiver_type,
        senderVia: senderVia_name,
        message: message.message,
        created_at: message.created_at,
        deleted_at: isSent ? message.sender_deleted_at : message.receiver_deleted_at,
        unread_flag: message.unread_flag,
        isSent: isSent,
        parentMessageId: message.parent_message_id,
        subject: message.subject,
        isReply: message.parent_message_id ? true : false,
        is_username_mention: false,
        is_invitation: message.is_invitation

    }
}

const mapUserMentionsToFormat = async (userMentions, user) => {

    const post = await Post.findOne({ _id: userMentions.post_id });

    const comment = await Comment.findOne({ _id: userMentions.comment_id }).select('created_at sender_username description upvotes_count downvotes_count downvote_users upvote_users');

    const postCreator = await User.findOne({ _id: post.user_id }).select('username');


    let postCreatorType = null;
    let rank;
    //check if user._id some of comment.upvoted_users 
    const upvoted = comment.upvote_users.includes(user.username);
    const downvoted = comment.downvote_users.includes(user.username);
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
        unread: user.user_mentions.unread,//TODO:SEED THIS OBJECT 
        commentsCount: post.comments_count,
        rank: rank,
        upvotes_count: comment.upvotes_count,
        downvotes_count: comment.downvotes_count,
        isSent: false,
        is_username_mention: false,



    };
    return mappedMessages;

}
const mapPostRepliesToFormat = async (post, user) => {

    const comment = await Comment.findOne({ post_id: post._id });
    console.log("post", post.title)




    if (comment) {
        console.log("comment", comment)
        const sender = comment.username
        let postCreatorType = null;
        let postCreator = null;
        let rank;
        //check if user._id some of comment.upvoted_users 
        const upvoted = comment.upvote_users.includes(user.username);

        const downvoted = comment.downvote_users.includes(user.username);
        console.log("comment text", comment.description)
        if (upvoted)
            rank = 1;
        else if (downvoted)
            rank = 0;
        else
            rank = -1;

        if (post.post_in_community_flag) {
            const community = await Community.findOne({ _id: post.community_id })
            //check if post creator is in moderators 
            postCreatorType = "moderator"
            postCreator = community.name

        } else {
            postCreatorType = "user";
            postCreator = comment.username;
        }


        const mappedMessages = {
            created_at: comment.created_at,
            senderUsername: comment.username,
            postCreator,
            postCreatorType,
            postSubject: post.title,
            replyContent: comment.description,
            _id: comment._id,
            unread: "true",//TODO: this attribute does not exist ,
            commentsCount: post.comments_count,
            rank: rank,
            upvotes_count: comment.upvotes_count,
            downvotes_count: comment.downvotes_count,
            is_username_mention: false,
        };

        return mappedMessages;
    } else {
        return null;
    }


}

export { mapMessageToFormat, mapUserMentionsToFormat, mapPostRepliesToFormat };