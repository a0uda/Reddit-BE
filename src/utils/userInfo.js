
export function getFriendsFormat(user) {
  return {
    _id: user._id,
    created_at: user.created_at,
    email: user.email,
    username: user.username,
    display_name: user.display_name,
    about: user.about,
    profile_picture: user.profile_picture,
    banner_picture: user.banner_picture,
    country: user.country,
    gender: user.gender,
  };
}

export async function getAboutFormat(user) {
  return {
    _id: user._id,
    username: user.username,
    created_at: user.created_at,
    email: user.email,
    verified_email_flag: user.verified_email_flag,
    gmail: user.gmail,
    connected_google: user.connected_google,
    facebook_email: user.facebook_email,
    display_name: user.display_name,
    about: user.about,
    social_links: user.social_links,
    profile_picture: user.profile_picture,
    banner_picture: user.banner_picture,
    country: user.country,
    gender: user.gender,
  };
}
