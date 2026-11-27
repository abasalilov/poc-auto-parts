"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/joy/CircularProgress";

import { useOrders } from "@/context/OrdersContext";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { getStripeSessionId } from "@/actions";
import OrderContainer from "@/components/orderContainer";

export default function OrdersPage() {
  const router = useRouter();
  const { orders } = useOrders();

  const [processing, setProcessing] = useState<boolean>(true);

  useEffect(() => {
    if (orders.length > 0) {
      setProcessing(false);
    }
  }, [orders]);

  const handleSelectOrder = async (pI: any) => {
    setProcessing(true);
    const sessionId = await getStripeSessionId(pI);
    if (sessionId) {
      router.push(`/orders/${sessionId}`);
    } else {
      alert(
        "We're sorry, but there is no more information for this transaction, please reach out to customer support if you need more information",
      );
      router.push(`/orders`);
      setProcessing(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="bg-white">
        <div className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl sm:px-2 lg:px-8">
            <div className="mx-auto max-w-2xl px-4 lg:max-w-4xl lg:px-0">
              <h1 className="font-mont text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Order history
              </h1>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="sr-only">Recent orders</h2>
            <div className="mx-auto max-w-7xl sm:px-2 lg:px-8">
              <div className="mx-auto max-w-2xl space-y-8 sm:px-4 lg:max-w-4xl lg:px-0">
                {processing && (
                  <div className="flex justify-center items-center h-20">
                    <CircularProgress size="lg" />
                  </div>
                )}
                {!processing &&
                  orders.map((order) => {
                    return (
                      <OrderContainer
                        key={Math.random()}
                        order={order}
                        onSelectOrder={handleSelectOrder}
                      />
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
