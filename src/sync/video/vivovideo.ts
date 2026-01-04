import type { SyncData, VideoData } from "../common";

export async function VideoVivoVideo(data: SyncData): Promise<void> {
  console.log("🚀 开始vivo视频发布流程...");

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  async function waitForUrlChange(expectedPath: string, timeout = 30000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (window.location.href.includes(expectedPath)) {
        console.log("✅ URL已切换到:", expectedPath);
        return;
      }
      await sleep(500);
    }
    console.log("⚠️ URL未在预期时间内切换");
  }

  async function uploadVideo(file: File): Promise<void> {
    console.log("🎬 开始视频上传流程");
    await sleep(2000);

    // 查找文件输入框 - 支持 .mp4,.mov,.mkv 格式
    const fileInput = document.querySelector('input[type="file"][accept*="mp4"]') as HTMLInputElement;
    if (!fileInput) {
      throw new Error("未找到视频文件输入框");
    }

    console.log("✅ 找到视频文件输入框");

    // 设置文件
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    console.log("✅ 视频文件已设置");

    // 等待URL切换到发布页面
    await waitForUrlChange("publishShort");
    await sleep(3000);
  }

  async function fillDescription(contentText: string): Promise<void> {
    console.log("📝 开始填写描述:", contentText.substring(0, 50));

    // 等待描述编辑区域加载
    await sleep(2000);

    // vivo视频使用 contenteditable div 进行描述输入
    const descSelectors = ["div.add-text[contenteditable='true']", 'div[contenteditable="true"]'];

    for (const selector of descSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of Array.from(elements)) {
        const el = element as HTMLElement;
        if (el.offsetParent !== null) {
          // 聚焦并填写内容
          el.focus();

          // 使用 clipboard event 模拟粘贴
          const pasteEvent = new ClipboardEvent("paste", {
            bubbles: true,
            cancelable: true,
            clipboardData: new DataTransfer(),
          });
          (pasteEvent.clipboardData as DataTransfer).setData("text/plain", contentText);
          el.dispatchEvent(pasteEvent);

          console.log("✅ 描述已填写");
          el.blur();
          return;
        }
      }
    }

    console.log("⚠️ 未找到描述输入框");
  }

  async function fillTitle(titleText: string): Promise<void> {
    console.log("📝 开始填写标题:", titleText);

    // vivo视频的标题可能在URL参数中或者单独的输入框
    // 先尝试查找标题输入框
    const titleSelectors = ['input[placeholder*="标题"]', 'input[placeholder*="请输入标题"]', "input.el-input__inner"];

    for (const selector of titleSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of Array.from(elements)) {
        const input = element as HTMLInputElement;
        if (input.offsetParent !== null && !input.placeholder?.includes("请选择")) {
          input.value = titleText;
          input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
          input.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
          console.log("✅ 标题已填写:", titleText);
          return;
        }
      }
    }

    // 如果没有找到标题输入框，vivo可能使用文件名作为标题
    console.log("⚠️ 未找到标题输入框，将使用文件名作为标题");
  }

  async function setScheduledPublishTime(scheduledTime: string): Promise<void> {
    console.log("⏰ 设置定时发布:", scheduledTime);

    // 查找"定时发布"单选按钮
    const radioButtons = document.querySelectorAll('input[type="radio"].el-radio__original');
    let scheduledRadio: HTMLInputElement | null = null;

    for (const radio of Array.from(radioButtons)) {
      const label = radio.closest("label")?.textContent || "";
      if (label.includes("定时发布")) {
        scheduledRadio = radio as HTMLInputElement;
        break;
      }
    }

    if (!scheduledRadio) {
      console.log("⚠️ 未找到定时发布选项");
      return;
    }

    // 点击定时发布选项
    scheduledRadio.click();
    scheduledRadio.dispatchEvent(new Event("change", { bubbles: true }));
    console.log("✅ 已选择定时发布");

    await sleep(1000);

    // 查找日期时间输入框
    const dateInput = document.querySelector('input[type="text"][readonly]') as HTMLInputElement;
    if (!dateInput) {
      console.log("⚠️ 未找到日期时间输入框");
      return;
    }

    // 设置日期时间（格式：yyyy-MM-dd HH:mm）
    const date = new Date(scheduledTime);
    const formattedDate = formatDate(date);

    dateInput.value = formattedDate;
    dateInput.dispatchEvent(new Event("input", { bubbles: true }));
    dateInput.dispatchEvent(new Event("change", { bubbles: true }));

    console.log("✅ 定时发布时间已设置:", formattedDate);
  }

  try {
    if (!data || !data.data) {
      console.error("❌ 缺少视频数据");
      return;
    }

    const { content, video, title, tags, scheduledPublishTime } = data.data as VideoData;

    if (!video) {
      console.error("❌ 缺少视频文件");
      return;
    }

    // 下载视频文件
    console.log("📥 下载视频文件...");
    const response = await fetch(video.url);
    const arrayBuffer = await response.arrayBuffer();
    const videoFile = new File([arrayBuffer], video.name, { type: video.type });
    console.log("✅ 视频文件准备完成");

    // 步骤1: 上传视频
    console.log("📤 开始上传视频...");
    await uploadVideo(videoFile);

    // 步骤2: 填写标题
    if (title) {
      await fillTitle(title);
    }

    // 步骤3: 填写描述（包含标签作为话题）
    let finalContent = content || "";
    if (tags && tags.length > 0) {
      const tagString = tags.map((tag) => `#${tag}`).join(" ");
      finalContent = `${finalContent} ${tagString}`.trim();
      console.log("📝 合并标签后的内容:", finalContent.substring(0, 100));
    }

    if (finalContent) {
      await fillDescription(finalContent);
    }

    // 步骤4: 设置定时发布（如果指定）
    if (scheduledPublishTime) {
      await setScheduledPublishTime(scheduledPublishTime);
    }

    // 自动发布
    if (data.isAutoPublish) {
      await sleep(2000);

      // 查找提交按钮 - ElementUI 主要按钮样式
      const submitSelectors = [
        "button.el-button--primary.form-btn",
        "button.form-btn.el-button--primary",
        'button:contains("提交")',
        'button:contains("发布")',
      ];

      let submitButton: HTMLElement | null = null;

      // 先通过类名查找
      for (const selector of submitSelectors) {
        if (selector.includes(":contains")) {
          // 通过文本查找
          const buttons = document.querySelectorAll("button");
          for (const button of Array.from(buttons)) {
            if (button.textContent?.includes("提交") || button.textContent?.includes("发布")) {
              submitButton = button as HTMLElement;
              break;
            }
          }
        } else {
          submitButton = document.querySelector(selector) as HTMLElement;
        }
        if (submitButton) break;
      }

      if (submitButton) {
        console.log("🚀 点击发布按钮");
        submitButton.click();
      } else {
        console.log("⚠️ 未找到发布按钮");
      }
    }

    console.log("✅ vivo视频发布流程完成");
  } catch (error) {
    console.error("❌ vivo视频发布失败:", error);
  }
}
