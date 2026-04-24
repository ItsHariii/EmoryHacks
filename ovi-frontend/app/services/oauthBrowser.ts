import * as WebBrowser from 'expo-web-browser';

export async function openSupabaseOAuthBrowser(
  authorizeUrl: string,
  returnUrl: string
): Promise<WebBrowser.WebBrowserAuthSessionResult> {
  return WebBrowser.openAuthSessionAsync(authorizeUrl, returnUrl);
}
