"use client";

import React, { useState, useEffect } from "react";
import styles from "./settings.module.scss";
import { IconButton, PrimaryButton } from "./ui-lib";
import { CloseIcon } from "./icons";
import {
  VolcengineConfig,
  defaultVolcengineConfig,
  validateVolcengineConfig,
} from "../config/volcengine";
import { providerManager, StoredProviderConfig } from "../services/provider-manager";
import { ProviderType } from "../services/providers";

interface SettingsProps {
  onClose: () => void;
}

export function Settings(props: SettingsProps) {
  const [config, setConfig] = useState<Partial<VolcengineConfig>>({
    ...defaultVolcengineConfig,
    apiKey: "",
  });

  const [providers, setProviders] = useState<StoredProviderConfig[]>([]);
  const [defaultProviderId, setDefaultProviderId] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"volcengine" | "providers">("volcengine");

  // 从 localStorage 加载配置
  useEffect(() => {
    const savedConfig = localStorage.getItem("ark_config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...defaultVolcengineConfig, ...parsed });
      } catch (e) {
        console.error("Failed to parse saved config:", e);
      }
    }

    // 加载 Provider 列表
    loadProviders();
  }, []);

  const loadProviders = () => {
    const providerList = providerManager.listProviders();
    setProviders(providerList);

    const defaultProvider = providerList.find(p => p.isDefault);
    if (defaultProvider) {
      setDefaultProviderId(defaultProvider.id);
    }
  };

  const handleSave = () => {
    // 验证配置
    const validation = validateVolcengineConfig(config);

    if (!validation.valid) {
      setErrors(validation.errors);
      setSaveStatus("error");
      return;
    }

    // 保存到 localStorage（保持向后兼容）
    try {
      localStorage.setItem("ark_config", JSON.stringify(config));

      // 同时添加到 Provider 管理器
      try {
        const existingProvider = providers.find(p => p.type === 'volcengine');
        if (existingProvider) {
          providerManager.updateProvider(existingProvider.id, config);
        } else {
          providerManager.addProvider('volcengine', config, 'Volcengine (火山引擎)', true);
        }
        loadProviders();
      } catch (error) {
        console.error("Failed to update provider:", error);
      }

      setSaveStatus("success");
      setErrors([]);

      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (e) {
      console.error("Failed to save config:", e);
      setSaveStatus("error");
      setErrors(["保存失败，请重试"]);
    }
  };

  const handleReset = () => {
    setConfig({
      ...defaultVolcengineConfig,
      apiKey: "",
    });
    setSaveStatus("idle");
    setErrors([]);
  };

  const handleSetDefaultProvider = (id: string) => {
    try {
      providerManager.setDefaultProvider(id);
      setDefaultProviderId(id);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error: any) {
      setErrors([error.message]);
      setSaveStatus("error");
    }
  };

  const handleRemoveProvider = (id: string) => {
    if (confirm("确定要删除这个 Provider 吗？")) {
      try {
        providerManager.removeProvider(id);
        loadProviders();
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (error: any) {
        setErrors([error.message]);
        setSaveStatus("error");
      }
    }
  };

  const validation = validateVolcengineConfig(config);
  const configStatus = !config.apiKey
    ? "unconfigured"
    : validation.valid
    ? "valid"
    : "invalid";

  return (
    <div className={styles.settings}>
      <div className={styles["settings-header"]}>
        <div>
          <div className={styles["settings-title"]}>火山引擎视频生成配置</div>
          <div
            className={`${styles["config-status"]} ${
              styles[`status-${configStatus}`]
            }`}
          >
            {configStatus === "valid" && "✓ 配置完整"}
            {configStatus === "invalid" && "✗ 配置有误"}
            {configStatus === "unconfigured" && "未配置"}
          </div>
        </div>
        <IconButton icon={<CloseIcon />} onClick={props.onClose} />
      </div>

      <div className={styles["settings-body"]}>
        {/* 提示信息 */}
        <div className={`${styles.alert} ${styles["alert-info"]}`}>
          <span>ℹ️</span>
          <div>
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
              如何获取 API Key？
            </div>
            <div>
              1. 访问{" "}
              <a
                href="https://console.volcengine.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)" }}
              >
                火山引擎控制台
              </a>
              <br />
              2. 在控制台中找到 "API Key 管理"
              <br />
              3. 创建新的 API Key 或查看现有密钥
              <br />
              4. 复制 API Key 并粘贴到下方配置中
              <br />
              5. 参考{" "}
              <a
                href="https://www.volcengine.com/docs/82379/1520757"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)" }}
              >
                视频生成API文档
              </a>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {saveStatus === "error" && errors.length > 0 && (
          <div className={`${styles.alert} ${styles["alert-error"]}`}>
            <span>✗</span>
            <div>
              {errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          </div>
        )}

        {/* 成功提示 */}
        {saveStatus === "success" && (
          <div className={`${styles.alert} ${styles["alert-success"]}`}>
            <span>✓</span>
            <div>配置保存成功！</div>
          </div>
        )}

        {/* API 凭证 */}
        <div className={styles["settings-section"]}>
          <div className={styles["section-title"]}>🔑 API 凭证</div>
          <div className={styles["section-description"]}>
            用于身份验证的 API 密钥，请妥善保管
          </div>

          <div className={styles["form-group"]}>
            <label className={`${styles["form-label"]} ${styles["form-label-required"]}`}>
              API Key
            </label>
            <div className={styles["input-password"]}>
              <input
                type={showPassword ? "text" : "password"}
                className={styles["form-input"]}
                value={config.apiKey || ""}
                onChange={(e) =>
                  setConfig({ ...config, apiKey: e.target.value })
                }
                placeholder="请输入 API Key"
              />
              <span
                className={styles["toggle-password"]}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
            <div className={styles["form-hint"]}>
              密钥仅保存在本地浏览器，不会上传到服务器
            </div>
          </div>
        </div>

        {/* 模型配置 */}
        <div className={styles["settings-section"]}>
          <div className={styles["section-title"]}>🤖 模型配置</div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>
              视频生成模型
            </label>
            <input
              type="text"
              className={styles["form-input"]}
              value={config.model || ""}
              onChange={(e) =>
                setConfig({ ...config, model: e.target.value })
              }
              placeholder="doubao-seedance-1-0-pro-250528"
            />
            <div className={styles["form-hint"]}>
              豆包视频生成模型
            </div>
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>
              API 端点（可选）
            </label>
            <input
              type="text"
              className={styles["form-input"]}
              value={config.endpoint || ""}
              onChange={(e) =>
                setConfig({ ...config, endpoint: e.target.value })
              }
              placeholder="https://ark.cn-beijing.volces.com/api/v3"
            />
            <div className={styles["form-hint"]}>
              留空使用默认端点
            </div>
          </div>
        </div>

        {/* 视频配置 */}
        <div className={styles["settings-section"]}>
          <div className={styles["section-title"]}>🎬 视频生成配置</div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>分辨率</label>
            <select
              className={styles["form-select"]}
              value={config.videoConfig?.resolution || "1080p"}
              onChange={(e) =>
                setConfig({
                  ...config,
                  videoConfig: {
                    ...config.videoConfig,
                    resolution: e.target.value as any,
                  },
                })
              }
            >
              <option value="720p">720p (1280x720)</option>
              <option value="1080p">1080p (1920x1080)</option>
              <option value="2k">2K (2560x1440)</option>
            </select>
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>视频时长（秒）</label>
            <input
              type="number"
              className={styles["form-input"]}
              value={config.videoConfig?.duration || 5}
              onChange={(e) =>
                setConfig({
                  ...config,
                  videoConfig: {
                    ...config.videoConfig,
                    duration: Number(e.target.value),
                  },
                })
              }
              min="1"
              max="10"
            />
            <div className={styles["form-hint"]}>
              支持 1-10 秒
            </div>
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>宽高比</label>
            <select
              className={styles["form-select"]}
              value={config.videoConfig?.ratio || "16:9"}
              onChange={(e) =>
                setConfig({
                  ...config,
                  videoConfig: {
                    ...config.videoConfig,
                    ratio: e.target.value as any,
                  },
                })
              }
            >
              <option value="16:9">16:9 (横屏)</option>
              <option value="9:16">9:16 (竖屏)</option>
              <option value="1:1">1:1 (方形)</option>
            </select>
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>
              <input
                type="checkbox"
                checked={!config.videoConfig?.cameraFixed}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    videoConfig: {
                      ...config.videoConfig,
                      cameraFixed: !e.target.checked,
                    },
                  })
                }
                style={{ marginRight: "8px" }}
              />
              启用镜头运动
            </label>
            <div className={styles["form-hint"]}>
              关闭则镜头固定不动
            </div>
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>
              <input
                type="checkbox"
                checked={config.videoConfig?.watermark ?? false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    videoConfig: {
                      ...config.videoConfig,
                      watermark: e.target.checked,
                    },
                  })
                }
                style={{ marginRight: "8px" }}
              />
              添加水印
            </label>
            <div className={styles["form-hint"]}>
              默认关闭，生成无水印视频
            </div>
          </div>
        </div>

        {/* 高级配置 */}
        <div className={styles["settings-section"]}>
          <div className={styles["section-title"]}>⚙️ 高级配置</div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>轮询间隔（毫秒）</label>
            <input
              type="number"
              className={styles["form-input"]}
              value={config.advanced?.pollInterval || 3000}
              onChange={(e) =>
                setConfig({
                  ...config,
                  advanced: {
                    ...config.advanced,
                    pollInterval: Number(e.target.value),
                  },
                })
              }
              min="1000"
              step="1000"
            />
            <div className={styles["form-hint"]}>
              查询任务状态的间隔时间
            </div>
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>请求超时（毫秒）</label>
            <input
              type="number"
              className={styles["form-input"]}
              value={config.advanced?.timeout || 300000}
              onChange={(e) =>
                setConfig({
                  ...config,
                  advanced: {
                    ...config.advanced,
                    timeout: Number(e.target.value),
                  },
                })
              }
              min="30000"
              step="10000"
            />
            <div className={styles["form-hint"]}>
              视频生成可能需要较长时间，建议设置5分钟以上
            </div>
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>最大重试次数</label>
            <input
              type="number"
              className={styles["form-input"]}
              value={config.advanced?.maxRetries || 3}
              onChange={(e) =>
                setConfig({
                  ...config,
                  advanced: {
                    ...config.advanced,
                    maxRetries: Number(e.target.value),
                  },
                })
              }
              min="0"
              max="10"
            />
          </div>
        </div>

        {/* Provider 管理 */}
        <div className={styles["settings-section"]}>
          <div className={styles["section-title"]}>🔌 Provider 管理</div>
          <div className={styles["section-description"]}>
            管理多个视频生成平台的配置
          </div>

          {providers.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "10px" }}>
                已配置的 Provider：
              </div>
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  style={{
                    padding: "10px",
                    marginBottom: "8px",
                    border: "1px solid var(--border-in-light)",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold" }}>{provider.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-light)" }}>
                      类型: {provider.type}
                      {provider.isDefault && " • 默认"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {!provider.isDefault && (
                      <button
                        onClick={() => handleSetDefaultProvider(provider.id)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          border: "1px solid var(--primary)",
                          borderRadius: "6px",
                          backgroundColor: "transparent",
                          color: "var(--primary)",
                          cursor: "pointer",
                        }}
                      >
                        设为默认
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveProvider(provider.id)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        border: "1px solid var(--red)",
                        borderRadius: "6px",
                        backgroundColor: "transparent",
                        color: "var(--red)",
                        cursor: "pointer",
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: "12px", color: "var(--text-light)", marginTop: "10px" }}>
            💡 提示：保存火山引擎配置后，会自动添加到 Provider 列表中
          </div>
        </div>
      </div>

      <div className={styles["settings-footer"]}>
        <button
          className={styles["icon-button"]}
          onClick={handleReset}
          style={{
            padding: "10px 20px",
            border: "var(--border-in-light)",
            borderRadius: "10px",
            backgroundColor: "var(--white)",
            cursor: "pointer",
          }}
        >
          重置
        </button>
        <PrimaryButton onClick={handleSave}>保存配置</PrimaryButton>
      </div>
    </div>
  );
}

