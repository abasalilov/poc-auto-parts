"use client";
import { useState } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";
import LoginForm from "@/components/loginForm";
import CreateAccountSection from "@/components/createAccountSection";

export default function LoginPage() {
  const [showLogin, setShowLogin] = useState<boolean>(true);

  const handleSelectLoginForm = () => {
    setShowLogin(true);
  };

  const handleSelectRegistrationForm = () => {
    setShowLogin(false);
  };

  return (
    <div>
      <Header />
      <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm space-y-10">
          {showLogin && (
            <div>
              <h2 className="font-mont my-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                Sign in to your account
              </h2>
              <LoginForm />
              <p className="font-mont text-center text-sm leading-6 text-gray-500">
                Not a member?{" "}
                <button
                  className="font-mont font-semibold text-parts-pass-blue hover:text-parts-pass-blue-light"
                  onClick={handleSelectRegistrationForm}
                  type="button"
                >
                  Register here
                </button>
              </p>
            </div>
          )}
          {!showLogin && (
            <div>
              <h2 className="font-mont mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                Create account
              </h2>
              <CreateAccountSection />

              <p className="font-mont text-center text-sm leading-6 text-gray-500">
                Already a member?{" "}
                <button
                  className="font-mont font-semibold text-parts-pass-blue hover:text-parts-pass-blue-light"
                  onClick={handleSelectLoginForm}
                  type="button"
                >
                  Sign in here
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
