/**
 * Shared pagination math. Parses and clamps a page number, computes totals and the slice offset
 */
function paginate({ total, perPage, page }) {
  const totalPages = Math.ceil(total / perPage);

  let currentPage = parseInt(page, 10);
  if (Number.isNaN(currentPage) || currentPage < 1) currentPage = 1;

  const outOfRange = currentPage > totalPages && totalPages > 0;

  const startIndex = (currentPage - 1) * perPage;

  return {
    currentPage,
    totalPages,
    startIndex,
    outOfRange,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

module.exports = { paginate };
