"use client";

import { UserAvatar } from "@/components/ui/UserAvatar";

type ProfileHeroProps = {
  username: string;
  iconUrl: string | null;
  actions?: React.ReactNode;
};

export function ProfileHero({ username, iconUrl, actions }: ProfileHeroProps) {
  return (
    <div>
      {actions}
      <div className="flex justify-center pt-6">
        <UserAvatar username={username} iconUrl={iconUrl} size="xl" />
      </div>
    </div>
  );
}
