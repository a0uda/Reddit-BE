import { Community } from "../db/models/Community.js";
import { User } from "../db/models/User.js"; //delete this line
import { Rule } from "../db/models/Rule.js";
import { isUserAlreadyApproved, communityNameExists, getRuleByTitle, getUsersByIds, getRuleById, deleteRule, getApprovedUserView } from "../utils/communities.js";


const addNewCommunity = async (requestBody) => {
  const { community_name, description, content_visibility, mature_content } = requestBody;
  try {
    const found_community = await communityNameExists(community_name);
    if (found_community) {
      return { err: { status: 400, message: "Community name exists." } };
    }
    const community = new Community({
      name: community_name,
      description,
      type: content_visibility,
      nswf_flag: mature_content,
    });
    await community.save();


    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
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
    if (!community) {
      return { err: { status: 500, message: "community name does not exist " } };
    }
    const rule_order = community.rules_ids.length + 1;
    report_reason = report_reason || rule_title;
    full_description = full_description || "";

    const new_rule = new Rule({
      rule_title,
      rule_order,
      applies_to,
      report_reason,
      full_description,
    });
    if (!community.rules_ids) {
      community.rules_ids = [];
    }
    community.rules_ids.push(new_rule._id);
    await new_rule.save();
    await community.save();
    console.log("inside add")
    console.log(new_rule)
    console.log(community)
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const editCommunityRule = async (requestBody) => {
  try {
    let {
      community_name,
      rule_id,
      rule_title,
      rule_order,
      applies_to,
      report_reason,
      full_description
    } = requestBody;
    const rule = await getRuleById(rule_id);

    if (!rule) {
      return { err: "No rule found with this id, enter a valid id." };
    }

    if (rule_title) {
      const new_title = await getRuleByTitle(community_name, rule_title);
      if (new_title && new_title._id.toString() !== rule._id.toString()) {
        return { err: "The updated title already exists, enter a different title." };
      }
    }
    rule.rule_title = rule_title || rule.rule_title;
    rule.applies_to = applies_to || rule.applies_to;
    rule.report_reason = report_reason || rule.report_reason;
    rule.full_description = full_description || rule.full_description;
    rule.rule_order = rule_order || rule.rule_order;
    await rule.save();
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
const deleteCommunityRule = async (requestBody) => {
  let { community_name, rule_id } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 500, message: "community name does not exist " } };

    }

    community.rules_ids = community.rules_ids.filter(
      (rule) => rule !== rule_id
    );

    await community.save();
    await deleteRule(rule_id)
    return { success: true };

  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
const getCommunityRules = async (community_name) => {
  const community = await communityNameExists(community_name);
  if (!community) {
    return { err: { status: 500, message: "community name does not exist " } };

  }
  const ids = community.rules_ids;
  const rules = [];
  for (const id of ids) {
    const rule = await getRuleById(id);
    if (rule) {
      rules.push(rule);
    }
  }
  console.log(rules)
  console.log(community)
  return { rules: rules }
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

const approveUser = async (requestBody) => {
  try {
    const { username, community_name } = requestBody;
    console.log(username, community_name);

    const user = await User.findOne({ username: username });
    if (!user) {
      return { err: { status: 400, message: "Username not found." } };
    }

    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 400, message: "Community not found." } };
    }
    console.log(community)
    // Check if user ID already exists in the approved_users array of the community
    const isAlreadyApproved = isUserAlreadyApproved(community, user._id);
    if (isAlreadyApproved) {
      return { err: { status: 400, message: "User is already approved in this community." } };
    }

    community.approved_users.push({ id: user._id, approved_at: new Date() });
    await community.save();
    console.log(community.approved_users);
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

//Profile picture is not showing 
const getApprovedUsers = async (community_name) => {
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 500, message: "community name does not exist " } };

    }

    // Fetch user views for each approved user
    const users = await Promise.all(community.approved_users.map(async (userObj) => {
      const userView = await getApprovedUserView({ id: userObj.id, approved_at: userObj.approved_at });
      return userView;
    }));

    console.log(users)

    return { users }; // Return the users array
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

//testing done
const editCommunityGeneralSettings = async (community_name, requestBody) => {
  const {
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
    if (!community) {
      return { err: { status: 500, message: "community name does not exist " } };

    }
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
    console.log(savedCommunity);
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
//new
const getDetailsWidget = async (community_name) => {
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 500, message: "community name does not exist " } };

    }
    return {
      widget: {
        members_nickname: community.members_nickname,
        currently_viewing_nickname: community.currently_viewing_nickname,
        description: community.description,
      },
    };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
const editDetailsWidget = async (requestBody) => {
  const { community_name, members_nickname, currently_viewing_nickname, description } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 500, message: "community name does not exist " } };

    }
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
    if (!community) {
      return { err: { status: 500, message: "community name does not exist " } };

    }
    community.profile_picture = profile_picture;
    const savedCommunity = await community.save();

    console.log(savedCommunity);
    return { success: true };

  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
const addCommunityBannerPicture = async (requestBody) => {
  const { community_name, banner_picture } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 500, message: "community name does not exist " } };

    }

    community.banner_picture = banner_picture;
    const savedCommunity = await community.save();
    console.log(savedCommunity);
    console.log(savedCommunity.banner_picture)


    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
const deleteCommunityBannerPicture = async (requestBody) => {
  const { community_name } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 500, message: "community name does not exist " } };

    }

    community.banner_picture = "none";
    const savedCommunity = await community.save();

    console.log(savedCommunity);
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
const deleteCommunityProfilePicture = async (requestBody) => {
  const { community_name } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 500, message: "community name does not exist " } };

    }
    community.profile_picture = "none";
    const savedCommunity = await community.save();

    console.log(savedCommunity);
    return { sucess: true };
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
  deleteCommunityProfilePicture,
  getDetailsWidget
};
