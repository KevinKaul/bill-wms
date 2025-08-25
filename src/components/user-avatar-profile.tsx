"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

interface UserAvatarProfileProps {
  className?: string;
  showInfo?: boolean;
  user: {
    imageUrl?: string;
    fullName?: string | null;
    emailAddresses: Array<{ emailAddress: string }>;
  } | null;
}

export function UserAvatarProfile({
  className,
  showInfo = false,
  user,
}: UserAvatarProfileProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 防止hydration mismatch，在客户端mount之前显示默认状态
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className={className}>
          <AvatarFallback className="rounded-lg">CN</AvatarFallback>
        </Avatar>
        {showInfo && (
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">用户</span>
            <span className="truncate text-xs">user@example.com</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar className={className}>
        <AvatarImage src={user?.imageUrl || ""} alt={user?.fullName || ""} />
        <AvatarFallback className="rounded-lg">
          {user?.fullName?.slice(0, 2)?.toUpperCase() || "CN"}
        </AvatarFallback>
      </Avatar>

      {showInfo && (
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{user?.fullName || ""}</span>
          <span className="truncate text-xs">
            {user?.emailAddresses?.[0]?.emailAddress || ""}
          </span>
        </div>
      )}
    </div>
  );
}
