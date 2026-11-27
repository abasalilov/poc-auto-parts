import Image from "next/image";
import appStoreBtn from "../../public/app-store.svg";
import googlePlayBtn from "../../public/google-play-badge.png";

import { sendToAppStore } from "@/actions";

interface DownLoadButtonsProps {
  col: boolean;
}

export default function DownLoadButtons({ col }: DownLoadButtonsProps) {
  const cn = col ? "flex flex-col" : "flex flex-row w-full";
  return (
    <div className={cn}>
      <div>
        <button
          onClick={() =>
            sendToAppStore(
              "https://apps.apple.com/us/app/parts-pass-auto-parts/id1633923133"
            )
          }
        >
          <Image
            style={{ width: 160, height: 80 }}
            title="app link"
            src={appStoreBtn}
            alt="app store link"
          />
        </button>
      </div>
      <div>
        <button
          onClick={() =>
            sendToAppStore(
              "https://play.google.com/store/apps/details?id=com.partspass&hl=en_US&gl=US"
            )
          }
        >
          <Image
            style={{ width: 200, height: 80 }}
            title="app link"
            src={googlePlayBtn}
            alt="google play link"
          />
        </button>
      </div>
    </div>
  );
}
