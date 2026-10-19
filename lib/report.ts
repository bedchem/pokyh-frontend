'use client';

// Reporting content (Digital Services Act Art. 16): an e-mail to POKYH's
// contact point (GET /api/legal/contact), prepared with what a notice needs:
// where the content is and what it says, room for the reasons and for the
// reporter's name and address, and the good-faith statement. Nothing is sent
// on its own; the reporter's mail program opens with the draft.

let contact: Promise<string> | null = null;

/** The contact address, fetched once (and again after a failure). */
export function reportAddress(): Promise<string> {
  contact ??= fetch('/api/legal/contact')
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('contact unavailable'))))
    .then((data: { email?: unknown }) => {
      if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+$/.test(data.email)) throw new Error('contact unavailable');
      return data.email;
    })
    .catch((err: unknown) => {
      contact = null;
      throw err;
    });
  return contact;
}

/** Opens the reporter's mail program with the prepared notice; false when the address could not be read. */
export async function openReport(subject: string, body: string): Promise<boolean> {
  try {
    const to = await reportAddress();
    window.location.assign(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    return true;
  } catch {
    return false;
  }
}
