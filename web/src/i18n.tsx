import { ConverterBuilder } from "opencc-js/core";
import * as cn2tPreset from "opencc-js/preset/cn2t";
import { createContext, useContext, type ReactNode } from "react";
import type { TaskPriority, TaskStatus } from "./types";

// 上游 dashi-taskboard 只內建簡體/英文兩種語系，這裡新增 zh-tw 語系，
// 用 opencc-js 對簡體字串做即時繁體轉換，不需要另外手動維護一份繁體字典。
const cn2tw = ConverterBuilder(cn2tPreset)({ from: "cn", to: "tw" });

export function toTraditionalChinese(text: string): string {
  return cn2tw(text);
}

export type TaskboardLanguage = "zh" | "zh-tw" | "en";

interface TaskboardI18n {
  language: TaskboardLanguage;
  locale: "zh-CN" | "zh-TW" | "en";
  text: (chinese: string, english: string) => string;
}

const I18N: Record<TaskboardLanguage, TaskboardI18n> = {
  zh: {
    language: "zh",
    locale: "zh-CN",
    text: (chinese) => chinese,
  },
  "zh-tw": {
    language: "zh-tw",
    locale: "zh-TW",
    text: (chinese) => cn2tw(chinese),
  },
  en: {
    language: "en",
    locale: "en",
    text: (_chinese, english) => english,
  },
};

function toTraditional<T extends Record<string, string>>(labels: T): T {
  return Object.fromEntries(
    Object.entries(labels).map(([key, value]) => [key, cn2tw(value)]),
  ) as T;
}

const ZH_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "待立项",
  todo: "等待认领",
  in_progress: "处理中",
  in_review: "等你确认",
  blocked: "遇到阻碍",
  done: "完成",
  canceled: "取消",
};

const STATUS_LABELS: Record<TaskboardLanguage, Record<TaskStatus, string>> = {
  zh: ZH_STATUS_LABELS,
  "zh-tw": toTraditional(ZH_STATUS_LABELS),
  en: {
    backlog: "Backlog",
    todo: "To do",
    in_progress: "In progress",
    in_review: "In review",
    blocked: "Blocked",
    done: "Done",
    canceled: "Canceled",
  },
};

const ZH_PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: "无优先级",
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};

const PRIORITY_LABELS: Record<TaskboardLanguage, Record<TaskPriority, string>> = {
  zh: ZH_PRIORITY_LABELS,
  "zh-tw": toTraditional(ZH_PRIORITY_LABELS),
  en: {
    none: "No priority",
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
  },
};

const TaskboardLanguageContext = createContext<TaskboardLanguage>("en");

const TRADITIONAL_ZH_TAGS = new Set(["zh-tw", "zh-hk", "zh-mo", "zh-hant"]);

export function resolveTaskboardLanguage(value: string | null | undefined): TaskboardLanguage {
  const normalized = value?.trim().replaceAll("_", "-").toLowerCase() ?? "";
  if (TRADITIONAL_ZH_TAGS.has(normalized) || normalized.startsWith("zh-hant-")) return "zh-tw";
  if (normalized === "zh" || normalized.startsWith("zh-")) return "zh";
  return "en";
}

export function getTaskboardI18n(language: TaskboardLanguage): TaskboardI18n {
  return I18N[language];
}

export function taskStatusLabel(language: TaskboardLanguage, status: TaskStatus): string {
  return STATUS_LABELS[language][status];
}

export function taskPriorityLabel(language: TaskboardLanguage, priority: TaskPriority): string {
  return PRIORITY_LABELS[language][priority];
}

export function TaskboardLanguageProvider({
  language,
  children,
}: {
  language: TaskboardLanguage;
  children: ReactNode;
}) {
  return (
    <TaskboardLanguageContext.Provider value={language}>
      {children}
    </TaskboardLanguageContext.Provider>
  );
}

export function useTaskboardI18n(): TaskboardI18n {
  return I18N[useContext(TaskboardLanguageContext)];
}
