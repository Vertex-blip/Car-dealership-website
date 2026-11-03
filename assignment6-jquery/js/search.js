/* Assignment 6, Task 3: literal, case-insensitive highlighting without HTML injection. */
$(document).ready(function () {
  "use strict";
  const Apex = (window.Apex = window.Apex || {});

  Apex.highlight = function (element, query) {
    // Restore only marks created by this helper. Preserve links and other markup.
    $(element).find("mark.search-highlight").each(function () {
      $(this).replaceWith(document.createTextNode(this.textContent));
    });
    element.normalize();
    const keyword = String(query || "").trim();
    if (!keyword) return 0;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "gi");
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement.closest("script, style, button, input, textarea, .visually-hidden")
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let total = 0;
    nodes.forEach(function (node) {
      const value = node.nodeValue;
      const matches = Array.from(value.matchAll(pattern));
      if (!matches.length) return;
      const fragment = document.createDocumentFragment();
      let start = 0;
      matches.forEach(function (match) {
        fragment.append(document.createTextNode(value.slice(start, match.index)));
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        $(mark).text(match[0]);
        fragment.append(mark);
        start = match.index + match[0].length;
        total += 1;
      });
      fragment.append(document.createTextNode(value.slice(start)));
      node.replaceWith(fragment);
    });
    return total;
  };

  const $search = $("#faqSearch");
  if (!$search.length) return;
  const $items = $(".faq-list .faq-item");
  let previousOpen = null;
  $search.on("input", function () {
    const query = $(this).val().trim();
    if (query && previousOpen === null) previousOpen = $items.map(function () { return this.open; }).get();
    let count = 0;
    $items.each(function (index) {
      const matches = Apex.highlight(this, query);
      count += matches;
      // Show all matching text immediately, including matches inside an answer.
      if (query) this.open = matches > 0;
      else if (previousOpen) this.open = previousOpen[index];
    });
    if (!query) previousOpen = null;
    $("#clearFaqSearch").prop("hidden", !query);
    $("#faqSearchStatus").text(query
      ? `${count} ${count === 1 ? "match" : "matches"} across all questions and answers.${count ? "" : " Try another keyword."}`
      : "Search every question and answer.");
  });
  $("#clearFaqSearch").on("click", function () {
    $search.val("").trigger("input").trigger("focus");
  });
});
