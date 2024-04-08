/**
 * Utility functions related to user operations.
 * @module users/utils/userInfo
 */

/**
 * Retrieves and formats user information into a simplified follower/following object.
 * This function extracts specific fields from a user object.
 * @param {Object} user - The user object containing information about the user.
 * @returns {Object} A friend object with selected user information.
 * @property {ObjectId} _id - The unique identifier of the user.
 * @property {Date} created_at - The date and time when the user account was created.
 * @property {string} email - The email address of the user.
 * @property {string} username - The username of the user.
 * @property {string} display_name - The display name of the user.
 * @property {string} about - A brief description or bio of the user.
 * @property {string} profile_picture - The URL or path to the profile picture of the user.
 * @property {string} banner_picture - The URL or path to the banner picture of the user.
 * @property {string} country - The country of residence of the user.
 * @property {string} gender - The gender of the user.
 * @example
 * Output:
 * {
 *  _id: '123456789',
 *  created_at: '2023-01-15T00:00:00.000Z',
 *  email: 'example@example.com',
 *  username: 'example_user',
 *  display_name: 'Example User',
 *  about: 'A passionate developer',
 *  profile_picture: 'https://example.com/profile.jpg',
 *  banner_picture: 'https://example.com/banner.jpg',
 *  country: 'United States',
 *  gender: 'Male'
 * }
 */

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

/**
 * Retrieves and formats user information into an object containing about section details.
 * This asynchronous function extracts specific fields from a user object to create an about section object.
 * @param {Object} user - The user object containing information about the user.
 * @returns {Promise<Object>} A Promise that resolves to an object containing about section details of the user.
 * @property {ObjectId} _id - The unique identifier of the user.
 * @property {string} username - The username of the user.
 * @property {Date} created_at - The date and time when the user account was created.
 * @property {string} email - The email address of the user.
 * @property {boolean} verified_email_flag - A flag indicating whether the user's email is verified.
 * @property {string} gmail - The Gmail address associated with the user.
 * @property {boolean} connected_google - A flag indicating whether the user is connected to Google services.
 * @property {string} facebook_email - The email address associated with the user's Facebook account.
 * @property {string} display_name - The display name of the user.
 * @property {string} about - A brief description or bio of the user.
 * @property {Object} social_links - An object containing social media links associated with the user.
 * @property {string} profile_picture - The URL or path to the profile picture of the user.
 * @property {string} banner_picture - The URL or path to the banner picture of the user.
 * @property {string} country - The country of residence of the user.
 * @property {string} gender - The gender of the user.
 * @example
 * Output:
 * {
 *   _id: '123456789',
 *   username: 'example_user',
 *   created_at: '2023-01-15T00:00:00.000Z',
 *   email: 'example@example.com',
 *   verified_email_flag: true,
 *   gmail: 'example@gmail.com',
 *   connected_google: true,
 *   facebook_email: 'example@facebook.com',
 *   display_name: 'Example User',
 *   about: 'A passionate developer',
 *   social_links: {
 *     twitter: 'https://twitter.com/example_user',
 *     linkedin: 'https://www.linkedin.com/in/example_user'
 *   },
 *   profile_picture: 'https://example.com/profile.jpg',
 *   banner_picture: 'https://example.com/banner.jpg',
 *   country: 'United States',
 *   gender: 'Male'
 * }
 */
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
