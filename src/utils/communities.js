import { Community } from '../db/models/Community.js';

// Returns Promise<Object|null>
async function communityNameExists(CommunityName) {
    return await Community.findOne({ name: CommunityName })
}

export { communityNameExists };