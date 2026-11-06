import type { JSX } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";

type ConsentButtonProps = Omit<
  JSX.IntrinsicElements["button"],
  "onClick" | "ref"
> & {
  onClick: () => void;
};

// WP Rocket otherwise queues click listeners until every delayed script loads.
const immediateListener: AddEventListenerOptions & { isRocket: boolean } = {
  isRocket: true,
};

export function ConsentButton({ onClick, ...props }: ConsentButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const button = ref.current;
    if (!button) return;
    const handleClick = (event: MouseEvent) => {
      // Do not let Rocket queue and replay a consent action a second time.
      event.stopPropagation();
      onClick();
    };
    button.addEventListener("click", handleClick, immediateListener);
    return () =>
      button.removeEventListener("click", handleClick, immediateListener);
  }, [onClick]);
  return <button {...props} ref={ref} />;
}
