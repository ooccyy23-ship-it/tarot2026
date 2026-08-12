type StatusMessageProps = {
  tone?: "info" | "warning" | "error" | "success";
  message: string;
  onDismiss?: () => void;
};

export function StatusMessage({ tone = "info", message, onDismiss }: StatusMessageProps) {
  return <div className={`status-message ${tone}`} role={tone === "error" ? "alert" : "status"} aria-live={tone === "error" ? "assertive" : "polite"}>
    <span>{message}</span>
    {onDismiss ? <button className="status-message-dismiss" type="button" onClick={onDismiss} aria-label="關閉提示">×</button> : null}
  </div>;
}
