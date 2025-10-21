"use client";

import React from "react";
import styles from "./ui-lib.module.scss";

export function Card(props: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${styles.card} ${props.className || ""}`}>
      {props.children}
    </div>
  );
}

export function List(props: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${styles.list} ${props.className || ""}`}>
      {props.children}
    </div>
  );
}

export function ListItem(props: {
  title: string;
  subTitle?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles["list-item"]} ${props.className || ""}`}>
      <div className={styles["list-header"]}>
        <div>
          <div className={styles["list-item-title"]}>{props.title}</div>
          {props.subTitle && (
            <div className={styles["list-item-sub-title"]}>{props.subTitle}</div>
          )}
        </div>
      </div>
      {props.children}
    </div>
  );
}

export function IconButton(props: {
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      className={`${styles["icon-button"]} ${props.className || ""}`}
      onClick={props.onClick}
      title={props.title}
    >
      {props.icon}
      {props.children}
    </button>
  );
}

export function PrimaryButton(props: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      className={`${styles["primary-button"]} ${props.className || ""}`}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

