import { Community } from '../db/models/Community.js';
import { communityNameExists } from '../utils/communities.js';

// Return { err: { status: XX, message: "XX" }} or { community }
const addNewCommunity = async (requestBody) => {
  const { name, description, content_visibility, mature_content } = requestBody;

  const community = new Community({
    name,
    description,
    type: content_visibility,
    nswf_flag: mature_content,
  });

  try {
    const found_community = await communityNameExists(name);

    if (found_community) {
      return { err: { status: 400, message: "Community name exists." } };
    }

    const savedCommunity = await community.save();

    return { community: savedCommunity };
  }
  catch (error) {

    return { err: { status: 500, message: error.message } };
  }
}

export { addNewCommunity };