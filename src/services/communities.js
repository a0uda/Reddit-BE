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


const addNewRuleToCommunity = async (requestBody) => {
  let { community_name, rule_title, applies_to, report_reason, full_description } = requestBody;

  try {
    const community = await communityNameExists(community_name);

    const rule_order = community.rules.length + 1;
    report_reason = report_reason || rule_title;
    full_description = full_description || "";

    const new_rule = { rule_title, rule_order, applies_to, report_reason, full_description };

    community.rules.push(new_rule);

    const savedCommunity = await community.save();

    return { community: savedCommunity };
  }
  catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}

// TODO: Implement the "Reorder Rules" API.
// Error in sending the pull request - GitHub.

export { addNewCommunity, addNewRuleToCommunity };