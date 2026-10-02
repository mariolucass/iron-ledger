interface UserAvatarProps {
  className?: string;
  initials?: string;
  showStatus?: boolean;
}

export function UserAvatar({
  className = "size-8 text-[11px]",
  initials = "AL",
  showStatus = false,
}: UserAvatarProps) {
  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover font-extrabold tracking-[-0.02em] text-primary-foreground ${className}`}
      >
        {initials}
      </span>
      {showStatus && (
        <span className="absolute right-0 bottom-0 size-2 rounded-full border-[1.5px] border-background bg-primary" />
      )}
    </span>
  );
}
