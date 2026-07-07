import { LogOut } from "lucide-react";
import { Button } from "@portraq/ui";

type UserFooterProps = {
  name: string;
  email: string;
  initial: string;
  onLogout: () => void;
  disabled: boolean;
};

export const UserFooter = ({
  name,
  email,
  initial,
  onLogout,
  disabled,
}: UserFooterProps) => {
  return (
    <div className="border-t border-[#f4f4f5] p-3">
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#355df9] to-[#6b8ffb] text-[11px] font-extrabold text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold text-[#1c1c1e]">
            {name}
          </div>
          <div className="truncate text-[11px] text-[#9ca3af]">{email}</div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onLogout}
          disabled={disabled}
          title="로그아웃"
          aria-label="로그아웃"
          className="h-[30px] w-[30px] shrink-0 rounded-lg text-[#9ca3af] hover:bg-[#f4f4f5] hover:text-[#6b6b7b]"
        >
          <LogOut size={17} />
        </Button>
      </div>
    </div>
  );
};
