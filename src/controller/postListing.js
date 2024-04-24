import { Post } from "../db/models/Post.js";
import { verifyAuthToken } from "./userAuth.js";
import { User } from "../db/models/User.js";
import { getSortCriteria } from "../utils/lisitng.js";
import { getPostsHelper } from "../services/lisitngs.js";
import { checkVotesMiddleware } from "../services/posts.js";
export async function getPostsPaginated(
  request,
  pageNumber = 1,
  pageSize = 10,
  sortBy
) {
  try {
    let user = null;

    // Check if request has Authorization header
    if (request.headers.authorization) {
      const {
        success,
        err,
        status,
        user: authenticatedUser,
        msg,
      } = await verifyAuthToken(request);
      if (!authenticatedUser) {
        return { success, err, status, user: authenticatedUser, msg };
      }
      user = authenticatedUser;
    }

    // Calculate the offset based on pageNumber and pageSize
    const offset = (pageNumber - 1) * pageSize;

    // Fetch posts with pagination and sorting
    var posts = await getPostsHelper(user, offset, pageSize, sortBy);
    // console.log(posts);
    if (user) posts = await checkVotesMiddleware(user, posts);
    return {
      success: true,
      status: 200,
      content: posts,
      msg: "Posts retrieved successfully.",
    };
  } catch (error) {
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}
