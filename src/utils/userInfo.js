export function getFriendsFormat(user) {
  return {
    _id: user._id,
    created_at: user.created_at,
    email: user.email,
    username: user.username,
    profile_settings: {
      display_name: user.profile_settings.display_name,
      about: user.profile_settings.about,
      profile_picture: user.profile_settings.profile_picture,
      banner_picture: user.profile_settings.banner_picture,
    },
    country: user.country,
    gender: user.gender,
  };
}
