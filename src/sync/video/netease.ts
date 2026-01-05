import type { SyncData, VideoData } from "../common";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 网易号视频发布器
 */
export async function VideoNetease(data: SyncData): Promise<void> {
  console.log("🚀 开始网易号视频发布流程...");

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  try {
    if (!window.location.href.includes("163.com")) {
      console.error("❌ 不在网易号页面");
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

    // 查找视频文件输入框
    const fileInputs = document.querySelectorAll('input[type="file"]');
    let videoInput: HTMLInputElement | null = null;
    for (const input of fileInputs) {
      if (input.accept.includes("video")) {
        videoInput = input as HTMLInputElement;
        break;
      }
    }

    if (!videoInput) {
      console.error("❌ 未找到视频文件输入框");
      return;
    }

    // 设置文件
    const dt = new DataTransfer();
    dt.items.add(file);
    videoInput.files = dt.files;
    videoInput.dispatchEvent(new Event("change", { bubbles: true }));
    console.log("✅ 视频文件已设置");

    // 等待视频上传完成（等待"上传完成"文本或标题输入框出现）
    console.log("⏳ 等待视频上传...");
    for (let i = 0; i < 60; i++) {
      const uploadComplete = Array.from(document.querySelectorAll("*")).find(
        (el) => el.childNodes.length === 1 && el.textContent?.includes("上传完成"),
      );

      const titleInput = document.querySelector('input.ne-input[placeholder*="5~30个字"]') as HTMLInputElement;

      if (uploadComplete || titleInput) {
        console.log("✅ 视频上传完成");
        break;
      }
      await sleep(1000);
    }

    // ========== 步骤2: 填写标题 ==========
    if (title) {
      console.log("📝 填写标题:", title);

      const titleInput = document.querySelector('input.ne-input[placeholder*="5~30个字"]') as HTMLInputElement;
      if (titleInput) {
        titleInput.value = title;
        titleInput.dispatchEvent(new Event("input", { bubbles: true }));
        titleInput.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ 标题填写完成");
        await sleep(500);
      }
    }

    // ========== 步骤2.5: 勾选原创 ==========
    console.log("✅ 勾选原创");
    const originalLabel = Array.from(document.querySelectorAll("*")).find(
      (el) => el.childNodes.length === 1 && el.textContent?.trim() === "原创",
    );
    if (originalLabel) {
      let parent = originalLabel.parentElement;
      while (parent && parent !== document.body) {
        const toggle = parent.querySelector("button");
        if (toggle) {
          // 检查是否已勾选
          const isActive = toggle.classList.contains("custom-switcher-active");
          if (!isActive) {
            (toggle as HTMLButtonElement).click();
            console.log("✅ 已勾选原创");
          } else {
            console.log("✅ 原创已勾选");
          }
          await sleep(300);
          break;
        }
        parent = parent.parentElement;
      }
    }

    // ========== 步骤3: 添加标签 ==========
    if (tags?.length) {
      console.log("🏷️ 添加标签:", tags);

      // 点击标签按钮打开输入框
      const tagBtn = Array.from(document.querySelectorAll("*")).find(
        (el) => el.childNodes.length === 1 && el.textContent?.includes("请添加3-5个标签"),
      );
      if (tagBtn) {
        (tagBtn as HTMLElement).click();
        await sleep(300);
      }

      // 等待标签输入框出现
      for (let i = 0; i < 10; i++) {
        const tagInput = document.querySelector("input.ne-tag-input") as HTMLInputElement;
        if (tagInput) {
          // 输入标签（用空格分隔）
          const tagText = tags.slice(0, 5).join(" ");
          tagInput.value = tagText;
          tagInput.dispatchEvent(new Event("input", { bubbles: true }));
          tagInput.dispatchEvent(new Event("change", { bubbles: true }));

          // 模拟回车确认
          tagInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
          tagInput.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));

          console.log("✅ 标签填写完成");
          await sleep(500);
          break;
        }
        await sleep(300);
      }
    }

    // ========== 步骤4: 上传封面 ==========
    if (cover) {
      console.log("🖼️ 上传封面:", cover.name);

      // 点击封面上传按钮
      const coverUploadBtn = document.querySelector(".videoPublishNew-cover-upload");
      if (coverUploadBtn) {
        (coverUploadBtn as HTMLElement).click();
        console.log("✅ 已打开封面对话框");
        await sleep(500);

        // 点击"本地上传"选项卡
        const localUploadTab = Array.from(document.querySelectorAll("*")).find(
          (el) => el.childNodes.length === 1 && el.textContent?.trim() === "本地上传",
        );
        if (localUploadTab) {
          localUploadTab.click();
          await sleep(300);
        }

        // 查找图片文件输入框
        const imgInputs = document.querySelectorAll('input[type="file"]');
        let imgInput: HTMLInputElement | null = null;
        for (const input of imgInputs) {
          if (input.accept.includes("image")) {
            imgInput = input as HTMLInputElement;
            break;
          }
        }

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

          // 等待确认按钮可用
          console.log("⏳ 等待确认按钮可用...");
          for (let i = 0; i < 20; i++) {
            const confirmBtn = Array.from(document.querySelectorAll("button")).find(
              (b) => b.textContent?.trim() === "确认",
            ) as HTMLButtonElement;

            if (confirmBtn && !confirmBtn.classList.contains("disabled") && !confirmBtn.disabled) {
              confirmBtn.click();
              console.log("✅ 已点击确认按钮");
              await sleep(500);
              break;
            }

            await sleep(500);
          }
        }
      }
    }

    // ========== 步骤5: 自动发布 ==========
    if (data.isAutoPublish) {
      console.log("🔄 自动发布...");

      // 等待发布按钮可用
      for (let i = 0; i < 30; i++) {
        const publishBtn = Array.from(document.querySelectorAll("button")).find(
          (b) => b.textContent?.trim() === "发布" && !b.disabled,
        ) as HTMLButtonElement;

        if (publishBtn) {
          publishBtn.click();
          console.log("✅ 已点击发布按钮");
          return;
        }

        await sleep(500);
      }

      console.error("❌ 发布按钮不可用");
    }

    console.log("✅ 网易号视频发布流程完成");
  } catch (error) {
    console.error("❌ 网易号视频发布失败:", error);
  }
}
