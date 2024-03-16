import { Community } from "../db/models/Community.js";
import { User } from "../db/models/User.js"; //delete this line
import { communityNameExists, ruleTitleExists, getUsersByIds } from "../utils/communities.js";

// Return { err: { status: XX, message: "XX" }} or { community }
//testing done
//documantation updated
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
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
//testing done
//documantation updated
const addNewRuleToCommunity = async (requestBody) => {
  let {
    community_name,
    rule_title,
    applies_to,
    report_reason,
    full_description,
  } = requestBody;

  try {
    const community = await communityNameExists(community_name);

    const rule_order = community.rules.length + 1;
    report_reason = report_reason || rule_title;
    full_description = full_description || "";

    const new_rule = {
      rule_title,
      rule_order,
      applies_to,
      report_reason,
      full_description,
    };

    community.rules.push(new_rule);

    const savedCommunity = await community.save();

    return { community: savedCommunity };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
//testing done
//documantation updated
const editCommunityRule = async (requestBody) => {
  let {
    community_name,
    rule_title,
    updatedRuleTitle,
    applies_to,
    report_reason,
    full_description,
  } = requestBody;
  updatedRuleTitle = updatedRuleTitle || rule_title;
  try {
    const community = communityNameExists(community_name);

    if (ruleTitleExists(community_name, updatedRuleTitle)) {
      return { err: { status: 400, message: "Rule title exists." } };
    } else {
      const rule = community.rules.find(
        (rule) => rule.rule_title === updatedRuleTitle
      );
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
};
//testing done
//documantation updated
const deleteCommunityRule = async (requestBody) => {
  let { community_name, rule_title } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    console.log(community);
    if (community) {
      community.rules = community.rules.filter(
        (rule) => rule.rule_title !== rule_title
      );
      console.log(community.rules);
      await community.save();
      return { rules: community.rules };
    }
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
//testing done
//documantation updated
const getCommunityRules = async (community_name) => {
  try {
    const community = await communityNameExists(community_name);
    return { rules: community.rules };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
// TODO: Implement the "Reorder Rules" API.
const setCommunitySettings = async (requestBody) => { };
//i use this function {getAllUsers} is just for testing purposes , has nothing todo wth communities end points 
const getAllUsers = async () => {
  try {
    const users = await User.find({});
    return { users: users };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
//testing done 
const approveUser = async (community_name, username) => {
  try {
    const { username, community_name } = requestBody;
    console.log(username, community_name);
    const user = await User.findOne({ username: username });

    console.log(user._id);
    if (!user) {
      return { err: { status: 400, message: "Username not found." } };
    }
    const community = await communityNameExists(community_name);
    if (community) {
      community.approved_users.push(user._id);
      await community.save();
      return { user: user };
    }
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
//testing done 
const getApprovedUsers = async (community_name) => {
  //get all users from the community
  try {
    const community = await communityNameExists(community_name);
    const users = await getUsersByIds(community.approved_users);
    console.log(users);
    return { users: users };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
//testing done
const editCommunityGeneralSettings = async (requestBody) => {
  const {
    community_name,
    description,
    send_welcome_message_flag,
    message,
    language,
    region,
    visibility,
    nsfw_flag,
    accepting_requests_to_join,
    approved_users_have_the_ability_to,
  } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    community.general_settings.description =
      description || community.general_settings.description;
    community.general_settings.welcome_message.send_welcome_message_flag =
      send_welcome_message_flag ||
      community.general_settings.welcome_message.send_welcome_message_flag;
    community.general_settings.welcome_message.message =
      message || community.general_settings.welcome_message.message;
    community.general_settings.language =
      language || community.general_settings.language;
    community.general_settings.region =
      region || community.general_settings.region;
    community.general_settings.visibility =
      visibility || community.general_settings.visibility;
    community.general_settings.nsfw_flag =
      nsfw_flag || community.general_settings.nsfw_flag;
    community.general_settings.accepting_requests_to_join =
      accepting_requests_to_join ||
      community.general_settings.accepting_requests_to_join;
    community.general_settings.approved_users_have_the_ability_to =
      approved_users_have_the_ability_to ||
      community.general_settings.approved_users_have_the_ability_to;
    const savedCommunity = await community.save();
    return { settings: savedCommunity.general_settings };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
const editDetailsWidget = async (requestBody) => {
  const { community_name, members_nickname, currently_viewing_nickname, description } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (community) {
      community.members_nickname = members_nickname || community.members_nickname;
      community.currently_viewing_nickname = currently_viewing_nickname || community.currently_viewing_nickname;
      community.description = description || community.description;
      await community.save();
    }

    return { widget: { members_nickname, currently_viewing_nickname, description } };
  }
  catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
const addCommunityProfilePicture = async (requestBody) => {
  const { community_name, profile_picture } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (community) {
      community.profile_picture = profile_picture;
      await community.save();
    }
    return { community: community };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
const addCommunityBannerPicture = async (requestBody) => {
  const { community_name, banner_picture } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (community) {
      community.banner_picture = banner_picture;
      await community.save();
    }
    return { community: community };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
const deleteCommunityBannerPicture = async (requestBody) => {
  const { community_name } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (community) {
      community.banner_picture = "none";
      await community.save();
    }
    return { community: community };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
const deleteCommunityProfilePicture = async (requestBody) => {
  const { community_name } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (community) {
      community.profile_picture = "none";
      await community.save();
    }
    return { community: community };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}

export {
  addNewCommunity,
  addNewRuleToCommunity,
  editCommunityRule,
  deleteCommunityRule,
  getCommunityRules,
  setCommunitySettings,
  getApprovedUsers,
  editCommunityGeneralSettings,
  approveUser,
  getAllUsers,
  editDetailsWidget,
  addCommunityProfilePicture,
  addCommunityBannerPicture,
  deleteCommunityBannerPicture,
  deleteCommunityProfilePicture
};
