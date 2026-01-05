import type { SyncData, VideoData } from "../common";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 拼多多视频发布器
 */
export async function VideoPinduoduo(data: SyncData): Promise<void> {
  console.log("🚀 开始拼多多视频发布流程...");

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  try {
    if (!window.location.href.includes("pinduoduo.com")) {
      console.error("❌ 不在拼多多页面");
      return;
    }

    if (!data?.data) {
      console.error("❌ 缺少视频数据");
      return;
    }

    const { content, video, title, tags, cover } = data.data as VideoData;
    console.log("📝 视频数据:", { title: title?.substring(0, 50), hasVideo: !!video, hasCover: !!cover });

    // ========== 步骤1: 上传视频 ==========
    if (!video) {
      console.error("❌ 缺少视频文件");
      return;
    }

    console.log("📹 上传视频...");

    // 先点击"添加视频"按钮触发文件选择
    const addVideoBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("添加视频"),
    );
    if (addVideoBtn) {
      (addVideoBtn as HTMLButtonElement).click();
      console.log("✅ 已点击添加视频按钮");
      await sleep(500);
    }

    // 获取视频文件
    let file: File;
    if (video.videoFile) {
      file = video.videoFile;
    } else {
      const res = await fetch(video.url);
      const buf = await res.arrayBuffer();
      const ext = video.name.split(".").pop() || "mp4";
      const name = `${video.name.replace(/\.[^/.]+$/, "")}.${ext}`;
      file = new File([buf], name, { type: "video/mp4" });
    }

    // 等待文件输入框出现
    let fileInput: HTMLInputElement | null = null;
    for (let i = 0; i < 10; i++) {
      fileInput = document.querySelector('input[type="file"][accept*="mp4"]') as HTMLInputElement;
      if (fileInput) break;
      await sleep(500);
    }

    if (!fileInput) {
      console.error("❌ 未找到文件输入框");
      return;
    }

    // 设置文件
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    console.log("✅ 文件已设置");

    // 等待上传完成（等待描述输入框出现）
    console.log("⏳ 等待视频上传...");
    let descEditor: HTMLElement | null = null;
    for (let i = 0; i < 60; i++) {
      descEditor = document.querySelector('[contenteditable="true"][class*="sabo"]');
      if (descEditor) {
        console.log("✅ 上传完成，表单已显示");
        break;
      }
      await sleep(1000);
    }

    if (!descEditor) {
      console.log("⚠️ 描述编辑器未找到，继续执行");
    }

    // ========== 步骤2: 填写描述 ==========
    if (descEditor) {
      // 合并描述和标签
      let finalContent = content || "";

      // 在描述末尾追加标签
      if (tags?.length) {
        const tagText = tags
          .slice(0, 5)
          .map((t) => `#${t}`)
          .join(" ");
        finalContent = finalContent ? `${finalContent} ${tagText}` : tagText;
      }

      if (finalContent) {
        console.log("📝 填写描述和标签:", finalContent.substring(0, 50));
        descEditor.focus();
        descEditor.textContent = finalContent;
        descEditor.dispatchEvent(new Event("input", { bubbles: true }));
        descEditor.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ 描述填写完成");
        await sleep(500);
      }
    }

    // ========== 步骤3: 上传封面 ==========
    if (cover) {
      console.log("🖼️ 上传封面:", cover.name);

      // 等待视频上传完成（检查"视频上传成功"或编辑封面按钮可用）
      console.log("⏳ 等待视频上传完成...");
      for (let i = 0; i < 60; i++) {
        const successText = Array.from(document.querySelectorAll("*")).find(
          (el) => el.childNodes.length === 1 && el.textContent?.includes("视频上传成功"),
        );

        const editCoverBtn = Array.from(document.querySelectorAll("button")).find((b) =>
          b.textContent?.includes("编辑封面"),
        );

        if (successText || (editCoverBtn && !editCoverBtn.disabled)) {
          console.log("✅ 视频上传完成");
          break;
        }
        await sleep(1000);
      }

      // 点击编辑封面按钮
      const editCoverBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("编辑封面"),
      );
      if (editCoverBtn && !editCoverBtn.disabled) {
        (editCoverBtn as HTMLButtonElement).click();
        console.log("✅ 已打开封面对话框");
        await sleep(500);

        // 点击本地上传
        const localUploadTab = Array.from(document.querySelectorAll("*")).find(
          (el) => el.childNodes.length === 1 && el.textContent?.trim() === "本地上传",
        );
        if (localUploadTab) {
          localUploadTab.click();
          await sleep(300);
        }

        // 查找图片文件输入
        const imgInput = document.querySelector('input[type="file"][accept*="jpg"]') as HTMLInputElement;
        if (imgInput) {
          let coverFile: File;
          if (cover.file) {
            coverFile = cover.file;
          } else {
            const res = await fetch(cover.url);
            const blob = await res.blob();
            coverFile = new File([blob], cover.name, { type: cover.type || "image/jpeg" });
          }

          const dt = new DataTransfer();
          dt.items.add(coverFile);
          imgInput.files = dt.files;
          imgInput.dispatchEvent(new Event("change", { bubbles: true }));
          console.log("✅ 封面文件已设置");

          // 等待图片加载和确定按钮可用
          console.log("⏳ 等待确定按钮可用...");
          for (let i = 0; i < 10; i++) {
            const confirmBtn = Array.from(document.querySelectorAll("button")).find(
              (b) => b.textContent?.trim() === "确定",
            ) as HTMLButtonElement;

            if (confirmBtn && !confirmBtn.disabled) {
              confirmBtn.click();
              console.log("✅ 已点击确定按钮");
              await sleep(500);
              break;
            }

            await sleep(500);
          }
        }
      }
    }

    // ========== 步骤4: 自动发布 ==========
    if (data.isAutoPublish) {
      console.log("🔄 自动发布...");

      // 等待发布按钮可用
      for (let i = 0; i < 30; i++) {
        const publishBtn = document.querySelector(
          'button[class*="publish"], button[class*="Publish"]',
        ) as HTMLButtonElement;
        const oneKeyBtn = Array.from(document.querySelectorAll("button")).find((b) =>
          b.textContent?.includes("一键发布"),
        ) as HTMLButtonElement;

        if (oneKeyBtn && !oneKeyBtn.disabled) {
          oneKeyBtn.click();
          console.log("✅ 已点击一键发布按钮");
          return;
        }

        if (publishBtn && !publishBtn.disabled) {
          publishBtn.click();
          console.log("✅ 已点击发布按钮");
          return;
        }

        await sleep(500);
      }

      console.error("❌ 发布按钮不可用");
    }

    console.log("✅ 拼多多视频发布流程完成");
  } catch (error) {
    console.error("❌ 拼多多视频发布失败:", error);
  }
}
