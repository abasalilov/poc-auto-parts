import { Fragment } from "react";
import {
  Menu,
  Transition,
  MenuItem,
  MenuItems,
  MenuButton,
} from "@headlessui/react";
import { ArrowsUpDownIcon, ChevronDownIcon } from "@heroicons/react/20/solid";

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

interface SortFilterDropDownProps {
  filter: string;
  onSelectFilter: (v: any) => void;
  options: any[];
}

export default function SortFilterDropDown({
  filter,
  onSelectFilter,
  options,
}: SortFilterDropDownProps) {
  const filterName = options.find((option) => option.value === filter)?.label ?? options[0]?.label;
  return (
    <Menu as="div" className="relative inline-block shrink-0 text-left md:w-56">
      <div className="md:m-0 lg:m-0">
        <MenuButton
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:h-auto sm:w-full sm:gap-x-1.5 sm:px-3 sm:py-2 sm:text-sm sm:font-semibold"
          aria-label={`Sort results by ${filterName}`}
        >
          <ArrowsUpDownIcon className="h-5 w-5 text-gray-600 sm:hidden" aria-hidden="true" />
          <span className="hidden sm:inline">{`Sort: ${filterName}`}</span>
          <ChevronDownIcon
            className="hidden h-5 w-5 text-gray-400 sm:block"
            aria-hidden="true"
          />
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
        <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:w-full">
          <div className="py-1 border-2">
            {options.map((o, idx) => {
              const selected = o.value === filter;
              return (
                <div className="py-1" key={idx}>
                  <MenuItem>
                    {({ focus }) => (
                      <a
                        onClick={() => onSelectFilter(o.value)}
                        className={classNames(
                          focus || selected
                            ? "bg-gray-100 text-parts-pass-blue"
                            : "text-gray-700",
                          "font-mont group flex items-center px-4 py-2 text-sm",
                        )}
                      >
                        {o.label}
                      </a>
                    )}
                  </MenuItem>
                </div>
              );
            })}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
