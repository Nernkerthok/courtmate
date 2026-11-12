import { Cat, Dog, Rabbit, Bird } from "lucide-react";
import { playerAvatar, type Player } from "./domain";
const colors = [
  "bg-[#e2efcf] text-[#426522]",
  "bg-[#e2edf5] text-[#395f82]",
  "bg-[#f6e8cf] text-[#805e28]",
  "bg-[#eee4f4] text-[#715187]",
  "bg-[#f5e2e9] text-[#8b4463]",
];
export function Avatar({ p }: { p: Pick<Player, "id" | "avatar"> }) {
  const choice = playerAvatar(p);
  const portrait = choice + 1;
  const Animal = [Cat, Dog, Rabbit, Bird][choice - 8];
  const shirts = ["#078bff", "#4ab694", "#9670ee", "#ed9b4d", "#e778a1"];
  const skin = portrait % 3 === 0 ? "#d59669" : "#ffc79b";
  return (
    <span
      aria-hidden="true"
      className={`player-avatar flex size-9 shrink-0 items-center justify-center rounded-full text-sm ${colors[choice % colors.length]}`}
      data-avatar={choice}
    >
      {Animal ? (
        <Animal className="animal-avatar" strokeWidth={1.8} />
      ) : (
        <svg viewBox="0 0 48 48" fill="none">
          <path
            d="M7 48c0-12 7-17 17-17s17 5 17 17"
            fill={shirts[choice % shirts.length]}
          />
          <path d="m19 30 5 8 5-8" fill="white" />
          <rect x="20" y="26" width="8" height="10" rx="3" fill={skin} />
          {portrait % 2 === 0 && (
            <path
              d="M12 20C10 3 38 3 36 20l2 18-10-4-10 2-8-1Z"
              fill="#27314a"
            />
          )}
          <ellipse cx="24" cy="20" rx="11" ry="14" fill={skin} />
          <path
            d="M13 19C8 6 23 2 28 6c10-1 10 9 7 13l-4-8c-4 5-10 3-14 2l-3 8Z"
            fill="#27314a"
          />
          <path
            d="M19 20h.1m9.8 0h.1"
            stroke="#27314a"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M21 26q3 3 6 0"
            stroke="#a95c47"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}
