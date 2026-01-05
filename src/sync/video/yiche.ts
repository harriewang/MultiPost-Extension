import type { SyncData, VideoData } from "../common";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 易车视频发布器
 *
 * 功能：
 * - 自动上传视频文件
 * - 自动填写标题
 * - 自动填写视频简介
 * - 自动上传封面（含裁剪）
 * - 自动选择版权（原创）
 *
 * 注意：焦点图需要手动上传，提交按钮需要手动点击
 */
export async function VideoYiche(data: SyncData): Promise<void> {
  // ========== 辅助函数定义 ==========

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function clickElement(element: Element): void {
    (element as HTMLElement).click();
  }

  function findButtonByText(text: string): Element | null {
    const elements = document.querySelectorAll("button, a, [role='button'], .upload-content, .upload, i, span");
    for (const el of elements) {
      if (el.textContent?.includes(text)) {
        // 如果是 upload-content 或 upload，返回其可点击的父容器
        if (el.classList.contains("upload-content") || el.classList.contains("upload")) {
          const parent = el.closest(".upload-img-box, .avatar-uploader, .el-upload, .i-right");
          if (parent) return parent;
        }
        return el;
      }
    }
    return null;
  }

  function findFileInput(): HTMLInputElement | null {
    const input = document.querySelector('input[type="file"]');
    return input as HTMLInputElement | null;
  }

  function setFileInput(input: HTMLInputElement, file: File): void {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function blobUrlToFile(blobUrl: string, filename: string): Promise<File | null> {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error("[易车] ❌ blob URL 转换失败:", error);
      return null;
    }
  }

  async function waitForFormReady(): Promise<void> {
    const maxWait = 30;
    for (let i = 0; i < maxWait; i++) {
      // 检查并关闭提示弹窗
      const tips = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("我知道了"));
      if (tips) {
        clickElement(tips);
        console.log("[易车] ✅ 已关闭提示弹窗");
        await sleep(500);
      }

      const titleInput =
        document.querySelector('[role="textbox"]') ||
        document.querySelector('input[placeholder*="标题"]') ||
        document.querySelector('textarea[placeholder*="标题"]');
      if (titleInput) {
        return;
      }
      await sleep(1000);
    }
    console.warn("[易车] ⚠️ 表单加载超时");
  }

  async function uploadVideoFile(video: { url: string; name?: string }): Promise<boolean> {
    try {
      const uploadBtn = findButtonByText("点击上传视频");
      if (!uploadBtn) {
        console.error("[易车] ❌ 未找到视频上传按钮");
        return false;
      }

      console.log("[易车] 找到上传按钮，点击...");
      clickElement(uploadBtn);
      await sleep(500);

      const fileInput = findFileInput();
      if (!fileInput) {
        console.error("[易车] ❌ 未找到文件输入框");
        return false;
      }

      const file = await blobUrlToFile(video.url, video.name || "video.mp4");
      if (!file) {
        console.error("[易车] ❌ 文件转换失败");
        return false;
      }

      setFileInput(fileInput, file);
      console.log("[易车] ✅ 文件已添加到输入框:", file.name, file.size);
      console.log("[易车] ✅ 视频文件已添加，上传在后台进行");

      return true;
    } catch (error) {
      console.error("[易车] ❌ 上传视频异常:", error);
      return false;
    }
  }

  async function uploadCoverImage(cover: { url: string; name?: string }): Promise<boolean> {
    try {
      // 关闭可能的弹窗
      const tips = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("我知道了"));
      if (tips) {
        clickElement(tips);
        console.log("[易车] ✅ 已关闭提示弹窗");
        await sleep(500);
      }

      const uploadBtn = findButtonByText("上传封面");
      if (!uploadBtn) {
        console.error("[易车] ❌ 未找到封面上传按钮");
        return false;
      }

      console.log("[易车] 找到封面上传按钮，点击...");
      clickElement(uploadBtn);
      await sleep(500);

      const fileInput = findFileInput();
      if (!fileInput) {
        console.error("[易车] ❌ 未找到文件输入框");
        return false;
      }

      const file = await blobUrlToFile(cover.url, cover.name || "cover.jpg");
      if (!file) {
        return false;
      }

      setFileInput(fileInput, file);
      console.log("[易车] ✅ 封面文件已添加");
      await sleep(2000);

      await handleCoverCrop();

      return true;
    } catch (error) {
      console.error("[易车] ❌ 封面上传异常:", error);
      return false;
    }
  }

  async function uploadVerticalCoverImage(cover: { url: string; name?: string }): Promise<boolean> {
    try {
      // 关闭可能的弹窗
      const tips = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("我知道了"));
      if (tips) {
        clickElement(tips);
        console.log("[易车] ✅ 已关闭提示弹窗");
        await sleep(500);
      }

      const uploadBtn = findButtonByText("上传竖版封面");
      if (!uploadBtn) {
        console.error("[易车] ❌ 未找到竖版封面上传按钮");
        return false;
      }

      console.log("[易车] 找到竖版封面上传按钮，点击...");
      clickElement(uploadBtn);
      await sleep(500);

      const fileInput = findFileInput();
      if (!fileInput) {
        console.error("[易车] ❌ 未找到文件输入框");
        return false;
      }

      const file = await blobUrlToFile(cover.url, cover.name || "vertical_cover.jpg");
      if (!file) {
        return false;
      }

      setFileInput(fileInput, file);
      console.log("[易车] ✅ 竖版封面文件已添加");
      await sleep(2000);

      await handleCoverCrop();

      return true;
    } catch (error) {
      console.error("[易车] ❌ 竖版封面上传异常:", error);
      return false;
    }
  }

  async function uploadFocusImage(image: { url: string; name?: string }): Promise<boolean> {
    try {
      // 关闭可能的弹窗
      const tips = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("我知道了"));
      if (tips) {
        clickElement(tips);
        console.log("[易车] ✅ 已关闭提示弹窗");
        await sleep(500);
      }

      const uploadBtn = findButtonByText("上传焦点图");
      if (!uploadBtn) {
        console.error("[易车] ❌ 未找到焦点图上传按钮");
        return false;
      }

      console.log("[易车] 找到焦点图上传按钮，点击...");
      clickElement(uploadBtn);
      await sleep(500);

      const fileInput = findFileInput();
      if (!fileInput) {
        console.error("[易车] ❌ 未找到文件输入框");
        return false;
      }

      const file = await blobUrlToFile(image.url, image.name || "focus_image.jpg");
      if (!file) {
        return false;
      }

      setFileInput(fileInput, file);
      console.log("[易车] ✅ 焦点图文件已添加");
      await sleep(3000);

      return true;
    } catch (error) {
      console.error("[易车] ❌ 焦点图上传异常:", error);
      return false;
    }
  }

  async function handleCoverCrop(): Promise<void> {
    try {
      await sleep(1000);

      // 步骤1: 点击"完成裁剪"
      const cropBtn = findButtonByText("完成裁剪");
      if (cropBtn) {
        clickElement(cropBtn);
        console.log("[易车] ✅ 已点击完成裁剪");
        await sleep(2000);
      }

      // 步骤2: 点击"确定"按钮
      const buttons = Array.from(document.querySelectorAll("button"));
      const confirmBtn = buttons.find(
        (b) => b.textContent?.trim() === "确定" && b.classList.contains("el-button--primary"),
      );

      if (confirmBtn) {
        clickElement(confirmBtn);
        console.log("[易车] ✅ 已点击确定");
        await sleep(1000);
      }
    } catch (error) {
      console.warn("[易车] ⚠️ 裁剪处理失败:", error);
    }
  }

  function fillInputByPlaceholder(placeholder: string, value: string): void {
    const inputs = [
      document.querySelector(`input[placeholder*="${placeholder}"]`),
      document.querySelector(`textarea[placeholder*="${placeholder}"]`),
      document.querySelector(`[placeholder*="${placeholder}"]`),
    ];

    for (const input of inputs) {
      if (input) {
        const element = input as HTMLInputElement | HTMLTextAreaElement;
        element.value = value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("[易车] ✅ 已填写:", placeholder.substring(0, 10), value.substring(0, 30));
        return;
      }
    }

    const textbox = Array.from(document.querySelectorAll('[role="textbox"]')).find((el) => {
      const placeholder = el.getAttribute("aria-placeholder") || el.getAttribute("placeholder");
      return placeholder?.includes(placeholder.substring(0, 5));
    });

    if (textbox) {
      (textbox as HTMLInputElement).value = value;
      textbox.dispatchEvent(new Event("input", { bubbles: true }));
      textbox.dispatchEvent(new Event("change", { bubbles: true }));
      console.log("[易车] ✅ 已填写 textbox:", value.substring(0, 30));
      return;
    }

    console.warn("[易车] ⚠️ 未找到输入框:", placeholder);
  }

  function selectRadioByText(text: string): void {
    const radios = document.querySelectorAll('[role="radio"]');
    for (const radio of radios) {
      if (radio.textContent?.includes(text)) {
        clickElement(radio);
        console.log("[易车] ✅ 已选择:", text);
        return;
      }
    }

    const radioInputs = document.querySelectorAll('input[type="radio"]');
    for (const radio of radioInputs) {
      const label = radio.parentElement?.textContent || "";
      if (label.includes(text)) {
        (radio as HTMLInputElement).checked = true;
        radio.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("[易车] ✅ 已选择:", text);
        return;
      }
    }

    console.warn("[易车] ⚠️ 未找到单选框:", text);
  }

  // ========== 主流程 ==========

  console.log("[易车] ===== 开始发布流程 =====");
  console.log("[易车] 当前页面:", window.location.href);

  try {
    if (!window.location.href.includes("mp.yiche.com")) {
      console.error("[易车] ❌ 不在易车页面");
      return;
    }

    if (!data || !data.data) {
      console.error("[易车] ❌ 缺少数据");
      return;
    }

    const { content, video, title, cover, verticalCover, focusImage } = data.data as VideoData;
    console.log("[易车] 数据解析:", {
      hasTitle: !!title,
      hasContent: !!content,
      hasVideo: !!video,
      hasCover: !!cover,
      hasVerticalCover: !!verticalCover,
      hasFocusImage: !!focusImage,
      title: title?.substring(0, 30),
    });

    if (video?.url) {
      console.log("[易车] 步骤1/7: 上传视频文件");
      const success = await uploadVideoFile(video);
      if (!success) {
        console.error("[易车] ❌ 视频上传失败，终止流程");
        return;
      }
      console.log("[易车] ✅ 视频上传成功");
    } else {
      console.warn("[易车] ⚠️ 没有视频文件，跳过上传");
    }

    console.log("[易车] 步骤2/7: 等待表单加载");
    await waitForFormReady();
    console.log("[易车] ✅ 表单已加载");

    if (title) {
      console.log("[易车] 步骤3/7: 填写标题");
      fillInputByPlaceholder("标题最多可输入50字", title);
    }

    if (content) {
      console.log("[易车] 步骤4/7: 填写简介");
      fillInputByPlaceholder("简介最多可输入400字", content);
    }

    if (cover?.url) {
      console.log("[易车] 步骤5/7: 上传封面");
      await uploadCoverImage(cover);
    }

    if (verticalCover?.url) {
      console.log("[易车] 步骤6/7: 上传竖版封面");
      await uploadVerticalCoverImage(verticalCover);
    }

    if (focusImage?.url) {
      console.log("[易车] 步骤7/7: 上传焦点图");
      await uploadFocusImage(focusImage);
    }

    console.log("[易车] 选择版权: 原创");
    selectRadioByText("原创");

    console.log("[易车] ===== 发布流程完成 =====");
    console.log("[易车] ℹ️ 请手动点击提交按钮");
  } catch (error) {
    console.error("[易车] 💥 发布失败:", error);
  }
}

// 导出全局工具（用于调试）
if (typeof window !== "undefined") {
  (window as any).YicheMCP = {
    status: () => ({
      url: window.location.href,
      hasVideoInput: !!document.querySelector('input[type="file"]'),
      inputs: document.querySelectorAll('[role="textbox"], input, textarea').length,
    }),
  };
  console.log("[易车] ✅ YicheMCP 工具已加载");
}
