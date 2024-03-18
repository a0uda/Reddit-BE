export function getAccountSettingsFormat(user) {
  return {
    account_settings: {
      email: user.email,
      verified_email_flag: user.verified_email_flag,
      country: user.country,
      gender: user.gender,
      gmail: user.gmail || "", // Handling optional property with default value
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
      country: user.country,
      gender: user.gender,
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
      who_send_chat_request_flag:
        user.chat_and_messaging_settings.who_send_chat_requests_flag,
      who_send_private_messages_flag:
        user.chat_and_messaging_settings.who_send_private_messages_flag,
    },
  };
}
