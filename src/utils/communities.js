import { Community } from '../db/models/Community.js';
import { User } from '../db/models/User.js';
import { Rule } from '../db/models/Rule.js';
async function communityNameExists(communityName) {
    return await Community.findOne({ name: communityName })
}

async function getRuleByTitle(communityName, ruleTitle) {
    //find community by name where rule_title exists and return the community

    return await Community.findOne({ name: communityName, "rules.rule_title": ruleTitle })
}
const getRuleById = async (id) => {
    try {
        return await Rule.findById(id);


    } catch (error) {
        return {
            err: { status: 500, message: error.message }
        }
    };
}
const getUsersByIds = async (userIds) => {
    try {
        const users = await User.find({ _id: { $in: userIds } });
        const filteredUsers = users.filter(user => user !== null);
        return { users: filteredUsers };
    } catch (error) {
        return {
            err: { status: 500, message: error.message }
        }
    };

}
const deleteRule = async (ruleId) => {
    try {

        const deletedRule = await Rule.findByIdAndDelete(ruleId);

        if (!deletedRule) {
            return {
                err: { status: 500, message: "not found" }
            }
        }
        return { success: true };
    } catch (error) {
        return { error: { status: 500, message: error.message } };
    }
};
const getApprovedUserView = async ({ id, approved_at }) => {
    try {
        // Find the user by user ID
        const user = await User.findById(id);

        if (!user)
            return { error: { status: 400, message: "user not found " } };

        // Extract profile picture and username from the user
        let { profile_picture, username } = user;
        profile_picture = profile_picture || "none"
        return { profile_picture, username, approved_at };
    } catch (error) {
        return { error: { status: 500, message: error.message } };
    }
};
const isUserAlreadyApproved = (community, userId) => {
    return community.approved_users.some(pair => pair.id == (userId));
};
export { isUserAlreadyApproved, communityNameExists, getRuleByTitle, getUsersByIds, getRuleById, deleteRule, getApprovedUserView }
