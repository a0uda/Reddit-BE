import { User } from '../db/models/User.js';
import { Community } from '../db/models/Community.js';

const mapMessageToFormat = async (message) => {
    let receiver_username = null;
    if (message.receiver_type === "user")
        receiver_username = await User.findOne({ _id: message.receiver_id }).select('username');
    else
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
        receiver_username: receiver_username.username,
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
export { mapMessageToFormat };