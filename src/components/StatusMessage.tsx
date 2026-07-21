type StatusMessageProps = {
  tone?: "info" | "warning" | "error" | "success";
  message: string;
};

export function StatusMessage({ tone = "info", message }: StatusMessageProps) {
  return <div className={`status-message ${tone}`}>{message}</div>;
}
