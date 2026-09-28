import * as Menu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import type { PracticeSet } from "@workspace/api-client-react";

export function PracticePicker({
  sets,
  selectedId,
  scores,
  disabled,
  onSelect,
}: {
  sets: PracticeSet[];
  selectedId: string;
  scores: Record<string, number>;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        className="practice-picker-trigger"
        disabled={disabled}
        aria-label="Choose a passage"
      >
        Practice{" "}
        {String(sets.findIndex((set) => set.id === selectedId) + 1).padStart(
          2,
          "0",
        )}
        <ChevronDown size={16} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          className="practice-picker-menu"
          align="start"
          sideOffset={10}
          collisionPadding={16}
        >
          <Menu.RadioGroup
            value={selectedId}
            onValueChange={(id) => {
              if (id !== selectedId) onSelect(id);
            }}
          >
            {sets.map((set, index) => (
              <Menu.RadioItem
                key={set.id}
                value={set.id}
                className="practice-picker-row"
                textValue={set.title}
              >
                <span className="practice-picker-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="practice-picker-copy">
                  <strong>{set.title}</strong>
                  <span>{set.topic} · 3 min</span>
                </span>
                <span className="practice-picker-status">
                  {set.id === selectedId ? (
                    <Check size={18} aria-label="Current practice" />
                  ) : scores[set.id] !== undefined ? (
                    <>
                      <strong>{scores[set.id]}%</strong>
                      <small>correct</small>
                    </>
                  ) : null}
                </span>
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
