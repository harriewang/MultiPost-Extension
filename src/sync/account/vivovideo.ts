import type { AccountInfo } from "../common";

/**
 * 获取vivo视频账户信息
 */
export async function getVivoVideoAccountInfo(): Promise<AccountInfo | null> {
  try {
    // 尝试从页面获取登录状态信息
    const loggedOutIndicators = [".login-btn", "button:has(.login-btn)", '[class*="login"]'];

    const isLoggedIn = !document.querySelector(loggedOutIndicators.join(","));
    if (!isLoggedIn) {
      return null;
    }

    // 从页面获取用户信息
    const usernameElement = document.querySelector('.user-name, .nickname, .username, [class*="name"]');
    const avatarElement = document.querySelector('.avatar img, .user-avatar img, [class*="avatar"] img');

    const result: AccountInfo = {
      provider: "vivovideo",
      accountId: "unknown",
      username: usernameElement?.textContent?.trim() || "vivo视频用户",
      description: "",
      profileUrl: "https://www.kaixinkan.com.cn/",
      avatarUrl: avatarElement ? (avatarElement as HTMLImageElement).src : "",
      extraData: null,
    };

    return result;
  } catch (error) {
    console.error("获取vivo视频账户信息失败:", error);
    return null;
  }
}
