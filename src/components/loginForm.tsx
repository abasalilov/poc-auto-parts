"use client";
import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import CircularProgress from "@mui/joy/CircularProgress";

import { Formik } from "formik";
import * as Yup from "yup";
import Input from "@mui/joy/Input";
import { UserContext } from "@/context/UserContext";
import { checkoutReturnPath } from "@/lib/checkoutLines";
import { trackGa4Login } from "@/lib/ga4Analytics";
import { useBackForwardRestore } from "@/lib/useBackForwardRestore";

export default function LoginForm() {
  const auth = getAuth();
  const router = useRouter();
  const { user } = useContext(UserContext);
  const [processing, setProcessing] = useState(false);
  useBackForwardRestore(() => setProcessing(false));
  const [loginError, setLoginError] = useState<any>("");

  const handleSubmit = async (values: any) => {
    setProcessing(true);
    try {
      const { email, password } = values;
      await signInWithEmailAndPassword(auth, email, password);
      if (typeof window !== undefined) {
        trackGa4Login({ userId: user.uid, method: "email" });
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(next ? checkoutReturnPath(next) : "/account");
      }
    } catch (error: any) {
      let message = error.message;
      if (error.code === "auth/user-not-found") {
        message =
          "There is no account for that email, please create a new account";
      } else if (error.code === "auth/wrong-password") {
        message = "The password entered is incorrect";
      }
      console.log("login error", error);
      setLoginError(message);
      setProcessing(false);
    }
  };

  return (
    <Formik
      initialValues={{
        email: user?.email || "",
        password: "",
      }}
      validationSchema={Yup.object().shape({
        email: Yup.string()
          .matches(
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please enter a valid email",
          )
          .required("Email Address is Required"),
        password: Yup.string().required("Password is required"),
      })}
      onSubmit={async (values, { setSubmitting }) => {
        await handleSubmit(values);
        setSubmitting(false);
      }}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting,
      }) => (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="font-mont block text-sm font-medium leading-6 text-gray-900"
            >
              Email address
            </label>
            <div className="mt-2">
              <Input
                className="font-mont block w-full rounded-md border-0 py-1.5 placeholder:text-gray-400 sm:text-sm sm:leading-6"
                type="email"
                name="email"
                placeholder="Email"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.email}
              />
              <div className="h-8 mt-4 font-mont">
                {errors.email && touched.email && (
                  <h4 className="font-mont ml-2 text-red-500">
                    {errors.email as string}
                  </h4>
                )}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="font-mont block text-sm font-medium leading-6 text-gray-900"
            >
              Password
            </label>
            <div className="mt-2">
              <Input
                className="font-mont block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6"
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.password}
              />
              <div className="h-8 mt-4 font-mont">
                {errors.password && touched.password && (
                  <h4 className="font-mont ml-1 text-red-500">
                    {errors.password as string}
                  </h4>
                )}
              </div>
            </div>
          </div>
          <div>
            {!processing && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="font-mont flex w-full justify-center rounded-md bg-parts-pass-blue px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-parts-pass-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
              >
                Sign in
              </button>
            )}
            {processing && (
              <div className="flex justify-center items-center h-20">
                <CircularProgress size="lg" />
              </div>
            )}
            <div className="h-8 mt-1 font-mont ">
              {loginError.length > 0 && (
                <h4 className="font-mont ml-1 text-red-500">{loginError}</h4>
              )}
            </div>
          </div>
        </form>
      )}
    </Formik>
  );
}

//TODO: FORGOT PASSWORD FLOW
