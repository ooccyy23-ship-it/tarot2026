import { describe, expect, it } from "vitest";
import {
  DEFAULT_ALLOWED_UID,
  getAllowedUid,
  isAllowedUid,
  resolveAuthGateState,
} from "./authAccess";

describe("authAccess", () => {
  it("預設使用指定的 Firebase UID", () => {
    expect(getAllowedUid()).toBe(DEFAULT_ALLOWED_UID);
    expect(DEFAULT_ALLOWED_UID).toBe("JGvYos4FHLgTD7YQxT4dn4WVryd2");
  });

  it("Auth 尚未確認完成時維持載入狀態", () => {
    expect(resolveAuthGateState({
      initializing: true,
      userUid: null,
      allowedUid: "allowed-user",
    })).toBe("loading");
  });

  it("未登入時只進入登入頁", () => {
    expect(resolveAuthGateState({
      initializing: false,
      userUid: null,
      allowedUid: "allowed-user",
    })).toBe("signed_out");
  });

  it("只有完全相同的 UID 才授權", () => {
    expect(isAllowedUid("allowed-user", "allowed-user")).toBe(true);
    expect(resolveAuthGateState({
      initializing: false,
      userUid: "another-user",
      allowedUid: "allowed-user",
    })).toBe("unauthorized");
  });

  it("沒有設定白名單時採安全拒絕", () => {
    expect(isAllowedUid("any-user", "")).toBe(false);
    expect(resolveAuthGateState({
      initializing: false,
      userUid: "any-user",
      allowedUid: "",
    })).toBe("unauthorized");
  });
});
