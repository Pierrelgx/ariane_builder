import { tv } from "tailwind-variants";

export const button = tv({
  base: "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark",
  variants: {
    intent: {
      nature: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-400",
      outline: "border border-green-500 text-green-400 hover:bg-green-500/10 focus:ring-green-400",
      ghost: "text-green-400 hover:bg-green-500/10 focus:ring-green-400",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400",
      secondary: "bg-dark-400 text-gray-200 hover:bg-dark-500 focus:ring-dark-600 border border-dark-500",
    },
    size: {
      sm: "text-sm py-1 px-3",
      md: "text-base py-2 px-4",
      lg: "text-lg py-3 px-5",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    intent: "nature",
    size: "md",
    fullWidth: false,
  },
});
