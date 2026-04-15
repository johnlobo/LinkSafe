export type AutoFillBookmarkDetailsInput = { url: string };
export type AutoFillBookmarkDetailsOutput = { title?: string; favicon?: string };

export async function autoFillBookmarkDetails(
  input: AutoFillBookmarkDetailsInput
): Promise<AutoFillBookmarkDetailsOutput> {
  const base = process.env.NEXT_PUBLIC_APP_BASEPATH || '';
  try {
    const response = await fetch(
      `${base}/api/autofill?url=${encodeURIComponent(input.url)}`
    );
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}
