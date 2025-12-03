import { ZodError } from "zod";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { loginSchema } from "@schemas/userSchema";
import { parseZodErrors } from "@utils/parseZodErrors";
import { parseSigninErrors } from "@utils/parseSigninErrors";
import { button } from "@tv/button";
import { input } from "@tv/input";

interface loginFormProps {
  handleClick: () => void;
}

export const LoginForm = ({ handleClick }: loginFormProps) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
      const parsed = loginSchema.parse(formData);
      setErrors({});

      const result = await signIn("credentials", {
        email: parsed.email,
        password: parsed.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors(parseSigninErrors(result.error));
        return ;
      }
      handleClick();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        setErrors(parseZodErrors(error));
      } else setErrors({ general: "Unknow error" });
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
        <h2 className="text-xl font-bold text-white mb-2">Connexion</h2>
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
          />
        </div>
        {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}

        <button
          className={button({ intent: "nature", size: "md", fullWidth: true })}
          type="submit"
        >
          Se connecter
        </button>
        {errors.form && <p className="text-red-400 text-sm">{errors.form}</p>}
      </form>
    </div>
  );
};
