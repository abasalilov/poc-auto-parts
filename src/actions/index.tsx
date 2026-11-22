"use server";
import axios from "axios";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getBaseUrl } from "@/lib/helpers";

export interface Voucher {
  author: string;
  code: string;
  amount: number;
}

export async function sendToAppStore(url: string) {
  revalidatePath(url); // Update cached posts
  redirect(url); // Navigate to the new post page
}

export async function getStripeSessionId(paymentIntent: string) {
  try {
    const url = `${getBaseUrl()}/getStripeSessionId`;
    const data = {
      paymentIntent: paymentIntent,
    };
    const config = {
      method: "post",
      url,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(data),
    };
    const response = await axios(config);
    return response.data.session.data[0].id;
  } catch (error) {
    console.log("getStripeSessionId error", error);
  }
}

