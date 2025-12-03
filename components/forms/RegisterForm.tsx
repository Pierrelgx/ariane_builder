import { useState } from "react";
import { signIn } from "next-auth/react";
import { ZodError } from "zod";
import { registerSchema } from "@schemas/userSchema";
import { parseZodErrors } from "@utils/parseZodErrors";
import { parseSigninErrors } from "@utils/parseSigninErrors";
import { button } from "@tv/button";
import { input } from "@tv/input";

interface registerFormProps {
  handleClick: () => void;
}

export const RegisterForm = ({ handleClick }: registerFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const parsed = registerSchema.parse(formData);
      setErrors({});

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!res.ok) {
        setErrors(parseSigninErrors("UserAlreadyExistsError"));
        return ;
      }

      const result = await signIn("credentials", {
        email: parsed.email,
        password: parsed.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors(parseSigninErrors(result.error));
        return;
      }
      handleClick();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        setErrors(parseZodErrors(error));
      } else setErrors({ general: "Unknown error" });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 p-6"
      onClick={handleClick}
    >
      <form
        className="flex flex-col items-center space-y-4 bg-dark-200 p-6 rounded-xl shadow-lg w-full max-w-md mx-auto border border-dark-400"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-bold text-white mb-2">Inscription</h2>
        <div className="w-full">
          <label htmlFor="name" className="block text-sm text-gray-300 mb-1">
            Nom
          </label>
          <input
            type="text"
            id="name"
            name="name"
            onChange={handleChange}
            className={input()}
            required
          />
        </div>
        {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}

        <div className="w-full">
          <label
            htmlFor="email"
            className="block text-sm text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            onChange={handleChange}
            className={input()}
            placeholder="you@example.com"
            required
          />
        </div>
        {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}

        <div className="w-full">
          <label
            htmlFor="password"
            className="block text-sm text-gray-300 mb-1"
          >
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            name="password"
            onChange={handleChange}
            className={input()}
            placeholder="••••••••"
            required
          />
        </div>
        {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}

        <div className="w-full">
          <label
            htmlFor="confirmPassword"
            className="block text-sm text-gray-300 mb-1"
          >
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            onChange={handleChange}
            className={input()}
            placeholder="••••••••"
            required
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-red-400 text-sm">{errors.confirmPassword}</p>
        )}

        <button
          className={button({ intent: "nature", size: "md", fullWidth: true })}
          type="submit"
        >
          S'inscrire
        </button>
      </form>
    </div>
  );
};
