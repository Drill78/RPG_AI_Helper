import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AppState, Progress } from "./types";

type Store = {
  state: AppState | null;
  memberId: string;
  setMemberId: (id: string) => void;
  progress: Progress;
  loading: boolean;
  error: string;
  busy: boolean;
  refresh: () => Promise<void>;
  mutate: (path: string, method: string, body?: unknown) => Promise<boolean>;
  toast: (message: string) => void;
  notice: string;
};
const empty: Progress = { completed: [], checks: {}, bookmarks: [], notes: {} };
const Context = createContext<Store | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [memberId, setMember] = useState(() => {
    try {
      return localStorage.getItem("guild-member-v1") || "drill";
    } catch {
      return "drill";
    }
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const locked = useRef(false),
    revision = useRef<string | null>(null),
    noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toast = useCallback((message: string) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3600);
  }, []);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/state", {
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        throw new Error("本地服务暂时没有响应，请检查服务是否运行。");
      const data = (await response.json()) as AppState;
      revision.current = response.headers.get("ETag");
      setState(data);
      setError("");
    } catch (e) {
      setError(
        e instanceof TypeError ||
          (e instanceof Error && e.name === "TimeoutError")
          ? "无法连接本地服务，请重新运行一键启动入口后重试。"
          : e instanceof Error
            ? e.message
            : "连接失败，请稍后重试。",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const mutate = useCallback(
    async (path: string, method: string, body?: unknown) => {
      if (locked.current) {
        toast("上一项操作正在保存，请稍候再试。");
        return false;
      }
      locked.current = true;
      setBusy(true);
      try {
        const headers: Record<string, string> = {};
        if (body !== undefined) headers["Content-Type"] = "application/json";
        if (revision.current) headers["If-Match"] = revision.current;
        const response = await fetch(`/api/${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        });
        const data = await response.json();
        if (response.status === 409) {
          await refresh();
          throw new Error(
            data.error || "其他窗口刚刚更新了工作区，已刷新，请重试。",
          );
        }
        if (!response.ok) throw new Error(data.error || "保存失败，请重试。");
        revision.current = response.headers.get("ETag");
        setState(data);
        setError("");
        return true;
      } catch (e) {
        const message =
          e instanceof TypeError ||
          (e instanceof Error && e.name === "TimeoutError")
            ? "本地服务暂时断开，本次修改尚未保存。请重新连接后重试。"
            : e instanceof Error
              ? e.message
              : "保存失败，请重试。";
        if (
          e instanceof TypeError ||
          (e instanceof Error && e.name === "TimeoutError")
        )
          setError(message);
        toast(message);
        return false;
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
    [toast, refresh],
  );
  const setMemberId = useCallback((id: string) => {
    setMember(id);
    try {
      localStorage.setItem("guild-member-v1", id);
    } catch {
      /* The active profile still works for this visit. */
    }
  }, []);
  useEffect(() => {
    if (state && !state.members.some((m) => m.id === memberId))
      setMemberId(state.members[0].id);
  }, [state, memberId, setMemberId]);
  const activeMemberId = state?.members.some((m) => m.id === memberId)
    ? memberId
    : state?.members[0]?.id || memberId;
  return (
    <Context.Provider
      value={{
        state,
        memberId: activeMemberId,
        setMemberId,
        progress: state?.progress[activeMemberId] || empty,
        loading,
        error,
        busy,
        refresh,
        mutate,
        toast,
        notice,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("WorkspaceProvider missing");
  return context;
}
