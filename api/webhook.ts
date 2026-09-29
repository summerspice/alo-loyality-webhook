import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { total_price, customer } = req.body;

    if (!customer || !customer.id) {
      return res.status(200).json({ message: 'Guest order, no points credited' });
    }

    const pointsEarned = Math.floor(parseFloat(total_price || '0'));
    const customerId = customer.id;

    const shopifyStore = process.env.SHOPIFY_STORE_DOMAIN; // e.g. your-dev-store.myshopify.com
    const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN; // shpat_...

    // Call Shopify Admin API to update customer points metafield
    const apiUrl = `https://${shopifyStore}/admin/api/2026-07/customers/${customerId}/metafields.json`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metafield: {
          namespace: 'custom',
          key: 'alo_access_points',
          value: String(pointsEarned),
          type: 'integer',
        },
      }),
    });

    const data = await response.json();
    return res.status(200).json({ success: true, pointsEarned, data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}