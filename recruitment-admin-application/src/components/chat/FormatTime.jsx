import { formatDistanceToNow, parseISO } from 'date-fns';

export const FormatTime = ({ time }) => {
  let fullText = formatDistanceToNow(parseISO(time), { addSuffix: true });

  // Remove "about" if present
  fullText = fullText.replace("about ", "");

  // Handle "less than a minute ago"
  if (fullText.includes("less than a minute")) {
    return <span>just now</span>; // or "0m ago"
  }

  // Shorten the text
  const shortText = fullText
    .replace(" seconds ago", "s")
    .replace(" second ago", "s")
    .replace(" minutes ago", "m")
    .replace(" minute ago", "m")
    .replace(" hours ago", "h")
    .replace(" hour ago", "h")
    .replace(" days ago", "d")
    .replace(" day ago", "d")
    .replace(" months ago", "mo")
    .replace(" month ago", "mo")
    .replace(" years ago", "y")
    .replace(" year ago", "y");

  return <span>{shortText}</span>;
};
