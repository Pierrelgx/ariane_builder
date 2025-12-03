import { tv } from "tailwind-variants";

export const header = tv({
  base: "w-full flex items-center justify-between px-6 py-4 bg-dark-100 shadow-lg border-b border-dark-400",
  variants: {
    padded: {
      true: "py-6",
      false: "py-2",
    },
    sticky: {
      true: "sticky top-0 z-50 bg-dark-100",
      false: "",
    },
  },
  defaultVariants: {
    padded: true,
    sticky: false,
  },
});
