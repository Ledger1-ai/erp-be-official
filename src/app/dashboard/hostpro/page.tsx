"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import HostProPanel from '@/components/hostpro/HostProPanel';

export default function HostProPage() {
  return (
    <DashboardLayout>
      <HostProPanel />
    </DashboardLayout>
  );
}


