"use client";

import { initialsOf, useCurrentUser } from "../model/current-user";

interface UserAvatarProps {
  className?: string;
  initials?: string;
  showStatus?: boolean;
}

export function UserAvatar({
  className = "size-8 text-[11px]",
  initials,
  showStatus = false,
}: UserAvatarProps) {
  const { profile } = useCurrentUser();
  const label = initials ?? initialsOf(profile?.name);
  return (
    <span className="relative inline-flex shrink-0">
      <span
        aria-hidden
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover font-extrabold tracking-[-0.02em] text-primary-foreground ${className}`}
      >
        {label}
      </span>
      {showStatus && (
        <span aria-hidden className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-[#171a1c] bg-primary" />
      )}
    </span>
  );
}
