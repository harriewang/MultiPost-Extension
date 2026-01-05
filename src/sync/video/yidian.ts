import type { SyncData, VideoData } from "../common";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 一点号视频发布器 - Vue原生方案
 *
 * 策略: 通过 Object.getOwnPropertyDescriptor 获取 __vue__ 组件，操作 $data
 * 页面结构: 常规DOM (非Shadow DOM)
 */
export async function VideoYidian(data: SyncData): Promise<void> {
  console.log("🚀 开始一点号视频发布流程...");

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 获取 Vue 组件 (支持 Vue 2 __vue__ 属性描述符)
   */
  function getVue(el: Element | null): any {
    if (!el) return null;
    const descriptor = Object.getOwnPropertyDescriptor(el, "__vue__");
    return descriptor ? descriptor.value : (el as any).__vue__;
  }

  try {
    if (!window.location.href.includes("yidianzixun.com")) {
      console.error("❌ 不在一点号页面");
      return;
    }

    if (!data?.data) {
      console.error("❌ 缺少视频数据");
      return;
    }

    const { content, video, title, tags, cover } = data.data as VideoData;
    console.log("📝 视频数据:", { title: title?.substring(0, 50), contentLength: content?.length });

    // 等待页面加载
    await sleep(2000);

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

    // 查找上传组件
    const uploader = document.querySelector(".mp-uploader-container");
    if (!uploader) {
      console.error("❌ 未找到上传容器");
      return;
    }

    // 设置文件并触发上传
    const uploadVue = getVue(uploader);
    if (uploadVue) {
      uploadVue.$data.fileToBeUpload = file;
      uploadVue.$forceUpdate?.();
      console.log("✅ 已设置 fileToBeUpload");
    }

    // 触发文件选择
    const fileInput = uploader.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      console.log("✅ 已触发 change 事件");
    }

    // 等待上传
    console.log("⏳ 等待视频上传...");
    await sleep(15000);

    // 等待表单显示
    let uploadAfterVisible = false;
    for (let i = 0; i < 20; i++) {
      const uploadAfter = document.querySelector(".upload-after");
      if (uploadAfter && window.getComputedStyle(uploadAfter).display !== "none") {
        uploadAfterVisible = true;
        console.log("✅ 上传完成，表单已显示");
        break;
      }
      await sleep(500);
    }

    if (!uploadAfterVisible) {
      console.log("⚠️ 上传后表单未显示，继续执行");
    }

    // ========== 步骤2: 填写标题 ==========
    if (title) {
      console.log("📝 填写标题:", title);

      const editor = document.querySelector(".video-editor-container");
      const editorVue = getVue(editor);

      if (editorVue?.$data?.videos) {
        const videoKeys = Object.keys(editorVue.$data.videos);
        if (videoKeys.length > 0) {
          const videoData = editorVue.$data.videos[videoKeys[0]];
          if (videoData && videoData.title !== undefined) {
            videoData.title = title;
            console.log("✅ 通过 Vue 设置标题");
          }
        }
      }

      await sleep(500);
      const titleInput = document.querySelector('input[placeholder*="标题"], .title-input input') as HTMLInputElement;
      if (titleInput) {
        titleInput.value = title;
        titleInput.dispatchEvent(new Event("input", { bubbles: true }));
        titleInput.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ DOM 设置标题");
      }
    }

    // ========== 步骤3: 填写简介 ==========
    if (content) {
      console.log("📝 填写简介:", content?.substring(0, 50));

      const editor = document.querySelector(".video-editor-container");
      const editorVue = getVue(editor);

      if (editorVue?.$data?.videos) {
        const videoKeys = Object.keys(editorVue.$data.videos);
        if (videoKeys.length > 0) {
          const videoData = editorVue.$data.videos[videoKeys[0]];
          if (videoData && videoData.desc !== undefined) {
            videoData.desc = content;
            console.log("✅ 通过 Vue 设置简介");
          }
        }
      }

      await sleep(500);
      const descInput = document.querySelector(
        'textarea[placeholder*="简介"], .desc-input textarea',
      ) as HTMLTextAreaElement;
      if (descInput) {
        descInput.value = content;
        descInput.dispatchEvent(new Event("input", { bubbles: true }));
        descInput.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ DOM 设置简介");
      }
    }

    // ========== 步骤4: 添加标签 ==========
    if (tags?.length) {
      console.log("🏷️ 添加标签:", tags);

      // 查找标签输入组件 .tagsuginput-container
      let tagVue = null;

      // 循环等待直到找到或超时 (最多20秒)
      for (let attempt = 0; attempt < 40; attempt++) {
        const tagContainer = document.querySelector(".tagsuginput-container");

        if (tagContainer) {
          // 直接访问 __vue__ 属性
          tagVue = (tagContainer as any).__vue__;
        }

        if (tagVue?.$data?.tags !== undefined) {
          console.log("✅ 找到标签组件");
          break;
        }

        await sleep(500);
      }

      if (tagVue?.$data?.tags !== undefined) {
        // 合并标签，去重，限制最多8个
        const currentTags = tagVue.$data.tags as string[];
        const tagsToAdd = tags.filter((t) => !currentTags.includes(t));
        const newTags = [...currentTags, ...tagsToAdd].slice(0, 8);

        tagVue.$data.tags = newTags;
        console.log("✅ 标签添加完成:", tagVue.$data.tags);
      } else {
        console.log("⚠️ 未找到标签组件");
      }
    }

    // ========== 步骤5: 上传封面 ==========
    if (cover) {
      console.log("🖼️ 上传封面:", cover.name);

      // 点击封面容器打开对话框
      const coverContainer = document.querySelector(".cover-container");
      if (coverContainer) {
        (coverContainer as HTMLElement).click();
        console.log("✅ 已打开封面对话框");
        await sleep(1000);

        // 等待上传容器出现
        let uploadContainer: Element | null = null;
        for (let i = 0; i < 10; i++) {
          uploadContainer = document.querySelector(".upload-container");
          if (uploadContainer) break;
          await sleep(500);
        }

        if (uploadContainer) {
          // 查找图片文件输入
          const coverInput = uploadContainer.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
          if (coverInput) {
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
            coverInput.files = dt.files;
            coverInput.dispatchEvent(new Event("change", { bubbles: true }));
            console.log("✅ 封面文件已设置，等待上传...");

            // 等待图片上传完成（检查 localUploadImg 或等待确定按钮可用）
            await sleep(3000);

            // 查找并点击确定按钮
            const confirmBtn = uploadContainer.querySelector(".confirm-btn.btn-box") as HTMLButtonElement;
            if (confirmBtn) {
              // 检查按钮是否被禁用
              const isDisabled = confirmBtn.classList.contains("btn-disabled");

              if (!isDisabled) {
                confirmBtn.click();
                console.log("✅ 已点击确定按钮");

                // 等待对话框关闭
                const editTable = document.querySelector(".video-edit-table");
                const tableVue = getVue(editTable);
                for (let i = 0; i < 10; i++) {
                  if (tableVue?.$data?.isShowCoverDialog === false) {
                    console.log("✅ 封面对话框已关闭");
                    break;
                  }
                  await sleep(500);
                }
              } else {
                console.log("⚠️ 确定按钮被禁用，可能图片上传失败");
              }
            }
          } else {
            console.log("⚠️ 未找到封面上传输入框");
          }
        } else {
          console.log("⚠️ 封面上传容器未出现");
        }
      } else {
        console.log("⚠️ 未找到封面容器");
      }
    }

    // ========== 步骤6: 自动发布 ==========
    if (data.isAutoPublish) {
      console.log("🔄 自动发布...");

      for (let i = 0; i < 30; i++) {
        const publishBtn = document.querySelector("button.mp-btn-primary:not(.mp-btn-disabled)") as HTMLButtonElement;
        if (publishBtn?.textContent?.includes("发布")) {
          publishBtn.click();
          console.log("✅ 已点击发布按钮");
          return;
        }
        await sleep(500);
      }

      console.error("❌ 发布按钮不可用");
    }

    console.log("✅ 一点号视频发布流程完成");
  } catch (error) {
    console.error("❌ 一点号视频发布失败:", error);
  }
}
