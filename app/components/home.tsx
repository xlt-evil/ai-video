"use client";

import React, { useState } from "react";
import styles from "./home.module.scss";
import { Sidebar } from "./sidebar";
import { Chat } from "./chat";
import { Settings } from "./settings";
import { createVideoTask, waitForTask } from "@/app/services/video-generation";
import { ArkConfig } from "@/app/config/volcengine";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  imageUrl?: string; // 用户上传的图片（用于图生视频）
  videoUrl?: string; // 生成的视频链接
  taskId?: string; // 任务ID
  status?: "generating" | "pending" | "processing" | "running" | "succeeded" | "failed"; // 生成状态
}

interface ChatData {
  id: string;
  title: string;
  messages: Message[];
  date: string;
}

// 模拟数据
const mockChats: ChatData[] = [
  {
    id: "1",
    title: "生成一个跑来跑去的视频",
    date: "今天",
    messages: [
      {
        id: "1-1",
        role: "assistant",
        content: "你好！我是 AI 助手。这是一个简化的聊天界面，基于 NextChat 的 UI 设计。",
        timestamp: Date.now(),
      },
      {
        id: "1-2",
        role: "user",
        content: "生成一个跑来跑去的视频",
        timestamp: Date.now(),
      },
      {
        id: "1-3",
        role: "assistant",
        content: "这是一个模拟回复。你可以以这里集成真实的 AI API。",
        timestamp: Date.now(),
      },
    ],
  },
];

export function Home() {
  const [chats, setChats] = useState<ChatData[]>(mockChats);
  const [currentChatId, setCurrentChatId] = useState<string>(mockChats[0].id);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const currentChat = chats.find((c) => c.id === currentChatId);

  const handleNewChat = () => {
    const newChat: ChatData = {
      id: Date.now().toString(),
      title: "新对话",
      date: "刚刚",
      messages: [
        {
          id: `${Date.now()}-1`,
          role: "assistant",
          content: "你好！有什么我可以帮助你的吗？",
          timestamp: Date.now(),
        },
      ],
    };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
  };

  const handleDeleteChat = (id: string) => {
    if (chats.length === 1) {
      alert("至少保留一个对话");
      return;
    }

    const newChats = chats.filter((chat) => chat.id !== id);
    setChats(newChats);

    // 如果删除的是当前对话，切换到第一个对话
    if (id === currentChatId) {
      setCurrentChatId(newChats[0].id);
    }
  };

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleSendMessage = async (content: string, imageData?: string) => {
    if (!currentChat) return;

    // 解析图片数据（可能是单张或首尾帧）
    let firstFrameUrl = "";
    let lastFrameUrl = "";
    
    if (imageData) {
      try {
        const parsed = JSON.parse(imageData);
        if (parsed.first && parsed.last) {
          // 首尾帧模式
          firstFrameUrl = parsed.first;
          lastFrameUrl = parsed.last;
        }
      } catch {
        // 如果解析失败，可能是单张图片（旧格式）
        firstFrameUrl = imageData;
      }
    }

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content,
      imageUrl: firstFrameUrl, // 保存首帧URL用于显示
      timestamp: Date.now(),
    };

    // 检查是否是视频生成请求：有首尾帧或包含"生成"+"视频"关键词
    const hasBothFrames = !!(firstFrameUrl && lastFrameUrl);
    const isVideoRequest =
      hasBothFrames || // 如果有首尾帧，直接触发视频生成
      (content.includes("生成") && (content.includes("视频") || content.includes("动画")));

    console.log('📝 用户输入:', content);
    console.log('🖼️ 首帧:', !!firstFrameUrl);
    console.log('🖼️ 尾帧:', !!lastFrameUrl);
    console.log('🎬 是否触发视频生成:', isVideoRequest);

    if (isVideoRequest) {
      // 视频生成流程
      const aiMessageId = `${Date.now()}-ai`;
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "正在为您生成视频，请稍候...",
        timestamp: Date.now() + 100,
        status: "generating",
      };

      // 先添加用户消息和生成中的消息
      setChats(
        chats.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [...chat.messages, userMessage, aiMessage],
                title:
                  chat.messages.length === 1
                    ? content.slice(0, 20)
                    : chat.title,
              }
            : chat
        )
      );

      try {
        // 从 localStorage 读取配置
        const configStr = localStorage.getItem("ark_config");
        if (!configStr) {
          throw new Error("请先在设置中配置 API Key");
        }

        const config: ArkConfig = JSON.parse(configStr);

        // 提取视频描述（去掉"生成"、"视频"等关键词）
        let prompt = content
          .replace(/生成|创建|制作|一个|视频|动画/g, "")
          .trim();
        
        // 如果没有提示词但有图片，使用默认提示词
        if (!prompt && (firstFrameUrl || lastFrameUrl)) {
          prompt = hasBothFrames ? "根据首尾帧生成流畅过渡视频" : "根据图片生成视频";
        }

        // 创建视频生成任务（传递首帧和尾帧）
        console.log('🎨 图生视频模式:', !!firstFrameUrl);
        console.log('🎨 首尾帧模式:', hasBothFrames);
        const task = await createVideoTask(config, prompt, firstFrameUrl, lastFrameUrl);

        // 更新消息显示任务ID
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === aiMessageId
                      ? {
                          ...msg,
                          content: `视频生成中...\n任务ID: ${task.id}\n\n正在处理，这可能需要几分钟时间。`,
                          taskId: task.id,
                        }
                      : msg
                  ),
                }
              : chat
          )
        );

        // 等待任务完成
        const result = await waitForTask(config, task.id, (taskStatus) => {
          // 更新进度
          const statusText = 
            taskStatus.status === "processing" || taskStatus.status === "running"
              ? "正在处理视频，请稍候..."
              : taskStatus.status === "pending"
              ? "等待处理..."
              : `状态: ${taskStatus.status}`;
          
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: chat.messages.map((msg) =>
                      msg.id === aiMessageId
                        ? {
                            ...msg,
                            content: `视频生成中...\n任务ID: ${task.id}\n\n${statusText}`,
                          }
                        : msg
                    ),
                  }
                : chat
            )
          );
        });

        // 任务完成
        if (result.status === "succeeded" && result.content?.video_url) {
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: chat.messages.map((msg) =>
                      msg.id === aiMessageId
                        ? {
                            ...msg,
                            content: `✅ 视频生成成功！\n\n分辨率: ${result.resolution}\n时长: ${result.duration}秒\n帧率: ${result.framespersecond}fps`,
                            videoUrl: result.content.video_url,
                            status: "succeeded",
                          }
                        : msg
                    ),
                  }
                : chat
            )
          );
        } else {
          throw new Error("视频生成失败");
        }
      } catch (error: any) {
        // 错误处理
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === aiMessageId
                      ? {
                          ...msg,
                          content: `❌ 视频生成失败\n\n错误信息: ${error.message}\n\n请检查：\n1. API Key 是否正确配置\n2. 网络连接是否正常\n3. 账户余额是否充足`,
                          status: "failed",
                        }
                      : msg
                  ),
                }
              : chat
          )
        );
      }
    } else {
      // 普通文本回复
      const aiMessage: Message = {
        id: `${Date.now()}-ai`,
        role: "assistant",
        content: "这是一个模拟回复。你可以以这里集成真实的 AI API。",
        timestamp: Date.now() + 1000,
      };

      setChats(
        chats.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [...chat.messages, userMessage, aiMessage],
                title:
                  chat.messages.length === 1
                    ? content.slice(0, 20)
                    : chat.title,
              }
            : chat
        )
      );
    }
  };

  return (
    <div
      className={`${styles.container} ${
        isFullScreen ? styles["tight-container"] : ""
      }`}
    >
      <Sidebar
        chats={chats.map((chat) => ({
          id: chat.id,
          title: chat.title,
          date: chat.date,
          count: chat.messages.length,
        }))}
        currentChatId={currentChatId}
        onChatSelect={setCurrentChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setShowSettings(true)}
      />
      <div className={styles["window-content"]}>
        {showSettings ? (
          <Settings onClose={() => setShowSettings(false)} />
        ) : (
          currentChat && (
            <Chat
              chatId={currentChat.id}
              chatTitle={currentChat.title}
              messages={currentChat.messages}
              onSendMessage={handleSendMessage}
              isFullScreen={isFullScreen}
              onToggleFullScreen={handleToggleFullScreen}
            />
          )
        )}
      </div>
    </div>
  );
}

