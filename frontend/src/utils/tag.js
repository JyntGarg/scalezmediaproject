import _clone from "lodash/clone";
import _escapeRegExp from "lodash/escapeRegExp";
import _uniqBy from "lodash/uniqBy";

export function swapTags(text) {
  let displayText = _clone(text);
  const tags = text.match(/@\{\{[^\}]+\}\}/gi) || [];
  tags.forEach((myTag) => {
    const tagData = myTag.slice(3, -2);
    const tagDataArray = tagData.split("||");
    const tagDisplayValue = tagDataArray[2];
    displayText = displayText.replace(new RegExp(_escapeRegExp(myTag), "gi"), tagDisplayValue);
  });

  // Parse markdown-like syntax
  // Replace **bold** with <strong>
  displayText = displayText.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

  // Replace *italic* with <em> (but not if it's part of **bold**)
  displayText = displayText.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em class="italic">$1</em>');

  // Replace @mentions with styled spans (simple mentions like @username)
  displayText = displayText.replace(/@(\w+)/g, '<span class="text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-1 rounded">@$1</span>');

  return displayText;
}

export function getUsersFromTags(text) {
  const tags = text.match(/@\{\{[^\}]+\}\}/gi) || [];
  const allUserIds = tags.map((myTag) => {
    const tagData = myTag.slice(3, -2);
    const tagDataArray = tagData.split("||");
    return { _id: tagDataArray[1], name: tagDataArray[2] };
  });
  return _uniqBy(allUserIds, (myUser) => myUser._id);
}
