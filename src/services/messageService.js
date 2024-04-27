
import { Message, setRefPath } from "../db/models/Message.js";
import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";
import { communityNameExists } from "../utils/communities.js"
import { verifyAuthToken } from "../controller/userAuth.js";
const composeNewMessage = async (request) => {
    ///////////////////verify sender //////////////////////////
    const {
        success,
        err,
        status,
        user: sender,
        msg,
    } = await verifyAuthToken(request);

    if (!sender) {
        return { success, err, status, banningUser, msg };
    }

    const { sender_username, sender_type, receiver_username, receiver_type, subject, message, senderVia } = request.body.data;
    if (!sender_username || !receiver_username || !subject || !message) {
        return { status: 400, message: "Please provide all the required fields" };
    }
    ///////////////////process sender //////////////////////////
    console.log("authorized")
    const sender_id = sender._id;
    if (sender_type === "moderator") {
        const community = await Community.findOne({ name: senderVia });
        if (!community) {
            return { status: 400, message: "Community does not exist" };
        }
        //search for the sender username in community moderators 
        const moderator = await community.moderators.find({ username: sender_username });
        if (!moderator) {
            return { status: 400, message: "User is not a moderator in this community . Try to send via other community " };
        }
    }
    console.log("sender processed")
    /////////////////process receiver //////////////////////////
    setRefPath(receiver_type);

    let receiver_id = null;
    if (receiver_type === "user") {

        const receiver = await User.findOne({ username: receiver_username });
        if (!receiver) {
            return { status: 400, message: "User does not exist" };
        }
        receiver_id = receiver._id;
        console.log("receiver processed")
    } else {
        reciever = communityNameExists(receiver_username);
        if (!receiver) {
            return { status: 400, message: "Community does not exist" };
        }
        receiver_id = receiver._id;
    }
    console.log("reciever processed")
    ///////////////////save message //////////////////////////
    const newMessage = new Message({
        sender_id: sender_id,
        sender_via_id: null,
        sender_type: sender_type,
        [receiver_type]: receiver_id, // Dynamically set based on receiver_type
        receiver_id: receiver_id,
        receiver_type: receiver_type,
        message: message,
        subject: subject
    });
    console.log("newMessage", newMessage);
    await newMessage.save();
    return { status: 200, message: "Message sent successfully" };
};
const getUserSentMessages = async (request) => {
    console.log("debugging getUserSentMessages")
    const {
        success,
        err,
        status,
        user,
        msg,
    } = await verifyAuthToken(request);

    if (!user) {
        return { success, err, status, user, msg };
    }
    const user_id = user._id;
    const messages = await Message.find({ sender_id: user_id });
    //map the messages to the required format
    console.log("authorizatuion done")
    const messagesToSend = [];
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].sender_id === user_id) {
            console.log("inside loop")
            console.log("sender username", user.username);
            let receiver_username = null;
            if (messages[i].receiver_type === "user")
                receiver_username = await User.findOne({ _id: messages[i].receiver_id });
            else
                receiver_username = await Community.findOne({ _id: messages[i].receiver_id });

            let isReply = false;
            if (messages[i].parent_message_id)
                isReply = true;
            let senderVia_name = null;
            if (messages[i].sender_via_id)
                senderVia_name = await Community.findOne({ _id: messages[i].sender_via_id }).name;

            messagesToSend.push({
                _id: messages[i]._id,
                sender_username: user.username,
                sender_type: messages[i].sender_type,
                receiver_username: receiver_username.username,
                receiver_type: messages[i].receiver_type,
                senderVia: senderVia_name,
                message: messages[i].message,
                created_at: messages[i].created_at,
                deleted_at: messages[i].deleted_at,
                unread_flag: messages[i].unread_flag,
                isSent: true,
                isReply: isReply,
                parentMessageId: messages[i].parent_message_id,
                subject: messages[i].subject



            })

        }



    }
    return { status: 200, messages: messagesToSend };
}









export { composeNewMessage, getUserSentMessages };
