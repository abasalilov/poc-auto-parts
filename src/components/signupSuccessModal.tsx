import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import Modal from "@mui/joy/Modal";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";

import { useMobile } from "@/context/MobileContext";

interface SignUpSuccessModalProps {
  open: boolean;
  toggleModal: (x: boolean) => void;
}

export default function SignUpSuccessModal({ open, toggleModal }: SignUpSuccessModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { isMobile } = useMobile();

  const fontWeight = isMobile ? "lg" : "sm";
  const modalHeight = isMobile ? 360 : 300;
  return (
    <Modal
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      open={open}
      onClose={() => toggleModal(false)}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Sheet
        variant="outlined"
        sx={{
          maxWidth: 700,
          borderRadius: "md",
          p: 3,
          boxShadow: "lg",
          height: modalHeight,
        }}
      >
        <div className="flex flex-col grow h-full">
          <div className="flex flex-row items-center h-12">
            <CheckCircleOutline className="color-parts-pass-green mr-1" style={{ color: "#85dd85" }} />
            <Typography component="h2" id="modal-title" level="h4" textColor="inherit" fontWeight={fontWeight}>
              Sign up successful!
            </Typography>
          </div>
          <div className="flex flex-row items-center justify-between m-1 mt-4 h-12">
            <Typography component="h2" id="modal-title" level="h4" textColor="inherit" fontWeight={fontWeight}>
              Redirecting you to Stripe to checkout now
            </Typography>
          </div>
        </div>
      </Sheet>
    </Modal>
  );
}
