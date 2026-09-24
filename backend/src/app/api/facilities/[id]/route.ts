import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { updateFacilitySchema } from '../../../../../lib/validators/facility';

// ─── GET /api/facilities/:id — Detail fasilitas (publik) ─────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const facility = await prisma.facility.findUnique({
      where: { id },
    });

    if (!facility) {
      return NextResponse.json(
        { error: 'Fasilitas tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: facility });
  } catch (error) {
    console.error('GET /api/facilities/:id error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil detail fasilitas' },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/facilities/:id — Edit fasilitas (Admin) / Ubah status (Admin/Officer) ─

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Cek role dari header (inject oleh middleware)
    const userRole = request.headers.get('x-user-role');

    if (!userRole || (userRole !== 'admin' && userRole !== 'officer')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin dan petugas yang bisa mengubah fasilitas.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validasi input
    const parsed = updateFacilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validasi gagal',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Cek fasilitas ada
    const existing = await prisma.facility.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Fasilitas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Officer hanya bisa mengubah status (ke under_maintenance atau active)
    if (userRole === 'officer') {
      if (!parsed.data.status) {
        return NextResponse.json(
          { error: 'Petugas hanya bisa mengubah status fasilitas.' },
          { status: 403 }
        );
      }

      // Officer hanya boleh set ke under_maintenance atau mengembalikan ke active
      const allowedStatusTransitions = ['under_maintenance', 'active'];
      if (!allowedStatusTransitions.includes(parsed.data.status)) {
        return NextResponse.json(
          { error: 'Petugas hanya bisa mengubah status ke "under_maintenance" atau "active".' },
          { status: 403 }
        );
      }

      // Hanya update status, abaikan field lain
      const updated = await prisma.facility.update({
        where: { id },
        data: { status: parsed.data.status },
      });

      return NextResponse.json({
        data: updated,
        message: `Status fasilitas berhasil diubah ke ${parsed.data.status}`,
      });
    }

    // Admin bisa update semua field
    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
    if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
    if (parsed.data.capacity !== undefined) updateData.capacity = parsed.data.capacity;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data yang diubah' },
        { status: 400 }
      );
    }

    const updated = await prisma.facility.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: updated,
      message: 'Fasilitas berhasil diperbarui',
    });
  } catch (error) {
    console.error('PATCH /api/facilities/:id error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui fasilitas' },
      { status: 500 }
    );
  }
}
