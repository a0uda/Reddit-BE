import { Community } from '../db/models/Community.js';

// Returns Promise<Object|null>
async function communityNameExists(communityName) {
    return await Community.findOne({ name: communityName })
}

async function ruleTitleExists(communityName, ruleTitle) {
    //find community by name where rule_title exists and return the community

    return await Community.findOne({ name: communityName, "rules.rule_title": ruleTitle })

}
export { communityNameExists, ruleTitleExists };
