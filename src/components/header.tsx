"use client";
import { useContext, useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useShoppingCart } from "use-shopping-cart";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import ShoppingCart from "@mui/icons-material/ShoppingCart";
import Search from "@mui/icons-material/Search";
import Person from "@mui/icons-material/Person";

import { UserContext } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { trackGa4PageView } from "@/lib/ga4Analytics";

import partsPassHeader from "../../public/parts_pass_logo_white.png";
import AddToCartModal from "./addToCartModal";

const navigation = [
  { name: "Search", href: "/", icon: <Search fontSize="small" /> },
  { name: "Cart", href: "/cart", icon: <ShoppingCart fontSize="small" /> },
];

export default function Header() {
  const headerRef = useRef(null);
  const { user } = useContext(UserContext);
  const pathname = usePathname();
  const currentPathname = pathname ?? "/";
  const { cartCount } = useShoppingCart();
  const { isSideCartOpen, setIsSideCartOpen } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [lastLogged, setLastLogged] = useState<string>("/");

  useEffect(() => {
    if (currentPathname !== lastLogged) {
      setLastLogged(currentPathname);
      trackGa4PageView({
        userId: user.uid,
        pageName: currentPathname,
      });
    }
  }, [headerRef, currentPathname]);

  let hasItems = false;
  if (cartCount) {
    hasItems = cartCount > 0;
  }
  const isAccount = currentPathname.includes("account");
  const isLogin = currentPathname.includes("login");
  const isCart = currentPathname.includes("cart");
  const isSearch = currentPathname === "/";

  const activeRouteClassName =
    "leading-6 border-parts-pass-green border-b text-white font-mont";
  const inactiveRouteClassName =
    "leading-6 text-white border-parts-pass-blue border-b font-mont";

  const cartLinkClassName = isCart
    ? activeRouteClassName
    : inactiveRouteClassName;
  const loginLinkClassName = isLogin
    ? activeRouteClassName
    : inactiveRouteClassName;
  // const loginTextClassName = isLogin ? "text-sm font-semibold leading-6 text-white border-parts-pass-green border-b" : "text-sm font-semibold leading-6 text-white ";
  const searchLinkClassName = isSearch
    ? " border-parts-pass-green border-b text-white "
    : "text-white border-parts-pass-blue border-b";
  const accountLinkClassName = isAccount
    ? activeRouteClassName
    : inactiveRouteClassName;

  const mobileActiveClassName =
    "-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-parts-pass-green font-mont";
  const mobileInactiveClassName =
    "-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white font-mont";
  const mobileAccountLinkClass = isAccount
    ? mobileActiveClassName
    : mobileInactiveClassName;
  const mobileLoginLinkClass = isLogin
    ? mobileActiveClassName
    : mobileInactiveClassName;
  const mobileCartLinkClass = isCart
    ? mobileActiveClassName
    : mobileInactiveClassName;
  const mobileSearchLinkClass = isSearch
    ? mobileActiveClassName
    : mobileInactiveClassName;

  const getClassName = (href: string) => {
    let cl = "";
    if (href === "/") {
      cl = searchLinkClassName;
    } else if (href === "/cart") {
      cl = cartLinkClassName;
    }
    return cl;
  };

  const getMobileClassName = (href: string) => {
    let mcl = "";
    if (href === "/") {
      mcl = mobileSearchLinkClass;
    } else if (href === "/cart") {
      mcl = mobileCartLinkClass;
    }
    return mcl;
  };

  const openCart = () => setIsSideCartOpen(true);

  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-5KFXNCWD')`}
      </Script>
      {/* Start of LiveChat (www.livechat.com) code */}
      <Script id="livechat" strategy="afterInteractive">
        {`window.__lc = window.__lc || {};
        window.__lc.license = 19293443;
        window.__lc.integration_name = "manual_onboarding";
        window.__lc.product_name = "livechat";
        ;(function(n,t,c){function i(n){return e._h?e._h.apply(null,n):e._q.push(n)}var e={_q:[],_h:null,_v:"2.0",on:function(){i(["on",c.call(arguments)])},once:function(){i(["once",c.call(arguments)])},off:function(){i(["off",c.call(arguments)])},get:function(){if(!e._h)throw new Error("[LiveChatWidget] You can't use getters before load.");return i(["get",c.call(arguments)])},call:function(){i(["call",c.call(arguments)])},init:function(){var n=t.createElement("script");n.async=!0,n.type="text/javascript",n.src="https://cdn.livechatinc.com/tracking.js",t.head.appendChild(n)}};!n.__lc.asyncInit&&e.init(),n.LiveChatWidget=n.LiveChatWidget||e}(window,document,[].slice))`}
      </Script>
      <noscript><a href="https://www.livechat.com/chat-with/19293443/" rel="nofollow">Chat with us</a>, powered by <a href="https://www.livechat.com/?welcome" rel="noopener nofollow" target="_blank">LiveChat</a></noscript>
      {/* End of LiveChat code */}
      {/* MailerLite Universal */}
      <Script id="mailerlite" strategy="afterInteractive">
          {`(function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[])
          .push(arguments);},l=d.createElement(e),l.async=1,l.src=u,
          n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})
          (window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
          ml('account', '1783166');`}
      </Script>
      {/* End MailerLite Universal */}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-parts-pass-blue shadow-sm">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6"
          aria-label="Global"
        >
          <a href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Parts Pass</span>
            <Image
              className="h-8 w-auto"
              src={partsPassHeader}
              alt="parts pass logo"
            />
          </a>

          <div className="flex lg:hidden">
            <div className="flex mr-7">
              <button type="button" className={cartLinkClassName} onClick={openCart}>
                <span className="sr-only">Cart</span>
                <div className="relative">
                  <ShoppingCart />
                  {hasItems && (
                    <span className="border-red-500 border-2 text-xs rounded-full absolute top-0 left-3 bg-red-500 w-4 h-4 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => {
              if (item.href === "/cart") {
                return (
                  <button key={item.name} type="button" className={cartLinkClassName} onClick={openCart}>
                    <span className="sr-only">Cart</span>
                    <div className="relative">
                      <ShoppingCart />
                      {hasItems && (
                        <span className="border-red-500 border-2 text-xs rounded-full absolute top-0 left-3 bg-red-500 w-4 h-4 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={getClassName(item.href)}
                >
                  {item.icon} {item.name}
                </Link>
              );
            })}
            <div className="ml-14">
              {user?.isAnonymous && (
                <Link className={loginLinkClassName} href="/login">
                  Login
                </Link>
              )}
              {!user?.isAnonymous && (
                <Link className={accountLinkClassName} href="/account">
                  <Person />
                </Link>
              )}
            </div>
          </div>
        </nav>
        <Dialog
          className="lg:hidden"
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
        >
          <div className="fixed inset-0 z-10" />
          <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-parts-pass-blue px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <a href="/" className="-m-1.5 p-1.5">
                <span className="sr-only">Parts Pass</span>
                <Image
                  className="h-8 w-auto"
                  src={partsPassHeader}
                  alt="parts pass logo"
                />
              </a>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => {
                    if (item.href === "/cart") {
                      return (
                        <button
                          key={item.name}
                          type="button"
                          className={`${getMobileClassName(item.href)} w-full text-left`}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            openCart();
                          }}
                        >
                          {item.name}
                        </button>
                      );
                    }
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className={getMobileClassName(item.href)}
                      >
                        {item.name}
                      </a>
                    );
                  })}
                  {user?.isAnonymous && (
                    <Link className={mobileLoginLinkClass} href="/login">
                      Login
                    </Link>
                  )}
                  {!user?.isAnonymous && (
                    <Link className={mobileAccountLinkClass} href="/account">
                      Account
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
        <AddToCartModal open={isSideCartOpen} toggleModal={setIsSideCartOpen} />
      </header>
    </>
  );
}
