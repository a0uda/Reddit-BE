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

export function setAccountSettings(user, accountSettings) {
  if (accountSettings?.gender) {
    user.gender = accountSettings.gender;
  }
  if (accountSettings?.country) {
    user.country = accountSettings.country;
  }
  return user;
}

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

export function setFeedSettings(user, feedSettings) {
  if (
    feedSettings?.communitiy_content_sort &&
    typeof feedSettings?.communitiy_content_sort === "object"
  ) {
    user.feed_settings.communitiy_content_sort = {
      ...user.feed_settings.communitiy_content_sort,
      ...feedSettings.communitiy_content_sort,
    };
  }
  if (feedSettings && typeof feedSettings === "object") {
    user.feed_settings = {
      ...user.feed_settings,
      ...feedSettings,
    };
  }
  return user;
}

export function setNotificationSettings(user, notifSettings) {
  if (notifSettings && typeof notifSettings === "object") {
    user.notifications_settings = {
      ...user.notifications_settings,
      ...notifSettings,
    };
  }
  return user;
}

export function setEmailSettings(user, emailSettings) {
  if (emailSettings && typeof emailSettings === "object") {
    user.email_settings = {
      ...user.email_settings,
      ...emailSettings,
    };
  }
  return user;
}

export function setChatSettings(user, chatSettings) {
  if (chatSettings && typeof chatSettings === "object") {
    user.chat_and_messaging_settings = {
      ...user.chat_and_messaging_settings,
      ...chatSettings,
    };
  }
  return user;
}
