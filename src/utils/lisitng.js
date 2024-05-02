export function getSortCriteria(sortBy) {
  let sortCriteria;

  switch (sortBy) {
    case "relevance":
      sortCriteria = {
        created_at: -1,
        upvotes_count: -1,
        comments_count: -1,
        shares_count: -1,
      };
      break;
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
    case "mostcomments":
      sortCriteria = { comments_count: -1, created_at: -1 };
      break;
    default:
      sortCriteria = { created_at: -1 };
  }

  return sortCriteria;
}

export function getCommentSortCriteria(sortBy) {
  let sortCriteria;

  switch (sortBy) {
    case "relevance":
      sortCriteria = {
        created_at: -1,
        upvotes_count: -1,
      };
      break;
    case "top":
      sortCriteria = {
        created_at: -1,
        upvotes_count: -1,
      };
      break;
    case "new":
      sortCriteria = { created_at: -1 };
      break;
    default:
      sortCriteria = { created_at: -1 };
  }

  return sortCriteria;
}

export function getTimeSortCriteria(sortTime) {
  let sortCriteria;

  switch (sortTime) {
    case "pastYear":
      const currentDate = new Date();
      sortCriteria = new Date(
        currentDate.getFullYear() - 1,
        currentDate.getMonth(),
        currentDate.getDate()
      );
      break;
    case "pastMonth":
      const pastMonth = new Date();
      pastMonth.setMonth(pastMonth.getMonth() - 1); // Date of past month
      sortCriteria = pastMonth;
      break;
    case "pastWeek":
      const pastWeek = new Date();
      pastWeek.setDate(pastWeek.getDate() - 7); // Date of past week
      sortCriteria = pastWeek;
      break;
    case "past24Hours":
      const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000); // Date 24 hours ago
      sortCriteria = past24Hours;
      break;
    case "pastHour":
      const pastHour = new Date(Date.now() - 60 * 60 * 1000); // Date 1 hour ago
      sortCriteria = pastHour;
      break;
    default: // 'allTime' or any other invalid input
      sortCriteria = new Date(0); // Default sorting
      break;
  }

  return sortCriteria;
}
