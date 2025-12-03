import { tv } from "tailwind-variants";

export const input = tv({
  base: "w-full rounded-lg border px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-200",
  variants: {
    intent: {
      nature:
        "border-dark-500 focus:ring-green-500 focus:border-green-500 bg-dark-300 text-white placeholder:text-gray-500",
      error:
        "border-red-500 focus:ring-red-400 bg-dark-300 text-white placeholder:text-red-400",
      disabled: "bg-dark-400 text-gray-500 cursor-not-allowed border-dark-500",
    },
    size: {
      sm: "text-sm py-1.5 px-3",
      md: "text-base py-2 px-4",
      lg: "text-lg py-3 px-5",
    },
  },
  defaultVariants: {
    intent: "nature",
    size: "md",
  },
});
