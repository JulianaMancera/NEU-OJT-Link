import { supabase } from "../../../supabase";

/**
 * Fetches all submitted week_numbers for the given user,
 * then returns the first missing integer in [1..].
 */
export async function getNextExpectedWeek(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("weekly_report")
    .select("week_number")
    .eq("user_id", userId);

  if (error || !data) {
    console.error("Could not fetch submitted weeks:", error?.message);
    return 1;
  }

  // extract, filter and sort
  const weeks = data
    .map((r) => r.week_number)
    .filter((w): w is number => typeof w === "number" && w > 0)
    .sort((a, b) => a - b);

  // find first missing integer
  let next = 1;
  for (const w of weeks) {
    if (w === next) next++;
    else if (w > next) break;
  }

  return next;
}
