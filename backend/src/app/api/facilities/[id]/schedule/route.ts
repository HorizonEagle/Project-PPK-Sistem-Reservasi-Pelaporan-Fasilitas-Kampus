import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
export { OPTIONS } from '../../../../../../lib/cors';

// ─── Slot Constants ───────────────────────────────────────────────────────────

const OPERATING_START_HOUR = 7;   // 07:00
const OPERATING_END_HOUR = 20;    // 20:00
const SLOT_DURATION_MINUTES = 30;
const TOTAL_SLOTS = ((OPERATING_END_HOUR - OPERATING_START_HOUR) * 60) / SLOT_DURATION_MINUTES; // 26

/**
 * Menghasilkan array 26 slot default untuk satu hari
 */
function generateSlots(): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];

  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const totalMinutesStart = OPERATING_START_HOUR * 60 + i * SLOT_DURATION_MINUTES;
    const totalMinutesEnd = totalMinutesStart + SLOT_DURATION_MINUTES;

    const startH = String(Math.floor(totalMinutesStart / 60)).padStart(2, '0');
    const startM = String(totalMinutesStart % 60).padStart(2, '0');
    const endH = String(Math.floor(totalMinutesEnd / 60)).padStart(2, '0');
    const endM = String(totalMinutesEnd % 60).padStart(2, '0');

    slots.push({
      startTime: `${startH}:${startM}`,
      endTime: `${endH}:${endM}`,
    });
  }

  return slots;
}

/**
 * Parse time string "HH:mm" to total minutes from midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Parse a Prisma Time field (stored as Date) to "HH:mm" string
 */
function prismaTimeToHHMM(date: Date): string {
  // Prisma @db.Time() returns a Date where time part is the time value
  const h = String(date.getUTCHours()).padStart(2, '0');
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ─── GET /api/facilities/:id/schedule?date=YYYY-MM-DD ─────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const dateStr = searchParams.get('date');

    // Validasi parameter tanggal
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { error: 'Parameter "date" diperlukan dengan format YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const queryDate = new Date(dateStr + 'T00:00:00.000Z');
    if (isNaN(queryDate.getTime())) {
      return NextResponse.json(
        { error: 'Tanggal tidak valid' },
        { status: 400 }
      );
    }

    // Cek fasilitas ada
    const facility = await prisma.facility.findUnique({ where: { id } });
    if (!facility) {
      return NextResponse.json(
        { error: 'Fasilitas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Jika fasilitas under_maintenance, semua slot = maintenance
    if (facility.status === 'under_maintenance') {
      const slots = generateSlots().map((slot) => ({
        ...slot,
        status: 'maintenance' as const,
      }));
      return NextResponse.json({ data: slots });
    }

    // Jika fasilitas inactive, kembalikan semua slot unavailable
    if (facility.status === 'inactive') {
      const slots = generateSlots().map((slot) => ({
        ...slot,
        status: 'maintenance' as const,
      }));
      return NextResponse.json({ data: slots });
    }

    // Ambil reservasi yang sudah approved untuk fasilitas ini pada tanggal tersebut
    const reservations = await prisma.reservation.findMany({
      where: {
        facilityId: id,
        date: queryDate,
        status: 'approved',
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Generate slots dan cek availability
    const slots = generateSlots().map((slot) => {
      const slotStart = parseTimeToMinutes(slot.startTime);
      const slotEnd = parseTimeToMinutes(slot.endTime);

      // Cek apakah ada reservasi approved yang overlap dengan slot ini
      const isBooked = reservations.some((res) => {
        const resStart = parseTimeToMinutes(prismaTimeToHHMM(res.startTime));
        const resEnd = parseTimeToMinutes(prismaTimeToHHMM(res.endTime));
        // Overlap: resStart < slotEnd AND resEnd > slotStart
        return resStart < slotEnd && resEnd > slotStart;
      });

      return {
        ...slot,
        status: isBooked ? ('booked' as const) : ('available' as const),
      };
    });

    return NextResponse.json({ data: slots });
  } catch (error) {
    console.error('GET /api/facilities/:id/schedule error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil jadwal fasilitas' },
      { status: 500 }
    );
  }
}
