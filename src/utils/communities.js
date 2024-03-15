import { Community } from '../db/models/Community.js';
import { User } from '../db/models/User.js';

// Returns Promise<Object|null>
async function communityNameExists(communityName) {
    return await Community.findOne({ name: communityName })
}

async function ruleTitleExists(communityName, ruleTitle) {
    //find community by name where rule_title exists and return the community

    return await Community.findOne({ name: communityName, "rules.rule_title": ruleTitle })

}
// Find users with the provided IDs
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
export { communityNameExists, ruleTitleExists, getUsersByIds }
