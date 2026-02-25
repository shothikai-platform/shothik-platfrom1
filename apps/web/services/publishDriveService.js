const PUBLISHDRIVE_ENABLED = process.env.NEXT_PUBLIC_PUBLISHDRIVE_ENABLED === "true";
const PUBLISHDRIVE_API_URL = process.env.NEXT_PUBLIC_PUBLISHDRIVE_API_URL || "https://api.publishdrive.com/v1";

const DISTRIBUTION_CHANNELS = [
  { id: "google_play", name: "Google Play Books", icon: "google", region: "Global", category: "ebook" },
  { id: "amazon_kindle", name: "Amazon Kindle", icon: "amazon", region: "Global", category: "ebook" },
  { id: "apple_books", name: "Apple Books", icon: "apple", region: "Global", category: "ebook" },
  { id: "kobo", name: "Kobo", icon: "kobo", region: "Global", category: "ebook" },
  { id: "barnes_noble", name: "Barnes & Noble Nook", icon: "bn", region: "US", category: "ebook" },
  { id: "scribd", name: "Scribd", icon: "scribd", region: "Global", category: "subscription" },
  { id: "overdrive", name: "OverDrive Libraries", icon: "overdrive", region: "Global (109 countries)", category: "library" },
  { id: "bibliotheca", name: "Bibliotheca CloudLibrary", icon: "library", region: "Global", category: "library" },
  { id: "tolino", name: "Tolino", icon: "tolino", region: "Germany/EU", category: "ebook" },
  { id: "vivlio", name: "Vivlio", icon: "vivlio", region: "France/EU", category: "ebook" },
  { id: "dangdang", name: "Dangdang", icon: "dangdang", region: "China", category: "ebook" },
  { id: "24symbols", name: "24symbols", icon: "24symbols", region: "Global", category: "subscription" },
];

export function getAvailableChannels() {
  return DISTRIBUTION_CHANNELS;
}

export function isPublishDriveEnabled() {
  return PUBLISHDRIVE_ENABLED;
}

export async function uploadBookToPublishDrive(bookData) {
  if (!PUBLISHDRIVE_ENABLED) {
    return {
      success: false,
      error: "PublishDrive integration is not enabled. Contact support to activate multi-store distribution.",
      channels: DISTRIBUTION_CHANNELS.map((ch) => ({
        ...ch,
        status: "pending",
        message: "Awaiting PublishDrive activation",
      })),
    };
  }

  try {
    const response = await fetch(`${PUBLISHDRIVE_API_URL}/books`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PUBLISHDRIVE_API_KEY}`,
      },
      body: JSON.stringify({
        title: bookData.title,
        subtitle: bookData.subtitle,
        description: bookData.description,
        language: bookData.language,
        isbn: bookData.isbn,
        category: bookData.category,
        keywords: bookData.keywords,
        price: {
          amount: bookData.listPrice,
          currency: bookData.currency,
        },
        channels: bookData.selectedChannels || DISTRIBUTION_CHANNELS.map((ch) => ch.id),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to upload to PublishDrive" };
    }

    const result = await response.json();
    return {
      success: true,
      publishDriveBookId: result.id,
      channels: result.channels || [],
    };
  } catch (error) {
    return { success: false, error: error.message || "PublishDrive API connection failed" };
  }
}

export async function getDistributionStatus(publishDriveBookId) {
  if (!PUBLISHDRIVE_ENABLED) {
    return {
      success: false,
      error: "PublishDrive integration is not enabled",
      channels: [],
    };
  }

  try {
    const response = await fetch(`${PUBLISHDRIVE_API_URL}/books/${publishDriveBookId}/distribution`, {
      headers: {
        Authorization: `Bearer ${process.env.PUBLISHDRIVE_API_KEY}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch distribution status" };
    }

    const result = await response.json();
    return { success: true, channels: result.channels || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getSalesData(publishDriveBookId, period) {
  if (!PUBLISHDRIVE_ENABLED) {
    return { success: false, error: "PublishDrive integration is not enabled", sales: [] };
  }

  try {
    const response = await fetch(
      `${PUBLISHDRIVE_API_URL}/books/${publishDriveBookId}/sales?period=${period}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PUBLISHDRIVE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: "Failed to fetch sales data" };
    }

    const result = await response.json();
    return { success: true, sales: result.sales || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
