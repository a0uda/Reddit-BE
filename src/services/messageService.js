//todos :
//the deleted add attribute is not added to all the model 
//3)/messages/reply
//8) get all messages btraga3  duplicates 
import { Message, setRefPath } from "../db/models/Message.js";
import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";
import { verifyAuthToken } from "../controller/userAuth.js";
import { mapMessageToFormat, mapUserMentionsToFormat, mapPostRepliesToFormat } from "../utils/messages.js";
import { Post } from "../db/models/Post.js";
import { Comment } from "../db/models/Comment.js";

const composeNewMessage = async (request, isReply) => {
    try {
        const { success, err, status, user: sender, msg } = await verifyAuthToken(request);

        if (!sender) {
            return { success, err, status, sender, msg };
        }
        const { sender_type, receiver_username, receiver_type, subject = null, message, senderVia = null, parent_message_id = null } = request.body.data;

        if (!receiver_username || !subject || !message || !sender_type || !receiver_type) {
            return { err: { status: 400, message: "Please provide all the required fields" } };
        }

        if (isReply) {
            if (!parent_message_id) {
                return { err: { status: 400, message: "This is a reply Please provide the parent_message_id" } };
            }
            const parentMessage = await Message.findOne({ _id: parent_message_id });
            if (!parentMessage) {
                return { err: { status: 400, message: "the provided parent_message_id does not exist" } };
            }
        }
        let global_sender_id = null;
        let global_receiver_id = null;
        let global_sender_via_id = null;

        ///////CASE 1: MODERATOR->USER////////////////////////
        //TODO: CHECK IF THE USER IS MUTING THIS COMMUNITY 
        if (sender_type === "moderator") {
            const community = await Community.findOne({ name: senderVia });
            if (!community) {
                return { err: { status: 400, message: "the provided senderVia Community id does not exist" } };
            }
            //check if the sender is a moderator in the community 
            const moderator = community.moderators.find((moderator) => moderator.username === sender.username);
            if (!moderator) {
                return { err: { status: 400, message: "User is not a moderator in this community. Try to send via another community" } };
            }
            global_sender_id = sender._id;
            global_sender_via_id = community._id;
            if (receiver_type === "user") {
                const receiver = await User.findOne({ username: receiver_username });
                if (!receiver) {
                    return { err: { status: 400, message: "reciever User does not exist" } };

                }
                global_receiver_id = receiver._id;
            }
            ///////CASE 2: MODERATOR->COMMUNITY////////////////////////TODO: IS THIS A VALID ACTION ?
            else

                if (receiver_type === "moderator") {
                    const receiver = await Community.findOne({ name: receiver_username })
                    if (!receiver) {
                        return { err: { status: 400, message: "reciever Community does not exist" } };

                    }
                    global_receiver_id = receiver._id;
                }
        }
        else {

            global_sender_id = sender._id;
            global_sender_via_id = null;
            ///////CASE 3: USER->MODERATOR////////////////////////
            if (receiver_type === "moderator") {
                const receiver = await Community.findOne({ name: receiver_username })
                if (!receiver) {
                    return { err: { status: 400, message: "reciever Community does not exist" } };

                }
                //CHECK IF THE SENDER IS MUTED IN THE COMMUNITY AND GET THE MUTED DATE 
                const muted_user = receiver.muted_users.find((muted_user) => muted_user.username === sender.username);
                if (muted_user) {
                    return { err: { status: 400, message: "You are muted from this community , your message will not be sent  " } };
                }
                global_receiver_id = receiver._id;
            }
            /////////CASE 4: USER->USER//////////////////////// 
            else {
                const receiver = await User.findOne({ username: receiver_username });
                if (!receiver) {
                    return { err: { status: 400, message: "reciever User does not exist" } };

                }
                global_receiver_id = receiver._id;
            }
        }
        const newMessage = new Message({
            sender_id: global_sender_id,
            sender_via_id: global_sender_via_id,
            sender_type,
            [receiver_type]: global_receiver_id,
            receiver_id: global_receiver_id,
            receiver_type,
            message,
            subject,
            parent_message_id,
        });
        await newMessage.save();
        return { status: 200, message: "Message sent successfully" };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

// //////////////////////SENT //////////////////////////

const getUserSentMessages = async (request) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);

        if (!user) {
            return { success, err, status, user, msg };
        }

        const user_id = user._id;
        const messages = await Message.find({ sender_id: user_id })

        let messagesToSend = await Promise.all(messages.map(async (message) => {
            const type = "getUserSentMessages"
            return await mapMessageToFormat(message, user, type);
        }));
        //TODO: FILTER DELETED AT 
        messagesToSend = messagesToSend.filter((message) => message !== null);

        return { status: 200, messages: messagesToSend };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
//////////////////////UNREAD //////////////////////////
const getUserUnreadMessages = async (request) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);

        if (!user) {
            return { success, err, status, user, msg };
        }
        const user_id = user._id;

        // Query for messages where the receiver is the user and unread_flag is true
        let userMessages = await Message.find({
            receiver_type: "user",
            receiver_id: user_id,
            unread_flag: true
        })

        // Query for messages where the receiver is a moderator of the community referenced by sender_via_id and unread_flag is true
        let moderatorMessages = await Message.find({
            receiver_type: "moderator",
            //  sender_id: { $ne: user._id }, // Exclude messages where the sender is the user
            sender_via_id: { $in: user.moderated_communities.id }, // Assuming user.communities holds the IDs of communities the user is a moderator of
            unread_flag: true
        })

        // Combine the results from both queries
        let messages = [...userMessages, ...moderatorMessages];


        // Map the messages to the desired format
        const type = "getUserUnreadMessages"
        let messagesToSend = await Promise.all(messages.map(async (message) => {
            return await mapMessageToFormat(message, user, type);
        }));
        //filter this array from nulls 
        messagesToSend = messagesToSend.filter((message) => message !== null);
        return { status: 200, messages: messagesToSend };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
//////////////////////ALL MESSAGES //////////////////////////
const getAllMessages = async (request) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);

        if (!user) {
            return { success, err, status, user, msg };
        }
        const user_id = user._id;
        // Query for messages where the receiver is the user
        const userMessages = await Message.find({
            receiver_type: "user",
            receiver_id: user_id
        })

        // Query for messages where the receiver is a moderator of the community referenced by sender_via_id
        const moderatorMessages = await Message.find({
            receiver_type: "moderator",
            //  sender_id: { $ne: user._id }, // Exclude messages where the sender is the user
            sender_via_id: { $in: user.moderated_communities.id } // Assuming user.communities holds the IDs of communities the user is a moderator of
        })
        //Query for messages where the sender is the user
        const userSentMessages = await Message.find({
            sender_id: user_id
        })
        // //Query  for messages where the sender is a moderator of the community referenced by sender_via_id 
        // const moderatorSentMessages = await Message.find({
        //     sender_type: "moderator",
        //     sender_via_id: { $in: user.moderated_communities.id }
        // }).select('_id is_invitation sender_id sender_type receiver_type receiver_id message created_at deleted_at unread_flag parent_message_id subject sender_via_id');

        // Combine the results from both queries
        let messages = [...userMessages, ...moderatorMessages, ...userSentMessages];
        //remove duplicates 
        const seen = new Set();
        const uniqueMessages = messages.filter(message => {
            if (message === null) return false;
            const isDuplicate = seen.has(message._id.toString());
            seen.add(message._id.toString());
            return !isDuplicate;
        });
        let messagesToSend = await Promise.all(uniqueMessages.map(async (message) => {

            return await mapMessageToFormat(message, user);
        }));
        //filter this array from nulls 
        messagesToSend = messagesToSend.filter((message) => message !== null);

        return { status: 200, messages: messagesToSend };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
//////////////////////DELETE MESSAGE //////////////////////////
const deleteMessage = async (request) => {

    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);

        if (!user) {
            return { success, err, status, user, msg };
        }

        const { _id } = request.body;
        console.log(_id);
        const message = await Message.findById(_id);
        console.log("message.sender id :")
        console.log(message._id)


        if (!message) {
            return { err: { status: 404, message: "Message not found" } };
        }
        if (message.sender_id.toString() == user.id.toString())
            message.sender_deleted_at = Date.now();
        else if (message.receiver_id.toString() == user.id.toString())
            message.receiver_deleted_at = Date.now();
        else
            return { err: { status: 400, message: "You are not the sender ot the reciever to delete this message" } };
        await message.save();





        return { status: 200, message: "Message deleted successfully" };
    }
    catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

//////////////////////////////GET USER MENTIONS///////////////////////////////////// 
const getUserMentions = async (request) => {

    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user || err) {
            //return unauthorized 
            return { success, err, status, user, msg };

        }

        const mentions = user.user_mentions;
        const mappedMentions = await Promise.all(mentions.map(async (mention) => {
            return await mapUserMentionsToFormat(mention, user);
        }));
        return { status: 200, mentions: mappedMentions };
    }
    catch (error) {
        return { err: { status: 500, message: error.message } };
    }


};
//////////////////////////////GET POSTS REPLIES/////////////////////////////////////
const getUserPostReplies = async (request) => {
    try {

        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user || err) {
            return { success, err, status, user, msg };
        }

        const posts = await Post.find({ user_id: user._id });


        const mappedReplies = await Promise.all(posts.map(async (post) => {
            return await mapPostRepliesToFormat(post, user);
        }));

        const filteredReplies = mappedReplies.filter(reply => reply !== null);


        return { status: 200, replies: filteredReplies };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
const getMessagesInbox = async (request) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user || err) {
            return { success, err, status, user, msg };
        }
        const posts = await Post.find({ user_id: user._id });
        const messages = await Message.find({ receiver_id: user._id });
        const mentions = user.user_mentions;
        const mappedReplies = await Promise.all(posts.map(async (post) => {

            return await mapPostRepliesToFormat(post, user);
        }
        ));
        const mappedMessages = await Promise.all(messages.map(async (message) => {
            return await mapMessageToFormat(message, user);
        }));
        const mappedMentions = await Promise.all(mentions.map(async (mention) => {
            return await mapUserMentionsToFormat(mention, user);
        }));
        const allMessages = [...mappedReplies, ...mappedMessages, ...mappedMentions].filter(
            (message) => message !== null
        );
        return { status: 200, replies: mappedReplies, messages: allMessages };
    }
    catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
//////////////////////////MARK MESSAGE AS READ //////////////////////////
const markMessageAsRead = async (request) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user || err) {
            return { success, err, status, user, msg };
        }
        const { Messages } = request.body;
        const messages = await Message.find({ _id: { $in: Messages } });
        if (messages.length === 0) {
            return { err: { status: 400, message: "Messages not found" } };
        }
        const updatedMessages = await Promise.all(messages.map(async (message) => {
            if (message.receiver_id.toString() == user._id.toString()) {
                message.unread_flag = false;
                await message.save();
            }
        }));
        return { status: 200, messages: updatedMessages };

    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}
//mark all user messages as read

const markAllAsRead = async (request) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user || err) {
            return { success, err, status, user, msg };
        }
        const messages = await Message.find({ receiver_id: user._id });
        messages.forEach(async (message) => {
            message.unread_flag = false;
            await message.save();
        });
        return { status: 200, message: "All messages marked as read" };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}
const getUserUnreadMessagesCount = async (request) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user || err) {
            return { success, err, status, user, msg };
        }
        let messages = await Message.find({ receiver_id: user._id, unread_flag: true });
        const blockedUsers = user.safety_and_privacy_settings.blocked_users.map(
            (user) => user.id
        );
        for (let i = 0; i < blockedUsers.length; i++) {
            messages = messages.filter(
                (message) => message.sender_id.toString() != blockedUsers[i].toString()
            );
        }
        return { status: 200, count: messages.length };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}

const createUsernameMention = async (request) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user || err) {
            return { success, err, status, user, msg };
        }
        const { comment_id, mentioned_username } = request.body;

        const comment = await Comment.findOne({ _id: comment_id }).select("post_id user_id");
        if (!comment) {
            return { err: { status: 400, message: "Comment not found" } };
        }
        const mentionedUser = await User.findOne({ username: mentioned_username });
        if (!mentionedUser) {
            return { err: { status: 400, message: "mentioned User not found" } };
        }




        const userMention = {
            post_id: comment.post_id,
            comment_id: comment_id,
            sender_username: user.username,
            unread_flag: true,
        };
        mentionedUser.user_mentions.push(userMention);
        await mentionedUser.save();
        return { status: 200, message: "User mention saved successfully" };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }

}
export { markAllAsRead, createUsernameMention, getUserUnreadMessagesCount, composeNewMessage, getUserSentMessages, getUserUnreadMessages, getAllMessages, deleteMessage, getUserMentions, getUserPostReplies, getMessagesInbox, markMessageAsRead };




