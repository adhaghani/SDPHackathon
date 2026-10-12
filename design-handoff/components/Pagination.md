# Pagination

Shared Previous / Next control with a page status, used on Borrow, Events and Rewards activity.

**Consumer provides:** current page, total pages and the two handlers or links. Lives at `apps/web/components/shared/pagination.tsx`.

- Previous is disabled on page 1 and Next on the last page; both keep their width.
- The status reads "Page 2 of 7" in tabular numerals.
