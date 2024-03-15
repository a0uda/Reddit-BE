import { Community } from '../db/models/Community.js';
import { communityNameExists, ruleTitleExists } from '../utils/communities.js';

// Return { err: { status: XX, message: "XX" }} or { community }
//testing done 
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

//testing done
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
//testing done
const editCommunityRule = async (requestBody) => {

  let { community_name, rule_title, updatedRuleTitle, applies_to, report_reason, full_description } = requestBody;
  updatedRuleTitle = updatedRuleTitle || rule_title;
  try {
    const community = communityNameExists(community_name);

    if (ruleTitleExists(community_name, updatedRuleTitle)) {
      return { err: { status: 400, message: "Rule title exists." } };
    } else {
      const rule = community.rules.find(rule => rule.rule_title === updatedRuleTitle);
      if (rule) {
        rule.rule_title = updatedRuleTitle;
        rule.applies_to = applies_to;
        rule.report_reason = report_reason || rule.report_reason;
        rule.full_description = full_description || rule.full_description;
      }

    }
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
//testing done 
const deleteCommunityRule = async (requestBody) => {
  let { community_name, rule_title } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    console.log(community);
    if (community) {

      community.rules = community.rules.filter(rule => rule.rule_title !== rule_title);
      console.log(community.rules);
      await community.save();
      return { rules: community.rules };
    }
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
//testing done 
const getCommunityRules = async (community_name) => {
  try {
    console.log("inside service")
    const community = await communityNameExists(community_name);

    console.log(community)
    return { rules: community.rules };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
// TODO: Implement the "Reorder Rules" API.
// Error in sending the pull request - GitHub.
const setCommunitySettings = async (requestBody) => {
}
export { addNewCommunity, addNewRuleToCommunity, editCommunityRule, deleteCommunityRule, getCommunityRules, setCommunitySettings };