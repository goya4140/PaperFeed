'use client';
import { useStorageStatus, retrySync } from '@/lib/demo-store';
export function StorageStatus() {
  const status = useStorageStatus();
  return (
    <div className="storage-status" role="status">
      <span>{status}</span>
      {/重试/.test(status) && <button onClick={retrySync}>重试保存</button>}
    </div>
  );
}
