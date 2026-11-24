"use client";
import {
  ChangeEvent,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useFirestore } from "reactfire";
import {
  getAuth,
  updateEmail,
  updateProfile,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import Input from "@mui/joy/Input";
import CircularProgress from "@mui/joy/CircularProgress";
import PersonOutline from "@mui/icons-material/PersonOutline";
import LockOutlined from "@mui/icons-material/LockOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";

import { UserContext } from "@/context/UserContext";

import Header from "@/components/header";
import Footer from "@/components/footer";
import ReAuthModal from "@/components/reauthModal";
import { USERS, VEHICLES } from "@/lib/constants";
import { useUserVehicles } from "@/context/UserVehiclesContext";
import { useMobile } from "@/context/MobileContext";

const ICON_BOX =
  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg";

/** “2008 DODGE MAGNUM” → “2008 Dodge Magnum” for display */
function formatVehicleLine(vh: {
  year?: { make?: unknown; label?: string };
  make?: string;
  model?: string;
}): string {
  const rawYear = vh.year?.make ? vh.year.label : vh.year;
  const year = rawYear != null ? String(rawYear).trim() : "";
  const make = toTitleWords(String(vh.make || ""));
  const model = toTitleWords(String(vh.model || ""));
  return [year, make, model].filter(Boolean).join(" ");
}

function toTitleWords(s: string): string {
  if (!s.trim()) return "";
  return s
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part ? part.charAt(0).toUpperCase() + part.slice(1) : "",
        )
        .join("-"),
    )
    .join(" ");
}

function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-sm sm:p-6 ${className}`}
    >
      <div className="border-b border-slate-100/90 pb-3.5">
        <h2 className="font-mont text-base font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-xl text-xs leading-snug text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

export default function AccountPage() {
  const firestore = useFirestore();
  const auth = getAuth();
  const router = useRouter();
  const { vehicles, loadingVehicles } = useUserVehicles();
  const { isMobile } = useMobile();
  const { user } = useContext(UserContext);
  const { uid } = user;

  const [editEmail, setEditEmail] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  const [editName, setEditName] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [nameCopy, setNameCopy] = useState<string>("");
  const [reauthPassword, setReauthPassword] = useState<string>("");

  const [processing, setProcessing] = useState<boolean>(true);
  const [showReAuthModal, setShowReAuthModal] = useState<boolean>(false);
  /** Vehicle doc id awaiting delete confirmation */
  const [vehiclePendingRemoveId, setVehiclePendingRemoveId] = useState<
    string | null
  >(null);
  const [removingVehicle, setRemovingVehicle] = useState(false);

  const firstName = nameCopy?.trim()?.split(/\s+/)[0] || "";

  useEffect(() => {
    if (user && user.isAnonymous) {
      router.push("/login");
    }
  }, [user, router]);

  const getUserData = async () => {
    if (auth && auth.currentUser && auth.currentUser.uid) {
      const useRef = doc(firestore, USERS, auth.currentUser.uid);
      const userSnap = await getDoc(useRef);
      const userData = userSnap.data();
      if (userData) {
        setEmail(userData.email);
        setName(userData.name);
        setNameCopy(userData.name);
      }
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (auth && auth.currentUser && auth.currentUser.uid) {
      getUserData();
    }
  }, [auth.currentUser]);

  const handleChangeName = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleChangeEmail = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleChangeReauthPassword = (e: ChangeEvent<HTMLInputElement>) => {
    setReauthPassword(e.target.value);
  };

  const handleStartSaveEmailProcess = () => {
    setShowReAuthModal(true);
  };

  const handleStartDeleteAccountProcess = () => {
    setEditEmail(false);
    setShowReAuthModal(true);
  };

  const saveEmail = async () => {
    setShowReAuthModal(false);
    setProcessing(true);
    if (auth.currentUser) {
      try {
        auth.currentUser.reload();
        const credential = await EmailAuthProvider.credential(
          user.email,
          reauthPassword,
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updateEmail(auth.currentUser, email);
        const useRef = doc(firestore, USERS, uid);
        await updateDoc(useRef, {
          timestamp: new Date(),
          email: email,
        });
        setReauthPassword("");
        setProcessing(false);
        setEditEmail(false);
      } catch (error: any) {
        setProcessing(false);
        setEditEmail(false);
        console.log("error", error.code);
        if (error.code === "auth/requires-recent-login") {
          alert(
            "Authentication expired, please logout and sign back in to change your account email",
          );
        } else {
          alert(
            `We could not update your email address at this time: ${error.code}`,
          );
        }
      }
    }
  };

  const saveName = async () => {
    setProcessing(true);
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: name,
        });
        const useRef = doc(firestore, USERS, uid);
        await updateDoc(useRef, {
          timestamp: new Date(),
          name: name,
        });
        await getUserData();
        setProcessing(false);
        setEditName(false);
      } catch (error: any) {
        alert(`We could not update your name at this time: ${error.code}`);
        setProcessing(false);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      alert("error occured in sign out");
    }
  };

  const toggleReauthModal = (x: boolean) => {
    setShowReAuthModal(x);
  };

  const deleteAccount = async () => {
    setShowReAuthModal(false);
    setProcessing(true);
    if (auth.currentUser) {
      try {
        auth.currentUser.reload();
        const credential = await EmailAuthProvider.credential(
          user.email,
          reauthPassword,
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        await auth.currentUser.delete();
        setProcessing(false);
      } catch (error: any) {
        setProcessing(false);
        alert(`We could not delete your account at this time: ${error.code}`);
      }
    }
  };

  const confirmRemoveVehicle = async (vehicleId: string) => {
    setRemovingVehicle(true);
    try {
      await deleteDoc(doc(firestore, VEHICLES, vehicleId));
      setVehiclePendingRemoveId(null);
    } catch (e) {
      console.error(e);
      alert("We couldn’t remove that vehicle. Please try again.");
    } finally {
      setRemovingVehicle(false);
    }
  };

  const handleForgotPassword = async () => {
    await sendPasswordResetEmail(auth, user.email);
    alert(
      `If associated with an account, a reset password email will be sent to ${user.email}`,
    );
  };

  const btnPrimary =
    "font-mont inline-flex items-center justify-center rounded-md bg-parts-pass-blue px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-parts-pass-blue-light hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parts-pass-blue";
  const btnSecondary =
    "font-mont inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-parts-pass-dark-blue shadow-sm transition-all hover:border-parts-pass-blue/30 hover:bg-slate-50 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parts-pass-blue";
  /** Soft affordance for “Edit” (not plain link text) */
  const btnEdit =
    "font-mont rounded-md bg-slate-100/40 px-1.5 py-0.5 text-xs font-medium text-slate-600/90 transition-colors hover:bg-slate-100/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parts-pass-blue";
  /** Muted remove — stronger only on hover */
  const btnRemoveMuted =
    "font-mont rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:max-w-4xl lg:px-8">
        {showReAuthModal && (
          <ReAuthModal
            email={user.email}
            open={showReAuthModal}
            toggleModal={toggleReauthModal}
            onSubmit={editEmail ? saveEmail : deleteAccount}
            handleEnterPassword={handleChangeReauthPassword}
          />
        )}

        <header className="mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-parts-pass-blue">
            Your account
          </p>
          <h1 className="mt-1 font-mont text-2xl font-bold tracking-tight text-parts-pass-dark-blue sm:text-3xl">
            {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-snug text-slate-600">
            Manage your profile, vehicles, and account security.
          </p>
        </header>

        {processing ? (
          <div
            className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-slate-100 bg-white px-4 py-10 shadow-sm transition-shadow duration-200 hover:shadow-sm"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <CircularProgress size="lg" />
            <p className="mt-3 text-xs font-medium text-slate-600">
              Loading your account…
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Profile */}
            <SectionCard
              title="Profile"
              description="Your name and email appear on orders and receipts. Keep them current for support and shipping updates."
            >
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-2.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-parts-pass-blue/10 text-parts-pass-blue">
                      <PersonOutline sx={{ fontSize: 18 }} aria-hidden />
                    </span>
                    <div>
                      <p className="font-mont text-sm font-semibold text-slate-900">
                        Display name
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-slate-600">
                        How we&apos;ll greet you
                      </p>
                      {!editName ? (
                        <p className="mt-2 font-mont text-base text-slate-800">
                          {nameCopy || "—"}
                        </p>
                      ) : (
                        <Input
                          type="text"
                          className="font-mont mt-2 max-w-md"
                          name="name"
                          onChange={handleChangeName}
                          value={name}
                          slotProps={{
                            input: { "aria-label": "Display name" },
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {editName && !isMobile && (
                      <button type="button" onClick={saveName} className={btnPrimary}>
                        Save name
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditName(!editName)}
                      className={editName ? btnSecondary : btnEdit}
                    >
                      {editName ? "Cancel" : "Edit"}
                    </button>
                  </div>
                </div>
                {editName && isMobile && (
                  <button type="button" onClick={saveName} className={`${btnPrimary} w-full`}>
                    Save name
                  </button>
                )}

                <div className="border-t border-slate-100 pt-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-2.5">
                      <span className={`${ICON_BOX} bg-slate-100 text-slate-600`}>
                        <LockOutlined sx={{ fontSize: 20 }} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mont text-sm font-semibold text-slate-900">
                          Email address
                        </p>
                        <p className="mt-0.5 text-xs leading-snug text-slate-600">
                          Sign-in and order confirmations
                        </p>
                        {!editEmail ? (
                          <p className="mt-2 break-all font-mont text-base text-slate-800">
                            {email}
                          </p>
                        ) : (
                          <Input
                            className="font-mont mt-2 max-w-md"
                            disabled={!editEmail}
                            type="email"
                            name="email"
                            onChange={handleChangeEmail}
                            value={email}
                            slotProps={{
                              input: { "aria-label": "Email address" },
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {editEmail && !isMobile && (
                        <button
                          type="button"
                          onClick={handleStartSaveEmailProcess}
                          className={btnPrimary}
                        >
                          Save email
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditEmail(!editEmail)}
                        className={editEmail ? btnSecondary : btnEdit}
                      >
                        {editEmail ? "Cancel" : "Edit"}
                      </button>
                    </div>
                  </div>
                </div>
                {editEmail && isMobile && (
                  <button
                    type="button"
                    onClick={handleStartSaveEmailProcess}
                    className={`${btnPrimary} w-full`}
                  >
                    Save email
                  </button>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Saved vehicles"
              description="You can remove vehicles at any time. We'll ask for confirmation."
            >
              {loadingVehicles ? (
                <div className="flex justify-center py-5" role="status" aria-busy="true">
                  <CircularProgress size="md" />
                </div>
              ) : vehicles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-5 text-center">
                  <p className="font-mont text-sm font-medium text-slate-700">
                    No saved vehicles yet
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Vehicles you pick while searching are saved here.
                  </p>
                  <Link href="/" className={`${btnPrimary} mt-3 inline-flex text-xs`}>
                    Find parts
                  </Link>
                </div>
              ) : (
                <ul className="border-t border-[#eeeeee]" role="list">
                  {vehicles.map((vh: any) => {
                    const label = formatVehicleLine(vh);
                    const pending = vehiclePendingRemoveId === vh.id;
                    return (
                      <li
                        key={vh.id}
                        className="border-b border-[#eeeeee] transition-colors duration-150 last:border-b-0 hover:bg-gray-50"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 px-1 py-3.5 sm:py-4">
                          <span className="font-mont text-sm font-medium text-slate-800">
                            {label}
                          </span>
                          {!pending && (
                            <button
                              type="button"
                              onClick={() => setVehiclePendingRemoveId(vh.id)}
                              className={btnRemoveMuted}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {pending && (
                          <div
                            className="mt-2 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2.5"
                            role="region"
                            aria-label="Confirm vehicle removal"
                          >
                            <p className="text-xs font-medium text-red-900">
                              Remove this vehicle from your account?
                            </p>
                            <p className="mt-0.5 text-[11px] text-red-800/90">
                              {label}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={removingVehicle}
                                onClick={() => setVehiclePendingRemoveId(null)}
                                className={btnSecondary}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={removingVehicle}
                                onClick={() => confirmRemoveVehicle(vh.id)}
                                className="font-mont inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-800 shadow-sm hover:bg-red-50 disabled:opacity-50"
                              >
                                {removingVehicle ? "Removing…" : "Yes, remove"}
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>

            {/* Security */}
            <SectionCard
              title="Security"
              description="Reset your password if you’ve forgotten it. You’ll receive an email with next steps."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2.5">
                  <span className={`${ICON_BOX} bg-slate-100 text-slate-600`}>
                    <ShieldOutlined sx={{ fontSize: 20 }} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mont text-sm font-semibold text-slate-900">
                      Password
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-600">
                      We&apos;ll email you a link to choose a new password.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className={btnSecondary}
                  >
                    Send password reset email
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* Session */}
            <SectionCard
              title="Session"
              description="Sign out on this device. You can sign back in anytime."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2.5">
                  <span className={`${ICON_BOX} bg-slate-100 text-slate-600`}>
                    <LogoutOutlined sx={{ fontSize: 20 }} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mont text-sm font-semibold text-slate-900">
                      Sign out
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-600">
                      Ends your session on this browser only.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={btnSecondary}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* Danger zone — calmer tone, more space above */}
            <div className="pt-12 sm:pt-14">
              <section className="rounded-xl border border-rose-200/60 bg-rose-50/25 px-3 py-2.5 sm:px-4 sm:py-3">
                <h2 className="font-mont text-base font-bold text-red-950/90">
                  Delete account
                </h2>
                <p className="mt-1 max-w-2xl text-xs leading-snug text-red-900/75">
                  Permanently remove your PartsPass account. This cannot be undone.
                  You may be asked to confirm your password.
                </p>
                <p className="mt-1.5 font-mont text-[11px] text-red-800/65">
                  Signed in as <span className="font-medium">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={handleStartDeleteAccountProcess}
                  className="font-mont mt-2.5 inline-flex rounded-md border border-rose-300/70 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-800/90 shadow-sm transition-colors hover:border-rose-400 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                >
                  Delete my account
                </button>
              </section>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
