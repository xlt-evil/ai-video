"use client";

import React from "react";
import styles from "./sidebar.module.scss";
import { IconButton } from "./ui-lib";
import { CloseIcon } from "./icons";

interface Chat {
  id: string;
  title: string;
  date: string;
  count: number;
}

interface SidebarProps {
  chats: Chat[];
  currentChatId?: string;
  onChatSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onOpenSettings: () => void;
}

export function Sidebar(props: SidebarProps) {
  return (
    <div className={styles.sidebar}>
      <div className={styles["sidebar-header"]}>
        <div className={styles["sidebar-title"]}>NextChat Simple</div>
        <div className={styles["sidebar-sub-title"]}>轻量级聊天界面</div>
      </div>

      <div className={styles["sidebar-body"]}>
        {props.chats.map((chat) => (
          <div
            key={chat.id}
            className={`${styles["chat-item"]} ${
              chat.id === props.currentChatId ? styles["chat-item-selected"] : ""
            }`}
            onClick={() => props.onChatSelect(chat.id)}
          >
            <div className={styles["chat-item-title"]}>{chat.title}</div>
            <div className={styles["chat-item-info"]}>
              <div className={styles["chat-item-count"]}>{chat.count} 条对话</div>
              <div className={styles["chat-item-date"]}>{chat.date}</div>
            </div>
            <div
              className={styles["chat-item-delete"]}
              onClick={(e) => {
                e.stopPropagation();
                props.onDeleteChat(chat.id);
              }}
            >
              <CloseIcon />
            </div>
          </div>
        ))}
      </div>

      <div className={styles["sidebar-tail"]}>
        <IconButton onClick={props.onNewChat} title="新建对话">
          <span style={{ fontSize: "20px" }}>+</span>
        </IconButton>
        <IconButton onClick={props.onOpenSettings} title="设置">
          <span style={{ fontSize: "16px" }}>⚙️</span>
        </IconButton>
      </div>
    </div>
  );
}

