import { useRef } from "react";

type Props = {
  id: string;
  prefix: string;
  length: number;
  value: string;
  disabled: boolean;
  inputRef: (node: HTMLInputElement | null) => void;
  onChange: (value: string, advance: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
};

export function InlineBlank({
  id,
  prefix,
  length,
  value,
  disabled,
  inputRef,
  onChange,
  onNext,
  onPrevious,
}: Props) {
  const composing = useRef(false);
  const enteringWithPointer = useRef(false);
  const placeAtEnd = (input: HTMLInputElement) =>
    input.setSelectionRange(input.value.length, input.value.length);
  return (
    <span
      className={`practice-word ${value.length === length ? "is-filled" : ""}`}
    >
      {prefix}
      <span className="practice-blank">
        <span className="practice-slots" aria-hidden="true">
          <span className="practice-typed-mirror">{value}</span>
          {Array.from(
            { length: Math.max(0, length - value.length) },
            (_, index) => (
              <span className="practice-slot" key={index} />
            ),
          )}
        </span>
        <input
          ref={inputRef}
          aria-label={`Missing letters after ${prefix}, ${length} letters`}
          aria-describedby={`remaining-${id}`}
          data-testid={`input-blank-${id}`}
          value={value}
          disabled={disabled}
          maxLength={length}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onPointerDown={(event) => {
            enteringWithPointer.current =
              document.activeElement !== event.currentTarget;
          }}
          onClick={(event) => {
            if (enteringWithPointer.current) placeAtEnd(event.currentTarget);
            enteringWithPointer.current = false;
          }}
          onFocus={(event) => placeAtEnd(event.currentTarget)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            onChange(event.currentTarget.value.slice(0, length), true);
          }}
          onChange={(event) =>
            onChange(event.target.value.slice(0, length), !composing.current)
          }
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || composing.current) return;
            if (event.key === "Enter") {
              event.preventDefault();
              onNext();
            }
            if (event.key === "Backspace" && !value) {
              event.preventDefault();
              onPrevious();
            }
          }}
        />
        <span id={`remaining-${id}`} className="sr-only">
          {Math.max(0, length - value.length)} letters remaining
        </span>
      </span>
    </span>
  );
}
