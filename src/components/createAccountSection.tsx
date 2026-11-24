"use client";
import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "reactfire";
import { getAuth, linkWithCredential, EmailAuthProvider } from "firebase/auth";
import { collection, doc, setDoc } from "firebase/firestore";
import CircularProgress from "@mui/joy/CircularProgress";

import { Formik } from "formik";
import * as Yup from "yup";
import Input from "@mui/joy/Input";
import { UserContext } from "@/context/UserContext";
import { CartContext } from "@/context/CartContext";
import { USERS } from "@/lib/constants";
import { trackGa4SignUp } from "@/lib/ga4Analytics";
import { useBackForwardRestore } from "@/lib/useBackForwardRestore";

interface CreateAccountSectionProps {}

export default function CreateAccountSection(props: CreateAccountSectionProps) {
  const auth = getAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { user, setUser } = useContext(UserContext);
  const { readyToCheckout, checkout } = useContext(CartContext);
  const [processing, setProcessing] = useState(false);
  useBackForwardRestore(() => setProcessing(false));
  const [signUpError, setSignUpError] = useState<any>("");

  const handleSubmit = async (values: any) => {
    setProcessing(true);
    try {
      const { email, password } = values;
      const credential = await EmailAuthProvider.credential(email, password);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userCredential = await linkWithCredential(
          currentUser,
          credential,
        );
        const usersRef = collection(firestore, USERS);
        await setDoc(doc(usersRef, userCredential.user.uid), {
          name: values.name,
          email: values.email,
          timestamp: new Date(),
        });
        setUser(userCredential.user);
        if (typeof window !== undefined) {
          trackGa4SignUp({ userId: user.uid, method: "email" });
        }
      }

      if (readyToCheckout) {
        await checkout();
      } else {
        router.push("/");
      }
    } catch (error: any) {
      console.log("error in signing up", error);
      const errorCode = error.code;
      setSignUpError(errorCode);
      setProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <Formik
        initialValues={{
          name: "",
          email: user?.email || "",
          password: "",
          passwordConfirmation: "",
        }}
        validationSchema={Yup.object().shape({
          name: Yup.string().required("Name is Required"),
          email: Yup.string()
            .matches(
              /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
              "Please enter a valid email",
            )
            .required("Email Address is Required"),
          password: Yup.string()
            .min(8, "Password is too short - should be 8 chars minimum.")
            .matches(/[0-9]/, "Password must contain at least one number")
            .matches(
              /[A-Z]/,
              "Password must contain at lease one uppercase letter",
            )
            .required("Password is required"),
          passwordConfirmation: Yup.string()
            .oneOf([Yup.ref("password")], "Passwords must match")
            .required("Please confirm your password"),
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
            <div className="my-4">
              <label
                htmlFor="name"
                className="font-mont block text-sm font-medium leading-6 text-gray-900"
              >
                Name
              </label>
              <div className="my-1">
                <Input
                  className="font-mont block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6"
                  type="text"
                  name="name"
                  placeholder="Name"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.name}
                />
                <div className="h-4 font-mont">
                  {errors.name && touched.name && (
                    <h4 className="font-mont ml-2 text-red-500">
                      {errors.name as string}
                    </h4>
                  )}
                </div>
              </div>
            </div>

            <div className="my-4">
              <label
                htmlFor="email"
                className="font-mont block text-sm font-medium leading-6 text-gray-900"
              >
                Email address
              </label>
              <div className="my-1">
                <Input
                  className="font-mont block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6"
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.email}
                />
                <div className="h-4 font-mont">
                  {errors.email && touched.email && (
                    <h4 className="font-mont ml-2 text-red-500">
                      {errors.email as string}
                    </h4>
                  )}
                </div>
              </div>
            </div>

            <div className="my-4">
              <label
                htmlFor="password"
                className="font-mont block text-sm font-medium leading-6 text-gray-900"
              >
                Password
              </label>
              <div className="my-1">
                <Input
                  className="font-mont block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6"
                  type="password"
                  name="password"
                  placeholder="Password"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.password}
                />
                <div className="h-4 font-mont">
                  {errors.password && touched.password && (
                    <h4 className="font-mont ml-2 text-red-500">
                      {errors.password as string}
                    </h4>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label
                htmlFor="confirm-password"
                className="font-mont block text-sm font-medium leading-6 text-gray-900"
              >
                Confirm Password
              </label>
              <div className="my-1">
                <Input
                  className="font-mont block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6"
                  type="password"
                  name="passwordConfirmation"
                  placeholder="Password"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.passwordConfirmation}
                />
                <div className="h-4 font-mont">
                  {errors.passwordConfirmation &&
                    touched.passwordConfirmation && (
                      <h4 className="font-mont ml-2 text-red-500">
                        {errors.passwordConfirmation as string}
                      </h4>
                    )}
                </div>
              </div>
            </div>

            <div className="">
              {!processing && (
                <button
                  type="submit"
                  className="font-mont mt-10 flex w-full justify-center rounded-md bg-parts-pass-blue px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-parts-pass-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Create Account
                </button>
              )}
              {processing && (
                <div className="flex justify-center items-center h-20">
                  <CircularProgress size="lg" />
                </div>
              )}
              <div className="h-4 font-mont">
                {signUpError.length > 0 && (
                  <h4 className="font-mont ml-2 text-red-500">{signUpError}</h4>
                )}
              </div>
            </div>
          </form>
        )}
      </Formik>
    </div>
  );
}
