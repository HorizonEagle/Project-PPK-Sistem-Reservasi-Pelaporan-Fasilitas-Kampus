import { prisma } from './prisma';

// ─── Constants ────────────────────────────────────────────────────────────────

const OPERATING_START = 7 * 60;   // 07:00 = 420 menit
const OPERATING_END = 20 * 60;    // 20:00 = 1200 menit
const SLOT_DURATION = 30;         // 30 menit per slot

// ─── Time Parsing Helpers ─────────────────────────────────────────────────────

/**
 * Parse string "HH:mm" ke total menit dari midnight
 * Contoh: "09:00" → 540, "10:30" → 630
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Parse string "HH:mm" ke Date object (tanggal 1970-01-01 UTC) untuk Prisma @db.Time()
 */
export function parseTimeToDate(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0, 0));
}

/**
 * Parse Prisma Time field (stored as Date) ke "HH:mm" string
 */
export function prismaTimeToHHMM(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, '0');
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ─── Slot Validation ──────────────────────────────────────────────────────────

/**
 * Validasi waktu start dan end sesuai aturan slot kampus:
 * - Kelipatan 30 menit
 * - Dalam jam operasional 07:00-20:00
 * - start < end
 */
export function validateSlotTime(
  startTime: string,
  endTime: string
): { valid: boolean; error?: string } {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  if (isNaN(start) || isNaN(end)) {
    return { valid: false, error: 'Format waktu tidak valid' };
  }

  if (start < OPERATING_START || end > OPERATING_END) {
    return {
      valid: false,
      error: 'Waktu di luar jam operasional (07:00-20:00)',
    };
  }

  if (start >= end) {
    return { valid: false, error: 'Waktu mulai harus sebelum waktu selesai' };
  }

  if (start % SLOT_DURATION !== 0 || end % SLOT_DURATION !== 0) {
    return { valid: false, error: 'Waktu harus kelipatan 30 menit' };
  }

  return { valid: true };
}

/**
 * Validasi bahwa tanggal reservasi >= hari ini (WIB, UTC+7)
 */
export function validateReservationDate(dateStr: string): {
  valid: boolean;
  error?: string;
} {
  const reservationDate = new Date(dateStr + 'T00:00:00+07:00');
  if (isNaN(reservationDate.getTime())) {
    return { valid: false, error: 'Tanggal tidak valid' };
  }

  // Hari ini di WIB
  const now = new Date();
  const todayWIB = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  );
  todayWIB.setHours(0, 0, 0, 0);

  const resDateOnly = new Date(dateStr + 'T00:00:00');
  resDateOnly.setHours(0, 0, 0, 0);

  if (resDateOnly < todayWIB) {
    return {
      valid: false,
      error: 'Tanggal reservasi tidak boleh di masa lampau',
    };
  }

  return { valid: true };
}

// ─── Conflict Check ───────────────────────────────────────────────────────────

/**
 * Cek apakah ada reservasi berstatus "approved" yang overlap
 * di fasilitas + tanggal + slot waktu yang sama.
 *
 * @param facilityId - ID fasilitas
 * @param date - Tanggal reservasi (Date object, UTC midnight)
 * @param startTime - Waktu mulai "HH:mm"
 * @param endTime - Waktu selesai "HH:mm"
 * @param excludeId - (opsional) ID reservasi yang di-exclude (untuk update)
 * @returns true jika ada conflict
 */
export async function checkConflict(
  facilityId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<boolean> {
  const startTimeDate = parseTimeToDate(startTime);
  const endTimeDate = parseTimeToDate(endTime);

  const conflicts = await prisma.reservation.findMany({
    where: {
      facilityId,
      date,
      status: 'approved',
      id: excludeId ? { not: excludeId } : undefined,
      // Overlap condition: existing.start < new.end AND existing.end > new.start
      startTime: { lt: endTimeDate },
      endTime: { gt: startTimeDate },
    },
  });

  return conflicts.length > 0;
}
