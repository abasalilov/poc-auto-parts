import { Fragment, useRef } from "react";

import Input from "@mui/joy/Input";

import { Dialog, DialogTitle, DialogPanel, TransitionChild, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ReAuthModal {
  open: boolean;
  toggleModal: (x: boolean) => void;
  onSubmit: () => void;
  handleEnterPassword: (x: any) => void;
  email: string;
}

export default function ReAuthModal({ open, toggleModal, handleEnterPassword, email, onSubmit }: ReAuthModal) {
  const reAuthRef = useRef(null);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog className="mb-30 z-10" initialFocus={reAuthRef} onClose={() => toggleModal(false)}>
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
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="font-mont rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => toggleModal(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mx-auto flex flex-row items-center justify-center">
                    <div>
                      <DialogTitle as="h3" className="font-mont text-red-500 text-lg font-semibold leading-6 text-gray-900">
                        Re-Authentication required to complete your request
                      </DialogTitle>
                    </div>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <div className="mt-2">{email && <Input className="font-mont" type="email" name="email" disabled={true} value={email} />}</div>
                    <div className="mt-2">
                      <Input className="font-mont" type="password" name="password" placeholder="Password" onChange={handleEnterPassword} />
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 w-full sm:w-3/5 mx-auto">
                  <button
                    type="button"
                    className="font-mont inline-flex w-full justify-center rounded-md bg-parts-pass-blue px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-parts-pass-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                    onClick={onSubmit}
                  >
                    Submit
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
