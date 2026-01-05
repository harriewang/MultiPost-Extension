import type { SyncData, VideoData } from "../common";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 搜狐号视频发布器
 */
export async function VideoSohu(data: SyncData): Promise<void> {
  console.log("🚀 开始搜狐号视频发布流程...");

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  try {
    if (!window.location.href.includes("mp.sohu.com")) {
      console.error("❌ 不在搜狐号页面");
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

    // 等待文件输入框出现并查找
    let videoInput: HTMLInputElement | null = null;
    for (let i = 0; i < 10; i++) {
      const fileInputs = document.querySelectorAll('input[type="file"]');
      for (const input of fileInputs) {
        const accept = input.getAttribute("accept") || "";
        if (accept.includes("video") || accept.includes("mp4")) {
          videoInput = input as HTMLInputElement;
          break;
        }
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

    // 等待视频上传完成（等待"上传成功"文本或描述输入框出现）
    console.log("⏳ 等待视频上传...");
    for (let i = 0; i < 60; i++) {
      const uploadSuccess = Array.from(document.querySelectorAll("*")).find(
        (el) => el.childNodes.length === 1 && el.textContent?.includes("上传成功"),
      );

      const descTextarea = document.querySelector("textarea.abstract-main-textarea") as HTMLTextAreaElement;

      if (uploadSuccess || descTextarea) {
        console.log("✅ 视频上传完成");
        break;
      }
      await sleep(1000);
    }

    // ========== 步骤2: 填写标题 ==========
    if (title) {
      console.log("📝 填写标题:", title);

      await sleep(500);
      const titleInput = document.querySelector('input[placeholder*="请输入标题"]') as HTMLInputElement;
      if (titleInput) {
        titleInput.value = title;
        titleInput.dispatchEvent(new Event("input", { bubbles: true }));
        titleInput.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ 标题填写完成");
      }
    }

    // ========== 步骤3: 填写简介 ==========
    if (content) {
      console.log("📝 填写简介:", content?.substring(0, 50));

      const descTextarea = document.querySelector("textarea.abstract-main-textarea") as HTMLTextAreaElement;
      if (descTextarea) {
        descTextarea.value = content;
        descTextarea.dispatchEvent(new Event("input", { bubbles: true }));
        descTextarea.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ 简介填写完成");
        await sleep(500);
      }
    }

    // ========== 步骤4: 添加标签（作为话题） ==========
    if (tags?.length) {
      console.log("🏷️ 添加话题:", tags);

      // 查找话题输入框（需要找到可编辑的那个）
      const topicInputs = document.querySelectorAll('input[placeholder*="关键词搜索"]');
      let topicInput: HTMLInputElement | null = null;

      for (const input of topicInputs) {
        // 找到可编辑的输入框（不是 readonly）
        if (!input.hasAttribute("readonly")) {
          topicInput = input as HTMLInputElement;
          break;
        }
      }

      if (topicInput) {
        // 逐个添加话题（最多添加5个）
        const tagsToAdd = tags.slice(0, 5);

        for (const tag of tagsToAdd) {
          console.log("📝 添加话题:", tag);

          // 清空并输入新话题
          topicInput.value = tag;
          topicInput.focus();
          topicInput.dispatchEvent(new Event("input", { bubbles: true }));
          topicInput.dispatchEvent(new Event("change", { bubbles: true }));
          await sleep(800);

          // 等待搜索结果出现并点击匹配的话题
          let found = false;
          for (let i = 0; i < 5; i++) {
            // 查找搜索结果容器和匹配的话题项
            const genericContainers = document.querySelectorAll(".generic");

            for (const container of genericContainers) {
              // 在容器中查找包含话题文本的元素
              const allTextElements = Array.from(container.querySelectorAll("*")).filter(
                (el) => el.childNodes.length === 1 && el.textContent?.trim() === tag,
              );

              if (allTextElements.length > 0) {
                const topicElement = allTextElements[0] as HTMLElement;
                topicElement.click();
                console.log("✅ 已选择话题:", tag);
                found = true;
                await sleep(500);
                break;
              }
            }

            if (found) break;
            await sleep(300);
          }

          if (!found) {
            console.log("⚠️ 未找到话题:", tag);
          }

          // 等待话题标签添加完成
          await sleep(500);
        }

        console.log("✅ 话题添加完成");
      } else {
        console.log("⚠️ 未找到话题输入框");
      }
    }

    // ========== 步骤5: 上传封面 ==========
    if (cover) {
      console.log("🖼️ 上传封面:", cover.name);

      // 等待视频上传完成后再上传封面
      await sleep(2000);

      // 步骤1: 点击 .upload-file.mp-upload 打开对话框
      const uploadFileDiv = document.querySelector(".upload-file.mp-upload") as HTMLElement;
      if (uploadFileDiv) {
        uploadFileDiv.click();
        console.log("✅ 已点击上传图片区域");
        await sleep(1000);

        // 步骤2: 等待对话框出现
        for (let i = 0; i < 10; i++) {
          // 检查对话框是否出现（通过"本地上传"标签判断）
          const localUploadTab = Array.from(document.querySelectorAll("*")).find(
            (el) => el.childNodes.length === 1 && el.textContent?.trim() === "本地上传",
          );

          if (localUploadTab) {
            console.log("✅ 封面对话框已打开");

            // 确保在"本地上传"标签页
            localUploadTab.click();
            await sleep(300);

            // 步骤3: 点击对话框内的"上传图片"按钮
            const dialogUploadBtn = Array.from(document.querySelectorAll("*")).find(
              (el) => el.childNodes.length === 1 && el.textContent?.trim() === "上传图片" && el !== uploadFileDiv,
            );

            if (dialogUploadBtn) {
              // 查找按钮父元素并点击
              let btnParent = dialogUploadBtn.parentElement;
              while (btnParent && btnParent !== document.body) {
                if (
                  btnParent.tagName === "BUTTON" ||
                  btnParent.getAttribute("role") === "button" ||
                  btnParent.tagName === "LABEL" ||
                  btnParent instanceof HTMLElement
                ) {
                  (btnParent as HTMLElement).click();
                  console.log("✅ 已点击弹框中的上传图片按钮");
                  await sleep(500);
                  break;
                }
                btnParent = btnParent.parentElement;
              }

              // 步骤4: 查找文件输入框并设置文件
              await sleep(500);
              const fileInput = document.querySelector('input#new-file[type="file"]') as HTMLInputElement;

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

                // 步骤5: 等待上传完成（检查 loading 元素消失）
                console.log("⏳ 等待封面上传...");
                for (let j = 0; j < 20; j++) {
                  const loadingEl = document.querySelector(".loading");
                  if (!loadingEl) {
                    console.log("✅ 封面上传完成");
                    break;
                  }
                  await sleep(500);
                }

                // 步骤6: 点击确定按钮
                const confirmBtn = document.querySelector(".bottom-buttons .positive-button") as HTMLButtonElement;
                if (confirmBtn && !confirmBtn.classList.contains("disabled") && !confirmBtn.disabled) {
                  confirmBtn.click();
                  console.log("✅ 已点击确定按钮");
                  await sleep(1000);
                } else {
                  console.log("⚠️ 确定按钮不可用");
                }
                break;
              }
              console.log("⚠️ 未找到文件输入框 input#new-file");
            } else {
              console.log("⚠️ 未找到弹框中的上传图片按钮");
            }
            break;
          }
          await sleep(500);
        }
      } else {
        console.log("⚠️ 未找到 .upload-file.mp-upload 元素");
      }
    }

    // ========== 步骤6: 自动发布 ==========
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

    console.log("✅ 搜狐号视频发布流程完成");
  } catch (error) {
    console.error("❌ 搜狐号视频发布失败:", error);
  }
}
