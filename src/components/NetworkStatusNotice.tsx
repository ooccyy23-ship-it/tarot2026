import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { StatusMessage } from "./StatusMessage";

export function NetworkStatusNotice() {
  const online = useOnlineStatus();
  const [restored, setRestored] = useState(false);
  const experiencedOffline = useRef(!navigator.onLine);

  useEffect(() => {
    if (!online) {
      experiencedOffline.current = true;
      setRestored(false);
      return;
    }
    if (!experiencedOffline.current) return;
    setRestored(true);
    const timer = window.setTimeout(() => setRestored(false), 3000);
    return () => window.clearTimeout(timer);
  }, [online]);

  if (!online) {
    return <StatusMessage tone="error" message="目前網路已中斷，尚未儲存的資料會保留在本機，恢復連線後請重新儲存。" />;
  }
  return restored ? <StatusMessage tone="success" message="網路已恢復。" /> : null;
}
