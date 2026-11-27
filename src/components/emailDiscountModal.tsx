import { Fragment, useRef, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import Input from "@mui/joy/Input";

import {
  Dialog,
  DialogTitle,
  DialogPanel,
  TransitionChild,
  Transition,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFirestore } from "reactfire";
import { useUserContext } from "@/context/UserContext";
import { doc, updateDoc } from "firebase/firestore";
import { USERS } from "@/lib/constants";

interface EmailDiscountModal {
  open: boolean;
}

export default function EmailDiscountModal() {
  const firestore = useFirestore();
  const { user, setShowUserEmailDiscountModal, showUserEmailDiscountModal } =
    useUserContext();
  const userEmailDiscountRef = useRef(null);

  const [showEmailMsgSection, setShowEmailMsgSection] =
    useState<boolean>(false);
  const [emailSaved, setEmailSaved] = useState<boolean>(false);

  const handleSaveEmail = async (email: string) => {
    try {
      const useRef = doc(firestore, USERS, user.uid);
      await updateDoc(useRef, {
        timestamp: new Date(),
        email: email,
      });
      setShowEmailMsgSection(true);
      setEmailSaved(true);
    } catch (error) {
      setEmailSaved(false);
      setShowEmailMsgSection(false);
    }
  };

  const handleCloseModal = () => {
    setShowUserEmailDiscountModal(false);
  };

  return (
    <Transition show={showUserEmailDiscountModal} as={Fragment}>
      <Dialog
        className="relative z-10"
        initialFocus={userEmailDiscountRef}
        onClose={() => handleCloseModal()}
      >
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="flex justify-center items-center absolute right-0 top-0 hidden p-2 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={handleCloseModal}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  {!showEmailMsgSection && (
                    <>
                      <div className="mx-auto flex flex-row items-center justify-center">
                        <DialogTitle
                          as="h3"
                          className="font-mont ml-8 text-lg font-semibold leading-6 text-gray-900"
                        >
                          Unlock 10% Off Your First Order!
                        </DialogTitle>
                      </div>

                      <div className="mt-3 text-center sm:mt-5">
                        <div className="mt-2 flex justify-center"></div>
                        <div className="mt-2">
                          <p className="font-mont text-md text-gray-500">{`Sign up with your email to get an exclusive promo code for 10% off. Don't miss out, start saving on quality auto parts today!`}</p>
                        </div>
                      </div>
                    </>
                  )}
                  {showEmailMsgSection && (
                    <div className="mx-auto">
                      <DialogTitle
                        as="h2"
                        className="font-mont flex items-center justify-center text-center h-32 text-xl font-semibold leading-6 text-gray-900"
                      >
                        {emailSaved
                          ? `Your 10% Discount Code is: WELCOME10 `
                          : "We're sorry, there was an error saving your email, please reach out and we will provide you one"}
                      </DialogTitle>
                    </div>
                  )}
                  {!showEmailMsgSection && (
                    <Formik
                      initialValues={{
                        email: user?.email || "",
                      }}
                      validationSchema={Yup.object().shape({
                        email: Yup.string()
                          .matches(
                            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                            "Please enter a valid email",
                          )
                          .required("Email Address is Required"),
                      })}
                      onSubmit={async (values, { setSubmitting }) => {
                        emailSaved
                          ? handleCloseModal()
                          : await handleSaveEmail(values.email);
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
                        <form onSubmit={handleSubmit}>
                          <div>
                            <label
                              htmlFor="email"
                              className="font-mont block text-sm font-medium leading-6 text-gray-900"
                            >
                              Email address
                            </label>
                            <div className="mt-2">
                              <Input
                                className="font-mont block w-full rounded-md border-transparent py-1.5 placeholder:text-gray-400 sm:text-sm sm:leading-6 activer:outline-none"
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
                          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                            <button
                              className="font-mont inline-flex w-full justify-center rounded-md bg-parts-pass-blue px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-parts-pass-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                              type="submit"
                              disabled={isSubmitting}
                            >
                              {emailSaved ? "Continue Shopping" : "Save Email"}
                            </button>
                            <button
                              type="button"
                              className="font-mont mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                              onClick={handleCloseModal}
                              ref={userEmailDiscountRef}
                            >
                              No Thank You
                            </button>
                          </div>
                        </form>
                      )}
                    </Formik>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
