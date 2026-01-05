import type { SyncData, VideoData } from "../common";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 支付宝视频发布器
 */
export async function VideoAlipay(data: SyncData): Promise<void> {
  console.log("🚀 开始支付宝视频发布流程...");

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  try {
    if (!window.location.href.includes("alipay.com")) {
      console.error("❌ 不在支付宝页面");
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

    // 先点击"点击上传"按钮触发文件选择
    const uploadBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("点击上传"));
    if (uploadBtn) {
      (uploadBtn as HTMLButtonElement).click();
      console.log("✅ 已点击上传按钮");
      await sleep(500);
    }

    // 等待文件输入框出现
    let videoInput: HTMLInputElement | null = null;
    for (let i = 0; i < 10; i++) {
      const fileInputs = document.querySelectorAll('input[type="file"][accept*="video"]');
      for (const input of fileInputs) {
        videoInput = input as HTMLInputElement;
        break;
      }
      if (videoInput) break;
      await sleep(500);
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

    // 等待视频上传完成（等待标题输入框出现且可用）
    console.log("⏳ 等待视频上传...");
    for (let i = 0; i < 60; i++) {
      const titleInput = document.querySelector('input[placeholder*="标题"]') as HTMLInputElement;
      if (titleInput && !titleInput.disabled) {
        console.log("✅ 视频上传完成");
        break;
      }
      await sleep(1000);
    }

    // ========== 步骤2: 填写标题 ==========
    if (title) {
      console.log("📝 填写标题:", title);

      await sleep(500);
      const titleInput = document.querySelector('input[placeholder*="标题"]') as HTMLInputElement;
      if (titleInput) {
        titleInput.value = title;
        titleInput.dispatchEvent(new Event("input", { bubbles: true }));
        titleInput.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ 标题填写完成");
      }
    }

    // ========== 步骤3: 填写描述 ==========
    if (content) {
      console.log("📝 填写描述:", content?.substring(0, 50));

      await sleep(500);
      const descTextarea = document.querySelector("textarea.mentions-textarea__input") as HTMLTextAreaElement;
      if (descTextarea) {
        descTextarea.value = content;
        descTextarea.dispatchEvent(new Event("input", { bubbles: true }));
        descTextarea.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ 描述填写完成");
      }
    }

    // ========== 步骤4: 添加话题（使用标签） ==========
    if (tags?.length) {
      console.log("🏷️ 添加话题:", tags);

      // 在描述末尾追加话题标签
      const descTextarea = document.querySelector("textarea.mentions-textarea__input") as HTMLTextAreaElement;
      if (descTextarea) {
        const currentContent = descTextarea.value || "";
        const tagText = tags
          .slice(0, 5)
          .map((t) => `#${t}`)
          .join(" ");
        const newContent = currentContent ? `${currentContent} ${tagText}` : tagText;

        descTextarea.value = newContent;
        descTextarea.dispatchEvent(new Event("input", { bubbles: true }));
        descTextarea.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ 话题已添加到描述");
      }
    }

    // ========== 步骤5: 上传封面 ==========
    if (cover) {
      console.log("🖼️ 上传封面:", cover.name);

      // 等待视频上传完成后再上传封面
      await sleep(2000);

      // 点击封面上传触发器（通过coverWrapper找到带hover:cursor-pointer的子元素）
      const coverWrapper = Array.from(document.querySelectorAll("div")).find((el) => {
        const classes = el.className;
        return typeof classes === "string" && classes.includes("coverWrapper");
      });

      if (coverWrapper) {
        // 找到coverWrapper中带hover:cursor-pointer的可点击子元素
        const clickableDiv = Array.from(coverWrapper.querySelectorAll("div")).find((el) => {
          const classes = el.className;
          return typeof classes === "string" && classes.includes("hover:cursor-pointer");
        }) as HTMLElement;

        if (clickableDiv) {
          clickableDiv.click();
          console.log("✅ 已点击封面上传区域");
        }
      } else {
        console.log("⚠️ 未找到封面上传触发器");
      }

      // 等待对话框出现（无论是否点击成功）
      await sleep(1000);
      for (let i = 0; i < 10; i++) {
        const modalRoot = document.querySelector(".antd5-modal-root");
        if (modalRoot) {
          console.log("✅ 封面对话框已打开");

          // 点击"上传封面"标签页（第二个标签）
          const uploadTabs = document.querySelectorAll(".antd5-tabs-tab");
          if (uploadTabs.length >= 2) {
            (uploadTabs[1] as HTMLElement).click();
            console.log("✅ 已切换到上传封面标签");
            await sleep(500);
          }

          // 点击"上传图片"按钮触发文件选择
          const uploadImgBtn = Array.from(document.querySelectorAll("button")).find((b) =>
            b.textContent?.includes("上传图片"),
          );
          if (uploadImgBtn) {
            (uploadImgBtn as HTMLButtonElement).click();
            console.log("✅ 已点击上传图片按钮");
            await sleep(500);
          }

          // 查找文件输入框
          const fileInput = document.querySelector('input[type="file"][accept*=".jp"]') as HTMLInputElement;
          if (fileInput) {
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
            fileInput.files = dt.files;
            fileInput.dispatchEvent(new Event("change", { bubbles: true }));
            console.log("✅ 封面文件已设置");

            // 等待图片加载
            await sleep(3000);

            // 点击完成按钮
            const completeBtn = document.querySelector('button[data-aspm-desc="封面图选择-确认"]') as HTMLButtonElement;

            if (completeBtn && !completeBtn.disabled) {
              completeBtn.click();
              console.log("✅ 已点击完成按钮");
              await sleep(1000);
            }
          }
          break;
        }
        await sleep(500);
      }
    }

    // ========== 步骤6: 自动发布 ==========
    if (data.isAutoPublish) {
      console.log("🔄 自动发布...");

      // 等待发布按钮可用
      for (let i = 0; i < 30; i++) {
        const publishBtn = Array.from(document.querySelectorAll("button")).find(
          (b) => (b.textContent?.includes("确认发布") || b.textContent?.includes("发布视频")) && !b.disabled,
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

    console.log("✅ 支付宝视频发布流程完成");
  } catch (error) {
    console.error("❌ 支付宝视频发布失败:", error);
  }
}
