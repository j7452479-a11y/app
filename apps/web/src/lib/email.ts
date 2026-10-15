type OrderReceipt = {
  to: string;
  storeName: string;
  orderNumber: number;
  totalPaise: number;
  paymentMethod: "cod" | "razorpay";
  storeUrl?: string;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

export async function sendOrderReceipt(receipt: OrderReceipt) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from)
    return { sent: false, reason: "email provider is not configured" };

  const money = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(receipt.totalPaise / 100);
  const storeName = escapeHtml(receipt.storeName);
  const orderNumber = escapeHtml(String(receipt.orderNumber));
  const payment =
    receipt.paymentMethod === "cod" ? "Cash on delivery" : "Paid online";
  const orderUrl = receipt.storeUrl || "";
  const html = `<main style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17373a"><p style="color:#126a73;font-weight:700">${storeName}</p><h1 style="font-size:26px">Your order is confirmed</h1><p>Order #${orderNumber} has been received by the shop.</p><p><b>Total:</b> ${escapeHtml(money)}<br/><b>Payment:</b> ${payment}</p>${orderUrl ? `<p><a href="${escapeHtml(orderUrl)}" style="color:#126a73">Visit the shop</a></p>` : ""}<p style="color:#54686a;font-size:13px">Keep this email for your records. Contact the shop through your order conversation if you need help.</p></main>`;
  const text = `Your order #${receipt.orderNumber} at ${receipt.storeName} is confirmed. Total: ${money}. Payment: ${payment}.`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [receipt.to],
        subject: `Order #${receipt.orderNumber} confirmed · ${receipt.storeName}`,
        html,
        text,
      }),
      cache: "no-store",
    });
    if (!response.ok)
      return { sent: false, reason: "email provider rejected the receipt" };
    return { sent: true };
  } catch {
    return { sent: false, reason: "email provider is unreachable" };
  }
}
