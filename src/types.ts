/** 训练计划（类似手机闹钟的固定方案，长期保存） */
export interface TrainingPlan {
  id: string
  /** 计划名称 */
  name: string
  /** 收缩时间（整数秒） */
  contractSeconds: number
  /** 放松时间（整数秒） */
  relaxSeconds: number
  /** 循环组数 1~100 */
  cycles: number
  /** 提醒时间 "HH:MM" */
  reminderTime: string
  /** 是否开启提醒 */
  reminderEnabled: boolean
}

/** 训练记录 */
export interface TrainingRecord {
  id: string
  /** 训练名称（计划名 或 "自由训练"） */
  planName: string
  /** 完成组数（收缩 + 放松完整完成才算 1 组） */
  completedCycles: number
  /** 总组数；自由训练为 null */
  totalCycles: number | null
  /** 记录时间 ISO 字符串 */
  createdAt: string
}

/** 应用设置 */
export interface AppSettings {
  /** 声音提示开关 */
  soundEnabled: boolean
}
