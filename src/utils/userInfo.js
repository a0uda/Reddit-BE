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
