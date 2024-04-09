export function getSortCriteria(sortBy) {
  let sortCriteria;

  switch (sortBy) {
    case "best":
      sortCriteria = {
        created_at: -1,
        upvotes_count: -1,
        comments_count: -1,
        shares_count: -1,
      };
      break;
    case "hot":
      sortCriteria = {
        created_at: -1,
        upvotes_count: -1,
        comments_count: -1,
      };
      break;
    case "top":
      sortCriteria = {
        created_at: -1,
        upvotes_count: -1,
      };
      break;
    case "new":
      sortCriteria = { views_count: -1, created_at: -1 };
      break;
    default:
      sortCriteria = { created_at: -1 };
  }

  return sortCriteria;
}
