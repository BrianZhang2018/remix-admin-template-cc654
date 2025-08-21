import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import Logo from "~/components/Logo";

export default function Welcome() {
  const { t } = useTranslation();

  return (
    <main className="flex grow">
      <div className="absolute left-4 top-4">
        <Logo />
      </div>
      <div className="hidden p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 lg:basis-5/12 lg:flex lg:items-center lg:justify-center">
        <img src="/user.jpg" alt="AI VibeCoding Forum" className="w-64 h-64 rounded-lg object-cover shadow-2xl" />
      </div>
      <div className="flex flex-col items-center justify-center w-full px-4 py-24 lg:px-8 lg:basis-7/12">
        <div className="w-full max-w-2xl px-8 py-10 space-y-8 bg-white shadow-md rounded-xl lg:space-y-10 lg:px-10 lg:py-12">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl lg:text-4xl">
              {t('welcome.title')}
            </h1>
            <p className="text-lg text-slate-600">
              {t('welcome.description')}
            </p>
          </div>
          
          <div className="space-y-4">
            <Link
              to="/login"
              className="block w-full px-4 py-3 text-center text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors font-medium"
            >
              {t('welcome.login')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
