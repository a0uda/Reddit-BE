/**
 * Utility functions related to user operations.
 * @module users/utils/userSettings
 */

/**
 * Retrieves the formatted account settings for a user.
 * @param {Object} user - The user object containing account information.
 * @returns {Object} The formatted account settings.
 * @property {Object} account_settings - Object containing account settings.
 * @property {string} account_settings.email - The email address.
 * @property {boolean} account_settings.verified_email_flag - Flag indicating whether the email is verified.
 * @property {string} account_settings.country - The country.
 * @property {string} account_settings.gender - The gender.
 * @property {string} account_settings.gmail - The Gmail address.
 * @property {boolean} account_settings.connected_google - Flag indicating whether connected to Google.
 * @example
 * Output:
 * {
 *   email: 'example@example.com',
 *   verified_email_flag: true,
 *   country: 'US',
 *   gender: 'Male',
 *   gmail: 'example@gmail.com',
 *   connected_google: true
 * }
 */

export function getAccountSettingsFormat(user) {
  return {
    account_settings: {
      email: user.email,
      verified_email_flag: user.verified_email_flag,
      country: user.country || "",
      gender: user.gender,
      gmail: user.gmail || "",
      connected_google: user.connected_google,
    },
  };
}
/**
 * Retrieves the formatted profile settings for a user.
 * @param {Object} user - The user object containing profile information.
 * @returns {Object} The formatted profile settings.
 * @property {Object} profile_settings - Object containing profile settings.
 * @property {string} profile_settings.display_name - The display name of the user.
 * @property {string} profile_settings.about - Information about the user.
 * @property {Object} profile_settings.social_links - Social links of the user.
 * @property {string} profile_settings.profile_picture - URL of the profile picture.
 * @property {string} profile_settings.banner_picture - URL of the banner picture.
 * @property {boolean} profile_settings.nsfw_flag - Flag indicating whether NSFW content is allowed.
 * @property {boolean} profile_settings.allow_followers - Flag indicating whether followers are allowed.
 * @property {string} profile_settings.content_visibility - Visibility settings for user's content.
 * @property {string[]} profile_settings.active_communities_visibility - Visibility settings for active communities.
 * @example
 * Output:
 * {
 *   profile_settings: {
 *     display_name: 'John Doe',
 *     about: 'I am a software engineer.',
 *     social_links: {
 *       twitter: 'https://twitter.com/johndoe',
 *       linkedin: 'https://linkedin.com/in/johndoe',
 *     },
 *     profile_picture: 'https://example.com/profile.jpg',
 *     banner_picture: 'https://example.com/banner.jpg',
 *     nsfw_flag: false,
 *     allow_followers: true,
 *     content_visibility: 'public',
 *     active_communities_visibility: ['community1', 'community2'],
 *   },
 * }
 */
export function getProfileSettingsFormat(user) {
  return {
    profile_settings: {
      display_name: user.display_name,
      about: user.about,
      social_links: user.social_links,
      profile_picture: user.profile_picture,
      banner_picture: user.banner_picture,
      nsfw_flag: user.profile_settings.nsfw_flag,
      allow_followers: user.profile_settings.allow_followers,
      content_visibility: user.profile_settings.content_visibility,
      active_communities_visibility:
        user.profile_settings.active_communities_visibility,
    },
  };
}

/**
 * Retrieves the formatted safety settings for a user.
 * @param {Object[]} blockedUsersDetails - Details of users blocked by the current user.
 * @param {Object[]} mutedCommunitiesDetails - Details of communities muted by the current user.
 * @returns {Object} The formatted safety settings.
 * @property {Object} safety_and_privacy_settings - Object containing safety and privacy settings.
 * @property {Object[]} safety_and_privacy_settings.blocked_users - Details of users blocked by the current user.
 * @property {Object[]} safety_and_privacy_settings.muted_communities - Details of communities muted by the current user.
 * @example
 * Output:
 * {
 *   safety_and_privacy_settings: {
 *     blocked_users: [
 *       { username: 'user1', reason: 'spam' },
 *       { username: 'user2', reason: 'harassment' }
 *     ],
 *     muted_communities: [
 *       { name: 'community1', duration: '30 days' },
 *       { name: 'community2', duration: 'indefinitely' }
 *     ]
 *   }
 * }
 */
export function getSafetySettingsFormat(
  blockedUsersDetails,
  mutedCommunitiesDetails
) {
  return {
    safety_and_privacy_settings: {
      blocked_users: blockedUsersDetails,
      muted_communities: mutedCommunitiesDetails,
    },
  };
}

/**
 * Retrieves the formatted feed settings for a user.
 * @param {Object} user - The user object containing feed settings.
 * @returns {Object} The formatted feed settings.
 * @property {Object} feed_settings - Object containing feed settings.
 * @property {boolean} feed_settings.Adult_content_flag - Flag indicating whether adult content is allowed in the feed.
 * @property {boolean} feed_settings.autoplay_media - Flag indicating whether media should autoplay in the feed.
 * @property {Object} feed_settings.communitiy_content_sort - Object containing settings for community content sorting.
 * @property {string} feed_settings.communitiy_content_sort.type - Type of sorting for community content.
 * @property {string} feed_settings.communitiy_content_sort.duration - Duration for sorting community content.
 * @property {boolean} feed_settings.communitiy_content_sort.sort_remember_per_community - Flag indicating whether sorting preferences should be remembered per community.
 * @property {Object} feed_settings.global_content - Object containing settings for global content.
 * @property {string} feed_settings.global_content.global_content_view - View setting for global content.
 * @property {boolean} feed_settings.global_content.global_remember_per_community - Flag indicating whether global content preferences should be remembered per community.
 * @property {boolean} feed_settings.Open_posts_in_new_tab - Flag indicating whether posts should open in a new tab.
 * @property {boolean} feed_settings.community_themes - Flag indicating whether community themes are enabled.
 * @example
 * Output:
 * {
 *   feed_settings: {
 *     Adult_content_flag: true,
 *     autoplay_media: false,
 *     communitiy_content_sort: {
 *       type: 'hot',
 *       duration: 'day',
 *       sort_remember_per_community: true
 *     },
 *     global_content: {
 *       global_content_view: 'card',
 *       global_remember_per_community: false
 *     },
 *     Open_posts_in_new_tab: true,
 *     community_themes: true
 *   }
 * }
 */
export function getFeedSettingsFormat(user) {
  return {
    feed_settings: {
      Adult_content_flag: user.feed_settings.Adult_content_flag,
      autoplay_media: user.feed_settings.autoplay_media,
      communitiy_content_sort: {
        type: user.feed_settings.communitiy_content_sort.type,
        duration: user.feed_settings.communitiy_content_sort.duration,
        sort_remember_per_community:
          user.feed_settings.communitiy_content_sort
            .sort_remember_per_community,
      },
      global_content: {
        global_content_view:
          user.feed_settings.global_content.global_content_view,
        global_remember_per_community:
          user.feed_settings.global_content.global_remember_per_community,
      },
      Open_posts_in_new_tab: user.feed_settings.Open_posts_in_new_tab,
      community_themes: user.feed_settings.community_themes,
    },
  };
}

/**
 * Retrieves the formatted notifications settings for a user.
 * @param {Object} user - The user object containing notification settings.
 * @returns {Object} The formatted notification settings.
 * @property {Object} notifications_settings - Object containing notification settings.
 * @property {boolean} notifications_settings.mentions - Flag indicating whether mentions are enabled.
 * @property {boolean} notifications_settings.comments - Flag indicating whether comments notifications are enabled.
 * @property {boolean} notifications_settings.upvotes_posts - Flag indicating whether upvotes on posts notifications are enabled.
 * @property {boolean} notifications_settings.upvotes_comments - Flag indicating whether upvotes on comments notifications are enabled.
 * @property {boolean} notifications_settings.replies - Flag indicating whether replies notifications are enabled.
 * @property {boolean} notifications_settings.new_followers - Flag indicating whether new followers notifications are enabled.
 * @property {boolean} notifications_settings.invitations - Flag indicating whether invitations notifications are enabled.
 * @property {boolean} notifications_settings.posts - Flag indicating whether posts notifications are enabled.
 * @property {boolean} notifications_settings.private_messages - Flag indicating whether private messages notifications are enabled.
 * @property {boolean} notifications_settings.chat_messages - Flag indicating whether chat messages notifications are enabled.
 * @property {boolean} notifications_settings.chat_requests - Flag indicating whether chat requests notifications are enabled.
 * @example
 * Output:
 * {
 *   notifications_settings: {
 *     mentions: true,
 *     comments: false,
 *     upvotes_posts: true,
 *     upvotes_comments: false,
 *     replies: true,
 *     new_followers: true,
 *     invitations: false,
 *     posts: true,
 *     private_messages: false,
 *     chat_messages: true,
 *     chat_requests: false
 *   }
 * }
 */
export function getNotificationsSettingsFormat(user) {
  return {
    notifications_settings: {
      mentions: user.notifications_settings.mentions,
      comments: user.notifications_settings.comments,
      upvotes_posts: user.notifications_settings.upvotes_posts,
      upvotes_comments: user.notifications_settings.upvotes_comments,
      replies: user.notifications_settings.replies,
      new_followers: user.notifications_settings.new_followers,
      invitations: user.notifications_settings.invitations,
      posts: user.notifications_settings.posts,
      private_messages: user.notifications_settings.private_messages,
      chat_messages: user.notifications_settings.chat_messages,
      chat_requests: user.notifications_settings.chat_requests,
    },
  };
}
/**
 * Retrieves the formatted email settings for a user.
 * @param {Object} user - The user object containing email settings.
 * @returns {Object} The formatted email settings.
 * @property {Object} email_settings - Object containing email settings.
 * @property {boolean} email_settings.new_follower_email - Flag indicating whether email notifications for new followers are enabled.
 * @property {boolean} email_settings.chat_request_email - Flag indicating whether email notifications for chat requests are enabled.
 * @property {boolean} email_settings.unsubscribe_from_all_emails - Flag indicating whether user unsubscribed from all emails.
 * @example
 * Output:
 * {
 *   email_settings: {
 *     new_follower_email: true,
 *     chat_request_email: false,
 *     unsubscribe_from_all_emails: false
 *   }
 * }
 */
export function getEmailSettingsFormat(user) {
  return {
    email_settings: {
      new_follower_email: user.email_settings.new_follower_email,
      chat_request_email: user.email_settings.chat_request_email,
      unsubscribe_from_all_emails:
        user.email_settings.unsubscribe_from_all_emails,
    },
  };
}

/**
 * Retrieves the formatted chat and messaging settings for a user.
 * @param {Object} user - The user object containing chat and messaging settings.
 * @returns {Object} The formatted chat and messaging settings.
 * @property {Object} chat_and_messaging_settings - Object containing chat and messaging settings.
 * @property {boolean} chat_and_messaging_settings.who_send_chat_requests_flag - Flag indicating who can send chat requests.
 * @property {boolean} chat_and_messaging_settings.who_send_private_messages_flag - Flag indicating who can send private messages.
 * @example
 * Output:
 * {
 *   chat_and_messaging_settings: {
 *     who_send_chat_requests_flag: true,
 *     who_send_private_messages_flag: false
 *   }
 * }
 */
export function getChatAndMsgsSettingsFormat(user) {
  return {
    chat_and_messaging_settings: {
      who_send_chat_requests_flag:
        user.chat_and_messaging_settings.who_send_chat_requests_flag,
      who_send_private_messages_flag:
        user.chat_and_messaging_settings.who_send_private_messages_flag,
    },
  };
}
/**
 * Updates the account settings for a user.
 * @param {Object} user - The user object to update.
 * @param {Object} accountSettings - The account settings to apply.
 * @returns {Object} The updated user object.
 */
export function setAccountSettings(user, accountSettings) {
  if (accountSettings?.gender) {
    user.gender = accountSettings.gender;
  }
  if (accountSettings?.country) {
    user.country = accountSettings.country;
  }
  return user;
}

/**
 * Updates the profile settings for a user.
 * @param {Object} user - The user object to update.
 * @param {Object} profileSettings - The profile settings to apply.
 * @returns {Object} The updated user object.
 */
export function setProfileSettings(user, profileSettings) {
  if (profileSettings && typeof profileSettings === "object") {
    if (profileSettings?.hasOwnProperty("display_name")) {
      user.display_name = profileSettings.display_name;
    }
    if (profileSettings?.hasOwnProperty("about")) {
      user.about = profileSettings.about;
    }
    user.profile_settings = {
      ...user.profile_settings,
      ...profileSettings,
    };
  }
  return user;
}

/**
 * Updates the feed settings for a user.
 * @param {Object} user - The user object to update.
 * @param {Object} feedSettings - The feed settings to apply.
 * @returns {Object} The updated user object.
 */
export function setFeedSettings(user, feedSettings) {
  if (feedSettings) {
    // Check and update Adult_content_flag
    if (feedSettings.Adult_content_flag !== undefined) {
      user.feed_settings.Adult_content_flag = feedSettings.Adult_content_flag;
    }
    // Check and update autoplay_media
    if (feedSettings.autoplay_media !== undefined) {
      user.feed_settings.autoplay_media = feedSettings.autoplay_media;
    }
    // Check and update communitiy_content_sort
    if (feedSettings.communitiy_content_sort) {
      if (typeof feedSettings.communitiy_content_sort === "object") {
        user.feed_settings.communitiy_content_sort = {
          ...user.feed_settings.communitiy_content_sort,
          ...feedSettings.communitiy_content_sort,
        };
      }
    }
    // Check and update global_content
    if (feedSettings.global_content) {
      if (typeof feedSettings.global_content === "object") {
        user.feed_settings.global_content = {
          ...user.feed_settings.global_content,
          ...feedSettings.global_content,
        };
      }
    }
    // Check and update Open_posts_in_new_tab
    if (feedSettings.Open_posts_in_new_tab !== undefined) {
      user.feed_settings.Open_posts_in_new_tab =
        feedSettings.Open_posts_in_new_tab;
    }
    // Check and update community_themes
    if (feedSettings.community_themes !== undefined) {
      user.feed_settings.community_themes = feedSettings.community_themes;
    }
  }
  return user;
}

/**
 * Updates the notification settings for a user.
 * @param {Object} user - The user object to update.
 * @param {Object} notifSettings - The notification settings to apply.
 * @returns {Object} The updated user object.
 */
export function setNotificationSettings(user, notifSettings) {
  if (notifSettings && typeof notifSettings === "object") {
    user.notifications_settings = {
      ...user.notifications_settings,
      ...notifSettings,
    };
  }
  return user;
}

/**
 * Updates the email settings for a user.
 * @param {Object} user - The user object to update.
 * @param {Object} emailSettings - The email settings to apply.
 * @returns {Object} The updated user object.
 */
export function setEmailSettings(user, emailSettings) {
  if (emailSettings && typeof emailSettings === "object") {
    user.email_settings = {
      ...user.email_settings,
      ...emailSettings,
    };
  }
  return user;
}

/**
 * Updates the chat and messaging settings for a user.
 * @param {Object} user - The user object to update.
 * @param {Object} chatSettings - The chat and messaging settings to apply.
 * @returns {Object} The updated user object.
 */
export function setChatSettings(user, chatSettings) {
  if (chatSettings && typeof chatSettings === "object") {
    user.chat_and_messaging_settings = {
      ...user.chat_and_messaging_settings,
      ...chatSettings,
    };
  }
  return user;
}
