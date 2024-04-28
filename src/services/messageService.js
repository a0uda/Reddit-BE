
import { Message, setRefPath } from "../db/models/Message.js";
import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";
import { verifyAuthToken } from "../controller/userAuth.js";
import { mapMessageToFormat } from "../utils/messages.js";

const composeNewMessage = async (request) => {
    try {
        const { success, err, status, user: sender, msg } = await verifyAuthToken(request);

        if (!sender) {
            return { success, err, status, banningUser, msg };
        }

        const { sender_username, sender_type, receiver_username, receiver_type, subject, message, senderVia } = request.body.data;
        if (!sender_username || !receiver_username || !subject || !message) {
            return { status: 400, message: "Please provide all the required fields" };
        }
        if (sender_username === receiver_username) {
            return { status: 400, message: "Sender and receiver cannot be the same" };
        }


        const sender_id = sender._id;
        let sender_via_id = null;

        if (sender_type === "moderator") {
            const community = await Community.findOne({ name: senderVia });
            if (!community) {
                return { status: 400, message: "Community does not exist" };
            }

            const moderator = await Community.findOne({ _id: community._id, 'moderators.username': sender_username });
            if (!moderator) {
                return { status: 400, message: "User is not a moderator in this community. Try to send via another community" };
            }

            sender_via_id = community._id;
        }

        let receiver_id = null;
        if (receiver_type === "user") {
            const receiver = await User.findOne({ username: receiver_username });
            if (!receiver) {
                return { status: 400, message: "User does not exist" };
            }
            receiver_id = receiver._id;
        } else {
            const community = await Community.findOne({ name: receiver_username });
            if (!community) {
                return { status: 400, message: "Community does not exist" };
            }
            receiver_id = community._id;
        }

        const newMessage = new Message({
            sender_id,
            sender_via_id,
            sender_type,
            [receiver_type]: receiver_id,
            receiver_id,
            receiver_type,
            message,
            subject
        });

        await newMessage.save();
        return { status: 200, message: "Message sent successfully" };
    } catch (error) {
        return { status: 500, message: error.message };
    }
};

//////////////////////SENT //////////////////////////
const getUserSentMessages = async (request) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);

        if (!user) {
            return { success, err, status, user, msg };
        }

        const user_id = user._id;
        const messages = await Message.find({ sender_id: user_id }).select('_id sender_id sender_type receiver_type receiver_id message created_at deleted_at unread_flag parent_message_id subject sender_via_id');

        const messagesToSend = await Promise.all(messages.map(async (message) => {
            return await mapMessageToFormat(message);
        }));

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
        const userMessages = await Message.find({
            receiver_type: "user",
            receiver_id: user_id,
            unread_flag: true
        }).select('_id sender_id sender_type receiver_type receiver_id message created_at deleted_at unread_flag parent_message_id subject sender_via_id');

        // Query for messages where the receiver is a moderator of the community referenced by sender_via_id and unread_flag is true
        const moderatorMessages = await Message.find({
            receiver_type: "moderator",
            //  sender_id: { $ne: user._id }, // Exclude messages where the sender is the user
            sender_via_id: { $in: user.moderated_communities.id }, // Assuming user.communities holds the IDs of communities the user is a moderator of
            unread_flag: true
        }).select('_id sender_id sender_type receiver_type receiver_id message created_at deleted_at unread_flag parent_message_id subject sender_via_id');

        // Combine the results from both queries
        const messages = [...userMessages, ...moderatorMessages];
        console.log(messages);

        // Map the messages to the desired format
        const messagesToSend = await Promise.all(messages.map(async (message) => {
            return await mapMessageToFormat(message);
        }));

        return { status: 200, messages: messagesToSend };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};




export { composeNewMessage, getUserSentMessages, getUserUnreadMessages };
