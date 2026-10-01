'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CameraMonitoringRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/quet-camera-truc-tiep');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-gray-500">
      Đang chuyển hướng tới Quét Camera Trực Tiếp...
    </div>
  );
}
