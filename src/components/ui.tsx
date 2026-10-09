import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { ArrowUpRight, Check, Compass, ExternalLink, X } from "lucide-react";
import type { Source } from "../types";
export function navigate(route: string) {
  window.location.hash = route;
}
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function ProgressBar({
  value,
  tone = "",
}: {
  value: number;
  tone?: string;
}) {
  return (
    <div
      className={`progress-track ${tone}`}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="完成进度"
    >
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-symbol">
        <Compass size={30} />
      </div>
      <h2 className="empty-title">{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div className="source-list">
      <span>参考资料 · 官方文档</span>
      {sources.map((s) => (
        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
          {s.title}
          <ExternalLink size={12} />
        </a>
      ))}
      <small>内容整理于 2026.10.09 · 工具界面可能随版本更新</small>
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowUpRight size={15} />
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const titleId = useId(),
    ref = useRef<HTMLDivElement>(null),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prior = document.activeElement as HTMLElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const target = ref.current?.querySelector<HTMLElement>(
      "[autofocus], [data-autofocus]",
    );
    (target || ref.current)?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", key);
      prior?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "wide" : ""}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal-heading">
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-button"
            aria-label="关闭弹窗"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function CheckRow({
  checked,
  children,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  children: ReactNode;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label className={`check-row ${checked ? "is-checked" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="check-box">{checked ? <Check size={13} /> : null}</span>
      <span>{children}</span>
    </label>
  );
}
export async function copyText(text: string) {
  if (!navigator.clipboard)
    throw new Error("此浏览器暂不支持剪贴板，请在文本框内全选复制。");
  await navigator.clipboard.writeText(text);
}
