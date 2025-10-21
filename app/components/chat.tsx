"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./chat.module.scss";
import { IconButton } from "./ui-lib";
import { MaxIcon, MinIcon } from "./icons";
import { downloadVideo } from "@/app/services/video-generation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  imageUrl?: string; // 用户上传的图片
  videoUrl?: string;
  taskId?: string;
  status?: "generating" | "pending" | "processing" | "running" | "succeeded" | "failed";
}

interface ChatProps {
  chatId: string;
  chatTitle: string;
  messages: Message[];
  onSendMessage: (content: string, imageUrl?: string) => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}

export function Chat(props: ChatProps) {
  const [input, setInput] = useState("");
  const [firstFramePreview, setFirstFramePreview] = useState<string>("");
  const [lastFramePreview, setLastFramePreview] = useState<string>("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [props.messages]);

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleFirstFrameSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFirstFramePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLastFrameSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLastFramePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFirstFrame = () => {
    setFirstFramePreview("");
    if (firstFrameInputRef.current) {
      firstFrameInputRef.current.value = "";
    }
  };

  const handleRemoveLastFrame = () => {
    setLastFramePreview("");
    if (lastFrameInputRef.current) {
      lastFrameInputRef.current.value = "";
    }
  };

  const handleToggleImageUpload = () => {
    setShowImageUpload(!showImageUpload);
  };

  const handleSend = () => {
    // 必须同时有首帧和尾帧，或者只有文本（不上传图片）
    const hasBothFrames = firstFramePreview && lastFramePreview;
    const hasNoFrames = !firstFramePreview && !lastFramePreview;
    
    if (input.trim() || hasBothFrames) {
      if (hasBothFrames) {
        // 合并两张图片的数据
        const imageData = JSON.stringify({
          first: firstFramePreview,
          last: lastFramePreview,
        });
        props.onSendMessage(input.trim(), imageData);
        setFirstFramePreview("");
        setLastFramePreview("");
      } else if (hasNoFrames) {
        props.onSendMessage(input.trim());
      }
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.chat}>
      <div className={styles["chat-header"]}>
        <div className={styles["chat-title"]}>{props.chatTitle}</div>
        <IconButton
          icon={props.isFullScreen ? <MinIcon /> : <MaxIcon />}
          onClick={props.onToggleFullScreen}
          title={props.isFullScreen ? "退出全屏" : "全屏显示"}
        />
      </div>

      <div className={styles["chat-body"]} ref={chatBodyRef}>
        {props.messages.map((message) => (
          <div
            key={message.id}
            className={`${styles["chat-message"]} ${message.role === "user" ? styles.user : ""}`}
          >
            <div className={styles["message-avatar"]}>
              {message.role === "user" ? "👤" : "🤖"}
            </div>
            <div className={styles["message-content"]}>
              {/* 用户上传的图片 */}
              {message.imageUrl && (
                <div style={{ marginBottom: "8px" }}>
                  <img
                    src={message.imageUrl}
                    alt="上传的图片"
                    style={{
                      maxWidth: "300px",
                      maxHeight: "300px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-in-light)",
                    }}
                  />
                  <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                    📷 图生视频首帧
                  </div>
                </div>
              )}

              {/* 文本内容 */}
              <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>

              {/* 视频播放器 */}
              {message.videoUrl && message.status === "succeeded" && (
                <div style={{ marginTop: "16px" }}>
                  <video
                    controls
                    style={{
                      width: "100%",
                      maxWidth: "600px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-in-light)",
                    }}
                  >
                    <source src={message.videoUrl} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                  <div style={{ marginTop: "8px" }}>
                    <button
                      onClick={() => {
                        if (message.videoUrl) {
                          downloadVideo(message.videoUrl, `video-${message.taskId || Date.now()}.mp4`);
                        }
                      }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "var(--primary)",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      📥 下载视频
                    </button>
                    <button
                      onClick={() => {
                        if (message.videoUrl) {
                          window.open(message.videoUrl, "_blank");
                        }
                      }}
                      style={{
                        padding: "8px 16px",
                        marginLeft: "8px",
                        backgroundColor: "transparent",
                        color: "var(--primary)",
                        border: "1px solid var(--primary)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      🔗 在新标签页打开
                    </button>
                  </div>
                </div>
              )}

              {/* 生成中的加载动画 */}
              {(message.status === "generating" || 
                message.status === "pending" || 
                message.status === "processing" || 
                message.status === "running") && (
                <div style={{ marginTop: "8px" }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "8px 16px",
                      backgroundColor: "var(--second)",
                      color: "var(--primary)",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  >
                    ⏳ 生成中...
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 输入栏 */}
      <div style={{ borderTop: "1px solid #e5e7eb" }}>
        <div style={{ padding: "16px 20px" }}>
          {/* 工具栏 */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
            <button
              onClick={handleToggleImageUpload}
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: (firstFramePreview && lastFramePreview) ? "#f0f9ff" : showImageUpload ? "#f5f5f5" : "transparent",
                border: `1px solid ${(firstFramePreview && lastFramePreview) ? "var(--primary)" : "transparent"}`,
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                position: "relative",
              }}
              title="上传首尾帧图片"
              onMouseEnter={(e) => {
                if (!(firstFramePreview && lastFramePreview) && !showImageUpload) {
                  e.currentTarget.style.backgroundColor = "#f5f5f5";
                }
              }}
              onMouseLeave={(e) => {
                if (!(firstFramePreview && lastFramePreview) && !showImageUpload) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              🖼️
              {firstFramePreview && lastFramePreview && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    backgroundColor: "var(--primary)",
                    color: "white",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "10px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  2
                </span>
              )}
            </button>
          </div>

          {/* 图片上传区域 */}
          {showImageUpload && (
            <div
              style={{
                marginBottom: "12px",
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid var(--border-in-light)",
              }}
            >
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                {/* 首帧 */}
                <div style={{ flex: 1 }}>
                  <input
                    ref={firstFrameInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFirstFrameSelect}
                    style={{ display: "none" }}
                  />
                  <div
                    onClick={() => firstFrameInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${firstFramePreview ? "var(--primary)" : "#ddd"}`,
                      borderRadius: "8px",
                      padding: "16px",
                      cursor: "pointer",
                      textAlign: "center",
                      backgroundColor: "white",
                      position: "relative",
                      minHeight: "120px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {firstFramePreview ? (
                      <>
                        <img
                          src={firstFramePreview}
                          alt="首帧"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100px",
                            objectFit: "contain",
                            borderRadius: "4px",
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFirstFrame();
                          }}
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            padding: "4px 8px",
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div>
                        <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
                        <div style={{ fontSize: "14px", color: "var(--black)", fontWeight: "500" }}>
                          首帧
                        </div>
                        <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                          点击上传
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 箭头 */}
                <div style={{ fontSize: "24px", color: "#999" }}>→</div>

                {/* 尾帧 */}
                <div style={{ flex: 1 }}>
                  <input
                    ref={lastFrameInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLastFrameSelect}
                    style={{ display: "none" }}
                  />
                  <div
                    onClick={() => lastFrameInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${lastFramePreview ? "var(--primary)" : "#ddd"}`,
                      borderRadius: "8px",
                      padding: "16px",
                      cursor: "pointer",
                      textAlign: "center",
                      backgroundColor: "white",
                      position: "relative",
                      minHeight: "120px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {lastFramePreview ? (
                      <>
                        <img
                          src={lastFramePreview}
                          alt="尾帧"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100px",
                            objectFit: "contain",
                            borderRadius: "4px",
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveLastFrame();
                          }}
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            padding: "4px 8px",
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div>
                        <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
                        <div style={{ fontSize: "14px", color: "var(--black)", fontWeight: "500" }}>
                          尾帧
                        </div>
                        <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                          点击上传
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 提示 */}
              {(firstFramePreview && !lastFramePreview) || (!firstFramePreview && lastFramePreview) ? (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "8px 12px",
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffc107",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#856404",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>⚠️</span>
                  <span>请同时上传首帧和尾帧图片（必须2张）</span>
                </div>
              ) : null}
            </div>
          )}

          {/* 输入框容器 */}
          <div style={{ position: "relative" }}>
            <textarea
              ref={textareaRef}
              className={styles["chat-input"]}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter 发送，Shift + Enter 换行，/ 触发补全；触发命令"
              rows={1}
              style={{
                minHeight: "44px",
                maxHeight: "200px",
                paddingRight: "90px",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            
            <button
              className={styles["send-button"]}
              onClick={handleSend}
              disabled={!input.trim() && (!firstFramePreview || !lastFramePreview)}
              style={{
                position: "absolute",
                right: "10px",
                bottom: "8px",
                minWidth: "70px",
                height: "auto",
                padding: "8px 20px",
              }}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

