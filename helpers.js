function formatDate(date) {
  // Convert the date to a JavaScript Date object
  const formattedDate = new Date(date);

  // Format the date as desired (e.g., "MM/DD/YYYY")
  const options = { year: "numeric", month: "long", day: "numeric" };
  return formattedDate.toLocaleDateString("en-US", options);
}
