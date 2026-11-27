"use client";
import { Fragment } from "react";
import PurchasedOrderItem from "./purchasedOrderItem";
import { Menu, Transition, MenuItem, MenuItems, MenuButton } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { formatCurrencyString } from "use-shopping-cart";

interface OrderContainerProps {
  order: any;
  onSelectOrder: (o: string) => void;
}

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

export default function OrderContainer({ order, onSelectOrder }: OrderContainerProps) {
  const total = order.total && typeof order.total === "string" ? `$${order.total}` : formatCurrencyString({ value: order.total, currency: "USD" });
  return (
    <div key={Math.random()} className="border-b border-t border-gray-200 bg-white shadow-sm sm:rounded-lg sm:border">
      <h3 className="sr-only">{`Order placed on ${order.date.toDate().toDateString()}`}</h3>

      <div className="flex items-center border-b border-gray-200 p-4 sm:grid sm:grid-cols-4 sm:gap-x-6 sm:p-6">
        <dl className="grid flex-1 grid-cols-2 gap-x-6 text-sm sm:col-span-3 sm:grid-cols-3 lg:col-span-2">
          <div>
            <dt className="font-mont font-medium text-gray-900">Order number</dt>
            <dd className="font-mont mt-1 text-gray-500">{`#${order.pa_order_id}`}</dd>
          </div>
          <div className="hidden sm:block">
            <dt className="font-mont font-medium text-gray-900">Date placed</dt>
            <dd className="font-mont mt-1 text-gray-500">{`${order.date.toDate().toDateString()}`}</dd>
          </div>
          <div>
            <dt className="font-mont font-medium text-gray-900">Total amount</dt>
            <dd className="font-mont mt-1 font-medium text-gray-900">{total}</dd>
          </div>
        </dl>

        <Menu as="div" className="relative flex justify-end lg:hidden">
          <div className="flex items-center">
            <MenuButton className="-m-2 flex items-center p-2 text-gray-400 hover:text-gray-500">
              <span className="sr-only">Options for order {order.pa_order_id}</span>
              <EllipsisVerticalIcon className="h-6 w-6" aria-hidden="true" />
            </MenuButton>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-bottom-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={() => onSelectOrder(order.stripe.paymentIntent)}
                      className={classNames(focus ? "bg-gray-100 text-gray-900" : "text-gray-700", "font-mont block px-4 py-2 text-sm")}
                    >
                      View
                    </button>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Transition>
        </Menu>

        <div className="hidden lg:col-span-2 lg:flex lg:items-center lg:justify-end lg:space-x-4">
          <button
            type="button"
            onClick={() => onSelectOrder(order.stripe.paymentIntent)}
            className="font-mont flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span>View Order</span>
            <span className="sr-only">{order.pa_order_id}</span>
          </button>
        </div>
      </div>

      {/* Products */}
      <h4 className="sr-only">Items</h4>
      <ul role="list" className="divide-y divide-gray-200">
        {order.parts.map((part: any) => {
          return <PurchasedOrderItem key={Math.random()} part={part} />;
        })}
      </ul>
    </div>
  );
}
