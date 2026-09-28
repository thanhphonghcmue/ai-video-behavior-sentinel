'use client';

import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen bg-[#F9FAFB] text-[#111827] flex flex-col overflow-hidden font-sans">
      {children}
    </div>
  );
}
